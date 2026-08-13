import React, { useEffect, useRef, useState } from 'react';
import { ElementAnimationsMap, ProjectedData, ProjectionStyle, SlideElement } from '../types';
import { loadGoogleFontIfNeeded } from '../utils/fontLoader';
import { getElementAnimationStyle, getComputedElementVisibilityStyle } from '../utils/animationUtils';
import { ProjectionAnimationManager, cleanAnimationClasses } from '../utils/ProjectionAnimationManager';
import logoImg from '../assets/images/logo.png';
import {
  BookOpen,
  Bookmark,
  Tv,
  Radio,
  Mic,
  Star,
  Sparkles,
  Shield,
  Quote,
  Heart,
  Church,
  Flame,
  Music,
  Volume2,
  Tag,
  Image as ImageIcon,
  Video,
  Film,
  Layout
} from 'lucide-react';

// Helper to render custom icons or emblems
const renderCustomIcon = (iconName?: string) => {
  const name = (iconName || '').toLowerCase();
  if (name === 'cross') {
    return (
      <svg className="w-full h-full fill-current" viewBox="0 0 24 24">
        <path d="M10 2h4v6h6v4h-6v10h-4V12H4V8h6V2z" />
      </svg>
    );
  }
  if (name === 'church') return <Church className="w-full h-full" />;
  if (name === 'bible' || name === 'book') return <BookOpen className="w-full h-full" />;
  if (name === 'bookmark') return <Bookmark className="w-full h-full" />;
  if (name === 'tv' || name === 'live') return <Tv className="w-full h-full" />;
  if (name === 'mic') return <Mic className="w-full h-full" />;
  if (name === 'star') return <Star className="w-full h-full" />;
  if (name === 'sparkles') return <Sparkles className="w-full h-full" />;
  if (name === 'music') return <Music className="w-full h-full" />;
  if (name === 'quote') return <Quote className="w-full h-full" />;
  if (name === 'shield') return <Shield className="w-full h-full" />;
  if (name === 'heart') return <Heart className="w-full h-full" />;
  if (name === 'tag') return <Tag className="w-full h-full" />;
  return <Sparkles className="w-full h-full" />;
};

interface ProjectionCanvasProps {
  data: ProjectedData | null;
  style: ProjectionStyle;
  isPreview?: boolean; // For scaling inside editor
  className?: string;
  canvasBgMode?: 'video' | 'grid' | 'chroma' | 'color' | 'black';
  canvasCustomBgColor?: string;
  selectedElementId?: string | null;
  selectedElementIds?: string[];
  animationTimeMs?: number;
  elementAnimationsOverride?: ElementAnimationsMap;
  disableAnimations?: boolean;
  onSelectElement?: (id: string | null, isMulti?: boolean) => void;
  onUpdateElementPosition?: (
    id: string,
    newPos: { x: number; y: number; width: number; height: number },
    isFinal?: boolean
  ) => void;
  onUpdateMultiplePositions?: (
    updates: Array<{ id: string; pos: { x: number; y: number; width: number; height: number } }>,
    isFinal?: boolean
  ) => void;
}

