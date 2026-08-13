import React, { useState, useEffect, useMemo } from 'react';
import { openProjectorWindow } from '../utils/projectorWindow';
import { ProjectionStyle, ProjectedData, SlideElement, ProjectionScreenConfig, ThemePreset } from '../types';
import { ProjectionCanvas } from './ProjectionCanvas';
import { TypographyControls } from './TypographyControls';
import { ColorGradientPicker } from './ColorGradientPicker';
import { AnimationModal } from './AnimationModal';
import {
  Tv,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  AlignStartVertical,
  AlignEndVertical,
  AlignHorizontalJustifyCenter,
  AlignVerticalJustifyCenter,
  CheckSquare,
  X,
  Type,
  Layout,
  Sliders,
  Sparkles,
  RotateCcw,
  Monitor,
  Plus,
  Square,
  BoxSelect,
  Bookmark,
  BookOpen,
  Trash2,
  Copy,
  Layers,
  Move,
  ArrowUp,
  ArrowDown,
  Edit3,
  MousePointer,
  Sparkle,
  Undo2,
  Redo2,
  Maximize2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Radio,
  Play,
  Circle,
  Minus,
  Church,
  Mic,
  Star,
  Music,
  Quote,
  Shield,
  Tag,
  ZoomIn,
  ZoomOut,
  Wifi,
  Check,
  CheckCircle2,
  Eye,
  Image as ImageIcon,
  Video,
  Film,
  Link,
  Upload,
  Globe,
  FileImage,
  Pencil,
  Grid
} from 'lucide-react';

interface ProjectionStyleModalProps {
  style: ProjectionStyle;
  onChangeStyle: (newStyle: Partial<ProjectionStyle>) => void;
  onClose: () => void;
  liveData?: ProjectedData | null;
  screens?: ProjectionScreenConfig[];
  themes?: ThemePreset[];
  activeModule?: 'brochures' | 'lyrics' | 'bible';
  selectedScreenId?: string;
  onSelectScreen?: (id: string) => void;
  onAddScreen?: (id: string, name: string, mode?: ProjectionStyle['mode'], outputType?: string, description?: string) => void;
  onDeleteScreen?: (id: string) => void;
  onUpdateScreensAndThemes?: (screens: ProjectionScreenConfig[], themes: ThemePreset[]) => void;
  onOpenNetworkShare?: () => void;
}

// Built-in Themes Library Fallback (Fresh Clean Tailored Setup)
const DEFAULT_THEMES_LIBRARY: ThemePreset[] = [];

// Sample dummy data per module for live preview
const SAMPLE_PREVIEW_BROCHURE: ProjectedData = {
  sermonId: '63-0630M',
  numero: 142,
  texte: "Et Jésus leur parla de nouveau, et dit: Je suis la lumière du monde; celui qui me suit ne marchera pas dans les ténèbres, mais il aura la lumière de la vie.",
  titre_francais: 'LE TROISIÈME SCEAU',
  type_structure: 'PARAGRAPHE',
  blockIndex: 1,
  totalBlocks: 1,
  module: 'brochures'
};

const SAMPLE_PREVIEW_LYRICS: ProjectedData = {
  sermonId: 'LYRICS',
  numero: 45,
  texte: "Grâce étonnante, ô quel doux son,\nQui sauva un misérable comme moi !\nJ'étais perdu, mais maintenant je suis retrouvé,\nJ'étais aveugle, mais maintenant je vois.",
  titre_francais: 'AMAZING GRACE - CANTIQUE N° 45',
  type_structure: 'REFRAIN',
  blockIndex: 1,
  totalBlocks: 4,
  module: 'lyrics'
};

const SAMPLE_PREVIEW_BIBLE: ProjectedData = {
  sermonId: 'BIBLE',
  numero: '1:1',
  texte: "Au commencement était la Parole, et la Parole était avec Dieu, et la Parole était Dieu. Elle était au commencement avec Dieu. Toutes choses ont été faites par elle.",
  titre_francais: 'JEAN 1:1-2 (LSG)',
  type_structure: 'VERSET',
  blockIndex: 1,
  totalBlocks: 1,
  module: 'bible'
};

// Default custom slide elements template for Lower-Third
const DEFAULT_LOWER_THIRD_ELEMENTS: SlideElement[] = [
  {
    id: 'bg-box-1',
    name: 'Boîte de Fond Lower-Third',
    type: 'shape',
    binding: 'static_text',
    position: { x: 5, y: 62, width: 90, height: 32, zIndex: 1 },
    style: {
      backgroundColor: 'rgba(8, 11, 18, 0.95)',
      borderColor: '#ffffff',
      borderWidth: 3,
      borderRadius: 20,
      padding: 16,
      opacity: 0.95,
      boxShadow: true
    }
  },
  {
    id: 'sermon-text-1',
    name: 'Zone Texte Sermon',
    type: 'text',
    binding: 'sermon_text',
    position: { x: 8, y: 64, width: 84, height: 18, zIndex: 2 },
    style: {
      textColor: '#ffffff',
      fontSize: 32,
      fontWeight: 'bold',
      textAlign: 'center',
      lineHeight: 1.3,
      textShadow: true
    }
  },
  {
    id: 'sermon-header-1',
    name: 'En-tête Code & Titre',
    type: 'text',
    binding: 'sermon_header',
    position: { x: 8, y: 84, width: 55, height: 6, zIndex: 3 },
    style: {
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      textColor: '#00d2ff',
      borderColor: 'rgba(255, 255, 255, 0.3)',
      borderWidth: 1,
      borderRadius: 20,
      fontSize: 18,
      fontWeight: 'bold',
      textAlign: 'center',
      padding: 6
    }
  },
  {
    id: 'sermon-badge-1',
    name: 'Badge Paragraphe / Page',
    type: 'badge',
    binding: 'sermon_reference',
    position: { x: 70, y: 84, width: 22, height: 6, zIndex: 3 },
    style: {
      backgroundColor: '#ffffff',
      textColor: '#000000',
      borderRadius: 20,
      fontSize: 18,
      fontWeight: 'extrabold',
      textAlign: 'center',
      padding: 6
    }
  }
];

