import type { BookStyle } from '../types';

export const dreamyTheme: BookStyle = {
  id: 'dreamy',
  name: '梦幻',
  css: `
body {
  font-family: "Helvetica Neue", "Noto Sans SC", Arial, sans-serif;
  color: #5e4b56;
  background-color: #fff6fb;
  line-height: 1.8;
  padding: 0 1.4em;
}

h1 {
  text-align: center;
  margin-top: 1.6em;
  margin-bottom: 1em;
  font-weight: 700;
  color: #ec4899;
  letter-spacing: 0.06em;
}

h2 {
  margin-top: 1.5em;
  margin-bottom: 0.9em;
  font-weight: 600;
  color: #3b82f6;
  border-bottom: 2px dashed #93c5fd;
  padding-bottom: 0.3em;
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
  border-radius: 12px;
  border: 4px solid #fff;
}

.caption {
  font-size: 0.9em;
  color: #db2777;
  text-align: center;
  margin-top: -1.3em;
  margin-bottom: 2em;
  text-indent: 0;
}

blockquote {
  margin: 1.5em 1em;
  padding: 1em 1.2em;
  border-radius: 10px;
  background-color: #f0f9ff;
  border: 1px solid #bae6fd;
  color: #0369a1;
  font-style: italic;
}

hr, .divider-1, .divider-2, .divider-3, .divider-4, .divider-5 {
  text-align: center;
  margin: 2.4em auto;
  height: 1.5em;
  position: relative;
  clear: both;
  border: none;
  width: 70%;
  overflow: visible;
}

hr {
  border-top: 1px solid #ec4899;
}

hr:after {
  content: "*";
  display: inline-block;
  color: #ec4899;
  background: #fff6fb;
  padding: 0 10px;
  position: absolute;
  top: -0.75em;
  left: 50%;
  transform: translateX(-50%);
}

.divider-1 { border-top: 1px solid #f9a8d4; }
.divider-1:after {
  content: "♥ ♥ ♥";
  display: inline-block;
  color: #ec4899;
  background: #fff6fb;
  padding: 0 10px;
  position: absolute;
  top: -0.75em;
  left: 50%;
  transform: translateX(-50%);
}

.divider-2 { border-top: 1px solid #bae6fd; }
.divider-2:after {
  content: "* * *";
  display: inline-block;
  color: #3b82f6;
  background: #fff6fb;
  padding: 0 10px;
  position: absolute;
  top: -0.75em;
  left: 50%;
  transform: translateX(-50%);
}

.divider-3 { border-top: 1px dashed #f9a8d4; }
.divider-3:after {
  content: "♡ ♡ ♡";
  display: inline-block;
  color: #db2777;
  background: #fff6fb;
  padding: 0 10px;
  position: absolute;
  top: -0.75em;
  left: 50%;
  transform: translateX(-50%);
}

.divider-4 { border: none; }
.divider-4:after {
  content: "★ ☆ ★";
  display: inline-block;
  color: #f472b6;
  letter-spacing: 0.3em;
}

.divider-5 {
  border-top: 1px solid #f472b6;
}

@media (max-width: 768px) {
  hr, .divider-1, .divider-2, .divider-3, .divider-4, .divider-5 { width: 90%; }
}

strong, b { font-weight: bold; color: #be185d; }
em, i { font-style: italic; color: #db2777; }
u { text-decoration: underline; text-decoration-color: #f472b6; text-decoration-style: double; }
s, strike, del { text-decoration: line-through; color: #cbd5e1; }
a { color: #db2777; text-decoration: none; border-bottom: 1px solid #f9a8d4; }

.toc-list { list-style-type: none; padding: 0; margin: 1em 0; }
.toc-item { margin-bottom: 0.5em; }
.toc-link { text-decoration: none; color: #db2777; display: block; padding: 0.5em 1em; border-radius: 8px; background: #fff; border: 1px solid #fce7f3; }
.toc-level-2 { padding-left: 2em; font-size: 0.9em; color: #64748b; }
.toc-level-2 .toc-link { color: #475569; }

body.cover-page { margin: 0; padding: 0; height: 100vh; overflow: hidden; background-color: #fff0f6; }
.cover-container { width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; }
.cover-image { max-width: 100%; max-height: 100%; object-fit: contain; margin: 0; border: none; padding: 0; background: none; }
`,
};
