import React, { useState, useEffect } from 'react';
import logoImg from '../assets/images/logo.png';
import { Radio, Tv, ExternalLink, X, Check, Copy, Link, Sparkles } from 'lucide-react';
import { openProjectorWindow } from '../utils/projectorWindow';
import { ProjectionScreenConfig } from '../types';

interface NetworkShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  screens?: ProjectionScreenConfig[];
}

export const NetworkShareModal: React.FC<NetworkShareModalProps> = ({ isOpen, onClose, screens = [] }) => {
  const [networkIp, setNetworkIp] = useState<string>('127.0.0.1');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/network-info')
        .then(res => res.json())
        .then(data => {
          if (data && Array.isArray(data.addresses) && data.addresses.length > 0) {
            setNetworkIp(data.addresses[0]);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const baseUrl = `http://${networkIp}:3000`;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[100] flex items-center justify-center p-4 select-none">
      <div className="bg-[#121620] border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 bg-[#181d2a] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src={logoImg} 
              alt="Logo" 
              className="w-9 h-9 rounded-lg object-cover border border-[#00d2ff]/40 shadow-sm shadow-[#00d2ff]/20" 
              referrerPolicy="no-referrer"
            />
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Réseau & Liens Ultracourts</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-md font-mono font-semibold">
                  SIMPLIFIÉ
                </span>
              </h2>
              <p className="text-xs text-slate-400">IP locale : <strong className="text-cyan-400 font-mono">{networkIp}</strong></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs text-slate-300">
          
          {/* Short Links Card */}
          <div className="bg-[#181e2b] border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 font-semibold text-slate-100 text-sm">
              <Link className="w-4 h-4 text-[#00d2ff]" />
              <span>URL Ultra-Courtes pour PC / Navigateur Distant</span>
            </div>

            <p className="text-slate-400 text-[11px] leading-relaxed">
              Pour afficher la projection sur un autre PC du même réseau local, il suffit d'ouvrir l'un de ces chiffres ou mots simples dans son navigateur :
            </p>

            <div className="space-y-2.5 pt-1">
              
              {/* Short URL 1: Audience */}
              <div className="p-3 rounded-lg bg-[#121620] border border-slate-800 flex items-center justify-between gap-2">
                <div>
                  <div className="font-bold text-white text-xs flex items-center gap-2">
                    <Tv className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Écran Audience (Salle)</span>
                  </div>
                  <div className="text-[11px] font-mono text-cyan-300 font-semibold mt-0.5 select-all">
                    {baseUrl}/1 &nbsp;<span className="text-slate-500 font-normal">ou</span>&nbsp; {baseUrl}/live
                  </div>
                </div>

                <button
                  onClick={() => handleCopy(`${baseUrl}/1`, 'audience')}
                  className={`px-3 py-1.5 rounded text-[11px] font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                    copiedKey === 'audience'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-[#202738] hover:bg-[#283247] text-slate-200 border border-slate-700/60'
                  }`}
                >
                  {copiedKey === 'audience' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-300" />}
                  <span>{copiedKey === 'audience' ? 'Copié !' : 'Copier'}</span>
                </button>
              </div>

              {/* Short URL 2: Stage */}
              <div className="p-3 rounded-lg bg-[#121620] border border-slate-800 flex items-center justify-between gap-2">
                <div>
                  <div className="font-bold text-white text-xs flex items-center gap-2">
                    <Tv className="w-3.5 h-3.5 text-amber-400" />
                    <span>Écran Stage / Prompteur</span>
                  </div>
                  <div className="text-[11px] font-mono text-amber-300 font-semibold mt-0.5 select-all">
                    {baseUrl}/2 &nbsp;<span className="text-slate-500 font-normal">ou</span>&nbsp; {baseUrl}/stage
                  </div>
                </div>

                <button
                  onClick={() => handleCopy(`${baseUrl}/2`, 'stage')}
                  className={`px-3 py-1.5 rounded text-[11px] font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                    copiedKey === 'stage'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-[#202738] hover:bg-[#283247] text-slate-200 border border-slate-700/60'
                  }`}
                >
                  {copiedKey === 'stage' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-300" />}
                  <span>{copiedKey === 'stage' ? 'Copié !' : 'Copier'}</span>
                </button>
              </div>

              {/* Short URL 3: Mobile Remote Control PWA */}
              <div className="p-3 rounded-lg bg-gradient-to-r from-indigo-950/80 to-[#121620] border border-sky-500/40 flex items-center justify-between gap-2">
                <div>
                  <div className="font-bold text-sky-300 text-xs flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                    <span>Télécommande Mobile Android / PWA</span>
                  </div>
                  <div className="text-[11px] font-mono text-sky-300 font-semibold mt-0.5 select-all">
                    {baseUrl}/remote
                  </div>
                </div>

                <button
                  onClick={() => handleCopy(`${baseUrl}/remote`, 'remote')}
                  className={`px-3 py-1.5 rounded text-[11px] font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                    copiedKey === 'remote'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-sky-600/30 hover:bg-sky-600/50 text-sky-200 border border-sky-500/50'
                  }`}
                >
                  {copiedKey === 'remote' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-300" />}
                  <span>{copiedKey === 'remote' ? 'Copié !' : 'Copier'}</span>
                </button>
              </div>

            </div>
          </div>

          {/* Local Display Launch Card */}
          <div className="bg-[#181e2b] border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="font-semibold text-slate-100 text-sm flex items-center gap-2">
              <Tv className="w-4 h-4 text-indigo-400" />
              <span>Affichage sur Second Écran Local (HDMI / Projecteur)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={() => openProjectorWindow('audience')}
                className="p-3 rounded-xl bg-[#202738] hover:bg-[#283247] border border-slate-700/60 hover:border-indigo-500/40 text-slate-100 font-semibold flex items-center justify-between gap-2 transition cursor-pointer group"
              >
                <div className="text-left">
                  <div className="text-xs font-bold text-slate-200 group-hover:text-white">
                    Audience (Salle)
                  </div>
                  <div className="text-[10px] text-slate-400">Ouvrir la fenêtre HD</div>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-white flex-shrink-0" />
              </button>

              <button
                onClick={() => openProjectorWindow('stage')}
                className="p-3 rounded-xl bg-[#202738] hover:bg-[#283247] border border-slate-700/60 hover:border-indigo-500/40 text-slate-100 font-semibold flex items-center justify-between gap-2 transition cursor-pointer group"
              >
                <div className="text-left">
                  <div className="text-xs font-bold text-slate-200 group-hover:text-white">
                    Stage (Prompteur)
                  </div>
                  <div className="text-[10px] text-slate-400">Ouvrir la fenêtre HD</div>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-white flex-shrink-0" />
              </button>
            </div>
          </div>

          {/* Tip Box */}
          <div className="p-3 rounded-xl bg-[#181e2b] border border-slate-800 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-[#00d2ff] flex-shrink-0 mt-0.5" />
            <div className="text-[11px] text-slate-300 leading-relaxed">
              <strong className="text-white">Astuce :</strong> Tapez simplement <code className="text-[#00d2ff] font-mono font-bold">{networkIp}:3000/1</code> dans le navigateur du PC distant pour afficher l'Écran Audience.
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#141824] border-t border-slate-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs transition cursor-pointer"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
