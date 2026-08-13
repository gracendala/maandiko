import React from 'react';
import { Sermon, ProjectedData, ProjectionStyle } from '../types';
import {
  EyeOff,
  LogOut,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Maximize2,
  RotateCw,
  Clock
} from 'lucide-react';

interface LiveMonitorBarProps {
  sermon?: Sermon | null;
  paragraphesCount?: number;
  projectedState: ProjectedData | null;
  projectionStyle?: ProjectionStyle;
  onUpdateProjectionStyle?: (style: Partial<ProjectionStyle>) => void;
  onClearProjection: () => void;
  onOutProjection?: () => void;
  onOpenStyleModal: () => void;
  onNextBlock?: () => void;
  onPrevBlock?: () => void;
}

const TRANSITIONS = [
  { id: 'cut', label: 'Coupe Directe (Sans animation)', icon: Zap },
  { id: 'fade', label: 'Fondu Enchaîné', icon: Sparkles },
  { id: 'slide-left', label: 'Glissement vers la Gauche', icon: ArrowLeft },
  { id: 'slide-right', label: 'Glissement vers la Droite', icon: ArrowRight },
  { id: 'slide-up', label: 'Glissement vers le Haut', icon: ArrowUp },
  { id: 'slide-down', label: 'Glissement vers le Bas', icon: ArrowDown },
  { id: 'zoom', label: 'Zoom Avant', icon: Maximize2 },
  { id: 'flip', label: 'Bascule 3D', icon: RotateCw },
];

export const LiveMonitorBar: React.FC<LiveMonitorBarProps> = ({
  sermon,
  paragraphesCount,
  projectedState,
  projectionStyle,
  onUpdateProjectionStyle,
  onClearProjection,
  onOutProjection,
  onOpenStyleModal,
  onNextBlock,
  onPrevBlock
}) => {
  return (
    <footer className="h-16 bg-[#0d1017] border-t border-white/10 px-5 flex items-center justify-between gap-3 flex-shrink-0 z-40">
      {/* Transitions Icon Selector Bar (Replaces projected content preview window) */}
      <div className="flex items-center gap-1.5 bg-[#121620] px-3 py-1.5 rounded-md border border-white/10 overflow-x-auto min-w-0 flex-1">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mr-1 flex items-center gap-1 flex-shrink-0 select-none">
          <Sparkles className="w-3.5 h-3.5 text-[#00d2ff]" />
          <span className="hidden xl:inline">Transitions :</span>
        </span>

        <div className="flex items-center gap-1">
          {TRANSITIONS.map((t) => {
            const Icon = t.icon;
            const currentTransition = projectionStyle?.slideTransition || 'fade';
            const isActive = currentTransition === t.id;

            return (
              <button
                key={t.id}
                onClick={() => onUpdateProjectionStyle?.({ slideTransition: t.id })}
                title={t.label}
                className={`w-8 h-8 rounded-md transition-all cursor-pointer flex items-center justify-center flex-shrink-0 ${
                  isActive
                    ? 'bg-[#00d2ff] text-black font-extrabold shadow-[0_0_12px_rgba(0,210,255,0.5)] scale-105 z-10'
                    : 'bg-[#1b212d] hover:bg-[#283244] text-slate-300 hover:text-white border border-white/10'
                }`}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>

        {/* Transition Duration Control */}
        <div className="flex items-center gap-2 border-l border-white/15 pl-3 ml-2 flex-shrink-0">
          <Clock className="w-3.5 h-3.5 text-[#00d2ff] flex-shrink-0" />
          <span className="text-[10px] font-bold text-slate-300 hidden md:inline">Durée :</span>
          <input
            type="range"
            min="100"
            max="2000"
            step="50"
            value={projectionStyle?.transitionDuration ?? 350}
            onChange={(e) => onUpdateProjectionStyle?.({ transitionDuration: Number(e.target.value) })}
            className="w-16 sm:w-24 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#00d2ff]"
            title="Ajuster la durée de la transition"
          />
          <span className="text-[11px] font-mono font-bold text-[#00d2ff] min-w-[42px]">
            {(((projectionStyle?.transitionDuration ?? 350)) / 1000).toFixed(2)}s
          </span>

          {/* Quick preset buttons */}
          <div className="hidden lg:flex items-center gap-1 ml-1">
            {[200, 350, 600, 1000].map((dur) => (
              <button
                key={dur}
                onClick={() => onUpdateProjectionStyle?.({ transitionDuration: dur })}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border transition cursor-pointer ${
                  (projectionStyle?.transitionDuration ?? 350) === dur
                    ? 'bg-[#00d2ff]/20 text-[#00d2ff] border-[#00d2ff]/50'
                    : 'bg-white/5 text-slate-400 border-white/10 hover:text-slate-200'
                }`}
              >
                {dur >= 1000 ? `${dur / 1000}s` : `${dur}ms`}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Direct Block/Paragraph Navigation */}
        {onPrevBlock && (
          <button
            onClick={onPrevBlock}
            className="px-3 py-2 bg-[#1f293d] hover:bg-[#2b3852] text-slate-200 hover:text-white rounded-md text-xs font-bold flex items-center gap-1 border border-white/10 transition cursor-pointer"
            title="Bloc / Paragraphe Précédent (Flèche Gauche)"
          >
            <ChevronLeft className="w-4 h-4 text-[#00d2ff]" />
            <span className="hidden sm:inline">Précédent</span>
          </button>
        )}

        {onNextBlock && (
          <button
            onClick={onNextBlock}
            className="px-3.5 py-2 bg-[#00d2ff] hover:bg-[#00b8e6] text-black font-extrabold rounded-md text-xs flex items-center gap-1 shadow-lg transition cursor-pointer"
            title="Bloc / Paragraphe Suivant (Flèche Droite ou Espace)"
          >
            <span>Suivant</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        <div className="w-px h-6 bg-white/10 mx-0.5" />

        <button
          onClick={onOpenStyleModal}
          className="px-3 py-2 bg-[#232a3d] border border-white/10 hover:bg-[#2a334a] text-white rounded-md text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          title="Configurer le style de projection"
        >
          <Settings className="w-4 h-4" />
          <span className="hidden lg:inline">Style</span>
        </button>

        {onOutProjection && (
          <button
            onClick={onOutProjection}
            className="px-3.5 py-2 bg-amber-600/90 hover:bg-amber-500 text-white rounded-md text-xs font-extrabold flex items-center gap-1.5 shadow-lg transition cursor-pointer"
            title="Sortie Animée (OUT) : Animer la sortie des éléments sans couper la session de projection"
          >
            <LogOut className="w-4 h-4" />
            <span>Sortie (OUT)</span>
          </button>
        )}

        <button
          onClick={onClearProjection}
          className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-md text-xs font-extrabold flex items-center gap-1.5 shadow-lg transition cursor-pointer"
          title="Masquer (Écran Noir) : Couper la projection immédiatement sur les écrans"
        >
          <EyeOff className="w-4 h-4" />
          <span>Masquer</span>
        </button>
      </div>
    </footer>
  );
};

