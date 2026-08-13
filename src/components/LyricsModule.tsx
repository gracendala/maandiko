import React, { useState, useEffect } from 'react';
import { Recueil, Song, SongSection } from '../types';
import {
  Music,
  Search,
  Plus,
  Radio,
  BookOpen,
  Trash2,
  Edit3,
  Check,
  FolderPlus,
  Folder,
  Layers,
  ChevronRight,
  Sparkles,
  Calendar,
  ArrowUp,
  ArrowDown,
  X,
  FileText,
  ListOrdered,
  Maximize2
} from 'lucide-react';

export interface GroupPreset {
  label: string;
  type: string;
  color: string;
  shortcut: string;
}

export const SONG_GROUP_PRESETS: GroupPreset[] = [
  { label: 'Couplet 1', type: 'Couplet', color: '#2563eb', shortcut: '1' },
  { label: 'Couplet 2', type: 'Couplet', color: '#0284c7', shortcut: '2' },
  { label: 'Couplet 3', type: 'Couplet', color: '#4f46e5', shortcut: '3' },
  { label: 'Couplet 4', type: 'Couplet', color: '#0d9488', shortcut: '4' },
  { label: 'Couplet 5', type: 'Couplet', color: '#d97706', shortcut: '5' },
  { label: 'Couplet 6', type: 'Couplet', color: '#dc2626', shortcut: '6' },
  { label: 'Couplet 7', type: 'Couplet', color: '#db2777', shortcut: '7' },
  { label: 'Couplet 8', type: 'Couplet', color: '#9333ea', shortcut: '8' },
  { label: 'Couplet 9', type: 'Couplet', color: '#059669', shortcut: '9' },
  { label: 'Couplet 10', type: 'Couplet', color: '#84cc16', shortcut: '0' },
  { label: 'Refrain 1', type: 'Refrain', color: '#e11d48', shortcut: 'R' },
  { label: 'Refrain 2', type: 'Refrain', color: '#c026d3', shortcut: 'Shift+R' },
  { label: 'Pre-Refrain', type: 'Pre-Refrain', color: '#7e22ce', shortcut: 'P' },
  { label: 'Pont', type: 'Pont', color: '#ea580c', shortcut: 'B' },
  { label: 'Tag', type: 'Tag', color: '#10b981', shortcut: 'T' },
  { label: 'Intro', type: 'Intro', color: '#64748b', shortcut: 'I' },
  { label: 'Outro', type: 'Outro', color: '#334155', shortcut: 'O' }
];

export function getDefaultGroupColor(label: string, type?: string): string {
  const norm = (label || type || '').toLowerCase().trim();
  const preset = SONG_GROUP_PRESETS.find(p => p.label.toLowerCase() === norm);
  if (preset) return preset.color;

  if (norm.includes('refrain 2') || norm.includes('r2')) return '#c026d3';
  if (norm.includes('refrain') || norm.includes('chorus') || norm === 'r') return '#e11d48';
  if (norm.includes('pre-refrain') || norm.includes('pre-chorus')) return '#7e22ce';
  if (norm.includes('pont') || norm.includes('bridge') || norm === 'p' || norm === 'b') return '#ea580c';
  if (norm.includes('tag') || norm.includes('coda')) return '#10b981';
  if (norm.includes('intro') || norm.includes('outro') || norm.includes('instrumental')) return '#64748b';

  if (norm.includes('couplet 10') || norm.includes('strophe 10') || norm === 'c10') return '#84cc16';
  if (norm.includes('couplet 9') || norm.includes('strophe 9') || norm === 'c9') return '#059669';
  if (norm.includes('couplet 8') || norm.includes('strophe 8') || norm === 'c8') return '#9333ea';
  if (norm.includes('couplet 7') || norm.includes('strophe 7') || norm === 'c7') return '#db2777';
  if (norm.includes('couplet 6') || norm.includes('strophe 6') || norm === 'c6') return '#dc2626';
  if (norm.includes('couplet 5') || norm.includes('strophe 5') || norm === 'c5') return '#d97706';
  if (norm.includes('couplet 4') || norm.includes('strophe 4') || norm === 'c4') return '#0d9488';
  if (norm.includes('couplet 3') || norm.includes('strophe 3') || norm === 'c3') return '#4f46e5';
  if (norm.includes('couplet 2') || norm.includes('strophe 2') || norm === 'c2') return '#0284c7';
  if (norm.includes('couplet 1') || norm.includes('strophe 1') || norm === 'c1') return '#2563eb';

  return '#2563eb';
}

export function computeCardNumbers(sections: SongSection[]): SongSection[] {
  if (!sections || sections.length === 0) return [];

  // Clone sections array to avoid mutating input objects
  const cloned = sections.map(sec => ({ ...sec }));

  // Step 1: Detect and fix mislabeled verse numbers.
  // E.g., if a song has "Couplet 1", then a card labeled "Couplet 2" before a Refrain,
  // AND another "Couplet 2" after that Refrain, the first "Couplet 2" was actually part 2 of Couplet 1!
  for (let i = 0; i < cloned.length; i++) {
    const sec = cloned[i];
    const lbl = sec.label || 'Couplet 1';
    const match = lbl.match(/^Couplet\s*(\d+)/i) || lbl.match(/^Strophe\s*(\d+)/i) || lbl.match(/^C\s*(\d+)/i);
    if (!match) continue;

    const verseNum = parseInt(match[1], 10);
    if (verseNum > 1) {
      // Find if there is a Refrain after index i
      const nextRefrainIndex = cloned.findIndex((s, idx) => idx > i && (s.type === 'Refrain' || (s.label || '').toLowerCase().includes('refrain')));
      if (nextRefrainIndex !== -1) {
        // Is there another Couplet with the exact same verseNum after that Refrain?
        const hasSameVerseAfterRefrain = cloned.some((s, idx) => {
          if (idx <= nextRefrainIndex) return false;
          const m = (s.label || '').match(/^Couplet\s*(\d+)/i) || (s.label || '').match(/^Strophe\s*(\d+)/i) || (s.label || '').match(/^C\s*(\d+)/i);
          return m && parseInt(m[1], 10) === verseNum;
        });

        if (hasSameVerseAfterRefrain) {
          // Fix this section label to match the preceding couplet label before index i
          let prevCoupletLabel = 'Couplet 1';
          for (let k = i - 1; k >= 0; k--) {
            if (cloned[k].type === 'Couplet' || (cloned[k].label || '').toLowerCase().includes('couplet') || (cloned[k].label || '').toLowerCase().includes('strophe')) {
              prevCoupletLabel = cloned[k].label || 'Couplet 1';
              break;
            }
          }
          cloned[i].label = prevCoupletLabel;
          cloned[i].color = getDefaultGroupColor(prevCoupletLabel, cloned[i].type);
        }
      }
    }
  }

  // Step 2: Compute totals and card indices per label group
  const countsByLabel: Record<string, number> = {};
  cloned.forEach(sec => {
    const lbl = sec.label || 'Couplet 1';
    countsByLabel[lbl] = (countsByLabel[lbl] || 0) + 1;
  });

  const currentIndexByLabel: Record<string, number> = {};
  return cloned.map(sec => {
    const lbl = sec.label || 'Couplet 1';
    currentIndexByLabel[lbl] = (currentIndexByLabel[lbl] || 0) + 1;
    const color = sec.color || getDefaultGroupColor(lbl, sec.type);
    return {
      ...sec,
      label: lbl,
      color,
      cardIndex: currentIndexByLabel[lbl],
      totalCards: countsByLabel[lbl]
    };
  });
}

