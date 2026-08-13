import React, { useState, useEffect } from 'react';
import { GoogleDriveFile } from '../types';
import { Cloud, Search, Download, ExternalLink, X, AlertCircle } from 'lucide-react';

interface GoogleDriveModalProps {
  onClose: () => void;
  onImportSuccess: (sermonId: string) => void;
}

export const GoogleDriveModal: React.FC<GoogleDriveModalProps> = ({ onClose, onImportSuccess }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [files, setFiles] = useState<GoogleDriveFile[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [importingFileId, setImportingFileId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Check if OAuth token exists or trigger OAuth flow
  useEffect(() => {
    // In AI Studio preview environment with OAuth enabled:
    // We can fetch or test drive API with window location or backend credentials
    fetchDriveFiles();
  }, []);

  const fetchDriveFiles = async (searchTerm = '') => {
    setLoading(true);
    setErrorMsg('');
    try {
      // Pass authorization header if present in localStorage or session
      const storedToken = localStorage.getItem('gdrive_token');
      const headers: Record<string, string> = {};
      if (storedToken) {
        headers['Authorization'] = `Bearer ${storedToken}`;
      }

      const res = await fetch(`/api/gdrive/files?q=${encodeURIComponent(searchTerm)}`, { headers });
      const data = await res.json();

      if (res.ok) {
        setFiles(data.files || []);
      } else if (res.status === 401) {
        setErrorMsg('Veuillez vous connecter à Google Drive pour autoriser l\'accès à vos fichiers PDF.');
      } else {
        setErrorMsg(data.error || 'Impossible de lire les fichiers Google Drive.');
      }
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Erreur de connexion à Google Drive');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectToken = () => {
    const token = prompt("Entrez votre jeton d'accès Google OAuth (ou connectez-vous) :");
    if (token) {
      localStorage.setItem('gdrive_token', token);
      setAccessToken(token);
      fetchDriveFiles(query);
    }
  };

  const handleImportDriveFile = async (file: GoogleDriveFile) => {
    setImportingFileId(file.id);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const storedToken = localStorage.getItem('gdrive_token') || '';
      const res = await fetch('/api/gdrive/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${storedToken}`
        },
        body: JSON.stringify({
          fileId: file.id,
          fileName: file.name
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(`✅ Brochure "${data.title}" (${data.id}) importée avec succès ! (${data.count} §)`);
        onImportSuccess(data.id);
      } else {
        setErrorMsg(data.error || 'Erreur lors de l\'importation Google Drive.');
      }
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Erreur d\'importation');
    } finally {
      setImportingFileId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#121620] border border-white/10 rounded-xl p-6 w-full max-w-2xl space-y-4 shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex justify-between items-center pb-2 border-b border-white/10">
          <h3 className="text-lg font-bold text-[#4285F4] flex items-center gap-2">
            <Cloud className="w-5 h-5" />
            <span>Google Drive — Importer des PDF</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchDriveFiles(query)}
              placeholder="Rechercher des fichiers PDF dans votre Google Drive..."
              className="w-full bg-[#232a3d] text-white border border-white/10 pl-9 pr-3 py-2 rounded text-xs outline-none focus:border-[#4285F4]"
            />
          </div>
          <button
            onClick={() => fetchDriveFiles(query)}
            className="px-4 py-2 bg-[#4285F4] hover:bg-[#3367d6] text-white rounded text-xs font-bold transition"
          >
            Rechercher
          </button>
          <button
            onClick={handleConnectToken}
            className="px-3 py-2 bg-[#232a3d] hover:bg-[#2a334a] text-slate-300 rounded text-xs font-semibold"
            title="Saisir jeton d'accès OAuth"
          >
            Clé OAuth
          </button>
        </div>

        {errorMsg && (
          <div className="bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-400 rounded flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-400 rounded">
            {successMsg}
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[250px]">
          {loading ? (
            <div className="text-center py-12 text-slate-400 text-xs animate-pulse">
              Chargement des fichiers Google Drive...
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              Aucun fichier PDF trouvé. Essayez une autre recherche.
            </div>
          ) : (
            files.map((file) => (
              <div
                key={file.id}
                className="bg-[#181d2a] border border-white/10 hover:border-[#4285F4] p-3 rounded-lg flex items-center justify-between gap-3 transition"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="p-2 bg-[#232a3d] rounded text-red-400 font-bold text-xs flex-shrink-0">
                    PDF
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-bold text-white truncate">{file.name}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {file.size ? `${(parseInt(file.size) / (1024 * 1024)).toFixed(2)} Mo` : 'Taille inconnue'}
                      {file.modifiedTime && ` • Modifié le ${new Date(file.modifiedTime).toLocaleDateString()}`}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {file.webViewLink && (
                    <a
                      href={file.webViewLink}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 bg-[#232a3d] text-slate-300 hover:text-white rounded"
                      title="Aperçu Google Drive"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}

                  <button
                    onClick={() => handleImportDriveFile(file)}
                    disabled={importingFileId === file.id}
                    className="px-3 py-1.5 bg-[#4285F4] hover:bg-[#3367d6] text-white rounded text-xs font-bold flex items-center gap-1 transition disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{importingFileId === file.id ? 'Importation...' : 'Importer'}</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end pt-2 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#232a3d] hover:bg-[#2a334a] text-slate-300 rounded text-xs font-bold"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
