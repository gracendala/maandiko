import React, { useState } from 'react';
import logoImg from '../assets/images/logo.png';
import { 
  HelpCircle, 
  X, 
  Tv, 
  Monitor, 
  Keyboard, 
  BookOpen, 
  Wifi, 
  Radio,
  Sparkles, 
  Play, 
  Sliders, 
  Database, 
  FileText, 
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenProjectionTab?: (screenId?: string) => void;
  onOpenStyleModal?: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({
  isOpen,
  onClose,
  onOpenProjectionTab,
  onOpenStyleModal,
}) => {
  const [activeTab, setActiveTab] = useState<'guide' | 'shortcuts' | 'projection' | 'faq'>('guide');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] bg-[#0d121f] border border-white/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#141b2d]">
          <div className="flex items-center gap-3">
            <img 
              src={logoImg} 
              alt="MaAndiko Studio Logo" 
              className="w-10 h-10 rounded-xl object-cover border-2 border-cyan-400/60 shadow-lg shadow-cyan-500/30" 
              referrerPolicy="no-referrer"
            />
            <div>
              <h2 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                <span>Centre d'Aide & Guide Utilisateur</span>
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full font-bold">
                  MaAndiko Studio 2.0
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Guide d'utilisation, raccourcis régie et conseils de projection
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
            title="Fermer (Échap)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 py-2.5 bg-[#0f1626] border-b border-white/10 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('guide')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border ${
              activeTab === 'guide'
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-md'
                : 'bg-white/5 border-transparent text-slate-400 hover:bg-white/10 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Guide Rapide</span>
          </button>

          <button
            onClick={() => setActiveTab('shortcuts')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border ${
              activeTab === 'shortcuts'
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-md'
                : 'bg-white/5 border-transparent text-slate-400 hover:bg-white/10 hover:text-slate-200'
            }`}
          >
            <Keyboard className="w-4 h-4" />
            <span>Raccourcis Clavier</span>
          </button>

          <button
            onClick={() => setActiveTab('projection')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border ${
              activeTab === 'projection'
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-md'
                : 'bg-white/5 border-transparent text-slate-400 hover:bg-white/10 hover:text-slate-200'
            }`}
          >
            <Tv className="w-4 h-4" />
            <span>Projection & OBS</span>
          </button>

          <button
            onClick={() => setActiveTab('faq')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border ${
              activeTab === 'faq'
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-md'
                : 'bg-white/5 border-transparent text-slate-400 hover:bg-white/10 hover:text-slate-200'
            }`}
          >
            <Info className="w-4 h-4" />
            <span>FAQ & ASTUCES</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm leading-relaxed">
          {/* TAB 1: GUIDE RAPIDE */}
          {activeTab === 'guide' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-indigo-950/40 border border-cyan-500/30 rounded-2xl p-4 flex items-start gap-4 shadow-lg">
                <div className="p-3 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex-shrink-0">
                  <Zap className="w-6 h-6 fill-cyan-400/20" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base mb-1">Comment projeter en 3 étapes simples</h3>
                  <p className="text-xs text-slate-300">
                    MaAndiko Studio est conçu pour la régie directe en église ou conférences. Projetez instantanément des prédications ou brochures sur votre vidéoprojecteur ou écran de retour.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Step 1 */}
                <div className="bg-[#131929] border border-white/10 rounded-2xl p-4 space-y-3 relative">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500 text-black font-black flex items-center justify-center text-sm shadow-md">
                    1
                  </div>
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4 text-cyan-400" />
                    <span>Choisir un Sermon</span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    Sélectionnez une prédication dans la liste latérale gauche ou importez un nouveau fichier texte ou PDF.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="bg-[#131929] border border-white/10 rounded-2xl p-4 space-y-3 relative">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500 text-black font-black flex items-center justify-center text-sm shadow-md">
                    2
                  </div>
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <Tv className="w-4 h-4 text-emerald-400" />
                    <span>Ouvrir l'Écran</span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    Cliquez sur <strong className="text-white">Projection → Lancer Écran Salle</strong>. Glissez cette fenêtre sur votre 2ème écran (Vidéoprojecteur).
                  </p>
                </div>

                {/* Step 3 */}
                <div className="bg-[#131929] border border-white/10 rounded-2xl p-4 space-y-3 relative">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500 text-black font-black flex items-center justify-center text-sm shadow-md">
                    3
                  </div>
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <Play className="w-4 h-4 text-amber-400 fill-amber-400/30" />
                    <span>Cliquer pour Projeter</span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    Cliquez sur n'importe quel paragraphe dans la liste principale. Le texte apparaît immédiatement à l'écran.
                  </p>
                </div>
              </div>

              {/* Quick Actions Links */}
              <div className="bg-[#131929] border border-white/10 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Actions Rapides Directes :</h4>
                <div className="flex flex-wrap gap-3">
                  {onOpenProjectionTab && (
                    <button
                      onClick={() => {
                        onOpenProjectionTab('audience');
                        onClose();
                      }}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-2 cursor-pointer"
                    >
                      <Tv className="w-4 h-4" />
                      <span>Ouvrir Écran Audience (HDMI)</span>
                    </button>
                  )}

                  {onOpenStyleModal && (
                    <button
                      onClick={() => {
                        onOpenStyleModal();
                        onClose();
                      }}
                      className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-2 cursor-pointer"
                    >
                      <Sliders className="w-4 h-4" />
                      <span>Personnaliser Thème & Graphisme</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RACCOURCIS CLAVIER */}
          {activeTab === 'shortcuts' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-300">
                Utilisez ces raccourcis clavier pour contrôler la régie en direct de manière rapide et fluide :
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-[#131929] border border-white/10 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="p-1.5 rounded-lg bg-white/5 text-cyan-400 border border-white/10">
                      <ChevronRight className="w-4 h-4" />
                    </span>
                    <div>
                      <div className="text-xs font-bold text-white">Paragraphe Suivant</div>
                      <div className="text-[10px] text-slate-400">Avancer la lecture en direct</div>
                    </div>
                  </div>
                  <kbd className="px-2.5 py-1 bg-slate-800 border border-white/20 rounded text-xs font-mono font-bold text-cyan-300 shadow">
                    Flèche Bas / PageDown
                  </kbd>
                </div>

                <div className="bg-[#131929] border border-white/10 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="p-1.5 rounded-lg bg-white/5 text-cyan-400 border border-white/10">
                      <ChevronRight className="w-4 h-4 rotate-180" />
                    </span>
                    <div>
                      <div className="text-xs font-bold text-white">Paragraphe Précédent</div>
                      <div className="text-[10px] text-slate-400">Reculer d'un paragraphe</div>
                    </div>
                  </div>
                  <kbd className="px-2.5 py-1 bg-slate-800 border border-white/20 rounded text-xs font-mono font-bold text-cyan-300 shadow">
                    Flèche Haut / PageUp
                  </kbd>
                </div>

                <div className="bg-[#131929] border border-white/10 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="p-1.5 rounded-lg bg-white/5 text-rose-400 border border-white/10">
                      <X className="w-4 h-4" />
                    </span>
                    <div>
                      <div className="text-xs font-bold text-white">Couper l'Écran (Écran Noir)</div>
                      <div className="text-[10px] text-slate-400">Effacer instantanément le texte</div>
                    </div>
                  </div>
                  <kbd className="px-2.5 py-1 bg-slate-800 border border-white/20 rounded text-xs font-mono font-bold text-rose-300 shadow">
                    Échap / Suppr
                  </kbd>
                </div>

                <div className="bg-[#131929] border border-white/10 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="p-1.5 rounded-lg bg-white/5 text-amber-400 border border-white/10">
                      <Monitor className="w-4 h-4" />
                    </span>
                    <div>
                      <div className="text-xs font-bold text-white">Plein Écran (Fenêtre Projection)</div>
                      <div className="text-[10px] text-slate-400">Basculer sans bordure navigateur</div>
                    </div>
                  </div>
                  <kbd className="px-2.5 py-1 bg-slate-800 border border-white/20 rounded text-xs font-mono font-bold text-amber-300 shadow">
                    F11 / Double-clic
                  </kbd>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PROJECTION & OBS */}
          {activeTab === 'projection' && (
            <div className="space-y-4">
              <div className="bg-[#131929] border border-white/10 rounded-2xl p-4 space-y-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Tv className="w-4 h-4 text-cyan-400" />
                  <span>Gestion des Sorties Multi-Écrans</span>
                </h3>
                <p className="text-xs text-slate-300">
                  MaAndiko Studio vous permet de piloter jusqu'à 3 sorties simultanées et synchronisées :
                </p>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                    <span><strong className="text-white">Écran Audience (HDMI / URL) :</strong> Dédié au vidéoprojecteur principal de la salle avec affichage grand texte.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                    <span><strong className="text-white">Écran Stage / Prompteur :</strong> Écran orienté vers la scène ou le prédicateur avec texte à haut contraste.</span>
                  </li>
                </ul>
              </div>

              <div className="bg-[#131929] border border-white/10 rounded-2xl p-4 space-y-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Radio className="w-4 h-4 text-cyan-400" />
                  <span>Affichage Distant par URL Ultra-Courte</span>
                </h3>
                <p className="text-xs text-slate-300">
                  Pour afficher la projection sur un autre PC connecté au même réseau WiFi/Ethernet :
                </p>
                <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-300">
                  <li>Ouvrez le navigateur du PC distant (Chrome, Edge, Firefox, Safari).</li>
                  <li>Saisissez simplement l'adresse IP suivie de <strong className="text-cyan-300">/1</strong> (Audience) ou <strong className="text-amber-300">/2</strong> (Stage).</li>
                  <li>Exemple : <code className="text-white font-mono bg-black/40 px-1.5 py-0.5 rounded">192.168.1.50:3000/1</code>. La projection se synchronise instantanément en temps réel.</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 4: FAQ */}
          {activeTab === 'faq' && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="bg-[#131929] border border-white/10 rounded-xl p-4 space-y-1">
                  <h4 className="font-bold text-white text-xs text-cyan-300">
                    Q : Comment étendre mon affichage sur le vidéoprojecteur sous Windows / Mac ?
                  </h4>
                  <p className="text-xs text-slate-300">
                    Sous Windows, appuyez sur <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-[11px] font-mono text-white">Win + P</kbd> et choisissez <strong className="text-white">Étendre (Extend)</strong>. Glissez ensuite la fenêtre du projecteur sur cet écran et appuyez sur <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-[11px] font-mono text-white">F11</kbd>.
                  </p>
                </div>

                <div className="bg-[#131929] border border-white/10 rounded-xl p-4 space-y-1">
                  <h4 className="font-bold text-white text-xs text-cyan-300">
                    Q : Est-ce que mes données sont sauvegardées si je ferme le navigateur ?
                  </h4>
                  <p className="text-xs text-slate-300">
                    Oui ! Toutes vos prédications, mises en page, et configurations sont automatiquement sauvegardées dans la base de données SQLite/JSON de votre serveur local.
                  </p>
                </div>

                <div className="bg-[#131929] border border-white/10 rounded-xl p-4 space-y-1">
                  <h4 className="font-bold text-white text-xs text-cyan-300">
                    Q : Comment modifier l'apparence des textes projetés ?
                  </h4>
                  <p className="text-xs text-slate-300">
                    Rendez-vous dans le menu <strong className="text-white">Projection → Éditeur de Design & Thèmes</strong> pour personnaliser les couleurs, la police, les marges, le fond d'écran ou ajouter votre logo.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-white/10 bg-[#0c101c] text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>MaAndiko Studio - Système de Projection Pro v2.0</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition cursor-pointer"
          >
            Fermer le guide
          </button>
        </div>
      </div>
    </div>
  );
};
