import type { BookStyle } from '../types';

export const elegantTheme: BookStyle = {
  id: 'elegant',
  name: '优雅',
  css: `
body {
  font-family: "Georgia", "Times New Roman", "Songti SC", "SimSun", serif;
  line-height: 1.75;
  margin: 0;
  padding: 0 1.2em;
  text-align: justify;
  color: #333344;
  background-color: #faf8ff;
}

h1, h2, h3, h4, h5, h6 {
  font-family: "Georgia", "Times New Roman", serif;
  text-align: center;
  font-weight: bold;
  color: #5d4e8d;
}

h1 {
  font-size: 1.8em;
  margin: 1.4em 0 1em;
  padding-bottom: 0.35em;
  border-bottom: 2px solid #d8bfff;
  letter-spacing: 0.04em;
}

h2 {
  font-size: 1.35em;
  margin: 1.2em 0 0.8em;
}

h3 {
  font-size: 1.15em;
  margin: 0.9em 0 0.6em;
}

p {
  text-indent: 2em;
  font-size: 1em;
  margin-bottom: 0.9em;
}

img {
  max-width: 100%;
  height: auto;
  margin: 2em auto;
  display: block;
  page-break-inside: avoid;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

blockquote {
  margin: 1.2em 1.5em;
  font-style: italic;
  border-left: 3px solid #b19cd9;
  padding: 0.6em 1em;
  background-color: rgba(208, 196, 249, 0.1);
}

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

hr { border-top: 1px solid #b19cd9; }
hr:after {
  content: "✧";
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

.divider-1 { border-top: 1px solid #d8bfff; }
.divider-1:after {
  content: "✦ ✧ ✦";
  display: inline-block;
  background: #faf8ff;
  color: #9575cd;
  padding: 0 10px;
  position: absolute;
  top: -0.7em;
  left: 50%;
  transform: translateX(-50%);
}

.divider-2 { border-top: 1px solid #d8bfff; }
.divider-2:after {
  content: "◇ ◈ ◇";
  display: inline-block;
  background: #faf8ff;
  color: #8c7ae6;
  padding: 0 10px;
  position: absolute;
  top: -0.7em;
  left: 50%;
  transform: translateX(-50%);
}

.divider-3 { border-top: 1px solid #d8bfff; }
.divider-3:after {
  content: "❀ ✿ ❀";
  display: inline-block;
  background: #faf8ff;
  color: #b19cd9;
  padding: 0 10px;
  position: absolute;
  top: -0.7em;
  left: 50%;
  transform: translateX(-50%);
}

.divider-4 { border: none; }
.divider-4:after {
  content: "• • •";
  display: inline-block;
  color: #9575cd;
  letter-spacing: 0.5em;
}

.divider-5 { border-top: 2px double #d8bfff; }
.divider-5:after {
  content: "✦";
  display: inline-block;
  background: #faf8ff;
  color: #9575cd;
  padding: 0 12px;
  position: absolute;
  top: -0.75em;
  left: 50%;
  transform: translateX(-50%);
}

@media (max-width: 768px) {
  hr, .divider-1, .divider-2, .divider-3, .divider-4, .divider-5 { width: 90%; }
}

strong, b { font-weight: bold; color: #333344; }
em, i { font-style: italic; color: #5d4e8d; }
a { color: #5d4e8d; text-decoration: none; border-bottom: 1px solid #b19cd9; }

.toc-list { list-style-type: none; padding: 0; margin: 1em 0; }
.toc-item { margin-bottom: 0.6em; }
.toc-link { text-decoration: none; color: #333344; display: block; padding: 0.5em 0; border-bottom: 1px dashed #b19cd9; }
.toc-level-2 { padding-left: 2em; font-size: 0.9em; opacity: 0.8; }

body.cover-page { margin: 0; padding: 0; height: 100vh; overflow: hidden; background-color: #faf8ff; }
.cover-container { width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; }
.cover-image { max-width: 100%; max-height: 100%; object-fit: contain; margin: 0; border: none; padding: 0; background: none; }
`,
};
