import type { BookStyle } from '../types';

export const classicTheme: BookStyle = {
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
`,
};