export interface ProgramItem {
  id: string;
  songId?: string;
  type: 'song' | 'note';
  title: string;
  number?: string;
  category?: string;
  note?: string;
  song?: Song;
}

interface LyricsModuleProps {
  onProject: (sermonId: string, numero: number | string, texte: string, titreOverride?: string) => void;
  projectedState: any;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  navRef?: React.MutableRefObject<{ handleNext: () => void; handlePrev: () => void } | null>;
}

export const LyricsModule: React.FC<LyricsModuleProps> = ({
  onProject,
  projectedState,
  searchQuery: externalSearchQuery,
  onSearchChange: externalOnSearchChange,
  navRef
}) => {
  const [recueils, setRecueils] = useState<Recueil[]>([]);
  const [selectedRecueilId, setSelectedRecueilId] = useState<string>('ce');
  const [songs, setSongs] = useState<Song[]>([]);
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [selectedSongId, setSelectedSongId] = useState<string>('');
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const [loadingRecueils, setLoadingRecueils] = useState(false);
  const [loadingSongs, setLoadingSongs] = useState(false);

  // Program / Agenda State
  const [programItems, setProgramItems] = useState<ProgramItem[]>(() => {
    try {
      const saved = localStorage.getItem('protext_song_agenda');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteDescription, setNoteDescription] = useState('');

  // Direct Song Sections Updates
  const updateSelectedSongSections = async (newSections: SongSection[]) => {
    if (!selectedSong) return;
    const computed = computeCardNumbers(newSections);
    const updatedSong: Song = {
      ...selectedSong,
      sections: computed
    };

    setSongs(prev => prev.map(s => s.id === updatedSong.id ? updatedSong : s));
    setAllSongs(prev => prev.map(s => s.id === updatedSong.id ? updatedSong : s));
    if (selectedRecueilId === 'agenda') {
      setProgramItems(prev => prev.map(item => item.song?.id === updatedSong.id ? { ...item, song: updatedSong } : item));
    }

    try {
      await fetch('/api/songs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSong)
      });
    } catch (err) {
      console.error("Erreur sauvegarde chant:", err);
    }
  };

  const updateCardGroupInSong = async (index: number, groupLabel: string, groupType: string, color: string) => {
    if (!selectedSong) return;
    const sections = [...(selectedSong.sections || [])];
    if (!sections[index]) return;
    sections[index] = {
      ...sections[index],
      label: groupLabel,
      type: groupType,
      color: color
    };
    await updateSelectedSongSections(sections);
  };

  // Persist programItems in localStorage
  useEffect(() => {
    try {
      localStorage.setItem('protext_song_agenda', JSON.stringify(programItems));
    } catch (e) {
      console.error("Erreur sauvegarde programme local:", e);
    }
  }, [programItems]);

  // Toast timer
  useEffect(() => {
    if (toastMessage) {
      const t = setTimeout(() => setToastMessage(null), 3500);
      return () => clearTimeout(t);
    }
  }, [toastMessage]);

  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;

  const setSearchQuery = (q: string) => {
    setInternalSearchQuery(q);
    if (externalOnSearchChange) {
      externalOnSearchChange(q);
    }
  };

  // Helper functions for Program Agenda
  const isInProgram = (songId: string) => {
    return programItems.some(item => item.songId === songId);
  };

  const addToProgram = (song: Song) => {
    const newItem: ProgramItem = {
      id: `agenda-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      songId: song.id,
      type: 'song',
      title: song.title,
      number: song.number,
      category: song.category || 'Cantique',
      song: song
    };
    setProgramItems(prev => [...prev, newItem]);
    setToastMessage(`« N° ${song.number} - ${song.title} » ajouté au programme !`);
  };

  const removeFromProgram = (id: string) => {
    setProgramItems(prev => prev.filter(item => item.id !== id));
  };

  const moveProgramItem = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === programItems.length - 1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const newItems = [...programItems];
    const [removed] = newItems.splice(index, 1);
    newItems.splice(targetIndex, 0, removed);
    setProgramItems(newItems);
  };

  const clearProgram = () => {
    if (confirm("Voulez-vous vraiment vider tout le programme du culte ?")) {
      setProgramItems([]);
      setToastMessage("Programme vider.");
    }
  };

  const handleAddNoteToProgram = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim()) return;
    const newNote: ProgramItem = {
      id: `agenda-note-${Date.now()}`,
      type: 'note',
      title: noteTitle.trim(),
      note: noteDescription.trim()
    };
    setProgramItems(prev => [...prev, newNote]);
    setNoteTitle('');
    setNoteDescription('');
    setShowAddNoteModal(false);
    setToastMessage(`Étape « ${newNote.title} » ajoutée au programme !`);
  };

  // Load All Songs (for app-wide search across all recueils)
  const loadAllSongs = async () => {
    try {
      const res = await fetch('/api/songs');
      if (res.ok) {
        const data: Song[] = await res.json();
        setAllSongs(data);
      }
    } catch (err) {
      console.error("Erreur lors du chargement de tous les cantiques:", err);
    }
  };

  // New Recueil Modal
  const [showAddRecueil, setShowAddRecueil] = useState(false);
  const [recueilTitle, setRecueilTitle] = useState('');
  const [recueilDesc, setRecueilDesc] = useState('');

  // New/Edit Song Modal
  const [showAddSong, setShowAddSong] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newNumber, setNewNumber] = useState('');
  const [rawSongText, setRawSongText] = useState('');

  // Load Recueils
  const loadRecueils = async () => {
    setLoadingRecueils(true);
    try {
      const res = await fetch('/api/recueils');
      if (res.ok) {
        const data: Recueil[] = await res.json();
        setRecueils(data);
        if (data.length > 0 && !data.some(r => r.id === selectedRecueilId)) {
          setSelectedRecueilId(data[0].id);
        }
      }
    } catch (err) {
      console.error("Erreur lors du chargement des recueils:", err);
    } finally {
      setLoadingRecueils(false);
    }
  };

  // Load Songs for selected Recueil
  const loadSongs = async (recueilId: string) => {
    if (!recueilId) return;
    setLoadingSongs(true);
    try {
      const res = await fetch(`/api/songs?recueil_id=${encodeURIComponent(recueilId)}`);
      if (res.ok) {
        const data: Song[] = await res.json();
        setSongs(data);
        if (data.length > 0) {
          setSelectedSongId(data[0].id);
        } else {
          setSelectedSongId('');
        }
      }
    } catch (err) {
      console.error("Erreur lors du chargement des cantiques:", err);
    } finally {
      setLoadingSongs(false);
    }
  };

  useEffect(() => {
    loadRecueils();
    loadAllSongs();
  }, []);

  useEffect(() => {
    if (selectedRecueilId) {
      loadSongs(selectedRecueilId);
    }
  }, [selectedRecueilId]);

  // Handle Create Recueil
  const handleCreateRecueil = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recueilTitle.trim()) return;

    try {
      const res = await fetch('/api/recueils', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: recueilTitle.trim(),
          description: recueilDesc.trim()
        })
      });

      if (res.ok) {
        const result = await res.json();
        await loadRecueils();
        if (result.recueil?.id) {
          setSelectedRecueilId(result.recueil.id);
        }
        setRecueilTitle('');
        setRecueilDesc('');
        setShowAddRecueil(false);
      }
    } catch (err) {
      console.error("Erreur création recueil:", err);
    }
  };

  // Handle Delete Recueil
  const handleDeleteRecueil = async (recueilId: string, title: string) => {
    if (!confirm(`Voulez-vous vraiment supprimer le recueil "${title}" et tous ses cantiques ?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/recueils/${encodeURIComponent(recueilId)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await loadRecueils();
      }
    } catch (err) {
      console.error("Erreur suppression recueil:", err);
    }
  };

  // Open Add/Edit Song Modal
  const openSongModal = (songToEdit?: Song) => {
    if (songToEdit) {
      setEditingSong(songToEdit);
      setNewTitle(songToEdit.title);
      setNewNumber(songToEdit.number);
      setRawSongText(
        songToEdit.sections
          .map(sec => `${sec.label}:\n${sec.text}`)
          .join('\n\n')
      );
    } else {
      setEditingSong(null);
      setNewTitle('');
      setNewNumber(`${songs.length + 1}`.padStart(3, '0'));
      setRawSongText('');
    }
    setShowAddSong(true);
  };

  // Handle Save Song
  const handleSaveSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !rawSongText.trim()) return;

    // Parse raw text into sections and sub-cards
    const blocks = rawSongText.split(/\n\s*\n/).filter(b => b.trim().length > 0);
    const parsedSections: SongSection[] = [];
    let verseCounter = 0;

    blocks.forEach((block, idx) => {
      const lines = block.split('\n');
      const firstLine = lines[0].trim();
      let label = '';
      let type: 'Couplet' | 'Refrain' | 'Pont' | string = 'Couplet';

      if (firstLine.toLowerCase().includes('refrain') || firstLine.toLowerCase().startsWith('r:')) {
        label = 'Refrain';
        type = 'Refrain';
      } else if (firstLine.toLowerCase().includes('pont') || firstLine.toLowerCase().startsWith('p:')) {
        label = 'Pont';
        type = 'Pont';
      } else if (firstLine.toLowerCase().includes('tag') || firstLine.toLowerCase().startsWith('t:')) {
        label = 'Tag';
        type = 'Tag';
      } else if (/^(couplet|strophe|c)\s*\d*:/i.test(firstLine)) {
        label = firstLine.replace(':', '').trim();
        const numMatch = label.match(/\d+/);
        if (numMatch) {
          verseCounter = parseInt(numMatch[0], 10);
        }
      } else {
        verseCounter++;
        label = `Couplet ${verseCounter}`;
        type = 'Couplet';
      }

      const contentLines = (firstLine.includes(':') && lines.length > 1) 
        ? lines.slice(1) 
        : lines;

      const fullBlockText = contentLines.join('\n').trim();

      // Split by --- inside block if present
      const subCards = fullBlockText.split(/\n\s*---\s*\n|\n\s*---\s*$/);
      subCards.forEach((subText, subIdx) => {
        const cleanText = subText.trim();
        if (cleanText.length > 0) {
          parsedSections.push({
            id: `sec-${Date.now()}-${idx}-${subIdx}`,
            label,
            type,
            color: getDefaultGroupColor(label, type),
            text: cleanText,
            lines: cleanText.split('\n')
          });
        }
      });
    });

    const finalSections = computeCardNumbers(parsedSections);

    const activeRecueil = recueils.find(r => r.id === selectedRecueilId);

    const songData = {
      id: editingSong ? editingSong.id : `song-${Date.now()}`,
      recueil_id: selectedRecueilId,
      number: newNumber || `${songs.length + 1}`.padStart(3, '0'),
      title: newTitle.trim(),
      category: activeRecueil ? activeRecueil.title : 'Cantiques',
      author: '',
      keySignature: '',
      sections: finalSections
    };

    try {
      const res = await fetch('/api/songs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(songData)
      });

      if (res.ok) {
        const result = await res.json();
        await loadSongs(selectedRecueilId);
        await loadAllSongs();
        await loadRecueils();
        if (result.song?.id) {
          setSelectedSongId(result.song.id);
        }
        setShowAddSong(false);
      }
    } catch (err) {
      console.error("Erreur sauvegarde cantique:", err);
    }
  };

  // Handle Delete Song
  const handleDeleteSong = async (songId: string, title: string) => {
    if (!confirm(`Voulez-vous vraiment supprimer le cantique "${title}" ?`)) return;

    try {
      const res = await fetch(`/api/songs/${encodeURIComponent(songId)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await loadSongs(selectedRecueilId);
        await loadAllSongs();
        await loadRecueils();
      }
    } catch (err) {
      console.error("Erreur suppression cantique:", err);
    }
  };

  const isGlobalSearch = searchQuery.trim().length > 0;
  const sourceSongs = isGlobalSearch ? allSongs : songs;

  const filteredSongs = sourceSongs.filter(s => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const matchesNumber = s.number.toLowerCase().includes(q);
    const matchesTitle = s.title.toLowerCase().includes(q);
    const matchesAuthor = s.author ? s.author.toLowerCase().includes(q) : false;
    const matchesRecueil = s.category ? s.category.toLowerCase().includes(q) : false;
    const matchesLyric = s.sections?.some(sec => sec.text.toLowerCase().includes(q));
    return matchesNumber || matchesTitle || matchesAuthor || matchesRecueil || matchesLyric;
  });

  const rawSelectedSong = sourceSongs.find(s => s.id === selectedSongId)
    || allSongs.find(s => s.id === selectedSongId)
    || songs.find(s => s.id === selectedSongId)
    || filteredSongs[0]
    || songs[0];

  const selectedSong = rawSelectedSong ? {
    ...rawSelectedSong,
    sections: computeCardNumbers(rawSelectedSong.sections || [])
  } : null;

  const selectedRecueil = selectedRecueilId === 'agenda'
    ? { id: 'agenda', title: 'Programme du Culte (Agenda)', description: 'Sélection des chants pour le culte' }
    : recueils.find(r => r.id === (selectedSong?.recueil_id || selectedRecueilId)) || recueils.find(r => r.id === selectedRecueilId);

  // Keyboard Shortcuts Listener for Direct Stanza Projection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT' || (activeEl as HTMLElement).isContentEditable)) {
        return;
      }

      if (!selectedSong || !selectedSong.sections || selectedSong.sections.length === 0) return;

      let targetPresetLabel: string | null = null;
      const key = e.key;

      if (key >= '1' && key <= '9') {
        targetPresetLabel = `Couplet ${key}`;
      } else if (key === '0') {
        targetPresetLabel = 'Couplet 10';
      } else if (key.toLowerCase() === 'r') {
        if (e.shiftKey) {
          targetPresetLabel = 'Refrain 2';
        } else {
          targetPresetLabel = 'Refrain 1';
        }
      } else if (key.toLowerCase() === 'b') {
        targetPresetLabel = 'Pont';
      } else if (key.toLowerCase() === 'p') {
        targetPresetLabel = 'Pre-Refrain';
      } else if (key.toLowerCase() === 'i') {
        targetPresetLabel = 'Intro';
      } else if (key.toLowerCase() === 'o') {
        targetPresetLabel = 'Outro';
      }

      if (targetPresetLabel) {
        const sec = selectedSong.sections.find(s =>
          s.label.toLowerCase() === targetPresetLabel!.toLowerCase() ||
          (targetPresetLabel === 'Refrain 1' && s.label.toLowerCase() === 'refrain')
        );

        if (sec) {
          e.preventDefault();
          const cardLabel = `${sec.label}${sec.totalCards && sec.totalCards > 1 ? ` (${sec.cardIndex}/${sec.totalCards})` : ''}`;
          const headerTitle = `${selectedRecueil?.title || 'Chants'} - ${selectedSong.number}. ${selectedSong.title}`;
          onProject('LYRICS', cardLabel, sec.text, headerTitle);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedSong, selectedRecueil, onProject]);

  // Check if section is currently projected
  const isSectionLive = (label: string, text: string) => {
    if (!projectedState) return false;
    if (
      projectedState.sermonId === 'BLACK' ||
      projectedState.animPhase === 'EXITING' ||
      projectedState.animPhase === 'OUT' ||
      !projectedState.texte
    ) {
      return false;
    }
    return (
      projectedState.sermonId === 'LYRICS' &&
      projectedState.numero === label &&
      projectedState.texte?.trim() === text?.trim()
    );
  };

  // Register navigation handler for live keyboard / monitor bar control
  useEffect(() => {
    if (!navRef) return;
    navRef.current = {
      handleNext: () => {
        if (!selectedSong || !selectedSong.sections || selectedSong.sections.length === 0) return;
        const sections = selectedSong.sections;

        // Find index of currently live section
        const currentIdx = sections.findIndex((sec) => {
          const cardLabel = `${sec.label}${sec.totalCards && sec.totalCards > 1 ? ` (${sec.cardIndex}/${sec.totalCards})` : ''}`;
          return isSectionLive(cardLabel, sec.text);
        });

        let nextIdx = 0;
        if (currentIdx >= 0) {
          if (currentIdx < sections.length - 1) {
            nextIdx = currentIdx + 1;
          } else {
            // At last card -> move to next song in list if available
            const songList = selectedRecueilId === 'agenda'
              ? (programItems.map(p => p.song).filter(Boolean) as Song[])
              : filteredSongs;
            const currentSongIdx = songList.findIndex(s => s.id === selectedSong.id);
            if (currentSongIdx >= 0 && currentSongIdx < songList.length - 1) {
              const nextSong = songList[currentSongIdx + 1];
              setSelectedSongId(nextSong.id);
              const nextSongSections = computeCardNumbers(nextSong.sections || []);
              if (nextSongSections.length > 0) {
                const sec = nextSongSections[0];
                const cardLabel = `${sec.label}${sec.totalCards && sec.totalCards > 1 ? ` (${sec.cardIndex}/${sec.totalCards})` : ''}`;
                const headerTitle = `${selectedRecueil?.title || 'Chants'} - ${nextSong.number}. ${nextSong.title}`;
                onProject('LYRICS', cardLabel, sec.text, headerTitle);
                return;
              }
            }
            nextIdx = sections.length - 1;
          }
        }

        const sec = sections[nextIdx];
        const cardLabel = `${sec.label}${sec.totalCards && sec.totalCards > 1 ? ` (${sec.cardIndex}/${sec.totalCards})` : ''}`;
        const headerTitle = `${selectedRecueil?.title || 'Chants'} - ${selectedSong.number}. ${selectedSong.title}`;
        onProject('LYRICS', cardLabel, sec.text, headerTitle);
      },
      handlePrev: () => {
        if (!selectedSong || !selectedSong.sections || selectedSong.sections.length === 0) return;
        const sections = selectedSong.sections;

        const currentIdx = sections.findIndex((sec) => {
          const cardLabel = `${sec.label}${sec.totalCards && sec.totalCards > 1 ? ` (${sec.cardIndex}/${sec.totalCards})` : ''}`;
          return isSectionLive(cardLabel, sec.text);
        });

        let prevIdx = 0;
        if (currentIdx > 0) {
          prevIdx = currentIdx - 1;
        } else if (currentIdx === 0) {
          // At first card -> move to previous song if available
          const songList = selectedRecueilId === 'agenda'
            ? (programItems.map(p => p.song).filter(Boolean) as Song[])
            : filteredSongs;
          const currentSongIdx = songList.findIndex(s => s.id === selectedSong.id);
          if (currentSongIdx > 0) {
            const prevSong = songList[currentSongIdx - 1];
            setSelectedSongId(prevSong.id);
            const prevSongSections = computeCardNumbers(prevSong.sections || []);
            if (prevSongSections.length > 0) {
              const lastSecIdx = prevSongSections.length - 1;
              const sec = prevSongSections[lastSecIdx];
              const cardLabel = `${sec.label}${sec.totalCards && sec.totalCards > 1 ? ` (${sec.cardIndex}/${sec.totalCards})` : ''}`;
              const headerTitle = `${selectedRecueil?.title || 'Chants'} - ${prevSong.number}. ${prevSong.title}`;
              onProject('LYRICS', cardLabel, sec.text, headerTitle);
              return;
            }
          }
          prevIdx = 0;
        } else {
          prevIdx = 0;
        }

        const sec = sections[prevIdx];
        const cardLabel = `${sec.label}${sec.totalCards && sec.totalCards > 1 ? ` (${sec.cardIndex}/${sec.totalCards})` : ''}`;
        const headerTitle = `${selectedRecueil?.title || 'Chants'} - ${selectedSong.number}. ${selectedSong.title}`;
        onProject('LYRICS', cardLabel, sec.text, headerTitle);
      }
    };
  }, [selectedSong, filteredSongs, programItems, selectedRecueilId, projectedState, selectedRecueil, onProject, navRef]);

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-[#0d1017] text-slate-100 relative">
      {/* Unified Left Sidebar Container */}
      <div className="w-80 border-r border-white/10 bg-[#121620] flex flex-col flex-shrink-0 h-full overflow-hidden">
        {/* TOP SECTION: RECUEILS */}
        <div className="flex flex-col flex-1 min-h-[180px] border-b border-white/10 overflow-hidden">
          {/* Recueils Header */}
          <div className="p-3 border-b border-white/10 flex items-center justify-between bg-[#181d2a] flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-[#00d2ff]/10 text-[#00d2ff] border border-[#00d2ff]/20">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-xs text-white leading-none">Recueils</h2>
                <span className="text-[10px] text-slate-400">{recueils.length} enregistrés</span>
              </div>
            </div>
            <button
              onClick={() => setShowAddRecueil(true)}
              className="px-2 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1 transition shadow cursor-pointer"
              title="Créer un recueil"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>Nouveau</span>
            </button>
          </div>

          {/* Recueils List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loadingRecueils ? (
              <div className="p-4 text-center text-xs text-slate-500">Chargement des recueils...</div>
            ) : recueils.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                Aucun recueil créé. Cliquez sur "Nouveau" pour en ajouter un.
              </div>
            ) : (
              recueils.map((r, idx) => {
                const isSelected = r.id === selectedRecueilId;
                return (
                  <div
                    key={r.id}
                    onClick={() => setSelectedRecueilId(r.id)}
                    className={`group relative px-2 py-1.5 rounded-md border transition cursor-pointer flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500/50 text-white shadow-sm font-medium'
                        : 'border-transparent hover:bg-white/5 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className={`px-1 py-0.2 rounded text-[10px] font-mono font-bold flex-shrink-0 ${
                        isSelected ? 'bg-blue-500/30 text-blue-200 border border-blue-400/40' : 'bg-[#1a2130] text-slate-400 border border-white/10'
                      }`}>
                        N° {idx + 1}
                      </span>
                      <span className="font-bold text-xs truncate text-white min-w-0">{r.title}</span>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition flex-shrink-0">
                      {r.id !== 'ce' && r.id !== 'saf' && r.id !== 'cv' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRecueil(r.id, r.title);
                          }}
                          className="p-0.5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded transition"
                          title="Supprimer le recueil"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                      <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-400' : 'text-slate-500'}`} />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* PINNED PROGRAM / AGENDA RECUEIL CARD AT THE BOTTOM */}
          <div className="p-2 border-t border-white/10 bg-[#121620] flex-shrink-0">
            <div
              onClick={() => setSelectedRecueilId('agenda')}
              className={`group relative px-2.5 py-2 rounded-lg border transition cursor-pointer flex items-center justify-between gap-2 ${
                selectedRecueilId === 'agenda'
                  ? 'bg-[#1e293b] border-cyan-500/40 text-white shadow-sm font-medium ring-1 ring-cyan-500/30'
                  : 'bg-[#1a2130] hover:bg-[#1e2538] border-white/10 text-slate-300 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className={`p-1.5 rounded-md ${selectedRecueilId === 'agenda' ? 'bg-blue-600 text-white font-bold' : 'bg-[#121620] text-slate-300 border border-white/10'}`}>
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="truncate min-w-0">
                  <div className="font-bold text-xs truncate text-slate-100 flex items-center gap-1">
                    <span>Programme du Culte</span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">Agenda des chants sélectionnés</div>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold flex-shrink-0 ${
                selectedRecueilId === 'agenda'
                  ? 'bg-blue-600 text-white'
                  : programItems.length > 0
                  ? 'bg-[#121620] text-blue-300 border border-white/10'
                  : 'bg-[#121620]/60 text-slate-500 border border-white/10'
              }`}>
                {programItems.length}
              </span>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: CHANTS DU RECUEIL SELECTIONNE / PROGRAMME */}
        <div className="flex flex-col flex-1 min-h-[220px] bg-[#121620] overflow-hidden">
          {/* Chants Header & Search */}
          <div className="p-3 border-b border-white/10 bg-[#181d2a] space-y-2 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1">
                  {selectedRecueilId === 'agenda' ? <Calendar className="w-3 h-3 text-blue-400" /> : <Music className="w-3 h-3" />}
                  <span>
                    {selectedRecueilId === 'agenda'
                      ? 'Chants & Étapes du Culte'
                      : isGlobalSearch
                      ? 'Recherche Globale'
                      : 'Chants Disponibles'}
                  </span>
                </span>
                <h3 className="font-extrabold text-xs text-white truncate">
                  {selectedRecueilId === 'agenda'
                    ? `Programme (${programItems.length} éléments)`
                    : isGlobalSearch
                    ? `Résultats pour "${searchQuery}"`
                    : (selectedRecueil?.title || 'Cantiques')}
                </h3>
              </div>
              {selectedRecueilId === 'agenda' ? (
                <button
                  onClick={() => setShowAddNoteModal(true)}
                  className="ml-2 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs flex items-center gap-1 transition shadow cursor-pointer flex-shrink-0"
                  title="Ajouter une étape / note au programme"
                >
                  <Plus className="w-3.5 h-3.5 text-blue-400" />
                  <span>+ Étape</span>
                </button>
              ) : (
                <button
                  onClick={() => openSongModal()}
                  className="ml-2 px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1 transition shadow cursor-pointer flex-shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Cantique</span>
                </button>
              )}
            </div>

            {/* Search Input (Hidden in Agenda view if not searching) */}
            {selectedRecueilId !== 'agenda' && (
              <div className="relative">
                <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Chercher N°, titre ou parole (tous recueils)..."
                  className="w-full bg-slate-800/80 border border-slate-700/60 pl-8 pr-7 py-1 rounded-md text-xs text-white placeholder-slate-400 outline-none focus:border-blue-500 transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1 text-slate-400 hover:text-white text-xs"
                    title="Effacer la recherche"
                  >
                    ✕
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Songs List OR Agenda List */}
          <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
            {selectedRecueilId === 'agenda' ? (
              programItems.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 space-y-2">
                  <p>Aucun chant au programme.</p>
                  <p className="text-[11px] text-slate-400">
                    Parcourez un recueil et cliquez sur le bouton <span className="font-bold border px-1 rounded border-slate-700 bg-slate-800 text-slate-300">+</span> à côté du nom d'un cantique pour l'intégrer au programme !
                  </p>
                </div>
              ) : (
                programItems.map((item, idx) => {
                  const isSong = item.type === 'song';
                  const isSelected = isSong && item.songId === selectedSongId;

                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (isSong && item.songId) {
                          setSelectedSongId(item.songId);
                        }
                      }}
                      className={`group px-2 py-1.5 rounded-md border transition cursor-pointer flex items-center justify-between gap-1.5 ${
                        isSelected
                          ? 'bg-blue-600/20 border-blue-500/60 text-white font-medium shadow-sm'
                          : 'bg-slate-800/40 hover:bg-slate-800/80 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                          {idx + 1}
                        </span>
                        {isSong ? (
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1 min-w-0">
                              <span className="text-[10px] font-mono font-bold text-blue-400 flex-shrink-0">
                                N° {item.number}
                              </span>
                              <span className="font-semibold text-xs truncate text-white min-w-0">{item.title}</span>
                            </div>
                            <div className="text-[9px] text-slate-400 truncate">{item.category}</div>
                          </div>
                        ) : (
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-xs text-slate-200 truncate flex items-center gap-1">
                              <FileText className="w-3 h-3 text-blue-400 flex-shrink-0" />
                              <span className="truncate">{item.title}</span>
                            </div>
                            {item.note && <div className="text-[9px] text-slate-400 truncate">{item.note}</div>}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveProgramItem(idx, 'up');
                          }}
                          disabled={idx === 0}
                          className="p-1 hover:bg-slate-700 text-slate-400 hover:text-white rounded disabled:opacity-30"
                          title="Monter"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveProgramItem(idx, 'down');
                          }}
                          disabled={idx === programItems.length - 1}
                          className="p-1 hover:bg-slate-700 text-slate-400 hover:text-white rounded disabled:opacity-30"
                          title="Descendre"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromProgram(item.id);
                          }}
                          className="p-1 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded transition"
                          title="Retirer du programme"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )
            ) : loadingSongs ? (
              <div className="p-4 text-center text-xs text-slate-500">Chargement des cantiques...</div>
            ) : filteredSongs.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                {isGlobalSearch ? `Aucun cantique trouvé pour "${searchQuery}"` : 'Aucun cantique dans ce recueil'}
              </div>
            ) : (
              filteredSongs.map(song => {
                const isSelected = song.id === selectedSongId;
                const rec = recueils.find(r => r.id === song.recueil_id);
                const inProg = isInProgram(song.id);

                return (
                  <div
                    key={song.id}
                    onClick={() => {
                      setSelectedSongId(song.id);
                      if (song.recueil_id) {
                        setSelectedRecueilId(song.recueil_id);
                      }
                    }}
                    className={`group px-2 py-1.5 rounded-md border transition cursor-pointer flex items-center justify-between gap-1.5 ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500/50 text-white font-medium shadow-sm'
                        : 'border-transparent hover:bg-slate-800/50 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold flex-shrink-0 ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}>
                        N° {song.number}
                      </span>
                      <span className="font-semibold text-xs truncate text-white min-w-0">{song.title}</span>
                      {isGlobalSearch && (rec?.title || song.category) && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 font-medium truncate max-w-[70px] flex-shrink-0">
                          {rec?.title || song.category}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      {/* BUTTON '+' TO INTEGRATE INTO PROGRAM AGENDA */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addToProgram(song);
                        }}
                        className={`p-1 rounded transition text-[11px] font-medium flex items-center gap-1 ${
                          inProg
                            ? 'bg-slate-800 text-emerald-400 border border-slate-700 hover:bg-slate-750'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent hover:border-slate-700/60'
                        }`}
                        title={inProg ? "Déjà au programme (Cliquer pour ajouter à nouveau)" : "Ajouter au programme (Agenda des chants)"}
                      >
                        <Plus className="w-3.5 h-3.5 text-slate-400 hover:text-slate-200" />
                        {inProg && <Check className="w-3 h-3 text-emerald-400" />}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Footer Info */}
          <div className="p-2.5 border-t border-slate-800 flex items-center justify-between bg-slate-900/90 text-[10px] text-slate-400">
            <span>
              {selectedRecueilId === 'agenda'
                ? `${programItems.length} élément(s) au programme`
                : `${filteredSongs.length} chant(s) disponible(s)`}
            </span>
            <span className="font-mono font-bold text-blue-400 truncate max-w-[120px]">{selectedRecueil?.title}</span>
          </div>
        </div>
      </div>

      {/* 3. Main Display Area: Selected Song Stanzas / Agenda Dashboard */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#0d1017]">
        {selectedRecueilId === 'agenda' && (
          <div className="p-4 border-b border-white/10 bg-[#121620] flex items-center justify-between gap-3 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#1a2130] text-blue-400 border border-white/10">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm md:text-base font-extrabold text-white tracking-wide uppercase flex items-center gap-2">
                  <span>Programme du Service & Agenda des Chants</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-[#1a2130] text-slate-300 border border-white/10">
                    {programItems.length} élément(s)
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Organisez la suite des cantiques et étapes du culte. Cliquez sur un chant pour afficher et projeter ses strophes.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddNoteModal(true)}
                className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter une étape / note</span>
              </button>
              {programItems.length > 0 && (
                <button
                  onClick={clearProgram}
                  className="px-3 py-1.5 rounded-md bg-red-950/60 hover:bg-red-900/80 text-red-300 font-medium text-xs border border-red-800/50 flex items-center gap-1.5 transition cursor-pointer"
                  title="Vider le programme du culte"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Vider</span>
                </button>
              )}
            </div>
          </div>
        )}

        {selectedSong ? (
          <>
            {/* Song Header */}
            <div className="p-3.5 border-b border-white/10 bg-[#121620] flex items-center justify-between gap-3 flex-shrink-0">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/30 text-sm font-mono font-bold">
                  N° {selectedSong.number}
                </span>
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight">
                    {selectedSong.title}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Recueil : {selectedRecueil?.title || 'Cantique'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* PROGRAM AGENDA TOGGLE BUTTON */}
                <button
                  onClick={() => addToProgram(selectedSong)}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold border flex items-center gap-1.5 transition shadow-sm ${
                    isInProgram(selectedSong.id)
                      ? 'bg-emerald-950/60 text-emerald-200 border-emerald-800/60 hover:bg-emerald-900/60'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                >
                  {isInProgram(selectedSong.id) ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Au Programme</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5 text-blue-400" />
                      <span>+ Ajouter au Programme</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => openSongModal(selectedSong)}
                  className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Modifier</span>
                </button>
              </div>
            </div>

            {/* Stanzas / Verses Cards with Direct Group & Action Controls */}
            <div className="flex-1 overflow-y-auto p-5">
              <div className="max-w-5xl mx-auto space-y-4">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                  <span>Cartes de Projection (Cliquez pour projeter | Attribuez le groupe directement)</span>
                  <span>{selectedSong.sections.length} carte(s) disponible(s)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {selectedSong.sections.map((section, secIdx) => {
                    const cardLabel = `${section.label}${section.totalCards && section.totalCards > 1 ? ` (${section.cardIndex}/${section.totalCards})` : ''}`;
                    const live = isSectionLive(section.label, section.text);
                    const headerTitle = `${selectedRecueil?.title || 'Chants'} - ${selectedSong.number}. ${selectedSong.title}`;
                    const cardColor = section.color || getDefaultGroupColor(section.label, section.type);

                    return (
                      <div
                        key={section.id || `sec-${secIdx}`}
                        onClick={() => {
                          onProject('LYRICS', cardLabel, section.text, headerTitle);
                        }}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-150 relative flex flex-col justify-between group overflow-hidden shadow-sm ${
                          live
                            ? 'bg-emerald-950/70 border-emerald-500 shadow-lg ring-2 ring-emerald-500/40'
                            : 'bg-slate-900/90 hover:bg-slate-850 border-slate-800 hover:border-slate-700 text-slate-200'
                        }`}
                      >
                        {/* Group Color Top Banner Accent */}
                        <div
                          className="absolute top-0 left-0 right-0 h-1.5"
                          style={{ backgroundColor: cardColor }}
                        />

                        {/* Card Header: Group Dropdown, Color & Position */}
                        <div className="flex items-center justify-between gap-1.5 mb-2 pb-2 border-b border-slate-800/80 pt-1">
                          <div className="flex items-center gap-1.5 flex-wrap" onClick={(e) => e.stopPropagation()}>
                            <span
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm"
                              style={{ backgroundColor: cardColor }}
                            />

                            {/* Group Selection Dropdown */}
                            <select
                              value={section.label}
                              onChange={(e) => {
                                e.stopPropagation();
                                const val = e.target.value;
                                const preset = SONG_GROUP_PRESETS.find(p => p.label === val);
                                if (preset) {
                                  updateCardGroupInSong(secIdx, preset.label, preset.type, preset.color);
                                } else {
                                  updateCardGroupInSong(secIdx, val, 'Couplet', getDefaultGroupColor(val, 'Couplet'));
                                }
                              }}
                              className="bg-slate-950 text-white border border-slate-700/80 px-2 py-0.5 rounded-lg text-xs font-bold outline-none cursor-pointer focus:border-blue-500 transition"
                            >
                              {SONG_GROUP_PRESETS.map((preset) => (
                                <option key={preset.label} value={preset.label}>
                                  {preset.label}
                                </option>
                              ))}
                            </select>

                            {/* Discrete Keyboard Shortcut Badge */}
                            {(() => {
                              const preset = SONG_GROUP_PRESETS.find(p => p.label.toLowerCase() === section.label.toLowerCase() || (p.label === 'Refrain 1' && section.label.toLowerCase() === 'refrain'));
                              if (!preset?.shortcut) return null;
                              return (
                                <kbd
                                  className="px-1.5 py-0.5 rounded bg-slate-950/90 text-slate-400 border border-slate-800 text-[10px] font-mono font-semibold shadow-inner"
                                  title={`Raccourci clavier: ${preset.shortcut}`}
                                >
                                  {preset.shortcut}
                                </kbd>
                              );
                            })()}

                            {/* Card Index Badge */}
                            {section.totalCards && section.totalCards > 1 && (
                              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-blue-300 border border-slate-700 font-mono text-[10px] font-bold">
                                {section.cardIndex}/{section.totalCards}
                              </span>
                            )}
                          </div>

                          {/* Right: Live badge or project hint */}
                          {live ? (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold animate-pulse flex-shrink-0">
                              <Radio className="w-3 h-3 text-emerald-400" />
                              <span>DIRECT</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500 group-hover:text-blue-400 transition font-medium flex-shrink-0">
                              Projeter
                            </span>
                          )}
                        </div>

                        {/* Card Body: Lyrics */}
                        <div className="whitespace-pre-wrap font-serif text-xs leading-relaxed text-slate-200 flex-1 my-1.5 px-0.5">
                          {section.text}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-500 text-sm space-y-3">
            <Calendar className="w-12 h-12 text-slate-700" />
            <p>Sélectionnez un chant dans le programme ou dans un recueil pour afficher ses strophes.</p>
          </div>
        )}
      </div>

      {/* FLOATING TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-800 text-slate-100 font-medium px-4 py-2.5 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-2 text-xs">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modal: Add Note / Service Step */}
      {showAddNoteModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                <span>Ajouter une étape au Programme</span>
              </h3>
              <button
                onClick={() => setShowAddNoteModal(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddNoteToProgram} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Intitulé de l'étape * :</label>
                <input
                  type="text"
                  required
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="ex: Accueil & Prière d'ouverture, Offrandes..."
                  className="w-full bg-slate-800 border border-slate-700 px-3 py-2 rounded-md text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Note / Détails (Optionnel) :</label>
                <textarea
                  rows={3}
                  value={noteDescription}
                  onChange={(e) => setNoteDescription(e.target.value)}
                  placeholder="ex: Dirigé par Frère Jean"
                  className="w-full bg-slate-800 border border-slate-700 px-3 py-2 rounded-md text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddNoteModal(false)}
                  className="px-3.5 py-1.5 rounded-md bg-slate-800 text-slate-300 hover:text-white font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter au Programme</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create New Recueil */}
      {showAddRecueil && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-blue-400" />
                <span>Nouveau Recueil de Cantiques</span>
              </h3>
              <button
                onClick={() => setShowAddRecueil(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRecueil} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Nom du Recueil * :</label>
                <input
                  type="text"
                  required
                  value={recueilTitle}
                  onChange={(e) => setRecueilTitle(e.target.value)}
                  placeholder="ex: Chants d'Adoration 2026"
                  className="w-full bg-slate-800 border border-slate-700 px-3 py-2 rounded-md text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Description (Optionnelle) :</label>
                <textarea
                  rows={3}
                  value={recueilDesc}
                  onChange={(e) => setRecueilDesc(e.target.value)}
                  placeholder="ex: Recueil de cantiques pour les cultes d'évangélisation"
                  className="w-full bg-slate-800 border border-slate-700 px-3 py-2 rounded-md text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddRecueil(false)}
                  className="px-3.5 py-1.5 rounded-md bg-slate-800 text-slate-300 hover:text-white font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Créer le Recueil</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add/Edit Song */}
      {showAddSong && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Music className="w-4 h-4 text-blue-400" />
                <span>{editingSong ? 'Modifier le Cantique' : 'Nouveau Cantique'}</span>
              </h3>
              <button
                onClick={() => setShowAddSong(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSong} className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Numéro :</label>
                  <input
                    type="text"
                    value={newNumber}
                    onChange={(e) => setNewNumber(e.target.value)}
                    placeholder="ex: 042"
                    className="w-full bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-md text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-300 font-medium mb-1">Titre du Cantique * :</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="ex: Reste Avec Nous, Seigneur"
                    className="w-full bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-md text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Paroles du Cantique (Séparez les strophes et refrains par une ligne vide) * :
                </label>
                <textarea
                  required
                  rows={10}
                  value={rawSongText}
                  onChange={(e) => setRawSongText(e.target.value)}
                  placeholder={`Couplet 1:\nParoles du premier couplet ici...\n\nRefrain:\nParoles du refrain ici...\n\nCouplet 2:\nParoles du deuxième couplet...`}
                  className="w-full bg-slate-800 border border-slate-700 p-3 rounded-md text-white font-mono text-xs outline-none focus:border-blue-500 leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddSong(false)}
                  className="px-3.5 py-1.5 rounded-md bg-slate-800 text-slate-300 hover:text-white font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{editingSong ? 'Mettre à jour' : 'Enregistrer'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
