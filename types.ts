
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
}

export interface BookStyle {
  id: string;
  name: string;
  css: string;
}

export interface ProjectData {
  metadata: Metadata;
  chapters: Chapter[];
  images: ImageAsset[];
  cover: string | null; // Base64 data url
  coverCustomCSS?: string; // New: Custom CSS for cover generation
  activeStyleId: string;
  customCSS: string;
}

export type ViewMode = 'files' | 'chapters' | 'metadata' | 'styles' | 'images' | 'cover';

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
    id: 'night',
    name: '夜间',
    css: `
body { 
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
  color: #e0e0e0; 
  background: #121212; 
  line-height: 1.8;
  text-align: justify;
  padding: 0 1em;
} 
h1 { 
  text-align: center; 
  margin-top: 2em; 
  margin-bottom: 1.5em;
  font-weight: bold;
  color: #ffffff;
  page-break-before: always;
} 
h2 { 
  margin-top: 1.5em; 
  margin-bottom: 1em;
  font-weight: bold;
  border-bottom: 1px solid #333;
  padding-bottom: 0.3em;
  color: #f5f5f5;
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
  border: 1px solid #444;
  padding: 4px;
  background: #222;
  filter: brightness(0.9);
}
blockquote {
  margin: 1.5em 2em;
  padding-left: 1em;
  border-left: 3px solid #555;
  color: #aaa;
}
hr {
  border: 0;
  height: 1px;
  background: #444;
  margin: 2em auto;
}
/* TOC Specific Styles */
.toc-list { list-style-type: none; padding: 0; margin: 1em 2em; }
.toc-item { margin-bottom: 0.5em; border-bottom: 1px solid #333; padding-bottom: 0.5em; }
.toc-link { text-decoration: none; color: #e0e0e0; display: block; transition: color 0.2s; }
.toc-link:hover { color: #fff; }
.toc-level-2 { padding-left: 2em; font-size: 0.9em; color: #aaa; }

/* Cover Page Styles */
body.cover-page { margin: 0; padding: 0; height: 100vh; overflow: hidden; background-color: #121212; }
.cover-container { width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; }
.cover-image { max-width: 100%; max-height: 100%; object-fit: contain; margin: 0; border: none; padding: 0; background: none; box-shadow: none; }
`
  },
  {
    id: 'tech',
    name: '科技',
    css: `
body { 
  font-family: "Menlo", "Consolas", "Monaco", monospace; 
  color: #00ffc3; 
  background-color: #0d1117;
  line-height: 1.7; 
  padding: 0 1.5em;
} 
h1 { 
  font-family: "Orbitron", sans-serif; /* A bit niche, might fallback */
  font-size: 2.2em; 
  text-align: left;
  border-bottom: 1px solid #30363d; 
  padding-bottom: 0.5em; 
  margin-top: 1.5em;
  margin-bottom: 1em;
  color: #58a6ff;
  font-weight: 700;
  text-shadow: 0 0 5px rgba(88, 166, 255, 0.5);
}
h2 {
  font-family: "Orbitron", sans-serif;
  font-size: 1.5em;
  color: #1f6feb;
  margin-top: 1.5em;
  border-left: 3px solid #58a6ff;
  padding-left: 0.5em;
  font-weight: 500;
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
  border: 1px solid #30363d;
  filter: grayscale(50%) contrast(1.2);
}
blockquote {
  margin: 1.5em 1em;
  padding: 1em;
  border: 1px solid #30363d;
  background-color: rgba(88, 166, 255, 0.05);
  border-radius: 4px;
  color: #8b949e;
}
hr {
  border: 0;
  height: 1px;
  background-image: linear-gradient(to right, transparent, #58a6ff, transparent);
  margin: 2.5em auto;
}
/* TOC Specific Styles */
.toc-list { list-style-type: none; padding: 0; margin: 2em 0; }
.toc-item { margin-bottom: 0.5em; border-left: 2px solid #30363d; padding-left: 1em; transition: border-color 0.2s; }
.toc-item:hover { border-left-color: #58a6ff; }
.toc-link { text-decoration: none; color: #58a6ff; display: block; font-family: "Orbitron", sans-serif; }
.toc-link:hover { text-shadow: 0 0 8px rgba(88, 166, 255, 0.6); color: #fff; }
.toc-level-2 { margin-left: 1.5em; font-size: 0.9em; border-left-color: #1f6feb; }

/* Cover Page Styles */
body.cover-page { margin: 0; padding: 0; height: 100vh; overflow: hidden; background-color: #0d1117; }
.cover-container { width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; }
.cover-image { max-width: 100%; max-height: 100%; object-fit: contain; margin: 0; border: none; padding: 0; background: none; box-shadow: none; }
`
  }
];