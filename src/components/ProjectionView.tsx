import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { ProjectedData, ProjectionStyle, ProjectionScreenConfig, ThemePreset, ActiveModule } from '../types';
import { ProjectionCanvas } from './ProjectionCanvas';

export const ProjectionView: React.FC = () => {
  const [data, setData] = useState<ProjectedData | null>(null);
  const [screens, setScreens] = useState<ProjectionScreenConfig[]>([]);
  const [themes, setThemes] = useState<ThemePreset[]>([]);
  const [fallbackStyle, setFallbackStyle] = useState<ProjectionStyle>({
    mode: 'LOWER_THIRD',
    theme: 'dark',
    align: 'center'
  });

  // Extract current screen ID from query string or short path (/1, /2, /live, /stage, /audience)
  const pathname = typeof window !== 'undefined' ? window.location.pathname.toLowerCase() : '';
  const urlParams = new URLSearchParams(window.location.search);
  let rawScreenParam = urlParams.get('screen');

  if (!rawScreenParam) {
    if (pathname === '/1' || pathname === '/live' || pathname === '/audience' || pathname === '/a') {
      rawScreenParam = 'audience';
    } else if (pathname === '/2' || pathname === '/stage' || pathname === '/s') {
      rawScreenParam = 'stage';
    } else {
      const pathParts = pathname.split('/').filter(Boolean);
      if (pathParts.length > 1 && pathParts[0] === 'projection') {
        rawScreenParam = pathParts[1];
      }
    }
  }

  let currentScreenId = rawScreenParam || 'audience';

  // Normalize legacy parameters (e.g. lower-third -> audience)
  if (currentScreenId === 'lower-third' || currentScreenId === 'plein-ecran') {
    currentScreenId = 'audience';
    if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
      window.history.replaceState(null, '', '/projection?screen=audience');
    }
  } else if (currentScreenId === 'retour-scene') {
    currentScreenId = 'stage';
    if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
      window.history.replaceState(null, '', '/projection?screen=stage');
    }
  }

  // Update window title
  useEffect(() => {
    document.title = `Projecteur MaAndiko Studio - ${currentScreenId.toUpperCase()}`;
  }, [currentScreenId]);

  // Keyboard shortcuts (F11, F, Alt+Enter to toggle Fullscreen)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F11' || (e.key.toLowerCase() === 'f' && !e.ctrlKey && !e.metaKey) || (e.key === 'Enter' && e.altKey)) {
        e.preventDefault();
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error("Erreur lors de l'activation du plein écran:", err);
      });
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const socket: Socket = io();

    socket.on('mise-a-jour-ecrans', (payload: any) => {
      let ecransList: ProjectionScreenConfig[] = [];
      let themesList: ThemePreset[] = [];

      if (Array.isArray(payload)) {
        ecransList = payload;
      } else if (payload && typeof payload === 'object') {
        ecransList = payload.ecrans || [];
        themesList = payload.themes || [];
      }

      setScreens(ecransList);
      if (themesList.length > 0) setThemes(themesList);
    });

    socket.on('appliquer-style-projection', (st: ProjectionStyle) => {
      if (st) {
        setFallbackStyle((prev) => ({ ...prev, ...st }));
      }
    });

    socket.on('afficher-paragraphe', (d: ProjectedData) => {
      setData(d);
    });

    return () => {
      socket.disconnect();
    };
  }, [currentScreenId]);

  // Compute active module from projected data
  const currentModule: ActiveModule = data?.module || (
    data?.sermonId === 'BIBLE' ? 'bible' :
    data?.sermonId === 'LYRICS' ? 'lyrics' : 'brochures'
  );

  let currentScreen = screens.find(s => s.id === currentScreenId);
  if (!currentScreen) {
    if (currentScreenId === 'plein-ecran' || currentScreenId === 'lower-third') {
      currentScreen = screens.find(s => s.id === 'audience') || screens[0];
    } else if (currentScreenId === 'retour-scene') {
      currentScreen = screens.find(s => s.id === 'stage') || screens[0];
    } else {
      currentScreen = screens.find(s => s.id === 'audience') || screens[0];
    }
  }
  let effectiveStyle: ProjectionStyle = fallbackStyle;

  if (currentScreen) {
    const assignedThemeId = currentScreen.moduleThemes?.[currentModule];
    let themeObj = themes.find(t => t.id === assignedThemeId && t.module === currentModule);
    if (!themeObj && assignedThemeId) {
      themeObj = themes.find(t => t.id === assignedThemeId);
    }
    if (!themeObj && currentScreen.defaultThemeId) {
      themeObj = themes.find(t => t.id === currentScreen.defaultThemeId && t.module === currentModule);
      if (!themeObj) {
        themeObj = themes.find(t => t.id === currentScreen.defaultThemeId);
      }
    }

    const themeStyle = themeObj?.style || {};
    const screenStyle = currentScreen.style || {};

    const mergedStyle = {
      ...themeStyle,
      ...screenStyle,
      ...fallbackStyle
    };

    const hasVideo = Boolean(mergedStyle.bgVideoUrl && mergedStyle.bgVideoUrl.trim() !== '');
    const hasImage = Boolean(mergedStyle.bgImageUrl && mergedStyle.bgImageUrl.trim() !== '');
    const resolvedBgType =
      mergedStyle.bgType === 'chroma' || mergedStyle.containerBg === '#00ff00' ? 'chroma' :
      mergedStyle.bgType === 'transparent' || mergedStyle.containerBg === 'transparent' ? 'transparent' :
      hasVideo && mergedStyle.bgType !== 'color' ? 'video' :
      hasImage && mergedStyle.bgType !== 'color' ? 'image' : (mergedStyle.bgType || 'color');

    effectiveStyle = {
      ...mergedStyle,
      containerBg: mergedStyle.containerBg || 'rgba(8, 11, 18, 0.95)',
      bgType: resolvedBgType
    };
  }

  return (
    <div 
      onDoubleClick={toggleFullscreen}
      className="w-screen h-screen overflow-hidden bg-black relative select-none cursor-none flex items-center justify-center"
      title="Double-cliquez pour basculer en Plein Écran (Plein Écran OBS / Studio)"
    >
      {/* Pure OBS / ProPresenter Clean Projection Output Canvas */}
      <ProjectionCanvas data={data} style={effectiveStyle} isPreview={false} />
    </div>
  );
};






