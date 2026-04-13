import type { BookStyle } from '../types';

export const ancientTheme: BookStyle = {
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
`,
};
