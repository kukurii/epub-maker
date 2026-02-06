import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, Code, Settings, X, Key, Plus, ChevronDown, ChevronUp, BookTemplate, Info, ArrowRight } from 'lucide-react';
import { ProjectData, PRESET_STYLES, Chapter } from '../../types';
import { GoogleGenAI } from '@google/genai';

interface StylesViewProps {
  project: ProjectData;
  activeChapter: Chapter | undefined;
  onUpdateProject: (updates: Partial<ProjectData>) => void;
}

interface SnippetItem {
    name: string;
    code: string;
    description: string;
    epubUsage: string;
}

const STYLE_SNIPPETS: { category: string; items: SnippetItem[] }[] = [
  {
    category: '排版基础',
    items: [
      {
        name: '标准缩进',
        description: '为每个段落的第一行添加 2 个字符的缩进。',
        epubUsage: '这是中文电子书最标准的排版方式。兼容所有阅读器。',
        code: `/* 段落首行缩进2字符 */
p {
  text-indent: 2em;
  margin-bottom: 0;
  line-height: 1.8;
}`
      },
      {
        name: '段落间距',
        description: '段落之间不缩进，而是通过垂直间距来区分。',
        epubUsage: '常用于现代小说或西文排版。注意：部分旧设备可能强制添加缩进，需配合 text-indent: 0 使用。',
        code: `/* 段落之间增加间距 (无缩进) */
p {
  text-indent: 0;
  margin-bottom: 1em;
  line-height: 1.6;
}`
      },
      {
        name: '首段不缩进',
        description: '取消章节标题后第一个段落的缩进。',
        epubUsage: '常见于西文出版物设计。使用相邻兄弟选择器实现。',
        code: `/* 标题后的第一段不缩进 */
h1 + p, h2 + p {
  text-indent: 0;
}`
      },
      {
        name: '强制分页',
        description: '在章节标题前强制插入分页符。',
        epubUsage: '虽然 EPUB 通常会自动为章节文件分页，但在合并章节模式下此属性非常关键。',
        code: `/* 章节标题前强制分页 */
h1 {
  page-break-before: always;
}`
      }
    ]
  },
  {
    category: '装饰元素',
    items: [
      {
        name: '首字下沉',
        description: '放大段落的第一个字并使其下沉占多行高度。',
        epubUsage: '使用 ::first-letter 伪元素。注意：在 Kindle 等旧版墨水屏设备上支持可能不完美，建议测试。',
        code: `/* 第一段首字下沉 */
h1 + p::first-letter {
  font-size: 3em;
  float: left;
  line-height: 1;
  margin-right: 0.15em;
  font-weight: bold;
}`
      },
      {
        name: '引用样式',
        description: '为引用文本块添加左侧边框和背景色。',
        epubUsage: '使用 blockquote 标签。这是一种非常安全的样式，兼容性极佳。',
        code: `/* 引用块样式 */
blockquote {
  border-left: 4px solid #ccc;
  background-color: #f9f9f9;
  margin: 1.5em 1em;
  padding: 0.8em 1em;
  color: #555;
  font-style: italic;
}`
      },
      {
        name: '星号分割',
        description: '在水平分割线的位置显示星号装饰。',
        epubUsage: '使用伪元素 ::before 插入内容。部分极简阅读器可能不显示伪元素内容，但基本线条会保留。',
        code: `/* 星号分割线 */
hr {
  border: 0;
  text-align: center;
  margin: 2em auto;
}
hr:before {
  content: "* * *";
  font-size: 1.5em;
  color: #888;
}`
      },
      {
        name: '竖排文字',
        description: '将文字排列方式改为从上到下、从右到左。',
        epubUsage: '古籍风格必备。注意：对阅读器要求较高（需支持 CSS3 writing-mode），在 Apple Books 上效果最好，老旧设备可能失效。',
        code: `/* 竖排文字 (古籍模式) */
body {
  writing-mode: vertical-rl;
  -webkit-writing-mode: vertical-rl;
  text-orientation: upright;
  margin: 2em;
  height: auto;
}
/* 提示：竖排时数字需横向处理或使用中文数字 */`
      }
    ]
  },
  {
    category: '图片与代码',
    items: [
      {
        name: '图片美化',
        description: '为图片添加圆角和阴影，使其看起来像一张照片卡片。',
        epubUsage: 'box-shadow 在 e-ink 设备上可能不可见，但在手机/平板阅读器上效果很好。',
        code: `/* 图片圆角与阴影 */
img {
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  margin: 1.5em auto;
  display: block;
}`
      },
      {
        name: '图注说明',
        description: '专门用于图片下方文字的样式，字体较小且居中。',
        epubUsage: '建议在 HTML 中使用 <p class="caption"> 包裹图注文字。',
        code: `/* 图片下方的注释文字 */
.caption {
  font-size: 0.85em;
  color: #666;
  text-align: center;
  margin-top: -1em;
  margin-bottom: 2em;
}`
      },
      {
        name: '代码块',
        description: '为代码片段提供等宽字体、背景色和滚动条。',
        epubUsage: 'pre 标签结合 overflow-x: auto 可以防止长代码撑破屏幕布局。',
        code: `/* 代码块样式 */
pre {
  background: #f4f4f4;
  padding: 10px;
  border-radius: 6px;
  overflow-x: auto;
  border: 1px solid #ddd;
  font-family: monospace;
}`
      }
    ]
  }
];

