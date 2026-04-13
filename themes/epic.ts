import type { BookStyle } from '../types';

export const epicTheme: BookStyle = {
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
  margin-bottom: 1.5em;
  letter-spacing: 0.08em;
  line-height: 1.3;
  padding-bottom: 0.7em;
  border-bottom: 2px solid #d2b48c;
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

.divider-1 { border-top: 1px solid #c0b5a5; }
.divider-1:after {
  content: "✧ ◆ ✧";
  display: inline-block;
  color: #b78d65;
  background: #f5f0e8;
  padding: 0 10px;
  position: absolute;
  top: -0.75em;
  left: 50%;
  transform: translateX(-50%);
  letter-spacing: 0.2em;
}

.divider-2 { border-top: 1px solid #c0b5a5; }
.divider-2:after {
  content: "◈ ◈ ◈";
  display: inline-block;
  color: #664e88;
  background: #f5f0e8;
  padding: 0 10px;
  position: absolute;
  top: -0.75em;
  left: 50%;
  transform: translateX(-50%);
  letter-spacing: 0.2em;
}

.divider-3 { border-top: 1px solid #d2b48c; }
.divider-3:after {
  content: "❀ ✿ ❀";
  display: inline-block;
  color: #b78d65;
  background: #f5f0e8;
  padding: 0 10px;
  position: absolute;
  top: -0.75em;
  left: 50%;
  transform: translateX(-50%);
  letter-spacing: 0.2em;
}

.divider-4 { border: none; }
.divider-4:after {
  content: "• • • • •";
  display: inline-block;
  color: #9a7550;
  letter-spacing: 0.4em;
  font-size: 1.2em;
}

.divider-5 { border-top: 2px double #d2b48c; }
.divider-5:after {
  content: "◆";
  display: inline-block;
  background: #f5f0e8;
  color: #b78d65;
  padding: 0 12px;
  position: absolute;
  top: -0.75em;
  left: 50%;
  transform: translateX(-50%);
}

@media (max-width: 768px) {
  hr, .divider-1, .divider-2, .divider-3, .divider-4, .divider-5 { width: 90%; }
}

strong, b { font-weight: bold; color: #2b2440; }
em, i { font-style: italic; color: #664e88; }
u { text-decoration: underline; text-underline-offset: 3px; text-decoration-color: #d2b48c; }
s, strike, del { text-decoration: line-through; color: #8a8580; }
a { color: #664e88; text-decoration: none; border-bottom: 1px solid #d2b48c; }

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
}
.toc-level-2 { padding-left: 2em; font-size: 0.9em; opacity: 0.85; }
.toc-level-2 .toc-link { border-bottom-style: dashed; }

body.cover-page { margin: 0; padding: 0; height: 100vh; overflow: hidden; background-color: #f5f0e8; }
.cover-container { width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; }
.cover-image { max-width: 100%; max-height: 100%; object-fit: contain; margin: 0; border: none; padding: 0; background: none; }
`,
};
