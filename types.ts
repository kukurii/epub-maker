

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
  excludeFromToc?: boolean; // If true, this chapter will not appear in TOC files (toc.xhtml, toc.ncx)
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

// Added isActive and targetChapterIds property
export interface ExtraFile {
  id: string;
  filename: string;
  content: string;
  type: 'css' | 'text' | 'xml'; 
  isActive?: boolean;
  targetChapterIds?: string[]; // If undefined, applies globally (legacy). If array, applies only to listed IDs.
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
  cover: string | null; // Base64 data url
  coverId?: string | null; // ID of the image in 'images' array if cover is a reference
  coverCustomCSS?: string; // New: Custom CSS for cover generation
  coverDesign?: CoverDesign;
  activeStyleId: string;
  isPresetStyleActive?: boolean; // New: Flag to enable/disable preset styles
  customCSS: string;
  coverGeneratorState?: CoverGeneratorState; // New: Persist the generator UI state
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
  background-color: #fafafa;
}
ul, ol {
  margin: 1em 2em;
  padding-left: 2em;
}
li {
  margin-bottom: 0.5em;
}
/* ===== 分割线样式 ===== */
hr, .divider-1, .divider-2, .divider-3, .divider-4, .divider-5 {
  text-align: center;
  margin: 2em auto;
  height: 1.5em;
  position: relative;
  clear: both;
  border: none;
  width: 70%;
  overflow: visible;
}
/* 样式1 (hr/默认)：单线+星号 */
hr { border-top: 1px solid #999; }
hr:after {
  content: "*";
  display: inline-block;
  color: #666;
  font-size: 1.1em;
  position: absolute;
  top: -0.75em;
  left: 50%;
  transform: translateX(-50%);
  background: #fff;
  padding: 0 10px;
}
/* 样式2：三星 */
.divider-1 { border-top: 1px solid #999; }
.divider-1:after {
  content: "* * *";
  display: inline-block;
  color: #555;
  background: #fff;
  padding: 0 10px;
  position: absolute;
  top: -0.75em;
  left: 50%;
  transform: translateX(-50%);
}
/* 样式3：花饰线 */
.divider-2 { border-top: 2px double #bbb; }
.divider-2:after {
  content: "- - -";
  display: inline-block;
  color: #999;
  background: #fff;
  padding: 0 10px;
  position: absolute;
  top: -0.75em;
  left: 50%;
  transform: translateX(-50%);
  letter-spacing: 0.3em;
}
/* 样式4：菱形 */
.divider-3 { border-top: 1px solid #ccc; }
.divider-3:after {
  content: "o - o - o";
  display: inline-block;
  color: #888;
  background: #fff;
  padding: 0 10px;
  position: absolute;
  top: -0.75em;
  left: 50%;
  transform: translateX(-50%);
}
/* 样式5：圆点 */
.divider-4 { border: none; }
.divider-4:after {
  content: ". . . . .";
  display: inline-block;
  color: #aaa;
  letter-spacing: 0.4em;
  font-size: 1.2em;
}
/* 样式6：短横线组 */
.divider-5 { border: none; }
.divider-5:after {
  content: "—  —  —";
  display: inline-block;
  color: #bbb;
  letter-spacing: 0.3em;
}
@media (max-width: 768px) {
  hr, .divider-1, .divider-2, .divider-3, .divider-4, .divider-5 { width: 90%; }
}
/* Inline Elements */
strong, b { font-weight: bold; color: #000; }
em, i { font-style: italic; }
u { text-decoration: underline; text-underline-offset: 3px; }
s, strike, del { text-decoration: line-through; color: #888; }
a { color: #0056b3; text-decoration: none; border-bottom: 1px solid #0056b3; }
a:hover { color: #003d80; border-bottom-color: #003d80; }

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
/* ===== 分割线样式 ===== */
hr, .divider-1, .divider-2, .divider-3, .divider-4, .divider-5 {
  text-align: center;
  margin: 2.5em auto;
  height: 1.5em;
  position: relative;
  clear: both;
  border: none;
  width: 70%;
  overflow: visible;
}
/* 样式1 (hr/默认)：单线+菱形 */
hr { border-top: 1px solid #8d6e63; }
hr:after {
  content: "◇";
  display: inline-block;
  color: #8d6e63;
  font-size: 1.2em;
  position: absolute;
  top: -0.75em;
  left: 50%;
  transform: translateX(-50%);
  background: #fdf5e6;
  padding: 0 10px;
}
/* 样式2：三菱 */
.divider-1 { border-top: 1px solid #a58768; }
.divider-1:after {
  content: "◇ ◇ ◇";
  display: inline-block;
  color: #8d6e63;
  background: #fdf5e6;
  padding: 0 10px;
  position: absolute;
  top: -0.75em;
  left: 50%;
  transform: translateX(-50%);
}
/* 样式3：卷草纹 */
.divider-2 { border-top: 1px solid #a58768; }
.divider-2:after {
  content: "❧";
  display: inline-block;
  color: #795548;
  background: #fdf5e6;
  padding: 0 10px;
  font-size: 1.4em;
  position: absolute;
  top: -0.8em;
  left: 50%;
  transform: translateX(-50%);
}
/* 样式4：波浪 */
.divider-3 { border-top: 1px dashed #c4a882; }
.divider-3:after {
  content: "〜  〜  〜";
  display: inline-block;
  color: #a58768;
  background: #fdf5e6;
  padding: 0 10px;
  position: absolute;
  top: -0.75em;
  left: 50%;
  transform: translateX(-50%);
}
/* 样式5：双线 */
.divider-4 { border-top: 2px double #c4a882; }
.divider-4:after {
  content: "◆";
  display: inline-block;
  color: #8d6e63;
  background: #fdf5e6;
  padding: 0 12px;
  position: absolute;
  top: -0.75em;
  left: 50%;
  transform: translateX(-50%);
}
/* 样式6：古典圆点 */
.divider-5 { border: none; }
.divider-5:after {
  content: "•  •  •";
  display: inline-block;
  color: #a58768;
  font-size: 1.3em;
  letter-spacing: 0.5em;
}
@media (max-width: 768px) {
  hr, .divider-1, .divider-2, .divider-3, .divider-4, .divider-5 { width: 90%; }
}
/* Inline Elements */
strong, b { font-weight: bold; color: #3e2723; }
em, i { font-style: italic; }
u { text-decoration: underline; text-decoration-style: dashed; text-underline-offset: 4px; text-decoration-color: #8d6e63; }
s, strike, del { text-decoration: line-through; color: #a1887f; }
a { color: #5d4037; text-decoration: none; border-bottom: 1px solid #8d6e63; }

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
/* ===== 分割线样式 ===== */
hr, .divider-1, .divider-2, .divider-3, .divider-4, .divider-5 {
  text-align: center;
  margin: 3em auto;
  height: 1.5em;
  position: relative;
  clear: both;
  border: none;
  width: 60%;
  overflow: visible;
}
/* 样式1 (hr/默认)：细线 */
hr { border-top: 1px solid #e0e0e0; }
/* 样式2：淡灰三点 */
.divider-1 { border: none; }
.divider-1:after {
  content: ". . .";
  display: inline-block;
  color: #ccc;
  letter-spacing: 0.6em;
  font-size: 1.1em;
}
/* 样式3：长破折号 */
.divider-2 { border: none; }
.divider-2:after {
  content: "———";
  display: inline-block;
  color: #ddd;
  letter-spacing: 0.1em;
  font-size: 1.2em;
}
/* 样式4：细虚线 */
.divider-3 { border-top: 1px dashed #ddd; }
/* 样式5：双线 */
.divider-4 { border-top: 2px double #e0e0e0; }
/* 样式6：居中短线 */
.divider-5 {
  border: none;
  width: 30%;
  border-top: 1px solid #ccc;
}
@media (max-width: 768px) {
  hr, .divider-1, .divider-2, .divider-3 { width: 80%; }
  .divider-5 { width: 50%; }
}
/* Inline Elements */
strong, b { font-weight: 600; color: #000; }
em, i { font-style: italic; color: #555; }
u { text-decoration: underline; text-underline-offset: 3px; text-decoration-color: #999; }
s, strike, del { text-decoration: line-through; color: #bbb; }
a { color: #333; text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 2px; }

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
/* ===== 分割线样式 ===== */
hr, .divider-1, .divider-2, .divider-3, .divider-4, .divider-5 {
  text-align: center;
  margin: 2em auto;
  height: 1.5em;
  position: relative;
  clear: both;
  border: none;
  width: 70%;
  overflow: visible;
}
/* 样式1 (hr/默认)：渐层蓝色渐变线 */
hr {
  border-top: 1px solid #3498db;
  opacity: 0.5;
}
hr:after {
  content: "▵ ▵ ▵";
  display: inline-block;
  color: #3498db;
  font-size: 0.8em;
  position: absolute;
  top: -0.75em;
  left: 50%;
  transform: translateX(-50%);
  background: #f0f8ff;
  padding: 0 10px;
}
/* 样式2：蓝色波形 */
.divider-1 { border-top: 1px solid #85c1e9; }
.divider-1:after {
  content: "∼  ∼  ∼";
  display: inline-block;
  color: #3498db;
  background: #f0f8ff;
  padding: 0 10px;
  position: absolute;
  top: -0.75em;
  left: 50%;
  transform: translateX(-50%);
  font-size: 1.1em;
}
/* 样式3：蓮形 */
.divider-2 { border-top: 1px solid #85c1e9; }
.divider-2:after {
  content: "⬥ ⬥ ⬥";
  display: inline-block;
  color: #2980b9;
  background: #f0f8ff;
  padding: 0 10px;
  position: absolute;
  top: -0.75em;
  left: 50%;
  transform: translateX(-50%);
}
/* 样式4：雪花 */
.divider-3 { border-top: 1px dashed #b3d9f5; }
.divider-3:after {
  content: "❅";
  display: inline-block;
  color: #2980b9;
  background: #f0f8ff;
  padding: 0 12px;
  position: absolute;
  top: -0.75em;
  left: 50%;
  transform: translateX(-50%);
  font-size: 1.2em;
}
/* 样式5：三点 */
.divider-4 { border: none; }
.divider-4:after {
  content: "• • •";
  display: inline-block;
  color: #85c1e9;
  letter-spacing: 0.5em;
  font-size: 1.2em;
}
/* 样式6：渐变宽线 */
.divider-5 {
  background-image: linear-gradient(to right, rgba(0,0,0,0), rgba(52,152,219,0.5), rgba(0,0,0,0));
  height: 2px;
  margin: 2em auto;
}
@media (max-width: 768px) {
  hr, .divider-1, .divider-2, .divider-3, .divider-4, .divider-5 { width: 90%; }
}
/* Inline Elements */
strong, b { font-weight: bold; color: #2c3e50; }
em, i { font-style: italic; color: #3498db; }
u { text-decoration: underline; text-decoration-color: #3498db; text-decoration-style: wavy; text-underline-offset: 3px; }
s, strike, del { text-decoration: line-through; color: #95a5a6; }
a { color: #3498db; text-decoration: none; border-bottom: 1px dashed #3498db; }

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
/* ===== 分割线样式 ===== */
hr, .divider-1, .divider-2, .divider-3, .divider-4, .divider-5 {
  text-align: center;
  margin: 2.5em auto;
  height: 1.5em;
  position: relative;
  clear: both;
  border: none;
  width: 70%;
  overflow: visible;
}
/* 样式1 (hr)：粉色渐变线 */
hr {
  background-image: linear-gradient(to right, transparent, #ec4899, transparent);
  height: 1px;
  opacity: 0.5;
}
/* 样式2：心形 */
.divider-1 { border-top: 1px solid #f9a8d4; }
.divider-1:after {
  content: "♥ ♥ ♥";
  display: inline-block;
  color: #ec4899;
  background: #fff0f6;
  padding: 0 10px;
  position: absolute;
  top: -0.75em;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.9em;
}
/* 样式3：花形 */
.divider-2 { border-top: 1px solid #bae6fd; }
.divider-2:after {
  content: "✨";
  display: inline-block;
  color: #3b82f6;
  background: #fff;
  padding: 0 12px;
  position: absolute;
  top: -0.75em;
  left: 50%;
  transform: translateX(-50%);
  font-size: 1.1em;
}
/* 样式4：淡粉虚线 */
.divider-3 { border-top: 1px dashed #f9a8d4; }
.divider-3:after {
  content: "♡  ♡  ♡";
  display: inline-block;
  color: #db2777;
  background: #fff;
  padding: 0 10px;
  position: absolute;
  top: -0.75em;
  left: 50%;
  transform: translateX(-50%);
}
/* 样式5：星形三点 */
.divider-4 { border: none; }
.divider-4:after {
  content: "★  ☆  ★";
  display: inline-block;
  color: #f472b6;
  letter-spacing: 0.3em;
  font-size: 1em;
}
/* 样式6：双色渐变线 */
.divider-5 {
  background-image: linear-gradient(to right, transparent, #ec4899, #93c5fd, transparent);
  height: 2px;
  opacity: 0.6;
}
@media (max-width: 768px) {
  hr, .divider-1, .divider-2, .divider-3, .divider-4, .divider-5 { width: 90%; }
}
/* Inline Elements */
strong, b { font-weight: bold; color: #be185d; }
em, i { font-style: italic; color: #db2777; }
u { text-decoration: underline; text-decoration-color: #f472b6; text-decoration-style: double; }
s, strike, del { text-decoration: line-through; color: #cbd5e1; }
a { color: #db2777; text-decoration: none; background: linear-gradient(to top, #fce7f3 50%, transparent 50%); }

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
/* ================================================== */
/*                 布丁风格主题设计                     */
/* ================================================== */

:root {
  --pudding-yellow: #ffee99;
  --pudding-light: #fff8e1;
  --pudding-brown: #d4a76a;
  --accent-color: #ff9e80;
  --text-color: #6d5c43;
  --title-color: #c17e45;
  --background-color: #fffdf7;
  --border-color: #f5e2bc;
}

body {
  font-family: "Rounded Mplus 1c", "Noto Sans SC", sans-serif;
  line-height: 1.7;
  color: var(--text-color);
  background-color: var(--background-color);
  padding: 1.5em;
  max-width: 100%;
}

h1, h2, h3, h4 {
  color: var(--title-color);
  text-align: center;
  margin-bottom: 0.5em;
  text-shadow: 1px 1px 0 rgba(255, 255, 255, 0.7);
}

h1 {
  font-size: 2em;
  margin-bottom: 0.7em;
}

h2 {
  font-size: 1.7em;
  color: var(--accent-color);
}

h3 {
  font-size: 1.4em;
  margin-top: 0.5em;
}

h4 {
  font-size: 1.1em;
  font-weight: normal;
  font-style: italic;
  color: var(--pudding-brown);
  opacity: 0.9;
}

.chapter, #toc, #title-page {
  position: relative;
  margin: 2em auto;
  background-color: #fff;
  border-radius: 20px;
  padding: 2em;
  box-shadow: 0 5px 15px rgba(210, 180, 140, 0.15);
  border: 2px solid var(--pudding-yellow);
  overflow: hidden;
}

.chapter-title-wrap {
  position: relative;
  margin-bottom: 2.5em;
  text-align: center;
  padding: 1em 0;
  background-color: var(--pudding-light);
  border-radius: 15px;
  border: 1px dashed var(--pudding-brown);
}

.chapter-title {
  font-size: 1.8em;
  color: var(--title-color);
  text-align: center;
  font-weight: bold;
  margin-bottom: 0.5em;
  letter-spacing: 0.05em;
}

p {
  text-indent: 2em;
  margin-bottom: 1.2em;
  line-height: 1.8;
}

blockquote {
  margin: 1.5em 1em;
  padding: 1.2em;
  background-color: #fff;
  border-radius: 20px;
  color: #92400e;
  border: 2px dashed var(--pudding-yellow);
}

/* ===== 分割线样式 ===== */
hr, .divider-1, .divider-2, .divider-3, .divider-4, .divider-5 {
  text-align: center;
  margin: 2.5em auto;
  height: 1.5em;
  position: relative;
  clear: both;
  border: none;
  width: 60%;
  overflow: visible;
}
/* 样式1 (hr)：暨色实线 */
hr {
  height: 2px;
  background-color: var(--pudding-yellow);
  border-radius: 2px;
}
/* 样式2：花形三幺 */
.divider-1 { border-top: 1px solid var(--pudding-yellow); }
.divider-1:after {
  content: "✨ ✨ ✨";
  display: inline-block;
  color: var(--accent-color);
  background: var(--background-color);
  padding: 0 10px;
  position: absolute;
  top: -0.75em;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.9em;
}
/* 样式3：心形 */
.divider-2 { border-top: 1px dashed var(--border-color); }
.divider-2:after {
  content: "♥  ♥  ♥";
  display: inline-block;
  color: var(--accent-color);
  background: var(--background-color);
  padding: 0 10px;
  position: absolute;
  top: -0.75em;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.85em;
}
/* 样式4：烧糖圆点 */
.divider-3 { border: none; }
.divider-3:after {
  content: "•  •  •";
  display: inline-block;
  color: var(--pudding-brown);
  letter-spacing: 0.5em;
  font-size: 1.3em;
}
/* 样式5：双线 */
.divider-4 {
  height: 0;
  border-top: 3px double var(--pudding-yellow);
}
/* 样式6：乔女虹 */
.divider-5 {
  background-image: linear-gradient(to right, transparent, var(--pudding-yellow), var(--accent-color), var(--pudding-yellow), transparent);
  height: 3px;
  border-radius: 3px;
  opacity: 0.7;
}
@media (max-width: 768px) {
  hr, .divider-1, .divider-2, .divider-3, .divider-4, .divider-5 { width: 85%; }
}

img {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 1.5em auto;
  border-radius: 15px;
  box-shadow: 0 3px 10px rgba(210, 180, 140, 0.3);
  border: 5px solid white;
}

a {
  color: var(--title-color);
  text-decoration: none;
}

a:hover {
  color: var(--accent-color);
}

code {
  display: inline-block;
  background-color: #fff;
  color: var(--accent-color);
  padding: 0.3em 0.8em;
  margin: 0.3em;
  border-radius: 15px;
  font-family: inherit;
  font-size: 0.9em;
  border: 1px solid var(--pudding-yellow);
}

#title-page {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 70vh;
  text-align: center;
}

.title {
  font-size: 2.5em;
  color: var(--title-color);
  margin-bottom: 0.3em;
  letter-spacing: 0.1em;
}

.subtitle {
  font-size: 1.5em;
  color: var(--accent-color);
  margin-bottom: 1em;
  font-weight: normal;
}

.author {
  margin-top: 1.5em;
  font-size: 1.3em;
  color: var(--pudding-brown);
}

/* TOC Specific Styles */
.toc-list, #toc ul { list-style-type: none; padding: 0; margin: 2em 0; }
.toc-item, #toc li { margin-bottom: 0.8em; }
.toc-link, #toc a { text-decoration: none; color: var(--text-color); display: block; padding: 0.8em 1.5em; border-radius: 10px; background-color: var(--pudding-light); border: 1px solid transparent; }
.toc-link:hover, #toc a:hover { background-color: #fff; border: 1px solid var(--pudding-yellow); box-shadow: 0 3px 8px rgba(210, 180, 140, 0.2); }
.toc-level-2 { margin-left: 1.5em; font-size: 0.9em; }
.toc-level-2 .toc-link { background: rgba(255,255,255,0.5); }

/* Cover Page Styles */
body.cover-page { margin: 0; padding: 0; height: 100vh; overflow: hidden; background-color: #fffdf7; }
.cover-container { width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; }
.cover-image { max-width: 100%; max-height: 100%; object-fit: contain; margin: 0; border: none; padding: 0; background: none; box-shadow: none; }
`
  },
  {
    id: 'elegant',
    name: '优雅',
    css: `
/* 基本页面设置 */
@page {
  margin: 5pt;
}

body {
  font-family: serif;
  line-height: 1.6;
  margin: 0;
  padding: 0 3%;
  text-align: justify;
  color: #333344;
  background-color: #faf8ff;
}

p {
  text-indent: 2em;
  font-size: 1.1em;
  line-height: 1.8;
  text-align: justify;
  position: relative;
}

h1, h2, h3, h4, h5, h6 {
  font-family: serif;
  text-align: center;
  font-weight: bold;
  color: #5d4e8d;
}

h1 {
  font-size: 1.7em;
  margin: 1.2em 0 0.8em;
  border-bottom: 2px solid #d8bfff;
  padding-bottom: 0.3em;
}

h2 {
  font-size: 1.4em;
  margin: 1em 0;
}

h3 {
  font-size: 1.2em;
  margin: 0.8em 0;
}

img {
  max-width: 100%;
  height: auto;
  margin: 2em auto;
  display: block;
  page-break-inside: avoid;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.full-page-image {
  width: 100%;
  height: 100%;
  max-height: 100vh;
  object-fit: contain;
  margin: 0;
  padding: 0;
  display: block;
  page-break-before: always;
  page-break-after: always;
}

.page-image-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100vh;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  page-break-before: always;
  page-break-after: always;
}

.page-image-container img {
  max-width: calc(100% - 2em);
  max-height: calc(100% - 2em);
  margin: 1em;
  box-sizing: border-box;
}

blockquote {
  margin: 1.2em 2em;
  font-style: italic;
  border-left: 3px solid #b19cd9;
  padding: 0.5em 1em;
  background-color: rgba(208, 196, 249, 0.1);
}

/* ===== 各种场景分割线样式 ===== */
hr, .divider-1, .divider-2, .divider-3, .divider-4, .divider-5 {
  text-align: center;
  margin: 2em auto;
  height: 1.5em;
  position: relative;
  clear: both;
  border: none;
  width: 70%;
  overflow: visible;
}

@supports (content: "✧") {
  /* 样式1(hr/默认)：单线+星号 */
  hr { border-top: 1px solid #b19cd9; }
  hr:after {
    content: "✧";
    display: inline-block;
    color: #9575cd;
    font-size: 1.2em;
    position: absolute;
    top: -0.7em;
    left: 50%;
    transform: translateX(-50%);
    background-color: #faf8ff;
    padding: 0 10px;
  }
  /* 样式2：三星星辰 */
  .divider-1 { border-top: 1px solid #d8bfff; }
  .divider-1:after {
    content: "✦ ✧ ✦";
    color: #9575cd;
    display: inline-block;
    background-color: #faf8ff;
    padding: 0 10px;
    position: absolute;
    top: -0.7em;
    left: 50%;
    transform: translateX(-50%);
  }
  /* 样式3：菱形符号 */
  .divider-2 { border-top: 1px solid #d8bfff; }
  .divider-2:after {
    content: "◇ ◈ ◇";
    color: #8c7ae6;
    display: inline-block;
    background-color: #faf8ff;
    padding: 0 10px;
    position: absolute;
    top: -0.7em;
    left: 50%;
    transform: translateX(-50%);
  }
  /* 样式4：花朵符号 */
  .divider-3 { border-top: 1px solid #d8bfff; }
  .divider-3:after {
    content: "❀ ✿ ❀";
    color: #b19cd9;
    display: inline-block;
    background-color: #faf8ff;
    padding: 0 10px;
    position: absolute;
    top: -0.7em;
    left: 50%;
    transform: translateX(-50%);
  }
  /* 样式5：简单圆点 */
  .divider-4 { border: none; }
  .divider-4:after {
    content: "• • •";
    color: #9575cd;
    font-size: 1.2em;
    letter-spacing: 0.5em;
    display: inline-block;
  }
  /* 样式6：双线+星 */
  .divider-5 { border-top: 2px double #d8bfff; }
  .divider-5:after {
    content: "✦";
    color: #9575cd;
    display: inline-block;
    background-color: #faf8ff;
    padding: 0 12px;
    position: absolute;
    top: -0.75em;
    left: 50%;
    transform: translateX(-50%);
    font-size: 1.1em;
  }
}

@supports not (content: "✧") {
  hr, .divider-1 { border-top: 1px solid #b19cd9; border-bottom: none; border-left: none; border-right: none; }
  .divider-2, .divider-3, .divider-4 { border-top: 1px solid #d8bfff; border-bottom: none; border-left: none; border-right: none; }
  hr:after, .divider-1:after {
    content: "*";
    display: inline-block;
    position: absolute;
    background: #faf8ff;
    color: #9575cd;
    padding: 0 10px;
    top: -0.7em;
    left: 50%;
    transform: translateX(-50%);
    font-size: 1.2em;
  }
  .divider-2:after { content: "* * *"; display: inline-block; background: #faf8ff; padding: 0 10px; position: absolute; top: -0.7em; left: 50%; transform: translateX(-50%); color: #9575cd; }
  .divider-3:after { content: "o o o"; display: inline-block; background: #faf8ff; padding: 0 10px; position: absolute; top: -0.7em; left: 50%; transform: translateX(-50%); color: #8c7ae6; }
  .divider-4:after { content: "~ ~ ~"; display: inline-block; background: #faf8ff; padding: 0 10px; position: absolute; top: -0.7em; left: 50%; transform: translateX(-50%); color: #b19cd9; }
  .divider-5:after { content: ". . ."; display: inline-block; color: #9575cd; letter-spacing: 0.5em; }
}

@media (max-width: 768px) {
  hr, .divider-1, .divider-2, .divider-3, .divider-4, .divider-5 { width: 90%; }
}

/* Inline Elements */
strong, b { font-weight: bold; color: #333344; }
em, i { font-style: italic; color: #5d4e8d; }
a { color: #5d4e8d; text-decoration: none; border-bottom: 1px solid #b19cd9; }

/* TOC Specific Styles */
.toc-list { list-style-type: none; padding: 0; margin: 1em 0; }
.toc-item { margin-bottom: 0.6em; }
.toc-link { text-decoration: none; color: #333344; display: block; padding: 0.5em 0; border-bottom: 1px dashed #b19cd9; }
.toc-link:hover { color: #5d4e8d; }
.toc-level-2 { padding-left: 2em; font-size: 0.9em; opacity: 0.8; }

/* Cover Page Styles */
body.cover-page { margin: 0; padding: 0; height: 100vh; overflow: hidden; background-color: #faf8ff; }
.cover-container { width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; }
.cover-image { max-width: 100%; max-height: 100%; object-fit: contain; margin: 0; border: none; padding: 0; background: none; box-shadow: none; }
`
  }
,
  {
    id: 'epic',
    name: '史诗',
    css: `
body {
  font-family: "Palatino", "Georgia", "Times New Roman", "Songti SC", "SimSun", serif;
  color: #292522;
  background-color: #f5f0e8;
  line-height: 1.85;
  padding: 0 1.5em;
  text-align: justify;
}

h1 {
  font-family: "Palatino", "Georgia", "Times New Roman", serif;
  font-size: 1.9em;
  font-weight: 700;
  color: #2b2440;
  text-align: center;
  margin-top: 2em;
  margin-bottom: 1.8em;
  letter-spacing: 0.08em;
  line-height: 1.3;
  position: relative;
  padding-bottom: 0.8em;
}
h1:before {
  content: "✧ ◆ ✧";
  display: block;
  color: #b78d65;
  font-size: 0.5em;
  margin-bottom: 0.6em;
  letter-spacing: 0.5em;
  font-weight: normal;
}
h1:after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  height: 2px;
  background: linear-gradient(to right, transparent, #d2b48c, #b78d65, #d2b48c, transparent);
  border-radius: 2px;
}

h2 {
  font-family: "Palatino", "Georgia", "Times New Roman", serif;
  font-size: 1.35em;
  font-weight: 600;
  color: #3d3558;
  text-align: center;
  margin-top: 2em;
  margin-bottom: 1em;
  letter-spacing: 0.05em;
  padding-bottom: 0.4em;
  border-bottom: 1px solid #d2b48c;
}

p {
  text-indent: 2em;
  margin-bottom: 1em;
  font-size: 0.97em;
}

img {
  max-width: 90%;
  height: auto;
  display: block;
  margin: 2em auto;
  border: 6px solid #e0d6c7;
  border-radius: 4px;
  box-shadow: 0 4px 14px rgba(43, 36, 64, 0.15);
}

.caption {
  font-size: 0.88em;
  color: #5a5553;
  text-align: center;
  margin-top: -1.5em;
  margin-bottom: 2em;
  font-style: italic;
  text-indent: 0;
}

blockquote {
  margin: 1.5em 1em;
  padding: 0.8em 1em 0.8em 1.2em;
  border-left: 3px solid #d2b48c;
  color: #664e88;
  background: rgba(183, 141, 101, 0.06);
  font-style: italic;
  border-radius: 0 4px 4px 0;
}

ul, ol {
  margin: 1em 0;
  padding-left: 2.5em;
}
li {
  margin-bottom: 0.6em;
}

/* ===== 分割线样式 ===== */
hr, .divider-1, .divider-2, .divider-3, .divider-4, .divider-5 {
  text-align: center;
  margin: 2.5em auto;
  height: 1.5em;
  position: relative;
  clear: both;
  border: none;
  width: 70%;
  overflow: visible;
}
/* 样式1 (hr/默认)：金线+菱形 */
hr { border-top: 1px solid #c0b5a5; }
hr:after {
  content: "◈";
  display: inline-block;
  color: #b78d65;
  font-size: 1.1em;
  position: absolute;
  top: -0.75em;
  left: 50%;
  transform: translateX(-50%);
  background: #f5f0e8;
  padding: 0 10px;
}
/* 样式2：三星点缀 */
.divider-1 { border-top: 1px solid #c0b5a5; }
.divider-1:after {
  content: "✧  ◆  ✧";
  display: inline-block;
  color: #b78d65;
  background: #f5f0e8;
  padding: 0 10px;
  position: absolute;
  top: -0.75em;
  left: 50%;
  transform: translateX(-50%);
  letter-spacing: 0.2em;
  font-size: 0.9em;
}
/* 样式3：古纹菱花 */
.divider-2 { border-top: 1px solid #c0b5a5; }
.divider-2:after {
  content: "◈  ◈  ◈";
  display: inline-block;
  color: #664e88;
  background: #f5f0e8;
  padding: 0 10px;
  position: absolute;
  top: -0.75em;
  left: 50%;
  transform: translateX(-50%);
  letter-spacing: 0.2em;
  font-size: 0.85em;
}
/* 样式4：花叶 */
.divider-3 { border-top: 1px solid #d2b48c; }
.divider-3:after {
  content: "❀  ✿  ❀";
  display: inline-block;
  color: #b78d65;
  background: #f5f0e8;
  padding: 0 10px;
  position: absolute;
  top: -0.75em;
  left: 50%;
  transform: translateX(-50%);
  letter-spacing: 0.2em;
  font-size: 0.9em;
}
/* 样式5：圆点 */
.divider-4 { border: none; }
.divider-4:after {
  content: "•  •  •  •  •";
  display: inline-block;
  color: #9a7550;
  letter-spacing: 0.4em;
  font-size: 1.2em;
}
/* 样式6：渐变金线 */
.divider-5 {
  background: linear-gradient(to right, transparent, #d2b48c, #b78d65, #d2b48c, transparent);
  height: 1px;
  border: none;
  margin-top: 2.5em;
  margin-bottom: 2.5em;
}
.divider-5:after {
  content: "";
}
@media (max-width: 768px) {
  hr, .divider-1, .divider-2, .divider-3, .divider-4, .divider-5 { width: 90%; }
}

/* Inline Elements */
strong, b { font-weight: bold; color: #2b2440; }
em, i { font-style: italic; color: #664e88; }
u { text-decoration: underline; text-underline-offset: 3px; text-decoration-color: #d2b48c; }
s, strike, del { text-decoration: line-through; color: #8a8580; }
a { color: #664e88; text-decoration: none; border-bottom: 1px solid #d2b48c; }
a:hover { color: #2b2440; border-bottom-color: #b78d65; }

/* TOC Specific Styles */
.toc-list { list-style-type: none; padding: 0; margin: 1em 0; }
.toc-item { margin-bottom: 0.7em; }
.toc-link {
  text-decoration: none;
  color: #292522;
  display: block;
  padding: 0.5em 1em;
  border-radius: 6px;
  border: 1px solid transparent;
  border-bottom: 1px solid #e0d6c7;
  transition: all 0.2s;
}
.toc-link:hover {
  background: rgba(183, 141, 101, 0.08);
  border-color: #d2b48c;
  color: #2b2440;
  padding-left: 1.4em;
}
.toc-level-2 { padding-left: 2em; font-size: 0.9em; opacity: 0.85; }
.toc-level-2 .toc-link { border-bottom-style: dashed; }

/* Cover Page Styles */
body.cover-page { margin: 0; padding: 0; height: 100vh; overflow: hidden; background-color: #f5f0e8; }
.cover-container { width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; }
.cover-image { max-width: 100%; max-height: 100%; object-fit: contain; margin: 0; border: none; padding: 0; background: none; box-shadow: none; }
`
  }
];
