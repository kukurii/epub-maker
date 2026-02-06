

export interface TocItem {
  id: string; // The HTML id attribute
  text: string;
  level: 1 | 2;
}

export interface Chapter {
  id: string;
  title: string;
  content: string; // HTML content
  level: 1 | 2; // Kept for legacy compatibility, but mostly derived now
  subItems?: TocItem[]; // Derived H2s for directory display
}

export interface Metadata {
  title: string;
  creator: string; // Author
  language: string;
  description: string;
  publisher: string;
  date: string;
  series?: string; // New: Book Series
  subjects?: string[]; // New: Tags/Subjects
}

export interface ImageAsset {
  id:string;
  name: string;
  data: string; // Base64 data url
  type: string; // mime type
  dimensions: string; // e.g., "1280x720"
  size: number; // in bytes
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
    showSeries: boolean; // 新增：是否在封面上显示系列名
}

// Added isActive property to fix type error in components/views/StructureView.tsx
export interface ExtraFile {
  id: string;
  filename: string;
  content: string;
  type: 'css' | 'text' | 'xml'; 
  isActive?: boolean;
}

export interface ProjectData {
  metadata: Metadata;
  chapters: Chapter[];
  images: ImageAsset[];
  extraFiles: ExtraFile[];
  cover: string | null; // Base64 data url
  coverCustomCSS?: string; // New: Custom CSS for cover generation
  coverDesign?: CoverDesign;
  activeStyleId: string;
  isPresetStyleActive?: boolean; // New: Flag to enable/disable preset styles
  customCSS: string;
}

export type ViewMode = 'files' | 'chapters' | 'metadata' | 'styles' | 'images' | 'cover' | 'structure';

