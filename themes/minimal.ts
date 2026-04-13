import type { BookStyle } from '../types';

export const minimalTheme: BookStyle = {
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
`,
};
