export interface Sermon {
  id: string;
  titre_francais: string;
  date_sermon?: string;
  lieu?: string;
  type_structure?: 'PARAGRAPHE' | 'PAGE';
}

export interface AgendaItem {
  id: string;
  sermonId: string;
  sermonTitle: string;
  numero: number;
  type_structure?: 'PARAGRAPHE' | 'PAGE';
  note?: string;
}

export interface Paragraphe {
  sermon_id: string;
  numero_paragraphe: number;
  texte: string;
  titre_francais?: string;
  // Local edit tracking flags for studio
  original_numero?: number;
  original_texte?: string;
}

export interface ProjectedData {
  sermonId: string;
  numero: number | string;
  texte: string;
  estExtrait?: boolean;
  blockIndex?: number | null;
  totalBlocks?: number | null;
  titre_francais?: string;
  type_structure?: string;
  module?: ActiveModule;
  animPhase?: 'ENTERING' | 'EXITING' | 'IN' | 'SLIDE' | 'OUT';
  timestamp?: number;
  animationTimeMs?: number;
}

export interface ElementAnimationConfig {
  introType?: 'none' | 'fade-in' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'zoom-in' | 'bounce-in' | 'flip-in' | 'rotate-in' | 'stroke-trim' | 'light-wipe' | 'typewriter' | string;
  introDuration?: number; // ms duration (default 500)
  introDelay?: number; // ms delay (default 0)
  emphasisType?: 'none' | 'pulse' | 'wiggle' | 'glow' | 'float' | 'spin' | 'light-wipe-loop' | string;
  emphasisDuration?: number; // ms duration (default 2000)
  emphasisLoop?: boolean; // whether emphasis animation loops infinitely (default false)
  outroType?: 'none' | 'fade-out' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'zoom-out' | 'bounce-out' | 'flip-out' | 'rotate-out' | 'stroke-trim-out' | 'light-wipe-out' | string;
  outroDuration?: number; // ms duration (default 500)
  outroDelay?: number; // ms delay (default 0)
}

export interface ElementAnimationsMap {
  title?: ElementAnimationConfig;
  text?: ElementAnimationConfig;
  verse?: ElementAnimationConfig;
  [elementKey: string]: ElementAnimationConfig | undefined;
}

export interface SlideElement {
  id: string;
  name: string;
  type: 'text' | 'shape' | 'badge' | 'image' | 'video' | 'line' | 'circle' | 'divider' | 'icon';
  shapeVariant?: 'rectangle' | 'contour' | 'pill' | 'circle' | 'glow_bar' | 'quote' | 'line_horizontal' | 'line_vertical' | 'line_dashed' | 'icon_cross' | 'icon_church' | 'icon_mic' | string;
  iconName?: 'cross' | 'church' | 'bible' | 'bookmark' | 'tv' | 'mic' | 'star' | 'sparkles' | 'music' | 'quote' | 'shield' | 'heart' | 'tag';
  binding: 'sermon_text' | 'sermon_header' | 'sermon_reference' | 'static_text' | 'logo' | 'icon' | 'media';
  staticText?: string;
  imageUrl?: string;
  videoUrl?: string;
  position: {
    x: number; // percentage (0 to 100)
    y: number; // percentage (0 to 100)
    width: number; // percentage (0 to 100)
    height: number; // percentage (0 to 100)
    zIndex: number;
  };
  style: {
    fontFamily?: string;
    backgroundColor?: string;
    backgroundGradient?: string;
    textColor?: string;
    fontSize?: number; // px at 1080p scale
    autoFontSize?: boolean;
    textFitMode?: 'auto-scale-text' | 'auto-expand-box' | 'fixed';
    fontWeight?: string; // '100' | '300' | 'normal' | '500' | 'bold' | 'extrabold' | '900'
    fontStyle?: 'normal' | 'italic';
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    verticalAlign?: 'top' | 'center' | 'bottom';
    lineHeight?: number;
    letterSpacing?: number; // px tracking (-2 to 20)
    textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
    textDecoration?: 'none' | 'underline' | 'line-through';
    textStrokeColor?: string;
    textStrokeWidth?: number; // px (0 to 10)
    borderColor?: string;
    borderWidth?: number;
    borderRadius?: number;
    padding?: number;
    opacity?: number;
    textShadow?: boolean;
    textShadowColor?: string;
    textShadowBlur?: number;
    boxShadow?: boolean;
    objectFit?: 'cover' | 'contain' | 'fill';
    animation?: ElementAnimationConfig;
  };
}