export const PRESET_STYLES: BookStyle[] = [
  {
    id: 'classic',
    name: '经典',
    css: `
body { 
  font-family: "Times New Roman", "Songti SC", "SimSun", serif; 
  color: #1a1a1a; 
  background: #fff; 
  line-height: 1.8;
  text-align: justify;
  padding: 0 1em;
} 
h1 { 
  text-align: center; 
  margin-top: 2em; 
  margin-bottom: 1.5em;
  font-weight: bold;
  page-break-before: always;
} 
h2 { 
  margin-top: 1.5em; 
  margin-bottom: 1em;
  font-weight: bold;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.3em;
}
p {
  text-indent: 2em;
  margin-bottom: 0.8em;
}
img {
  max-width: 90%;
  height: auto;
  display: block;
  margin: 2em auto;
  border: 1px solid #ccc;
  padding: 4px;
  background: #f9f9f9;
}
.caption {
  font-size: 0.9em;
  color: #666;
  text-align: center;
  margin-top: -1.5em;
  margin-bottom: 1.5em;
  font-family: sans-serif;
  text-indent: 0;
}
blockquote {
  margin: 1.5em 2em;
  padding-left: 1em;
  border-left: 3px solid #ccc;
  color: #666;
}
ul, ol {
  margin: 1em 2em;
  padding-left: 2em;
}
li {
  margin-bottom: 0.5em;
}
hr {
  border: 0;
  height: 1px;
  background: #ccc;
  margin: 2em auto;
}
/* TOC Specific Styles */
.toc-list { list-style-type: none; padding: 0; margin: 1em 2em; }
.toc-item { margin-bottom: 0.5em; }
.toc-link { text-decoration: none; color: inherit; border-bottom: 1px dotted #ccc; display: block; width: 100%; padding-bottom: 2px; }
.toc-level-2 { padding-left: 2em; font-size: 0.9em; font-style: italic; }

/* Cover Page Styles */
body.cover-page { margin: 0; padding: 0; height: 100vh; overflow: hidden; background-color: #fff; }
.cover-container { width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; }
.cover-image { max-width: 100%; max-height: 100%; object-fit: contain; margin: 0; border: none; padding: 0; background: none; box-shadow: none; }
`
  },
  {
    id: 'ancient',
    name: '古风',
    css: `
body { 
  font-family: "KaiTi", "楷体", "STKaiti", serif; 
  color: #3e2723; 
  background-color: #fdf5e6;
  line-height: 2.0; 
  padding: 0 1.5em;
} 
h1 { 
  font-size: 2.4em; 
  text-align: center;
  border-bottom: 2px solid #8d6e63; 
  padding-bottom: 0.5em; 
  margin-top: 1.5em;
  margin-bottom: 1em;
  color: #5d4037;
  font-weight: normal;
}
h2 {
  font-size: 1.6em;
  color: #795548;
  margin-top: 1.5em;
  text-align: center;
  font-weight: normal;
}
p {
  text-indent: 2em;
  margin-bottom: 1.2em;
}
img {
  max-width: 85%;
  height: auto;
  display: block;
  margin: 2.5em auto;
  border: 6px solid #dcd0c0;
  box-shadow: 3px 3px 10px rgba(62, 39, 35, 0.15);
  border-radius: 2px;
}
.caption {
  font-size: 0.9em;
  color: #8d6e63;
  text-align: center;
  margin-top: -2em;
  margin-bottom: 2.5em;
  text-indent: 0;
}
blockquote {
  margin: 1.5em 1em;
  padding: 1em;
  border: 1px solid #dcd0c0;
  background-color: rgba(141, 110, 99, 0.05);
  border-radius: 4px;
}
ul, ol {
  margin: 1em 0;
  padding-left: 2.5em;
}
li {
  margin-bottom: 0.6em;
}
hr {
  border: 0;
  text-align: center;
  margin: 2.5em auto;
}
hr:before {
  content: '◇';
  color: #8d6e63;
  font-size: 1.2em;
}
/* TOC Specific Styles */
.toc-list { list-style-type: none; padding: 0; margin: 2em 1em; }
.toc-item { margin-bottom: 0.8em; }
.toc-link { text-decoration: none; color: #5d4037; border-bottom: 1px dashed #8d6e63; display: block; padding-bottom: 0.3em; transition: color 0.3s; }
.toc-link:hover { color: #8d6e63; }
.toc-level-2 { padding-left: 1.5em; font-size: 0.9em; }

/* Cover Page Styles */
body.cover-page { margin: 0; padding: 0; height: 100vh; overflow: hidden; background-color: #fdf5e6; }
.cover-container { width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; }
.cover-image { max-width: 100%; max-height: 100%; object-fit: contain; margin: 0; border: none; padding: 0; background: none; box-shadow: none; }
`
  },
  {
    id: 'minimal',
    name: '简约',
    css: `
body { 
  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; 
  color: #333; 
  background: #fafafa; 
  line-height: 1.7; 
  max-width: 38em; 
  margin: 0 auto; 
  padding: 0 1em;
} 
h1 { 
  font-weight: 300; 
  font-size: 2.2em;
  margin-top: 2em;
  margin-bottom: 1em;
  color: #000;
}
h2 {
  font-weight: 500;
  font-size: 1.4em;
  margin-top: 1.5em;
  margin-bottom: 0.8em;
}
p {
  margin-bottom: 1.2em;
  text-align: justify;
}
img {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 2.5em auto;
}
.caption {
  font-size: 0.85em;
  color: #999;
  text-align: center;
  margin-top: -2em;
  margin-bottom: 2em;
  text-transform: uppercase;
  letter-spacing: 1px;
  text-indent: 0;
}
blockquote {
  margin: 1.5em 0;
  padding-left: 1.5em;
  border-left: 2px solid #ddd;
  color: #555;
}
ul, ol {
  margin: 1.2em 0;
  padding-left: 2em;
}
li {
  margin-bottom: 0.4em;
}
hr {
  border: 0;
  height: 1px;
  background: #eee;
  margin: 3em auto;
}
/* TOC Specific Styles */
.toc-list { list-style-type: none; padding: 0; margin: 1em 0; }
.toc-item { margin-bottom: 0.8em; border-bottom: 1px solid #eee; padding-bottom: 0.2em; }
.toc-link { text-decoration: none; color: #333; display: block; }
.toc-link:hover { color: #000; }
.toc-level-2 { padding-left: 1.5em; font-size: 0.9em; color: #666; }

/* Cover Page Styles */
body.cover-page { margin: 0; padding: 0; height: 100vh; overflow: hidden; background-color: #fafafa; }
.cover-container { width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; }
.cover-image { max-width: 100%; max-height: 100%; object-fit: contain; margin: 0; border: none; padding: 0; background: none; box-shadow: none; }
`
  },
  {
    id: 'fresh',
    name: '清新',
    css: `
body { 
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
  color: #2c3e50; 
  background: #f0f8ff; 
  line-height: 1.8; 
  padding: 0 1.5em;
} 
h1 { 
  color: #2980b9;
  text-align: center;
  margin-top: 1.5em;
  margin-bottom: 1em;
  font-weight: 700;
}
h2 { 
  color: #3498db; 
  margin-top: 1.5em; 
  border-left: 4px solid #3498db;
  padding-left: 0.5em;
}
p {
  margin-bottom: 1em;
  text-indent: 2em;
  text-align: justify;
}
img {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 2em auto;
  border-radius: 12px;
  box-shadow: 0 8px 25px rgba(44, 62, 80, 0.1);
  border: 1px solid #e0e0e0;
}
.caption {
  font-size: 0.9em;
  color: #7f8c8d;
  text-align: center;
  margin-top: -1.5em;
  margin-bottom: 2em;
  text-indent: 0;
}
blockquote {
  margin: 1.5em 0;
  padding: 0.5em 1em;
  border-left: 4px solid #85c1e9;
  background-color: #eaf2f8;
  color: #5d6d7e;
  border-radius: 0 4px 4px 0;
}
ul, ol {
  margin: 1em 0;
  padding-left: 2em;
}
li {
  margin-bottom: 0.5em;
}
hr {
  border: 0;
  height: 5px;
  background-image: linear-gradient(to right, rgba(0, 0, 0, 0), rgba(52, 152, 219, 0.75), rgba(0, 0, 0, 0));
  margin: 2em auto;
}
/* TOC Specific Styles */
.toc-list { list-style-type: none; padding: 0; margin: 1em 0; }
.toc-item { margin-bottom: 0.6em; }
.toc-link { text-decoration: none; color: #3498db; display: block; padding: 0.6em 1em; background: #fff; border-radius: 8px; box-shadow: 0 2px 5px rgba(44, 62, 80, 0.05); transition: all 0.2s; border: 1px solid #eaf2f8; }
.toc-link:hover { transform: translateX(5px); background: #fdfdfd; box-shadow: 0 4px 8px rgba(44, 62, 80, 0.1); }
.toc-level-2 { margin-left: 1.5em; font-size: 0.9em; opacity: 0.9; }
.toc-level-2 .toc-link { background: rgba(255,255,255,0.6); }

/* Cover Page Styles */
body.cover-page { margin: 0; padding: 0; height: 100vh; overflow: hidden; background-color: #f0f8ff; }
.cover-container { width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; }
.cover-image { max-width: 100%; max-height: 100%; object-fit: contain; margin: 0; border: none; padding: 0; background: none; box-shadow: none; }
`
  },
  {
    id: 'dreamy',
    name: '梦幻',
    css: `
body { 
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; 
  color: #5e4b56; 
  background-image: linear-gradient(to bottom, #fff0f6 0%, #fff 100%);
  line-height: 1.8;
  padding: 0 1.5em;
} 
h1 { 
  text-align: center; 
  margin-top: 1.5em; 
  margin-bottom: 1em;
  font-weight: 700;
  color: #ec4899; /* Pink-500 */
  text-shadow: 2px 2px 0px #fce7f3;
  letter-spacing: 1px;
} 
h2 { 
  margin-top: 1.5em; 
  margin-bottom: 1em;
  font-weight: 600;
  color: #3b82f6; /* Blue-500 */
  border-bottom: 2px dashed #93c5fd;
  padding-bottom: 0.3em;
  display: inline-block;
}
p {
  text-indent: 2em;
  margin-bottom: 1em;
}
img {
  max-width: 90%;
  height: auto;
  display: block;
  margin: 2em auto;
  border-radius: 16px;
  border: 4px solid #fff;
  box-shadow: 0 4px 15px rgba(236, 72, 153, 0.15);
}
.caption {
  font-size: 0.9em;
  color: #db2777;
  text-align: center;
  margin-top: -1.5em;
  margin-bottom: 2em;
  text-indent: 0;
  opacity: 0.9;
}
blockquote {
  margin: 1.5em 1em;
  padding: 1em 1.5em;
  border-left: none;
  border-radius: 12px;
  background-color: #f0f9ff; /* Light Blue */
  border: 1px solid #bae6fd;
  color: #0369a1;
  font-style: italic;
  position: relative;
}
blockquote::before {
  content: "❝";
  font-size: 2em;
  color: #bae6fd;
  position: absolute;
  top: -10px;
  left: 10px;
}
hr {
  border: 0;
  height: 1px;
  background-image: linear-gradient(to right, transparent, #ec4899, transparent);
  margin: 2.5em auto;
  opacity: 0.5;
}
/* TOC Specific Styles */
.toc-list { list-style-type: none; padding: 0; margin: 1em 0; }
.toc-item { margin-bottom: 0.5em; }
.toc-link { text-decoration: none; color: #db2777; display: block; padding: 0.5em 1em; border-radius: 8px; transition: background 0.2s; }
.toc-link:hover { background: #fce7f3; color: #be185d; }
.toc-level-2 { padding-left: 2em; font-size: 0.9em; color: #64748b; }
.toc-level-2 .toc-link { color: #475569; }

/* Cover Page Styles */
body.cover-page { margin: 0; padding: 0; height: 100vh; overflow: hidden; background-color: #fff0f6; }
.cover-container { width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; }
.cover-image { max-width: 100%; max-height: 100%; object-fit: contain; margin: 0; border: none; padding: 0; background: none; box-shadow: none; }
`
  },
  {
    id: 'pudding',
    name: '布丁',
    css: `
body { 
  font-family: "Varela Round", "Nunito", "Yu Yuan", "YouYuan", "Microsoft YaHei", sans-serif;
  color: #78350f; /* Amber-900 */
  background-color: #fffbeb; /* Amber-50 */
  line-height: 1.9; 
  padding: 0 1.5em;
} 
h1 { 
  font-size: 2em; 
  text-align: center;
  background: #fff;
  border: 3px solid #fcd34d; /* Amber-300 */
  border-radius: 30px;
  padding: 0.5em 1em;
  margin: 1.5em auto;
  color: #92400e; /* Amber-800 */
  font-weight: bold;
  box-shadow: 4px 4px 0px #fcd34d;
  width: fit-content;
}
h2 {
  font-size: 1.4em;
  color: #b45309; /* Amber-700 */
  margin-top: 1.5em;
  padding-left: 0.5em;
  border-left: 6px solid #f59e0b;
  border-radius: 4px;
}
p {
  text-indent: 2em;
  margin-bottom: 1em;
}
img {
  max-width: 90%;
  height: auto;
  display: block;
  margin: 2.5em auto;
  border-radius: 24px;
  border: 6px solid #fff;
  box-shadow: 0 4px 12px rgba(180, 83, 9, 0.1);
}
.caption {
  font-size: 0.9em;
  color: #92400e;
  text-align: center;
  margin-top: -2em;
  margin-bottom: 2em;
  text-indent: 0;
  opacity: 0.8;
}
blockquote {
  margin: 1.5em 1em;
  padding: 1.2em;
  background-color: #fff;
  border-radius: 20px;
  color: #92400e;
  border: 2px dashed #fcd34d;
}
hr {
  border: 0;
  height: 2px;
  background-color: #fcd34d;
  margin: 2.5em auto;
  width: 50%;
  border-radius: 2px;
}
/* TOC Specific Styles */
.toc-list { list-style-type: none; padding: 0; margin: 2em 0; }
.toc-item { margin-bottom: 0.8em; }
.toc-link { text-decoration: none; color: #92400e; font-weight: bold; display: block; padding: 0.8em; background: #fff; border-radius: 16px; border: 2px solid #fef3c7; transition: all 0.2s; }
.toc-link:hover { transform: scale(1.02); border-color: #fcd34d; background: #fffbeb; }
.toc-level-2 { margin-left: 1.5em; font-size: 0.9em; }
.toc-level-2 .toc-link { background: rgba(255,255,255,0.5); border: none; }

/* Cover Page Styles */
body.cover-page { margin: 0; padding: 0; height: 100vh; overflow: hidden; background-color: #fffbeb; }
.cover-container { width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; }
.cover-image { max-width: 100%; max-height: 100%; object-fit: contain; margin: 0; border: none; padding: 0; background: none; box-shadow: none; }
`
  }
];