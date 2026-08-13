import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ProjectionStyle, ElementAnimationConfig, SlideElement, ElementAnimationsMap, ProjectedData } from '../types';
import { ProjectionCanvas } from './ProjectionCanvas';
import { getElementAnimationStyle, getComputedElementVisibilityStyle } from '../utils/animationUtils';
import { loadGoogleFontIfNeeded } from '../utils/fontLoader';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Zap,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Maximize2,
  RotateCw,
  Clock,
  Type,
  BookOpen,
  Bookmark,
  Layers,
  Check,
  ChevronRight,
  SlidersHorizontal,
  Film,
  MoveHorizontal,
  Activity,
  Eye,
  EyeOff,
  Church,
  Tv,
  Mic,
  Star,
  Music,
  Quote,
  Shield,
  Heart,
  Tag,
  Image as ImageIcon,
  Video,
  PenTool,
  Sun
} from 'lucide-react';

interface AnimationModalProps {
  isOpen: boolean;
  onClose: () => void;
  style?: ProjectionStyle;
  onChangeStyle?: (newStyle: Partial<ProjectionStyle>) => void;
  animations?: ElementAnimationsMap;
  onSaveAnimations?: (newAnims: ElementAnimationsMap) => void;
  customElements?: SlideElement[];
  elements?: SlideElement[];
  onUpdateElementStyle?: (elementId: string, animationConfig: ElementAnimationConfig) => void;
  sampleData?: ProjectedData;
}

const INTRO_TYPES = [
  { id: 'none', label: 'Aucune', icon: Zap },
  { id: 'fade-in', label: 'Fondu', icon: Sparkles },
  { id: 'slide-up', label: 'Glissement Haut', icon: ArrowUp },
  { id: 'slide-down', label: 'Glissement Bas', icon: ArrowDown },
  { id: 'slide-left', label: 'Glissement Gauche', icon: ArrowLeft },
  { id: 'slide-right', label: 'Glissement Droite', icon: ArrowRight },
  { id: 'zoom-in', label: 'Zoom Avant', icon: Maximize2 },
  { id: 'bounce-in', label: 'Rebond', icon: RotateCw },
  { id: 'stroke-trim', label: 'Réduction de tracé', icon: PenTool },
  { id: 'light-wipe', label: 'Wipe de Lumière', icon: Sun },
];

const EMPHASIS_TYPES = [
  { id: 'none', label: 'Aucune', icon: Zap },
  { id: 'pulse', label: 'Pulsation', icon: Activity },
  { id: 'wiggle', label: 'Oscillation', icon: MoveHorizontal },
  { id: 'glow', label: 'Lueur', icon: Sparkles },
  { id: 'float', label: 'Flottement', icon: ArrowUp },
  { id: 'spin', label: 'Rotation', icon: RotateCw },
  { id: 'light-wipe-loop', label: 'Balayage Lumineux', icon: Sun },
];

const OUTRO_TYPES = [
  { id: 'none', label: 'Aucune', icon: Zap },
  { id: 'fade-out', label: 'Fondu', icon: Sparkles },
  { id: 'slide-up', label: 'Glissement Haut', icon: ArrowUp },
  { id: 'slide-down', label: 'Glissement Bas', icon: ArrowDown },
  { id: 'slide-left', label: 'Glissement Gauche', icon: ArrowLeft },
  { id: 'slide-right', label: 'Glissement Droite', icon: ArrowRight },
  { id: 'zoom-out', label: 'Zoom Arrière', icon: Maximize2 },
  { id: 'bounce-out', label: 'Rebond', icon: RotateCw },
  { id: 'stroke-trim-out', label: 'Effacement du tracé', icon: PenTool },
  { id: 'light-wipe-out', label: 'Wipe de Lumière (Sortie)', icon: Sun },
];

// Custom icon helper
function renderCustomIcon(iconName?: string) {
  switch (iconName) {
    case 'Church': return <Church className="w-full h-full" />;
    case 'BookOpen': return <BookOpen className="w-full h-full" />;
    case 'Bookmark': return <Bookmark className="w-full h-full" />;
    case 'Tv': return <Tv className="w-full h-full" />;
    case 'Mic': return <Mic className="w-full h-full" />;
    case 'Star': return <Star className="w-full h-full" />;
    case 'Sparkles': return <Sparkles className="w-full h-full" />;
    case 'Music': return <Music className="w-full h-full" />;
    case 'Quote': return <Quote className="w-full h-full" />;
    case 'Shield': return <Shield className="w-full h-full" />;
    case 'Heart': return <Heart className="w-full h-full" />;
    case 'Tag': return <Tag className="w-full h-full" />;
    default: return <Church className="w-full h-full" />;
  }
}

