import React, { useState, useEffect } from 'react';
import { Folder, FolderOpen, Save, RefreshCw, CheckCircle2, AlertCircle, Info, HardDrive } from 'lucide-react';

interface DataDirSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataDirChanged?: () => void;
}

export const DataDirSettingsModal: React.FC<DataDirSettingsModalProps> = ({
  isOpen,
  onClose,
  onDataDirChanged
}) => {
  const [currentDir, setCurrentDir] = useState<string>('');
  const [sermonCount, setSermonCount] = useState<number>(0);
  const [dbPath, setDbPath] = useState<string>('');
  const [newPath, setNewPath] = useState<string>('');
  const [moveExisting, setMoveExisting] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    setIsLoading(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/settings/data-dir');
      if (res.ok) {
        const data = await res.json();
        setCurrentDir(data.dataDir || '');
        setNewPath(data.dataDir || '');
        setSermonCount(data.sermonFilesCount || 0);
        setDbPath(data.dbPath || '');
      }
    } catch (err) {
      console.error('Erreur chargement dossier données:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPath.trim()) return;

    setIsLoading(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/settings/data-dir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPath: newPath.trim(), moveExisting })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMsg({ type: 'success', text: data.message || 'Dossier de données mis à jour avec succès.' });
        setCurrentDir(data.dataDir);
        if (onDataDirChanged) {
          onDataDirChanged();
        }
      } else {
        setStatusMsg({ type: 'error', text: data.error || 'Erreur lors de la modification du dossier' });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Échec de la connexion au serveur' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#141a26] border border-white/15 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col text-white">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#192233]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#00d2ff]/10 text-[#00d2ff] border border-[#00d2ff]/30">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Dossier de Données (Bibliothèque)</h3>
              <p className="text-xs text-slate-400">Emplacement de la base de données .db et des brochures .sermon</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg font-bold w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
          
          {/* Info banner ProPresenter style */}
          <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-start gap-3">
            <Info className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-indigo-200 leading-relaxed">
              <span className="font-bold text-white block mb-0.5">Bibliothèque de Contenu Amovible</span>
              Vous pouvez stocker vos fichiers <code className="text-[#00d2ff] bg-black/40 px-1 py-0.5 rounded">sermons.db</code> et <code className="text-[#00d2ff] bg-black/40 px-1 py-0.5 rounded">.sermon</code> dans un dossier personnalisé (ex: clé USB, disque dur externe, ou dossier partagé réseau de l'église).
            </div>
          </div>

          {/* Current Path Overview */}
          <div className="p-4 rounded-xl bg-[#0b0e14] border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-[#00d2ff]" />
                Emplacement Actuel
              </span>
              <span className="text-[#00d2ff] font-bold">{sermonCount} brochure(s) `.sermon`</span>
            </div>
            <div className="font-mono text-xs text-slate-200 bg-black/50 p-2.5 rounded-lg border border-white/5 break-all select-all">
              {currentDir || 'Chargement...'}
            </div>
          </div>

          {/* Form to change directory */}
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                Définir un Nouveau Chemin de Dossier :
              </label>
              <div className="relative flex items-center">
                <Folder className="absolute left-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={newPath}
                  onChange={(e) => setNewPath(e.target.value)}
                  placeholder="Ex: C:\MesBrochuresRégie ou /home/grace/mon_dossier"
                  className="w-full bg-[#0d121c] border border-white/15 pl-9 pr-3 py-2 rounded-xl text-xs font-mono text-white focus:border-[#00d2ff] outline-none transition"
                  required
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Saisissez le chemin d'accès absolu au dossier où vous souhaitez enregistrer vos données.
              </p>
            </div>

            {/* Checkbox move existing files */}
            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition">
              <input
                type="checkbox"
                checked={moveExisting}
                onChange={(e) => setMoveExisting(e.target.checked)}
                className="w-4 h-4 rounded text-[#00d2ff] focus:ring-0 bg-black/40 border-white/20"
              />
              <div className="text-xs">
                <span className="font-bold text-white block">Copier les fichiers existants vers le nouveau dossier</span>
                <span className="text-slate-400 text-[11px]">Transfère automatiquement vos fichiers `.sermon` et `sermons.db` actuels.</span>
              </div>
            </label>

            {/* Notification messages */}
            {statusMsg && (
              <div className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 border ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
              }`}>
                {statusMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                )}
                <span>{statusMsg.text}</span>
              </div>
            )}

            {/* Submit Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-slate-300 transition"
              >
                Fermer
              </button>
              <button
                type="submit"
                disabled={isLoading || !newPath.trim()}
                className="px-5 py-2 rounded-xl text-xs font-black bg-[#00d2ff] hover:bg-[#00b8e6] text-black flex items-center gap-2 transition shadow-lg shadow-[#00d2ff]/20 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Mise à jour...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Appliquer le Nouveau Dossier</span>
                  </>
                )}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};
