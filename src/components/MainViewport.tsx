import React, { useState, useEffect } from 'react';
import { Sermon, Paragraphe, ProjectedData, AgendaItem } from '../types';
import { Tv, BookOpen, ZoomIn, ZoomOut, RotateCcw, CalendarPlus, Check } from 'lucide-react';
import { getBlocksFromText } from '../utils/textUtils';

interface MainViewportProps {
  sermon: Sermon | null;
  paragraphes: Paragraphe[];
  searchResults: { sermons: Sermon[]; paragraphes: Paragraphe[] } | null;
  searchQuery: string;
  projectedState: ProjectedData | null;
  onProject: (sermonId: string, num: number | string, texte: string, isExtrait?: boolean, blockIndex?: number | null, totalBlocks?: number | null) => void;
  onSelectSermon: (id: string) => void;
}

export const MainViewport: React.FC<MainViewportProps> = ({
  sermon,
  paragraphes,
  searchResults,
  searchQuery,
  projectedState,
  onProject,
  onSelectSermon
}) => {
  const [selectedText, setSelectedText] = useState<{ text: string; top: number; left: number } | null>(null);
  const [fontSize, setFontSize] = useState<number>(() => {
    const saved = localStorage.getItem('protext_viewport_font_size');
    return saved ? Number(saved) : 15;
  });

  const [agenda, setAgenda] = useState<AgendaItem[]>(() => {
    try {
      const saved = localStorage.getItem('protext_agenda_culte');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const handleSync = () => {
      try {
        const saved = localStorage.getItem('protext_agenda_culte');
        setAgenda(saved ? JSON.parse(saved) : []);
      } catch {
        setAgenda([]);
      }
    };
    window.addEventListener('protext_agenda_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('protext_agenda_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const isInAgenda = (sermonId: string, numero: number) => {
    return agenda.some((item) => item.sermonId === sermonId && item.numero === numero);
  };

  const handleToggleAgenda = (sermonId: string, sermonTitle: string, numero: number, type_structure?: 'PARAGRAPHE' | 'PAGE') => {
    try {
      const saved = localStorage.getItem('protext_agenda_culte');
      const current: AgendaItem[] = saved ? JSON.parse(saved) : [];
      const exists = current.some((item) => item.sermonId === sermonId && item.numero === numero);

      let updated: AgendaItem[];
      if (exists) {
        updated = current.filter((item) => !(item.sermonId === sermonId && item.numero === numero));
      } else {
        const newItem: AgendaItem = {
          id: Date.now().toString(),
          sermonId,
          sermonTitle,
          numero,
          type_structure: type_structure || 'PARAGRAPHE'
        };
        updated = [...current, newItem];
      }
      localStorage.setItem('protext_agenda_culte', JSON.stringify(updated));
      setAgenda(updated);
      window.dispatchEvent(new Event('protext_agenda_updated'));
    } catch (e) {
      console.error("Erreur lors de la mise à jour de l'agenda", e);
    }
  };

  const handleFontSizeChange = (size: number) => {
    setFontSize(size);
    localStorage.setItem('protext_viewport_font_size', String(size));
  };

  useEffect(() => {
    const handleMouseUp = () => {
      const selection = window.getSelection();
      const txt = selection?.toString().trim();
      if (txt && txt.length > 3) {
        const range = selection?.getRangeAt(0);
        const rect = range?.getBoundingClientRect();
        if (rect) {
          setSelectedText({
            text: txt,
            top: rect.top + window.scrollY,
            left: rect.left + rect.width / 2 + window.scrollX
          });
        }
      } else {
        setSelectedText(null);
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const handleProjectSelectedText = () => {
    if (selectedText) {
      onProject(sermon?.id || 'EXTRAIT', 'EXTRAIT', selectedText.text, true);
      setSelectedText(null);
    }
  };

  return (
    <main className="flex-1 flex flex-col bg-[#0a0c10] overflow-hidden relative">
      <div className="px-5 py-2.5 bg-[#121620] border-b border-white/10 flex flex-wrap justify-between items-center flex-shrink-0 gap-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-slate-400 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#00d2ff]" />
            <span className="hidden sm:inline">FLUX DU SERMON EN DIRECT</span>
          </span>
          <span className="text-xs text-slate-500 font-medium border-l border-white/10 pl-3">
            {searchQuery ? `Résultats pour "${searchQuery}"` : `${paragraphes.length} paragraphes`}
          </span>
        </div>

        {/* Curseur de Taille du Texte */}
        <div className="flex items-center gap-2 bg-[#181d2a] px-3 py-1 rounded-lg border border-white/10 shadow-inner">
          <button
            onClick={() => handleFontSizeChange(Math.max(12, fontSize - 1))}
            className="text-slate-400 hover:text-white transition p-0.5 cursor-pointer"
            title="Diminuer la taille (Min 12px)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <input
            type="range"
            min="12"
            max="32"
            step="1"
            value={fontSize}
            onChange={(e) => handleFontSizeChange(Number(e.target.value))}
            className="w-20 sm:w-28 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#00d2ff]"
          />
          <button
            onClick={() => handleFontSizeChange(Math.min(32, fontSize + 1))}
            className="text-slate-400 hover:text-white transition p-0.5 cursor-pointer"
            title="Augmenter la taille (Max 32px)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-bold text-[#00d2ff] min-w-[32px] text-center select-none">
            {fontSize}px
          </span>
          {fontSize !== 15 && (
            <button
              onClick={() => handleFontSizeChange(15)}
              className="text-slate-400 hover:text-cyan-400 transition p-0.5 border-l border-white/10 pl-1.5 cursor-pointer"
              title="Réinitialiser (15px)"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4 max-w-5xl mx-auto w-full">
        {/* Selection Popover */}
        {selectedText && (
          <button
            onClick={handleProjectSelectedText}
            style={{ top: `${selectedText.top - 45}px`, left: `${selectedText.left}px` }}
            className="fixed transform -translate-x-1/2 bg-[#2563eb] text-white px-3.5 py-1.5 rounded-md text-xs font-bold shadow-2xl hover:brightness-110 transition z-50 cursor-pointer animate-fade-in"
          >
            🎯 Projeter L'Extrait Sélectionné
          </button>
        )}

        {/* Global Search Results Mode */}
        {searchQuery && searchResults ? (
          <div className="space-y-4">
            {searchResults.sermons.length > 0 && (
              <div className="bg-[#121620] p-4 rounded-lg border border-white/10 space-y-2">
                <div className="text-sm font-bold text-[#00d2ff] mb-2">
                  📚 {searchResults.sermons.length} brochure(s) trouvée(s) :
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {searchResults.sermons.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => onSelectSermon(s.id)}
                      className="bg-[#181d2a] p-3 rounded-md border border-white/10 hover:border-[#00d2ff] transition cursor-pointer flex justify-between items-center"
                    >
                      <div>
                        <div className="font-bold text-white text-sm">{s.titre_francais}</div>
                        <div className="text-xs text-slate-400 mt-1">
                          Code: <strong>{s.id}</strong> {s.date_sermon ? `| Date: ${s.date_sermon}` : ''}
                        </div>
                      </div>
                      <span className="bg-[#2a334a] text-xs px-2.5 py-1 rounded text-white font-semibold">Ouvrir</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {searchResults.paragraphes.length > 0 ? (
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Paragraphes correspondants ({searchResults.paragraphes.length})
                </div>
                {searchResults.paragraphes.map((p, idx) => (
                  <div key={idx} className="bg-[#181d2a] border border-white/10 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-center pb-2 border-b border-white/10">
                      <span className="text-sm font-extrabold text-[#00d2ff]">
                        {p.titre_francais || p.sermon_id} - § {p.numero_paragraphe}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleAgenda(p.sermon_id, p.titre_francais || p.sermon_id, p.numero_paragraphe, p.type_structure)}
                          className={`p-1.5 rounded transition cursor-pointer flex items-center justify-center border ${
                            isInAgenda(p.sermon_id, p.numero_paragraphe)
                              ? 'bg-[#00d2ff]/20 text-[#00d2ff] border-[#00d2ff]/50 shadow-[0_0_8px_rgba(0,210,255,0.2)]'
                              : 'bg-white/5 hover:bg-[#00d2ff]/10 text-slate-400 hover:text-white border-white/10'
                          }`}
                          title={
                            isInAgenda(p.sermon_id, p.numero_paragraphe)
                              ? "Présent dans l'agenda du culte (Cliquer pour retirer)"
                              : "Ajouter à l'agenda du culte"
                          }
                        >
                          {isInAgenda(p.sermon_id, p.numero_paragraphe) ? (
                            <Check className="w-4 h-4 text-[#00d2ff]" />
                          ) : (
                            <CalendarPlus className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => onProject(p.sermon_id, p.numero_paragraphe, p.texte)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded flex items-center gap-1 transition cursor-pointer"
                        >
                          <Tv className="w-3.5 h-3.5" />
                          <span>Projeter</span>
                        </button>
                      </div>
                    </div>
                    <p className="text-slate-200 leading-relaxed" style={{ fontSize: `${fontSize}px`, lineHeight: '1.6' }}>{p.texte}</p>
                  </div>
                ))}
              </div>
            ) : searchResults.sermons.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                Aucune brochure ni paragraphe ne correspond à "{searchQuery}".
              </div>
            ) : null}
          </div>
        ) : (
          /* Normal Sermon Paragraph Feed */
          paragraphes.map((p) => {
            const isPageMode = sermon?.type_structure === 'PAGE';
            const isLiveActive =
              projectedState &&
              projectedState.sermonId !== 'BLACK' &&
              projectedState.animPhase !== 'EXITING' &&
              projectedState.animPhase !== 'OUT' &&
              Boolean(projectedState.texte);

            const isFullProjected =
              isLiveActive &&
              projectedState.sermonId === sermon?.id &&
              String(projectedState.numero) === String(p.numero_paragraphe) &&
              !projectedState.blockIndex;

            const blocks = getBlocksFromText(p.texte);

            return (
              <div
                key={p.numero_paragraphe}
                id={`para-card-${p.numero_paragraphe}`}
                className={`bg-[#181d2a] border rounded-lg p-4 transition shadow-lg ${
                  isFullProjected
                    ? 'border-emerald-500 bg-emerald-950/20 shadow-emerald-500/20'
                    : 'border-white/10 hover:border-[#00d2ff]/40'
                }`}
              >
                <div className="flex justify-between items-center mb-3 pb-2 border-b border-white/10">
                  <span className="text-sm font-extrabold text-[#00d2ff] flex items-center gap-2">
                    {isPageMode ? `Page ${p.numero_paragraphe}` : `§ ${p.numero_paragraphe}`}
                    {blocks.length > 1 && (
                      <span className="text-xs text-slate-400 font-normal">
                        ({blocks.length} blocs)
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleAgenda(sermon!.id, sermon!.titre_francais, p.numero_paragraphe, sermon?.type_structure)}
                      className={`p-1.5 rounded transition cursor-pointer flex items-center justify-center border ${
                        isInAgenda(sermon!.id, p.numero_paragraphe)
                          ? 'bg-[#00d2ff]/20 text-[#00d2ff] border-[#00d2ff]/50 shadow-[0_0_8px_rgba(0,210,255,0.2)]'
                          : 'bg-white/5 hover:bg-[#00d2ff]/10 text-slate-400 hover:text-white border-white/10'
                      }`}
                      title={
                        isInAgenda(sermon!.id, p.numero_paragraphe)
                          ? "Présent dans l'agenda du culte (Cliquer pour retirer)"
                          : "Ajouter à l'agenda du culte"
                      }
                    >
                      {isInAgenda(sermon!.id, p.numero_paragraphe) ? (
                        <Check className="w-4 h-4 text-[#00d2ff]" />
                      ) : (
                        <CalendarPlus className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      onClick={() => onProject(sermon!.id, p.numero_paragraphe, p.texte, false, null, null)}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded flex items-center gap-1 transition cursor-pointer"
                    >
                      <Tv className="w-3.5 h-3.5" />
                      <span>{isPageMode ? 'Projeter la Page' : 'Projeter Tout'}</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {blocks.map((blockText, blockIdx) => {
                    const isBlockProjected =
                      isLiveActive &&
                      projectedState.sermonId === sermon?.id &&
                      String(projectedState.numero) === String(p.numero_paragraphe) &&
                      projectedState.blockIndex === blockIdx + 1;

                    return (
                      <div
                        key={blockIdx}
                        onClick={() =>
                          onProject(sermon!.id, p.numero_paragraphe, blockText.trim(), true, blockIdx + 1, blocks.length)
                        }
                        style={{ fontSize: `${fontSize}px`, lineHeight: '1.6' }}
                        className={`group relative p-3 rounded-md border-l-4 transition cursor-pointer leading-relaxed ${
                          isBlockProjected
                            ? 'bg-emerald-500/20 border-emerald-400 text-white font-medium shadow-[0_0_12px_rgba(46,213,115,0.2)]'
                            : 'bg-white/[0.02] border-transparent hover:bg-[#00d2ff]/10 hover:border-[#00d2ff] text-slate-200'
                        }`}
                      >
                        {blockText.trim()}

                        <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="bg-[#2563eb] text-white text-[10px] font-extrabold px-2 py-1 rounded shadow">
                            📺 PROJETER BLOC {blockIdx + 1}/{blocks.length}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </main>
  );
};
