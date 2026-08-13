import React, { useState } from 'react';
import { Database, Download, Upload, Sparkles, X, CheckCircle, AlertCircle, FileCode, Archive, ShieldCheck } from 'lucide-react';

interface DatabaseModalProps {
  onClose: () => void;
  onRefreshSermons: () => void;
}

export const DatabaseModal: React.FC<DatabaseModalProps> = ({ onClose, onRefreshSermons }) => {
  const [dbFile, setDbFile] = useState<File | null>(null);
  const [sermonFile, setSermonFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleExportDb = () => {
    window.open('/api/db/export', '_blank');
  };

  const handleExportZip = () => {
    window.open('/api/sermons/export-zip', '_blank');
  };

  const handleImportSingleSermon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sermonFile) {
      setStatusMsg({ type: 'error', text: "Veuillez choisir un fichier .sermon ou .json." });
      return;
    }

    setIsLoading(true);
    setStatusMsg(null);

    const formData = new FormData();
    formData.append('sermonFile', sermonFile);

    try {
      const res = await fetch('/api/sermons/import-file', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMsg({
          type: 'success',
          text: `🎉 Brochure "${data.title}" (${data.id}) importée/réparée avec succès avec ${data.count} paragraphe(s) !`
        });
        setSermonFile(null);
        onRefreshSermons();
      } else {
        setStatusMsg({ type: 'error', text: data.error || "Échec de l'importation de la brochure." });
      }
    } catch {
      setStatusMsg({ type: 'error', text: "Erreur lors de l'envoi du fichier brochure." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReclean = async () => {
    setIsLoading(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/sermons/reclean', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMsg({
          type: 'success',
          text: `✨ Format nettoyé et embellit avec succès (${data.count} paragraphe(s) mis à jour) !`
        });
        onRefreshSermons();
      } else {
        setStatusMsg({ type: 'error', text: data.error || "Erreur lors du nettoyage." });
      }
    } catch {
      setStatusMsg({ type: 'error', text: "Échec de connexion au serveur." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreDbSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dbFile) {
      setStatusMsg({ type: 'error', text: "Veuillez sélectionner un fichier .db de sauvegarde." });
      return;
    }

    setIsLoading(true);
    setStatusMsg(null);

    const formData = new FormData();
    formData.append('db', dbFile);

    try {
      const res = await fetch('/api/db/import', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMsg({
          type: 'success',
          text: "🎉 Base de données globale restaurée avec succès !"
        });
        onRefreshSermons();
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setStatusMsg({ type: 'error', text: data.error || "Restauration échouée." });
      }
    } catch {
      setStatusMsg({ type: 'error', text: "Échec de l'importation de la base de données." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#121620] border border-white/10 rounded-xl p-6 w-full max-w-xl space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center pb-2 border-b border-white/10">
          <h3 className="text-lg font-bold text-[#00d2ff] flex items-center gap-2">
            <Database className="w-5 h-5" />
            <span>Gestion des Fichiers & Base de Données</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security Banner */}
        <div className="p-3 bg-[#00d2ff]/10 border border-[#00d2ff]/30 rounded-lg flex items-start gap-2.5 text-xs text-[#00d2ff]">
          <ShieldCheck className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="block text-white font-bold mb-0.5">Stockage Indépendant par Brochure (.sermon)</strong>
            <span>Chaque brochure possède son propre fichier indépendant dans <code className="bg-black/30 px-1 py-0.5 rounded text-white">/sermons_data</code>. En cas de souci sur une brochure, vous pouvez retravailler ou ré-importer uniquement le fichier de cette brochure sans risquer de perdre les 2000 autres !</span>
          </div>
        </div>

        {statusMsg && (
          <div
            className={`p-3 rounded-lg text-xs font-semibold flex items-start gap-2 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        <div className="space-y-4">
          {/* Section 1: Import Single Sermon File */}
          <form onSubmit={handleImportSingleSermon} className="bg-[#181d2a] p-4 rounded-lg border border-white/10 space-y-3">
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <FileCode className="w-4 h-4 text-[#00d2ff]" />
              <span>Importer / Réparer une Brochure Unique (.sermon / .json)</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Téléversez le fichier dédié d&apos;une seule brochure pour l&apos;ajouter ou la mettre à jour instantanément, sans toucher à vos autres brochures.
            </p>

            <input
              type="file"
              accept=".sermon,.json"
              id="sermon-single-file"
              className="hidden"
              onChange={(e) => setSermonFile(e.target.files?.[0] || null)}
            />
            <label
              htmlFor="sermon-single-file"
              className="block p-3 border border-dashed border-white/20 rounded text-center cursor-pointer hover:border-[#00d2ff] transition text-xs"
            >
              {sermonFile ? (
                <span className="font-bold text-[#00d2ff]">{sermonFile.name}</span>
              ) : (
                <span className="text-slate-400">Cliquez pour choisir un fichier brochure (.sermon)</span>
              )}
            </label>

            <button
              type="submit"
              disabled={isLoading || !sermonFile}
              className="w-full py-2 bg-[#00d2ff] hover:bg-[#00b8e6] text-black font-extrabold text-xs rounded transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              <span>{isLoading ? 'Importation...' : 'Importer cette Brochure'}</span>
            </button>
          </form>

          {/* Section 2: Export All Sermons as ZIP */}
          <div className="bg-[#181d2a] p-4 rounded-lg border border-white/10 space-y-2">
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <Archive className="w-4 h-4 text-emerald-400" />
              <span>Sauvegarder Toutes les Brochures (.ZIP Fichiers Dédiés)</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Téléchargez une archive ZIP contenant un fichier .sermon individuel pour chaque brochure de votre bibliothèque.
            </p>
            <button
              onClick={handleExportZip}
              className="mt-1 w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Télécharger toutes_les_brochures_sermons.zip</span>
            </button>
          </div>

          {/* Section 3: Format Reclean */}
          <div className="bg-[#181d2a] p-4 rounded-lg border border-white/10 space-y-2">
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Nettoyer et Embellir le Format de Toutes les Brochures</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Recolle les mots coupés, ajuste les apostrophes et supprime les espaces superflus dans l&apos;ensemble des fichiers brochures.
            </p>
            <button
              onClick={handleReclean}
              disabled={isLoading}
              className="mt-1 w-full py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isLoading ? 'Nettoyage en cours...' : 'Embellir le format de toutes les brochures'}</span>
            </button>
          </div>

          {/* Section 4: Full SQLite DB Backup & Restore */}
          <form onSubmit={handleRestoreDbSubmit} className="bg-[#181d2a] p-4 rounded-lg border border-white/10 space-y-3">
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-400" />
              <span>Base de Données SQLite Global (.db)</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Option de sauvegarde / restauration de la base globale SQLite.
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleExportDb}
                className="py-2 bg-[#2563eb] hover:bg-blue-600 text-white font-bold text-xs rounded transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exporter .db</span>
              </button>

              <div>
                <input
                  type="file"
                  accept=".db,.sqlite,.sqlite3"
                  id="db-file-input"
                  className="hidden"
                  onChange={(e) => setDbFile(e.target.files?.[0] || null)}
                />
                <label
                  htmlFor="db-file-input"
                  className="block py-2 px-2 border border-dashed border-white/20 rounded text-center cursor-pointer hover:border-[#00d2ff] transition text-xs font-semibold text-slate-300 truncate"
                >
                  {dbFile ? dbFile.name : 'Choisir un .db'}
                </label>
              </div>
            </div>

            {dbFile && (
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                <span>Restauration Globale .db</span>
              </button>
            )}
          </form>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#232a3d] hover:bg-[#2a334a] text-slate-300 rounded text-xs font-bold cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

