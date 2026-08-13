import React from 'react';
import { ElementAnimationConfig, ElementAnimationsMap, ProjectedData, ProjectionStyle } from '../types';
import { getElementAnimationStyle, getComputedElementVisibilityStyle } from './animationUtils';

export type ProjectionPhase = 'IN' | 'SLIDE' | 'OUT' | 'BLACK' | 'IDLE';

export interface AnimationClassMap {
  IN: string;
  SLIDE: string;
  OUT: string;
  BLACK: string;
  IDLE: string;
}

export interface AnimationManagerOptions {
  data: ProjectedData | null;
  isExiting: boolean;
  exitingData: ProjectedData | null;
  style: ProjectionStyle;
  elementAnimationsOverride?: ElementAnimationsMap;
  animationTimeMs?: number;
  isEditorMode?: boolean;
  disableAnimations?: boolean;
  isIdle?: boolean;
}

export interface ProjectionAnimationState {
  phase: ProjectionPhase;
  sceneTransitionClass: string;
  classMap: AnimationClassMap;
  slideKey: string;
  getElementStyle: (
    elementId: string,
    customConfig?: ElementAnimationConfig
  ) => React.CSSProperties;
  isBlackScreen: boolean;
  activeData: ProjectedData | null;
}

export const KNOWN_ANIMATION_CLASSES = [
  'anim-transition-cut',
  'anim-transition-fade',
  'anim-transition-slide-left',
  'anim-transition-slide-right',
  'anim-transition-slide-up',
  'anim-transition-slide-down',
  'anim-transition-zoom',
  'anim-transition-flip',
  'anim-outro-fade',
  'anim-intro-fade',
];

/**
 * Cleanup function that removes any previous animation class before applying a new one
 * to prevent class accumulation.
 */
export function cleanAnimationClasses(
  existingClasses: string,
  extraClassesToRemove: string[] = []
): string {
  if (!existingClasses) return '';
  const removeSet = new Set([...KNOWN_ANIMATION_CLASSES, ...extraClassesToRemove]);
  return existingClasses
    .split(/\s+/)
    .filter((cls) => Boolean(cls) && !removeSet.has(cls) && !cls.startsWith('anim-transition-') && !cls.startsWith('anim-outro-') && !cls.startsWith('anim-intro-'))
    .join(' ');
}

/**
 * ProjectionAnimationManager
 * Handles full animation lifecycle (IN, SLIDE, OUT, BLACK, IDLE).
 * Separates element entrance/exit animations from scene transitions,
 * cleans accumulated animation classes, and monitors 'animationend' / MutationObserver
 * to automatically reset projected elements to 'IDLE' after OUT animation finishes.
 */
export class ProjectionAnimationManager {
  /**
   * Resolves current animation lifecycle phase.
   */
  static resolvePhase(data: ProjectedData | null, isExiting: boolean, isIdle: boolean = false): ProjectionPhase {
    if (isExiting || data?.animPhase === 'EXITING') {
      return 'OUT';
    }
    if (isIdle) {
      return 'IDLE';
    }
    if (!data || data.sermonId === 'BLACK') {
      return 'BLACK';
    }
    if (!data.texte || data.animPhase === 'OUT') {
      return 'IDLE';
    }
    if (data.animPhase === 'ENTERING' || data.animPhase === 'IN') {
      return 'IN';
    }
    return 'SLIDE';
  }

  /**
   * Explicitly maps animation class strings for each lifecycle phase.
   */
  static getAnimationClassMap(
    activeTransition: string,
    isEditorMode: boolean,
    animationTimeMs?: number
  ): AnimationClassMap {
    if (isEditorMode || animationTimeMs !== undefined) {
      return { IN: '', SLIDE: '', OUT: '', BLACK: '', IDLE: '' };
    }

    const slideClass = activeTransition === 'cut' ? 'anim-transition-cut' : `anim-transition-${activeTransition}`;
    const inClass = activeTransition === 'cut' ? 'anim-transition-cut' : 'anim-transition-fade';
    const outClass = activeTransition === 'cut' ? 'anim-transition-cut' : 'anim-outro-fade';

    return {
      IN: inClass,
      SLIDE: slideClass,
      OUT: outClass,
      BLACK: '',
      IDLE: '',
    };
  }