export const ProjectionStyleModal: React.FC<ProjectionStyleModalProps> = ({
  style,
  onChangeStyle,
  onClose,
  liveData,
  screens = [],
  themes: propsThemes = [],
  activeModule = 'brochures',
  selectedScreenId = 'audience',
  onSelectScreen,
  onAddScreen,
  onDeleteScreen,
  onUpdateScreensAndThemes,
  onOpenNetworkShare
}) => {
  const moduleConfig = {
    brochures: {
      id: 'brochures' as const,
      name: 'Brochures / Sermons',
      shortName: 'Brochure',
      icon: BookOpen,
      colorClass: 'text-blue-400',
      bgClass: 'bg-blue-600',
      borderClass: 'border-blue-500/30',
      badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
      desc: 'Style visuel et attribution des écrans pour la projection des sermons et brochures.'
    },
    lyrics: {
      id: 'lyrics' as const,
      name: 'Chants & Cantiques',
      shortName: 'Chant',
      icon: Music,
      colorClass: 'text-purple-400',
      bgClass: 'bg-purple-600',
      borderClass: 'border-purple-500/30',
      badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      desc: 'Style visuel et attribution des écrans pour la projection des cantiques et louanges.'
    },
    bible: {
      id: 'bible' as const,
      name: 'Sainte Bible',
      shortName: 'Bible',
      icon: Bookmark,
      colorClass: 'text-amber-400',
      bgClass: 'bg-amber-600',
      borderClass: 'border-amber-500/30',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      desc: 'Style visuel et attribution des écrans pour la projection de la Sainte Bible.'
    }
  }[activeModule || 'brochures'];

  const ModuleIcon = moduleConfig.icon;

  const [previewContentType, setPreviewContentType] = useState<'brochures' | 'lyrics' | 'bible'>('brochures');

  // Themes Library State
  const [themePresets, setThemePresets] = useState<ThemePreset[]>(() => {
    return (propsThemes || []).map(t => ({
      ...t,
      module: t.module || 'brochures'
    }));
  });

  // Filter themes strictly relevant to the active module
  const availableModuleThemes = useMemo(() => {
    return themePresets.filter(t => t.module === activeModule);
  }, [themePresets, activeModule]);

  // Screen Outputs State
  const [screenConfigs, setScreenConfigs] = useState<ProjectionScreenConfig[]>(screens);

  // Sync props when screens or themes change from server/socket
  useEffect(() => {
    if (screens && screens.length > 0) setScreenConfigs(screens);
  }, [screens]);

  useEffect(() => {
    setThemePresets((propsThemes || []).map(t => ({
      ...t,
      module: t.module || 'brochures'
    })));
  }, [propsThemes]);

  // Active theme being edited in Theme Editor (default to first theme available for activeModule)
  const [editingThemeId, setEditingThemeId] = useState<string>(() => {
    const activeScreen = screens.find(s => s.id === selectedScreenId) || screens[0];
    const assigned = activeScreen?.moduleThemes?.[activeModule];
    const available = (propsThemes || []).filter(t => (t.module || 'brochures') === activeModule);
    if (assigned && available.some(t => t.id === assigned)) {
      return assigned;
    }
    return available.length > 0 ? available[0].id : '';
  });

  // Keep editingThemeId aligned with activeModule
  useEffect(() => {
    if (availableModuleThemes.length > 0) {
      if (!availableModuleThemes.some(t => t.id === editingThemeId)) {
        const activeScreen = screenConfigs.find(s => s.id === selectedScreenId) || screenConfigs[0];
        const assigned = activeScreen?.moduleThemes?.[activeModule];
        if (assigned && availableModuleThemes.some(t => t.id === assigned)) {
          setEditingThemeId(assigned);
        } else {
          setEditingThemeId(availableModuleThemes[0].id);
        }
      }
    } else {
      setEditingThemeId('');
    }
  }, [activeModule, availableModuleThemes]);

  const [editorMode, setEditorMode] = useState<'visual_canvas' | 'quick_presets'>('visual_canvas');
  const [activeTab, setActiveTab] = useState<'screens' | 'elements' | 'inspector' | 'presets'>('screens');
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>(['sermon-text-1']);
  const [canvasBgMode, setCanvasBgMode] = useState<'video' | 'grid' | 'chroma' | 'color' | 'black'>('video');
  const [canvasSimColor, setCanvasSimColor] = useState<string>('#00ff00');
  const [isColorPaletteOpen, setIsColorPaletteOpen] = useState<boolean>(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState<boolean>(false);
  const [showAnimationModal, setShowAnimationModal] = useState<boolean>(false);
  const [zoomScale, setZoomScale] = useState<number>(1);

  // Media Import Modal & File Inputs state
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [mediaModalType, setMediaModalType] = useState<'image' | 'video' | 'url'>('image');
  const [mediaTarget, setMediaTarget] = useState<'element' | 'background'>('background');
  const [mediaInputUrl, setMediaInputUrl] = useState('');

  const imageFileInputRef = React.useRef<HTMLInputElement>(null);
  const videoFileInputRef = React.useRef<HTMLInputElement>(null);

  // New screen creation state
  const [showScreenMenu, setShowScreenMenu] = useState(false);
  const [isAddingScreen, setIsAddingScreen] = useState(false);
  const [newScreenName, setNewScreenName] = useState('');
  const [newScreenOutputType, setNewScreenOutputType] = useState<string>('hdmi');
  const [newScreenMode, setNewScreenMode] = useState<ProjectionStyle['mode']>('CENTER_CARD');

  // Screen editing state
  const [editingScreenConfig, setEditingScreenConfig] = useState<ProjectionScreenConfig | null>(null);
  const [editScreenName, setEditScreenName] = useState('');
  const [editScreenOutputType, setEditScreenOutputType] = useState('hdmi');

  const selectedElementId = selectedElementIds[0] || null;

  // Local Draft Style state for Off/Draft editing (no real-time live broadcast until saved)
  const [draftStyle, setDraftStyle] = useState<ProjectionStyle>(style);
  const [isDirty, setIsDirty] = useState<boolean>(false);

  // Sync draftStyle ONLY when editingThemeId actually changes to a different theme ID
  const prevEditingThemeIdRef = React.useRef<string>(editingThemeId);
  useEffect(() => {
    if (editingThemeId && editingThemeId !== prevEditingThemeIdRef.current) {
      prevEditingThemeIdRef.current = editingThemeId;
      const found = themePresets.find(t => t.id === editingThemeId);
      if (found && found.style) {
        setDraftStyle(found.style);
        setHistory([found.style]);
        setHistoryIndex(0);
        setIsDirty(false);
      }
    }
  }, [editingThemeId, themePresets]);

  // Sync draftStyle ONLY when selectedScreenId actually changes
  const prevSelectedScreenIdRef = React.useRef<string>(selectedScreenId);
  useEffect(() => {
    if (selectedScreenId && selectedScreenId !== prevSelectedScreenIdRef.current) {
      prevSelectedScreenIdRef.current = selectedScreenId;
      setDraftStyle(style);
      setHistory([style]);
      setHistoryIndex(0);
      setIsDirty(false);
    }
  }, [selectedScreenId, style]);

  const handleAssignModuleTheme = (screenId: string, moduleKey: 'brochures' | 'lyrics' | 'bible', themeId: string) => {
    const updatedScreens = screenConfigs.map(s => {
      if (s.id === screenId) {
        return {
          ...s,
          moduleThemes: {
            brochures: s.moduleThemes?.brochures || '',
            lyrics: s.moduleThemes?.lyrics || '',
            bible: s.moduleThemes?.bible || '',
            [moduleKey]: themeId
          }
        };
      }
      return s;
    });
    setScreenConfigs(updatedScreens);
    if (onUpdateScreensAndThemes) {
      onUpdateScreensAndThemes(updatedScreens, themePresets);
    }
  };

  const handleSaveThemeStyle = (targetThemeId: string, updatedStyle: ProjectionStyle) => {
    let targetId = targetThemeId || editingThemeId || availableModuleThemes[0]?.id;
    const resolvedBg = updatedStyle.containerBg || draftStyle.containerBg || 'rgba(8, 11, 18, 0.95)';
    
    // Determine proper bgType preserving background video or image media
    const videoUrl = updatedStyle.bgVideoUrl !== undefined ? updatedStyle.bgVideoUrl : draftStyle.bgVideoUrl;
    const imageUrl = updatedStyle.bgImageUrl !== undefined ? updatedStyle.bgImageUrl : draftStyle.bgImageUrl;
    const hasVideo = Boolean(videoUrl && videoUrl.trim() !== '');
    const hasImage = Boolean(imageUrl && imageUrl.trim() !== '');

    let resolvedBgType = updatedStyle.bgType || draftStyle.bgType;
    if (resolvedBg === 'transparent') {
      resolvedBgType = 'transparent';
    } else if (resolvedBg === '#00ff00') {
      resolvedBgType = 'chroma';
    } else if (hasVideo && resolvedBgType !== 'color') {
      resolvedBgType = 'video';
    } else if (hasImage && resolvedBgType !== 'color') {
      resolvedBgType = 'image';
    } else if (!resolvedBgType) {
      resolvedBgType = 'color';
    }

    const currentElements = updatedStyle.customElements || draftStyle.customElements || customElements;

    const finalStyle: ProjectionStyle = {
      ...draftStyle,
      ...updatedStyle,
      useCustomElements: true,
      customElements: currentElements,
      mode: 'CUSTOM_CANVAS',
      bgType: resolvedBgType,
      containerBg: resolvedBg,
      bgImageUrl: imageUrl,
      bgVideoUrl: videoUrl,
      bgOpacity: updatedStyle.bgOpacity !== undefined ? updatedStyle.bgOpacity : (draftStyle.bgOpacity !== undefined ? draftStyle.bgOpacity : 1)
    };

    let updatedThemes = themePresets;
    const targetModule = (activeModule || 'brochures') as 'brochures' | 'lyrics' | 'bible';

    if (!targetId) {
      targetId = `theme-${targetModule}-${Date.now()}`;
      const newTheme: ThemePreset = {
        id: targetId,
        name: `Thème Personnalisé ${moduleConfig.shortName}`,
        description: `Thème sur mesure pour le module ${moduleConfig.name}`,
        module: targetModule,
        isBuiltIn: false,
        style: finalStyle
      };
      updatedThemes = [...themePresets, newTheme];
      setEditingThemeId(targetId);
    } else {
      updatedThemes = themePresets.map(t => {
        if (t.id === targetId) {
          return {
            ...t,
            style: finalStyle,
            module: t.module || targetModule
          };
        }
        return t;
      });
    }
    setThemePresets(updatedThemes);

    // Update screenConfigs so selected screen and screens assigned to this theme get updated
    const updatedScreens = screenConfigs.map(s => {
      const isAssigned = targetId && s.moduleThemes?.[targetModule] === targetId;
      if (s.id === selectedScreenId || isAssigned) {
        return {
          ...s,
          style: finalStyle,
          moduleThemes: {
            brochures: s.moduleThemes?.brochures || '',
            lyrics: s.moduleThemes?.lyrics || '',
            bible: s.moduleThemes?.bible || '',
            [targetModule]: targetId
          }
        };
      }
      return s;
    });
    setScreenConfigs(updatedScreens);

    if (onUpdateScreensAndThemes) {
      onUpdateScreensAndThemes(updatedScreens, updatedThemes);
    }
  };

  const handleSaveAndApply = (closeAfter = false) => {
    const resolvedBg = draftStyle.containerBg || 'rgba(8, 11, 18, 0.95)';
    const hasVideo = Boolean(draftStyle.bgVideoUrl && draftStyle.bgVideoUrl.trim() !== '');
    const hasImage = Boolean(draftStyle.bgImageUrl && draftStyle.bgImageUrl.trim() !== '');

    let resolvedBgType = draftStyle.bgType;
    if (resolvedBg === 'transparent') {
      resolvedBgType = 'transparent';
    } else if (resolvedBg === '#00ff00') {
      resolvedBgType = 'chroma';
    } else if (hasVideo && resolvedBgType !== 'color') {
      resolvedBgType = 'video';
    } else if (hasImage && resolvedBgType !== 'color') {
      resolvedBgType = 'image';
    } else if (!resolvedBgType) {
      resolvedBgType = 'color';
    }

    const styleToApply: ProjectionStyle = {
      ...draftStyle,
      useCustomElements: true,
      customElements: customElements,
      mode: draftStyle.mode || 'CUSTOM_CANVAS',
      bgType: resolvedBgType,
      containerBg: resolvedBg
    };
    handleSaveThemeStyle(editingThemeId, styleToApply);
    onChangeStyle(styleToApply);
    setIsDirty(false);
    if (closeAfter) {
      onClose();
    }
  };

  const handleRenameTheme = (targetThemeId: string, newName: string) => {
    const updatedThemes = themePresets.map(t => {
      if (t.id === targetThemeId) {
        return { ...t, name: newName };
      }
      return t;
    });
    setThemePresets(updatedThemes);
    if (onUpdateScreensAndThemes) {
      onUpdateScreensAndThemes(screenConfigs, updatedThemes);
    }
  };

  const handleCreateNewTheme = () => {
    const targetModule = (activeModule || 'brochures') as 'brochures' | 'lyrics' | 'bible';
    const randomSuffix = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newId = `theme-${targetModule}-${randomSuffix}`;
    const existingCount = themePresets.filter(t => (t.module || 'brochures') === targetModule).length;
    const defaultName = `Thème ${moduleConfig.shortName} #${existingCount + 1}`;

    const cleanStyle: ProjectionStyle = {
      mode: 'CUSTOM_CANVAS',
      useCustomElements: true,
      customElements: [],
      containerBg: 'rgba(8, 11, 18, 0.95)',
      textColor: '#FFFFFF',
      fontFamily: 'Inter',
      align: 'center'
    };
    const newTheme: ThemePreset = {
      id: newId,
      name: defaultName,
      description: `Thème sur mesure pour le module ${moduleConfig.name}`,
      module: targetModule,
      isBuiltIn: false,
      style: cleanStyle
    };
    const updatedThemes = [...themePresets, newTheme];
    setThemePresets(updatedThemes);
    setEditingThemeId(newId);
    setDraftStyle(cleanStyle);
    if (onUpdateScreensAndThemes) {
      onUpdateScreensAndThemes(screenConfigs, updatedThemes);
    }
  };

  const handleDeleteTheme = (themeIdToDelete: string) => {
    const updatedThemes = themePresets.filter(t => t.id !== themeIdToDelete);
    setThemePresets(updatedThemes);
    const remainingForModule = updatedThemes.filter(t => t.module === activeModule);
    setEditingThemeId(remainingForModule.length > 0 ? remainingForModule[0].id : '');
    if (onUpdateScreensAndThemes) {
      onUpdateScreensAndThemes(screenConfigs, updatedThemes);
    }
  };

  // Undo / Redo history stack
  const [history, setHistory] = useState<ProjectionStyle[]>([style]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Helper to push a state change to the history stack (Auto-syncs live style)
  const pushStyleChange = (updates: Partial<ProjectionStyle>) => {
    const nextStyle = { ...draftStyle, ...updates };
    setDraftStyle(nextStyle);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(nextStyle);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    if (onChangeStyle) {
      onChangeStyle(nextStyle);
    }
    setIsDirty(true);
  };

  // Undo action
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const prevStyle = history[prevIndex];
      setHistoryIndex(prevIndex);
      setDraftStyle(prevStyle);
      setIsDirty(true);
    }
  };

  // Redo action
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const nextStyle = history[nextIndex];
      setHistoryIndex(nextIndex);
      setDraftStyle(nextStyle);
      setIsDirty(true);
    }
  };

  const currentData = (liveData && liveData.texte && (!liveData.module || liveData.module === activeModule))
    ? liveData
    : (activeModule === 'lyrics' ? SAMPLE_PREVIEW_LYRICS : activeModule === 'bible' ? SAMPLE_PREVIEW_BIBLE : SAMPLE_PREVIEW_BROCHURE);

  // Active tool menu popover for creation dock flyouts
  const [activeToolMenu, setActiveToolMenu] = useState<'text' | 'shape' | 'icon' | 'media' | null>(null);

  // Initialize custom elements
  const customElements: SlideElement[] = draftStyle.customElements || [];

  const selectedElement = customElements.find(el => el.id === selectedElementId) || customElements[0] || null;
  const selectedElements = customElements.filter(el => selectedElementIds.includes(el.id));

  // Selection toggle helper
  const handleSelectElement = (id: string | null, isMulti = false) => {
    if (!id) {
      setSelectedElementIds([]);
      return;
    }
    if (isMulti) {
      setSelectedElementIds(prev =>
        prev.includes(id)
          ? (prev.length > 1 ? prev.filter(i => i !== id) : prev)
          : [...prev, id]
      );
    } else {
      setSelectedElementIds([id]);
    }
  };

  const handleSelectAll = () => {
    setSelectedElementIds(customElements.map(el => el.id));
  };

  const handleDeselectAll = () => {
    setSelectedElementIds([]);
  };

  // Keyboard Shortcuts for Canvas Element Editing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.tagName === 'SELECT' ||
          (activeEl as HTMLElement).isContentEditable)
      ) {
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElementIds.length > 0) {
          e.preventDefault();
          handleDeleteSelected();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleDeselectAll();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        if (selectedElementIds.length > 0) {
          e.preventDefault();
          const step = e.shiftKey ? 2 : 0.5;
          const targetSet = new Set(selectedElementIds);
          const updatedList = customElements.map(el => {
            if (targetSet.has(el.id)) {
              let { x, y } = el.position;
              if (e.key === 'ArrowLeft') x = Math.max(0, Math.round((x - step) * 10) / 10);
              if (e.key === 'ArrowRight') x = Math.min(100 - el.position.width, Math.round((x + step) * 10) / 10);
              if (e.key === 'ArrowUp') y = Math.max(0, Math.round((y - step) * 10) / 10);
              if (e.key === 'ArrowDown') y = Math.min(100 - el.position.height, Math.round((y + step) * 10) / 10);
              return {
                ...el,
                position: { ...el.position, x, y }
              };
            }
            return el;
          });
          updateCustomElements(updatedList);
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        handleDuplicateSelected();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        handleSelectAll();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementIds, customElements, historyIndex, history]);

  // Update element list helper
  const updateCustomElements = (newElements: SlideElement[]) => {
    pushStyleChange({
      useCustomElements: true,
      customElements: newElements,
      mode: 'CUSTOM_CANVAS'
    });
  };

  // Update specific or all selected elements property
  const updateSelectedElement = (updates: Partial<SlideElement>) => {
    if (selectedElementIds.length === 0) return;
    const targetSet = new Set(selectedElementIds);
    const updatedList = customElements.map(el => {
      if (targetSet.has(el.id)) {
        return {
          ...el,
          ...updates,
          position: updates.position ? { ...el.position, ...updates.position } : el.position,
          style: updates.style ? { ...el.style, ...updates.style } : el.style
        };
      }
      return el;
    });
    updateCustomElements(updatedList);
  };

  const updateSelectedElementPosition = (posUpdates: Partial<SlideElement['position']>) => {
    if (selectedElementIds.length === 0) return;
    const targetSet = new Set(selectedElementIds);
    const updatedList = customElements.map(el => {
      if (targetSet.has(el.id)) {
        return {
          ...el,
          position: { ...el.position, ...posUpdates }
        };
      }
      return el;
    });
    updateCustomElements(updatedList);
  };

  const updateSelectedElementStyle = (styleUpdates: Partial<SlideElement['style']>) => {
    if (selectedElementIds.length === 0) return;
    const targetSet = new Set(selectedElementIds);
    const updatedList = customElements.map(el => {
      if (targetSet.has(el.id)) {
        const nextStyle = { ...el.style, ...styleUpdates };
        if (styleUpdates.backgroundColor !== undefined && !styleUpdates.backgroundGradient) {
          delete nextStyle.backgroundGradient;
        }
        if (styleUpdates.backgroundGradient) {
          delete nextStyle.backgroundColor;
        }
        return {
          ...el,
          style: nextStyle
        };
      }
      return el;
    });
    updateCustomElements(updatedList);
  };

  // Group Deletion
  const handleDeleteSelected = () => {
    if (selectedElementIds.length === 0) return;
    const deleteSet = new Set(selectedElementIds);
    const newList = customElements.filter(el => !deleteSet.has(el.id));
    updateCustomElements(newList);
    setSelectedElementIds(newList[0] ? [newList[0].id] : []);
  };

  // Single Delete
  const handleDeleteElement = (id: string) => {
    const newList = customElements.filter(el => el.id !== id);
    updateCustomElements(newList);
    setSelectedElementIds(prev => prev.filter(i => i !== id));
    if (selectedElementId === id) {
      setSelectedElementIds(newList[0] ? [newList[0].id] : []);
    }
  };

  // Group Duplication
  const handleDuplicateSelected = () => {
    if (selectedElementIds.length === 0) return;
    const newIds: string[] = [];
    const dupElements: SlideElement[] = [];

    const itemsToDup = selectedElements.length > 0 ? selectedElements : (selectedElement ? [selectedElement] : []);

    itemsToDup.forEach((el, index) => {
      const dupId = `element-${Date.now()}-${index}`;
      newIds.push(dupId);
      dupElements.push({
        ...el,
        id: dupId,
        name: `${el.name} (Copie)`,
        position: {
          ...el.position,
          x: Math.min(85, el.position.x + 3),
          y: Math.min(85, el.position.y + 3),
          zIndex: customElements.length + index + 1
        }
      });
    });

    const newList = [...customElements, ...dupElements];
    updateCustomElements(newList);
    setSelectedElementIds(newIds);
  };

  // Single Duplicate
  const handleDuplicateElement = (elToDup: SlideElement) => {
    const dupId = `element-${Date.now()}`;
    const dupEl: SlideElement = {
      ...elToDup,
      id: dupId,
      name: `${elToDup.name} (Copie)`,
      position: {
        ...elToDup.position,
        x: Math.min(80, elToDup.position.x + 3),
        y: Math.min(80, elToDup.position.y + 3),
        zIndex: customElements.length + 1
      }
    };
    const newList = [...customElements, dupEl];
    updateCustomElements(newList);
    setSelectedElementIds([dupId]);
  };

  // Grouped Alignment Handlers
  const handleAlignLeft = () => {
    if (selectedElements.length < 2) return;
    const minX = Math.min(...selectedElements.map(el => el.position.x));
    const updated = customElements.map(el =>
      selectedElementIds.includes(el.id)
        ? { ...el, position: { ...el.position, x: minX } }
        : el
    );
    updateCustomElements(updated);
  };

  const handleAlignCenterH = () => {
    if (selectedElements.length < 2) return;
    const minX = Math.min(...selectedElements.map(el => el.position.x));
    const maxX = Math.max(...selectedElements.map(el => el.position.x + el.position.width));
    const centerX = (minX + maxX) / 2;
    const updated = customElements.map(el =>
      selectedElementIds.includes(el.id)
        ? { ...el, position: { ...el.position, x: Math.max(0, Math.round((centerX - el.position.width / 2) * 10) / 10) } }
        : el
    );
    updateCustomElements(updated);
  };

  const handleAlignRight = () => {
    if (selectedElements.length < 2) return;
    const maxRight = Math.max(...selectedElements.map(el => el.position.x + el.position.width));
    const updated = customElements.map(el =>
      selectedElementIds.includes(el.id)
        ? { ...el, position: { ...el.position, x: Math.max(0, Math.round((maxRight - el.position.width) * 10) / 10) } }
        : el
    );
    updateCustomElements(updated);
  };

  const handleAlignTop = () => {
    if (selectedElements.length < 2) return;
    const minY = Math.min(...selectedElements.map(el => el.position.y));
    const updated = customElements.map(el =>
      selectedElementIds.includes(el.id)
        ? { ...el, position: { ...el.position, y: minY } }
        : el
    );
    updateCustomElements(updated);
  };

  const handleAlignMiddleV = () => {
    if (selectedElements.length < 2) return;
    const minY = Math.min(...selectedElements.map(el => el.position.y));
    const maxY = Math.max(...selectedElements.map(el => el.position.y + el.position.height));
    const centerY = (minY + maxY) / 2;
    const updated = customElements.map(el =>
      selectedElementIds.includes(el.id)
        ? { ...el, position: { ...el.position, y: Math.max(0, Math.round((centerY - el.position.height / 2) * 10) / 10) } }
        : el
    );
    updateCustomElements(updated);
  };

  const handleAlignBottom = () => {
    if (selectedElements.length < 2) return;
    const maxBottom = Math.max(...selectedElements.map(el => el.position.y + el.position.height));
    const updated = customElements.map(el =>
      selectedElementIds.includes(el.id)
        ? { ...el, position: { ...el.position, y: Math.max(0, Math.round((maxBottom - el.position.height) * 10) / 10) } }
        : el
    );
    updateCustomElements(updated);
  };

  const handleCenterOnCanvas = () => {
    if (selectedElements.length === 0) return;
    const minX = Math.min(...selectedElements.map(el => el.position.x));
    const maxX = Math.max(...selectedElements.map(el => el.position.x + el.position.width));
    const minY = Math.min(...selectedElements.map(el => el.position.y));
    const maxY = Math.max(...selectedElements.map(el => el.position.y + el.position.height));

    const groupW = maxX - minX;
    const groupH = maxY - minY;

    const groupNewX = (100 - groupW) / 2;
    const groupNewY = (100 - groupH) / 2;

    const deltaX = groupNewX - minX;
    const deltaY = groupNewY - minY;

    const updated = customElements.map(el =>
      selectedElementIds.includes(el.id)
        ? {
            ...el,
            position: {
              ...el.position,
              x: Math.max(0, Math.round((el.position.x + deltaX) * 10) / 10),
              y: Math.max(0, Math.round((el.position.y + deltaY) * 10) / 10)
            }
          }
        : el
    );
    updateCustomElements(updated);
  };

  // Fit element to full container / stage
  const handleFitContainer = () => {
    if (selectedElementIds.length === 0) return;
    const updated = customElements.map(el =>
      selectedElementIds.includes(el.id)
        ? {
            ...el,
            position: {
              ...el.position,
              x: 0,
              y: 0,
              width: 100,
              height: 100
            }
          }
        : el
    );
    updateCustomElements(updated);
  };

  const handleFitWidth = () => {
    if (selectedElementIds.length === 0) return;
    const updated = customElements.map(el =>
      selectedElementIds.includes(el.id)
        ? {
            ...el,
            position: {
              ...el.position,
              x: 0,
              width: 100
            }
          }
        : el
    );
    updateCustomElements(updated);
  };

  const handleFitHeight = () => {
    if (selectedElementIds.length === 0) return;
    const updated = customElements.map(el =>
      selectedElementIds.includes(el.id)
        ? {
            ...el,
            position: {
              ...el.position,
              y: 0,
              height: 100
            }
          }
        : el
    );
    updateCustomElements(updated);
  };

  // Layer Z-Index Reordering (Monter / Descendre - Up / Down)
  const handleMoveUp = (targetId?: string) => {
    const idsToMove = targetId ? [targetId] : selectedElementIds;
    if (idsToMove.length === 0) return;
    const updated = customElements.map(el =>
      idsToMove.includes(el.id)
        ? {
            ...el,
            position: {
              ...el.position,
              zIndex: (typeof el.position.zIndex === 'number' ? el.position.zIndex : 1) + 1
            }
          }
        : el
    );
    updateCustomElements(updated);
  };

  const handleMoveDown = (targetId?: string) => {
    const idsToMove = targetId ? [targetId] : selectedElementIds;
    if (idsToMove.length === 0) return;
    const updated = customElements.map(el =>
      idsToMove.includes(el.id)
        ? {
            ...el,
            position: {
              ...el.position,
              zIndex: Math.max(0, (typeof el.position.zIndex === 'number' ? el.position.zIndex : 1) - 1)
            }
          }
        : el
    );
    updateCustomElements(updated);
  };

  const handleBringToFront = (targetId?: string) => {
    const idsToMove = targetId ? [targetId] : selectedElementIds;
    if (idsToMove.length === 0) return;
    const maxZ = Math.max(...customElements.map(e => typeof e.position.zIndex === 'number' ? e.position.zIndex : 1), 1);
    const updated = customElements.map(el =>
      idsToMove.includes(el.id)
        ? {
            ...el,
            position: {
              ...el.position,
              zIndex: maxZ + 1
            }
          }
        : el
    );
    updateCustomElements(updated);
  };

  const handleSendToBack = (targetId?: string) => {
    const idsToMove = targetId ? [targetId] : selectedElementIds;
    if (idsToMove.length === 0) return;
    const minZ = Math.min(...customElements.map(e => typeof e.position.zIndex === 'number' ? e.position.zIndex : 1), 1);
    const targetZ = Math.max(0, minZ - 1);
    const updated = customElements.map(el =>
      idsToMove.includes(el.id)
        ? {
            ...el,
            position: {
              ...el.position,
              zIndex: targetZ
            }
          }
        : el
    );
    updateCustomElements(updated);
  };

  // Keyboard shortcuts (Undo, Redo, Delete, Select All, Duplicate)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when typing in inputs/textareas
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (targetTag === 'input' || targetTag === 'textarea' || targetTag === 'select') {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        handleSelectAll();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        handleDuplicateSelected();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        handleDeleteSelected();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history, selectedElementIds, customElements]);

  // Helpers to trigger media uploads
  const triggerImageUpload = (target: 'element' | 'background' = 'element') => {
    setMediaTarget(target);
    imageFileInputRef.current?.click();
  };

  const triggerVideoUpload = (target: 'element' | 'background' = 'element') => {
    setMediaTarget(target);
    videoFileInputRef.current?.click();
  };

  const handleApplyMediaUrl = (url: string, type: 'image' | 'video', target: 'element' | 'background') => {
    if (!url) return;
    if (target === 'background') {
      pushStyleChange({
        bgType: type,
        bgImageUrl: type === 'image' ? url : draftStyle.bgImageUrl,
        bgVideoUrl: type === 'video' ? url : draftStyle.bgVideoUrl,
        bgOpacity: draftStyle.bgOpacity !== undefined ? draftStyle.bgOpacity : 1
      });
    } else {
      handleAddElement(type, 'media', type === 'image' ? 'Image Web' : 'Vidéo Web', undefined, undefined, {}, url);
    }
    setMediaModalOpen(false);
    setMediaInputUrl('');
  };

  // Add new element to canvas with rich shapes, icons, lines, images, videos and styles
  const handleAddElement = (
    type: SlideElement['type'],
    binding: SlideElement['binding'],
    name: string,
    shapeVariant?: SlideElement['shapeVariant'],
    iconName?: SlideElement['iconName'],
    customStyle?: Partial<SlideElement['style']>,
    mediaUrl?: string
  ) => {
    const newId = `element-${Date.now()}`;

    // Default sizes and positions depending on shapeVariant / type
    let defaultWidth = 50;
    let defaultHeight = 20;
    let defaultX = 25;
    let defaultY = 35;

    if (type === 'image') {
      defaultWidth = 40;
      defaultHeight = 40;
      defaultX = 30;
      defaultY = 30;
    } else if (type === 'video') {
      defaultWidth = 60;
      defaultHeight = 40;
      defaultX = 20;
      defaultY = 30;
    } else if (shapeVariant === 'line_horizontal' || shapeVariant === 'line_dashed' || type === 'line') {
      defaultWidth = 80;
      defaultHeight = 2;
      defaultX = 10;
      defaultY = 50;
    } else if (shapeVariant === 'line_vertical') {
      defaultWidth = 2;
      defaultHeight = 40;
      defaultX = 50;
      defaultY = 30;
    } else if (shapeVariant === 'contour') {
      defaultWidth = 40;
      defaultHeight = 25;
      defaultX = 30;
      defaultY = 37;
    } else if (shapeVariant === 'circle' || type === 'circle') {
      defaultWidth = 10;
      defaultHeight = 10;
      defaultX = 45;
      defaultY = 45;
    } else if (shapeVariant === 'pill') {
      defaultWidth = 24;
      defaultHeight = 8;
      defaultX = 38;
      defaultY = 46;
    } else if (type === 'icon' || (shapeVariant && shapeVariant.startsWith('icon_'))) {
      defaultWidth = 6;
      defaultHeight = 6;
      defaultX = 8;
      defaultY = 8;
    } else if (shapeVariant === 'quote') {
      defaultWidth = 8;
      defaultHeight = 10;
      defaultX = 6;
      defaultY = 60;
    }

    const newEl: SlideElement = {
      id: newId,
      name,
      type,
      binding,
      shapeVariant,
      iconName,
      imageUrl: type === 'image' ? mediaUrl : (type === 'video' ? mediaUrl : undefined),
      videoUrl: type === 'video' ? mediaUrl : undefined,
      staticText: (type === 'text' || binding === 'static_text') && type !== 'shape' && type !== 'line' && type !== 'circle' && type !== 'icon' && type !== 'image' && type !== 'video'
        ? (shapeVariant === 'quote' ? '“' : 'Texte Personnalisé')
        : (mediaUrl || ''),
      position: { x: defaultX, y: defaultY, width: defaultWidth, height: defaultHeight, zIndex: customElements.length + 1 },
      style: {
        backgroundColor: (shapeVariant === 'contour')
          ? 'transparent'
          : (type === 'shape' || shapeVariant === 'pill' || shapeVariant === 'circle')
          ? 'rgba(10, 15, 25, 0.90)'
          : 'transparent',
        textColor: (type === 'icon' || (shapeVariant && shapeVariant.startsWith('icon_')) || type === 'line') ? '#00d2ff' : '#ffffff',
        borderColor: (shapeVariant === 'contour' || type === 'line') ? '#00d2ff' : 'transparent',
        borderWidth: (shapeVariant === 'contour' || type === 'line') ? 3 : 0,
        fontSize: shapeVariant === 'quote' ? 72 : 28,
        fontWeight: 'bold',
        textAlign: 'center',
        borderRadius: (shapeVariant === 'circle' || type === 'circle' || shapeVariant === 'pill') ? 9999 : 12,
        padding: (shapeVariant === 'contour' || type === 'icon' || type === 'line' || type === 'image' || type === 'video') ? 0 : 12,
        textShadow: true,
        objectFit: 'cover',
        ...customStyle
      }
    };

    const newList = [...customElements, newEl];
    updateCustomElements(newList);
    setSelectedElementIds([newId]);
    setActiveTab('inspector');
  };

  // Update element position directly from canvas drag
  const handleUpdateElementPosition = (
    id: string,
    newPos: { x: number; y: number; width: number; height: number },
    isFinal = false
  ) => {
    const updatedList = customElements.map(el => {
      if (el.id === id) {
        return {
          ...el,
          position: { ...el.position, ...newPos }
        };
      }
      return el;
    });

    if (isFinal) {
      pushStyleChange({
        useCustomElements: true,
        customElements: updatedList,
        mode: 'CUSTOM_CANVAS'
      });
    } else {
      setDraftStyle(prev => ({
        ...prev,
        useCustomElements: true,
        customElements: updatedList,
        mode: 'CUSTOM_CANVAS'
      }));
      setIsDirty(true);
    }
  };

  // Update multiple element positions directly from group drag
  const handleUpdateMultiplePositions = (
    updates: Array<{ id: string; pos: { x: number; y: number; width: number; height: number } }>,
    isFinal = false
  ) => {
    const updateMap = new Map(updates.map(u => [u.id, u.pos]));
    const updatedList = customElements.map(el => {
      if (updateMap.has(el.id)) {
        return {
          ...el,
          position: { ...el.position, ...updateMap.get(el.id)! }
        };
      }
      return el;
    });

    if (isFinal) {
      pushStyleChange({
        useCustomElements: true,
        customElements: updatedList,
        mode: 'CUSTOM_CANVAS'
      });
    } else {
      setDraftStyle(prev => ({
        ...prev,
        useCustomElements: true,
        customElements: updatedList,
        mode: 'CUSTOM_CANVAS'
      }));
      setIsDirty(true);
    }
  };

  // Preset definitions
  const PRESETS: Array<{ name: string; desc: string; style: Partial<ProjectionStyle> }> = [];

  return (
    <div className="fixed inset-0 bg-[#181818] z-[100] flex flex-col w-screen h-screen overflow-hidden select-none text-slate-200">
      <div className="w-full h-full flex flex-col overflow-hidden">
        
        {/* Top Header Bar Contextual to Active Module & Integrated Theme Controls */}
        <div className="h-14 bg-[#1f1f1f] border-b border-[#333333] px-4 flex items-center justify-between gap-3 flex-shrink-0">
          {/* Active Module Branding */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className={`w-8 h-8 rounded-xl ${moduleConfig.bgClass}/20 border ${moduleConfig.borderClass} flex items-center justify-center ${moduleConfig.colorClass} shadow-sm flex-shrink-0`}>
              <ModuleIcon className="w-4 h-4 stroke-[2.5]" />
            </div>

            <div className="flex items-center gap-2">
              <h1 className="text-xs sm:text-sm font-extrabold text-white tracking-wide">
                Éditeur — {moduleConfig.shortName}
              </h1>
              <span className={`hidden sm:inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${moduleConfig.badgeBg}`}>
                {moduleConfig.shortName}
              </span>
            </div>
          </div>

          {/* Integrated Simplified Theme Menu Dropdown */}
          <div className="flex items-center gap-2 flex-1 justify-center max-w-3xl">
            {/* Unified Theme Dropdown Trigger & Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsThemeMenuOpen(prev => !prev)}
                className="px-3.5 py-1.5 bg-[#282828] hover:bg-[#333333] text-white border border-[#3a3a3a] rounded-xl text-xs font-extrabold flex items-center gap-2 cursor-pointer transition shadow-md"
                title="Ouvrir la liste et la gestion des thèmes"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-slate-400 font-semibold hidden sm:inline">Thème :</span>
                <span className="text-white max-w-[150px] sm:max-w-[240px] truncate font-extrabold">
                  {themePresets.find(t => t.id === editingThemeId)?.name || 'Sélectionner un thème'}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isThemeMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Popover Dropdown Menu */}
              {isThemeMenuOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-80 bg-[#1f1f1f] border border-[#383838] rounded-2xl p-3 shadow-2xl z-50 text-slate-200">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#333333]">
                    <span className="text-[11px] font-extrabold text-white flex items-center gap-1.5 uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      Thèmes ({moduleConfig.shortName})
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsThemeMenuOpen(false)}
                      className="text-slate-400 hover:text-white text-xs font-bold p-1 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Create New Theme Button */}
                  <button
                    type="button"
                    onClick={() => {
                      handleCreateNewTheme();
                    }}
                    className={`w-full py-2 px-3 mb-2.5 ${moduleConfig.bgClass}/20 hover:${moduleConfig.bgClass}/30 ${moduleConfig.colorClass} border ${moduleConfig.borderClass} rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-sm`}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Nouveau Thème ({moduleConfig.shortName})</span>
                  </button>

                  {/* Theme Items List */}
                  <div className="max-h-64 overflow-y-auto space-y-1.5 pr-0.5 no-scrollbar">
                    {availableModuleThemes.length === 0 ? (
                      <div className="text-center py-4 text-xs text-slate-500 font-semibold">
                        Aucun thème disponible pour ce module
                      </div>
                    ) : (
                      availableModuleThemes.map((t) => {
                        const isSelected = t.id === editingThemeId;
                        return (
                          <div
                            key={t.id}
                            onClick={() => {
                              setEditingThemeId(t.id);
                            }}
                            className={`group flex items-center justify-between p-2 rounded-xl border transition cursor-pointer ${
                              isSelected
                                ? 'bg-blue-600/20 border-blue-500/60 text-white shadow-sm'
                                : 'bg-[#262626] border-[#333333] hover:bg-[#303030] text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isSelected ? 'bg-blue-400 shadow-sm' : 'bg-slate-600'}`} />
                              
                              {/* Editable Theme Name Input */}
                              <input
                                type="text"
                                value={t.name}
                                onChange={(e) => handleRenameTheme(t.id, e.target.value)}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingThemeId(t.id);
                                }}
                                className={`bg-transparent font-extrabold text-xs outline-none w-full truncate border-b border-transparent focus:border-blue-400 transition ${
                                  isSelected ? 'text-white font-black' : 'text-slate-200'
                                }`}
                                placeholder="Nom du thème..."
                                title="Cliquer pour modifier le nom"
                              />
                            </div>

                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {isSelected && (
                                <span className="text-[9px] font-black bg-blue-500/30 text-blue-300 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                                  Actif
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTheme(t.id);
                                }}
                                className="p-1 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg transition cursor-pointer"
                                title="Supprimer ce thème"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Screen Assignment Badges */}
            <div className="hidden xl:flex items-center gap-1 pl-2 border-l border-[#333333]">
              {screenConfigs.map((sc) => {
                const currentModuleKey = (activeModule || 'brochures') as 'brochures' | 'lyrics' | 'bible';
                const assignedThemeId = sc.moduleThemes?.[currentModuleKey] || '';
                const isAssigned = Boolean(editingThemeId && assignedThemeId === editingThemeId);
                return (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => handleAssignModuleTheme(sc.id, currentModuleKey, isAssigned ? '' : editingThemeId)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-extrabold border transition flex items-center gap-1 cursor-pointer ${
                      isAssigned
                        ? `${moduleConfig.bgClass} text-white border-transparent shadow-md`
                        : 'bg-[#252525] text-slate-400 border-[#383838] hover:text-white hover:bg-[#303030]'
                    }`}
                    title={isAssigned ? `Désaffecter de ${sc.name}` : `Attribuer ce thème à ${sc.name}`}
                  >
                    <Tv className="w-3 h-3" />
                    <span>{sc.name}</span>
                    {isAssigned && <CheckCircle2 className="w-3 h-3 text-white ml-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Close Action & Animation Modal Trigger */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => setShowAnimationModal(true)}
              className="px-3 py-1.5 bg-[#00d2ff]/10 hover:bg-[#00d2ff]/20 text-[#00d2ff] border border-[#00d2ff]/30 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-sm"
              title="Configurer les animations d'entrée et de sortie des éléments"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#00d2ff]" />
              <span className="hidden md:inline">Animations</span>
            </button>
            <button
              type="button"
              onClick={() => handleSaveAndApply(true)}
              className="p-2 bg-[#282828] hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 rounded-xl border border-[#383838] transition cursor-pointer flex items-center justify-center"
              title="Fermer l'éditeur"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Prompt for Creating New Screen */}
        {isAddingScreen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[120] flex items-center justify-center p-4">
            <div className="bg-[#121620] border border-white/20 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Tv className="w-4 h-4 text-[#00d2ff]" />
                  <span>Ajouter un Nouvel Écran de Sortie</span>
                </h3>
                <button onClick={() => setIsAddingScreen(false)} className="p-1 text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Nom de l'Écran (Ex: Second Écran Salle, Studio Stream OBS)
                  </label>
                  <input
                    type="text"
                    value={newScreenName}
                    onChange={(e) => setNewScreenName(e.target.value)}
                    placeholder="Ex: Écran Annexe Salle"
                    className="w-full bg-[#1a2130] text-white border border-white/10 px-3 py-2 rounded-lg font-semibold outline-none focus:border-[#00d2ff]"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Type / Fonction de Sortie
                  </label>
                  <select
                    value={newScreenOutputType}
                    onChange={(e) => setNewScreenOutputType(e.target.value)}
                    className="w-full bg-[#1a2130] text-white border border-white/10 px-3 py-2 rounded-lg font-semibold outline-none cursor-pointer focus:border-[#00d2ff]"
                  >
                    <option value="hdmi">Sortie Second Écran HDMI</option>
                    <option value="stage">Écran Stage / Teleprompter</option>
                    <option value="custom">Écran Personnalisé (URL)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Disposition Initiale
                  </label>
                  <select
                    value={newScreenMode}
                    onChange={(e) => setNewScreenMode(e.target.value as any)}
                    className="w-full bg-[#1a2130] text-white border border-white/10 px-3 py-2 rounded-lg font-semibold outline-none cursor-pointer focus:border-[#00d2ff]"
                  >
                    <option value="CENTER_CARD">Carte Centrée Moderne</option>
                    <option value="FULLSCREEN">Plein Écran HD</option>
                    <option value="LOWER_THIRD">Lower Third (Incrustation Transparente)</option>
                    <option value="TOP_BANNER">Bandeau Haut Prompteur</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  onClick={() => setIsAddingScreen(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    if (!newScreenName.trim()) return;
                    const id = newScreenName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
                    onAddScreen && onAddScreen(id, newScreenName.trim(), newScreenMode, newScreenOutputType);
                    setIsAddingScreen(false);
                    setNewScreenName('');
                  }}
                  className="px-4 py-2 bg-[#00d2ff] hover:bg-[#00b8e6] text-black font-extrabold rounded-lg text-xs shadow cursor-pointer"
                >
                  Créer l'Écran
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Prompt for Editing Screen */}
        {editingScreenConfig && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[120] flex items-center justify-center p-4">
            <div className="bg-[#121620] border border-white/20 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-[#00d2ff]" />
                  <span>Éditer l'Écran de Sortie</span>
                </h3>
                <button onClick={() => setEditingScreenConfig(null)} className="p-1 text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Nom de l'Écran
                  </label>
                  <input
                    type="text"
                    value={editScreenName}
                    onChange={(e) => setEditScreenName(e.target.value)}
                    placeholder="Ex: Écran Audience (HDMI)"
                    className="w-full bg-[#1a2130] text-white border border-white/10 px-3 py-2 rounded-lg font-semibold outline-none focus:border-[#00d2ff]"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Type / Fonction de Sortie
                  </label>
                  <select
                    value={editScreenOutputType}
                    onChange={(e) => setEditScreenOutputType(e.target.value)}
                    className="w-full bg-[#1a2130] text-white border border-white/10 px-3 py-2 rounded-lg font-semibold outline-none cursor-pointer focus:border-[#00d2ff]"
                  >
                    <option value="hdmi">Sortie Second Écran HDMI</option>
                    <option value="stage">Écran Stage / Teleprompter</option>
                    <option value="custom">Écran Personnalisé (URL Distante)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Supprimer l'écran "${editingScreenConfig.name}" ?`)) {
                      if (onDeleteScreen) onDeleteScreen(editingScreenConfig.id);
                      const updated = screenConfigs.filter(s => s.id !== editingScreenConfig.id);
                      setScreenConfigs(updated);
                      if (onUpdateScreensAndThemes) {
                        onUpdateScreensAndThemes(updated, themePresets);
                      }
                      setEditingScreenConfig(null);
                    }
                  }}
                  className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Supprimer</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingScreenConfig(null)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!editScreenName.trim()) return;
                      const cleanName = editScreenName.trim();
                      const updated = screenConfigs.map(s => {
                        if (s.id === editingScreenConfig.id) {
                          return {
                            ...s,
                            name: cleanName,
                            outputType: editScreenOutputType
                          };
                        }
                        return s;
                      });
                      setScreenConfigs(updated);
                      if (onUpdateScreensAndThemes) {
                        onUpdateScreensAndThemes(updated, themePresets);
                      }
                      setEditingScreenConfig(null);
                    }}
                    className="px-4 py-2 bg-[#00d2ff] hover:bg-[#00b8e6] text-black font-extrabold rounded-lg text-xs shadow cursor-pointer"
                  >
                    Enregistrer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Workspace split into Canvas Preview (Left) and Inspector Controls (Right) */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* LEFT: 16:9 CANVAS VIEWPORT & INTEGRATED PHOTOSHOP-STYLE VERTICAL TOOLBAR */}
          <div className="flex-1 bg-[#121212] p-3 flex flex-row overflow-hidden border-r border-[#333333] relative gap-3">
            
            {/* Simplified Vertical Creation Toolbar Docked Left */}
            <div className="w-28 sm:w-32 bg-[#202020] border border-[#333333] rounded-xl p-2 flex flex-col items-center gap-1.5 select-none flex-shrink-0 shadow-lg relative z-40">
              {/* Header Badge */}
              <div className="w-full py-1 bg-[#282828] rounded-lg flex items-center justify-center text-[10px] font-bold text-slate-300 uppercase tracking-wider border border-[#383838]" title="Outils de Création Éléments Canvas">
                <Plus className="w-3 h-3 mr-1 text-blue-400" />
                <span>Outils</span>
              </div>

              <div className="w-full flex flex-col gap-1.5 mt-1">
                {/* 1. TEXTE TOOL */}
                <div className="relative">
                  <div className="flex items-center gap-0.5 w-full bg-[#262626] hover:bg-[#303030] border border-[#383838] rounded-lg p-1 transition">
                    <button
                      onClick={() => {
                        handleAddElement('text', 'sermon_text', 'Zone Texte Sermon');
                        setActiveToolMenu(null);
                      }}
                      className="flex-1 flex items-center gap-1.5 text-left cursor-pointer py-1 px-1"
                      title="Ajouter du Texte Sermon (Clic rapide)"
                    >
                      <Type className="w-4 h-4 text-blue-400 shrink-0" />
                      <span className="text-[10px] font-bold text-slate-200">Texte</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveToolMenu(activeToolMenu === 'text' ? null : 'text');
                      }}
                      className={`p-1 rounded hover:bg-[#3d3d3d] transition cursor-pointer text-slate-400 hover:text-white ${activeToolMenu === 'text' ? 'bg-[#3d3d3d] text-blue-400' : ''}`}
                      title="Variantes Texte"
                    >
                      <ChevronRight className={`w-3.5 h-3.5 transition-transform ${activeToolMenu === 'text' ? 'rotate-90 text-blue-400' : ''}`} />
                    </button>
                  </div>

                  {/* Popover Flyout for Texte */}
                  {activeToolMenu === 'text' && (
                    <div className="absolute left-full ml-2 top-0 w-52 bg-[#1a1a1a]/95 backdrop-blur-md border border-[#3d3d3d] rounded-xl p-1.5 shadow-2xl z-50 flex flex-col gap-1 animate-in fade-in duration-150">
                      <div className="text-[9px] font-bold text-blue-400 uppercase tracking-wider px-2 py-1 border-b border-[#2d2d2d] flex items-center justify-between">
                        <span>Type de Texte</span>
                        <X className="w-3 h-3 cursor-pointer text-slate-400 hover:text-white" onClick={() => setActiveToolMenu(null)} />
                      </div>
                      {/* 1er : Texte Sermon (Par défaut) */}
                      <button
                        onClick={() => {
                          handleAddElement('text', 'sermon_text', 'Zone Texte Sermon');
                          setActiveToolMenu(null);
                        }}
                        className="flex items-center gap-2 p-1.5 hover:bg-[#282828] rounded-lg text-left transition text-slate-200 hover:text-white cursor-pointer"
                      >
                        <Type className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <div>
                          <div className="text-[10px] font-bold">Texte Sermon</div>
                          <div className="text-[8px] text-slate-400">Paragraphe dynamique du message</div>
                        </div>
                      </button>
                      {/* 2ème : Titre & Référence */}
                      <button
                        onClick={() => {
                          handleAddElement('text', 'sermon_header', 'Titre Sermon & Référence');
                          setActiveToolMenu(null);
                        }}
                        className="flex items-center gap-2 p-1.5 hover:bg-[#282828] rounded-lg text-left transition text-slate-200 hover:text-white cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <div>
                          <div className="text-[10px] font-bold">Titre & Référence</div>
                          <div className="text-[8px] text-slate-400">Titre avec § ou Page (ex: Titre — § 142)</div>
                        </div>
                      </button>
                      {/* 3ème : Texte Statique Libre */}
                      <button
                        onClick={() => {
                          handleAddElement('text', 'static_text', 'Texte Statique Libre');
                          setActiveToolMenu(null);
                        }}
                        className="flex items-center gap-2 p-1.5 hover:bg-[#282828] rounded-lg text-left transition text-slate-200 hover:text-white cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <div>
                          <div className="text-[10px] font-bold">Texte Libre</div>
                          <div className="text-[8px] text-slate-400">Texte statique personnalisable</div>
                        </div>
                      </button>
                      {/* 4ème : Badge Paragraphe */}
                      <button
                        onClick={() => {
                          handleAddElement('badge', 'sermon_reference', 'Badge Paragraphe');
                          setActiveToolMenu(null);
                        }}
                        className="flex items-center gap-2 p-1.5 hover:bg-[#282828] rounded-lg text-left transition text-slate-200 hover:text-white cursor-pointer"
                      >
                        <Bookmark className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <div>
                          <div className="text-[10px] font-bold">Badge Paragraphe (§)</div>
                          <div className="text-[8px] text-slate-400">Pastille seule de numéro (§ 142)</div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>

                {/* 2. FORME TOOL */}
                <div className="relative">
                  <div className="flex items-center gap-0.5 w-full bg-[#262626] hover:bg-[#303030] border border-[#383838] rounded-lg p-1 transition">
                    <button
                      onClick={() => {
                        handleAddElement('shape', 'static_text', 'Boîte de Fond', 'rectangle');
                        setActiveToolMenu(null);
                      }}
                      className="flex-1 flex items-center gap-1.5 text-left cursor-pointer py-1 px-1"
                      title="Ajouter une Forme (Cadre)"
                    >
                      <Square className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="text-[10px] font-bold text-slate-200">Formes</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveToolMenu(activeToolMenu === 'shape' ? null : 'shape');
                      }}
                      className={`p-1 rounded hover:bg-[#3d3d3d] transition cursor-pointer text-slate-400 hover:text-white ${activeToolMenu === 'shape' ? 'bg-[#3d3d3d] text-emerald-400' : ''}`}
                      title="Variantes Formes & Lignes"
                    >
                      <ChevronRight className={`w-3.5 h-3.5 transition-transform ${activeToolMenu === 'shape' ? 'rotate-90 text-emerald-400' : ''}`} />
                    </button>
                  </div>

                  {/* Popover Flyout for Formes */}
                  {activeToolMenu === 'shape' && (
                    <div className="absolute left-full ml-2 top-0 w-52 bg-[#1a1a1a]/95 backdrop-blur-md border border-[#3d3d3d] rounded-xl p-1.5 shadow-2xl z-50 flex flex-col gap-1 animate-in fade-in duration-150">
                      <div className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider px-2 py-1 border-b border-[#2d2d2d] flex items-center justify-between">
                        <span>Formes & Lignes</span>
                        <X className="w-3 h-3 cursor-pointer text-slate-400 hover:text-white" onClick={() => setActiveToolMenu(null)} />
                      </div>

                      {/* Lignes d'abord */}
                      <button
                        onClick={() => {
                          handleAddElement('line', 'static_text', 'Ligne Horizontale', 'line_horizontal', undefined, { borderWidth: 3, textColor: '#3b82f6', borderColor: '#3b82f6' });
                          setActiveToolMenu(null);
                        }}
                        className="flex items-center gap-2 p-1.5 hover:bg-[#282828] rounded-lg text-left transition text-slate-200 hover:text-white cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <div>
                          <div className="text-[10px] font-bold">Ligne Horizontale</div>
                          <div className="text-[8px] text-slate-400">Séparateur horizontal H</div>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          handleAddElement('line', 'static_text', 'Séparateur Vertical', 'line_vertical', undefined, { borderWidth: 3, textColor: '#3b82f6', borderColor: '#3b82f6' });
                          setActiveToolMenu(null);
                        }}
                        className="flex items-center gap-2 p-1.5 hover:bg-[#282828] rounded-lg text-left transition text-slate-200 hover:text-white cursor-pointer"
                      >
                        <div className="w-1 h-3.5 bg-cyan-400 rounded-full shrink-0" />
                        <div>
                          <div className="text-[10px] font-bold">Ligne Verticale</div>
                          <div className="text-[8px] text-slate-400">Séparateur vertical V</div>
                        </div>
                      </button>

                      <div className="border-t border-[#2a2a2a] my-0.5" />

                      {/* Cadre simple boîte de fond */}
                      <button
                        onClick={() => {
                          handleAddElement('shape', 'static_text', 'Cadre (Boîte de fond)', 'rectangle');
                          setActiveToolMenu(null);
                        }}
                        className="flex items-center gap-2 p-1.5 hover:bg-[#282828] rounded-lg text-left transition text-slate-200 hover:text-white cursor-pointer"
                      >
                        <Square className="w-3.5 h-3.5 text-emerald-400 shrink-0 fill-emerald-500/20" />
                        <div>
                          <div className="text-[10px] font-bold">Cadre (Boîte de fond)</div>
                          <div className="text-[8px] text-slate-400">Boîte simple avec fond</div>
                        </div>
                      </button>

                      {/* Contour cadre sans fond */}
                      <button
                        onClick={() => {
                          handleAddElement('shape', 'static_text', 'Contour', 'contour');
                          setActiveToolMenu(null);
                        }}
                        className="flex items-center gap-2 p-1.5 hover:bg-[#282828] rounded-lg text-left transition text-slate-200 hover:text-white cursor-pointer"
                      >
                        <BoxSelect className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <div>
                          <div className="text-[10px] font-bold">Contour (Tracé sans fond)</div>
                          <div className="text-[8px] text-slate-400">Contour seul (suis les dégradés)</div>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          handleAddElement('shape', 'static_text', 'Pilule Capsule', 'pill');
                          setActiveToolMenu(null);
                        }}
                        className="flex items-center gap-2 p-1.5 hover:bg-[#282828] rounded-lg text-left transition text-slate-200 hover:text-white cursor-pointer"
                      >
                        <div className="w-3.5 h-2 rounded-full bg-emerald-400 shrink-0" />
                        <div>
                          <div className="text-[10px] font-bold">Capsule Pilule</div>
                          <div className="text-[8px] text-slate-400">Bords fortement arrondis</div>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          handleAddElement('circle', 'static_text', 'Disque Cercle', 'circle');
                          setActiveToolMenu(null);
                        }}
                        className="flex items-center gap-2 p-1.5 hover:bg-[#282828] rounded-lg text-left transition text-slate-200 hover:text-white cursor-pointer"
                      >
                        <Circle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <div>
                          <div className="text-[10px] font-bold">Disque Cercle</div>
                          <div className="text-[8px] text-slate-400">Cercle parfait</div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>

                {/* 4. ICÔNE TOOL */}
                <div className="relative">
                  <div className="flex items-center gap-0.5 w-full bg-[#262626] hover:bg-[#303030] border border-[#383838] rounded-lg p-1 transition">
                    <button
                      onClick={() => {
                        handleAddElement('icon', 'icon', 'Symbole Croix', 'icon_cross', 'cross');
                        setActiveToolMenu(null);
                      }}
                      className="flex-1 flex items-center gap-1.5 text-left cursor-pointer py-1 px-1"
                      title="Ajouter une Icône"
                    >
                      <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="text-[10px] font-bold text-slate-200">Icônes</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveToolMenu(activeToolMenu === 'icon' ? null : 'icon');
                      }}
                      className={`p-1 rounded hover:bg-[#3d3d3d] transition cursor-pointer text-slate-400 hover:text-white ${activeToolMenu === 'icon' ? 'bg-[#3d3d3d] text-amber-400' : ''}`}
                      title="Variantes Icône"
                    >
                      <ChevronRight className={`w-3.5 h-3.5 transition-transform ${activeToolMenu === 'icon' ? 'rotate-90 text-amber-400' : ''}`} />
                    </button>
                  </div>

                  {/* Popover Flyout for Icônes */}
                  {activeToolMenu === 'icon' && (
                    <div className="absolute left-full ml-2 top-0 w-48 bg-[#1a1a1a]/95 backdrop-blur-md border border-[#3d3d3d] rounded-xl p-1.5 shadow-2xl z-50 flex flex-col gap-1 animate-in fade-in duration-150">
                      <div className="text-[9px] font-bold text-amber-400 uppercase tracking-wider px-2 py-1 border-b border-[#2d2d2d] flex items-center justify-between">
                        <span>Symboles & Icônes</span>
                        <X className="w-3 h-3 cursor-pointer text-slate-400 hover:text-white" onClick={() => setActiveToolMenu(null)} />
                      </div>
                      <button
                        onClick={() => {
                          handleAddElement('icon', 'icon', 'Symbole Croix', 'icon_cross', 'cross');
                          setActiveToolMenu(null);
                        }}
                        className="flex items-center gap-2 p-1.5 hover:bg-[#282828] rounded-lg text-left transition text-slate-200 hover:text-white cursor-pointer"
                      >
                        <div className="w-3.5 h-3.5 text-amber-400 flex items-center justify-center font-bold text-xs leading-none shrink-0">†</div>
                        <div>
                          <div className="text-[10px] font-bold">Croix Sacrée</div>
                          <div className="text-[8px] text-slate-400">Symbole de croix</div>
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          handleAddElement('icon', 'icon', 'Symbole Église', 'icon_church', 'church');
                          setActiveToolMenu(null);
                        }}
                        className="flex items-center gap-2 p-1.5 hover:bg-[#282828] rounded-lg text-left transition text-slate-200 hover:text-white cursor-pointer"
                      >
                        <Church className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <div>
                          <div className="text-[10px] font-bold">Édifice Église</div>
                          <div className="text-[8px] text-slate-400">Icône église</div>
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          handleAddElement('icon', 'icon', 'Icône Micro', 'icon_mic', 'mic');
                          setActiveToolMenu(null);
                        }}
                        className="flex items-center gap-2 p-1.5 hover:bg-[#282828] rounded-lg text-left transition text-slate-200 hover:text-white cursor-pointer"
                      >
                        <Mic className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <div>
                          <div className="text-[10px] font-bold">Micro Prédicateur</div>
                          <div className="text-[8px] text-slate-400">Icône microphone</div>
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          handleAddElement('icon', 'icon', 'Icône Direct TV', 'icon_tv', 'tv');
                          setActiveToolMenu(null);
                        }}
                        className="flex items-center gap-2 p-1.5 hover:bg-[#282828] rounded-lg text-left transition text-slate-200 hover:text-white cursor-pointer"
                      >
                        <Tv className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <div>
                          <div className="text-[10px] font-bold">Direct / Régie</div>
                          <div className="text-[8px] text-slate-400">Icône écran TV</div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>

                {/* 5. MEDIA / FOND TOOL */}
                <div className="relative">
                  <div className="flex items-center gap-0.5 w-full bg-[#262626] hover:bg-[#303030] border border-[#383838] rounded-lg p-1 transition">
                    <button
                      onClick={() => {
                        setMediaTarget('background');
                        setMediaModalOpen(true);
                        setActiveToolMenu(null);
                      }}
                      className="flex-1 flex items-center gap-1.5 text-left cursor-pointer py-1 px-1"
                      title="Média Fond (Image / Vidéo)"
                    >
                      <Film className="w-4 h-4 text-purple-400 shrink-0" />
                      <span className="text-[10px] font-bold text-slate-200">Média</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveToolMenu(activeToolMenu === 'media' ? null : 'media');
                      }}
                      className={`p-1 rounded hover:bg-[#3d3d3d] transition cursor-pointer text-slate-400 hover:text-white ${activeToolMenu === 'media' ? 'bg-[#3d3d3d] text-purple-400' : ''}`}
                      title="Options Média Fond"
                    >
                      <ChevronRight className={`w-3.5 h-3.5 transition-transform ${activeToolMenu === 'media' ? 'rotate-90 text-purple-400' : ''}`} />
                    </button>
                  </div>

                  {/* Popover Flyout for Media */}
                  {activeToolMenu === 'media' && (
                    <div className="absolute left-full ml-2 top-0 w-48 bg-[#1a1a1a]/95 backdrop-blur-md border border-[#3d3d3d] rounded-xl p-1.5 shadow-2xl z-50 flex flex-col gap-1 animate-in fade-in duration-150">
                      <div className="text-[9px] font-bold text-purple-400 uppercase tracking-wider px-2 py-1 border-b border-[#2d2d2d] flex items-center justify-between">
                        <span>Média & Fond Scène</span>
                        <X className="w-3 h-3 cursor-pointer text-slate-400 hover:text-white" onClick={() => setActiveToolMenu(null)} />
                      </div>
                      <button
                        onClick={() => {
                          triggerImageUpload('background');
                          setActiveToolMenu(null);
                        }}
                        className="flex items-center gap-2 p-1.5 hover:bg-[#282828] rounded-lg text-left transition text-slate-200 hover:text-white cursor-pointer"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <div>
                          <div className="text-[10px] font-bold">Image Fond</div>
                          <div className="text-[8px] text-slate-400">Importer image (.png, .jpg)</div>
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          triggerVideoUpload('background');
                          setActiveToolMenu(null);
                        }}
                        className="flex items-center gap-2 p-1.5 hover:bg-[#282828] rounded-lg text-left transition text-slate-200 hover:text-white cursor-pointer"
                      >
                        <Video className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <div>
                          <div className="text-[10px] font-bold">Vidéo Fond</div>
                          <div className="text-[8px] text-slate-400">Importer vidéo (.mp4)</div>
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          setMediaModalType('url');
                          setMediaTarget('background');
                          setMediaModalOpen(true);
                          setActiveToolMenu(null);
                        }}
                        className="flex items-center gap-2 p-1.5 hover:bg-[#282828] rounded-lg text-left transition text-slate-200 hover:text-white cursor-pointer"
                      >
                        <Globe className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <div>
                          <div className="text-[10px] font-bold">URL Web Média</div>
                          <div className="text-[8px] text-slate-400">Lien web image ou vidéo</div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Clear Tool at bottom if elements exist */}
              {customElements.length > 0 && (
                <div className="w-full mt-auto pt-2 border-t border-[#333333]">
                  <button
                    onClick={() => {
                      if (window.confirm('Voulez-vous réinitialiser tous les éléments personnalisés sur ce thème ?')) {
                        updateCustomElements([]);
                        setSelectedElementIds([]);
                      }
                    }}
                    className="w-full py-1 px-1.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 rounded-lg text-rose-300 hover:text-rose-100 text-[9px] font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                    title="Vider tous les éléments du canvas"
                  >
                    <Trash2 className="w-3 h-3 shrink-0" />
                    <span>Vider ({customElements.length})</span>
                  </button>
                </div>
              )}
            </div>

            {/* Right Main Stage Viewport Area */}
            <div className="flex-1 flex flex-col justify-between overflow-hidden">
              {/* 16:9 Stage Container with Zoom & Pan */}
              <div 
                className="flex-1 flex items-center justify-center p-2 relative overflow-auto custom-scrollbar"
                onWheel={(e) => {
                  if (e.ctrlKey || e.metaKey || e.altKey) {
                    e.preventDefault();
                    const delta = e.deltaY < 0 ? 0.1 : -0.1;
                    setZoomScale(prev => Math.min(2.5, Math.max(0.5, Math.round((prev + delta) * 100) / 100)));
                  }
                }}
              >
                {/* Floating Interactive Zoom Toolbar Overlay */}
                <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5 bg-[#222222]/90 backdrop-blur-md border border-[#383838] rounded-xl p-1.5 shadow-xl select-none">
                  {/* Quick Undo & Redo */}
                  <div className="flex items-center gap-0.5 border-r border-[#383838] pr-1.5">
                    <button
                      onClick={handleUndo}
                      disabled={historyIndex <= 0}
                      className="p-1.5 hover:bg-[#333333] rounded-lg text-slate-300 hover:text-white disabled:opacity-20 disabled:hover:bg-transparent transition cursor-pointer"
                      title="Annuler (Ctrl+Z)"
                    >
                      <Undo2 className="w-3.5 h-3.5 text-blue-400" />
                    </button>
                    <button
                      onClick={handleRedo}
                      disabled={historyIndex >= history.length - 1}
                      className="p-1.5 hover:bg-[#333333] rounded-lg text-slate-300 hover:text-white disabled:opacity-20 disabled:hover:bg-transparent transition cursor-pointer"
                      title="Rétablir (Ctrl+Y)"
                    >
                      <Redo2 className="w-3.5 h-3.5 text-blue-400" />
                    </button>
                  </div>

                  <button
                    onClick={() => setZoomScale(prev => Math.max(0.5, Math.round((prev - 0.15) * 100) / 100))}
                    className="p-1.5 hover:bg-[#333333] rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
                    title="Dézoomer (-15%)"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setZoomScale(1)}
                    className="px-2 py-0.5 rounded-md hover:bg-[#333333] text-[11px] font-extrabold text-blue-400 transition cursor-pointer"
                    title="Réinitialiser le Zoom à 100%"
                  >
                    {Math.round(zoomScale * 100)}%
                  </button>

                  <button
                    onClick={() => setZoomScale(prev => Math.min(2.5, Math.round((prev + 0.15) * 100) / 100))}
                    className="p-1.5 hover:bg-[#333333] rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
                    title="Zoomer (+15%)"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>

                  <div className="w-[1px] h-3.5 bg-[#383838] my-auto" />

                  {/* Zoom Presets */}
                  <button
                    onClick={() => setZoomScale(0.75)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                      zoomScale === 0.75 ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    75%
                  </button>
                  <button
                    onClick={() => setZoomScale(1)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                      zoomScale === 1 ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    100%
                  </button>
                  <button
                    onClick={() => setZoomScale(1.5)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                      zoomScale === 1.5 ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    150%
                  </button>
                  <button
                    onClick={() => setZoomScale(2)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                      zoomScale === 2 ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    200%
                  </button>
                </div>

                {/* Scaled Canvas Stage Box */}
                <div
                  style={{
                    transform: `scale(${zoomScale})`,
                    transformOrigin: 'center center',
                    transition: 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                  onClick={(e) => {
                    if (e.target === e.currentTarget) {
                      setSelectedElementIds([]);
                    }
                  }}
                  className={`w-full max-w-4xl aspect-video rounded-xl overflow-hidden border border-[#383838] shadow-2xl relative transition-all ${
                    canvasBgMode === 'video'
                      ? 'bg-[#181818]'
                      : canvasBgMode === 'grid'
                      ? 'bg-[#121212] bg-[radial-gradient(#282828_1px,transparent_1px)] [background-size:16px_16px]'
                      : canvasBgMode === 'chroma'
                      ? 'bg-[#00ff00]'
                      : 'bg-black'
                  }`}
                >
                  {/* Background Video Simulation Visual overlay if mode = video */}
                  {canvasBgMode === 'video' && (
                    <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/20 via-sky-500/10 to-transparent flex items-center justify-center text-white/10 font-bold text-3xl">
                      [ FLUX VIDÉO DIRECT ]
                    </div>
                  )}

                  {/* The Projection Canvas with multi-element selection */}
                  <ProjectionCanvas
                    data={currentData}
                    style={{
                      ...draftStyle,
                      useCustomElements: draftStyle.useCustomElements || editorMode === 'visual_canvas',
                      customElements: customElements
                    }}
                    isPreview={true}
                    canvasBgMode={canvasBgMode}
                    canvasCustomBgColor={canvasSimColor}
                    selectedElementId={selectedElementId}
                    selectedElementIds={selectedElementIds}
                    onSelectElement={(id, isMulti) => {
                      handleSelectElement(id, isMulti);
                      if (id) setActiveTab('inspector');
                    }}
                    onUpdateElementPosition={handleUpdateElementPosition}
                    onUpdateMultiplePositions={handleUpdateMultiplePositions}
                  />
                </div>
              </div>

              {/* Bottom Action & Alignment Bar */}
              <div className="bg-[#202020] border border-[#333333] rounded-xl px-3 py-2 flex items-center justify-between gap-2 flex-wrap mt-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
                    <span>Zone de Montage Canvas</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium truncate ml-2 border-l border-[#333333] pl-2">
                    {selectedElementIds.length > 1
                      ? `${selectedElementIds.length} éléments sélectionnés`
                      : selectedElement
                      ? `Sélection : ${selectedElement.name}`
                      : 'Cliquez sur un élément sur l\'écran pour le déplacer'}
                  </span>
                </div>

                {/* Right: Alignments, Zoom & Canvas Bg Toggle */}
                <div className="flex items-center gap-2 ml-auto flex-wrap">
                  {/* Quick Zoom Bar in Bottom Strip */}
                  <div className="flex items-center gap-1 bg-[#181818] px-1.5 py-1 rounded-lg border border-[#333333] text-slate-300">
                    <button
                      onClick={() => setZoomScale(prev => Math.max(0.5, Math.round((prev - 0.15) * 100) / 100))}
                      className="p-1 hover:bg-[#282828] rounded text-slate-300 hover:text-white cursor-pointer"
                      title="Dézoomer"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[10px] font-extrabold text-blue-400 w-10 text-center">
                      {Math.round(zoomScale * 100)}%
                    </span>
                    <button
                      onClick={() => setZoomScale(prev => Math.min(2.5, Math.round((prev + 0.15) * 100) / 100))}
                      className="p-1 hover:bg-[#282828] rounded text-slate-300 hover:text-white cursor-pointer"
                      title="Zoomer"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {/* Group Alignments */}
                  <div className="flex items-center gap-1 bg-[#181818] p-1 rounded-lg border border-[#333333]">
                    <button
                      onClick={handleAlignLeft}
                      disabled={selectedElementIds.length < 2}
                      className="p-1 hover:bg-[#282828] rounded text-slate-300 disabled:opacity-20 cursor-pointer"
                      title="Aligner à gauche"
                    >
                      <AlignLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleAlignCenterH}
                      disabled={selectedElementIds.length < 2}
                      className="p-1 hover:bg-[#282828] rounded text-slate-300 disabled:opacity-20 cursor-pointer"
                      title="Centrer horizontalement"
                    >
                      <AlignHorizontalJustifyCenter className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleAlignRight}
                      disabled={selectedElementIds.length < 2}
                      className="p-1 hover:bg-[#282828] rounded text-slate-300 disabled:opacity-20 cursor-pointer"
                      title="Aligner à droite"
                    >
                      <AlignRight className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-[1px] h-3.5 bg-[#333333] my-auto" />
                    <button
                      onClick={handleCenterOnCanvas}
                      disabled={selectedElementIds.length === 0}
                      className="p-1 hover:bg-[#282828] rounded text-sky-400 disabled:opacity-20 cursor-pointer flex items-center gap-1"
                      title="Centrer le calque sur le canvas"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold hidden sm:inline">Centrer</span>
                    </button>
                    <div className="w-[1px] h-3.5 bg-[#333333] my-auto" />
                    <button
                      onClick={() => handleMoveUp()}
                      disabled={selectedElementIds.length === 0}
                      className="p-1 hover:bg-[#282828] rounded text-emerald-400 disabled:opacity-20 cursor-pointer flex items-center gap-0.5"
                      title="Avancer Calque / Monter (Up)"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold hidden sm:inline">Monter (Up)</span>
                    </button>
                    <button
                      onClick={() => handleMoveDown()}
                      disabled={selectedElementIds.length === 0}
                      className="p-1 hover:bg-[#282828] rounded text-emerald-400 disabled:opacity-20 cursor-pointer flex items-center gap-0.5"
                      title="Reculer Calque / Descendre (Down)"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold hidden sm:inline">Descendre (Down)</span>
                    </button>
                    <div className="w-[1px] h-3.5 bg-[#333333] my-auto" />
                    <button
                      onClick={handleDuplicateSelected}
                      disabled={selectedElementIds.length === 0}
                      className="p-1 hover:bg-[#282828] rounded text-indigo-400 disabled:opacity-20 cursor-pointer"
                      title="Dupliquer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleDeleteSelected}
                      disabled={selectedElementIds.length === 0}
                      className="p-1 hover:bg-[#282828] rounded text-rose-400 disabled:opacity-20 cursor-pointer"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Simulation Background Selector */}
                  <div className="relative flex items-center gap-1 bg-[#181818] p-1 rounded-lg border border-[#333333]">
                    <button
                      type="button"
                      onClick={() => {
                        setCanvasBgMode('video');
                        setIsColorPaletteOpen(false);
                      }}
                      className={`px-2.5 py-1 rounded text-[10px] font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        canvasBgMode === 'video' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-[#282828]'
                      }`}
                      title="Simuler un Fond Vidéo Direct"
                    >
                      <Video className="w-3 h-3" />
                      <span>Vidéo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCanvasBgMode('grid');
                        setIsColorPaletteOpen(false);
                      }}
                      className={`px-2.5 py-1 rounded text-[10px] font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        canvasBgMode === 'grid' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-[#282828]'
                      }`}
                      title="Afficher la Grille d'Alignement & Repères TV"
                    >
                      <Grid className="w-3 h-3 text-cyan-300" />
                      <span>Grille Repères</span>
                    </button>

                    {/* Couleur Simulation Button & Palette Popover */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          if (canvasBgMode === 'color') {
                            setIsColorPaletteOpen(prev => !prev);
                          } else {
                            setCanvasBgMode('color');
                            setIsColorPaletteOpen(true);
                          }
                        }}
                        className={`px-2.5 py-1 rounded text-[10px] font-bold transition cursor-pointer flex items-center gap-1.5 ${
                          canvasBgMode === 'color' ? 'bg-indigo-600 text-white font-extrabold shadow-md' : 'text-slate-400 hover:text-white hover:bg-[#282828]'
                        }`}
                        title="Aperçu temporaire avec une couleur sous le canva"
                      >
                        <div
                          className="w-2.5 h-2.5 rounded-full border border-white/50 shadow-sm"
                          style={{ backgroundColor: canvasBgMode === 'color' ? canvasSimColor : '#00ff00' }}
                        />
                        <span>Couleur</span>
                        <Palette className="w-3 h-3 text-indigo-300" />
                      </button>

                      {/* Palette Popover Dropdown */}
                      {isColorPaletteOpen && (
                        <div className="absolute bottom-full right-0 mb-2 w-64 bg-[#1f1f1f] border border-[#383838] rounded-xl p-3 shadow-2xl z-50 text-slate-200">
                          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#333333]">
                            <span className="text-[11px] font-extrabold text-white flex items-center gap-1.5">
                              <Palette className="w-3.5 h-3.5 text-indigo-400" />
                              Couleur Sous le Canva
                            </span>
                            <button
                              type="button"
                              onClick={() => setIsColorPaletteOpen(false)}
                              className="text-slate-400 hover:text-white text-xs font-bold p-0.5 cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>

                          <div className="space-y-2.5">
                            <span className="text-[10px] text-slate-400 block font-semibold">
                              Palette Rapide :
                            </span>
                            <div className="grid grid-cols-4 gap-1.5">
                              {[
                                { name: 'Chroma Vert', color: '#00ff00' },
                                { name: 'Key Bleu', color: '#0000ff' },
                                { name: 'Noir', color: '#000000' },
                                { name: 'Blanc', color: '#ffffff' },
                                { name: 'Gris Sombre', color: '#1a1a1a' },
                                { name: 'Rouge', color: '#ef4444' },
                                { name: 'Jaune', color: '#eab308' },
                                { name: 'Violet', color: '#a855f7' }
                              ].map((preset) => (
                                <button
                                  key={preset.name}
                                  type="button"
                                  onClick={() => {
                                    setCanvasSimColor(preset.color);
                                    setCanvasBgMode('color');
                                  }}
                                  className={`p-1.5 rounded-lg border text-[9px] font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                                    canvasBgMode === 'color' && canvasSimColor === preset.color
                                      ? 'bg-indigo-600/30 text-white border-indigo-400 ring-1 ring-indigo-400'
                                      : 'bg-[#282828] text-slate-300 border-[#383838] hover:border-slate-500 hover:text-white'
                                  }`}
                                >
                                  <div
                                    className="w-4 h-4 rounded-full border border-white/30 shadow-sm"
                                    style={{ backgroundColor: preset.color }}
                                  />
                                  <span className="truncate w-full text-center">{preset.name}</span>
                                </button>
                              ))}
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-[#333333]">
                              <span className="text-[10px] text-slate-400 font-semibold">Sélecteur :</span>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="color"
                                  value={canvasSimColor}
                                  onChange={(e) => {
                                    setCanvasSimColor(e.target.value);
                                    setCanvasBgMode('color');
                                  }}
                                  className="w-6 h-6 rounded border-0 bg-transparent cursor-pointer"
                                  title="Choisir une couleur"
                                />
                                <input
                                  type="text"
                                  value={canvasSimColor}
                                  onChange={(e) => {
                                    setCanvasSimColor(e.target.value);
                                    setCanvasBgMode('color');
                                  }}
                                  className="w-20 bg-[#141414] text-white border border-[#383838] px-1.5 py-0.5 rounded text-[10px] font-mono outline-none focus:border-indigo-500"
                                />
                              </div>
                            </div>

                            <div className="pt-2 border-t border-[#333333]">
                              <button
                                type="button"
                                onClick={() => {
                                  setCanvasBgMode('video');
                                  setIsColorPaletteOpen(false);
                                }}
                                className="w-full py-1.5 px-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center justify-center gap-1"
                              >
                                <span>Enlever la couleur (Sans Fond)</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* RIGHT: INSPECTOR SIDEBAR */}
          <div className="w-[380px] bg-[#242424] flex flex-col overflow-hidden">
            
            {/* Inspector Navigation Tabs */}
            <div className="flex border-b border-[#333333] bg-[#1e1e1e] p-1 gap-1 flex-shrink-0">
              {[
                { id: 'screens', label: 'Écrans', icon: Tv },
                { id: 'elements', label: 'Calques', icon: Layers },
                { id: 'inspector', label: 'Inspecteur', icon: Sliders },
                { id: 'presets', label: 'Thèmes', icon: Sparkles },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 py-2 px-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition cursor-pointer ${
                      isActive
                        ? 'bg-[#333333] text-white border border-[#444444]'
                        : 'text-slate-400 hover:text-white hover:bg-[#282828]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="text-[11px]">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Contents */}
            <div className="flex-1 p-5 overflow-y-auto space-y-5 text-slate-200">
              
              {/* TAB 0: AFFECTATION ÉCRANS DE PROJECTION */}
              {activeTab === 'screens' && (
                <div className="space-y-4">
                  <div className={`p-3.5 rounded-xl bg-[#1c1c1c] border ${moduleConfig.borderClass} space-y-1.5`}>
                    <div className="flex items-center gap-2">
                      <div className={`p-1 rounded-lg ${moduleConfig.bgClass}/20 ${moduleConfig.colorClass}`}>
                        <Tv className="w-4 h-4" />
                      </div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-white">
                        Affectation aux Écrans ({moduleConfig.shortName})
                      </h3>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Attribuez le thème <strong className="text-white">{themePresets.find(t => t.id === editingThemeId)?.name || 'sélectionné'}</strong> aux différents écrans de sortie lors de la projection du module <strong className={moduleConfig.colorClass}>{moduleConfig.name}</strong>.
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    {screenConfigs.map((sc) => {
                      const currentModuleKey = (activeModule || 'brochures') as 'brochures' | 'lyrics' | 'bible';
                      const assignedThemeId = sc.moduleThemes?.[currentModuleKey] || '';
                      const isAssigned = Boolean(editingThemeId && assignedThemeId === editingThemeId);
                      const currentAssignedTheme = themePresets.find(t => t.id === assignedThemeId && t.module === currentModuleKey);

                      // Clean display name (strip any legacy NDI text if present)
                      const displayName = sc.name.replace(/\s*\([^)]*NDI[^)]*\)/gi, '').trim();

                      return (
                        <div
                          key={sc.id}
                          className={`p-3.5 rounded-xl border transition ${
                            isAssigned
                              ? `${moduleConfig.bgClass}/15 border ${moduleConfig.borderClass} shadow-md`
                              : 'bg-[#1a1a1a] border-[#333333] hover:border-[#444444]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black flex-shrink-0 ${
                                isAssigned ? `${moduleConfig.bgClass} text-white` : 'bg-[#282828] text-slate-400 border border-[#383838]'
                              }`}>
                                <Tv className="w-4 h-4" />
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <h4 className="text-xs font-extrabold text-white truncate">{displayName}</h4>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingScreenConfig(sc);
                                      setEditScreenName(displayName);
                                      setEditScreenOutputType(sc.outputType || 'hdmi');
                                    }}
                                    className="p-1 rounded-lg text-slate-400 hover:text-[#00d2ff] hover:bg-[#282828] transition cursor-pointer flex-shrink-0"
                                    title="Éditer les paramètres de cet écran"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                <p className="text-[10px] text-slate-400 mt-0.5">
                                  Thème actuel :{' '}
                                  <strong className={currentAssignedTheme ? 'text-emerald-400' : 'text-slate-500 font-normal'}>
                                    {currentAssignedTheme?.name || 'Aucun thème'}
                                  </strong>
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleAssignModuleTheme(sc.id, currentModuleKey, isAssigned ? '' : editingThemeId)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center gap-1 shadow-sm flex-shrink-0 ${
                                isAssigned
                                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                  : 'bg-[#282828] hover:bg-[#333333] text-slate-300 border border-[#383838]'
                              }`}
                            >
                              {isAssigned ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                  <span>Actif</span>
                                </>
                              ) : (
                                <span>Attribuer</span>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsAddingScreen(false) || setIsAddingScreen(true)}
                    className="w-full py-2 bg-[#1e1e1e] hover:bg-[#282828] text-slate-200 border border-[#383838] rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Ajouter un Écran de Sortie</span>
                  </button>
                </div>
              )}
              
              {/* TAB 1: CALQUES (LAYERS LIST) */}
              {activeTab === 'elements' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                      Liste des Calques sur le Canvas
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSelectAll}
                        className="text-[10px] text-blue-400 hover:underline font-bold"
                      >
                        Tout sélect.
                      </button>
                      <span className="text-[10px] bg-[#333333] text-slate-300 font-mono px-2 py-0.5 rounded-full font-bold">
                        {customElements.length} éléments
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {customElements
                      .slice()
                      .sort((a, b) => (b.position.zIndex || 0) - (a.position.zIndex || 0))
                      .map((el) => {
                        const isSelected = selectedElementIds.includes(el.id);
                        return (
                          <div
                            key={el.id}
                            onClick={(e) => {
                              handleSelectElement(el.id, e.shiftKey || e.ctrlKey || e.metaKey);
                              setActiveTab('inspector');
                            }}
                            className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between gap-2 ${
                              isSelected
                                ? 'bg-[#333333] border-blue-500 text-white shadow-md'
                                : 'bg-[#1c1c1c] border-[#333333] text-slate-300 hover:border-[#444444]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleSelectElement(el.id, true);
                                }}
                                className="accent-blue-500 w-3.5 h-3.5 rounded cursor-pointer"
                              />
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                                el.type === 'shape' ? 'bg-emerald-500/20 text-emerald-400' :
                                el.binding === 'sermon_text' ? 'bg-blue-500/20 text-blue-400' :
                                'bg-indigo-500/20 text-indigo-400'
                              }`}>
                                {el.type === 'shape' ? <Square className="w-3.5 h-3.5" /> : <Type className="w-3.5 h-3.5" />}
                              </div>
                              <div className="truncate">
                                <div className="font-extrabold text-xs truncate">{el.name}</div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  Liaison : {el.binding}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => handleMoveUp(el.id)}
                                className="p-1 hover:text-emerald-400 text-slate-400 transition cursor-pointer"
                                title="Monter le calque (Up)"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleMoveDown(el.id)}
                                className="p-1 hover:text-emerald-400 text-slate-400 transition cursor-pointer"
                                title="Descendre le calque (Down)"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDuplicateElement(el)}
                                className="p-1 hover:text-white text-slate-400 transition cursor-pointer"
                                title="Dupliquer"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteElement(el.id)}
                                className="p-1 hover:text-rose-400 text-slate-400 transition cursor-pointer"
                                title="Supprimer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* TAB 2: INSPECTEUR DE PROPRIÉTÉS */}
              {activeTab === 'inspector' && selectedElement && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between pb-2 border-b border-[#333333]">
                    <div>
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-blue-400">
                        Inspecteur d'Élément
                      </h3>
                      <p className="text-[11px] text-slate-400 font-bold">
                        {selectedElementIds.length > 1
                          ? `${selectedElementIds.length} éléments sélectionnés (Édition groupée)`
                          : selectedElement.name}
                      </p>
                    </div>

                    <button
                      onClick={handleDeleteSelected}
                      className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition text-xs font-bold flex items-center gap-1 cursor-pointer border border-rose-500/30"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Supprimer ({selectedElementIds.length})</span>
                    </button>
                  </div>

                  {selectedElementIds.length > 1 && (
                    <div className="bg-blue-500/10 border border-blue-500/30 p-2.5 rounded-xl text-xs text-blue-300 font-semibold flex items-center gap-2">
                      <Sparkles className="w-4 h-4 flex-shrink-0" />
                      <span>Toute modification appliquée ci-dessous sera répercutée sur les {selectedElementIds.length} calques sélectionnés.</span>
                    </div>
                  )}

                  {/* Nom & Liaison de contenu & Variantes */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-300 block">Identité & Type d'Élément :</label>

                    <div>
                      <span className="text-[10px] text-slate-400 block mb-1 font-semibold">Nom du Calque :</span>
                      <input
                        type="text"
                        value={selectedElement.name}
                        onChange={(e) => updateSelectedElement({ name: e.target.value })}
                        className="w-full bg-[#181818] text-white border border-[#383838] px-3 py-1.5 rounded-lg text-xs outline-none focus:border-blue-500 font-bold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-1 font-semibold">Catégorie Élément :</span>
                        <select
                          value={selectedElement.type}
                          onChange={(e) => updateSelectedElement({ type: e.target.value as any })}
                          className="w-full bg-[#181818] text-white border border-[#383838] px-2 py-1.5 rounded-lg text-xs outline-none focus:border-blue-500 font-bold cursor-pointer"
                        >
                          <option value="text">Texte / Titre</option>
                          <option value="shape">Forme / Boîte</option>
                          <option value="circle">Cercle / Bulle</option>
                          <option value="line">Ligne / Séparateur</option>
                          <option value="badge">Badge Externe</option>
                          <option value="icon">Symbole / Icône</option>
                        </select>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 block mb-1 font-semibold">Variante Visuelle :</span>
                        <select
                          value={selectedElement.shapeVariant || 'rectangle'}
                          onChange={(e) => updateSelectedElement({ shapeVariant: e.target.value as any })}
                          className="w-full bg-[#181818] text-white border border-[#383838] px-2 py-1.5 rounded-lg text-xs outline-none focus:border-blue-500 font-bold cursor-pointer"
                        >
                          <option value="rectangle">Cadre (Boîte de fond)</option>
                          <option value="contour">Contour (Tracé sans fond)</option>
                          <option value="pill">Capsule / Pilule</option>
                          <option value="circle">Cercle / Disque</option>
                          <option value="line_horizontal">Ligne Horizontale</option>
                          <option value="line_vertical">Ligne Verticale</option>
                          <option value="line_dashed">Ligne Pointillée</option>
                          <option value="quote">Guillemets Citation</option>
                        </select>
                      </div>
                    </div>

                    {/* SELECTOR FOR ICON/SYMBOL IF TYPE IS ICON OR SHAPE VARIANT IS ICON */}
                    {(selectedElement.type === 'icon' || (selectedElement.shapeVariant && selectedElement.shapeVariant.startsWith('icon_'))) && (
                      <div className="p-2.5 bg-[#181818] border border-[#383838] rounded-xl space-y-2">
                        <span className="text-[10px] text-amber-300 font-extrabold block uppercase tracking-wider">
                          Choix du Symbole Spirituel / Média :
                        </span>
                        <div className="grid grid-cols-4 gap-1.5">
                          {[
                            { id: 'cross', label: 'Croix †' },
                            { id: 'church', label: 'Église' },
                            { id: 'bible', label: 'Bible' },
                            { id: 'mic', label: 'Micro' },
                            { id: 'tv', label: 'Direct' },
                            { id: 'star', label: 'Étoile' },
                            { id: 'bookmark', label: 'Badge' },
                            { id: 'music', label: 'Musique' },
                          ].map((ic) => (
                            <button
                              key={ic.id}
                              type="button"
                              onClick={() => updateSelectedElement({ iconName: ic.id as any })}
                              className={`p-1.5 rounded-lg border text-[10px] font-extrabold transition cursor-pointer text-center truncate ${
                                (selectedElement.iconName || 'cross') === ic.id
                                  ? 'bg-blue-600 text-white border-blue-500'
                                  : 'bg-[#222222] text-slate-300 border-[#383838] hover:border-[#555555]'
                              }`}
                            >
                              {ic.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <span className="text-[10px] text-slate-400 block mb-1 font-semibold">Donnée liée (Binding) :</span>
                      <select
                        value={selectedElement.binding}
                        onChange={(e) => updateSelectedElement({ binding: e.target.value as any })}
                        className="w-full bg-[#181818] text-white border border-[#383838] px-3 py-1.5 rounded-lg text-xs outline-none focus:border-blue-500 font-bold cursor-pointer"
                      >
                        <option value="sermon_text">Texte du Sermon (Paragraphe actuel)</option>
                        <option value="sermon_header">Titre du Sermon & Référence (ex: Titre — § 142)</option>
                        <option value="sermon_reference">Référence Paragraphe/Page (ex: § 142)</option>
                        <option value="static_text">
                          {selectedElement.type === 'shape' || selectedElement.type === 'circle' || selectedElement.type === 'line' || selectedElement.type === 'divider'
                            ? 'Forme Plate (sans liaison sermon)'
                            : 'Texte Statique Personnalisé'}
                        </option>
                        <option value="logo">Logo / Marque de Régie</option>
                        <option value="icon">Icône / Symbole Seul</option>
                      </select>
                    </div>

                    {selectedElement.binding === 'static_text' && (
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-1 font-semibold">
                          {selectedElement.type === 'shape' || selectedElement.type === 'circle'
                            ? 'Texte Optionnel dans la Forme :'
                            : 'Texte Fixe Personnalisé :'}
                        </span>
                        <input
                          type="text"
                          value={selectedElement.staticText || ''}
                          onChange={(e) => updateSelectedElement({ staticText: e.target.value })}
                          className="w-full bg-[#181818] text-white border border-[#383838] px-3 py-1.5 rounded-lg text-xs outline-none focus:border-blue-500 font-bold"
                          placeholder={
                            selectedElement.type === 'shape' || selectedElement.type === 'circle'
                              ? 'Laisser vide pour une forme plate seule...'
                              : 'Entrez votre texte fixe...'
                          }
                        />
                      </div>
                    )}
                  </div>

                  {/* Géométrie Position & Dimensions */}
                  <div className="space-y-3 pt-3 border-t border-[#333333]">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-300">Position & Dimensions (% Canvas) :</h4>
                      <span className="text-[10px] text-amber-400 font-mono font-bold">
                        Z-Index : {selectedElement.position.zIndex || 1}
                      </span>
                    </div>

                    {/* Quick Alignment Shortcuts */}
                    <div className="grid grid-cols-3 gap-1.5 bg-[#1a1a1a] p-2 rounded-xl border border-[#333333]">
                      <button
                        type="button"
                        onClick={handleCenterOnCanvas}
                        className="py-1 px-2 bg-[#282828] hover:bg-[#333333] text-sky-300 border border-[#383838] rounded-lg text-[10.5px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                        title="Centrer au milieu de l'écran"
                      >
                        <span>Centrer au Milieu</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleFitWidth}
                        className="py-1 px-2 bg-[#282828] hover:bg-[#333333] text-slate-200 border border-[#383838] rounded-lg text-[10.5px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                        title="Étirer la largeur à 100%"
                      >
                        <span>Larg. 100%</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleFitHeight}
                        className="py-1 px-2 bg-[#282828] hover:bg-[#333333] text-slate-200 border border-[#383838] rounded-lg text-[10.5px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                        title="Étirer la hauteur à 100%"
                      >
                        <span>Haut. 100%</span>
                      </button>
                    </div>

                    {/* Layer Z-Index Order Buttons (Monter Up / Descendre Down) */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 block font-semibold">Ordre des Calques (Z-Index / Empilement) :</span>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleMoveUp()}
                          className="py-1.5 px-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition shadow"
                          title="Avancer / Monter le calque d'un niveau (Up)"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                          <span>Monter (Up)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleMoveDown()}
                          className="py-1.5 px-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition shadow"
                          title="Reculer / Descendre le calque d'un niveau (Down)"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                          <span>Descendre (Down)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleBringToFront()}
                          className="py-1 px-2 bg-[#282828] hover:bg-[#333333] text-slate-300 border border-[#383838] rounded-lg text-[10.5px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                          title="Mettre au Tout Premier Plan"
                        >
                          <span>Premier Plan</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSendToBack()}
                          className="py-1 px-2 bg-[#282828] hover:bg-[#333333] text-slate-300 border border-[#383838] rounded-lg text-[10.5px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                          title="Mettre Tout en Arrière Plan"
                        >
                          <span>Arrière Plan</span>
                        </button>
                      </div>
                    </div>

                    {/* Position & Size Grid with Number Inputs + Sliders */}
                    <div className="grid grid-cols-2 gap-2.5 bg-[#181818] p-2.5 rounded-xl border border-[#333333]">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-slate-400 font-semibold">Position X (%) :</span>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            value={selectedElement.position.x}
                            onChange={(e) => updateSelectedElementPosition({ x: Math.max(0, Math.min(100, Number(e.target.value))) })}
                            className="w-12 bg-[#222222] text-amber-300 font-mono text-[10px] font-bold px-1 py-0.5 rounded border border-[#383838] text-right outline-none focus:border-amber-400"
                          />
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="0.5"
                          value={selectedElement.position.x}
                          onChange={(e) => updateSelectedElementPosition({ x: Number(e.target.value) })}
                          className="w-full accent-blue-500 cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-slate-400 font-semibold">Position Y (%) :</span>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            value={selectedElement.position.y}
                            onChange={(e) => updateSelectedElementPosition({ y: Math.max(0, Math.min(100, Number(e.target.value))) })}
                            className="w-12 bg-[#222222] text-amber-300 font-mono text-[10px] font-bold px-1 py-0.5 rounded border border-[#383838] text-right outline-none focus:border-amber-400"
                          />
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="0.5"
                          value={selectedElement.position.y}
                          onChange={(e) => updateSelectedElementPosition({ y: Number(e.target.value) })}
                          className="w-full accent-blue-500 cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-slate-400 font-semibold">Largeur (%) :</span>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            step="0.5"
                            value={selectedElement.position.width}
                            onChange={(e) => updateSelectedElementPosition({ width: Math.max(1, Math.min(100, Number(e.target.value))) })}
                            className="w-12 bg-[#222222] text-sky-300 font-mono text-[10px] font-bold px-1 py-0.5 rounded border border-[#383838] text-right outline-none focus:border-sky-400"
                          />
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="100"
                          step="0.5"
                          value={selectedElement.position.width}
                          onChange={(e) => updateSelectedElementPosition({ width: Number(e.target.value) })}
                          className="w-full accent-blue-500 cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-slate-400 font-semibold">Hauteur (%) :</span>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            step="0.5"
                            value={selectedElement.position.height}
                            onChange={(e) => updateSelectedElementPosition({ height: Math.max(1, Math.min(100, Number(e.target.value))) })}
                            className="w-12 bg-[#222222] text-sky-300 font-mono text-[10px] font-bold px-1 py-0.5 rounded border border-[#383838] text-right outline-none focus:border-sky-400"
                          />
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="100"
                          step="0.5"
                          value={selectedElement.position.height}
                          onChange={(e) => updateSelectedElementPosition({ height: Number(e.target.value) })}
                          className="w-full accent-blue-500 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Style Visuel Spécifique par Type (Ligne, Forme, Texte, Icône) */}
                  <div className="space-y-3 pt-3 border-t border-[#333333]">
                    {selectedElement.type === 'line' ? (
                      /* CONTROLS SPECIFIC TO LINES */
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Minus className="w-3.5 h-3.5" />
                          <span>Propriétés de la Ligne :</span>
                        </h4>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-semibold">Épaisseur du Trait ({selectedElement.style.borderWidth || 3}px) :</span>
                            <input
                              type="range"
                              min="1"
                              max="24"
                              value={selectedElement.style.borderWidth || 3}
                              onChange={(e) => updateSelectedElementStyle({ borderWidth: Number(e.target.value) })}
                              className="w-full accent-blue-500 cursor-pointer"
                            />
                          </div>

                          <div>
                            <span className="text-[10px] text-slate-400 block font-semibold">Opacité ({Math.round((selectedElement.style.opacity ?? 1) * 100)}%) :</span>
                            <input
                              type="range"
                              min="0.05"
                              max="1"
                              step="0.05"
                              value={selectedElement.style.opacity ?? 1}
                              onChange={(e) => updateSelectedElementStyle({ opacity: Number(e.target.value) })}
                              className="w-full accent-blue-500 cursor-pointer"
                            />
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold mb-1">Couleur de la Ligne :</span>
                          <div className="flex items-center gap-2">
                            {['#3b82f6', '#ffffff', '#ffd700', '#ff4d4d', '#10b981', '#333333', 'rgba(255,255,255,0.4)'].map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => updateSelectedElementStyle({ borderColor: c, textColor: c })}
                                className="w-6 h-6 rounded-full border border-white/30 cursor-pointer shadow-sm"
                                style={{ backgroundColor: c }}
                              />
                            ))}
                            <input
                              type="color"
                              value={selectedElement.style.borderColor || selectedElement.style.textColor || '#3b82f6'}
                              onChange={(e) => updateSelectedElementStyle({ borderColor: e.target.value, textColor: e.target.value })}
                              className="w-7 h-7 rounded border-0 bg-transparent cursor-pointer ml-auto"
                            />
                          </div>
                        </div>
                      </div>
                    ) : selectedElement.type === 'shape' || selectedElement.type === 'circle' ? (
                      /* CONTROLS SPECIFIC TO SHAPES */
                      (() => {
                        const isContour = selectedElement.shapeVariant === 'contour' || selectedElement.shapeVariant === 'stroke_frame';
                        return (
                          <div className="space-y-3">
                            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                              {isContour ? <BoxSelect className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                              <span>{isContour ? 'Propriétés du Contour (Tracé) :' : 'Propriétés de la Boîte (Fond) :'}</span>
                            </h4>

                            <div className="grid grid-cols-2 gap-3">
                              {isContour && (
                                <div>
                                  <span className="text-[10px] text-slate-400 block font-semibold">Épaisseur Contour ({selectedElement.style.borderWidth !== undefined ? selectedElement.style.borderWidth : 3}px) :</span>
                                  <input
                                    type="range"
                                    min="1"
                                    max="20"
                                    value={selectedElement.style.borderWidth !== undefined ? selectedElement.style.borderWidth : 3}
                                    onChange={(e) => updateSelectedElementStyle({ borderWidth: Number(e.target.value) })}
                                    className="w-full accent-blue-500 cursor-pointer"
                                  />
                                </div>
                              )}

                              <div className={isContour ? '' : 'col-span-2'}>
                                <span className="text-[10px] text-slate-400 block font-semibold">Arrondi Angles ({selectedElement.style.borderRadius || 0}px) :</span>
                                <input
                                  type="range"
                                  min="0"
                                  max="60"
                                  step="2"
                                  value={selectedElement.style.borderRadius || 0}
                                  onChange={(e) => updateSelectedElementStyle({ borderRadius: Number(e.target.value) })}
                                  className="w-full accent-blue-500 cursor-pointer"
                                />
                              </div>
                            </div>

                            <div className="space-y-3">
                              {isContour ? (
                                /* Seules les couleurs du Contour pour la forme Contour */
                                <ColorGradientPicker
                                  label="Couleur Contour / Tracé (Dégradé ou Unie)"
                                  targetKey="border"
                                  colorValue={selectedElement.style.borderColor && !selectedElement.style.borderColor.includes('gradient') ? selectedElement.style.borderColor : undefined}
                                  gradientValue={selectedElement.style.borderColor?.includes('gradient') ? selectedElement.style.borderColor : undefined}
                                  onChange={(res) => {
                                    if (res.borderColor) {
                                      updateSelectedElementStyle({
                                        borderColor: res.borderColor,
                                        borderWidth: selectedElement.style.borderWidth !== undefined ? selectedElement.style.borderWidth : 3,
                                        backgroundColor: 'transparent',
                                        backgroundGradient: undefined
                                      });
                                    }
                                  }}
                                />
                              ) : (
                                /* Seules les couleurs du Fond pour la Boîte de fond */
                                <ColorGradientPicker
                                  label="Couleur Fond Boîte (Dégradé ou Unie)"
                                  targetKey="background"
                                  colorValue={selectedElement.style.backgroundColor}
                                  gradientValue={selectedElement.style.backgroundGradient}
                                  currentOpacity={selectedElement.style.opacity ?? 1}
                                  onChange={(res) => {
                                    updateSelectedElementStyle({
                                      ...res,
                                      borderColor: 'transparent',
                                      borderWidth: 0
                                    });
                                  }}
                                />
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-1">
                              <div>
                                <span className="text-[10px] text-slate-400 block font-semibold">Opacité ({Math.round((selectedElement.style.opacity ?? 1) * 100)}%) :</span>
                                <input
                                  type="range"
                                  min="0"
                                  max="1"
                                  step="0.05"
                                  value={selectedElement.style.opacity ?? 1}
                                  onChange={(e) => updateSelectedElementStyle({ opacity: Number(e.target.value) })}
                                  className="w-full accent-blue-500 cursor-pointer"
                                />
                              </div>

                              <div className="flex items-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => updateSelectedElementStyle({ boxShadow: !selectedElement.style.boxShadow })}
                                  className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-bold border transition cursor-pointer text-center ${
                                    selectedElement.style.boxShadow
                                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                      : 'bg-[#181818] text-slate-400 border-[#383838]'
                                  }`}
                                >
                                  Ombre Portée {selectedElement.style.boxShadow ? 'ON' : 'OFF'}
                                </button>
                              </div>
                            </div>

                            {/* Fin des propriétés de la forme */}
                          </div>
                        );
                      })()
                    ) : selectedElement.type === 'image' || selectedElement.type === 'video' ? (
                      /* CONTROLS SPECIFIC TO IMAGES & VIDEOS */
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center justify-between gap-1.5">
                          <div className="flex items-center gap-1.5">
                            {selectedElement.type === 'image' ? <ImageIcon className="w-3.5 h-3.5 text-cyan-400" /> : <Video className="w-3.5 h-3.5 text-purple-400" />}
                            <span>Propriétés Média {selectedElement.type === 'image' ? 'Image' : 'Vidéo'} :</span>
                          </div>
                        </h4>

                        <button
                          type="button"
                          onClick={() => {
                            const mediaUrl = selectedElement.imageUrl || selectedElement.videoUrl || selectedElement.staticText;
                            if (mediaUrl) {
                              pushStyleChange({
                                bgType: selectedElement.type === 'video' ? 'video' : 'image',
                                bgImageUrl: selectedElement.type === 'image' ? mediaUrl : draftStyle.bgImageUrl,
                                bgVideoUrl: selectedElement.type === 'video' ? mediaUrl : draftStyle.bgVideoUrl,
                                bgOpacity: draftStyle.bgOpacity !== undefined ? draftStyle.bgOpacity : 1
                              });
                              handleDeleteSelected();
                            }
                          }}
                          className="w-full py-2 px-3 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition shadow"
                        >
                          <Film className="w-4 h-4 text-amber-400" />
                          <span>Mettre comme Fond Plein Écran (Full Screen)</span>
                        </button>

                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold mb-1">URL / Lien Direct du Média :</span>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={selectedElement.imageUrl || selectedElement.videoUrl || selectedElement.staticText || ''}
                              onChange={(e) => {
                                const url = e.target.value;
                                updateSelectedElement({
                                  imageUrl: url,
                                  videoUrl: selectedElement.type === 'video' ? url : undefined,
                                  staticText: url
                                });
                              }}
                              placeholder={selectedElement.type === 'image' ? "https://.../image.jpg" : "https://.../video.mp4"}
                              className="flex-1 bg-[#181818] text-white border border-[#383838] px-3 py-1.5 rounded-lg text-xs outline-none focus:border-blue-500 font-mono"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (selectedElement.type === 'image') {
                                  triggerImageUpload('element');
                                } else {
                                  triggerVideoUpload('element');
                                }
                              }}
                              className="px-3 py-1.5 bg-[#333333] hover:bg-[#444444] text-white font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer transition shadow-md border border-[#444444]"
                              title="Parcourir un fichier sur votre ordinateur..."
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>Fichier</span>
                            </button>
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold mb-1">Mode d'Ajustement (Object Fit) :</span>
                          <div className="flex gap-1">
                            {[
                              { id: 'cover', label: 'Couvrir (Cover)' },
                              { id: 'contain', label: 'Contenir (Contain)' },
                              { id: 'fill', label: 'Étirer (Fill)' }
                            ].map((fit) => (
                              <button
                                key={fit.id}
                                type="button"
                                onClick={() => updateSelectedElement({ style: { ...selectedElement.style, objectFit: fit.id as any } })}
                                className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                                  (selectedElement.style.objectFit || 'cover') === fit.id
                                    ? 'bg-blue-600 text-white border-blue-500'
                                    : 'bg-[#181818] text-slate-300 border-[#383838] hover:text-white'
                                }`}
                              >
                                {fit.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-semibold">Opacité ({Math.round((selectedElement.style.opacity ?? 1) * 100)}%) :</span>
                            <input
                              type="range"
                              min="0.1"
                              max="1"
                              step="0.05"
                              value={selectedElement.style.opacity ?? 1}
                              onChange={(e) => updateSelectedElement({ style: { ...selectedElement.style, opacity: Number(e.target.value) } })}
                              className="w-full accent-blue-500 cursor-pointer"
                            />
                          </div>

                          <div>
                            <span className="text-[10px] text-slate-400 block font-semibold">Arrondi Angles ({selectedElement.style.borderRadius || 12}px) :</span>
                            <input
                              type="range"
                              min="0"
                              max="48"
                              step="2"
                              value={selectedElement.style.borderRadius || 12}
                              onChange={(e) => updateSelectedElement({ style: { ...selectedElement.style, borderRadius: Number(e.target.value) } })}
                              className="w-full accent-blue-500 cursor-pointer"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-semibold">Épaisseur Bordure ({selectedElement.style.borderWidth || 0}px) :</span>
                            <input
                              type="range"
                              min="0"
                              max="12"
                              value={selectedElement.style.borderWidth || 0}
                              onChange={(e) => updateSelectedElement({ style: { ...selectedElement.style, borderWidth: Number(e.target.value) } })}
                              className="w-full accent-blue-500 cursor-pointer"
                            />
                          </div>

                          <div>
                            <span className="text-[10px] text-slate-400 block font-semibold mb-1">Couleur Bordure :</span>
                            <div className="flex gap-1.5">
                              {['#3b82f6', '#ffffff', '#ffd700', 'transparent'].map((c) => (
                                <button
                                  key={c}
                                  type="button"
                                  onClick={() => updateSelectedElement({ style: { ...selectedElement.style, borderColor: c } })}
                                  className="w-6 h-6 rounded-full border border-white/30 cursor-pointer shadow-sm"
                                  style={{ backgroundColor: c === 'transparent' ? '#222' : c }}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* CONTROLS SPECIFIC TO TEXT AND BADGES */
                      <div className="space-y-4">
                        {/* Taille de police */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-slate-400 font-semibold">Taille de Police (px) :</span>
                            <input
                              type="number"
                              min="8"
                              max="240"
                              value={selectedElement.style.fontSize || 32}
                              onChange={(e) => updateSelectedElementStyle({ fontSize: Math.max(8, Number(e.target.value)) })}
                              className="w-12 bg-[#222222] text-amber-300 font-mono text-[10px] font-bold px-1 py-0.5 rounded border border-[#383838] text-right outline-none focus:border-amber-400"
                            />
                          </div>
                          <input
                            type="range"
                            min="10"
                            max="220"
                            step="2"
                            value={selectedElement.style.fontSize || 32}
                            onChange={(e) => updateSelectedElementStyle({ fontSize: Number(e.target.value) })}
                            className="w-full accent-blue-500 cursor-pointer"
                          />
                        </div>

                        {/* Couleurs de fond et de texte */}
                        <div className="space-y-3">
                          <ColorGradientPicker
                            label="Couleur Fond Boîte Banderole"
                            targetKey="background"
                            colorValue={selectedElement.style.backgroundColor}
                            gradientValue={selectedElement.style.backgroundGradient}
                            onChange={(res) => updateSelectedElementStyle(res)}
                          />

                          <ColorGradientPicker
                            label="Couleur Contour Boîte Banderole"
                            targetKey="border"
                            colorValue={selectedElement.style.borderColor && !selectedElement.style.borderColor.includes('gradient') ? selectedElement.style.borderColor : undefined}
                            gradientValue={selectedElement.style.borderColor?.includes('gradient') ? selectedElement.style.borderColor : undefined}
                            onChange={(res) => {
                              if (res.borderColor) {
                                updateSelectedElementStyle({
                                  borderColor: res.borderColor,
                                  borderWidth: selectedElement.style.borderWidth || 2
                                });
                              }
                            }}
                          />
                        </div>

                          {/* Couleur Texte (Couleur solide uniquement pour la lisibilité) */}
                          <div className="pt-2 border-t border-[#2a2a2a] p-2.5 bg-[#181818] rounded-xl border border-[#2d2d2d]">
                            <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider block mb-1">Couleur Texte</span>
                            <div className="flex items-center gap-1.5">
                              {['#ffffff', '#fff3d1', '#3b82f6', '#000000', '#e6f0ff'].map((c) => (
                                <button
                                  key={c}
                                  type="button"
                                  onClick={() => updateSelectedElementStyle({ textColor: c })}
                                  className={`w-5 h-5 rounded-full border cursor-pointer shadow-sm transition hover:scale-110 ${
                                    selectedElement.style.textColor === c ? 'border-amber-400 ring-2 ring-amber-400/40' : 'border-white/30'
                                  }`}
                                  style={{ backgroundColor: c }}
                                  title={`Couleur texte ${c}`}
                                />
                              ))}
                              <input
                                type="color"
                                value={selectedElement.style.textColor || '#ffffff'}
                                onChange={(e) => updateSelectedElementStyle({ textColor: e.target.value })}
                                className="w-5 h-5 rounded border-0 bg-transparent cursor-pointer ml-auto"
                                title="Couleur texte personnalisée"
                              />
                            </div>
                          </div>

                        {/* Rich Typography Controls Component */}
                        <TypographyControls
                          style={selectedElement.style}
                          onChange={(updated) => updateSelectedElementStyle(updated)}
                          showAlignmentControls={true}
                        />

                        {/* Bordure & Arrondi */}
                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#333333]">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-semibold">Épaisseur Bordure ({selectedElement.style.borderWidth || 0}px) :</span>
                            <input
                              type="range"
                              min="0"
                              max="12"
                              value={selectedElement.style.borderWidth || 0}
                              onChange={(e) => updateSelectedElementStyle({ borderWidth: Number(e.target.value) })}
                              className="w-full accent-blue-500 cursor-pointer"
                            />
                          </div>

                          <div>
                            <span className="text-[10px] text-slate-400 block font-semibold">Arrondi Angles ({selectedElement.style.borderRadius || 0}px) :</span>
                            <input
                              type="range"
                              min="0"
                              max="32"
                              step="2"
                              value={selectedElement.style.borderRadius || 0}
                              onChange={(e) => updateSelectedElementStyle({ borderRadius: Number(e.target.value) })}
                              className="w-full accent-blue-500 cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'inspector' && !selectedElement && (
                <div className="space-y-4">
                  <div className="p-4 bg-[#1e1e1e] border border-[#333333] rounded-2xl space-y-2 text-center">
                    <div className="w-10 h-10 mx-auto rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">
                      Édition Typographie Globale de la Scène
                    </h4>
                    <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                      Aucun calque spécifique sélectionné. Les réglages ci-dessous s'appliqueront comme style par défaut à tout le texte du sermon.
                    </p>
                  </div>

                  <TypographyControls
                    style={draftStyle}
                    onChange={(updated) => pushStyleChange(updated)}
                    showAlignmentControls={true}
                  />
                </div>
              )}

              {/* TAB 3: PRESETS */}
              {activeTab === 'presets' && (
                <div className="space-y-4">
                  {/* Background Media Management Section */}
                  <div className="p-4 bg-[#1e1e1e] border border-amber-500/30 rounded-xl space-y-3 shadow-md">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-extrabold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Film className="w-4 h-4 text-amber-400" />
                        <span>Arrière-Plan Média Scène</span>
                      </h4>
                      {(draftStyle.bgImageUrl || draftStyle.bgVideoUrl) && (
                        <button
                          onClick={() => pushStyleChange({ bgType: 'color', bgImageUrl: '', bgVideoUrl: '' })}
                          className="text-[10px] text-rose-400 hover:underline font-bold cursor-pointer"
                        >
                          Effacer Fond
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => triggerImageUpload('background')}
                        className="p-2.5 bg-[#282828] hover:bg-[#333333] border border-[#383838] hover:border-cyan-400 rounded-lg flex items-center justify-center gap-2 text-xs font-bold text-slate-200 transition cursor-pointer"
                      >
                        <ImageIcon className="w-4 h-4 text-cyan-400" />
                        <span>Fond Image</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => triggerVideoUpload('background')}
                        className="p-2.5 bg-[#282828] hover:bg-[#333333] border border-[#383838] hover:border-purple-400 rounded-lg flex items-center justify-center gap-2 text-xs font-bold text-slate-200 transition cursor-pointer"
                      >
                        <Video className="w-4 h-4 text-purple-400" />
                        <span>Fond Vidéo</span>
                      </button>
                    </div>

                    {(draftStyle.bgImageUrl || draftStyle.bgVideoUrl) && (
                      <div className="space-y-2 pt-2 border-t border-[#333333]">
                        <div className="text-[11px] font-bold text-slate-300 truncate">
                          Média Actif : <span className="text-cyan-300 font-mono">{draftStyle.bgVideoUrl || draftStyle.bgImageUrl}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold mb-1">
                            Opacité Fond ({Math.round((draftStyle.bgOpacity !== undefined ? draftStyle.bgOpacity : 1) * 100)}%) :
                          </span>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={draftStyle.bgOpacity !== undefined ? draftStyle.bgOpacity : 1}
                            onChange={(e) => pushStyleChange({ bgOpacity: Number(e.target.value) })}
                            className="w-full accent-blue-500 cursor-pointer"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {PRESETS.length > 0 && (
                    <>
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                        Modèles Prédéfinis Rapides
                      </h3>

                      <div className="space-y-2.5">
                        {PRESETS.map((p, idx) => (
                          <button
                            key={idx}
                            onClick={() => pushStyleChange(p.style)}
                            className="w-full text-left p-3.5 rounded-xl bg-[#1e1e1e] hover:bg-[#282828] border border-[#333333] hover:border-blue-500/50 transition cursor-pointer group flex flex-col gap-1 shadow-md"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-xs text-white group-hover:text-blue-400 transition">
                                {p.name}
                              </span>
                              <span className="text-[10px] bg-[#333333] text-slate-300 font-bold px-2 py-0.5 rounded-full">
                                Appliquer
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed">
                              {p.desc}
                            </p>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

            </div>

            {/* Inspector Footer with Off / Live Action Buttons */}
            <div className="p-4 bg-[#1a1a1a] border-t border-[#333333] flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-xs font-medium">
                <div className={`w-2.5 h-2.5 rounded-full ${isDirty ? 'bg-amber-400 animate-pulse shadow-sm shadow-amber-400/50' : 'bg-emerald-400 shadow-sm shadow-emerald-400/50'}`} />
                <span className={isDirty ? 'text-amber-300 font-semibold text-[11px]' : 'text-slate-400 text-[11px]'}>
                  {isDirty ? 'Brouillon non projeté (En OFF)' : 'Synchronisé avec le direct'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveAndApply(true)}
                  className="px-3 py-1.5 bg-[#282828] hover:bg-[#333333] text-slate-300 hover:text-white font-semibold rounded-lg text-xs border border-[#383838] transition cursor-pointer"
                >
                  Fermer
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveAndApply(false)}
                  className="px-3.5 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 font-bold rounded-lg text-xs border border-blue-500/50 hover:border-blue-400 transition cursor-pointer shadow-md flex items-center gap-1.5"
                  title="Appliquer immédiatement sur la sortie direct sans fermer la fenêtre"
                >
                  <Eye className="w-3.5 h-3.5 text-blue-400" />
                  <span>Tester Direct (Appliquer)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveAndApply(true)}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs shadow-lg transition cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Enregistrer le Thème & Fermer</span>
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* Hidden File Inputs for Local Image and Video Upload */}
        <input
          type="file"
          ref={imageFileInputRef}
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (ev) => {
                const url = ev.target?.result as string;
                if (url) {
                  if (mediaTarget === 'background') {
                    pushStyleChange({ bgType: 'image', bgImageUrl: url });
                  } else {
                    handleAddElement('image', 'media', 'Image Local', undefined, undefined, {}, url);
                  }
                }
              };
              reader.readAsDataURL(file);
            }
            e.target.value = '';
          }}
        />

        <input
          type="file"
          ref={videoFileInputRef}
          accept="video/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              const url = URL.createObjectURL(file);
              if (mediaTarget === 'background') {
                pushStyleChange({ bgType: 'video', bgVideoUrl: url });
              } else {
                handleAddElement('video', 'media', 'Vidéo Local', undefined, undefined, {}, url);
              }
            }
            e.target.value = '';
          }}
        />

        {/* Media Import Overlay Modal */}
        {mediaModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-[#222222] border border-[#383838] rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl text-white relative">
              <button
                onClick={() => setMediaModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#333333] transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500/15 rounded-xl text-blue-400 border border-blue-500/30">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Importer un Média (Image / Vidéo)</h3>
                  <p className="text-xs text-slate-400">Ajouter une image, vidéo ou lien d'arrière-plan sur votre scène.</p>
                </div>
              </div>

              {/* Target Selector */}
              <div className="flex bg-[#181818] p-1 rounded-xl border border-[#383838] text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setMediaTarget('element')}
                  className={`flex-1 py-2 rounded-lg transition cursor-pointer ${
                    mediaTarget === 'element' ? 'bg-blue-600 text-white font-extrabold shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Élément Canvas (Calque Libre)
                </button>
                <button
                  type="button"
                  onClick={() => setMediaTarget('background')}
                  className={`flex-1 py-2 rounded-lg transition cursor-pointer ${
                    mediaTarget === 'background' ? 'bg-blue-600 text-white font-extrabold shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Fond d'Écran Scène (Arrière-plan)
                </button>
              </div>

              {/* Source Options */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-300 mb-2">
                    Option 1 : Fichier Local depuis votre ordinateur
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setMediaModalOpen(false);
                        triggerImageUpload(mediaTarget);
                      }}
                      className="p-3 bg-[#282828] hover:bg-[#333333] border border-[#383838] hover:border-cyan-400 rounded-xl flex flex-col items-center justify-center gap-2 transition cursor-pointer group"
                    >
                      <ImageIcon className="w-6 h-6 text-cyan-400 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold text-slate-200">Choisir Image (.png, .jpg)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMediaModalOpen(false);
                        triggerVideoUpload(mediaTarget);
                      }}
                      className="p-3 bg-[#282828] hover:bg-[#333333] border border-[#383838] hover:border-purple-400 rounded-xl flex flex-col items-center justify-center gap-2 transition cursor-pointer group"
                    >
                      <Video className="w-6 h-6 text-purple-400 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold text-slate-200">Choisir Vidéo (.mp4, .webm)</span>
                    </button>
                  </div>
                </div>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-[#383838]"></div>
                  <span className="flex-shrink mx-3 text-[10px] font-extrabold uppercase text-slate-500">OU PAR URL WEB DIRECTE</span>
                  <div className="flex-grow border-t border-[#383838]"></div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-300 mb-1.5">
                    Option 2 : Lien / URL Direct Web
                  </label>
                  <div className="space-y-2.5">
                    <input
                      type="url"
                      value={mediaInputUrl}
                      onChange={(e) => setMediaInputUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/... ou https://domain.com/video.mp4"
                      className="w-full bg-[#181818] text-white border border-[#383838] px-3 py-2.5 rounded-xl text-xs outline-none focus:border-blue-500 font-mono"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleApplyMediaUrl(mediaInputUrl, 'image', mediaTarget)}
                        disabled={!mediaInputUrl}
                        className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition shadow"
                      >
                        <ImageIcon className="w-4 h-4" />
                        <span>Appliquer comme Image</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyMediaUrl(mediaInputUrl, 'video', mediaTarget)}
                        disabled={!mediaInputUrl}
                        className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition shadow"
                      >
                        <Video className="w-4 h-4" />
                        <span>Appliquer comme Vidéo</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Element Intro/Outro Animation Modal */}
        <AnimationModal
          isOpen={showAnimationModal}
          onClose={() => setShowAnimationModal(false)}
          style={draftStyle}
          onChangeStyle={(newStyle) => pushStyleChange(newStyle)}
          animations={draftStyle.elementAnimations || {}}
          onSaveAnimations={(newAnims) => {
            pushStyleChange({ elementAnimations: newAnims });
          }}
          customElements={customElements}
          elements={customElements}
          sampleData={currentData}
        />

      </div>
    </div>
  );
};
