import React from 'react';
import { ElementAnimationConfig, ElementAnimationsMap } from '../types';

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function getComputedElementVisibilityStyle(
  elementId: string,
  currentTimeMs: number,
  animationsMap: ElementAnimationsMap
): React.CSSProperties {
  const config = animationsMap[elementId] || {
    introType: 'fade-in',
    introDuration: 500,
    introDelay: 0,
    emphasisType: 'none',
    outroType: 'none',
    outroDuration: 500,
    outroDelay: 2500
  };

  const introDelay = config.introDelay ?? (config as any).delayMs ?? 0;
  const introDuration = config.introDuration ?? (config as any).durationMs ?? 500;
  const introType = config.introType ?? (config as any).type ?? 'fade-in';

  const outroDelay = config.outroDelay ?? 2500;
  const outroDuration = config.outroDuration ?? 500;
  const outroType = config.outroType ?? 'none';

  const emphasisType = config.emphasisType ?? 'none';

  // Outro Phase (Disparition / Exit)
  if (outroType !== 'none' && outroDelay !== undefined && currentTimeMs >= outroDelay) {
    const rawProgress = Math.min(1, Math.max(0, (currentTimeMs - outroDelay) / outroDuration));
    const outroProgress = easeOutCubic(rawProgress);

    if (rawProgress >= 1) {
      return { opacity: 0, pointerEvents: 'none', visibility: 'hidden' };
    }

    if (outroType === 'fade-out') {
      return { opacity: 1 - outroProgress };
    }
    if (outroType === 'slide-down') {
      return { opacity: 1 - outroProgress, transform: `translateY(${outroProgress * 35}px)` };
    }
    if (outroType === 'slide-up') {
      return { opacity: 1 - outroProgress, transform: `translateY(${-outroProgress * 35}px)` };
    }
    if (outroType === 'slide-left') {
      return { opacity: 1 - outroProgress, transform: `translateX(${-outroProgress * 35}px)` };
    }
    if (outroType === 'slide-right') {
      return { opacity: 1 - outroProgress, transform: `translateX(${outroProgress * 35}px)` };
    }
    if (outroType === 'zoom-out') {
      return { opacity: 1 - outroProgress, transform: `scale(${1 - outroProgress * 0.5})` };
    }
    if (outroType === 'bounce-out') {
      return { opacity: 1 - outroProgress, transform: `scale(${1 - outroProgress * 0.3}) rotate(${outroProgress * 10}deg)` };
    }
    if (outroType === 'rotate-out') {
      return { opacity: 1 - outroProgress, transform: `rotate(${outroProgress * 90}deg)` };
    }
    if (outroType === 'flip-out') {
      return { opacity: 1 - outroProgress, transform: `rotateY(${outroProgress * 90}deg)` };
    }
    if (outroType === 'stroke-trim-out') {
      return {
        opacity: 1 - outroProgress,
        clipPath: `inset(0 0 0 ${outroProgress * 100}%)`,
        WebkitClipPath: `inset(0 0 0 ${outroProgress * 100}%)`
      };
    }
    if (outroType === 'light-wipe-out') {
      const bright = 1 + Math.sin(rawProgress * Math.PI) * 2;
      return {
        opacity: 1 - outroProgress,
        filter: `brightness(${bright})`,
        clipPath: `polygon(${outroProgress * 100}% 0, 100% 0, 100% 100%, ${outroProgress * 100}% 100%)`,
        WebkitClipPath: `polygon(${outroProgress * 100}% 0, 100% 0, 100% 100%, ${outroProgress * 100}% 100%)`
      };
    }
    return { opacity: 1 - outroProgress };
  }

  // Before Intro Phase (Avant Apparition - Strict pre-entry hide)
  if (currentTimeMs < introDelay) {
    return { opacity: 0, pointerEvents: 'none', visibility: 'hidden' };
  }

  // Intro Phase (Apparition / Entrance)
  if (currentTimeMs < introDelay + introDuration) {
    if (introDuration <= 0) return { opacity: 1 };
    const rawProgress = Math.min(1, Math.max(0, (currentTimeMs - introDelay) / introDuration));
    const progress = easeOutCubic(rawProgress);

    if (introType === 'none') return { opacity: 1 };
    if (introType === 'fade-in') {
      return { opacity: progress };
    }
    if (introType === 'slide-up') {
      const translateY = (1 - progress) * 35;
      return { opacity: progress, transform: `translateY(${translateY}px)` };
    }
    if (introType === 'slide-down') {
      const translateY = (1 - progress) * -35;
      return { opacity: progress, transform: `translateY(${translateY}px)` };
    }
    if (introType === 'slide-left') {
      const translateX = (1 - progress) * 35;
      return { opacity: progress, transform: `translateX(${translateX}px)` };
    }
    if (introType === 'slide-right') {
      const translateX = (1 - progress) * -35;
      return { opacity: progress, transform: `translateX(${translateX}px)` };
    }
    if (introType === 'zoom-in') {
      const scale = 0.4 + progress * 0.6;
      return { opacity: progress, transform: `scale(${scale})` };
    }
    if (introType === 'bounce-in') {
      const scale = rawProgress < 0.7 ? rawProgress * 1.25 : 1 + (1 - rawProgress) * 0.25;
      return { opacity: Math.min(1, rawProgress * 1.5), transform: `scale(${scale})` };
    }
    if (introType === 'rotate-in') {
      const angle = (1 - progress) * -90;
      return { opacity: progress, transform: `rotate(${angle}deg)` };
    }
    if (introType === 'flip-in') {
      const angle = (1 - progress) * -90;
      return { opacity: progress, transform: `rotateY(${angle}deg)` };
    }
    if (introType === 'stroke-trim') {
      return {
        opacity: Math.min(1, rawProgress * 2),
        clipPath: `polygon(0 0, ${rawProgress * 100}% 0, ${rawProgress * 100}% 100%, 0 100%)`,
        WebkitClipPath: `polygon(0 0, ${rawProgress * 100}% 0, ${rawProgress * 100}% 100%, 0 100%)`
      };
    }
    if (introType === 'light-wipe') {
      const bright = 1 + Math.sin(rawProgress * Math.PI) * 1.5;
      return {
        opacity: progress,
        filter: `brightness(${bright})`,
        clipPath: `polygon(0 0, ${rawProgress * 120}% 0, ${rawProgress * 100}% 100%, 0 100%)`,
        WebkitClipPath: `polygon(0 0, ${rawProgress * 120}% 0, ${rawProgress * 100}% 100%, 0 100%)`
      };
    }
    return {};
  }

  // Post-Intro / Active Phase (Emphasis animation calculated frame-by-frame)
  if (emphasisType !== 'none') {
    const introEnd = introType !== 'none' ? introDelay + introDuration : introDelay;
    const emphasisElapsed = Math.max(0, currentTimeMs - introEnd);
    const duration = config.emphasisDuration ?? 1000;

    if (emphasisType === 'pulse') {
      const s = 1 + 0.08 * Math.sin((emphasisElapsed / duration) * Math.PI * 2);
      return { opacity: 1, transform: `scale(${s.toFixed(4)})` };
    }
    if (emphasisType === 'wiggle') {
      const rot = 5 * Math.sin((emphasisElapsed / (duration / 2)) * Math.PI * 2);
      return { opacity: 1, transform: `rotate(${rot.toFixed(2)}deg)` };
    }
    if (emphasisType === 'glow') {
      const b = 1 + 0.3 * Math.sin((emphasisElapsed / duration) * Math.PI * 2);
      const blur = 10 + 5 * Math.sin((emphasisElapsed / duration) * Math.PI * 2);
      return { opacity: 1, filter: `brightness(${b.toFixed(2)}) drop-shadow(0 0 ${blur.toFixed(1)}px rgba(245, 158, 11, 0.6))` };
    }
    if (emphasisType === 'float') {
      const ty = -10 * Math.sin((emphasisElapsed / duration) * Math.PI * 2);
      return { opacity: 1, transform: `translateY(${ty.toFixed(2)}px)` };
    }
    if (emphasisType === 'spin') {
      const rot = ((emphasisElapsed / duration) % 1) * 360;
      return { opacity: 1, transform: `rotate(${rot.toFixed(2)}deg)` };
    }
    if (emphasisType === 'light-wipe-loop') {
      const b = 1 + Math.max(0, Math.sin((emphasisElapsed / duration) * Math.PI * 2)) * 1.5;
      return { opacity: 1, filter: `brightness(${b.toFixed(2)})` };
    }
  }

  return { opacity: 1 };
}