export const ProjectionCanvas: React.FC<ProjectionCanvasProps> = ({
  data,
  style,
  isPreview = false,
  className = '',
  canvasBgMode,
  canvasCustomBgColor,
  selectedElementId,
  selectedElementIds,
  animationTimeMs,
  elementAnimationsOverride,
  disableAnimations = false,
  onSelectElement,
  onUpdateElementPosition,
  onUpdateMultiplePositions
}) => {
  // Load any Google Fonts dynamically if specified
  useEffect(() => {
    if (style.fontFamily) {
      loadGoogleFontIfNeeded(style.fontFamily);
    }
    if (style.customElements) {
      style.customElements.forEach((el) => {
        if (el.style?.fontFamily) {
          loadGoogleFontIfNeeded(el.style.fontFamily);
        }
      });
    }
  }, [style.fontFamily, style.customElements]);

  // Active selected IDs
  const activeSelectedIds = selectedElementIds !== undefined
    ? selectedElementIds
    : (selectedElementId ? [selectedElementId] : []);

  // Session vs Slide Tracking & Outro Exit Handling
  const sessionKey = data && data.texte && data.sermonId !== 'BLACK'
    ? (data.sermonId === 'BIBLE'
        ? 'BIBLE'
        : data.sermonId === 'LYRICS'
        ? `LYRICS_${data.titre_francais || 'CANTIQUES'}`
        : `SERMON_${data.sermonId}`)
    : 'EMPTY';

  // Outro Exit state when user clears/removes projection
  const [exitingData, setExitingData] = useState<ProjectedData | null>(null);
  const [isExiting, setIsExiting] = useState<boolean>(false);
  const [isIdle, setIsIdle] = useState<boolean>(false);
  const prevDataRef = useRef<ProjectedData | null>(null);
  const rootSceneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Detect exit phase (explicit 'EXITING'/'OUT' or clearing content)
    const isExitPhase = data && (data.animPhase === 'EXITING' || data.animPhase === 'OUT');
    const activeText = data && data.texte && data.sermonId !== 'BLACK' && !isExitPhase;
    const prevText = prevDataRef.current && prevDataRef.current.texte && prevDataRef.current.sermonId !== 'BLACK';

    const shouldExit = (!activeText || isExitPhase) && (prevText || (data && data.texte && data.sermonId !== 'BLACK'));

    if (shouldExit && !isExiting) {
      setExitingData(prevDataRef.current || data);
      setIsExiting(true);
      setIsIdle(false);
      prevDataRef.current = null;
      return;
    }
    if (activeText) {
      setIsIdle(false);
      setIsExiting(false);
      prevDataRef.current = data;
    } else if (!isExiting) {
      prevDataRef.current = null;
    }
  }, [data, isExiting]);

  // Lifecycle monitoring for OUT animation completion via ProjectionAnimationManager
  useEffect(() => {
    if (isExiting && rootSceneRef.current) {
      const cleanup = ProjectionAnimationManager.attachOutAnimationListener(
        rootSceneRef.current,
        () => {
          setIsExiting(false);
          setExitingData(null);
          setIsIdle(true);
        },
        style.transitionDuration || 450
      );
      return cleanup;
    }
  }, [isExiting, style.transitionDuration]);

  const activeData = isExiting ? exitingData : data;
  const isBlackScreen = (!activeData || activeData.sermonId === 'BLACK') && !isExiting;

  // Extract reference label parts
  const getSermonHeader = () => {
    if (!activeData) return 'LE TROISIÈME SCEAU — § 142';
    if (activeData.sermonId === 'BIBLE') {
      return activeData.titre_francais || 'SAINTE BIBLE';
    }
    if (activeData.sermonId === 'LYRICS') {
      return activeData.titre_francais || 'CANTIQUES';
    }
    const title = activeData.titre_francais || 'MESSAGE DU PROPHÈTE';
    const ref = getReferenceLabel();
    if (ref && ref !== 'CITATION') {
      return `${title} — ${ref}`;
    }
    return title;
  };

  const getReferenceLabel = () => {
    if (!activeData) return '§ 142';
    if (activeData.sermonId === 'BIBLE') {
      return activeData.numero ? `${activeData.numero}` : 'BIBLE';
    }
    if (activeData.sermonId === 'LYRICS') {
      return activeData.numero ? `${activeData.numero}` : 'CANTIQUE';
    }
    const prefix = activeData.type_structure === 'PAGE' ? 'Page' : '§';
    const num = activeData.numero ? `${prefix} ${activeData.numero}` : '';
    const blockPart = activeData.totalBlocks && activeData.totalBlocks > 1 ? ` (${activeData.blockIndex}/${activeData.totalBlocks})` : '';
    return `${num}${blockPart}`.trim() || 'CITATION';
  };

  // Helper to render value bound to element
  const getElementContent = (el: SlideElement) => {
    if (el.binding === 'sermon_text') {
      if (activeData && activeData.sermonId !== 'BLACK' && activeData.texte) {
        return activeData.texte;
      }
      return isEditorMode ? "Ceci est un exemple de texte de sermon pour l'aperçu du designer." : '';
    }
    if (el.binding === 'sermon_header') {
      if (activeData && activeData.sermonId !== 'BLACK' && activeData.texte) {
        return getSermonHeader();
      }
      return isEditorMode ? getSermonHeader() : '';
    }
    if (el.binding === 'sermon_reference') {
      if (activeData && activeData.sermonId !== 'BLACK' && activeData.texte) {
        return getReferenceLabel();
      }
      return isEditorMode ? getReferenceLabel() : '';
    }
    if (el.binding === 'static_text') {
      if (
        el.type === 'shape' ||
        el.type === 'circle' ||
        el.type === 'line' ||
        el.type === 'divider' ||
        el.type === 'icon' ||
        el.type === 'image' ||
        el.type === 'video'
      ) {
        return el.staticText || '';
      }
      return el.staticText || 'Texte Personnalisé';
    }
    if (el.binding === 'logo') {
      return 'MaAndiko Studio';
    }
    return '';
  };

  // Determine mode
  const mode = style.mode || 'LOWER_THIRD';

  // Arrière-plan de la scène (Canvas Background)
  const getSceneBackground = () => {
    if (canvasBgMode === 'color') return '';
    if (canvasBgMode === 'chroma' || style.theme === 'chroma' || style.bgType === 'chroma') return 'bg-[#00ff00]';
    if (canvasBgMode === 'grid') return 'bg-[#0a0e1a]';
    if (style.theme === 'transparent' || style.bgType === 'transparent') return 'bg-transparent';
    if (style.theme === 'gold') return 'bg-gradient-to-br from-[#0f0c05] via-[#1a1508] to-[#0f0c05] text-[#fff3d1]';
    if (style.theme === 'blue') return 'bg-gradient-to-br from-[#030712] via-[#0a1830] to-[#030712] text-[#e6f0ff]';
    if (mode === 'LOWER_THIRD' || mode === 'CENTER_CARD' || mode === 'TOP_BANNER' || mode === 'CUSTOM_CANVAS') {
      return 'bg-transparent';
    }
    return 'bg-black text-white';
  };

  // Resolved solid/rgba background color for scene canvas
  const resolvedCanvasBg = React.useMemo(() => {
    if (canvasBgMode === 'color') return canvasCustomBgColor || '#00ff00';
    if (canvasBgMode === 'chroma' || style.theme === 'chroma' || style.bgType === 'chroma' || style.containerBg === '#00ff00') return '#00ff00';
    if (canvasBgMode === 'grid') return 'transparent';
    if (canvasBgMode === 'black') return '#000000';
    if (style.theme === 'transparent' || style.bgType === 'transparent' || style.containerBg === 'transparent') return 'transparent';
    if (style.theme === 'gold') return '#0f0c05';
    if (style.theme === 'blue') return '#030712';
    if (style.containerBg && style.containerBg.trim() !== '') return style.containerBg;
    return 'rgba(8, 11, 18, 0.95)';
  }, [style.theme, style.bgType, style.containerBg, canvasBgMode, canvasCustomBgColor]);

  // Compute effective background type for media rendering
  const effectiveBgType = React.useMemo(() => {
    if (canvasBgMode === 'color') return 'color';
    if (canvasBgMode === 'chroma' || style.bgType === 'chroma' || style.theme === 'chroma' || style.containerBg === '#00ff00') return 'chroma';
    if (style.bgType === 'transparent' || style.theme === 'transparent' || style.containerBg === 'transparent') return 'transparent';
    if (style.bgVideoUrl && style.bgVideoUrl.trim() !== '' && style.bgType !== 'color') return 'video';
    if (style.bgImageUrl && style.bgImageUrl.trim() !== '' && style.bgType !== 'color') return 'image';
    return style.bgType || 'color';
  }, [style.bgType, style.theme, style.containerBg, style.bgVideoUrl, style.bgImageUrl, canvasBgMode]);

  // Text alignment
  const textAlign = style.align || 'center';

  const canvasRef = React.useRef<HTMLDivElement>(null);

  // Mouse & Touch Dragging and Resizing Logic
  const handleMouseDown = (
    e: React.MouseEvent,
    el: SlideElement,
    action: 'move' | 'resize'
  ) => {
    if (!onUpdateElementPosition && !onUpdateMultiplePositions) return;
    if (!canvasRef.current) return;
    e.stopPropagation();
    e.preventDefault();

    const isMultiKey = e.shiftKey || e.metaKey || e.ctrlKey;

    let targetIds: string[] = [];
    if (isMultiKey) {
      if (onSelectElement) {
        onSelectElement(el.id, true);
      }
      targetIds = activeSelectedIds.includes(el.id)
        ? activeSelectedIds
        : [...activeSelectedIds, el.id];
    } else {
      if (!activeSelectedIds.includes(el.id)) {
        if (onSelectElement) {
          onSelectElement(el.id, false);
        }
        targetIds = [el.id];
      } else {
        targetIds = activeSelectedIds.length > 0 ? activeSelectedIds : [el.id];
      }
    }

    const elementsToMove = (style.customElements || []).filter(item => targetIds.includes(item.id));
    if (elementsToMove.length === 0) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;

    const startPositions = elementsToMove.map(item => ({
      id: item.id,
      pos: { ...item.position }
    }));

    let animationFrameId: number | null = null;
    let latestUpdates = startPositions;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!rect.width || !rect.height) return;
      const deltaX = ((moveEvent.clientX - startX) / rect.width) * 100;
      const deltaY = ((moveEvent.clientY - startY) / rect.height) * 100;

      if (action === 'move') {
        latestUpdates = startPositions.map(item => {
          const newX = Math.max(0, Math.min(100 - item.pos.width, item.pos.x + deltaX));
          const newY = Math.max(0, Math.min(100 - item.pos.height, item.pos.y + deltaY));
          return {
            id: item.id,
            pos: {
              ...item.pos,
              x: Math.round(newX * 10) / 10,
              y: Math.round(newY * 10) / 10
            }
          };
        });
      } else if (action === 'resize') {
        latestUpdates = startPositions.map(item => {
          const newW = Math.max(1, Math.min(100 - item.pos.x, item.pos.width + deltaX));
          const newH = Math.max(1, Math.min(100 - item.pos.y, item.pos.height + deltaY));
          return {
            id: item.id,
            pos: {
              ...item.pos,
              width: Math.round(newW * 10) / 10,
              height: Math.round(newH * 10) / 10
            }
          };
        });
      }

      if (!animationFrameId) {
        animationFrameId = requestAnimationFrame(() => {
          if (onUpdateMultiplePositions) {
            onUpdateMultiplePositions(latestUpdates, false);
          } else if (onUpdateElementPosition && latestUpdates[0]) {
            onUpdateElementPosition(latestUpdates[0].id, latestUpdates[0].pos, false);
          }
          animationFrameId = null;
        });
      }
    };

    const handleMouseUp = () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      
      if (onUpdateMultiplePositions) {
        onUpdateMultiplePositions(latestUpdates, true);
      } else if (onUpdateElementPosition && latestUpdates[0]) {
        onUpdateElementPosition(latestUpdates[0].id, latestUpdates[0].pos, true);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleTouchStart = (
    e: React.TouchEvent,
    el: SlideElement,
    action: 'move' | 'resize'
  ) => {
    if (!onUpdateElementPosition && !onUpdateMultiplePositions) return;
    if (!canvasRef.current || e.touches.length === 0) return;
    e.stopPropagation();

    let targetIds = activeSelectedIds.includes(el.id) ? activeSelectedIds : [el.id];
    if (!activeSelectedIds.includes(el.id) && onSelectElement) {
      onSelectElement(el.id, false);
    }

    const elementsToMove = (style.customElements || []).filter(item => targetIds.includes(item.id));
    if (elementsToMove.length === 0) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const startX = touch.clientX;
    const startY = touch.clientY;

    const startPositions = elementsToMove.map(item => ({
      id: item.id,
      pos: { ...item.position }
    }));

    let animationFrameId: number | null = null;
    let latestUpdates = startPositions;

    const handleTouchMove = (moveEvent: TouchEvent) => {
      if (!rect.width || !rect.height || moveEvent.touches.length === 0) return;
      const t = moveEvent.touches[0];
      const deltaX = ((t.clientX - startX) / rect.width) * 100;
      const deltaY = ((t.clientY - startY) / rect.height) * 100;

      if (action === 'move') {
        latestUpdates = startPositions.map(item => {
          const newX = Math.max(0, Math.min(100 - item.pos.width, item.pos.x + deltaX));
          const newY = Math.max(0, Math.min(100 - item.pos.height, item.pos.y + deltaY));
          return {
            id: item.id,
            pos: {
              ...item.pos,
              x: Math.round(newX * 10) / 10,
              y: Math.round(newY * 10) / 10
            }
          };
        });
      } else if (action === 'resize') {
        latestUpdates = startPositions.map(item => {
          const newW = Math.max(1, Math.min(100 - item.pos.x, item.pos.width + deltaX));
          const newH = Math.max(1, Math.min(100 - item.pos.y, item.pos.height + deltaY));
          return {
            id: item.id,
            pos: {
              ...item.pos,
              width: Math.round(newW * 10) / 10,
              height: Math.round(newH * 10) / 10
            }
          };
        });
      }

      if (!animationFrameId) {
        animationFrameId = requestAnimationFrame(() => {
          if (onUpdateMultiplePositions) {
            onUpdateMultiplePositions(latestUpdates, false);
          } else if (onUpdateElementPosition && latestUpdates[0]) {
            onUpdateElementPosition(latestUpdates[0].id, latestUpdates[0].pos, false);
          }
          animationFrameId = null;
        });
      }
    };

    const handleTouchEnd = () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      if (onUpdateMultiplePositions) {
        onUpdateMultiplePositions(latestUpdates, true);
      } else if (onUpdateElementPosition && latestUpdates[0]) {
        onUpdateElementPosition(latestUpdates[0].id, latestUpdates[0].pos, true);
      }
    };

    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);
  };

  // Font Size with Smart Auto-Fit Scale or Fixed Mode
  const getCalculatedFontSize = () => {
    const txtLength = data?.texte?.length || 150;
    const fitMode = style.textFitMode || 'auto-scale-text';
    const effectiveFontSize = style.fontSize || style.customFontSize;

    if (fitMode === 'fixed' || fitMode === 'auto-expand-box') {
      if (effectiveFontSize) {
        if (typeof effectiveFontSize === 'number') {
          return isPreview ? `${Math.max(10, Math.round(effectiveFontSize * 0.45))}px` : `${effectiveFontSize}px`;
        }
        if (typeof effectiveFontSize === 'string' && effectiveFontSize.endsWith('px')) {
          const num = parseFloat(effectiveFontSize);
          return isPreview ? `${Math.max(10, Math.round(num * 0.45))}px` : `${num}px`;
        }
        if (typeof effectiveFontSize === 'string') return effectiveFontSize;
      }
      if (isPreview) {
        if (mode === 'LOWER_THIRD' || mode === 'TOP_BANNER') return '1.1rem';
        return '1.4rem';
      } else {
        if (mode === 'LOWER_THIRD' || mode === 'TOP_BANNER') return '2.5rem';
        return '3.2rem';
      }
    }

    // Default 'auto-scale-text': scale font size up for short text and down for long text
    if (effectiveFontSize) {
      let scale = 1.0;
      if (txtLength > 500) scale = 0.40;
      else if (txtLength > 350) scale = 0.52;
      else if (txtLength > 250) scale = 0.65;
      else if (txtLength > 150) scale = 0.78;
      else if (txtLength > 80) scale = 0.88;
      else if (txtLength < 35) scale = 1.25;

      if (typeof effectiveFontSize === 'number') {
        const px = Math.round(effectiveFontSize * scale);
        return isPreview ? `${Math.max(10, Math.round(px * 0.45))}px` : `${Math.max(16, px)}px`;
      }
      if (typeof effectiveFontSize === 'string' && effectiveFontSize.endsWith('px')) {
        const numeric = parseFloat(effectiveFontSize);
        if (!isNaN(numeric)) {
          const px = Math.round(numeric * scale);
          return isPreview ? `${Math.max(10, Math.round(px * 0.45))}px` : `${Math.max(16, px)}px`;
        }
      }
      if (typeof effectiveFontSize === 'string' && effectiveFontSize.endsWith('rem')) {
        const numeric = parseFloat(effectiveFontSize);
        if (!isNaN(numeric)) {
          const rem = (numeric * scale).toFixed(2);
          return isPreview ? `${Math.max(0.7, numeric * 0.45 * scale).toFixed(2)}rem` : `${rem}rem`;
        }
      }
      return effectiveFontSize;
    }

    if (isPreview) {
      if (mode === 'LOWER_THIRD' || mode === 'TOP_BANNER') {
        return txtLength > 450 ? '0.65rem' : txtLength > 350 ? '0.75rem' : txtLength > 250 ? '0.85rem' : txtLength > 150 ? '1rem' : txtLength < 40 ? '1.35rem' : '1.2rem';
      }
      return txtLength > 450 ? '0.75rem' : txtLength > 350 ? '0.85rem' : txtLength > 250 ? '1rem' : txtLength > 150 ? '1.2rem' : txtLength < 40 ? '1.8rem' : '1.5rem';
    } else {
      if (mode === 'LOWER_THIRD' || mode === 'TOP_BANNER') {
        return txtLength > 450 ? '1.25rem' : txtLength > 350 ? '1.5rem' : txtLength > 250 ? '1.85rem' : txtLength > 150 ? '2.25rem' : txtLength < 40 ? '3.2rem' : '2.7rem';
      }
      return txtLength > 450 ? '1.6rem' : txtLength > 350 ? '1.9rem' : txtLength > 250 ? '2.3rem' : txtLength > 150 ? '2.8rem' : txtLength < 40 ? '4.2rem' : '3.5rem';
    }
  };

  // Check if we use custom element canvas mode
  const useCustomCanvas = style.useCustomElements || mode === 'CUSTOM_CANVAS' || (Boolean(style.customElements && style.customElements.length > 0) && style.useCustomElements !== false);

  // Box background style
  const containerBgStyle = style.containerBg || (
    style.theme === 'gold' ? 'rgba(25, 20, 10, 0.95)' :
    style.theme === 'blue' ? 'rgba(10, 20, 40, 0.95)' :
    style.theme === 'glass' ? 'rgba(255, 255, 255, 0.12)' :
    'rgba(8, 11, 18, 0.95)'
  );

  const containerBorderColor = style.containerBorderColor || '#ffffff';
  const containerBorderWidth = style.containerBorderWidth !== undefined ? style.containerBorderWidth : 3;
  const containerBorderRadius = style.containerBorderRadius !== undefined ? style.containerBorderRadius : 24;
  const containerPadding = style.containerPadding !== undefined ? style.containerPadding : (isPreview ? 16 : 28);
  const containerMaxWidth = style.containerMaxWidth !== undefined ? `${style.containerMaxWidth}%` : '100%';
  const containerBottomMargin = style.containerBottomMargin !== undefined ? `${style.containerBottomMargin}%` : '0%';

  const showHeader = style.showHeader !== false;
  const showBadge = style.showBadge !== false;

  const activeTransition = style.slideTransition || 'fade';
  const transitionDuration = style.transitionDuration !== undefined ? style.transitionDuration : 350;
  
  // In editor mode (when custom interactive elements are actively selectable or disableAnimations is true and NOT exiting),
  // disable live keyframe transitions so handles remain aligned.
  // Note: During exit (isExiting === true), animation must ALWAYS play!
  const isEditorMode = (Boolean(disableAnimations) || (isPreview && onSelectElement !== undefined)) && !isExiting;

  // Unified ProjectionAnimationManager separates incoming/outgoing element animations from scene transitions
  const animState = ProjectionAnimationManager.calculateAnimationState({
    data,
    isExiting,
    exitingData,
    style,
    elementAnimationsOverride,
    animationTimeMs,
    isEditorMode,
    disableAnimations,
    isIdle,
  });

  const {
    phase: currentPhase,
    sceneTransitionClass: transitionClass,
    slideKey,
    getElementStyle,
  } = animState;

  const effectiveAnimTimeMs = animationTimeMs !== undefined ? animationTimeMs : data?.animationTimeMs;
  const effectiveElementAnims = elementAnimationsOverride || style.elementAnimations || {};

  const titleAnimStyle = getElementStyle('title');
  const textAnimStyle = getElementStyle('text');
  const verseAnimStyle = getElementStyle('verse');

  return (
    <div
      ref={rootSceneRef}
      className={`w-full h-full overflow-hidden relative font-sans select-none flex flex-col transition-colors duration-300 ${getSceneBackground()} ${className}`}
      style={{ backgroundColor: resolvedCanvasBg }}
    >
      {/* Background Media (Image or Video) Layer - Always Full Screen */}
      {effectiveBgType === 'video' && style.bgVideoUrl && canvasBgMode !== 'chroma' && canvasBgMode !== 'grid' ? (
        <video
          src={style.bgVideoUrl}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
          style={{ opacity: style.bgOpacity !== undefined ? style.bgOpacity : 1 }}
        />
      ) : effectiveBgType === 'image' && style.bgImageUrl && canvasBgMode !== 'chroma' && canvasBgMode !== 'grid' ? (
        <img
          src={style.bgImageUrl}
          alt="Fond d'écran"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
          style={{ opacity: style.bgOpacity !== undefined ? style.bgOpacity : 1 }}
        />
      ) : null}

      {/* Interactive Grid & TV Broadcast Alignment Guide Overlay */}
      {canvasBgMode === 'grid' && (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none">
          {/* Subtle Dark Grid Matrix Background */}
          <div className="absolute inset-0 bg-[#080d1a]/90 bg-[radial-gradient(#00d2ff_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />

          {/* Center Crosshair Axes */}
          <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-cyan-400/80 border-r border-dashed border-cyan-400/90 z-10">
            <span className="absolute top-2 left-1 text-[8px] font-mono font-bold text-cyan-300 bg-black/80 px-1 rounded border border-cyan-500/30">X: 50%</span>
          </div>
          <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-cyan-400/80 border-b border-dashed border-cyan-400/90 z-10">
            <span className="absolute left-2 top-1 text-[8px] font-mono font-bold text-cyan-300 bg-black/80 px-1 rounded border border-cyan-500/30">Y: 50%</span>
          </div>

          {/* Thirds Guide Lines (Rule of Thirds) */}
          <div className="absolute top-0 bottom-0 left-[33.33%] w-[1px] border-r border-dashed border-blue-400/30" />
          <div className="absolute top-0 bottom-0 left-[66.66%] w-[1px] border-r border-dashed border-blue-400/30" />
          <div className="absolute left-0 right-0 top-[33.33%] h-[1px] border-b border-dashed border-blue-400/30" />
          <div className="absolute left-0 right-0 top-[66.66%] h-[1px] border-b border-dashed border-blue-400/30" />

          {/* 10% Grid Rule Lines */}
          {[10, 20, 30, 40, 60, 70, 80, 90].map((pct) => (
            <React.Fragment key={pct}>
              <div className="absolute top-0 bottom-0 border-r border-white/10" style={{ left: `${pct}%` }} />
              <div className="absolute left-0 right-0 border-b border-white/10" style={{ top: `${pct}%` }} />
            </React.Fragment>
          ))}

          {/* TV Title Safe Area (10% Margins / 80% Box) */}
          <div className="absolute inset-[10%] border-2 border-dashed border-amber-400/40 rounded-lg flex items-start justify-end p-1">
            <span className="text-[9px] font-mono font-extrabold text-amber-300/90 uppercase tracking-widest bg-black/70 px-1.5 py-0.5 rounded border border-amber-500/30">
              Zone Sécurisée TV (80%)
            </span>
          </div>
        </div>
      )}

      {/* Color Simulation Overlay Tag */}
      {canvasBgMode === 'color' && isPreview && (
        <div className="absolute top-2 left-2 z-20 pointer-events-none bg-black/80 text-white border border-white/20 px-2.5 py-1 rounded-lg text-[9.5px] font-mono font-extrabold uppercase tracking-widest flex items-center gap-2 shadow-lg">
          <div
            className="w-2.5 h-2.5 rounded-full border border-white/40 shadow-sm"
            style={{ backgroundColor: canvasCustomBgColor || '#00ff00' }}
          />
          <span>Simulation Couleur : {canvasCustomBgColor || '#00ff00'}</span>
        </div>
      )}

      {/* Chroma Key Green Screen Overlay Tag */}
      {(canvasBgMode === 'chroma' || style.bgType === 'chroma' || style.theme === 'chroma') && isPreview && (
        <div className="absolute top-2 left-2 z-20 pointer-events-none bg-black/80 text-[#00ff00] border border-[#00ff00]/40 px-2.5 py-1 rounded-lg text-[9.5px] font-mono font-extrabold uppercase tracking-widest flex items-center gap-2 shadow-lg">
          <div className="w-2 h-2 rounded-full bg-[#00ff00] animate-ping" />
          <span>Fond Vert — Chroma Key Incrustation Active</span>
        </div>
      )}

      {/* Black Screen Overlay */}
      {isBlackScreen ? (
        <div className="w-full h-full flex items-center justify-center bg-black/90 text-slate-600 font-mono text-xs uppercase tracking-widest">
          [ Écran Noir / Pas de diffusion ]
        </div>
      ) : useCustomCanvas ? (
        /* CUSTOM CANVAS MODE: Interactive element layer canvas */
        <div
          key={animationTimeMs !== undefined ? 'anim-preview-canvas' : slideKey}
          ref={canvasRef}
          className={`w-full h-full relative overflow-hidden bg-transparent z-10 ${transitionClass}`}
          style={{
            animationDuration: `${transitionDuration}ms`
          }}
          onClick={(e) => {
            if (e.target === canvasRef.current && onSelectElement) {
              onSelectElement(null, false);
            }
          }}
        >
          {(!style.customElements || style.customElements.length === 0) && isPreview && (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 font-sans text-xs uppercase tracking-widest pointer-events-none p-6 text-center gap-2 select-none">
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
                <Layout className="w-5 h-5 opacity-60" />
              </div>
              <span>Canva Vide — Aucun élément sur ce thème</span>
              <span className="text-[10px] text-slate-600 lowercase tracking-normal">
                Utilisez "+ Ajouter" dans la barre d'outils pour créer vos textes, titres ou formes.
              </span>
            </div>
          )}

          {(() => {
            const elementsToRender = style.customElements
              ? [...style.customElements]
                  .map((el, originalIndex) => ({
                    el,
                    originalIndex,
                    effectiveZIndex: typeof el.position.zIndex === 'number' ? el.position.zIndex : originalIndex + 1
                  }))
                  .sort((a, b) => {
                    if (a.effectiveZIndex !== b.effectiveZIndex) {
                      return a.effectiveZIndex - b.effectiveZIndex;
                    }
                    return a.originalIndex - b.originalIndex;
                  })
                  .map(item => item.el)
              : [];

            return elementsToRender.map((el, index) => {
              const isSelected = activeSelectedIds.includes(el.id);
              const content = getElementContent(el);

              // Scale factor for font size with auto-fit logic
              const fontPx = el.style.fontSize || 32;
              const fitMode = el.style.textFitMode || style.textFitMode || 'auto-scale-text';

              let scaledFontSize: string;
              if (fitMode === 'fixed' || fitMode === 'auto-expand-box') {
                scaledFontSize = isPreview ? `${Math.max(10, Math.round(fontPx * 0.45))}px` : `${Math.round(fontPx)}px`;
              } else {
                // 'auto-scale-text': Calculate dynamic font size based on text length AND box dimensions
                const boxWidth = el.position.width || 80;
                const boxHeight = el.position.height || 20;
                const boxAreaRatio = (boxWidth * boxHeight) / 1600; // standard 80x20 box
                const txt = content || '';
                const len = txt.length || 1;

                let scale = 1.0;
                if (len > 500) scale = 0.38;
                else if (len > 350) scale = 0.50;
                else if (len > 220) scale = 0.65;
                else if (len > 120) scale = 0.80;
                else if (len > 60) scale = 0.95;
                else if (len < 30) scale = 1.25;

                scale = scale * Math.sqrt(Math.max(0.25, boxAreaRatio));
                const calcPx = Math.round(fontPx * scale);
                const finalPx = isPreview
                  ? Math.max(10, Math.round(calcPx * 0.45))
                  : Math.max(14, Math.min(180, calcPx));
                scaledFontSize = `${finalPx}px`;
              }

              const flexVerticalJustify = el.style.verticalAlign === 'top'
                ? 'justify-start'
                : el.style.verticalAlign === 'bottom'
                ? 'justify-end'
                : 'justify-center';

              const flexHorizontalAlign = el.style.textAlign === 'left'
                ? 'items-start text-left'
                : el.style.textAlign === 'right'
                ? 'items-end text-right'
                : el.style.textAlign === 'justify'
                ? 'items-stretch text-justify'
                : 'items-center text-center';

              const elementZIndex = typeof el.position.zIndex === 'number' ? el.position.zIndex : (index + 1);

              const isContourShape = el.shapeVariant === 'contour' || el.shapeVariant === 'stroke_frame';

              const bgVal = isContourShape
                ? 'transparent'
                : (el.style.backgroundGradient && el.style.backgroundGradient.trim() !== '')
                ? el.style.backgroundGradient
                : (el.style.backgroundColor || 'transparent');

              const effectiveBorderColor = isContourShape
                ? (el.style.borderColor || '#00d2ff')
                : 'transparent';

              const isBorderGradient = isContourShape && Boolean(effectiveBorderColor && effectiveBorderColor.includes('gradient'));
              const contourBorderWidth = el.style.borderWidth !== undefined ? el.style.borderWidth : 3;

              const baseElementOpacity = el.style.opacity !== undefined ? el.style.opacity : 1;
              const rawAnimStyle = getElementStyle(el.id, effectiveElementAnims[el.id]);

              const computedOpacity = rawAnimStyle.opacity !== undefined
                ? (rawAnimStyle.opacity as number) * baseElementOpacity
                : baseElementOpacity;

              const customAnimStyle = {
                ...rawAnimStyle,
                opacity: computedOpacity
              };

              return (
                <div
                  key={`${el.id}_${slideKey}`}
                  onMouseDown={(e) => {
                    if (onUpdateElementPosition) {
                      handleMouseDown(e, el, 'move');
                    } else if (onSelectElement) {
                      e.stopPropagation();
                      onSelectElement(el.id, e.shiftKey || e.metaKey || e.ctrlKey);
                    }
                  }}
                  onTouchStart={(e) => {
                    if (onUpdateElementPosition) {
                      handleTouchStart(e, el, 'move');
                    } else if (onSelectElement) {
                      e.stopPropagation();
                      onSelectElement(el.id, false);
                    }
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    const isMultiKey = e.shiftKey || e.metaKey || e.ctrlKey;
                    if (onSelectElement) {
                      onSelectElement(el.id, isMultiKey);
                    }
                  }}
                  style={{
                    position: 'absolute',
                    left: `${el.position.x}%`,
                    top: `${el.position.y}%`,
                    width: `${el.position.width}%`,
                    height: fitMode === 'auto-expand-box' ? 'auto' : `${el.position.height}%`,
                    minHeight: `${el.position.height}%`,
                    zIndex: elementZIndex,
                    ...(isContourShape ? (
                      isBorderGradient ? {
                        border: `${contourBorderWidth}px solid transparent`,
                        background: `${effectiveBorderColor} border-box`,
                        WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
                        WebkitMaskComposite: 'destination-out',
                        maskComposite: 'exclude',
                      } : {
                        border: `${contourBorderWidth}px solid ${effectiveBorderColor}`,
                        background: 'transparent',
                      }
                    ) : (el.type === 'line' || el.type === 'divider') ? {
                      background: 'transparent',
                    } : {
                      background: bgVal,
                      border: 'none',
                    }),
                    borderRadius: (el.shapeVariant === 'circle' || el.type === 'circle' || el.shapeVariant === 'pill')
                      ? '9999px'
                      : `${el.style.borderRadius || 0}px`,
                    padding: (el.type === 'line' || el.type === 'divider')
                      ? 0
                    : `${isPreview ? Math.max(0, (el.style.padding || 8) * 0.5) : (el.style.padding || 12)}px`,
                    color: el.style.textColor || '#ffffff',
                    textAlign: el.style.textAlign || 'center',
                    fontWeight: el.style.fontWeight || 'bold',
                    fontStyle: el.style.fontStyle || 'normal',
                    fontFamily: el.style.fontFamily || style.fontFamily || undefined,
                    letterSpacing: el.style.letterSpacing !== undefined ? `${el.style.letterSpacing}px` : (style.letterSpacing !== undefined ? `${style.letterSpacing}px` : undefined),
                    textTransform: (el.style.textTransform || style.textTransform || 'none') as any,
                    textDecoration: (el.style.textDecoration || style.textDecoration || 'none') as any,
                    WebkitTextStroke: el.style.textStrokeWidth
                      ? `${el.style.textStrokeWidth}px ${el.style.textStrokeColor || '#000000'}`
                      : (style.textStrokeWidth ? `${style.textStrokeWidth}px ${style.textStrokeColor || '#000000'}` : undefined),
                    lineHeight: el.style.lineHeight || 1.3,
                    fontSize: scaledFontSize,
                    textShadow: el.style.textShadow
                      ? `${el.style.textShadowColor || 'rgba(0,0,0,0.8)'} 0px 2px ${el.style.textShadowBlur || 10}px`
                      : 'none',
                    boxShadow: el.style.boxShadow ? '0 10px 30px rgba(0,0,0,0.5)' : 'none',
                    ...customAnimStyle
                  }}
                className={`transition-colors ${fitMode === 'auto-expand-box' ? 'overflow-visible' : 'overflow-hidden'} flex flex-col ${flexVerticalJustify} select-none ${
                  isSelected
                    ? 'outline-2 outline-[#00d2ff] outline-dashed shadow-[0_0_15px_rgba(0,210,255,0.6)] cursor-move'
                    : onSelectElement
                    ? 'hover:outline-1 hover:outline-white/40 cursor-pointer'
                    : ''
                }`}
              >
                {/* Visual Label & Position Badge if selected in editor */}
                {isSelected && isPreview && (
                  <div className="absolute top-0 left-0 bg-[#00d2ff] text-black text-[9px] font-black px-1.5 py-0.5 rounded-br uppercase tracking-wider z-20 pointer-events-none flex items-center gap-1">
                    <span>{el.name}</span>
                    <span className="opacity-75 font-mono text-[8px]">({el.position.x}%,{el.position.y}%) {el.position.width}×{el.position.height}</span>
                  </div>
                )}

                {/* Interactive Corner Resize Handle */}
                {isSelected && isPreview && onUpdateElementPosition && (
                  <div
                    onMouseDown={(e) => handleMouseDown(e, el, 'resize')}
                    onTouchStart={(e) => handleTouchStart(e, el, 'resize')}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute bottom-0 right-0 w-4 h-4 bg-[#00d2ff] border border-black rounded-tl cursor-se-resize z-30 shadow-md hover:scale-125 transition-transform flex items-center justify-center"
                    title="Glisser pour redimensionner l'élément"
                  >
                    <div className="w-1.5 h-1.5 border-r-2 border-b-2 border-black" />
                  </div>
                )}

                {/* Content Rendering based on type and shapeVariant */}
                {el.type === 'shape' || el.type === 'circle' ? (
                  el.shapeVariant === 'accent_bar' ? (
                    <div
                      className="w-full h-full rounded-full shadow-md"
                      style={{ backgroundColor: el.style.backgroundColor || el.style.textColor || '#00d2ff' }}
                    />
                  ) : el.shapeVariant === 'gradient_fade' ? (
                    <div
                      className="w-full h-full rounded-[inherit]"
                      style={{
                        background: el.style.backgroundGradient || 'linear-gradient(to right, rgba(0,0,0,0.95), rgba(0,0,0,0.4), transparent)'
                      }}
                    />
                  ) : el.shapeVariant === 'glow_bar' ? (
                    <div
                      className="w-full h-full rounded-full"
                      style={{
                        backgroundColor: el.style.backgroundColor || '#00d2ff',
                        boxShadow: `0 0 25px ${el.style.backgroundColor || '#00d2ff'}`
                      }}
                    />
                  ) : el.shapeVariant === 'quote' ? (
                    <div className="w-full h-full flex items-center justify-center font-serif text-5xl leading-none select-none opacity-80">
                      “
                    </div>
                  ) : (
                    <div className="w-full h-full rounded-[inherit] flex flex-col justify-center items-center">
                      {content ? (
                        <span style={{ fontSize: scaledFontSize, color: el.style.textColor || '#ffffff' }}>
                          {content}
                        </span>
                      ) : null}
                    </div>
                  )
                ) : el.type === 'line' || el.type === 'divider' ? (
                  el.shapeVariant === 'line_vertical' ? (
                    <div
                      className="h-full w-full mx-auto rounded-full"
                      style={{
                        width: `${el.style.borderWidth || 3}px`,
                        background: (el.style.borderColor && el.style.borderColor !== 'transparent')
                          ? el.style.borderColor
                          : (el.style.backgroundGradient || el.style.textColor || '#00d2ff')
                      }}
                    />
                  ) : el.shapeVariant === 'line_dashed' ? (
                    <div
                      className="w-full h-0 my-auto border-b border-dashed"
                      style={{
                        borderColor: (el.style.borderColor && el.style.borderColor !== 'transparent')
                          ? el.style.borderColor
                          : (el.style.textColor || '#00d2ff'),
                        borderBottomWidth: `${el.style.borderWidth || 3}px`
                      }}
                    />
                  ) : (
                    <div
                      className="w-full my-auto rounded-full"
                      style={{
                        height: `${el.style.borderWidth || 3}px`,
                        background: (el.style.borderColor && el.style.borderColor !== 'transparent')
                          ? el.style.borderColor
                          : (el.style.backgroundGradient || el.style.textColor || '#00d2ff')
                      }}
                    />
                  )
                ) : el.type === 'icon' || (el.shapeVariant && el.shapeVariant.startsWith('icon_')) ? (
                  <div className="w-full h-full flex items-center justify-center p-1">
                    <div className="w-full h-full max-w-full max-h-full flex items-center justify-center">
                      {renderCustomIcon(el.iconName || el.shapeVariant?.replace('icon_', ''))}
                    </div>
                  </div>
                ) : el.type === 'image' ? (
                  <div className="w-full h-full relative overflow-hidden rounded-[inherit]">
                    {(el.imageUrl || el.staticText) ? (
                      <img
                        src={el.imageUrl || el.staticText}
                        alt={el.name}
                        className="w-full h-full rounded-[inherit] pointer-events-none"
                        style={{ objectFit: el.style.objectFit || 'cover' }}
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-900/80 flex flex-col items-center justify-center p-2 text-cyan-300 border border-dashed border-cyan-500/40 rounded-[inherit]">
                        <ImageIcon className="w-6 h-6 mb-1 text-cyan-400" />
                        <span className="text-[10px] font-bold">Image (Saisir URL / Fichier)</span>
                      </div>
                    )}
                  </div>
                ) : el.type === 'video' ? (
                  <div className="w-full h-full relative overflow-hidden rounded-[inherit]">
                    {(el.videoUrl || el.imageUrl || el.staticText) ? (
                      <video
                        src={el.videoUrl || el.imageUrl || el.staticText}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full rounded-[inherit] pointer-events-none"
                        style={{ objectFit: el.style.objectFit || 'cover' }}
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-900/90 flex flex-col items-center justify-center p-2 text-purple-300 border border-dashed border-purple-500/40 rounded-[inherit]">
                        <Video className="w-6 h-6 mb-1 text-purple-400" />
                        <span className="text-[10px] font-bold">Vidéo (Saisir URL / Fichier)</span>
                      </div>
                    )}
                  </div>
                ) : el.binding === 'logo' ? (
                  <div className="flex items-center justify-center gap-2 h-full font-black tracking-wider uppercase text-white">
                    <img src={logoImg} alt="Logo" className="w-6 h-6 object-cover rounded-md border border-cyan-500/40" referrerPolicy="no-referrer" />
                    <span>{content}</span>
                  </div>
                ) : el.type === 'badge' ? (
                  <div className="flex items-center justify-center gap-1 h-full w-full font-black tracking-wide">
                    <Bookmark className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{content}</span>
                  </div>
                ) : (
                  <div
                    className={`w-full ${fitMode === 'auto-expand-box' ? 'h-auto min-h-full overflow-visible' : 'h-full overflow-hidden'} flex flex-col ${flexVerticalJustify} ${flexHorizontalAlign} relative select-none`}
                    style={{
                      fontSize: scaledFontSize,
                      color: el.style.textColor || '#ffffff',
                      fontWeight: el.style.fontWeight || 'bold',
                      fontStyle: el.style.fontStyle || 'normal',
                      fontFamily: el.style.fontFamily || style.fontFamily || undefined,
                      letterSpacing: el.style.letterSpacing !== undefined ? `${el.style.letterSpacing}px` : undefined,
                      textTransform: (el.style.textTransform || style.textTransform || 'none') as any,
                      textDecoration: (el.style.textDecoration || style.textDecoration || 'none') as any,
                      WebkitTextStroke: el.style.textStrokeWidth
                        ? `${el.style.textStrokeWidth}px ${el.style.textStrokeColor || '#000000'}`
                        : undefined,
                      lineHeight: el.style.lineHeight || 1.3,
                      textShadow: el.style.textShadow
                        ? `${el.style.textShadowColor || 'rgba(0,0,0,0.8)'} 0px 2px ${el.style.textShadowBlur || 10}px`
                        : 'none',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}
                  >
                    {content}
                  </div>
                )}
              </div>
            );
          });
        })()}
        </div>
      ) : (
        <div
          key={animationTimeMs !== undefined ? 'anim-preview-canvas' : slideKey}
          className={`w-full h-full ${transitionClass}`}
          style={{
            animationDuration: `${transitionDuration}ms`
          }}
        >
          {/* MODE TOP BANNER */}
          {mode === 'TOP_BANNER' && (
            <div className="w-full p-4 md:p-6 pointer-events-none" style={{ marginBottom: containerBottomMargin }}>
              <div
                className={`mx-auto backdrop-blur-md shadow-2xl transition-all duration-200 flex flex-col justify-between ${
                  style.textFitMode === 'auto-expand-box' ? 'h-auto max-h-none overflow-visible' : 'max-h-[88vh] overflow-hidden'
                }`}
                style={{
                  backgroundColor: containerBgStyle,
                  borderColor: containerBorderColor,
                  borderWidth: `${containerBorderWidth}px`,
                  borderRadius: `${containerBorderRadius}px`,
                  padding: `${containerPadding}px`,
                  maxWidth: containerMaxWidth
                }}
              >
                <div className={`w-full ${style.textFitMode === 'auto-expand-box' ? 'h-auto overflow-visible' : 'h-full flex-1 overflow-hidden'} min-h-[60px]`}>
                  <div
                    className={`w-full ${style.textFitMode === 'auto-expand-box' ? 'h-auto overflow-visible' : 'h-full overflow-hidden'} flex flex-col justify-center ${textAlign === 'left' ? 'items-start text-left' : textAlign === 'right' ? 'items-end text-right' : textAlign === 'justify' ? 'items-stretch text-justify' : 'items-center text-center'} select-none`}
                    style={{
                      fontSize: getCalculatedFontSize(),
                      color: style.textColor || '#ffffff',
                      fontWeight: style.fontWeight || 'bold',
                      fontStyle: style.fontStyle || 'normal',
                      fontFamily: style.fontFamily || undefined,
                      letterSpacing: style.letterSpacing !== undefined ? `${style.letterSpacing}px` : undefined,
                      textTransform: (style.textTransform || 'none') as any,
                      textDecoration: (style.textDecoration || 'none') as any,
                      WebkitTextStroke: style.textStrokeWidth ? `${style.textStrokeWidth}px ${style.textStrokeColor || '#000000'}` : undefined,
                      lineHeight: style.lineHeight || 1.3,
                      textShadow: style.textShadow !== false ? '0 2px 10px rgba(0,0,0,0.8)' : 'none',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}
                  >
                    {data.texte}
                  </div>
                </div>

                {(showHeader || showBadge) && (
                  <div className="flex justify-between items-center mt-3 pt-2 border-t border-white/20 text-xs flex-shrink-0">
                    {showHeader && (
                      <div className="bg-black/80 border border-white/30 text-white rounded-full px-3 py-0.5 font-bold truncate max-w-[70%]">
                        {getSermonHeader()}
                      </div>
                    )}
                    {showBadge && (
                      <div className="bg-white text-black font-black rounded-full px-3 py-0.5 ml-auto flex-shrink-0">
                        {getReferenceLabel()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MODE LOWER THIRD (Bandeau TV classique) */}
          {mode === 'LOWER_THIRD' && (
            <div
              className="w-full h-full flex flex-col justify-end p-4 md:p-8 pointer-events-none"
              style={{ paddingBottom: `calc(${isPreview ? '12px' : '32px'} + ${containerBottomMargin})` }}
            >
              <div
                className={`mx-auto w-full backdrop-blur-md shadow-[0_12px_45px_rgba(0,0,0,0.85)] transition-all duration-200 flex flex-col justify-between ${
                  style.textFitMode === 'auto-expand-box' ? 'h-auto max-h-none overflow-visible' : 'max-h-[88vh] overflow-hidden'
                }`}
                style={{
                  backgroundColor: containerBgStyle,
                  borderColor: containerBorderColor,
                  borderWidth: `${containerBorderWidth}px`,
                  borderRadius: `${containerBorderRadius}px`,
                  padding: `${containerPadding}px`,
                  maxWidth: containerMaxWidth
                }}
              >
                {/* Main Paragraphe Text */}
                <div className={`w-full ${style.textFitMode === 'auto-expand-box' ? 'h-auto overflow-visible' : 'h-full flex-1 overflow-hidden'} min-h-[70px]`}>
                  <div
                    className={`w-full ${style.textFitMode === 'auto-expand-box' ? 'h-auto overflow-visible' : 'h-full overflow-hidden'} flex flex-col justify-center ${textAlign === 'left' ? 'items-start text-left' : textAlign === 'right' ? 'items-end text-right' : textAlign === 'justify' ? 'items-stretch text-justify' : 'items-center text-center'} select-none`}
                    style={{
                      fontSize: getCalculatedFontSize(),
                      color: style.textColor || '#ffffff',
                      fontWeight: style.fontWeight || 'bold',
                      fontStyle: style.fontStyle || 'normal',
                      fontFamily: style.fontFamily || undefined,
                      letterSpacing: style.letterSpacing !== undefined ? `${style.letterSpacing}px` : undefined,
                      textTransform: (style.textTransform || 'none') as any,
                      textDecoration: (style.textDecoration || 'none') as any,
                      WebkitTextStroke: style.textStrokeWidth ? `${style.textStrokeWidth}px ${style.textStrokeColor || '#000000'}` : undefined,
                      lineHeight: style.lineHeight || 1.3,
                      textShadow: style.textShadow !== false ? '0 2px 10px rgba(0,0,0,0.8)' : 'none',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}
                  >
                    {data.texte}
                  </div>
                </div>

                {/* Lower Third Sub-Bar */}
                {(showHeader || showBadge) && (
                  <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-white/20 gap-3 flex-wrap flex-shrink-0">
                    {showHeader && (
                      <div
                        style={{
                          backgroundColor: style.headerBg || 'rgba(0, 0, 0, 0.85)',
                          color: style.headerTextColor || '#ffffff'
                        }}
                        className="border border-white/40 rounded-full px-3 py-1 flex items-center gap-1.5 text-xs font-bold shadow-md max-w-[70%] truncate"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-[#00d2ff] flex-shrink-0" />
                        <span className="truncate">{getSermonHeader()}</span>
                      </div>
                    )}

                    {showBadge && (
                      <div
                        style={{
                          backgroundColor: style.badgeBg || '#ffffff',
                          color: style.badgeTextColor || '#020617'
                        }}
                        className="font-black rounded-full px-4 py-1 text-xs shadow-xl flex items-center gap-1 tracking-wide flex-shrink-0 ml-auto"
                      >
                        <Bookmark className="w-3 h-3" />
                        <span>{getReferenceLabel()}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MODE CENTER CARD / FLOATING CARD */}
          {mode === 'CENTER_CARD' && (
            <div className="w-full h-full flex items-center justify-center p-6 md:p-12 pointer-events-none">
              <div
                className={`backdrop-blur-xl shadow-2xl transition-all duration-200 flex flex-col justify-between min-h-[220px] ${
                  style.textFitMode === 'auto-expand-box' ? 'h-auto max-h-none overflow-visible' : 'max-h-[88vh] overflow-hidden'
                }`}
                style={{
                  backgroundColor: containerBgStyle,
                  borderColor: containerBorderColor,
                  borderWidth: `${containerBorderWidth}px`,
                  borderRadius: `${containerBorderRadius}px`,
                  padding: `${containerPadding}px`,
                  maxWidth: containerMaxWidth
                }}
              >
                {showHeader && (
                  <div
                    style={titleAnimStyle}
                    className="text-center mb-3 pb-2 border-b border-white/20 font-extrabold text-xs uppercase tracking-widest text-[#00d2ff] flex-shrink-0"
                  >
                    {getSermonHeader()}
                  </div>
                )}

                <div className={`w-full ${style.textFitMode === 'auto-expand-box' ? 'h-auto overflow-visible' : 'h-full flex-1 overflow-hidden'} min-h-[120px]`}>
                  <div
                    className={`w-full ${style.textFitMode === 'auto-expand-box' ? 'h-auto overflow-visible' : 'h-full overflow-hidden'} flex flex-col justify-center ${textAlign === 'left' ? 'items-start text-left' : textAlign === 'right' ? 'items-end text-right' : textAlign === 'justify' ? 'items-stretch text-justify' : 'items-center text-center'} select-none`}
                    style={{
                      fontSize: getCalculatedFontSize(),
                      color: style.textColor || '#ffffff',
                      fontWeight: style.fontWeight || 'bold',
                      fontStyle: style.fontStyle || 'normal',
                      fontFamily: style.fontFamily || undefined,
                      letterSpacing: style.letterSpacing !== undefined ? `${style.letterSpacing}px` : undefined,
                      textTransform: (style.textTransform || 'none') as any,
                      textDecoration: (style.textDecoration || 'none') as any,
                      WebkitTextStroke: style.textStrokeWidth ? `${style.textStrokeWidth}px ${style.textStrokeColor || '#000000'}` : undefined,
                      lineHeight: style.lineHeight || 1.3,
                      textShadow: style.textShadow !== false ? '0 2px 10px rgba(0,0,0,0.8)' : 'none',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      ...textAnimStyle
                    }}
                  >
                    {data.texte}
                  </div>
                </div>

                {showBadge && (
                  <div
                    style={verseAnimStyle}
                    className="mt-3 pt-2.5 flex justify-center border-t border-white/20 flex-shrink-0"
                  >
                    <div
                      style={{
                        backgroundColor: style.badgeBg || '#ffffff',
                        color: style.badgeTextColor || '#000000'
                      }}
                      className="px-4 py-1 rounded-full text-xs font-black shadow-lg"
                    >
                      {getReferenceLabel()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MODE FULLSCREEN (Salle de culte / Rétroprojecteur) */}
          {mode === 'FULLSCREEN' && (
            <div className="w-full h-full flex flex-col justify-between p-6 md:p-12">
              {/* Header */}
              {showHeader && (
                <header
                  style={titleAnimStyle}
                  className="flex justify-between items-center border-b border-white/20 pb-4 flex-shrink-0"
                >
                  <div className="flex items-center gap-3 max-w-[75%]">
                    <div className="bg-gradient-to-r from-[#00d2ff] to-[#2563eb] text-black font-black text-xs md:text-sm px-3 py-1 rounded-md uppercase tracking-wider shadow flex-shrink-0">
                      {data.sermonId === 'BIBLE' ? 'BIBLE' : data.sermonId === 'LYRICS' ? 'CANTIQUE' : (data.sermonId !== 'EXTRAIT' && data.sermonId ? data.sermonId : 'BROCHURE')}
                    </div>
                    <h1 className="text-sm md:text-xl font-extrabold uppercase tracking-wide text-white drop-shadow truncate">
                      {data.sermonId === 'BIBLE' ? (data.titre_francais || 'SAINTE BIBLE') : data.sermonId === 'LYRICS' ? (data.titre_francais || 'CANTIQUES') : (data.titre_francais || 'SERMON')}
                    </h1>
                  </div>

                  {showBadge && (
                    <div
                      style={verseAnimStyle}
                      className="bg-white/10 backdrop-blur border border-white/20 text-white text-xs md:text-base font-black px-4 py-1 rounded-lg shadow-lg flex-shrink-0"
                    >
                      {getReferenceLabel()}
                    </div>
                  )}
                </header>
              )}

              {/* Main Text Content */}
              <main className={`flex-1 flex items-center justify-center p-4 text-center w-full ${style.textFitMode === 'auto-expand-box' ? 'h-auto overflow-visible' : 'h-full overflow-hidden'}`}>
                <div
                  className={`w-full ${style.textFitMode === 'auto-expand-box' ? 'h-auto overflow-visible' : 'h-full overflow-hidden'} flex flex-col justify-center ${textAlign === 'left' ? 'items-start text-left' : textAlign === 'right' ? 'items-end text-right' : textAlign === 'justify' ? 'items-stretch text-justify' : 'items-center text-center'} select-none`}
                  style={{
                    fontSize: getCalculatedFontSize(),
                    color: style.textColor || '#ffffff',
                    fontWeight: style.fontWeight || 'bold',
                    fontStyle: style.fontStyle || 'normal',
                    fontFamily: style.fontFamily || undefined,
                    letterSpacing: style.letterSpacing !== undefined ? `${style.letterSpacing}px` : undefined,
                    textTransform: (style.textTransform || 'none') as any,
                    textDecoration: (style.textDecoration || 'none') as any,
                    WebkitTextStroke: style.textStrokeWidth ? `${style.textStrokeWidth}px ${style.textStrokeColor || '#000000'}` : undefined,
                    lineHeight: style.lineHeight || 1.3,
                    textShadow: style.textShadow !== false ? '0 2px 10px rgba(0,0,0,0.8)' : 'none',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    ...textAnimStyle
                  }}
                >
                  {data.texte}
                </div>
              </main>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