export const AnimationModal: React.FC<AnimationModalProps> = ({
  isOpen,
  onClose,
  style,
  onChangeStyle,
  animations,
  onSaveAnimations,
  customElements = [],
  elements = [],
  onUpdateElementStyle,
  sampleData: sampleDataProp
}) => {
  const [selectedTarget, setSelectedTarget] = useState<'title' | 'text' | 'verse' | string>('title');
  const [activePhase, setActivePhase] = useState<'intro' | 'emphasis' | 'outro'>('intro');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTimeMs, setCurrentTimeMs] = useState<number>(0);
  const [maxTimeMs, setMaxTimeMs] = useState<number>(4000);
  const [loopPlayback, setLoopPlayback] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'inspector' | 'presets'>('inspector');
  const [hiddenTracks, setHiddenTracks] = useState<Record<string, boolean>>({});

  const [isScrubbingPlayhead, setIsScrubbingPlayhead] = useState<boolean>(false);

  const [draggingBlock, setDraggingBlock] = useState<{
    target: string;
    phase: 'intro' | 'outro';
    type: 'move' | 'resize';
    startX: number;
    initialDelay: number;
    initialDuration: number;
  } | null>(null);

  const timelineTrackRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const currentStyle = style || {};
  const currentAnimationsMap = animations || currentStyle.elementAnimations || {};
  const targetElements = (customElements && customElements.length > 0)
    ? customElements
    : ((elements && elements.length > 0) ? elements : (currentStyle.customElements || []));

  // Dynamically load Google Fonts when theme style or element font changes
  useEffect(() => {
    if (currentStyle.fontFamily) {
      loadGoogleFontIfNeeded(currentStyle.fontFamily);
    }
    targetElements.forEach((el) => {
      if (el.style?.fontFamily) {
        loadGoogleFontIfNeeded(el.style.fontFamily);
      }
    });
  }, [currentStyle.fontFamily, targetElements]);

  // Compute background media & colors
  const effectiveBgType = useMemo(() => {
    if (currentStyle.bgType === 'chroma' || currentStyle.theme === 'chroma' || currentStyle.containerBg === '#00ff00') return 'chroma';
    if (currentStyle.bgType === 'transparent' || currentStyle.theme === 'transparent' || currentStyle.containerBg === 'transparent') return 'transparent';
    if (currentStyle.bgVideoUrl && currentStyle.bgVideoUrl.trim() !== '' && currentStyle.bgType !== 'color') return 'video';
    if (currentStyle.bgImageUrl && currentStyle.bgImageUrl.trim() !== '' && currentStyle.bgType !== 'color') return 'image';
    return currentStyle.bgType || 'color';
  }, [currentStyle.bgType, currentStyle.theme, currentStyle.containerBg, currentStyle.bgVideoUrl, currentStyle.bgImageUrl]);

  // Sample sermon data for realistic projection rendering
  const sampleData: ProjectedData = useMemo(() => {
    if (sampleDataProp) return sampleDataProp;
    return {
      sermonId: '63-0630M',
      numero: 2,
      texte: "Rappelez-vous le signal lumineux. Quand vous voyez un signal rouge sur la route ou sur la voie ferrée, cela signifie un danger imminent. Vous devez vous arrêter et observer la lumière avant de continuer.",
      titre_francais: 'LE SIGNAL LUMINEUX',
      type_structure: 'PARAGRAPHE',
      blockIndex: 1,
      totalBlocks: 1,
      module: currentStyle.module || 'brochures'
    };
  }, [sampleDataProp, currentStyle.module]);

  // Playhead playback loop
  useEffect(() => {
    if (isPlaying) {
      lastTimeRef.current = performance.now();

      const tick = (now: number) => {
        const delta = now - lastTimeRef.current;
        lastTimeRef.current = now;

        setCurrentTimeMs((prev) => {
          const next = prev + delta;
          if (next >= maxTimeMs) {
            if (loopPlayback) {
              return 0;
            } else {
              setIsPlaying(false);
              return maxTimeMs;
            }
          }
          return next;
        });

        animFrameRef.current = requestAnimationFrame(tick);
      };

      animFrameRef.current = requestAnimationFrame(tick);
    } else if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, maxTimeMs, loopPlayback]);

  // Handle timeline dragging (blocks & playhead scrubbing)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isScrubbingPlayhead && timelineTrackRef.current) {
        const rect = timelineTrackRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const ratio = Math.max(0, Math.min(1, clickX / rect.width));
        const newTime = Math.round(ratio * maxTimeMs);
        setCurrentTimeMs(newTime);
        return;
      }

      if (!draggingBlock || !timelineTrackRef.current) return;
      const rect = timelineTrackRef.current.getBoundingClientRect();
      const deltaX = e.clientX - draggingBlock.startX;
      const deltaMs = Math.round((deltaX / rect.width) * maxTimeMs);
      const animConfig = getAnimConfigForTarget(draggingBlock.target);

      if (draggingBlock.phase === 'intro') {
        const outroDelay = animConfig.outroDelay ?? 2500;
        const outroType = animConfig.outroType || 'none';

        if (draggingBlock.type === 'move') {
          const introDur = animConfig.introDuration ?? 500;
          const maxAllowedDelay = outroType !== 'none'
            ? Math.max(0, outroDelay - introDur)
            : maxTimeMs - 200;
          const newDelay = Math.max(0, Math.min(maxAllowedDelay, draggingBlock.initialDelay + deltaMs));
          updateAnimForTarget(draggingBlock.target, { introDelay: Math.round(newDelay / 50) * 50 });
        } else {
          const introDelay = animConfig.introDelay ?? 0;
          const maxAllowedDur = outroType !== 'none'
            ? Math.max(100, outroDelay - introDelay)
            : maxTimeMs;
          const newDur = Math.max(100, Math.min(maxAllowedDur, draggingBlock.initialDuration + deltaMs));
          updateAnimForTarget(draggingBlock.target, { introDuration: Math.round(newDur / 50) * 50 });
        }
      } else {
        const introType = animConfig.introType || 'none';
        const introDelay = animConfig.introDelay ?? 0;
        const introDur = animConfig.introDuration ?? 500;
        const introEndMs = introType !== 'none' ? introDelay + introDur : introDelay;

        if (draggingBlock.type === 'move') {
          const minAllowedDelay = introEndMs;
          const newDelay = Math.max(minAllowedDelay, Math.min(maxTimeMs - 100, draggingBlock.initialDelay + deltaMs));
          updateAnimForTarget(draggingBlock.target, { outroDelay: Math.round(newDelay / 50) * 50 });
        } else {
          const newDur = Math.max(100, Math.min(maxTimeMs - (animConfig.outroDelay ?? 2500), draggingBlock.initialDuration + deltaMs));
          updateAnimForTarget(draggingBlock.target, { outroDuration: Math.round(newDur / 50) * 50 });
        }
      }
    };

    const handleMouseUp = () => {
      if (isScrubbingPlayhead) setIsScrubbingPlayhead(false);
      if (draggingBlock) setDraggingBlock(null);
    };

    if (draggingBlock || isScrubbingPlayhead) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingBlock, isScrubbingPlayhead, maxTimeMs, currentAnimationsMap, targetElements]);

  const tracksList = useMemo(() => {
    if (targetElements && targetElements.length > 0) {
      return targetElements.map((el) => {
        let icon = Layers;
        if (el.binding === 'sermon_header' || el.type === 'heading') icon = BookOpen;
        else if (el.binding === 'sermon_text' || el.type === 'text') icon = Type;
        else if (el.binding === 'sermon_reference' || el.type === 'badge') icon = Bookmark;
        else if (el.type === 'image' || el.type === 'media') icon = ImageIcon;
        return {
          id: el.id,
          label: el.name || el.binding || el.type,
          icon,
        };
      });
    }
    return [
      { id: 'title', label: 'Titre / En-tête', icon: BookOpen },
      { id: 'text', label: 'Texte Principal', icon: Type },
      { id: 'verse', label: 'Verset / Badge', icon: Bookmark },
    ];
  }, [targetElements]);

  // Global Scene Sequence Boundaries calculation across ALL elements
  const globalTimelinePhases = useMemo(() => {
    let maxIntroEndMs = 0;
    let minOutroStartMs = maxTimeMs;
    let maxOutroEndMs = maxTimeMs;

    tracksList.forEach((tr) => {
      const anim = currentAnimationsMap[tr.id] || { introType: 'fade-in', introDuration: 500, introDelay: 0, emphasisType: 'none', outroType: 'none', outroDuration: 500, outroDelay: 2500 };
      const introDelay = anim.introDelay ?? 0;
      const introDur = anim.introDuration ?? 500;
      const introType = anim.introType || 'none';
      if (introType !== 'none') {
        const introEnd = introDelay + introDur;
        if (introEnd > maxIntroEndMs) maxIntroEndMs = introEnd;
      }

      const outroDelay = anim.outroDelay ?? 2500;
      const outroDur = anim.outroDuration ?? 500;
      const outroType = anim.outroType || 'none';
      if (outroType !== 'none') {
        if (outroDelay < minOutroStartMs) minOutroStartMs = outroDelay;
        const outroEnd = outroDelay + outroDur;
        if (outroEnd > maxOutroEndMs) maxOutroEndMs = outroEnd;
      }
    });

    if (minOutroStartMs < maxIntroEndMs) {
      minOutroStartMs = maxIntroEndMs;
    }

    return {
      introEndMs: maxIntroEndMs,
      outroStartMs: minOutroStartMs,
      outroEndMs: maxOutroEndMs,
    };
  }, [tracksList, currentAnimationsMap, maxTimeMs]);

  useEffect(() => {
    if (tracksList.length > 0 && !tracksList.some((t) => t.id === selectedTarget)) {
      setSelectedTarget(tracksList[0].id);
    }
  }, [tracksList, selectedTarget]);

  if (!isOpen) return null;

  const emitAnimationsUpdate = (newMap: Record<string, ElementAnimationConfig | undefined>) => {
    if (onSaveAnimations) {
      onSaveAnimations(newMap);
    } else if (onChangeStyle) {
      onChangeStyle({ elementAnimations: newMap });
    }
  };

  const getAnimConfigForTarget = (targetId?: string | null): ElementAnimationConfig => {
    if (!targetId) {
      return { introType: 'fade-in', introDuration: 500, introDelay: 0, emphasisType: 'none', outroType: 'none', outroDuration: 500, outroDelay: 2500 };
    }
    if (targetId === 'title') {
      return currentAnimationsMap.title || { introType: 'fade-in', introDuration: 500, introDelay: 0, emphasisType: 'none', outroType: 'none', outroDuration: 500, outroDelay: 2500 };
    }
    if (targetId === 'text') {
      return currentAnimationsMap.text || { introType: 'fade-in', introDuration: 600, introDelay: 150, emphasisType: 'none', outroType: 'none', outroDuration: 500, outroDelay: 2600 };
    }
    if (targetId === 'verse') {
      return currentAnimationsMap.verse || { introType: 'slide-up', introDuration: 500, introDelay: 300, emphasisType: 'none', outroType: 'none', outroDuration: 500, outroDelay: 2700 };
    }

    if (currentAnimationsMap[targetId]) {
      return currentAnimationsMap[targetId];
    }
    const customElem = targetElements.find((e) => e.id === targetId);
    if (customElem?.style?.animation) {
      return customElem.style.animation;
    }
    return { introType: 'fade-in', introDuration: 500, introDelay: 0, emphasisType: 'none', outroType: 'none', outroDuration: 500, outroDelay: 2500 };
  };

  const currentAnim = getAnimConfigForTarget(selectedTarget);

  const updateAnimForTarget = (targetId: string, updates: Partial<ElementAnimationConfig>) => {
    if (!targetId) return;
    const anim = getAnimConfigForTarget(targetId);
    const updated = { ...anim, ...updates };

    // Calculate logical boundaries
    const introType = updated.introType || 'none';
    const introDelay = updated.introDelay ?? 0;
    const introDuration = updated.introDuration ?? 500;
    const introEnd = introType !== 'none' ? introDelay + introDuration : introDelay;

    const outroType = updated.outroType || 'none';
    let outroDelay = updated.outroDelay ?? 2500;

    // Rule 1: If intro parameters are modified and introEnd > outroDelay, adjust outroDelay to introEnd
    if (updates.introDelay !== undefined || updates.introDuration !== undefined || updates.introType !== undefined) {
      if (outroType !== 'none' && introEnd > outroDelay) {
        updated.outroDelay = introEnd;
      }
    }

    // Rule 2: If outroDelay is explicitly modified, clamp it to introEnd minimum
    if (updates.outroDelay !== undefined) {
      if (updated.outroDelay < introEnd) {
        updated.outroDelay = introEnd;
      }
    }

    const newMap = {
      ...currentAnimationsMap,
      [targetId]: updated
    };

    if (onUpdateElementStyle && !['title', 'text', 'verse'].includes(targetId)) {
      onUpdateElementStyle(targetId, updated);
    }

    emitAnimationsUpdate(newMap);
  };

  const handleUpdateCurrentAnim = (updates: Partial<ElementAnimationConfig>) => {
    if (!selectedTarget) return;
    updateAnimForTarget(selectedTarget, updates);
  };

  // Presets
  const applyStaggeredPreset = () => {
    const newMap: ElementAnimationsMap = { ...currentAnimationsMap };
    if (targetElements && targetElements.length > 0) {
      targetElements.forEach((el, idx) => {
        newMap[el.id] = {
          introType: idx % 2 === 0 ? 'slide-down' : 'slide-up',
          introDuration: 500,
          introDelay: idx * 150,
          emphasisType: 'none',
          outroType: 'fade-out',
          outroDuration: 400,
          outroDelay: 2500 + idx * 100
        };
      });
    } else {
      newMap.title = { introType: 'slide-down', introDuration: 500, introDelay: 0, emphasisType: 'none', outroType: 'fade-out', outroDuration: 400, outroDelay: 2500 };
      newMap.text = { introType: 'fade-in', introDuration: 600, introDelay: 200, emphasisType: 'none', outroType: 'fade-out', outroDuration: 400, outroDelay: 2600 };
      newMap.verse = { introType: 'slide-up', introDuration: 500, introDelay: 400, emphasisType: 'none', outroType: 'fade-out', outroDuration: 400, outroDelay: 2700 };
    }
    emitAnimationsUpdate(newMap);
    setCurrentTimeMs(0);
    setIsPlaying(true);
  };

  const applySmoothFadePreset = () => {
    const newMap: ElementAnimationsMap = { ...currentAnimationsMap };
    if (targetElements && targetElements.length > 0) {
      targetElements.forEach((el, idx) => {
        newMap[el.id] = {
          introType: 'fade-in',
          introDuration: 500,
          introDelay: idx * 100,
          emphasisType: 'none',
          outroType: 'fade-out',
          outroDuration: 400,
          outroDelay: 2500
        };
      });
    } else {
      newMap.title = { introType: 'fade-in', introDuration: 500, introDelay: 0, emphasisType: 'none', outroType: 'fade-out', outroDuration: 400, outroDelay: 2600 };
      newMap.text = { introType: 'fade-in', introDuration: 500, introDelay: 100, emphasisType: 'none', outroType: 'fade-out', outroDuration: 400, outroDelay: 2600 };
      newMap.verse = { introType: 'fade-in', introDuration: 500, introDelay: 200, emphasisType: 'none', outroType: 'fade-out', outroDuration: 400, outroDelay: 2600 };
    }
    emitAnimationsUpdate(newMap);
    setCurrentTimeMs(0);
    setIsPlaying(true);
  };

  const applyDisableAllAnimations = () => {
    const newMap: ElementAnimationsMap = { ...currentAnimationsMap };
    if (targetElements && targetElements.length > 0) {
      targetElements.forEach((el) => {
        newMap[el.id] = { introType: 'none', emphasisType: 'none', outroType: 'none' };
      });
    } else {
      newMap.title = { introType: 'none', emphasisType: 'none', outroType: 'none' };
      newMap.text = { introType: 'none', emphasisType: 'none', outroType: 'none' };
      newMap.verse = { introType: 'none', emphasisType: 'none', outroType: 'none' };
    }
    emitAnimationsUpdate(newMap);
    setCurrentTimeMs(0);
  };

  const handleTimelineRulerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const targetEl = e.target as HTMLElement;
    if (targetEl.closest('.timeline-block-handle') || targetEl.closest('.timeline-block')) {
      return;
    }
    if (!timelineTrackRef.current) return;
    const rect = timelineTrackRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    setCurrentTimeMs(Math.round(ratio * maxTimeMs));
    setIsScrubbingPlayhead(true);
  };

  const handleStartDragBlock = (
    e: React.MouseEvent,
    target: string,
    phase: 'intro' | 'outro',
    type: 'move' | 'resize'
  ) => {
    e.stopPropagation();
    const anim = getAnimConfigForTarget(target);
    const initialDelay = phase === 'intro' ? (anim.introDelay ?? 0) : (anim.outroDelay ?? 2500);
    const initialDuration = phase === 'intro' ? (anim.introDuration ?? 500) : (anim.outroDuration ?? 500);

    setSelectedTarget(target);
    setActivePhase(phase);
    setDraggingBlock({
      target,
      phase,
      type,
      startX: e.clientX,
      initialDelay,
      initialDuration,
    });
  };

  const formatTimecode = (ms: number) => {
    const seconds = (ms / 1000).toFixed(1);
    return `${seconds}s`;
  };

  return (
    <div className="fixed inset-0 z-[250] bg-[#121318] text-slate-100 flex flex-col w-screen h-screen overflow-hidden font-sans select-none animate-in fade-in duration-150">
      
      {/* 1. TOP NAVBAR (Harmonized with ProjectionStyleModal Dark Theme) */}
      <header className="h-14 bg-[#1a1b22] border-b border-[#282a36] px-5 flex items-center justify-between flex-shrink-0 z-30">
        
        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#2563eb]/15 border border-[#2563eb]/40 flex items-center justify-center text-blue-400">
            <Film className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-white tracking-wide flex items-center gap-2">
              <span>Studio d'Animations</span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#1f202b] text-blue-400 font-bold border border-[#2d3040]">
                Thème : {currentStyle.presetName || 'Thème Personnalisé'}
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">
              Personnalisez l'apparition, les mouvements et la disparition des éléments
            </p>
          </div>
        </div>

        {/* Transport Controls */}
        <div className="flex items-center gap-2 bg-[#14151a] px-3 py-1.5 rounded-xl border border-[#282a36]">
          <button
            onClick={() => {
              setIsPlaying(false);
              setCurrentTimeMs(0);
            }}
            className="p-1.5 hover:bg-[#20222e] text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
            title="Revenir au début"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              if (!isPlaying && currentTimeMs >= maxTimeMs) {
                setCurrentTimeMs(0);
              }
              setIsPlaying(!isPlaying);
            }}
            className={`px-3.5 py-1 rounded-lg text-xs font-black flex items-center gap-1.5 transition cursor-pointer shadow-md ${
              isPlaying
                ? 'bg-amber-400 hover:bg-amber-300 text-black'
                : 'bg-[#2563eb] hover:bg-blue-500 text-white'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-black" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-white" />
                Lecture
              </>
            )}
          </button>

          <div className="font-mono text-xs font-extrabold px-2.5 py-1 bg-[#1a1b22] rounded-lg text-blue-400 min-w-[55px] text-center border border-[#2d3040]">
            {formatTimecode(currentTimeMs)}
          </div>

          <button
            onClick={() => setLoopPlayback(!loopPlayback)}
            className={`p-1.5 rounded-lg border transition cursor-pointer ${
              loopPlayback
                ? 'bg-[#2563eb]/20 text-blue-400 border-[#2563eb]/50'
                : 'bg-transparent text-slate-500 border-transparent hover:text-white'
            }`}
            title="Lecture en boucle"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#2563eb] hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-md"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Fermer</span>
          </button>
        </div>
      </header>

      {/* 2. BODY CONTENT (Inspector Left + Canvas Right) */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT INSPECTOR PANEL */}
        <aside className="w-80 bg-[#16171e] border-r border-[#262836] flex flex-col flex-shrink-0 overflow-hidden">
          
          {/* Target Selector Header */}
          <div className="p-3 bg-[#181920] border-b border-[#282a36] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Piste active :
              </span>
              <div className="flex bg-[#121318] p-0.5 rounded-lg border border-[#282a36]">
                <button
                  onClick={() => setActiveTab('inspector')}
                  className={`px-2.5 py-1 text-[10px] font-extrabold rounded-md cursor-pointer transition ${
                    activeTab === 'inspector' ? 'bg-[#2563eb] text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Réglages
                </button>
                <button
                  onClick={() => setActiveTab('presets')}
                  className={`px-2.5 py-1 text-[10px] font-extrabold rounded-md cursor-pointer transition ${
                    activeTab === 'presets' ? 'bg-[#2563eb] text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Préréglages
                </button>
              </div>
            </div>

            {/* Target Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {tracksList.map((tr) => {
                const Icon = tr.icon;
                const isSelected = selectedTarget === tr.id;
                return (
                  <button
                    key={tr.id}
                    onClick={() => setSelectedTarget(tr.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer ${
                      isSelected
                        ? 'bg-[#2563eb]/20 text-blue-400 border-[#2563eb] shadow-sm'
                        : 'bg-[#1f202b] text-slate-300 border-[#2d3040] hover:bg-[#282a38]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tr.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* INSPECTOR DETAILS */}
          {activeTab === 'inspector' ? (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              
              {/* Phase Switcher */}
              <div className="flex bg-[#121318] p-1 rounded-xl border border-[#282a36]">
                <button
                  onClick={() => setActivePhase('intro')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                    activePhase === 'intro' ? 'bg-[#2563eb] text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Entrée
                </button>
                <button
                  onClick={() => setActivePhase('emphasis')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                    activePhase === 'emphasis' ? 'bg-[#2563eb] text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Emphase
                </button>
                <button
                  onClick={() => setActivePhase('outro')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                    activePhase === 'outro' ? 'bg-[#2563eb] text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sortie
                </button>
              </div>

              {/* INTRO PHASE */}
              {activePhase === 'intro' && (() => {
                const introType = currentAnim.introType || 'none';
                const introDelay = currentAnim.introDelay ?? 0;
                const introDuration = currentAnim.introDuration ?? 500;
                const introEndMs = introType !== 'none' ? introDelay + introDuration : introDelay;
                const outroDelayMs = currentAnim.outroDelay ?? 2500;
                const outroType = currentAnim.outroType || 'none';
                const maxAllowedDelay = outroType !== 'none' ? Math.max(0, outroDelayMs - introDuration) : maxTimeMs - 200;
                const maxAllowedDur = outroType !== 'none' ? Math.max(100, outroDelayMs - introDelay) : maxTimeMs;

                return (
                  <div className="space-y-4">
                    {/* Time Boundary Summary Badge */}
                    <div className="bg-blue-950/40 border border-blue-500/30 rounded-xl p-3 flex flex-col gap-1 text-xs">
                      <div className="flex justify-between items-center text-blue-300 font-bold">
                        <span>Fin de l'Entrée :</span>
                        <span className="font-mono bg-blue-900/60 px-2 py-0.5 rounded border border-blue-400/40 text-blue-200">
                          {(introEndMs / 1000).toFixed(2)}s
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-slate-400 text-[11px]">
                        <span>Sortie débute à :</span>
                        <span className="font-mono text-indigo-300">{(outroDelayMs / 1000).toFixed(2)}s</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-extrabold text-slate-300 block mb-2 uppercase tracking-wider">
                        Effet d'Entrée
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {INTRO_TYPES.map((t) => {
                          const Icon = t.icon;
                          const isSelected = (currentAnim.introType || 'fade-in') === t.id;
                          return (
                            <button
                              key={t.id}
                              onClick={() => handleUpdateCurrentAnim({ 
                                introType: t.id as any,
                                ...(t.id === 'light-wipe' && (currentAnim.introDuration === undefined || currentAnim.introDuration === 500) ? { introDuration: 1000 } : {})
                              })}
                              className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center gap-2 ${
                                isSelected
                                  ? 'bg-[#2563eb]/20 border-[#2563eb] text-blue-400 font-bold shadow-sm'
                                  : 'bg-[#1f202b] border-[#2d3040] text-slate-300 hover:bg-[#282a38]'
                              }`}
                            >
                              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="text-xs truncate">{t.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-3 bg-[#181920] p-3.5 rounded-xl border border-[#282a36] shadow-sm">
                      <div>
                        <div className="flex justify-between items-center text-xs mb-1 text-slate-300 font-semibold">
                          <span>Délai de départ</span>
                          <span className="font-mono text-blue-400 font-extrabold">{introDelay} ms</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max={maxAllowedDelay}
                          step="50"
                          value={introDelay}
                          onChange={(e) => handleUpdateCurrentAnim({ introDelay: Number(e.target.value) })}
                          className="w-full h-1.5 bg-[#121318] rounded appearance-none cursor-pointer accent-[#2563eb]"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center text-xs mb-1 text-slate-300 font-semibold">
                          <span>Durée de l'effet</span>
                          <span className="font-mono text-blue-400 font-extrabold">{introDuration} ms</span>
                        </div>
                        <input
                          type="range"
                          min="100"
                          max={maxAllowedDur}
                          step="50"
                          value={introDuration}
                          onChange={(e) => handleUpdateCurrentAnim({ introDuration: Number(e.target.value) })}
                          className="w-full h-1.5 bg-[#121318] rounded appearance-none cursor-pointer accent-[#2563eb]"
                        />
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* EMPHASIS PHASE */}
              {activePhase === 'emphasis' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-extrabold text-slate-300 block mb-2 uppercase tracking-wider">
                      Animation Continue
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {EMPHASIS_TYPES.map((t) => {
                        const Icon = t.icon;
                        const isSelected = (currentAnim.emphasisType || 'none') === t.id;
                        return (
                          <button
                            key={t.id}
                            onClick={() => handleUpdateCurrentAnim({ emphasisType: t.id as any })}
                            className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center gap-2 ${
                              isSelected
                                ? 'bg-[#2563eb]/20 border-[#2563eb] text-blue-400 font-bold shadow-sm'
                                : 'bg-[#1f202b] border-[#2d3040] text-slate-300 hover:bg-[#282a38]'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="text-xs truncate">{t.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-[#181920] p-3.5 rounded-xl border border-[#282a36] shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-slate-200">Boucle en continu</span>
                        <span className="text-[10px] text-slate-400">Jouer l'animation d'emphase en répétition infinie</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={currentAnim.emphasisLoop ?? false}
                          onChange={(e) => handleUpdateCurrentAnim({ emphasisLoop: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4 bg-[#282a38] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#2563eb]"></div>
                      </label>
                    </div>

                    <div className="pt-2 border-t border-[#232533]">
                      <div className="flex justify-between items-center text-xs mb-1 text-slate-300 font-semibold">
                        <span>Durée de l'effet</span>
                        <span className="font-mono text-blue-400 font-extrabold">{currentAnim.emphasisDuration ?? 2000} ms</span>
                      </div>
                      <input
                        type="range"
                        min="500"
                        max="5000"
                        step="100"
                        value={currentAnim.emphasisDuration ?? 2000}
                        onChange={(e) => handleUpdateCurrentAnim({ emphasisDuration: Number(e.target.value) })}
                        className="w-full h-1.5 bg-[#121318] rounded appearance-none cursor-pointer accent-[#2563eb]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* OUTRO PHASE */}
              {activePhase === 'outro' && (() => {
                const introType = currentAnim.introType || 'none';
                const introDelay = currentAnim.introDelay ?? 0;
                const introDuration = currentAnim.introDuration ?? 500;
                const introEndMs = introType !== 'none' ? introDelay + introDuration : introDelay;
                const outroDelayMs = currentAnim.outroDelay ?? 2500;
                const outroDuration = currentAnim.outroDuration ?? 500;

                return (
                  <div className="space-y-4">
                    {/* Time Boundary Summary Badge */}
                    <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-3 flex flex-col gap-1 text-xs">
                      <div className="flex justify-between items-center text-indigo-300 font-bold">
                        <span>Départ de la Sortie :</span>
                        <span className="font-mono bg-indigo-900/60 px-2 py-0.5 rounded border border-indigo-400/40 text-indigo-200">
                          {(outroDelayMs / 1000).toFixed(2)}s
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-slate-400 text-[11px]">
                        <span>Entrée s'arrête à :</span>
                        <span className="font-mono text-blue-300">{(introEndMs / 1000).toFixed(2)}s</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-extrabold text-slate-300 block mb-2 uppercase tracking-wider">
                        Effet de Sortie
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {OUTRO_TYPES.map((t) => {
                          const Icon = t.icon;
                          const isSelected = (currentAnim.outroType || 'none') === t.id;
                          return (
                            <button
                              key={t.id}
                              onClick={() => handleUpdateCurrentAnim({ outroType: t.id as any })}
                              className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center gap-2 ${
                                isSelected
                                  ? 'bg-[#2563eb]/20 border-[#2563eb] text-blue-400 font-bold shadow-sm'
                                  : 'bg-[#1f202b] border-[#2d3040] text-slate-300 hover:bg-[#282a38]'
                              }`}
                            >
                              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="text-xs truncate">{t.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-3 bg-[#181920] p-3.5 rounded-xl border border-[#282a36] shadow-sm">
                      <div>
                        <div className="flex justify-between items-center text-xs mb-1 text-slate-300 font-semibold">
                          <span>Départ de la sortie</span>
                          <span className="font-mono text-blue-400 font-extrabold">{outroDelayMs} ms</span>
                        </div>
                        <input
                          type="range"
                          min={introEndMs}
                          max={maxTimeMs - 100}
                          step="50"
                          value={outroDelayMs}
                          onChange={(e) => handleUpdateCurrentAnim({ outroDelay: Number(e.target.value) })}
                          className="w-full h-1.5 bg-[#121318] rounded appearance-none cursor-pointer accent-[#2563eb]"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center text-xs mb-1 text-slate-300 font-semibold">
                          <span>Durée de la sortie</span>
                          <span className="font-mono text-blue-400 font-extrabold">{outroDuration} ms</span>
                        </div>
                        <input
                          type="range"
                          min="100"
                          max="2000"
                          step="50"
                          value={outroDuration}
                          onChange={(e) => handleUpdateCurrentAnim({ outroDuration: Number(e.target.value) })}
                          className="w-full h-1.5 bg-[#121318] rounded appearance-none cursor-pointer accent-[#2563eb]"
                        />
                      </div>
                    </div>
                  </div>
                );
              })()}

            </div>
          ) : (
            /* PRESETS TAB */
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              <span className="text-xs font-extrabold text-slate-400 block mb-1 uppercase tracking-wider">Modèles prédéfinis :</span>

              <button
                onClick={applyStaggeredPreset}
                className="w-full p-3.5 bg-[#181920] hover:bg-[#20222d] rounded-xl border border-[#282a36] text-left transition cursor-pointer space-y-1 shadow-sm group"
              >
                <div className="flex justify-between items-center text-xs font-extrabold text-white group-hover:text-blue-400 transition">
                  <span>Séquence Cascade</span>
                  <span className="text-[10px] text-blue-400 bg-[#2563eb]/15 px-2 py-0.5 rounded-full border border-[#2563eb]/30 font-bold">Séquentiel</span>
                </div>
                <p className="text-[11px] text-slate-400">Titre à 0ms, Texte à 200ms, Verset à 400ms</p>
              </button>

              <button
                onClick={applySmoothFadePreset}
                className="w-full p-3.5 bg-[#181920] hover:bg-[#20222d] rounded-xl border border-[#282a36] text-left transition cursor-pointer space-y-1 shadow-sm group"
              >
                <div className="flex justify-between items-center text-xs font-extrabold text-white group-hover:text-blue-400 transition">
                  <span>Fondu Harmonieux</span>
                </div>
                <p className="text-[11px] text-slate-400">Apparition simultanée en fondu doux</p>
              </button>

              <button
                onClick={applyDisableAllAnimations}
                className="w-full p-3.5 bg-[#181920] hover:bg-rose-950/30 rounded-xl border border-[#282a36] hover:border-rose-800/50 text-left transition cursor-pointer space-y-1 text-rose-300 shadow-sm"
              >
                <div className="text-xs font-extrabold">Désactiver toutes les animations</div>
                <p className="text-[11px] text-slate-400">Affichage direct sans aucun effet</p>
              </button>
            </div>
          )}

        </aside>

        {/* RIGHT PREVIEW CANVAS STAGE (Realistic 16:9 Screen Render) */}
        <main className="flex-1 bg-[#121318] p-6 flex flex-col justify-between overflow-hidden relative">
          
          <div className="flex items-center justify-between bg-[#1a1b22] px-4 py-2.5 rounded-xl border border-[#282a36] flex-shrink-0 mb-3 text-xs shadow-sm">
            <div className="flex items-center gap-2 text-slate-300 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse shadow-sm shadow-blue-500/50" />
              <span>Rendu Réaliste : <strong className="text-white font-extrabold">{currentStyle.presetName || 'Thème Sélectionné'}</strong></span>
            </div>
            <div className="text-slate-400 font-mono text-[11px] flex items-center gap-3">
              <span>Mode : <strong className="text-slate-200">{currentStyle.mode || 'CUSTOM_CANVAS'}</strong></span>
              <span className="text-blue-400 font-extrabold">{formatTimecode(currentTimeMs)} / {formatTimecode(maxTimeMs)}</span>
            </div>
          </div>

          {/* 16:9 PROJECTION SCREEN CANVAS PREVIEW */}
          <div className="flex-1 bg-[#0c0d11] rounded-2xl border border-[#282a36] p-4 flex items-center justify-center relative shadow-inner overflow-hidden">
            <div className="aspect-video w-full max-w-4xl max-h-full rounded-xl overflow-hidden shadow-2xl relative border border-[#2d3040] transition-all">
              <ProjectionCanvas
                data={sampleData}
                style={{
                  ...currentStyle,
                  customElements: targetElements,
                  useCustomElements: targetElements.length > 0,
                  elementAnimations: currentAnimationsMap
                }}
                isPreview={true}
                animationTimeMs={currentTimeMs}
                elementAnimationsOverride={currentAnimationsMap}
                selectedElementId={selectedTarget}
                onSelectElement={(id) => setSelectedTarget(id || null)}
              />
            </div>
          </div>

          <div className="pt-2 text-[11px] text-slate-400 flex justify-between items-center flex-shrink-0">
            <span>Cliquez sur un élément sur la scène 16:9 ou dans la timeline ci-dessous pour ajuster son animation.</span>
          </div>

        </main>

      </div>

      {/* 3. BOTTOM TIMELINE EDITOR */}
      <footer className="h-60 bg-[#16171e] border-t border-[#262836] flex flex-col flex-shrink-0 z-30 select-none">
        
        {/* Timeline Header Bar */}
        <div className="h-9 bg-[#181920] border-b border-[#282a36] px-4 flex items-center justify-between flex-shrink-0 text-xs">
          <div className="flex items-center gap-4">
            <span className="font-extrabold text-white flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5 text-blue-400" />
              Pistes temporelles
            </span>

            {/* Legend Indicators */}
            <div className="hidden md:flex items-center gap-3 text-[11px] font-semibold">
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#2563eb]/20 border border-[#2563eb]/40 text-blue-300">
                <span className="w-2 h-2 rounded-full bg-[#2563eb]" />
                Entrée
              </span>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Emphase / Maintien
              </span>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-indigo-500/20 border border-indigo-500/40 text-indigo-300">
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                Sortie
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Playhead indicator time badge */}
            <div className="flex items-center gap-1 bg-[#121318] border border-[#282a36] px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold text-cyan-400">
              <span className="text-[10px] text-slate-400 font-sans">Curseur :</span>
              <span>{(currentTimeMs / 1000).toFixed(2)}s</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400 font-semibold">Durée :</span>
              <select
                value={maxTimeMs}
                onChange={(e) => setMaxTimeMs(Number(e.target.value))}
                className="bg-[#121318] border border-[#2d3040] rounded-lg px-2 py-0.5 text-xs text-white font-mono font-bold cursor-pointer outline-none focus:border-[#2563eb]"
              >
                <option value={3000}>3s</option>
                <option value={4000}>4s</option>
                <option value={5000}>5s</option>
                <option value={6000}>6s</option>
              </select>
            </div>
          </div>
        </div>

        {/* TIMELINE TRACKS AREA */}
        <div className="flex-1 flex overflow-hidden relative">
          
          {/* TRACK HEADERS COLUMN */}
          <div className="w-48 bg-[#181920] border-r border-[#262836] flex flex-col flex-shrink-0 z-20">
            <div className="h-6 bg-[#14151a] border-b border-[#282a36] px-3 flex items-center justify-between text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
              <span>Élément</span>
              <span>Visibilité</span>
            </div>

            {/* Global Scene Phase Banner Label */}
            <div className="h-6 bg-[#16171e] border-b border-[#282a36] px-3 flex items-center justify-between text-[10px] font-black uppercase text-amber-400 tracking-wider bg-amber-500/5">
              <span>Séquence Scène</span>
              <span className="text-[9px] text-amber-300 font-mono font-bold bg-amber-950/60 px-1 rounded border border-amber-500/30">Global</span>
            </div>

            <div className="flex-1 overflow-y-auto">
              {tracksList.map((tr) => {
                const Icon = tr.icon;
                const isSelected = selectedTarget === tr.id;
                const isHidden = hiddenTracks[tr.id];

                return (
                  <div
                    key={tr.id}
                    onClick={() => setSelectedTarget(tr.id)}
                    className={`h-11 border-b border-[#222432] px-3 flex items-center justify-between cursor-pointer transition ${
                      isSelected ? 'bg-[#222533] border-l-2 border-l-[#2563eb]' : 'hover:bg-[#1f202b]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs font-bold text-slate-200 truncate">{tr.label}</span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setHiddenTracks((prev) => ({ ...prev, [tr.id]: !prev[tr.id] }));
                      }}
                      className="text-slate-500 hover:text-white p-1 rounded transition cursor-pointer"
                    >
                      {isHidden ? <EyeOff className="w-3.5 h-3.5 text-rose-400" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* TIMELINE RULER & CLIPS */}
          <div
            ref={timelineTrackRef}
            onMouseDown={handleTimelineRulerMouseDown}
            className="flex-1 flex flex-col bg-[#121318] relative overflow-x-auto overflow-y-auto cursor-crosshair select-none"
          >
            {/* DRAGGABLE PLAYHEAD CURSOR & TIME PIN */}
            <div
              style={{ left: `${(currentTimeMs / maxTimeMs) * 100}%` }}
              onMouseDown={(e) => {
                e.stopPropagation();
                setIsScrubbingPlayhead(true);
              }}
              className="absolute top-0 bottom-0 w-1 bg-cyan-400 z-50 cursor-col-resize select-none -ml-0.5 shadow-[0_0_12px_#06b6d4] group"
            >
              {/* Playhead Head Diamond & Time Badge */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center cursor-col-resize group-hover:scale-105 transition-transform">
                <div className={`px-1.5 py-0.5 text-[9px] font-mono font-black rounded-t shadow-md border border-cyan-200 transition-all ${
                  isScrubbingPlayhead ? 'bg-cyan-300 text-slate-950 scale-110 shadow-[0_0_12px_rgba(6,182,212,0.9)]' : 'bg-cyan-400 text-slate-950'
                }`}>
                  {(currentTimeMs / 1000).toFixed(2)}s
                </div>
                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[7px] border-t-cyan-400 -mt-px drop-shadow" />
              </div>
            </div>

            {/* RULER MARKS */}
            <div
              onMouseDown={handleTimelineRulerMouseDown}
              className="h-6 bg-[#14151a] border-b border-[#282a36] flex items-center relative text-[10px] text-slate-400 font-mono flex-shrink-0 cursor-col-resize select-none"
            >
              {Array.from({ length: Math.floor(maxTimeMs / 1000) + 1 }).map((_, i) => (
                <div
                  key={i}
                  style={{ left: `${(i * 1000 / maxTimeMs) * 100}%` }}
                  className="absolute pl-1 border-l border-[#282a36] h-full flex items-center"
                >
                  {i}s
                </div>
              ))}
            </div>

            {/* GLOBAL SCENE SEQUENCE PHASE STRIP (BANNER) */}
            {(() => {
              const introEndPct = (globalTimelinePhases.introEndMs / maxTimeMs) * 100;
              const outroStartPct = (globalTimelinePhases.outroStartMs / maxTimeMs) * 100;
              const midWidthPct = Math.max(0, outroStartPct - introEndPct);
              const outroWidthPct = Math.max(0, 100 - outroStartPct);

              return (
                <div className="h-6 bg-[#16171e] border-b border-[#282a36] flex items-center relative flex-shrink-0 text-[10px] font-extrabold select-none overflow-hidden z-10">
                  {/* Segment 1: Entrée Globale */}
                  {introEndPct > 0 && (
                    <div
                      style={{ left: '0%', width: `${introEndPct}%` }}
                      className="absolute top-0 bottom-0 bg-blue-600/30 border-r-2 border-blue-400 px-2 flex items-center justify-between text-blue-200 truncate group"
                      title={`Phase d'Entrée globale de la scène (0.00s à ${(globalTimelinePhases.introEndMs / 1000).toFixed(2)}s)`}
                    >
                      <span className="truncate flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                        <span>Phase Entrée</span>
                      </span>
                      <span className="font-mono text-[9px] text-blue-300 opacity-90 ml-1">
                        {(globalTimelinePhases.introEndMs / 1000).toFixed(2)}s
                      </span>
                    </div>
                  )}

                  {/* Segment 2: Emphase & Maintien Global (non bouclée / fixe) */}
                  <div
                    style={{ left: `${introEndPct}%`, width: `${midWidthPct}%` }}
                    className="absolute top-0 bottom-0 bg-amber-500/25 border-r-2 border-amber-400 px-2 flex items-center justify-between text-amber-200 truncate group"
                    title={`Phase d'Emphase / Maintien global de la scène (${(globalTimelinePhases.introEndMs / 1000).toFixed(2)}s à ${(globalTimelinePhases.outroStartMs / 1000).toFixed(2)}s)`}
                  >
                    <span className="truncate flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                      <span>Phase Emphase / Maintien</span>
                    </span>
                    <span className="font-mono text-[9px] text-amber-300 opacity-90 ml-1">
                      {((globalTimelinePhases.outroStartMs - globalTimelinePhases.introEndMs) / 1000).toFixed(2)}s
                    </span>
                  </div>

                  {/* Segment 3: Sortie Globale */}
                  {outroWidthPct > 0 && (
                    <div
                      style={{ left: `${outroStartPct}%`, width: `${outroWidthPct}%` }}
                      className="absolute top-0 bottom-0 bg-indigo-600/30 px-2 flex items-center justify-between text-indigo-200 truncate group"
                      title={`Phase de Sortie globale de la scène (${(globalTimelinePhases.outroStartMs / 1000).toFixed(2)}s à ${(maxTimeMs / 1000).toFixed(2)}s)`}
                    >
                      <span className="truncate flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                        <span>Phase Sortie</span>
                      </span>
                      <span className="font-mono text-[9px] text-indigo-300 opacity-90 ml-1">
                        {(globalTimelinePhases.outroStartMs / 1000).toFixed(2)}s
                      </span>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* TRACK BLOCKS & PHASE GRID OVERLAYS */}
            <div className="flex-1 flex flex-col relative">
              {/* Global Timeline Phase Background Overlays Across ALL Tracks */}
              {(() => {
                const globalIntroEndPct = (globalTimelinePhases.introEndMs / maxTimeMs) * 100;
                const globalOutroStartPct = (globalTimelinePhases.outroStartMs / maxTimeMs) * 100;

                return (
                  <>
                    {/* Global Phase 1 Backdrop (Entrance) */}
                    <div
                      style={{ left: '0%', width: `${globalIntroEndPct}%` }}
                      className="absolute top-0 bottom-0 bg-blue-500/[0.03] border-r border-blue-500/20 pointer-events-none z-0"
                    />

                    {/* Global Phase 2 Backdrop (Emphasis / Maintien) */}
                    <div
                      style={{ left: `${globalIntroEndPct}%`, width: `${Math.max(0, globalOutroStartPct - globalIntroEndPct)}%` }}
                      className="absolute top-0 bottom-0 bg-amber-500/[0.03] pointer-events-none z-0"
                    />

                    {/* Global Phase 3 Backdrop (Exit) */}
                    <div
                      style={{ left: `${globalOutroStartPct}%`, right: '0%' }}
                      className="absolute top-0 bottom-0 bg-indigo-500/[0.03] border-l border-indigo-500/20 pointer-events-none z-0"
                    />

                    {/* Global Fin d'Entrée Vertical Line */}
                    {globalTimelinePhases.introEndMs > 0 && (
                      <div
                        style={{ left: `${globalIntroEndPct}%` }}
                        className="absolute top-0 bottom-0 w-px border-l-2 border-dashed border-blue-400/80 pointer-events-none z-20 shadow-[0_0_8px_rgba(37,99,235,0.4)]"
                      />
                    )}

                    {/* Global Début de Sortie Vertical Line */}
                    {globalTimelinePhases.outroStartMs < maxTimeMs && (
                      <div
                        style={{ left: `${globalOutroStartPct}%` }}
                        className="absolute top-0 bottom-0 w-px border-l-2 border-dashed border-indigo-400/80 pointer-events-none z-20 shadow-[0_0_8px_rgba(99,102,241,0.4)]"
                      />
                    )}
                  </>
                );
              })()}
              {tracksList.map((tr) => {
                const anim = getAnimConfigForTarget(tr.id);
                const isSelected = selectedTarget === tr.id;

                const introDelay = anim.introDelay ?? 0;
                const introDur = anim.introDuration ?? 500;
                const introType = anim.introType || 'none';
                const introEndMs = introDelay + (introType !== 'none' ? introDur : 0);

                const outroDelay = anim.outroDelay ?? 2500;
                const outroDur = anim.outroDuration ?? 500;
                const outroType = anim.outroType || 'none';

                const emphasisType = anim.emphasisType || 'none';
                const emphasisLoop = anim.emphasisLoop ?? false;

                const introLeftPct = (introDelay / maxTimeMs) * 100;
                const introWidthPct = (introDur / maxTimeMs) * 100;

                const midLeftPct = (introEndMs / maxTimeMs) * 100;
                const midWidthPct = Math.max(0, ((outroDelay - introEndMs) / maxTimeMs) * 100);

                const outroLeftPct = (outroDelay / maxTimeMs) * 100;
                const outroWidthPct = (outroDur / maxTimeMs) * 100;

                return (
                  <div
                    key={tr.id}
                    onClick={() => setSelectedTarget(tr.id)}
                    className={`h-11 border-b border-[#222432] relative flex items-center ${
                      isSelected ? 'bg-[#1a1c26]/80' : ''
                    }`}
                  >
                    {/* Vertical guide markers for selected track */}
                    {isSelected && introType !== 'none' && (
                      <div
                        style={{ left: `${(introEndMs / maxTimeMs) * 100}%` }}
                        className="absolute top-0 bottom-0 w-px border-l border-dashed border-blue-400/80 pointer-events-none z-20"
                      >
                        <span className="absolute -top-3.5 -left-8 text-[9px] font-mono text-blue-300 bg-[#121318]/90 px-1 rounded border border-blue-500/30">
                          Fin Entrée: {(introEndMs / 1000).toFixed(1)}s
                        </span>
                      </div>
                    )}

                    {isSelected && outroType !== 'none' && (
                      <div
                        style={{ left: `${(outroDelay / maxTimeMs) * 100}%` }}
                        className="absolute top-0 bottom-0 w-px border-l border-dashed border-indigo-400/80 pointer-events-none z-20"
                      >
                        <span className="absolute -top-3.5 -left-8 text-[9px] font-mono text-indigo-300 bg-[#121318]/90 px-1 rounded border border-indigo-500/30">
                          Début Sortie: {(outroDelay / 1000).toFixed(1)}s
                        </span>
                      </div>
                    )}

                    {/* 1. INTRO BLOCK */}
                    {introType !== 'none' && (
                      <div
                        style={{
                          left: `${introLeftPct}%`,
                          width: `${Math.max(3, introWidthPct)}%`,
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTarget(tr.id);
                          setActivePhase('intro');
                          setActiveTab('inspector');
                        }}
                        onMouseDown={(e) => handleStartDragBlock(e, tr.id, 'intro', 'move')}
                        className={`absolute h-8 bg-[#2563eb]/25 border-2 ${
                          isSelected && activePhase === 'intro' ? 'border-blue-400 ring-2 ring-blue-500/40 bg-[#2563eb]/40' : 'border-[#2563eb]/80'
                        } rounded-lg px-2 flex items-center justify-between text-[10px] font-bold text-blue-200 cursor-grab active:cursor-grabbing z-10 shadow-sm hover:bg-[#2563eb]/40 transition group`}
                        title={`Entrée: ${introType} (${(introDelay/1000).toFixed(1)}s - ${((introDelay+introDur)/1000).toFixed(1)}s)`}
                      >
                        <div className="flex items-center gap-1 truncate">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                          <span className="truncate">Entrée: {introType}</span>
                        </div>
                        <span className="hidden sm:inline font-mono text-[9px] opacity-80 bg-blue-950/60 px-1 rounded ml-1 flex-shrink-0">
                          {(introDur/1000).toFixed(1)}s
                        </span>
                        <div
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            handleStartDragBlock(e, tr.id, 'intro', 'resize');
                          }}
                          className="w-1.5 h-5 bg-blue-400 rounded-full cursor-ew-resize opacity-70 group-hover:opacity-100 ml-1 flex-shrink-0"
                          title="Redimensionner la durée d'entrée"
                        />
                      </div>
                    )}

                    {/* 2. EMPHASE BLOCK (ONLY IF EMPHASIS IS ACTIVE ON ELEMENT) */}
                    {midWidthPct > 0 && emphasisType !== 'none' && (
                      <div
                        style={{
                          left: `${midLeftPct}%`,
                          width: `${midWidthPct}%`,
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTarget(tr.id);
                          setActivePhase('emphasis');
                          setActiveTab('inspector');
                        }}
                        className={`absolute h-7 rounded-lg px-2 flex items-center justify-between text-[10px] font-bold cursor-pointer transition z-0 ${
                          isSelected && activePhase === 'emphasis'
                            ? 'bg-amber-500/35 border-2 border-amber-400 text-amber-200 shadow-sm ring-2 ring-amber-500/40'
                            : 'bg-amber-500/20 border border-amber-400/60 text-amber-300 hover:bg-amber-500/30'
                        }`}
                        title={`Emphase: ${emphasisType} (${emphasisLoop ? 'En boucle' : 'Ponctuel'})`}
                      >
                        <div className="flex items-center gap-1 truncate">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                          <span className="truncate">Emphase: {emphasisType}</span>
                          {emphasisLoop && (
                            <span className="text-[9px] bg-amber-950/80 px-1 rounded border border-amber-500/40 font-mono text-amber-300 ml-1">∞</span>
                          )}
                        </div>
                        <span className="hidden lg:inline font-mono text-[9px] opacity-75">
                          {((outroDelay - introEndMs)/1000).toFixed(1)}s
                        </span>
                      </div>
                    )}

                    {/* 3. OUTRO BLOCK */}
                    {outroType !== 'none' && (
                      <div
                        style={{
                          left: `${outroLeftPct}%`,
                          width: `${Math.max(3, outroWidthPct)}%`,
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTarget(tr.id);
                          setActivePhase('outro');
                          setActiveTab('inspector');
                        }}
                        onMouseDown={(e) => handleStartDragBlock(e, tr.id, 'outro', 'move')}
                        className={`absolute h-8 bg-indigo-500/25 border-2 ${
                          isSelected && activePhase === 'outro' ? 'border-indigo-300 ring-2 ring-indigo-500/40 bg-indigo-500/40' : 'border-indigo-400/80'
                        } rounded-lg px-2 flex items-center justify-between text-[10px] font-bold text-indigo-200 cursor-grab active:cursor-grabbing z-10 shadow-sm hover:bg-indigo-500/40 transition group`}
                        title={`Sortie: ${outroType} (${(outroDelay/1000).toFixed(1)}s - ${((outroDelay+outroDur)/1000).toFixed(1)}s)`}
                      >
                        <div className="flex items-center gap-1 truncate">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                          <span className="truncate">Sortie: {outroType}</span>
                        </div>
                        <span className="hidden sm:inline font-mono text-[9px] opacity-80 bg-indigo-950/60 px-1 rounded ml-1 flex-shrink-0">
                          {(outroDur/1000).toFixed(1)}s
                        </span>
                        <div
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            handleStartDragBlock(e, tr.id, 'outro', 'resize');
                          }}
                          className="w-1.5 h-5 bg-indigo-400 rounded-full cursor-ew-resize opacity-70 group-hover:opacity-100 ml-1 flex-shrink-0"
                          title="Redimensionner la durée de sortie"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>

        </div>

      </footer>

    </div>
  );
};
