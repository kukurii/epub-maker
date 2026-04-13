import type { BookStyle } from '../types';

export const freshTheme: BookStyle = {
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
.toc-link { text-decoration: none; color: #3498db; display: block; padding: 0.6em 1em; background: #fff; border-radius: 8px; box-shadow: 0 2px 5px rgba(44, 62, 80, 0.05); border: 1px solid #eaf2f8; }
.toc-level-2 { margin-left: 1.5em; font-size: 0.9em; opacity: 0.9; }
.toc-level-2 .toc-link { background: rgba(255,255,255,0.6); }

/* Cover Page Styles */
body.cover-page { margin: 0; padding: 0; height: 100vh; overflow: hidden; background-color: #f0f8ff; }
.cover-container { width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; }
.cover-image { max-width: 100%; max-height: 100%; object-fit: contain; margin: 0; border: none; padding: 0; background: none; box-shadow: none; }
`,
};