export function getElementAnimationStyle(
  anim?: ElementAnimationConfig,
  keyTrigger: string | number = 0,
  forcePhase: 'intro' | 'outro' | 'emphasis' | 'active' | 'none' = 'none'
): React.CSSProperties {
  if (!anim) return {};

  const introType = anim.introType || 'none';
  const introDuration = anim.introDuration ?? 500;
  const introDelay = anim.introDelay ?? 0;

  const emphasisType = anim.emphasisType || 'none';
  const emphasisDuration = anim.emphasisDuration ?? 2000;

  const outroType = anim.outroType || 'none';
  const outroDuration = anim.outroDuration ?? 500;
  const outroDelay = anim.outroDelay ?? 0;

  // Outro phase explicitly forced (e.g. slide exiting or clearing / "Masquer")
  if (forcePhase === 'outro') {
    if (outroType !== 'none') {
      const keyframeMap: Record<string, string> = {
        'fade-out': 'elemFadeOut',
        'slide-up': 'elemSlideUpOut',
        'slide-down': 'elemSlideDownOut',
        'slide-left': 'elemSlideLeftOut',
        'slide-right': 'elemSlideRightOut',
        'zoom-out': 'elemZoomOut',
        'bounce-out': 'elemBounceOut',
        'flip-out': 'elemFlipOut',
        'rotate-out': 'elemRotateOut',
        'stroke-trim-out': 'elemStrokeTrimOut',
        'light-wipe-out': 'elemLightWipeOut',
      };
      const keyframe = keyframeMap[outroType] || 'elemFadeOut';
      return {
        animationName: keyframe,
        animationDuration: `${outroDuration}ms`,
        animationDelay: `${outroDelay}ms`,
        animationFillMode: 'forwards',
        animationTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
      };
    } else if (introType !== 'none') {
      // Replay the SAME intro animation in REVERSE for closing
      const keyframeMap: Record<string, string> = {
        'fade-in': 'elemFadeIn',
        'slide-up': 'elemSlideUpIn',
        'slide-down': 'elemSlideDownIn',
        'slide-left': 'elemSlideLeftIn',
        'slide-right': 'elemSlideRightIn',
        'zoom-in': 'elemZoomIn',
        'bounce-in': 'elemBounceIn',
        'flip-in': 'elemFlipIn',
        'rotate-in': 'elemRotateIn',
        'stroke-trim': 'elemStrokeTrim',
        'light-wipe': 'elemLightWipeIn',
      };
      const keyframe = keyframeMap[introType] || 'elemFadeIn';
      return {
        animationName: keyframe,
        animationDuration: `${introDuration}ms`,
        animationDelay: `${outroDelay}ms`,
        animationDirection: 'reverse',
        animationFillMode: 'forwards',
        animationTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
      };
    } else {
      return {
        animationName: 'elemFadeOut',
        animationDuration: `${outroDuration}ms`,
        animationFillMode: 'forwards',
        animationTimingFunction: 'ease-out',
      };
    }
  }

  // Intro phase explicitly forced (e.g. initial entrance / first projection after black/off)
  if (forcePhase === 'intro') {
    if (introType !== 'none') {
      const keyframeMap: Record<string, string> = {
        'fade-in': 'elemFadeIn',
        'slide-up': 'elemSlideUpIn',
        'slide-down': 'elemSlideDownIn',
        'slide-left': 'elemSlideLeftIn',
        'slide-right': 'elemSlideRightIn',
        'zoom-in': 'elemZoomIn',
        'bounce-in': 'elemBounceIn',
        'flip-in': 'elemFlipIn',
        'rotate-in': 'elemRotateIn',
        'stroke-trim': 'elemStrokeTrim',
        'light-wipe': 'elemLightWipeIn',
      };
      const keyframe = keyframeMap[introType] || 'elemFadeIn';
      return {
        animationName: keyframe,
        animationDuration: `${introDuration}ms`,
        animationDelay: `${introDelay}ms`,
        animationFillMode: 'both',
        animationTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
      };
    } else {
      return {
        animationName: 'elemFadeIn',
        animationDuration: '350ms',
        animationFillMode: 'both',
        animationTimingFunction: 'ease-out',
      };
    }
  }

  // Emphasis phase explicitly forced
  if (forcePhase === 'emphasis' || forcePhase === 'active') {
    if (emphasisType !== 'none') {
      const keyframeMap: Record<string, string> = {
        'pulse': 'elemPulse',
        'wiggle': 'elemWiggle',
        'glow': 'elemGlow',
        'float': 'elemFloat',
        'spin': 'elemSpin',
        'light-wipe-loop': 'elemLightWipeLoop',
      };
      const keyframe = keyframeMap[emphasisType];
      if (keyframe) {
        return {
          animationName: keyframe,
          animationDuration: `${emphasisDuration}ms`,
          animationIterationCount: anim.emphasisLoop ? 'infinite' : 1,
          animationTimingFunction: 'ease-in-out',
          animationFillMode: 'forwards',
          transformOrigin: 'center center',
          willChange: 'transform, filter',
        };
      }
    }
    return {};
  }

  // Standard Projection Playback (Sequence: 1. Entrée -> 2. Emphase -> 3. Sortie)
  const introKeyframeMap: Record<string, string> = {
    'fade-in': 'elemFadeIn',
    'slide-up': 'elemSlideUpIn',
    'slide-down': 'elemSlideDownIn',
    'slide-left': 'elemSlideLeftIn',
    'slide-right': 'elemSlideRightIn',
    'zoom-in': 'elemZoomIn',
    'bounce-in': 'elemBounceIn',
    'flip-in': 'elemFlipIn',
    'rotate-in': 'elemRotateIn',
    'stroke-trim': 'elemStrokeTrim',
    'light-wipe': 'elemLightWipeIn',
  };

  const emphasisKeyframeMap: Record<string, string> = {
    'pulse': 'elemPulse',
    'wiggle': 'elemWiggle',
    'glow': 'elemGlow',
    'float': 'elemFloat',
    'spin': 'elemSpin',
    'light-wipe-loop': 'elemLightWipeLoop',
  };

  const outroKeyframeMap: Record<string, string> = {
    'fade-out': 'elemFadeOut',
    'slide-up': 'elemSlideUpOut',
    'slide-down': 'elemSlideDownOut',
    'slide-left': 'elemSlideLeftOut',
    'slide-right': 'elemSlideRightOut',
    'zoom-out': 'elemZoomOut',
    'bounce-out': 'elemBounceOut',
    'flip-out': 'elemFlipOut',
    'rotate-out': 'elemRotateOut',
    'stroke-trim-out': 'elemStrokeTrimOut',
    'light-wipe-out': 'elemLightWipeOut',
  };

  const names: string[] = [];
  const durations: string[] = [];
  const delays: string[] = [];
  const counts: string[] = [];
  const timings: string[] = [];
  const fillModes: string[] = [];

  // Phase 1: Entrée (Intro)
  if (introType !== 'none') {
    const keyframe = introKeyframeMap[introType] || 'elemFadeIn';
    names.push(keyframe);
    durations.push(`${introDuration}ms`);
    delays.push(`${introDelay}ms`);
    counts.push('1');
    timings.push('cubic-bezier(0.16, 1, 0.3, 1)');
    fillModes.push('both');
  }

  // Phase 2: Emphase (Emphasis - starts immediately after Intro finishes)
  if (emphasisType !== 'none') {
    const keyframe = emphasisKeyframeMap[emphasisType];
    if (keyframe) {
      const startDelay = introType !== 'none' ? (introDelay + introDuration) : introDelay;
      names.push(keyframe);
      durations.push(`${emphasisDuration}ms`);
      delays.push(`${startDelay}ms`);
      counts.push(anim.emphasisLoop ? 'infinite' : '1');
      timings.push('ease-in-out');
      fillModes.push('forwards');
    }
  }

  // Phase 3: Sortie (Outro - scheduled at outroDelay if defined)
  if (outroType !== 'none' && outroDelay && outroDelay > 0) {
    const keyframe = outroKeyframeMap[outroType] || 'elemFadeOut';
    names.push(keyframe);
    durations.push(`${outroDuration}ms`);
    delays.push(`${outroDelay}ms`);
    counts.push('1');
    timings.push('cubic-bezier(0.16, 1, 0.3, 1)');
    fillModes.push('forwards');
  }

  if (names.length > 0) {
    return {
      animationName: names.join(', '),
      animationDuration: durations.join(', '),
      animationDelay: delays.join(', '),
      animationIterationCount: counts.join(', '),
      animationTimingFunction: timings.join(', '),
      animationFillMode: fillModes.join(', '),
      transformOrigin: 'center center',
      willChange: 'transform, filter, opacity',
    };
  }

  return {};
}
