import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { openProjectorWindow } from './utils/projectorWindow';
import { Sermon, Paragraphe, ProjectedData, ProjectionStyle, ProjectionScreenConfig, ThemePreset, ActiveModule } from './types';
import { TopBar } from './components/TopBar';
import { Sidebar } from './components/Sidebar';
import { MainViewport } from './components/MainViewport';
import { LiveMonitorBar } from './components/LiveMonitorBar';
import { LyricsModule } from './components/LyricsModule';
import { BibleModule } from './components/BibleModule';
import { StudioModal } from './components/StudioModal';
import { ImportPdfModal } from './components/ImportPdfModal';
import { GoogleDriveModal } from './components/GoogleDriveModal';
import { EditSermonModal } from './components/EditSermonModal';
import { ReplaceModal } from './components/ReplaceModal';
import { AddParagraphModal } from './components/AddParagraphModal';
import { DatabaseModal } from './components/DatabaseModal';
import { DataDirSettingsModal } from './components/DataDirSettingsModal';
import { ProjectionView } from './components/ProjectionView';
import { ProjectionStyleModal } from './components/ProjectionStyleModal';
import { NetworkShareModal } from './components/NetworkShareModal';
import { HelpModal } from './components/HelpModal';
import { getBlocksFromText } from './utils/textUtils';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export default function App() {
  // Standalone Projection View & Mobile Remote routing for standard URLs
  if (typeof window !== 'undefined') {
    const p = window.location.pathname.toLowerCase();
    const searchParams = new URLSearchParams(window.location.search);
    const modeParam = searchParams.get('mode') || searchParams.get('view');

    // 1. Standalone Projection Screen View
    if (
      p === '/projection' || 
      p.startsWith('/projection/') || 
      p === '/1' || p === '/2' || 
      p === '/live' || p === '/stage' || 
      p === '/audience' || p === '/a' || p === '/s'
    ) {
      return <ProjectionView />;
    }
  }

  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeModule, setActiveModule] = useState<ActiveModule>('brochures');

  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [selectedSermonId, setSelectedSermonId] = useState('');
  const [selectedSermon, setSelectedSermon] = useState<Sermon | null>(null);
  const [paragraphes, setParagraphes] = useState<Paragraphe[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ sermons: Sermon[]; paragraphes: Paragraphe[] } | null>(null);

  const [projectedState, setProjectedState] = useState<ProjectedData | null>(null);

  // Multi-Screen & Multi-Theme Projection States
  const [screens, setScreens] = useState<ProjectionScreenConfig[]>([]);
  const [themes, setThemes] = useState<ThemePreset[]>([]);
  const [selectedScreenId, setSelectedScreenId] = useState<string>('audience');

  const [projectionStyle, setProjectionStyle] = useState<ProjectionStyle>({
    mode: 'FULLSCREEN',
    theme: 'dark',
    align: 'center'
  });

  // Modal Visibility States
  const [showStudio, setShowStudio] = useState(false);
  const [showImportPdf, setShowImportPdf] = useState(false);
  const [showGoogleDrive, setShowGoogleDrive] = useState(false);
  const [showDatabase, setShowDatabase] = useState(false);
  const [showDataDirSettings, setShowDataDirSettings] = useState(false);
  const [showEditSermon, setShowEditSermon] = useState(false);
  const [showReplace, setShowReplace] = useState(false);
  const [showAddPara, setShowAddPara] = useState(false);
  const [showProjectionStyleModal, setShowProjectionStyleModal] = useState(false);
  const [showNetworkShare, setShowNetworkShare] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showMobileRemote, setShowMobileRemote] = useState(false);
  const [sermonToDelete, setSermonToDelete] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const isTransitioningRef = useRef<boolean>(false);
  const transitionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Socket.IO connection
  useEffect(() => {
    const s = io();
    setSocket(s);

    s.on('connect', () => setIsConnected(true));
    s.on('disconnect', () => setIsConnected(false));

    s.on('afficher-paragraphe', (data: ProjectedData) => {
      setProjectedState((current) => {
        // If currently in an exit transition, ignore premature clearing socket events to ensure EXITING animation completes
        if (isTransitioningRef.current || (current && current.animPhase === 'EXITING')) {
          const isClearingEvent = !data || data.sermonId === 'BLACK' || data.animPhase === 'OUT' || !data.texte;
          if (isClearingEvent) {
            return current;
          }
          // If a new active projection arrives, interrupt transition
          isTransitioningRef.current = false;
          if (transitionTimerRef.current) {
            clearTimeout(transitionTimerRef.current);
            transitionTimerRef.current = null;
          }
        }
        return data;
      });
    });

    s.on('mise-a-jour-ecrans', (payload: any) => {
      if (Array.isArray(payload)) {
        setScreens(payload);
      } else if (payload && typeof payload === 'object') {
        if (Array.isArray(payload.ecrans)) setScreens(payload.ecrans);
        if (Array.isArray(payload.themes)) setThemes(payload.themes);
      }
    });

    s.on('appliquer-style-projection', (st: ProjectionStyle) => {
      if (st) setProjectionStyle((prev) => ({ ...prev, ...st }));
    });

    return () => {
      s.disconnect();
    };
  }, []);

  // Synchronize current style when active screen selection changes
  useEffect(() => {
    const current = screens.find((s) => s.id === selectedScreenId);
    if (current && current.style) {
      setProjectionStyle(current.style);
    }
  }, [selectedScreenId, screens]);

  // Fetch Sermons List
  const fetchSermons = async () => {
    try {
      const res = await fetch('/api/sermons');
      if (res.ok) {
        const data: Sermon[] = await res.json();
        setSermons(data);
        if (data.length > 0 && !selectedSermonId) {
          handleSelectSermon(data[0].id);
        }
      }
    } catch (err) {
      console.error("Error fetching sermons:", err);
    }
  };

  useEffect(() => {
    fetchSermons();
  }, []);

  // Fetch Paragraphs when selected sermon changes
  const fetchParagraphes = async (sermonId: string) => {
    if (!sermonId) {
      setParagraphes([]);
      setSelectedSermon(null);
      return;
    }
    try {
      const [resSermon, resParas] = await Promise.all([
        fetch(`/api/sermons/${encodeURIComponent(sermonId)}`),
        fetch(`/api/sermons/${encodeURIComponent(sermonId)}/paragraphes`)
      ]);

      if (resSermon.ok) {
        const sermonData: Sermon = await resSermon.json();
        setSelectedSermon(sermonData);
      }

      if (resParas.ok) {
        const paraData: Paragraphe[] = await resParas.json();
        setParagraphes(paraData);
      }
    } catch (err) {
      console.error("Error fetching paragraphs:", err);
    }
  };

  const handleSelectSermon = (id: string) => {
    setSelectedSermonId(id);
    setSearchQuery('');
    setSearchResults(null);
    fetchParagraphes(id);
  };

  // Search logic
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    if (!query.trim()) {
      setSearchResults(null);
      return;
    }

    searchDebounceRef.current = setTimeout(async () => {
      try {
        const url = selectedSermonId
          ? `/api/recherche?q=${encodeURIComponent(query)}&sermon_id=${encodeURIComponent(selectedSermonId)}`
          : `/api/recherche?q=${encodeURIComponent(query)}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
        }
      } catch (err) {
        console.error("Error during search:", err);
      }
    }, 250);
  };

  // Projection Controls
  const handleProject = (
    sermonId: string,
    num: number | string,
    texte: string,
    isExtrait: boolean | string = false,
    blockIndex: number | null = null,
    totalBlocks: number | null = null,
    titreOverride?: string,
    forcedAnimPhase?: 'ENTERING' | 'EXITING' | 'IN' | 'SLIDE' | 'OUT'
  ) => {
    let finalTitle = titreOverride;
    let finalIsExtrait = false;

    if (typeof isExtrait === 'string') {
      finalTitle = isExtrait;
      finalIsExtrait = false;
    } else {
      finalIsExtrait = !!isExtrait;
    }

    const activeMod: ActiveModule = sermonId === 'BIBLE' ? 'bible' : sermonId === 'LYRICS' ? 'lyrics' : activeModule;

    // Determine animation phase:
    // 'ENTERING' when user projects a new verse/topic or when screen was black/off.
    // 'SLIDE' when navigating between verses/paragraphs within the active projection.
    const isOffOrBlack =
      !projectedState ||
      projectedState.sermonId === 'BLACK' ||
      !projectedState.texte ||
      projectedState.animPhase === 'EXITING' ||
      projectedState.animPhase === 'OUT';

    let isDifferentTopic = false;
    if (projectedState && !isOffOrBlack) {
      if (sermonId === 'BIBLE') {
        isDifferentTopic = projectedState.sermonId !== 'BIBLE';
      } else if (sermonId === 'LYRICS') {
        isDifferentTopic = projectedState.sermonId !== 'LYRICS' || (finalTitle ? finalTitle !== projectedState.titre_francais : false);
      } else {
        isDifferentTopic = projectedState.sermonId !== sermonId;
      }
    }

    const animPhase: 'ENTERING' | 'EXITING' | 'IN' | 'SLIDE' | 'OUT' = forcedAnimPhase || (isOffOrBlack || isDifferentTopic ? 'ENTERING' : 'SLIDE');

    // Reset any pending exit transition
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
    isTransitioningRef.current = false;

    const payload: ProjectedData = {
      sermonId,
      numero: num,
      texte,
      estExtrait: finalIsExtrait,
      blockIndex,
      totalBlocks,
      titre_francais: finalTitle || selectedSermon?.titre_francais || (sermonId === 'BIBLE' ? 'SAINTE BIBLE' : sermonId === 'LYRICS' ? 'CANTIQUES' : 'SERMON'),
      type_structure: selectedSermon?.type_structure || 'PARAGRAPHE',
      module: activeMod,
      animPhase,
      timestamp: Date.now()
    };

    setProjectedState(payload);

    if (socket) {
      socket.emit('projeter-paragraphe', payload);
    }
  };

  const handleOutProjection = () => {
    if (!projectedState || projectedState.sermonId === 'BLACK' || !projectedState.texte) return;
    if (projectedState.animPhase === 'EXITING') return;

    // Mark transition in progress
    isTransitioningRef.current = true;

    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }

    const payload: ProjectedData = {
      ...projectedState,
      animPhase: 'EXITING',
      timestamp: Date.now()
    };

    setProjectedState(payload);

    if (socket) {
      socket.emit('projeter-paragraphe', payload);
    }

    const duration = projectionStyle.transitionDuration || 450;
    const totalWaitTime = duration + 150;

    // Use requestAnimationFrame to guarantee the DOM and CSS keyframes render and paint before resolving timer
    const waitExitAnimation = () => {
      return new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            transitionTimerRef.current = setTimeout(() => {
              resolve();
            }, totalWaitTime);
          });
        });
      });
    };

    waitExitAnimation().then(() => {
      setProjectedState((current) => {
        if (current && (current.timestamp === payload.timestamp || current.animPhase === 'EXITING')) {
          const cleared: ProjectedData = {
            sermonId: 'BLACK',
            numero: 0,
            texte: '',
            animPhase: 'OUT',
            timestamp: Date.now()
          };

          if (socket) {
            socket.emit('projeter-paragraphe', cleared);
          }

          isTransitioningRef.current = false;
          return cleared;
        }
        isTransitioningRef.current = false;
        return current;
      });
    });
  };

  const handleClearProjection = () => {
    if (projectedState && projectedState.sermonId !== 'BLACK' && projectedState.texte) {
      handleOutProjection();
    } else {
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = null;
      }
      isTransitioningRef.current = false;

      const payload: ProjectedData = {
        sermonId: 'BLACK',
        numero: '',
        texte: '',
        animPhase: 'OUT',
        timestamp: Date.now()
      };

      setProjectedState(payload);

      if (socket) {
        socket.emit('projeter-paragraphe', payload);
      }
    }
  };

  const handleChangeStyle = (newStyle: Partial<ProjectionStyle>) => {
    const updated = { ...projectionStyle, ...newStyle };
    setProjectionStyle(updated);
    if (socket) {
      socket.emit('changer-style-ecran', {
        screenId: selectedScreenId,
        styleData: updated
      });
    }
  };

  const handleAddScreen = (id: string, name: string, mode?: ProjectionStyle['mode'], outputType?: string, description?: string) => {
    if (socket) {
      socket.emit('ajouter-ecran', { id, name, mode, outputType, description });
    }
    setSelectedScreenId(id);
  };

  const handleDeleteScreen = (screenId: string) => {
    if (screenId === 'audience' || screenId === 'stage') return;
    if (socket) {
      socket.emit('supprimer-ecran', { screenId });
    }
    if (selectedScreenId === screenId) {
      setSelectedScreenId('audience');
    }
  };

  const handleUpdateScreensAndThemes = (updatedScreens: ProjectionScreenConfig[], updatedThemes: ThemePreset[]) => {
    setScreens(updatedScreens);
    setThemes(updatedThemes);
    if (socket) {
      socket.emit('update-screens-and-themes', {
        ecrans: updatedScreens,
        themes: updatedThemes
      });
    }
  };

  const handleScrollToParagraph = (num: number) => {
    const el = document.getElementById(`para-card-${num}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Refs for Module Navigation (Lyrics & Bible)
  const lyricsNavRef = useRef<{ handleNext: () => void; handlePrev: () => void } | null>(null);
  const bibleNavRef = useRef<{ handleNext: () => void; handlePrev: () => void } | null>(null);

  // Block & Paragraph Sequential Navigation
  const getFlatBlocks = () => {
    const list: {
      sermonId: string;
      num: number | string;
      texte: string;
      blockIndex: number;
      totalBlocks: number;
    }[] = [];

    paragraphes.forEach((p) => {
      const blocks = getBlocksFromText(p.texte);
      blocks.forEach((blk, idx) => {
        list.push({
          sermonId: p.sermon_id,
          num: p.numero_paragraphe,
          texte: blk,
          blockIndex: idx + 1,
          totalBlocks: blocks.length
        });
      });
    });

    return list;
  };

  const handleNextBlock = () => {
    if (activeModule === 'lyrics') {
      lyricsNavRef.current?.handleNext();
      return;
    }
    if (activeModule === 'bible') {
      bibleNavRef.current?.handleNext();
      return;
    }

    const flat = getFlatBlocks();
    if (flat.length === 0) return;

    if (!projectedState || projectedState.sermonId !== selectedSermonId) {
      const item = flat[0];
      handleProject(item.sermonId, item.num, item.texte, true, item.blockIndex, item.totalBlocks, undefined, 'ENTERING');
      handleScrollToParagraph(Number(item.num));
      return;
    }

    const currentIdx = flat.findIndex(
      (item) =>
        String(item.num) === String(projectedState.numero) &&
        (item.blockIndex === projectedState.blockIndex || item.texte === projectedState.texte)
    );

    const nextIdx = currentIdx >= 0 ? Math.min(flat.length - 1, currentIdx + 1) : 0;
    const item = flat[nextIdx];
    handleProject(item.sermonId, item.num, item.texte, true, item.blockIndex, item.totalBlocks, undefined, 'SLIDE');
    handleScrollToParagraph(Number(item.num));
  };

  const handlePrevBlock = () => {
    if (activeModule === 'lyrics') {
      lyricsNavRef.current?.handlePrev();
      return;
    }
    if (activeModule === 'bible') {
      bibleNavRef.current?.handlePrev();
      return;
    }

    const flat = getFlatBlocks();
    if (flat.length === 0) return;

    if (!projectedState || projectedState.sermonId !== selectedSermonId) {
      const item = flat[0];
      handleProject(item.sermonId, item.num, item.texte, true, item.blockIndex, item.totalBlocks, undefined, 'ENTERING');
      handleScrollToParagraph(Number(item.num));
      return;
    }

    const currentIdx = flat.findIndex(
      (item) =>
        String(item.num) === String(projectedState.numero) &&
        (item.blockIndex === projectedState.blockIndex || item.texte === projectedState.texte)
    );

    const prevIdx = currentIdx > 0 ? currentIdx - 1 : 0;
    const item = flat[prevIdx];
    handleProject(item.sermonId, item.num, item.texte, true, item.blockIndex, item.totalBlocks, undefined, 'SLIDE');
    handleScrollToParagraph(Number(item.num));
  };

  // Keyboard Shortcuts for Live Projection Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      ) {
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        handleNextBlock();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        handlePrevBlock();
      } else if (e.key === 'x' || e.key === 'X') {
        e.preventDefault();
        handleOutProjection();
      } else if (e.key === 'Escape' || e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        handleClearProjection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModule, paragraphes, projectedState, selectedSermonId]);

  const handleDeleteSermon = (sermonIdToDelete?: unknown) => {
    const rawId = typeof sermonIdToDelete === 'string' ? sermonIdToDelete : (selectedSermonId || '');
    const idToDelete = rawId.trim();
    if (!idToDelete) return;
    const targetSermon = sermons.find(s => s.id === idToDelete) || selectedSermon;
    const displayTitle = targetSermon?.titre_francais || idToDelete;

    setSermonToDelete({ id: idToDelete, title: displayTitle });
  };

  const confirmDeleteAction = async () => {
    if (!sermonToDelete) return;
    const idToDelete = sermonToDelete.id;
    setIsDeleting(true);

    try {
      const res = await fetch('/api/sermons/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: idToDelete })
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let data: any = {};
      try { data = await res.json(); } catch { /* empty */ }

      if (res.ok && data.success) {
        setSermonToDelete(null);
        setShowStudio(false);
        setShowEditSermon(false);
        if (selectedSermonId === idToDelete) {
          setSelectedSermonId('');
          setSelectedSermon(null);
          setParagraphes([]);
        }
        await fetchSermons();
      } else {
        alert("Erreur lors de la suppression : " + (data.error || "Impossible de supprimer la brochure."));
      }
    } catch (err) {
      console.error("Erreur suppression brochure:", err);
      alert("Erreur de connexion au serveur lors de la suppression.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="w-screen h-screen bg-[#0a0c10] text-[#f0f3f9] font-sans flex flex-col overflow-hidden select-none">
      <TopBar
        isConnected={isConnected}
        activeModule={activeModule}
        onSelectModule={setActiveModule}
        sermons={sermons}
        selectedSermonId={selectedSermonId}
        onSelectSermon={handleSelectSermon}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onOpenStudio={() => setShowStudio(true)}
        onOpenImportPdf={() => setShowImportPdf(true)}
        onOpenGoogleDrive={() => setShowGoogleDrive(true)}
        onOpenDatabase={() => setShowDatabase(true)}
        onOpenDataDirSettings={() => setShowDataDirSettings(true)}
        onOpenProjectionTab={(screenId) => openProjectorWindow(screenId || 'audience')}
        screens={screens}
        onOpenStyleModal={() => setShowProjectionStyleModal(true)}
        onOpenNetworkShare={() => setShowNetworkShare(true)}
        onOpenHelp={() => setShowHelpModal(true)}
      />

      <div className="flex-1 flex overflow-hidden relative">
        {activeModule === 'brochures' ? (
          <>
            <Sidebar
              sermon={selectedSermon}
              sermons={sermons}
              paragraphes={paragraphes}
              onScrollToParagraph={handleScrollToParagraph}
              onSelectSermon={handleSelectSermon}
              onProject={handleProject}
            />

            <MainViewport
              sermon={selectedSermon}
              paragraphes={paragraphes}
              searchResults={searchResults}
              searchQuery={searchQuery}
              projectedState={projectedState}
              onProject={handleProject}
              onSelectSermon={handleSelectSermon}
            />
          </>
        ) : activeModule === 'lyrics' ? (
          <LyricsModule
            onProject={(sId, num, txt, tOverride) => handleProject(sId, num, txt, true, null, null, tOverride)}
            projectedState={projectedState}
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            navRef={lyricsNavRef}
          />
        ) : (
          <BibleModule
            onProject={(sId, num, txt, tOverride) => handleProject(sId, num, txt, true, null, null, tOverride)}
            projectedState={projectedState}
            navRef={bibleNavRef}
          />
        )}
      </div>

      <LiveMonitorBar
        sermon={selectedSermon}
        paragraphesCount={paragraphes.length}
        projectedState={projectedState}
        projectionStyle={projectionStyle}
        onUpdateProjectionStyle={handleChangeStyle}
        onClearProjection={handleClearProjection}
        onOutProjection={handleOutProjection}
        onOpenStyleModal={() => setShowProjectionStyleModal(true)}
        onNextBlock={handleNextBlock}
        onPrevBlock={handlePrevBlock}
      />

      {/* Modals */}
      {showStudio && selectedSermon && (
        <StudioModal
          sermon={selectedSermon}
          onClose={() => {
            setShowStudio(false);
            fetchParagraphes(selectedSermonId);
          }}
          onProject={(sId, num, txt) => handleProject(sId, num, txt)}
          onDeleteSermon={() => handleDeleteSermon(selectedSermon.id)}
          onOpenEditSermon={() => setShowEditSermon(true)}
          onOpenReplaceModal={() => setShowReplace(true)}
          onOpenAddParaModal={() => setShowAddPara(true)}
        />
      )}

      {showImportPdf && (
        <ImportPdfModal
          onClose={() => setShowImportPdf(false)}
          onSuccess={(sermonId) => {
            fetchSermons();
            handleSelectSermon(sermonId);
          }}
        />
      )}

      {showGoogleDrive && (
        <GoogleDriveModal
          onClose={() => setShowGoogleDrive(false)}
          onImportSuccess={(sermonId) => {
            fetchSermons();
            handleSelectSermon(sermonId);
          }}
        />
      )}

      {showDatabase && (
        <DatabaseModal
          onClose={() => setShowDatabase(false)}
          onRefreshSermons={() => {
            fetchSermons();
            if (selectedSermonId) {
              fetchParagraphes(selectedSermonId);
            }
          }}
        />
      )}

      {showEditSermon && selectedSermon && (
        <EditSermonModal
          sermon={selectedSermon}
          onClose={() => setShowEditSermon(false)}
          onSuccess={() => {
            fetchSermons();
            fetchParagraphes(selectedSermonId);
          }}
          onDeleteSermon={() => handleDeleteSermon(selectedSermon.id)}
        />
      )}

      {showReplace && selectedSermon && (
        <ReplaceModal
          sermon={selectedSermon}
          onClose={() => setShowReplace(false)}
          onSuccess={() => fetchParagraphes(selectedSermonId)}
        />
      )}

      {showAddPara && selectedSermon && (
        <AddParagraphModal
          sermon={selectedSermon}
          defaultNum={paragraphes.length > 0 ? Math.max(...paragraphes.map(p => p.numero_paragraphe)) + 1 : 1}
          onClose={() => setShowAddPara(false)}
          onSuccess={() => fetchParagraphes(selectedSermonId)}
        />
      )}

      {/* Confirmation Modal for Deleting Sermon */}
      {sermonToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#121620] border border-rose-500/30 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-rose-500" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Supprimer la brochure ?</h3>
                <p className="text-xs text-slate-400">Cette action est définitive</p>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed bg-[#181d2a] p-3 rounded-lg border border-white/10">
              Êtes-vous sûr de vouloir supprimer définitivement la brochure <strong className="text-white">"{sermonToDelete.title}"</strong> ({sermonToDelete.id}) ?
              <br />
              <span className="text-xs text-rose-400 mt-1.5 block">
                Tous les paragraphes et données associés seront effacés de la base de données.
              </span>
            </p>

            {isDeleting ? (
              <div className="text-center py-2 text-sm text-[#00d2ff] font-bold animate-pulse">
                Suppression en cours...
              </div>
            ) : (
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSermonToDelete(null)}
                  className="px-4 py-2 bg-[#232a3d] hover:bg-[#2a334a] text-slate-300 rounded-md text-xs font-bold transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteAction}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-md text-xs font-extrabold shadow-lg transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Oui, Supprimer</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Dossier de Données (ProPresenter Style) */}
      <DataDirSettingsModal
        isOpen={showDataDirSettings}
        onClose={() => setShowDataDirSettings(false)}
        onDataDirChanged={() => {
          fetchSermons();
        }}
      />

      {/* Projection Branding & Design Modal */}
      {showProjectionStyleModal && (
        <ProjectionStyleModal
          style={projectionStyle}
          onChangeStyle={handleChangeStyle}
          onClose={() => setShowProjectionStyleModal(false)}
          liveData={projectedState}
          screens={screens}
          themes={themes}
          activeModule={activeModule}
          selectedScreenId={selectedScreenId}
          onSelectScreen={(id) => setSelectedScreenId(id)}
          onAddScreen={handleAddScreen}
          onDeleteScreen={handleDeleteScreen}
          onUpdateScreensAndThemes={handleUpdateScreensAndThemes}
          onOpenNetworkShare={() => setShowNetworkShare(true)}
        />
      )}

      {/* Network Share Modal (OBS & Local Network PCs) */}
      <NetworkShareModal
        isOpen={showNetworkShare}
        onClose={() => setShowNetworkShare(false)}
        screens={screens}
      />

      {/* Help & Documentation Center Modal */}
      <HelpModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        onOpenProjectionTab={(screenId) => openProjectorWindow(screenId || 'audience')}
        onOpenStyleModal={() => setShowProjectionStyleModal(true)}
      />
    </div>
  );
}
