export interface TocItem {
  id: string;
  text: string;
  level: 1 | 2;
}

export interface Chapter {
  id: string;
  title: string;
  content: string;
  level: 1 | 2;
  subItems?: TocItem[];
  excludeFromToc?: boolean;
}

export interface Metadata {
  title: string;
  creator: string;
  language: string;
  description: string;
  publisher: string;
  date: string;
  series?: string;
  subjects?: string[];
}

export interface ImageAsset {
  id: string;
  name: string;
  data: string;
  type: string;
  dimensions: string;
  size: number;
}

export interface BookStyle {
  id: string;
  name: string;
  css: string;
}

export interface CoverDesign {
  layoutMode: 'text-over' | 'text-above' | 'text-below';
  fontFamilyTitle: string;
  fontSizeTitle: number;
  fontColorTitle: string;
  fontWeightTitle: string;
  letterSpacingTitle: number;
  fontFamilyAuthor: string;
  fontSizeAuthor: number;
  fontColorAuthor: string;
  textAlign: 'left' | 'center' | 'right';
  verticalOffset: number;
  overlayOpacity: number;
  textShadow: boolean;
  borderStyle: string;
  backgroundCSS: string;
  showSeries: boolean;
}

export interface ExtraFile {
  id: string;
  filename: string;
  content: string;
  type: 'css' | 'text' | 'xml';
  isActive?: boolean;
  targetChapterIds?: string[];
}

export interface CoverGeneratorState {
  selectedBgImageId: string | null;
  activeTemplateIndex: number;
  showTextOnCover: boolean;
  aiCoverPrompt: string;
}

export interface ProjectData {
  metadata: Metadata;
  chapters: Chapter[];
  images: ImageAsset[];
  extraFiles: ExtraFile[];
  cover: string | null;
  coverId?: string | null;
  coverCustomCSS?: string;
  coverDesign?: CoverDesign;
  activeStyleId: string;
  isPresetStyleActive?: boolean;
  customCSS: string;
  coverGeneratorState?: CoverGeneratorState;
}

export type ViewMode =
  | 'files'
  | 'chapters'
  | 'metadata'
  | 'styles'
  | 'images'
  | 'cover'
  | 'structure';
