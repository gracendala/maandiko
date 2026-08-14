import React, { useState, useRef, useEffect } from 'react';
import { ProjectedData, ProjectionStyle } from '../types';
import { ProjectionCanvas } from './ProjectionCanvas';
import { X, Minimize2, Maximize2, Move, EyeOff, ChevronLeft, ChevronRight, Tv } from 'lucide-react';

interface FloatingPipMonitorProps {
  isOpen: boolean;
  onClose: () => void;
  projectedData: ProjectedData | null;
  projectionStyle: ProjectionStyle;
  onClearProjection: () => void;
  onNextBlock?: () => void;
  onPrevBlock?: () => void;
  onOpenProjectorWindow?: () => void;
}

export const FloatingPipMonitor: React.FC<FloatingPipMonitorProps> = ({
  isOpen,
  onClose,
  projectedData,
  projectionStyle,
  onClearProjection,
  onNextBlock,
  onPrevBlock,
  onOpenProjectorWindow
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 20, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const posStartRef = useRef<{ x: number; y: number }>({ x: 20, y: 80 });

  useEffect(() => {
    // Set default bottom-right position on load
    const defaultX = Math.max(20, window.innerWidth - 380);
    const defaultY = Math.max(20, window.innerHeight - 260);
    setPosition({ x: defaultX, y: defaultY });
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    posStartRef.current = { ...position };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      
      const newX = Math.max(10, Math.min(window.innerWidth - 100, posStartRef.current.x + dx));
      const newY = Math.max(10, Math.min(window.innerHeight - 60, posStartRef.current.y + dy));
      
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  if (!isOpen) return null;

  const isLive = projectedData && projectedData.sermonId !== 'BLACK' && projectedData.texte;

  return (
    <div
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`
      }}
      className={`fixed z-50 bg-[#0c1017] border border-[#00d2ff]/40 rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.8)] overflow-hidden transition-all duration-150 flex flex-col ${
        isMinimized ? 'w-72 h-12' : 'w-80 sm:w-96 h-56 sm:h-64'
      }`}
    >
      {/* PiP Window Drag Header */}
      <div
        onMouseDown={handleMouseDown}
        className="bg-gradient-to-r from-[#121824] via-[#1a2333] to-[#0d121a] px-3 py-2 border-b border-white/10 flex items-center justify-between cursor-move select-none flex-shrink-0"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Move className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="relative flex h-2 w-2 flex-shrink-0">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isLive ? 'bg-emerald-400 opacity-75' : 'bg-slate-500'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isLive ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
            </span>
            <span className="text-xs font-bold text-white tracking-wide truncate">
              {isLive ? 'Projection PiP' : 'PiP En Attente'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {onOpenProjectorWindow && (
            <button
              onClick={onOpenProjectorWindow}
              className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white transition"
              title="Ouvrir dans une vraie fenêtre / 2ème écran"
            >
              <Tv className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white transition"
            title={isMinimized ? 'Agrandir la fenêtre' : 'Réduire la fenêtre'}
          >
            {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-red-400 transition"
            title="Fermer le mode PiP"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main PiP Canvas Viewport */}
      {!isMinimized && (
        <div className="flex-1 relative bg-black overflow-hidden flex items-center justify-center">
          <div className="w-full h-full transform scale-100 origin-center">
            <ProjectionCanvas
              data={projectedData}
              style={projectionStyle}
              previewMode={true}
            />
          </div>

          {/* Controls Bar Overlay at bottom of PiP */}
          <div className="absolute bottom-2 left-2 right-2 bg-[#0d111a]/90 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-white/10 flex items-center justify-between gap-1 shadow-lg">
            <div className="flex items-center gap-1">
              {onPrevBlock && (
                <button
                  onClick={onPrevBlock}
                  className="p-1 bg-white/10 hover:bg-white/20 text-white rounded transition"
                  title="Précédent"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              )}
              {onNextBlock && (
                <button
                  onClick={onNextBlock}
                  className="p-1 bg-[#00d2ff] hover:bg-[#00b8e6] text-black rounded font-bold transition"
                  title="Suivant"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="text-[10px] text-slate-300 font-semibold truncate px-1">
              {isLive ? `§ ${projectedData?.numero || ''}` : 'Écran Noir'}
            </div>

            <button
              onClick={onClearProjection}
              className="p-1 bg-rose-600/80 hover:bg-rose-500 text-white rounded transition"
              title="Écran Noir"
            >
              <EyeOff className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
