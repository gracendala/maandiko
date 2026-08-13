import React, { useState } from 'react';
import { FileUp, Upload, X } from 'lucide-react';

interface ImportPdfModalProps {
  onClose: () => void;
  onSuccess: (sermonId: string) => void;
}

export const ImportPdfModal: React.FC<ImportPdfModalProps> = ({ onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [docId, setDocId] = useState('');
  const [docTitle, setDocTitle] = useState('');
  const [docDate, setDocDate] = useState('');
  const [docLieu, setDocLieu] = useState('');
  const [modeDecoupage, setModeDecoupage] = useState('AUTO');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const processFile = (selectedFile: File) => {
    setFile(selectedFile);
    setErrorMsg('');
    const fileName = selectedFile.name.replace(/\.pdf$/i, '');
    const codeMatch = fileName.match(/\b(\d{2,4}-\d{2,4}[A-Za-z]?)\b/);

    if (codeMatch) {
      setDocId(codeMatch[1]);
    } else {
      setDocId(fileName.replace(/[^a-zA-Z0-9-]/g, '-'));
    }

    let title = fileName;
    if (codeMatch) {
      title = title.replace(codeMatch[0], '');
    }
    title = title.replace(/^[\s\-_]+|[\s\-_]+$/g, '').replace(/[\-_]+/g, ' ');
    setDocTitle(title.trim() || fileName);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const f = e.dataTransfer.files[0];
      if (f.type.includes('pdf')) {
        processFile(f);
      } else {
        setErrorMsg('Veuillez déposer un fichier au format PDF.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !docId || !docTitle) {
      setErrorMsg('Veuillez remplir le fichier, le code et le titre.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('id', docId);
    formData.append('titre_francais', docTitle);
    formData.append('date_sermon', docDate);
    formData.append('lieu', docLieu);
    formData.append('mode_decoupage', modeDecoupage);

    try {
      const res = await fetch('/api/import-pdf', {
        method: 'POST',
        body: formData
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let data: any = {};
      try {
        data = await res.json();
      } catch {
        // Response was not JSON
      }

      if (res.ok && data.success) {
        onSuccess(docId);
        onClose();
      } else {
        setErrorMsg(data.error || `Erreur d'importation (Code HTTP ${res.status}).`);
      }
    } catch (err: unknown) {
      console.error("Erreur import PDF:", err);
      setErrorMsg("Échec de la connexion au serveur. Vérifiez la taille du fichier PDF ou réessayez.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#121620] border border-white/10 rounded-xl p-6 w-full max-w-xl space-y-5 shadow-2xl">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-[#00d2ff] flex items-center gap-2">
            <FileUp className="w-5 h-5" />
            <span>Importer un Sermon / Document PDF</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-[#00d2ff]/10 border-l-4 border-[#00d2ff] p-3 text-xs text-[#00d2ff] rounded">
          ⚡ <strong>Astuce :</strong> Le code et le titre sont automatiquement détectés dès le choix du fichier PDF !
        </div>

        {errorMsg && (
          <div className="bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-400 rounded">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="border-2 border-dashed border-white/20 hover:border-[#00d2ff] bg-[#181d2a] p-6 rounded-lg text-center cursor-pointer transition"
          >
            <input
              type="file"
              accept=".pdf"
              id="pdf-input"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
            />
            <label htmlFor="pdf-input" className="cursor-pointer space-y-2 block">
              <Upload className="w-8 h-8 text-[#00d2ff] mx-auto" />
              <div className="text-sm font-semibold text-white">
                {file ? file.name : 'Cliquez ou glissez-déposez un fichier PDF ici'}
              </div>
              {file && (
                <div className="text-xs text-[#00d2ff] font-bold">
                  {(file.size / (1024 * 1024)).toFixed(2)} Mo
                </div>
              )}
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <label className="text-slate-400 font-semibold">Code Brochure / ID * :</label>
              <input
                type="text"
                value={docId}
                onChange={(e) => setDocId(e.target.value)}
                placeholder="Ex: 63-1128"
                className="w-full bg-[#232a3d] text-white border border-white/10 p-2.5 rounded outline-none focus:border-[#00d2ff]"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-400 font-semibold">Titre de la brochure * :</label>
              <input
                type="text"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                placeholder="Ex: Souvenez-vous du Seigneur"
                className="w-full bg-[#232a3d] text-white border border-white/10 p-2.5 rounded outline-none focus:border-[#00d2ff]"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <label className="text-slate-400 font-semibold">Date du sermon :</label>
              <input
                type="text"
                value={docDate}
                onChange={(e) => setDocDate(e.target.value)}
                placeholder="Ex: 28 Novembre 1963"
                className="w-full bg-[#232a3d] text-white border border-white/10 p-2.5 rounded outline-none focus:border-[#00d2ff]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-400 font-semibold">Lieu :</label>
              <input
                type="text"
                value={docLieu}
                onChange={(e) => setDocLieu(e.target.value)}
                placeholder="Ex: Shreveport, LA, USA"
                className="w-full bg-[#232a3d] text-white border border-white/10 p-2.5 rounded outline-none focus:border-[#00d2ff]"
              />
            </div>
          </div>

          <div className="space-y-1 text-xs">
            <label className="text-slate-400 font-semibold">Mode de Découpage du Texte :</label>
            <select
              value={modeDecoupage}
              onChange={(e) => setModeDecoupage(e.target.value)}
              className="w-full bg-[#232a3d] text-white border border-white/10 p-2.5 rounded outline-none focus:border-[#00d2ff]"
            >
              <option value="AUTO">Automatique (Numéros de Paragraphes WMB)</option>
              <option value="NUMEROTE">Paragraphes Numérotés Libres (§1, 2, 3)</option>
              <option value="LETTRE">Lettre Circulaire / Paragraphes Naturels</option>
              <option value="PHRASE">Phrase par Phrase</option>
              <option value="PAGE">Page par Page</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#232a3d] text-slate-300 rounded text-xs font-bold hover:bg-[#2a334a]"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 bg-[#00d2ff] hover:bg-[#00b8e6] text-black font-extrabold rounded text-xs shadow-lg transition cursor-pointer"
            >
              {isLoading ? '⏳ Importation en cours...' : '🚀 Lancer L\'Importation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
