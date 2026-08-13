import React, { useState, useEffect } from 'react';
import { Sermon, Paragraphe, AgendaItem } from '../types';
import { 
  ListOrdered, Plus, Trash2, Play, ArrowUp, ArrowDown, 
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  sermon: Sermon | null;
  sermons?: Sermon[];
  paragraphes: Paragraphe[];
  onScrollToParagraph: (num: number) => void;
  onSelectSermon?: (sermonId: string) => void;
  onProject?: (sermonId: string, num: number, text: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sermon,
  sermons = [],
  paragraphes,
  onScrollToParagraph,
  onSelectSermon,
  onProject
}) => {
  const [agenda, setAgenda] = useState<AgendaItem[]>(() => {
    try {
      const saved = localStorage.getItem('protext_agenda_culte');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [inputNum, setInputNum] = useState<number>(1);
  const [inputNote, setInputNote] = useState<string>('');
  const [targetSermonId, setTargetSermonId] = useState<string>('');

  useEffect(() => {
    if (sermon) {
      setTargetSermonId(sermon.id);
    }
  }, [sermon]);

  useEffect(() => {
    localStorage.setItem('protext_agenda_culte', JSON.stringify(agenda));
    window.dispatchEvent(new Event('protext_agenda_updated'));
  }, [agenda]);

  useEffect(() => {
    const handleAgendaSync = () => {
      try {
        const saved = localStorage.getItem('protext_agenda_culte');
        if (saved) {
          setAgenda(JSON.parse(saved));
        } else {
          setAgenda([]);
        }
      } catch {
        setAgenda([]);
      }
    };

    window.addEventListener('protext_agenda_updated', handleAgendaSync);
    window.addEventListener('storage', handleAgendaSync);
    return () => {
      window.removeEventListener('protext_agenda_updated', handleAgendaSync);
      window.removeEventListener('storage', handleAgendaSync);
    };
  }, []);

  const handleRemoveItem = (id: string) => {
    setAgenda((prev) => prev.filter((item) => item.id !== id));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setAgenda((prev) => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const handleMoveDown = (index: number) => {
    if (index === agenda.length - 1) return;
    setAgenda((prev) => {
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const handleClearAgenda = () => {
    if (confirm('Voulez-vous réinitialiser l\'agenda du culte ?')) {
      setAgenda([]);
    }
  };

  const handleLaunchItem = (item: AgendaItem, projectDirectly: boolean = false) => {
    if (onSelectSermon && item.sermonId !== sermon?.id) {
      onSelectSermon(item.sermonId);
    }
    setTimeout(() => {
      onScrollToParagraph(item.numero);
      if (projectDirectly && onProject) {
        const p = paragraphes.find((p) => p.numero_paragraphe === item.numero);
        if (p) {
          onProject(item.sermonId, item.numero, p.texte);
        }
      }
    }, 150);
  };

  return (
    <aside className="w-80 bg-[#121620] border-r border-white/10 flex flex-col flex-shrink-0">
      {/* Header Agenda */}
      <div className="p-3 border-b border-white/10 text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between gap-2 bg-[#181d2a]">
        <div className="flex items-center gap-2">
          <ListOrdered className="w-4 h-4 text-[#00d2ff]" />
          <span>AGENDA DU CULTE</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-2 py-1 bg-[#00d2ff]/20 hover:bg-[#00d2ff]/30 text-[#00d2ff] border border-[#00d2ff]/40 rounded text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
            title="Ajouter un passage préparé pour le culte"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ajouter</span>
          </button>
          {agenda.length > 0 && (
            <button
              onClick={handleClearAgenda}
              className="p-1 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded transition cursor-pointer"
              title="Vider l'agenda du culte"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Add Item Form */}
      {showAddForm && (
        <div className="p-3 bg-[#1e2538] border-b border-white/10 space-y-2.5 text-xs animate-fadeIn">
          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">Brochure :</label>
            <select
              value={targetSermonId}
              onChange={(e) => setTargetSermonId(e.target.value)}
              className="w-full bg-[#121620] border border-white/20 rounded p-1.5 text-white text-xs focus:outline-none focus:border-[#00d2ff]"
            >
              {sermons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.titre_francais} ({s.id})
                </option>
              ))}
              {sermons.length === 0 && sermon && (
                <option value={sermon.id}>{sermon.titre_francais} ({sermon.id})</option>
              )}
            </select>
          </div>

          <div className="flex gap-2">
            <div className="w-1/2">
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                {(sermons.find(s => s.id === targetSermonId) || sermon)?.type_structure === 'PAGE' ? 'N° Page' : 'N° Paragraphe'} :
              </label>
              <input
                type="number"
                min="1"
                value={inputNum}
                onChange={(e) => setInputNum(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-[#121620] border border-white/20 rounded p-1.5 text-white font-bold text-xs focus:outline-none focus:border-[#00d2ff]"
              />
            </div>
            <div className="w-1/2">
              <label className="block text-[11px] font-bold text-slate-300 mb-1">Note (Optionnelle) :</label>
              <input
                type="text"
                placeholder="ex: Lecture 1"
                value={inputNote}
                onChange={(e) => setInputNote(e.target.value)}
                className="w-full bg-[#121620] border border-white/20 rounded p-1.5 text-white text-xs focus:outline-none focus:border-[#00d2ff]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-2.5 py-1 bg-[#2b354e] text-slate-300 rounded text-xs font-semibold cursor-pointer"
            >
              Annuler
            </button>
            <button
              onClick={() => {
                const sel = sermons.find(s => s.id === targetSermonId) || sermon;
                if (!sel) return;
                const newItem: AgendaItem = {
                  id: Date.now().toString(),
                  sermonId: sel.id,
                  sermonTitle: sel.titre_francais,
                  numero: inputNum,
                  type_structure: sel.type_structure || 'PARAGRAPHE',
                  note: inputNote.trim() || undefined
                };
                setAgenda(prev => [...prev, newItem]);
                setInputNote('');
                setShowAddForm(false);
              }}
              className="px-3 py-1 bg-[#00d2ff] text-black font-extrabold rounded text-xs hover:bg-[#00b8e6] cursor-pointer"
            >
              Enregistrer
            </button>
          </div>
        </div>
      )}

      {/* Agenda Items List */}
      <div className="p-2 space-y-1.5 max-h-64 overflow-y-auto border-b border-white/10 bg-[#0d1017]/50">
        {agenda.length === 0 ? (
          <div className="py-6 px-3 text-center text-xs text-slate-500 italic">
            Aucun passage programmé.
            <br />
            Cliquez sur <strong className="text-slate-400">+ Ajouter</strong> pour préparer votre culte à l'avance.
          </div>
        ) : (
          agenda.map((item, idx) => {
            const isCurrentSermon = sermon?.id === item.sermonId;
            return (
              <div
                key={item.id}
                className={`p-2 rounded-lg border transition flex items-center justify-between gap-2 text-xs ${
                  isCurrentSermon
                    ? 'bg-[#182238] border-[#00d2ff]/40 text-white shadow-sm'
                    : 'bg-[#151a26] border-white/5 text-slate-300 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="w-5 h-5 rounded-full bg-[#00d2ff]/20 text-[#00d2ff] font-extrabold flex items-center justify-center text-[10px] flex-shrink-0">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-white truncate text-[11px] leading-tight">
                      {item.sermonTitle}
                    </div>
                    <div className="text-[10px] text-cyan-400 font-mono flex items-center gap-1.5 mt-0.5">
                      <span>
                        {item.type_structure === 'PAGE' ? `Page ${item.numero}` : `§ ${item.numero}`}
                      </span>
                      {item.note && (
                        <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1 py-0.2 rounded text-[9px] font-normal">
                          {item.note}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleLaunchItem(item, false)}
                    className="p-1 bg-[#232a3d] hover:bg-[#00d2ff] hover:text-black text-slate-300 rounded transition cursor-pointer"
                    title="Aller à ce passage"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleLaunchItem(item, true)}
                    className="p-1 bg-emerald-600/30 hover:bg-emerald-500 text-emerald-300 hover:text-white rounded border border-emerald-500/40 transition cursor-pointer"
                    title="Projeter immédiatement ce passage"
                  >
                    <Play className="w-3.5 h-3.5" />
                  </button>
                  <div className="flex flex-col gap-0.5 ml-0.5">
                    <button
                      disabled={idx === 0}
                      onClick={() => handleMoveUp(idx)}
                      className="p-0.5 text-slate-500 hover:text-white disabled:opacity-20 cursor-pointer"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      disabled={idx === agenda.length - 1}
                      onClick={() => handleMoveDown(idx)}
                      className="p-0.5 text-slate-500 hover:text-white disabled:opacity-20 cursor-pointer"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className="p-1 text-slate-500 hover:text-rose-400 rounded transition cursor-pointer"
                    title="Supprimer de l'agenda"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Navigation Rapide aux Pages / Paragraphes de la brochure sélectionnée */}
      <div className="p-3 border-b border-white/10 text-xs font-bold uppercase tracking-wider text-slate-400 flex justify-between items-center bg-[#151924]">
        <span>ACCÈS RAPIDE {sermon?.type_structure === 'PAGE' ? 'PAGES' : '§'}</span>
        {paragraphes.length > 0 && (
          <span className="text-[10px] text-cyan-400 font-semibold bg-cyan-500/10 px-1.5 py-0.5 rounded">
            {paragraphes.length} total
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {paragraphes.length === 0 ? (
          <div className="text-center text-xs text-slate-500 py-6">
            Sélectionnez une brochure pour afficher la navigation.
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-1.5">
            {paragraphes.map((p) => (
              <button
                key={p.numero_paragraphe}
                onClick={() => onScrollToParagraph(p.numero_paragraphe)}
                className="bg-[#232a3d] border border-white/10 text-white text-center py-1.5 px-0.5 rounded text-xs font-semibold hover:border-[#00d2ff] hover:text-[#00d2ff] hover:bg-[#00d2ff]/10 transition cursor-pointer"
              >
                {sermon?.type_structure === 'PAGE' ? `P.${p.numero_paragraphe}` : p.numero_paragraphe}
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};

