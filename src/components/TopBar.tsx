import React, { useState, useRef, useEffect } from 'react';
import { Sermon, ProjectionScreenConfig, ActiveModule } from '../types';
import logoImg from '../assets/images/logo.png';
import {
  Radio,
  Search,
  FileUp,
  Palette,
  Cloud,
  ExternalLink,
  Tv,
  Database,
  ChevronDown,
  Play,
  Settings,
  FolderOpen,
  Sliders,
  HardDrive,
  Wifi,
  HelpCircle,
  BookOpen,
  Music,
  BookMarked,
  Smartphone
} from 'lucide-react';

interface TopBarProps {
  isConnected: boolean;
  activeModule: ActiveModule;
  onSelectModule: (mod: ActiveModule) => void;
  sermons: Sermon[];
  selectedSermonId: string;
  onSelectSermon: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenStudio: () => void;
  onOpenImportPdf: () => void;
  onOpenGoogleDrive: () => void;
  onOpenDatabase: () => void;
  onOpenDataDirSettings?: () => void;
  onOpenProjectionTab: (screenId?: string) => void;
  screens?: ProjectionScreenConfig[];
  onOpenStyleModal?: () => void;
  onOpenNetworkShare?: () => void;
  onOpenRemote?: () => void;
  onOpenHelp?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  isConnected,
  activeModule,
  onSelectModule,
  sermons,
  selectedSermonId,
  onSelectSermon,
  searchQuery,
  onSearchChange,
  onOpenStudio,
  onOpenImportPdf,
  onOpenGoogleDrive,
  onOpenDatabase,
  onOpenDataDirSettings,
  onOpenProjectionTab,
  screens = [],
  onOpenStyleModal,
  onOpenNetworkShare,
  onOpenRemote,
  onOpenHelp
}) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showProjectionMenu, setShowProjectionMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
        setShowProjectionMenu(false);
        setShowSettingsMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const closeAllMenus = () => {
    setActiveMenu(null);
    setShowProjectionMenu(false);
    setShowSettingsMenu(false);
  };

  return (
    <header className="bg-[#10141d] border-b border-white/10 flex flex-col flex-shrink-0 z-50 select-none" ref={menuRef}>
      {/* Top Desktop App Menu Bar (ProPresenter / OBS style) */}
      <div className="h-7 bg-[#0b0e14] border-b border-white/5 px-3 flex items-center justify-between text-[11px] text-slate-300 font-medium select-none">
        <div className="flex items-center gap-1">
          {/* Logo */}
          <div className="flex items-center gap-2 mr-2 pr-2 border-r border-white/10">
            <img 
              src={logoImg} 
              alt="MaAndiko Studio" 
              className="w-5 h-5 rounded-md object-cover border border-cyan-500/50 shadow-sm shadow-cyan-500/30" 
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Menu Dropdown: Fichier */}
          <div className="relative">
            <button
              onClick={() => {
                setActiveMenu(activeMenu === 'fichier' ? null : 'fichier');
                setShowProjectionMenu(false);
                setShowSettingsMenu(false);
              }}
              className={`px-2 py-0.5 rounded hover:bg-white/10 transition cursor-pointer ${activeMenu === 'fichier' ? 'bg-white/10 text-white font-bold' : ''}`}
            >
              Fichier
            </button>
            {activeMenu === 'fichier' && (
              <div className="absolute left-0 top-full mt-1 w-56 bg-[#141a26] border border-white/15 rounded-lg shadow-2xl py-1 z-50 text-xs">
                <button
                  onClick={() => { onOpenImportPdf(); closeAllMenus(); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-white/10 flex items-center gap-2 text-slate-200 hover:text-white"
                >
                  <FileUp className="w-3.5 h-3.5 text-[#00d2ff]" />
                  <span>Importer un fichier PDF...</span>
                </button>
                <button
                  onClick={() => { onOpenGoogleDrive(); closeAllMenus(); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-white/10 flex items-center gap-2 text-slate-200 hover:text-white"
                >
                  <Cloud className="w-3.5 h-3.5 text-blue-400" />
                  <span>Importer depuis Google Drive...</span>
                </button>
                <div className="h-px bg-white/10 my-1" />
                <button
                  onClick={() => { onOpenDatabase(); closeAllMenus(); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-white/10 flex items-center gap-2 text-slate-200 hover:text-white"
                >
                  <Database className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Sauvegarde & Base de données...</span>
                </button>
              </div>
            )}
          </div>

          {/* Menu Dropdown: Modules */}
          <div className="relative">
            <button
              onClick={() => {
                setActiveMenu(activeMenu === 'modules' ? null : 'modules');
                setShowProjectionMenu(false);
                setShowSettingsMenu(false);
              }}
              className={`px-2 py-0.5 rounded hover:bg-white/10 transition cursor-pointer ${activeMenu === 'modules' ? 'bg-white/10 text-white font-bold' : ''}`}
            >
              Modules
            </button>
            {activeMenu === 'modules' && (
              <div className="absolute left-0 top-full mt-1 w-60 bg-[#141a26] border border-white/15 rounded-lg shadow-2xl py-1 z-50 text-xs">
                <button
                  onClick={() => { onSelectModule('brochures'); closeAllMenus(); }}
                  className={`w-full text-left px-3 py-1.5 hover:bg-white/10 flex items-center gap-2 ${activeModule === 'brochures' ? 'text-[#00d2ff] font-bold bg-white/5' : 'text-slate-200'}`}
                >
                  <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Brochures & Prédications</span>
                </button>
                <button
                  onClick={() => { onSelectModule('lyrics'); closeAllMenus(); }}
                  className={`w-full text-left px-3 py-1.5 hover:bg-white/10 flex items-center gap-2 ${activeModule === 'lyrics' ? 'text-[#00d2ff] font-bold bg-white/5' : 'text-slate-200'}`}
                >
                  <Music className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Recueil de Cantiques & Lyrics</span>
                </button>
                <button
                  onClick={() => { onSelectModule('bible'); closeAllMenus(); }}
                  className={`w-full text-left px-3 py-1.5 hover:bg-white/10 flex items-center gap-2 ${activeModule === 'bible' ? 'text-[#00d2ff] font-bold bg-white/5' : 'text-slate-200'}`}
                >
                  <BookMarked className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Sainte Bible Multilingue</span>
                </button>
              </div>
            )}
          </div>

          {/* Menu Dropdown: Cantiques & Lyrics */}
          <div className="relative">
            <button
              onClick={() => {
                setActiveMenu(activeMenu === 'lyrics_menu' ? null : 'lyrics_menu');
                setShowProjectionMenu(false);
                setShowSettingsMenu(false);
              }}
              className={`px-2 py-0.5 rounded hover:bg-white/10 transition cursor-pointer ${activeMenu === 'lyrics_menu' ? 'bg-white/10 text-white font-bold' : ''}`}
            >
              Cantiques & Lyrics
            </button>
            {activeMenu === 'lyrics_menu' && (
              <div className="absolute left-0 top-full mt-1 w-64 bg-[#141a26] border border-white/15 rounded-lg shadow-2xl py-1 z-50 text-xs">
                <button
                  onClick={() => { onSelectModule('lyrics'); closeAllMenus(); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-white/10 flex items-center gap-2 text-slate-200 hover:text-white"
                >
                  <Music className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Ouvrir le Module Cantiques</span>
                </button>
                <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">Recueils intégrés</div>
                <div className="px-3 py-1 text-slate-300 text-[11px] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                  <span>Cantiques des Rachetés (Français)</span>
                </div>
                <div className="px-3 py-1 text-slate-300 text-[11px] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>Nyimbo za Mungu (Swahili)</span>
                </div>
              </div>
            )}
          </div>

          {/* Menu Dropdown: Brochures */}
          <div className="relative">
            <button
              onClick={() => {
                setActiveMenu(activeMenu === 'brochures' ? null : 'brochures');
                setShowProjectionMenu(false);
                setShowSettingsMenu(false);
              }}
              className={`px-2 py-0.5 rounded hover:bg-white/10 transition cursor-pointer ${activeMenu === 'brochures' ? 'bg-white/10 text-white font-bold' : ''}`}
            >
              Brochures
            </button>
            {activeMenu === 'brochures' && (
              <div className="absolute left-0 top-full mt-1 w-56 bg-[#141a26] border border-white/15 rounded-lg shadow-2xl py-1 z-50 text-xs">
                <button
                  onClick={() => { onSelectModule('brochures'); closeAllMenus(); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-white/10 flex items-center gap-2 text-slate-200 hover:text-white"
                >
                  <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Afficher les Prédications</span>
                </button>
                {selectedSermonId ? (
                  <button
                    onClick={() => { onOpenStudio(); closeAllMenus(); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-white/10 flex items-center gap-2 text-slate-200 hover:text-white"
                  >
                    <Palette className="w-3.5 h-3.5 text-[#00d2ff]" />
                    <span>Éditer dans Studio Pro</span>
                  </button>
                ) : (
                  <div className="px-3 py-1.5 text-slate-500 italic">Aucune brochure sélectionnée</div>
                )}
              </div>
            )}
          </div>

          {/* Menu Dropdown: Base de Données */}
          <div className="relative">
            <button
              onClick={() => {
                setActiveMenu(activeMenu === 'db' ? null : 'db');
                setShowProjectionMenu(false);
                setShowSettingsMenu(false);
              }}
              className={`px-2 py-0.5 rounded hover:bg-white/10 transition cursor-pointer ${activeMenu === 'db' ? 'bg-white/10 text-white font-bold' : ''}`}
            >
              Base de Données
            </button>
            {activeMenu === 'db' && (
              <div className="absolute left-0 top-full mt-1 w-64 bg-[#141a26] border border-white/15 rounded-lg shadow-2xl py-1 z-50 text-xs">
                <button
                  onClick={() => { onOpenDatabase(); closeAllMenus(); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-white/10 flex items-center gap-2 text-slate-200 hover:text-white"
                >
                  <Database className="w-3.5 h-3.5 text-[#00d2ff]" />
                  <span>Sauvegarder / Restaurer DB</span>
                </button>
                {onOpenDataDirSettings && (
                  <button
                    onClick={() => { onOpenDataDirSettings(); closeAllMenus(); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-white/10 flex items-center gap-2 text-amber-300 hover:text-amber-200"
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                    <span>Modifier le Dossier de Données...</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Menu Dropdown: Projection */}
          <div className="relative">
            <button
              onClick={() => {
                setActiveMenu(activeMenu === 'projection' ? null : 'projection');
                setShowProjectionMenu(false);
                setShowSettingsMenu(false);
              }}
              className={`px-2 py-0.5 rounded hover:bg-white/10 transition cursor-pointer ${activeMenu === 'projection' ? 'bg-white/10 text-white font-bold' : ''}`}
            >
              Projection
            </button>
            {activeMenu === 'projection' && (
              <div className="absolute left-0 top-full mt-1 w-64 bg-[#141a26] border border-white/15 rounded-lg shadow-2xl py-1 z-50 text-xs">
                <button
                  onClick={() => { onOpenProjectionTab('audience'); closeAllMenus(); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-white/10 flex items-center gap-2 text-slate-200 hover:text-white"
                >
                  <Tv className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Lancer Écran Audience (HDMI)</span>
                </button>
                <button
                  onClick={() => { onOpenProjectionTab('stage'); closeAllMenus(); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-white/10 flex items-center gap-2 text-slate-200 hover:text-white"
                >
                  <Tv className="w-3.5 h-3.5 text-amber-400" />
                  <span>Lancer Écran Stage / Prompteur (HDMI)</span>
                </button>
                {onOpenNetworkShare && (
                  <>
                    <div className="h-px bg-white/10 my-1" />
                    <button
                      onClick={() => { onOpenNetworkShare(); closeAllMenus(); }}
                      className="w-full text-left px-3 py-1.5 hover:bg-cyan-500/20 flex items-center gap-2 text-cyan-300 font-semibold"
                    >
                      <Radio className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Réseau Local & Liens Court...</span>
                    </button>
                  </>
                )}
                {onOpenStyleModal && (
                  <>
                    <div className="h-px bg-white/10 my-1" />
                    <button
                      onClick={() => { onOpenStyleModal(); closeAllMenus(); }}
                      className="w-full text-left px-3 py-1.5 hover:bg-white/10 flex items-center gap-2 text-[#00d2ff]"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Éditeur de Design & Thèmes...</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Menu Dropdown: Aide */}
          <div className="relative">
            <button
              onClick={() => {
                setActiveMenu(activeMenu === 'help' ? null : 'help');
                setShowProjectionMenu(false);
                setShowSettingsMenu(false);
              }}
              className={`px-2 py-0.5 rounded hover:bg-white/10 transition cursor-pointer ${activeMenu === 'help' ? 'bg-white/10 text-white font-bold' : ''}`}
            >
              Aide
            </button>
            {activeMenu === 'help' && (
              <div className="absolute left-0 top-full mt-1 w-60 bg-[#141a26] border border-white/15 rounded-lg shadow-2xl py-1 z-50 text-xs">
                {onOpenHelp && (
                  <button
                    onClick={() => { onOpenHelp(); closeAllMenus(); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-cyan-500/20 flex items-center gap-2 text-cyan-300 font-semibold"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Guide Utilisateur & FAQ...</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-rose-500 animate-pulse'}`} />
            <span className="text-[10px] text-slate-400">{isConnected ? 'Connecté (Régie Live)' : 'Hors ligne'}</span>
          </div>
        </div>
      </div>

      {/* Main Control Toolbar */}
      <div className="h-12 px-4 flex items-center justify-between gap-4 bg-[#0e121a]">
        
        {/* Search & Dynamic Context Controls (Moved to Left) */}
        {activeModule === 'brochures' ? (
          <div className="flex items-center gap-2.5 flex-1 max-w-xl">
            <select
              value={selectedSermonId}
              onChange={(e) => onSelectSermon(e.target.value)}
              className="min-w-[180px] max-w-[240px] font-semibold bg-[#1a2130] text-white border border-white/15 px-3 py-1.5 rounded-lg text-xs focus:border-[#00d2ff] outline-none cursor-pointer truncate"
            >
              <option value="">-- Sélectionner une brochure --</option>
              {sermons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.titre_francais} ({s.id})
                </option>
              ))}
            </select>

            <div className="relative flex-1 flex items-center">
              <Search className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Rechercher brochure (titre, 63-1128, texte)..."
                className="w-full bg-[#1a2130] text-white border border-white/15 pl-9 pr-3 py-1.5 rounded-lg text-xs focus:border-[#00d2ff] outline-none transition placeholder-slate-400"
              />
            </div>
          </div>
        ) : activeModule === 'lyrics' ? (
          <div className="flex items-center gap-2.5 flex-1 max-w-xl">
            <div className="relative flex-1 flex items-center">
              <Search className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Rechercher un cantique dans tous les recueils (N°, titre, paroles)..."
                className="w-full bg-[#1a2130] text-white border border-white/15 pl-9 pr-8 py-1.5 rounded-lg text-xs focus:border-[#00d2ff] outline-none transition placeholder-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 text-slate-400 hover:text-white font-bold text-xs p-0.5 rounded hover:bg-white/10 cursor-pointer"
                  title="Effacer la recherche"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 flex-1 max-w-xl">
            <div className="relative flex-1 flex items-center bg-[#1a2130] text-white border border-white/15 px-3 py-1.5 rounded-lg text-xs">
              <BookMarked className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
              <span className="font-medium text-slate-300 truncate">
                Module Sainte Bible : Naviguez par livre/chapitre ou recherchez un verset à projeter.
              </span>
            </div>
          </div>
        )}

        {/* Module Switcher Buttons (Moved to Center) */}
        <div className="flex items-center gap-1.5 p-1 bg-[#090d14] border border-white/10 rounded-xl flex-shrink-0">
          {/* Module 1: Brochures */}
          <button
            onClick={() => onSelectModule('brochures')}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-2 transition cursor-pointer ${
              activeModule === 'brochures'
                ? 'bg-[#1e293b] text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            title="Module Prédications & Brochures de W.M. Branham"
          >
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <div className="flex flex-col text-left leading-none">
              <span className="font-bold">Brochures</span>
              <span className="text-[9px] opacity-70 font-normal">Prédications</span>
            </div>
          </button>

          {/* Module 2: Lyrics */}
          <button
            onClick={() => onSelectModule('lyrics')}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-2 transition cursor-pointer ${
              activeModule === 'lyrics'
                ? 'bg-[#1e293b] text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            title="Module Recueil de Cantiques & Chants"
          >
            <Music className="w-4 h-4 text-cyan-400" />
            <div className="flex flex-col text-left leading-none">
              <span className="font-bold">Lyrics</span>
              <span className="text-[9px] opacity-70 font-normal">Cantiques</span>
            </div>
          </button>

          {/* Module 3: Bible */}
          <button
            onClick={() => onSelectModule('bible')}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-2 transition cursor-pointer ${
              activeModule === 'bible'
                ? 'bg-[#1e293b] text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            title="Module Sainte Bible Multilingue"
          >
            <BookMarked className="w-4 h-4 text-cyan-400" />
            <div className="flex flex-col text-left leading-none">
              <span className="font-bold">Bible</span>
              <span className="text-[9px] opacity-70 font-normal">Écritures</span>
            </div>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">

          {/* Quick Studio Button if sermon selected */}
          {selectedSermonId && (
            <button
              onClick={onOpenStudio}
              className="px-3 py-1.5 rounded-lg font-bold text-xs bg-[#0078d4] text-white flex items-center gap-1.5 hover:brightness-110 transition cursor-pointer shadow-md"
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Studio Pro</span>
            </button>
          )}

          {/* Multi-Screen Launch Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowProjectionMenu((prev) => !prev);
                setShowSettingsMenu(false);
                setActiveMenu(null);
              }}
              className="px-3.5 py-1.5 rounded-lg font-black text-xs bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-lg transition cursor-pointer"
              title="Lancer les fenêtres de projection"
            >
              <Radio className="w-4 h-4" />
              <span>Sorties Projection</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {showProjectionMenu && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-[#0d1017] border border-white/20 rounded-xl shadow-2xl p-2 z-50 text-xs space-y-1">
                <div className="px-2.5 py-1.5 bg-[#141a26] border border-cyan-500/20 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="font-extrabold text-[#00d2ff] text-[11px]">Réseau Local Active</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold">
                    HD 1080p
                  </span>
                </div>

                <div className="pt-1 space-y-1">
                  {(screens.length > 0
                    ? screens
                    : [
                        { id: 'audience', name: 'Écran Audience (HDMI / Projecteur)' },
                        { id: 'stage', name: 'Écran Stage / Prompteur' }
                      ]
                  ).map((sc) => (
                    <button
                      key={sc.id}
                      onClick={() => {
                        onOpenProjectionTab(sc.id);
                        setShowProjectionMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg bg-[#141a26] hover:bg-indigo-900/40 border border-white/5 hover:border-indigo-500/40 text-white font-bold flex items-center justify-between gap-2 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Tv className="w-3.5 h-3.5 text-[#00d2ff]" />
                        <span className="truncate">{sc.name}</span>
                      </div>
                      <ExternalLink className="w-3 h-3 text-indigo-300 flex-shrink-0" />
                    </button>
                  ))}
                </div>

                <div className="h-px bg-white/10 my-1" />

                <button
                  onClick={() => {
                    const list = screens.length > 0 ? screens : [
                      { id: 'audience' },
                      { id: 'stage' }
                    ];
                    list.forEach((sc) => onOpenProjectionTab(sc.id));
                    setShowProjectionMenu(false);
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-black flex items-center justify-center gap-2 transition cursor-pointer shadow"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Lancer Écrans HDMI</span>
                </button>

                {onOpenNetworkShare && (
                  <button
                    onClick={() => {
                      onOpenNetworkShare();
                      setShowProjectionMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/30 text-cyan-300 font-bold flex items-center justify-between gap-2 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Radio className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Réseau Local & Liens URLs...</span>
                    </div>
                    <ExternalLink className="w-3 h-3 text-cyan-400/70" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Mobile Remote Launcher Button */}
          <button
            onClick={onOpenRemote || onOpenNetworkShare}
            className="px-3 py-1.5 rounded-lg font-bold text-xs bg-sky-600/30 hover:bg-sky-600/50 text-sky-200 border border-sky-500/40 flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            title="Ouvrir l'application de Télécommande Mobile Android / PWA"
          >
            <Smartphone className="w-4 h-4 text-sky-400" />
            <span className="hidden xl:inline">Télécommande Mobile</span>
          </button>

          {/* Help Button */}
          {onOpenHelp && (
            <button
              onClick={onOpenHelp}
              className="p-2 rounded-lg bg-[#1a2130] text-cyan-300 border border-cyan-500/30 hover:bg-cyan-950/60 hover:border-cyan-400 transition cursor-pointer flex items-center gap-1.5 font-bold text-xs"
              title="Centre d'Aide & Guide Utilisateur"
            >
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">Aide</span>
            </button>
          )}

          {/* Unified Settings Dropdown Button */}
          <div className="relative">
            <button
              onClick={() => {
                setShowSettingsMenu((prev) => !prev);
                setShowProjectionMenu(false);
                setActiveMenu(null);
              }}
              className="p-2 rounded-lg bg-[#1a2130] text-slate-200 border border-white/15 hover:border-[#00d2ff] hover:text-[#00d2ff] transition cursor-pointer flex items-center gap-1.5 font-bold text-xs"
              title="Paramètres de l'application"
            >
              <Settings className="w-4 h-4" />
              <span>Paramètres</span>
            </button>

            {showSettingsMenu && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-[#0d1017] border border-white/20 rounded-xl shadow-2xl p-2 z-50 text-xs space-y-1">
                <div className="px-2 py-1 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Options & Configuration
                </div>

                {onOpenDataDirSettings && (
                  <button
                    onClick={() => {
                      onOpenDataDirSettings();
                      setShowSettingsMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg bg-[#141a26] hover:bg-[#1f293d] border border-white/5 hover:border-amber-500/30 text-amber-300 font-bold flex items-center gap-2.5 transition cursor-pointer"
                  >
                    <FolderOpen className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <div>
                      <div className="text-white">Dossier de Données</div>
                      <div className="text-[10px] text-slate-400 font-normal">Répertoire .sermon & DB</div>
                    </div>
                  </button>
                )}

                <button
                  onClick={() => {
                    onOpenDatabase();
                    setShowSettingsMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg bg-[#141a26] hover:bg-[#1f293d] border border-white/5 hover:border-[#00d2ff]/30 text-[#00d2ff] font-bold flex items-center gap-2.5 transition cursor-pointer"
                >
                  <Database className="w-4 h-4 text-[#00d2ff] flex-shrink-0" />
                  <div>
                    <div className="text-white">Sauvegarde / Restauration DB</div>
                    <div className="text-[10px] text-slate-400 font-normal">Exporter ou importer la base .db</div>
                  </div>
                </button>

                {onOpenStyleModal && (
                  <button
                    onClick={() => {
                      onOpenStyleModal();
                      setShowSettingsMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg bg-[#141a26] hover:bg-[#1f293d] border border-white/5 hover:border-indigo-500/30 text-indigo-300 font-bold flex items-center gap-2.5 transition cursor-pointer"
                  >
                    <Sliders className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    <div>
                      <div className="text-white">Style de Projection</div>
                      <div className="text-[10px] text-slate-400 font-normal">Thèmes, polices, arrière-plans</div>
                    </div>
                  </button>
                )}

                <div className="h-px bg-white/10 my-1" />

                <button
                  onClick={() => {
                    onOpenImportPdf();
                    setShowSettingsMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-white/5 text-slate-300 font-medium flex items-center gap-2 transition cursor-pointer"
                >
                  <FileUp className="w-3.5 h-3.5 text-slate-400" />
                  <span>Importer Fichier PDF</span>
                </button>

                <button
                  onClick={() => {
                    onOpenGoogleDrive();
                    setShowSettingsMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-white/5 text-slate-300 font-medium flex items-center gap-2 transition cursor-pointer"
                >
                  <Cloud className="w-3.5 h-3.5 text-blue-400" />
                  <span>Importer depuis Google Drive</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
