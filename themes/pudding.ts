import type { BookStyle } from '../types';

export const puddingTheme: BookStyle = {
  id: 'pudding',
  name: '布丁',
  css: `
body {
  --pudding-yellow: #ffee99;
  --pudding-light: #fff8e1;
  --pudding-brown: #d4a76a;
  --accent-color: #ff9e80;
  --text-color: #6d5c43;
  --title-color: #c17e45;
  --background-color: #fffdf7;
  --border-color: #f5e2bc;
  font-family: "Noto Sans SC", "Microsoft YaHei", sans-serif;
  line-height: 1.75;
  color: var(--text-color);
  background-color: var(--background-color);
  padding: 1.2em 1em;
  margin: 1em auto;
  max-width: 40em;
  border: 2px solid var(--pudding-yellow);
  border-radius: 18px;
}

h1, h2, h3, h4 {
  color: var(--title-color);
  text-align: center;
  margin-bottom: 0.5em;
}

h1 {
  font-size: 2em;
  margin: 0 0 0.9em;
  padding: 0.7em 0.9em;
  background-color: var(--pudding-light);
  border-radius: 14px;
  border: 1px dashed var(--pudding-brown);
}

h2 {
  font-size: 1.5em;
  color: var(--accent-color);
  margin-top: 1.4em;
}

p {
  text-indent: 2em;
  margin-bottom: 1em;
  line-height: 1.8;
}

blockquote {
  margin: 1.4em 1em;
  padding: 1em 1.2em;
  background-color: #fff;
  border-radius: 14px;
  color: #92400e;
  border: 2px dashed var(--pudding-yellow);
}

hr, .divider-1, .divider-2, .divider-3, .divider-4, .divider-5 {
  text-align: center;
  margin: 2.2em auto;
  height: 1.5em;
  position: relative;
  clear: both;
  border: none;
  width: 60%;
  overflow: visible;
}

hr {
  height: 2px;
  background-color: var(--pudding-yellow);
  border-radius: 2px;
}

.divider-1 { border-top: 1px solid var(--pudding-yellow); }
.divider-1:after {
  content: "✦ ✦ ✦";
  display: inline-block;
  color: var(--accent-color);
  background: var(--background-color);
  padding: 0 10px;
  position: absolute;
  top: -0.75em;
  left: 50%;
  transform: translateX(-50%);
}

.divider-2 { border-top: 1px dashed var(--border-color); }
.divider-2:after {
  content: "♥ ♥ ♥";
  display: inline-block;
  color: var(--accent-color);
  background: var(--background-color);
  padding: 0 10px;
  position: absolute;
  top: -0.75em;
  left: 50%;
  transform: translateX(-50%);
}

.divider-3 { border: none; }
.divider-3:after {
  content: "• • •";
  display: inline-block;
  color: var(--pudding-brown);
  letter-spacing: 0.5em;
  font-size: 1.2em;
}

.divider-4 {
  height: 0;
  border-top: 3px double var(--pudding-yellow);
}

.divider-5 { border-top: 1px solid var(--accent-color); }
.divider-5:after {
  content: "✦";
  display: inline-block;
  background: var(--background-color);
  color: var(--accent-color);
  padding: 0 12px;
  position: absolute;
  top: -0.75em;
  left: 50%;
  transform: translateX(-50%);
}

@media (max-width: 768px) {
  hr, .divider-1, .divider-2, .divider-3, .divider-4, .divider-5 { width: 85%; }
}

img {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 1.5em auto;
  border-radius: 12px;
  border: 4px solid white;
}

a {
  color: var(--title-color);
  text-decoration: none;
  border-bottom: 1px solid var(--pudding-brown);
}

code {
  display: inline-block;
  background-color: #fff;
  color: var(--accent-color);
  padding: 0.2em 0.6em;
  border-radius: 10px;
  font-family: inherit;
  font-size: 0.9em;
  border: 1px solid var(--pudding-yellow);
}

.toc-list { list-style-type: none; padding: 0; margin: 1.8em 0; }
.toc-item { margin-bottom: 0.8em; }
.toc-link { text-decoration: none; color: var(--text-color); display: block; padding: 0.8em 1.2em; border-radius: 10px; background-color: var(--pudding-light); border: 1px solid var(--border-color); }
.toc-level-2 { margin-left: 1.5em; font-size: 0.9em; }
.toc-level-2 .toc-link { background: rgba(255,255,255,0.5); }

body.cover-page { margin: 0; padding: 0; height: 100vh; overflow: hidden; background-color: #fffdf7; }
.cover-container { width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; }
.cover-image { max-width: 100%; max-height: 100%; object-fit: contain; margin: 0; border: none; padding: 0; background: none; }
`,
};
