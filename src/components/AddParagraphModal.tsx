import React, { useState } from 'react';
import { Sermon } from '../types';
import { Plus, X } from 'lucide-react';

interface AddParagraphModalProps {
  sermon: Sermon;
  defaultNum: number;
  onClose: () => void;
  onSuccess: (num: number) => void;
}

export const AddParagraphModal: React.FC<AddParagraphModalProps> = ({ sermon, defaultNum, onClose, onSuccess }) => {
  const [num, setNum] = useState(defaultNum);
  const [texte, setTexte] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!texte.trim()) return;
    setIsAdding(true);
    try {
      const res = await fetch(`/api/sermons/${encodeURIComponent(sermon.id)}/paragraphes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numero_paragraphe: num, texte })
      });
      if (res.ok) {
        onSuccess(num);
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-[#121620] border border-white/10 rounded-xl p-6 w-full max-w-md space-y-4 shadow-2xl">
        <div className="flex justify-between items-center pb-2 border-b border-white/10">
          <h3 className="text-lg font-bold text-[#00d2ff] flex items-center gap-2">
            <Plus className="w-5 h-5" />
            <span>Ajouter un Paragraphe</span>
          </h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div className="space-y-1">
            <label className="text-slate-400 font-semibold">Numéro du paragraphe :</label>
            <input
              type="number"
              value={num}
              onChange={(e) => setNum(parseInt(e.target.value, 10))}
              className="w-full bg-[#232a3d] text-white border border-white/10 p-2.5 rounded outline-none focus:border-[#00d2ff]"
              required
              min={1}
            />
          </div>
          <div className="space-y-1">
            <label className="text-slate-400 font-semibold">Texte du paragraphe :</label>
            <textarea
              value={texte}
              onChange={(e) => setTexte(e.target.value)}
              rows={5}
              placeholder="Saisissez le texte..."
              className="w-full bg-[#232a3d] text-white border border-white/10 p-2.5 rounded outline-none focus:border-[#00d2ff] resize-none"
              required
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-[#232a3d] text-slate-300 rounded text-xs font-bold hover:bg-[#2a334a]">
            Annuler
          </button>
          <button type="submit" disabled={isAdding} className="px-4 py-2 bg-[#00d2ff] text-black font-extrabold rounded text-xs hover:bg-[#00b8e6]">
            {isAdding ? 'Ajout...' : 'Ajouter'}
          </button>
        </div>
      </form>
    </div>
  );
};