  /**
   * Removes accumulated previous animation classes before applying new phase class.
   */
  static applyCleanAnimationClass(
    currentClassString: string,
    targetAnimationClass: string
  ): string {
    const cleaned = cleanAnimationClasses(currentClassString);
    return targetAnimationClass ? `${cleaned} ${targetAnimationClass}`.trim() : cleaned;
  }

  /**
   * Attaches an animationend listener on a DOM node.
   * Automatically resets the projection state to IDLE upon OUT animation completion.
   */
  static attachOutAnimationListener(
    element: HTMLElement | null,
    onOutComplete: () => void,
    fallbackTimeoutMs: number = 450
  ): () => void {
    if (!element) return () => {};

    let isCompleted = false;

    const triggerComplete = () => {
      if (isCompleted) return;
      isCompleted = true;
      cleanup();
      onOutComplete();
    };

    const handleAnimationEnd = (e: AnimationEvent) => {
      if (e.target === element || (e.animationName && e.animationName.toLowerCase().includes('out'))) {
        triggerComplete();
      }
    };

    element.addEventListener('animationend', handleAnimationEnd);
    const safeTimeout = Math.max(fallbackTimeoutMs + 100, 550);
    const fallbackTimer = setTimeout(triggerComplete, safeTimeout);

    const cleanup = () => {
      element.removeEventListener('animationend', handleAnimationEnd);
      clearTimeout(fallbackTimer);
    };

    return cleanup;
  }

  /**
   * Computes animation state and element styles for current lifecycle phase.
   */
  static calculateAnimationState(options: AnimationManagerOptions): ProjectionAnimationState {
    const {
      data,
      isExiting,
      exitingData,
      style,
      elementAnimationsOverride,
      animationTimeMs,
      isEditorMode = false,
      disableAnimations = false,
      isIdle = false,
    } = options;

    const activeData = isExiting ? exitingData : data;
    const phase = this.resolvePhase(activeData, isExiting, isIdle);
    const isBlackScreen = phase === 'BLACK' && !isExiting;
    const activeTransition = style.slideTransition || 'fade';
    const effectiveAnimTimeMs = animationTimeMs !== undefined ? animationTimeMs : activeData?.animationTimeMs;
    const effectiveElementAnims = elementAnimationsOverride || style.elementAnimations || {};
    const effectiveEditorMode = disableAnimations || isEditorMode;

    const classMap = this.getAnimationClassMap(
      activeTransition,
      effectiveEditorMode,
      effectiveAnimTimeMs
    );

    const targetSceneClass = classMap[phase] || '';
    const sceneTransitionClass = this.applyCleanAnimationClass('', targetSceneClass);

    const slideKey = activeData
      ? `${activeData.sermonId}_${activeData.numero}_${activeData.blockIndex || 0}_${activeData.timestamp || (activeData.texte || '').slice(0, 20)}_${activeTransition}`
      : 'empty';

    const getElementStyle = (
      elementId: string,
      customConfig?: ElementAnimationConfig
    ): React.CSSProperties => {
      if (phase === 'BLACK') {
        return { opacity: 0, pointerEvents: 'none' };
      }

      if (phase === 'IDLE') {
        // Complete clean idle state: no lingering keyframe animations, elements hidden
        return { opacity: 0, pointerEvents: 'none' };
      }

      if (effectiveEditorMode) {
        return {};
      }

      const config = customConfig || effectiveElementAnims[elementId];

      if (effectiveAnimTimeMs !== undefined) {
        return getComputedElementVisibilityStyle(elementId, effectiveAnimTimeMs, {
          ...effectiveElementAnims,
          [elementId]: config || effectiveElementAnims[elementId],
        });
      }

      const forcePhase: 'intro' | 'outro' | 'active' | 'none' =
        phase === 'IN' ? 'intro' :
        phase === 'OUT' ? 'outro' :
        phase === 'SLIDE' ? 'active' : 'none';

      return getElementAnimationStyle(config, slideKey, forcePhase);
    };

    return {
      phase,
      sceneTransitionClass,
      classMap,
      slideKey,
      getElementStyle,
      isBlackScreen,
      activeData,
    };
  }
}
