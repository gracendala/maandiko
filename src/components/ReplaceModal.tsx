import React, { useState } from 'react';
import { Sermon } from '../types';
import { Search, X } from 'lucide-react';

interface ReplaceModalProps {
  sermon: Sermon;
  onClose: () => void;
  onSuccess: (count: number) => void;
}

export const ReplaceModal: React.FC<ReplaceModalProps> = ({ sermon, onClose, onSuccess }) => {
  const [searchText, setSearchText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchText.trim()) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/sermons/${encodeURIComponent(sermon.id)}/remplacer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recherche: searchText, remplacement: replaceText })
      });
      const data = await res.json();
      if (res.ok) {
        onSuccess(data.count || 0);
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-[#121620] border border-white/10 rounded-xl p-6 w-full max-w-md space-y-4 shadow-2xl">
        <div className="flex justify-between items-center pb-2 border-b border-white/10">
          <h3 className="text-lg font-bold text-purple-400 flex items-center gap-2">
            <Search className="w-5 h-5" />
            <span>Rechercher & Remplacer Tout</span>
          </h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div className="space-y-1">
            <label className="text-slate-400 font-semibold">Texte à rechercher :</label>
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Ex: Frere Branham"
              className="w-full bg-[#232a3d] text-white border border-white/10 p-2.5 rounded outline-none focus:border-purple-400"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-slate-400 font-semibold">Remplacer par :</label>
            <input
              type="text"
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              placeholder="Ex: Frère Branham"
              className="w-full bg-[#232a3d] text-white border border-white/10 p-2.5 rounded outline-none focus:border-purple-400"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-[#232a3d] text-slate-300 rounded text-xs font-bold hover:bg-[#2a334a]">
            Annuler
          </button>
          <button type="submit" disabled={isProcessing} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded text-xs">
            {isProcessing ? 'Remplacement...' : 'Remplacer Tout'}
          </button>
        </div>
      </form>
    </div>
  );
};