export interface ProjectionStyle {
  mode?: 'FULLSCREEN' | 'LOWER_THIRD' | 'CENTER_CARD' | 'TOP_BANNER' | 'CUSTOM_CANVAS';
  theme?: 'dark' | 'transparent' | 'chroma' | 'gold' | 'blue' | 'custom' | 'glass';
  align?: 'left' | 'center' | 'right' | 'justify';
  fontSize?: string;
  customFontSize?: string;
  textFitMode?: 'auto-scale-text' | 'auto-expand-box' | 'fixed';

  // Slide transition animation
  slideTransition?: 'cut' | 'fade' | 'slide-left' | 'slide-right' | 'slide-up' | 'slide-down' | 'zoom' | 'flip' | string;
  transitionDuration?: number; // ms duration (e.g. 350)

  // Element Animations Map (Intro & Outro for title, text, verse, etc.)
  elementAnimations?: ElementAnimationsMap;

  // Custom visual template elements (ProPresenter / Google Web Designer style)
  useCustomElements?: boolean;
  customElements?: SlideElement[];

  // Background Media
  bgType?: 'color' | 'image' | 'video' | 'transparent' | 'chroma';
  bgImageUrl?: string;
  bgVideoUrl?: string;
  bgOpacity?: number;

  // Visual layout & design customization (ProPresenter style)
  containerBg?: string; // e.g. '#080b12/95', 'rgba(10,15,25,0.92)', etc.
  containerBorderColor?: string; // e.g. '#ffffff', '#00d2ff', 'transparent'
  containerBorderWidth?: number; // px border (0 to 8)
  containerBorderRadius?: number; // px (0 to 32)
  containerPadding?: number; // px (12 to 48)
  containerMaxWidth?: number; // % (50 to 100)
  containerBottomMargin?: number; // % vertical offset for lower third (0 to 30)

  // Text Styling & Typography
  fontFamily?: string;
  textColor?: string; // e.g. '#ffffff', '#fff3d1'
  fontWeight?: string;
  fontStyle?: 'normal' | 'italic';
  letterSpacing?: number;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  textDecoration?: 'none' | 'underline' | 'line-through';
  textStrokeColor?: string;
  textStrokeWidth?: number;
  textShadow?: boolean;
  lineHeight?: number; // e.g. 1.2 to 2.0

  // Header & Badge Elements visibility & style
  showHeader?: boolean;
  headerBg?: string;
  headerTextColor?: string;
  showBadge?: boolean;
  badgeBg?: string;
  badgeTextColor?: string;
  badgePosition?: 'bottom-right' | 'top-right' | 'bottom-left' | 'top-left';

  // Preset identifier if saved
  presetName?: string;
}

export type ActiveModule = 'brochures' | 'lyrics' | 'bible';

export interface Recueil {
  id: string;
  title: string;
  description?: string;
  songsCount?: number;
}

export interface SongSection {
  id: string;
  label: string; // e.g. "Couplet 1", "Refrain", "Couplet 2", "Pont", "Pre-Refrain", "Tag"
  type: 'Couplet' | 'Refrain' | 'Pont' | 'Pre-Refrain' | 'Tag' | 'Intro' | 'Outro' | string;
  color?: string; // Hex color code for ProPresenter badge/accent
  cardIndex?: number; // Slide index inside the group (1, 2, 3...)
  totalCards?: number; // Total slides inside this group
  text: string;
  lines: string[];
}

export interface Song {
  id: string;
  recueil_id?: string;
  number: string;
  title: string;
  category?: string; // e.g. "Sur les Ailes de la Foi", "Cantiques de l'Épouse", "Chants de Victoire"
  author?: string;
  keySignature?: string;
  sections: SongSection[];
}

export interface BibleBook {
  id: string;
  name: string;
  testament: 'OT' | 'NT';
  chaptersCount: number;
}

export interface BibleVerse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  translation?: BibleTranslation;
}

export type BibleTranslation = 'LSG' | 'KJV' | 'DARBY' | 'MARTIN' | 'BDS' | 'OST' | 'BFC' | string;

export interface ThemePreset {
  id: string; // Unique identifier (UUID/timestamp hash) to avoid theme naming conflicts across modules
  name: string;
  description?: string;
  module?: 'brochures' | 'lyrics' | 'bible';
  isBuiltIn?: boolean;
  style: ProjectionStyle;
}

export interface ProjectionScreenConfig {
  id: string; // unique screen slug, e.g. "audience", "stage", "stream-obs"
  name: string; // display title, e.g. "Écran Audience (HDMI)", "Écran Stage"
  description?: string;
  outputType?: 'hdmi' | 'stage' | 'custom' | string;
  enabled: boolean;
  defaultThemeId: string;
  moduleThemes: {
    brochures: string;
    lyrics: string;
    bible: string;
  };
  style?: ProjectionStyle; // optional fallback style
}

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
  iconLink?: string;
  webViewLink?: string;
}
