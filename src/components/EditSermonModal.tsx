import React, { useState } from 'react';
import { Sermon } from '../types';
import { Edit3, X, Trash2 } from 'lucide-react';

interface EditSermonModalProps {
  sermon: Sermon;
  onClose: () => void;
  onSuccess: () => void;
  onDeleteSermon?: () => void;
}

export const EditSermonModal: React.FC<EditSermonModalProps> = ({ sermon, onClose, onSuccess, onDeleteSermon }) => {
  const [title, setTitle] = useState(sermon.titre_francais || '');
  const [dateSermon, setDateSermon] = useState(sermon.date_sermon || '');
  const [lieu, setLieu] = useState(sermon.lieu || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch(`/api/sermons/${encodeURIComponent(sermon.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titre_francais: title, date_sermon: dateSermon, lieu })
      });
      if (res.ok) {
        onSuccess();
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-[#121620] border border-white/10 rounded-xl p-6 w-full max-w-md space-y-4 shadow-2xl">
        <div className="flex justify-between items-center pb-2 border-b border-white/10">
          <h3 className="text-lg font-bold text-[#00d2ff] flex items-center gap-2">
            <Edit3 className="w-5 h-5" />
            <span>Éditer Informations Brochure</span>
          </h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div className="space-y-1">
            <label className="text-slate-400 font-semibold">Titre de la brochure :</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#232a3d] text-white border border-white/10 p-2.5 rounded outline-none focus:border-[#00d2ff]"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-slate-400 font-semibold">Date :</label>
            <input
              type="text"
              value={dateSermon}
              onChange={(e) => setDateSermon(e.target.value)}
              className="w-full bg-[#232a3d] text-white border border-white/10 p-2.5 rounded outline-none focus:border-[#00d2ff]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-slate-400 font-semibold">Lieu :</label>
            <input
              type="text"
              value={lieu}
              onChange={(e) => setLieu(e.target.value)}
              className="w-full bg-[#232a3d] text-white border border-white/10 p-2.5 rounded outline-none focus:border-[#00d2ff]"
            />
          </div>
        </div>

        <div className="flex justify-between items-center gap-2 pt-3 border-t border-white/10">
          {onDeleteSermon ? (
            <button
              type="button"
              onClick={() => onDeleteSermon()}
              className="px-3 py-2 bg-rose-600/90 hover:bg-rose-600 text-white rounded text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Supprimer la brochure</span>
            </button>
          ) : <div />}

          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-[#232a3d] text-slate-300 rounded text-xs font-bold hover:bg-[#2a334a]">
              Annuler
            </button>
            <button type="submit" disabled={isSaving} className="px-4 py-2 bg-[#00d2ff] text-black font-extrabold rounded text-xs hover:bg-[#00b8e6]">
              {isSaving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