const StylesView: React.FC<StylesViewProps> = ({ project, activeChapter, onUpdateProject }) => {
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [stylePreviewMode, setStylePreviewMode] = useState<'chapter' | 'toc'>('chapter');
  const [showSnippets, setShowSnippets] = useState(false);
  
  // Snippet Info Modal State
  const [infoSnippet, setInfoSnippet] = useState<SnippetItem | null>(null);

  // API Key State
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
      const storedKey = localStorage.getItem('gemini_api_key');
      if (storedKey) setApiKey(storedKey);
  }, []);

  const handleSaveApiKey = () => {
      localStorage.setItem('gemini_api_key', apiKey);
      setShowApiKeyModal(false);
  };

  const isPresetActive = project.isPresetStyleActive !== false;

  const handleAiGenerateCss = async () => {
    if (!aiPrompt || isAiGenerating) return;
    
    // Prioritize user key, fallback to env key
    const keyToUse = apiKey || process.env.API_KEY;

    if (!keyToUse) {
        alert("请先配置 Gemini API Key (点击魔法样式旁边的小齿轮)");
        setShowApiKeyModal(true);
        return;
    }

    setIsAiGenerating(true);
    try {
        const ai = new GoogleGenAI({ apiKey: keyToUse });
        
        const activeStyle = PRESET_STYLES.find(s => s.id === project.activeStyleId) || PRESET_STYLES[0];
        const baseCssForContext = isPresetActive ? activeStyle.css : '/* No base theme active. Generate from scratch. */ body { font-family: sans-serif; }';

        const fullPrompt = `
        You are an expert ebook developer and designer specializing in CSS for EPUB 3 files.
        Your task is to generate CSS code based on a user's request to style a book's content.
        The user is working with a base stylesheet. You should generate *only* the additional or overriding CSS code.
        Do not wrap the code in markdown backticks like \`\`\`css.

        Strict Rules for EPUB:
        1. **Images**: Always ensure images are responsive inside the EPUB reader. Use \`max-width: 100%; height: auto;\` to prevent horizontal scrolling.
        2. **Layout**: Avoid fixed pixel widths for containers. Use percentages or \`em/rem\` units to support various screen sizes (phones to tablets).
        3. **Typography**: Ensure high readability. Avoid extremely small fonts. Use relative units (\`em\` or \`rem\`) for font sizes so they scale with user settings.
        4. **Theme**: Capture the overall mood described by the user (e.g., "vintage", "sci-fi", "romance").

        Focus on:
        - Typography (font-family, size, line-height, text-indent).
        - Headings (h1, h2).
        - Images (img styling, borders, shadows, filters).
        - Blockquotes and decorative dividers (hr).

        Base CSS for context:
        \`\`\`css
        ${baseCssForContext}
        \`\`\`

        User's request: "${aiPrompt}"

        Now, generate the custom CSS code.
        `;
        
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: fullPrompt
        });

        const generatedCss = response.text?.replace(/```css/g, '').replace(/```/g, '').trim() || '';
        
        if (generatedCss) {
            onUpdateProject({ customCSS: generatedCss });
        }

    } catch (error) {
        console.error("AI CSS generation failed:", error);
        alert("AI 样式生成失败，请检查 API Key 或网络连接。");
    } finally {
        setIsAiGenerating(false);
    }
  };

  const insertSnippet = (code: string) => {
      const current = project.customCSS || '';
      const separator = current && !current.endsWith('\n') ? '\n\n' : '';
      onUpdateProject({ customCSS: current + separator + code });
      setInfoSnippet(null);
  };

  const handleTogglePresetStyle = () => {
    onUpdateProject({ isPresetStyleActive: !isPresetActive });
  };

  // Preview Logic
  let previewContent = '';
  const activeStyle = PRESET_STYLES.find(s => s.id === project.activeStyleId);

  if (stylePreviewMode === 'chapter') {
      previewContent = activeChapter ? activeChapter.content : '<h1>示例章节</h1><p>这是一个预览段落。请选择一个章节以查看实际效果。</p><p>这是第二段，用于展示段落间距或缩进效果。</p><blockquote>这是一个引用块的示例文字。</blockquote><hr/><p>下方是图片示例：</p><div style="background:#eee;height:100px;display:flex;align-items:center;justify-content:center;color:#999;border:1px dashed #ccc;margin:1em 0;">[图片占位]</div><p class="caption">图1.1 示例图片说明</p>';
  } else {
      const tocItems = project.chapters.map((c, index) => {
           const levelClass = c.level === 2 ? 'toc-level-2' : 'toc-level-1';
           return `<li class="toc-item ${levelClass}"><a class="toc-link" href="#">${c.title}</a></li>`;
      }).join('');
      previewContent = `<h1>目录</h1><ul class="toc-list">${tocItems || '<li class="toc-item">暂无章节</li>'}</ul>`;
  }

  const safeCustomCSS = project.customCSS.replace(/<\/style>/gi, '<\\/style>');
  // Include Extra Files CSS
  const extraCssContent = project.extraFiles?.filter(f => f.type === 'css' && f.isActive !== false).map(f => f.content).join('\n') || '';
  const safeExtraCSS = extraCssContent.replace(/<\/style>/gi, '<\\/style>');
  
  const presetCss = isPresetActive ? (activeStyle?.css || '') : '/* Preset style disabled */';
  const iframeSrc = `<!DOCTYPE html><html lang="zh"><head><meta charset="utf-8"><style>html, body { margin: 0; padding: 0; min-height: 100%; width: 100%; box-sizing: border-box; } ${presetCss} ${safeCustomCSS} ${safeExtraCSS}</style></head><body>${previewContent}</body></html>`;

  return (
    <div className="flex h-full bg-[#F5F5F7] relative">
        <div className="w-96 flex-none flex flex-col border-r border-gray-200 bg-white p-6 overflow-y-auto space-y-8 z-10">
            <div>
               <div className="flex justify-between items-center mb-4">
                 <h2 className="text-xl font-bold text-gray-800">预设主题</h2>
                 <label className="flex items-center cursor-pointer">
                    <span className={`mr-3 text-sm font-medium ${isPresetActive ? 'text-gray-900' : 'text-gray-400'}`}>
                        {isPresetActive ? '已启用' : '已停用'}
                    </span>
                    <div className="relative">
                        <input type="checkbox" className="sr-only peer" checked={isPresetActive} onChange={handleTogglePresetStyle} />
                        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </div>
                 </label>
               </div>
               <div className={`grid grid-cols-2 gap-3 transition-opacity ${!isPresetActive ? 'opacity-40 pointer-events-none' : ''}`}>
                   {PRESET_STYLES.map(style => (<button key={style.id} onClick={() => onUpdateProject({ activeStyleId: style.id })} className={`w-full text-center px-4 py-3 rounded-xl border-2 transition-all ${ project.activeStyleId === style.id ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold shadow-sm' : 'border-gray-100 hover:border-gray-200 text-gray-600' }`}>{style.name}</button>))}
               </div>
            </div>
            
            <div className="flex bg-gray-100 p-1 rounded-lg">
                <button onClick={() => setStylePreviewMode('chapter')} className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${stylePreviewMode === 'chapter' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>正文预览</button>
                <button onClick={() => setStylePreviewMode('toc')} className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${stylePreviewMode === 'toc' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>目录预览</button>
            </div>

            <div className="flex-1 flex flex-col min-h-[300px]">
                <div className="relative">
                    <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center justify-between">
                        <div className="flex items-center">
                            <Sparkles size={20} className="mr-2 text-yellow-500"/> AI 魔法样式
                        </div>
                        <button 
                            onClick={() => setShowApiKeyModal(!showApiKeyModal)} 
                            className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                            title="设置 API Key"
                        >
                            <Settings size={18} />
                        </button>
                    </h2>

                    {showApiKeyModal && (
                        <div className="absolute top-10 right-0 z-20 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 animate-in fade-in slide-in-from-top-2">
                             <div className="flex justify-between items-center mb-3">
                                <h3 className="text-sm font-bold text-gray-800 flex items-center"><Key size={14} className="mr-1.5 text-blue-500"/> 设置 Gemini API</h3>
                                <button onClick={() => setShowApiKeyModal(false)} className="text-gray-400 hover:text-gray-600"><X size={14}/></button>
                             </div>
                             <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                                输入您的 API Key 以启用 AI 生成功能。Key 将仅存储在您的浏览器本地。
                             </p>
                             <input 
                                type="password" 
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none mb-3 font-mono"
                                placeholder="sk-..."
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                             />
                             <div className="flex justify-end">
                                <button 
                                    onClick={handleSaveApiKey} 
                                    className="bg-blue-600 text-white text-xs font-bold py-1.5 px-4 rounded-lg hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20"
                                >
                                    保存配置
                                </button>
                             </div>
                        </div>
                    )}
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100 space-y-3 mb-6">
                    <textarea className="w-full h-20 bg-white/70 text-sm p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none shadow-inner" placeholder="请用自然语言描述您想要的样式...&#10;例如：我想要复古羊皮纸的感觉，图片带一点棕褐色调。" value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} />
                    <button onClick={handleAiGenerateCss} disabled={isAiGenerating || !aiPrompt} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-lg flex items-center justify-center transition-all shadow-md shadow-blue-500/20 active:scale-95 font-semibold text-sm disabled:bg-blue-300 disabled:cursor-not-allowed">
                        {isAiGenerating ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Sparkles size={16} className="mr-2" />}
                        {isAiGenerating ? '正在施展魔法...' : '生成样式'}
                    </button>
                </div>
                
                <div className="flex items-center justify-between mb-3 cursor-pointer group" onClick={() => setShowSnippets(!showSnippets)}>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center"><Code size={20} className="mr-2 text-purple-500"/> 自定义 CSS</h2>
                    <button className="text-xs font-medium text-gray-500 flex items-center hover:text-blue-600 transition-colors">
                        <BookTemplate size={14} className="mr-1" />
                        {showSnippets ? '隐藏代码库' : '展开代码库'}
                        {showSnippets ? <ChevronUp size={14} className="ml-1"/> : <ChevronDown size={14} className="ml-1"/>}
                    </button>
                </div>
                
                {/* CSS Snippets Toolbar */}
                {showSnippets && (
                    <div className="mb-4 bg-gray-50 p-3 rounded-xl border border-gray-200 animate-in slide-in-from-top-2 fade-in duration-300">
                        {STYLE_SNIPPETS.map((category, catIdx) => (
                            <div key={catIdx} className="mb-3 last:mb-0">
                                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{category.category}</h3>
                                <div className="flex flex-col gap-1.5">
                                    {category.items.map((snippet, idx) => (
                                        <div key={idx} className="group flex items-center gap-1.5">
                                            <button
                                                onClick={() => insertSnippet(snippet.code)}
                                                className="flex-1 flex items-center text-[10px] bg-white border border-gray-200 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 text-gray-600 px-2 py-1.5 rounded transition-all shadow-sm text-left truncate"
                                            >
                                                <Plus size={10} className="mr-1.5 flex-shrink-0" />
                                                <span className="truncate">{snippet.name}</span>
                                            </button>
                                            <button 
                                                onClick={() => setInfoSnippet(snippet)}
                                                className="p-1.5 text-gray-300 hover:text-blue-500 bg-white border border-gray-100 hover:border-blue-300 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-200"
                                                title="查看详情"
                                            >
                                                <Info size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <textarea className="flex-1 w-full bg-gray-900 text-green-400 font-mono text-xs p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none shadow-inner" placeholder="/* 输入 CSS 覆盖样式，或使用上方按钮插入常用样式 */" value={project.customCSS} onChange={(e) => onUpdateProject({ customCSS: e.target.value })} />
            </div>
        </div>

        <div className="flex-1 bg-gray-100 p-8 overflow-y-auto flex justify-center">
            <div className="w-full max-w-[800px] h-[1000px] bg-white shadow-xl">
                 <iframe title="Style Preview" srcDoc={iframeSrc} className="w-full h-full border-none" />
            </div>
        </div>

        {/* Snippet Info Modal */}
        {infoSnippet && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                                <Code size={16} />
                            </div>
                            <h3 className="font-bold text-gray-800">{infoSnippet.name}</h3>
                        </div>
                        <button onClick={() => setInfoSnippet(null)} className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200 transition-colors">
                            <X size={18} />
                        </button>
                    </div>
                    
                    <div className="p-5 space-y-4">
                        <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">功能描述</h4>
                            <p className="text-sm text-gray-700 leading-relaxed">{infoSnippet.description}</p>
                        </div>
                        
                        <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3">
                            <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1 flex items-center">
                                <Info size={12} className="mr-1"/> EPUB 兼容性
                            </h4>
                            <p className="text-xs text-blue-800 leading-relaxed">{infoSnippet.epubUsage}</p>
                        </div>

                        <div>
                             <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">代码预览</h4>
                             <div className="bg-gray-900 rounded-lg p-3 relative group">
                                <pre className="text-xs font-mono text-green-400 overflow-x-auto whitespace-pre-wrap break-all">
                                    {infoSnippet.code}
                                </pre>
                             </div>
                        </div>
                    </div>

                    <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
                        <button 
                            onClick={() => setInfoSnippet(null)} 
                            className="px-4 py-2 text-sm text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            关闭
                        </button>
                        <button 
                            onClick={() => insertSnippet(infoSnippet.code)} 
                            className="px-4 py-2 text-sm bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex items-center"
                        >
                            应用到预览 <ArrowRight size={14} className="ml-1.5"/>
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default StylesView;