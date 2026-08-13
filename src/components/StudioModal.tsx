import React, { useState, useEffect, useRef } from 'react';
import { Sermon, Paragraphe } from '../types';
import { Palette, Bold, Italic, Underline, Highlighter, Scissors, Link, ArrowUp, ArrowDown, RefreshCw, Plus, Trash2, Tv, X, Save, Search } from 'lucide-react';
import { getBlocksFromText } from '../utils/textUtils';

interface StudioModalProps {
  sermon: Sermon;
  onClose: () => void;
  onProject: (sermonId: string, num: number, texte: string) => void;
  onDeleteSermon: () => void;
  onOpenEditSermon: () => void;
  onOpenReplaceModal: () => void;
  onOpenAddParaModal: () => void;
}

export const StudioModal: React.FC<StudioModalProps> = ({
  sermon,
  onClose,
  onProject,
  onDeleteSermon,
  onOpenEditSermon,
  onOpenReplaceModal,
  onOpenAddParaModal
}) => {
  const [paragraphes, setParagraphes] = useState<Paragraphe[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [filterText, setFilterText] = useState('');
  const [activeText, setActiveText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fetchParagraphes = async () => {
    try {
      const res = await fetch(`/api/sermons/${encodeURIComponent(sermon.id)}/paragraphes`);
      if (res.ok) {
        const data: Paragraphe[] = await res.json();
        data.forEach(p => {
          p.original_numero = p.numero_paragraphe;
          p.original_texte = p.texte;
        });
        setParagraphes(data);
        if (data.length > 0) {
          setActiveIndex(0);
          setActiveText(data[0].texte);
        }
      }
    } catch (err) {
      console.error("Error fetching studio paragraphs:", err);
    }
  };

  useEffect(() => {
    fetchParagraphes();
  }, [sermon.id]);

  const activePara = paragraphes[activeIndex];

  const handleSelectParagraph = (idx: number) => {
    setActiveIndex(idx);
    setActiveText(paragraphes[idx].texte);
  };

  const handleTextChange = (val: string) => {
    setActiveText(val);
    if (paragraphes[activeIndex]) {
      const updated = [...paragraphes];
      updated[activeIndex].texte = val;
      setParagraphes(updated);
    }
  };

  const insertTag = (startTag: string, endTag: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = activeText.substring(start, end);
    const replacement = startTag + selected + endTag;
    const newText = activeText.substring(0, start) + replacement + activeText.substring(end);
    handleTextChange(newText);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + startTag.length, end + startTag.length);
    }, 50);
  };

  const handleSaveActive = async () => {
    if (!activePara) return;
    setIsSaving(true);
    try {
      const numCible = activePara.original_numero !== undefined ? activePara.original_numero : activePara.numero_paragraphe;
      const res = await fetch(`/api/sermons/${encodeURIComponent(sermon.id)}/paragraphes/${numCible}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nouveau_numero: activePara.numero_paragraphe, texte: activeText })
      });
      if (res.ok) {
        const updated = [...paragraphes];
        updated[activeIndex].original_texte = activeText;
        updated[activeIndex].original_numero = activePara.numero_paragraphe;
        setParagraphes(updated);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSplitAtCursor = async () => {
    const el = textareaRef.current;
    if (!el || !activePara) return;
    const pos = el.selectionStart;
    if (pos <= 0 || pos >= activeText.length) {
      alert("Positionnez votre curseur dans le texte à l'endroit exact où scinder.");
      return;
    }

    try {
      const res = await fetch(`/api/sermons/${encodeURIComponent(sermon.id)}/paragraphes/${activePara.numero_paragraphe}/scinder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position: pos })
      });
      if (res.ok) {
        await fetchParagraphes();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMergeNext = async () => {
    if (!activePara) return;
    try {
      const res = await fetch(`/api/sermons/${encodeURIComponent(sermon.id)}/paragraphes/${activePara.numero_paragraphe}/fusionner`, { method: 'POST' });
      if (res.ok) {
        await fetchParagraphes();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMove = async (direction: 'up' | 'down') => {
    if (!activePara) return;
    try {
      const res = await fetch(`/api/sermons/${encodeURIComponent(sermon.id)}/paragraphes/${activePara.numero_paragraphe}/permuter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction })
      });
      if (res.ok) {
        await fetchParagraphes();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRenumberAll = async () => {
    if (!confirm("Renuméroter tous les paragraphes séquentiellement (1, 2, 3...) ?")) return;
    try {
      const res = await fetch(`/api/sermons/${encodeURIComponent(sermon.id)}/renumeroter`, { method: 'POST' });
      if (res.ok) {
        await fetchParagraphes();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteParagraph = async () => {
    if (!activePara) return;
    if (!confirm(`Supprimer définitivement le paragraphe § ${activePara.numero_paragraphe} ?`)) return;
    try {
      const res = await fetch(`/api/sermons/${encodeURIComponent(sermon.id)}/paragraphes/${activePara.numero_paragraphe}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchParagraphes();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredParas = paragraphes.filter(p => {
    const q = filterText.toLowerCase().trim();
    if (!q) return true;
    return p.numero_paragraphe.toString().includes(q) || p.texte.toLowerCase().includes(q);
  });

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 p-3 flex items-center justify-center">
      <div className="bg-[#0f121a] border border-white/10 rounded-xl w-[98vw] h-[95vh] flex flex-col p-4 space-y-3 shadow-2xl overflow-hidden">
        {/* Studio Top Header */}
        <div className="flex justify-between items-center pb-3 border-b border-white/10">
          <h3 className="text-lg font-bold text-[#00d2ff] flex items-center gap-2">
            <Palette className="w-5 h-5" />
            <span>Studio d'Édition Pro — <span className="text-white">{sermon.titre_francais}</span></span>
          </h3>

          <div className="flex items-center gap-2">
            <button onClick={onOpenEditSermon} className="px-3 py-1.5 bg-[#232a3d] hover:bg-[#2a334a] text-white rounded text-xs font-semibold">
              ✏️ Infos Brochure
            </button>
            <button onClick={onOpenReplaceModal} className="px-3 py-1.5 bg-purple-700 hover:bg-purple-600 text-white rounded text-xs font-semibold flex items-center gap-1">
              <Search className="w-3.5 h-3.5" />
              <span>Remplacer Tout</span>
            </button>
            <button onClick={handleRenumberAll} className="px-3 py-1.5 bg-[#232a3d] hover:bg-[#2a334a] text-white rounded text-xs font-semibold flex items-center gap-1">
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Renuméroter</span>
            </button>
            <button onClick={onOpenAddParaModal} className="px-3 py-1.5 bg-[#0078d4] hover:bg-[#0063b1] text-white rounded text-xs font-semibold flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" />
              <span>Ajouter §</span>
            </button>
            <button onClick={onDeleteSermon} className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-semibold flex items-center gap-1">
              <Trash2 className="w-3.5 h-3.5" />
              <span>Supprimer Brochure</span>
            </button>
            <div className="w-px h-6 bg-white/10 mx-1" />
            <button
              onClick={() => activePara && onProject(sermon.id, activePara.numero_paragraphe, activeText)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold flex items-center gap-1"
            >
              <Tv className="w-3.5 h-3.5" />
              <span>Projeter en Direct</span>
            </button>
            <button onClick={onClose} className="px-3 py-1.5 bg-[#232a3d] hover:bg-rose-600 text-white rounded text-xs font-bold">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Studio Workspace Content */}
        <div className="flex-1 flex gap-3 overflow-hidden">
          {/* Left Paragraph List */}
          <div className="w-72 bg-[#181d2a] rounded-lg p-3 border border-white/10 flex flex-col gap-2">
            <input
              type="text"
              placeholder="🔎 Filtrer..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-full bg-[#232a3d] text-white border border-white/10 px-3 py-1.5 rounded text-xs outline-none focus:border-[#00d2ff]"
            />
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {filteredParas.map((p) => {
                const globalIdx = paragraphes.findIndex((item) => item.numero_paragraphe === p.numero_paragraphe);
                const isSelected = globalIdx === activeIndex;
                const isModified = p.texte !== p.original_texte || p.numero_paragraphe !== p.original_numero;

                return (
                  <div
                    key={p.numero_paragraphe}
                    onClick={() => handleSelectParagraph(globalIdx)}
                    className={`p-2.5 rounded text-xs cursor-pointer transition border-l-4 ${
                      isSelected
                        ? 'bg-[#2563eb] text-white border-[#00d2ff] font-bold shadow'
                        : 'bg-[#121620] text-slate-300 border-transparent hover:bg-[#232a3d]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>§ {p.numero_paragraphe}</span>
                      {isModified && <span className="text-amber-400 font-bold text-xs">● Modifié</span>}
                    </div>
                    <div className="text-[11px] text-slate-400 font-normal truncate mt-0.5">
                      {p.texte}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Center Text Editor */}
          <div className="flex-1 bg-[#181d2a] rounded-lg p-4 border border-white/10 flex flex-col gap-3">
            {/* Toolbar */}
            <div className="flex items-center gap-2 bg-[#121620] p-2 rounded border border-white/10 text-xs flex-wrap">
              <span className="font-bold text-slate-400 text-[11px] mr-1">FORMATAGE :</span>
              <button onClick={() => insertTag('**', '**')} className="p-1.5 bg-[#232a3d] hover:bg-[#2a334a] rounded text-white font-bold" title="Gras">
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => insertTag('*', '*')} className="p-1.5 bg-[#232a3d] hover:bg-[#2a334a] rounded text-white" title="Italique">
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => insertTag('<u>', '</u>')} className="p-1.5 bg-[#232a3d] hover:bg-[#2a334a] rounded text-white" title="Souligné">
                <Underline className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => insertTag('<mark>', '</mark>')} className="p-1.5 bg-amber-400 text-black hover:bg-amber-300 rounded font-bold" title="Surligner">
                <Highlighter className="w-3.5 h-3.5" />
              </button>

              <div className="w-px h-5 bg-white/10 mx-1" />

              <span className="font-bold text-slate-400 text-[11px] mr-1">STRUCTURE :</span>
              <button onClick={handleSplitAtCursor} className="px-2.5 py-1 bg-[#232a3d] hover:bg-[#2a334a] text-white rounded flex items-center gap-1 font-semibold">
                <Scissors className="w-3.5 h-3.5 text-[#00d2ff]" />
                <span>Scinder</span>
              </button>
              <button onClick={handleMergeNext} className="px-2.5 py-1 bg-[#232a3d] hover:bg-[#2a334a] text-white rounded flex items-center gap-1 font-semibold">
                <Link className="w-3.5 h-3.5 text-[#00d2ff]" />
                <span>Fusionner suivant</span>
              </button>
              <button onClick={() => handleMove('up')} className="p-1.5 bg-[#232a3d] hover:bg-[#2a334a] text-white rounded" title="Déplacer vers le haut">
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => handleMove('down')} className="p-1.5 bg-[#232a3d] hover:bg-[#2a334a] text-white rounded" title="Déplacer vers le bas">
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="font-extrabold text-[#00d2ff] text-base">
                Édition du § {activePara?.numero_paragraphe || '-'}
              </span>
              <span className="text-slate-400 font-medium">
                {activeText.length} caractères | {activeText.trim() ? activeText.trim().split(/\s+/).length : 0} mots
              </span>
            </div>

            <textarea
              ref={textareaRef}
              value={activeText}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Sélectionnez un paragraphe pour éditer..."
              className="flex-1 bg-[#0a0c10] text-white font-mono text-sm leading-relaxed p-4 rounded-md border border-white/10 outline-none focus:border-[#00d2ff] resize-none"
            />

            <div className="flex justify-between items-center">
              <button onClick={handleDeleteParagraph} className="px-3 py-2 bg-rose-600/20 text-rose-400 hover:bg-rose-600 hover:text-white rounded text-xs font-bold transition">
                🗑️ Supprimer ce §
              </button>
              <button
                onClick={handleSaveActive}
                disabled={isSaving}
                className="px-6 py-2 bg-[#00d2ff] hover:bg-[#00b8e6] text-black font-extrabold rounded text-xs flex items-center gap-1.5 shadow-lg transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Enregistrement...' : 'Enregistrer Paragraphe'}</span>
              </button>
            </div>
          </div>

          {/* Right Screen Simulation */}
          <div className="w-96 bg-black rounded-lg border-2 border-white/10 flex flex-col overflow-hidden">
            <div className="bg-[#121620] text-slate-400 text-xs font-bold py-2 px-3 flex justify-between items-center border-b border-white/10 tracking-wider uppercase">
              <span>📺 APERÇU ÉCRAN DE PROJECTION</span>
              {getBlocksFromText(activeText).length > 1 && (
                <span className="text-[#00d2ff] font-extrabold text-[10px] bg-[#00d2ff]/10 px-2 py-0.5 rounded">
                  {getBlocksFromText(activeText).length} BLOCS
                </span>
              )}
            </div>
            <div className="flex-1 p-4 flex flex-col space-y-3 overflow-y-auto">
              <div className="text-[#00d2ff] font-extrabold text-sm text-center border-b border-white/10 pb-2">
                {sermon.type_structure === 'PAGE' ? `PAGE ${activePara?.numero_paragraphe || '1'}` : `PARAGRAPHE ${activePara?.numero_paragraphe || '1'}`}
              </div>

              {getBlocksFromText(activeText).length > 0 ? (
                getBlocksFromText(activeText).map((blk, idx) => (
                  <div
                    key={idx}
                    onClick={() => onProject(sermon.id, activePara?.numero_paragraphe || 1, blk)}
                    className="group bg-[#121620] hover:bg-[#1a202c] border border-white/10 hover:border-[#00d2ff] p-3 rounded-md transition cursor-pointer text-left space-y-1"
                  >
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase">
                      <span>Bloc {idx + 1} / {getBlocksFromText(activeText).length}</span>
                      <span className="text-[#00d2ff] opacity-0 group-hover:opacity-100 transition-opacity">
                        📺 PROJETER
                      </span>
                    </div>
                    <p className="text-white text-xs leading-relaxed font-medium">
                      {blk}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-slate-500 italic text-xs text-center py-10">
                  Aucun contenu à afficher
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
