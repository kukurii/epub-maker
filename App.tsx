import React, { useState, useEffect } from 'react';
import { ProjectData, ViewMode, PRESET_STYLES, Chapter, TocItem } from './types';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import Directory from './components/ChapterManager';
import CoverGenerator from './components/CoverGenerator';
import { generateEpub, parseTxtToChapters, parseEpub } from './services/epubService';
import { FileUp, BookOpen, Trash2, Settings2, CheckCircle2, Cloud, Code, Sparkles, Loader2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

const STORAGE_KEY = 'epub_maker_project_v1';
const API_KEY_STORAGE_KEY = 'GEMINI_API_KEY';

// Helper to extract clean text from an H1 tag
const extractH1Title = (html: string): string | null => {
    const match = html.match(/<h1.*?>(.*?)<\/h1>/i);
    if (match && match[1]) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = match[1];
        return tempDiv.textContent || tempDiv.innerText || null;
    }
    return null;
}

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewMode>('files');
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [scrollToAnchor, setScrollToAnchor] = useState<string | null>(null);
  const [splitRegex, setSplitRegex] = useState<string>("^\\s*(Chapter\\s+\\d+|第[0-9一二三四五六七八九十百千]+[章回节]|序章|尾声|引子)");
  const [showSplitSettings, setShowSplitSettings] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [tempApiKey, setTempApiKey] = useState('');
  const [stylePreviewMode, setStylePreviewMode] = useState<'chapter' | 'toc'>('chapter');
  
  const [project, setProject] = useState<ProjectData>({
    metadata: {
      title: '未命名书籍',
      creator: '未知作者',
      language: 'zh',
      description: '',
      publisher: '',
      date: new Date().toISOString().split('T')[0],
      series: '',
      subjects: []
    },
    chapters: [],
    images: [],
    cover: null,
    coverCustomCSS: '',
    activeStyleId: 'classic',
    customCSS: ''
  });

  // Load from LocalStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setProject(parsed);
        if (parsed.chapters && parsed.chapters.length > 0) {
           setActiveChapterId(parsed.chapters[0].id);
           setCurrentView('chapters');
        }
      } catch (e) {
        console.error("Failed to load project", e);
      }
    }
    const savedApiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (savedApiKey) {
        setApiKey(savedApiKey);
        setTempApiKey(savedApiKey);
    }
    setIsLoaded(true);
  }, []);

  // Save to LocalStorage on change
  useEffect(() => {
    if (isLoaded) {
      setSaveStatus('saving');
      const timeoutId = setTimeout(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
        setSaveStatus('saved');
      }, 800);
      return () => clearTimeout(timeoutId);
    }
  }, [project, isLoaded]);

  const handleReset = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    window.location.reload();
  };

  const activeChapter = project.chapters.find(c => c.id === activeChapterId);

  const handleTxtUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const parsedChapters = parseTxtToChapters(text, splitRegex);
        const newChapters: Chapter[] = parsedChapters.map((c, i) => ({
          id: Date.now().toString() + i,
          title: c.title,
          content: c.content,
          level: c.level,
          subItems: []
        }));
        setProject(prev => ({
          ...prev,
          metadata: { ...prev.metadata, title: file.name.replace(/\.txt$/i, '') },
          chapters: newChapters,
          images: [],
          cover: null,
        }));
        if (newChapters.length > 0) setActiveChapterId(newChapters[0].id);
        setCurrentView('chapters');
      };
      reader.readAsText(file);
    }
  };

  const handleEpubUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          try {
              const importedProject = await parseEpub(file);
              setProject(prev => ({ ...prev, ...importedProject }));
              if (importedProject.chapters && importedProject.chapters.length > 0) {
                  setActiveChapterId(importedProject.chapters[0].id);
              }
              setCurrentView('chapters');
          } catch (error) {
              console.error("Failed to parse EPUB:", error);
              alert(`EPUB 解析失败: ${error instanceof Error ? error.message : String(error)}`);
          }
      }
  };

  const updateChapterContent = (content: string, title?: string, subItems?: TocItem[]) => {
    if (!activeChapterId) return;
    setProject(prev => ({
      ...prev,
      chapters: prev.chapters.map(c => 
        c.id === activeChapterId 
          ? { ...c, content, title: title || c.title, subItems: subItems || c.subItems } 
          : c
      )
    }));
  };

  const handleSplitChapter = (beforeContent: string, afterContent: string) => {
      if (!activeChapterId) return;
      const currentIndex = project.chapters.findIndex(c => c.id === activeChapterId);
      if (currentIndex === -1) return;
      const currentChapter = project.chapters[currentIndex];
      const updatedCurrentChapter = { ...currentChapter, content: beforeContent };
      const newChapterId = Date.now().toString();
      const newChapter: Chapter = { id: newChapterId, title: '新建切分章节', content: afterContent, level: 1, subItems: [] };
      const newChapters = [...project.chapters];
      newChapters[currentIndex] = updatedCurrentChapter;
      newChapters.splice(currentIndex + 1, 0, newChapter);
      setProject(p => ({ ...p, chapters: newChapters }));
      setActiveChapterId(newChapterId);
  };

  const handleExport = () => {
    generateEpub(project);
  };

  const handleAiGenerateCss = async () => {
    if (!apiKey) {
      alert("请先设置您的 Gemini API 密钥。");
      setShowApiKeyModal(true);
      return;
    }
    if (!aiPrompt || isAiGenerating) return;

    setIsAiGenerating(true);
    try {
        const ai = new GoogleGenAI({ apiKey: apiKey });
        
        const activeStyle = PRESET_STYLES.find(s => s.id === project.activeStyleId) || PRESET_STYLES[0];

        const fullPrompt = `
        You are an expert book designer specializing in CSS for EPUB files. 
        Your task is to generate CSS code based on a user's request to style a book's content.
        The user is working with a base stylesheet. You should generate *only* the additional or overriding CSS code.
        Do not wrap the code in markdown backticks like \`\`\`css.

        Focus on:
        - Typography (font-family, size, line-height, text-indent).
        - Headings (h1, h2).
        - Images (img): ensure they are responsive and stylistically appropriate (e.g., borders, shadows, filters like sepia).
        - Blockquotes and other common elements.
        - The overall mood and theme described by the user.

        Base CSS for context:
        \`\`\`css
        ${activeStyle.css}
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
            setProject(p => ({ ...p, customCSS: generatedCss }));
        }

    } catch (error) {
        console.error("AI CSS generation failed:", error);
        alert("AI 样式生成失败，请检查您的 API 密钥是否正确或网络连接是否正常。");
    } finally {
        setIsAiGenerating(false);
    }
  };


  const renderFilesView = () => (
    <div className="p-10 flex flex-col items-center justify-center h-full bg-[#F5F5F7]">
      <div className="bg-white/80 backdrop-blur-md p-10 rounded-[2rem] shadow-2xl border border-white/50 max-w-2xl w-full text-center transition-all">
        <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600"><FileUp size={40} /></div>
        <h2 className="text-3xl font-bold mb-3 text-gray-900 tracking-tight">导入内容</h2>
        <p className="text-gray-500 mb-8 font-medium">从 TXT 创建新书，或导入 EPUB 继续编辑。</p>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <label className="block w-full cursor-pointer group">
              <input type="file" accept=".txt" onChange={handleTxtUpload} className="hidden" />
              <div className="w-full bg-black text-white font-semibold py-4 px-6 rounded-2xl transition-transform active:scale-95 shadow-lg flex items-center justify-center">选择 TXT 文件</div>
            </label>
            <label className="block w-full cursor-pointer group">
              <input type="file" accept=".epub" onChange={handleEpubUpload} className="hidden" />
              <div className="w-full bg-blue-600 text-white font-semibold py-4 px-6 rounded-2xl transition-transform active:scale-95 shadow-lg flex items-center justify-center">导入 EPUB 文件</div>
            </label>
        </div>
        <div className="border-t border-gray-100 pt-4">
           <button onClick={() => setShowSplitSettings(!showSplitSettings)} className="text-xs font-semibold text-gray-500 flex items-center justify-center w-full hover:text-blue-600 transition-colors">
             <Settings2 size={14} className="mr-1" /> {showSplitSettings ? '隐藏 TXT 高级设置' : '高级设置 (用于TXT导入)'}
           </button>
           {showSplitSettings && (
             <div className="mt-4 text-left bg-gray-50 p-4 rounded-xl border border-gray-200">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">TXT 章节标题匹配规则 (Regex)</label>
                <p className="text-[10px] text-gray-500 mb-2">如果你的小说章节格式特殊，请修改此正则表达式以便正确切分 TXT 文件。</p>
                <input type="text" className="w-full font-mono text-xs bg-white border border-gray-300 rounded-lg px-3 py-2 text-blue-600 focus:ring-2 focus:ring-blue-500 outline-none" value={splitRegex} onChange={(e) => setSplitRegex(e.target.value)} />
             </div>
           )}
        </div>
      </div>
    </div>
  );

  const renderMetadataView = () => (
    <div className="p-10 h-full bg-[#F5F5F7] overflow-y-auto">
      <h2 className="text-3xl font-bold mb-8 text-gray-900 tracking-tight">元数据 (Metadata)</h2>
      <div className="max-w-3xl space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
             <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">书名 (Title)</label>
             <input type="text" className="w-full text-lg font-semibold border-b border-gray-200 pb-2 focus:border-blue-500 outline-none bg-transparent" value={project.metadata.title} onChange={e => setProject(p => ({ ...p, metadata: { ...p.metadata, title: e.target.value } }))} />
        </div>
        <div className="grid grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">作者 (Author)</label>
                <input type="text" className="w-full font-medium border-b border-gray-200 pb-2 focus:border-blue-500 outline-none bg-transparent" value={project.metadata.creator} onChange={e => setProject(p => ({ ...p, metadata: { ...p.metadata, creator: e.target.value } }))} />
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">语言 (Language)</label>
                <input type="text" className="w-full font-medium border-b border-gray-200 pb-2 focus:border-blue-500 outline-none bg-transparent" value={project.metadata.language} onChange={e => setProject(p => ({ ...p, metadata: { ...p.metadata, language: e.target.value } }))} />
            </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
             <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">系列 (Series)</label>
             <input type="text" className="w-full font-medium border-b border-gray-200 pb-2 focus:border-blue-500 outline-none bg-transparent" placeholder="例如：哈利波特系列" value={project.metadata.series || ''} onChange={e => setProject(p => ({ ...p, metadata: { ...p.metadata, series: e.target.value } }))} />
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
             <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">标签 (Tags)</label>
             <input type="text" className="w-full font-medium border-b border-gray-200 pb-2 focus:border-blue-500 outline-none bg-transparent" placeholder="例如：奇幻, 魔法, 冒险 (用逗号分隔)" value={project.metadata.subjects?.join(', ') || ''} onChange={e => setProject(p => ({ ...p, metadata: { ...p.metadata, subjects: e.target.value.split(/[，,]/).map(s => s.trim()).filter(s => s) } }))} />
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
             <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">简介 (Description)</label>
             <textarea rows={5} className="w-full font-medium border-b border-gray-200 pb-2 focus:border-blue-500 outline-none bg-transparent resize-none" value={project.metadata.description} onChange={e => setProject(p => ({ ...p, metadata: { ...p.metadata, description: e.target.value } }))} />
        </div>
      </div>
    </div>
  );

  const renderImagesView = () => (
      <div className="p-8 h-full bg-[#F5F5F7] overflow-y-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 tracking-tight">图片素材</h2>
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-8 flex flex-col items-center justify-center border-dashed border-2 border-gray-200 hover:border-blue-400 transition-colors">
         <p className="text-gray-500 mb-4 font-medium">点击上传图片</p>
         <input type="file" accept="image/*" multiple className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-6 file:rounded-full file:border-0 file:bg-black file:text-white hover:file:bg-gray-800 cursor-pointer max-w-xs mx-auto" onChange={(e) => { if (e.target.files) { Array.from(e.target.files).forEach((file: File) => { const reader = new FileReader(); reader.onload = (ev) => { const data = ev.target?.result as string; setProject(p => ({ ...p, images: [...p.images, { id: Date.now().toString() + Math.random().toString(36).substr(2, 5), name: file.name, data, type: file.type }] })); }; reader.readAsDataURL(file); }); } }} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
         {project.images.map((img) => (
            <div key={img.id} className="relative group bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
               <div className="aspect-square bg-gray-50 rounded-xl mb-3 flex items-center justify-center overflow-hidden"><img src={img.data} alt={img.name} className="object-contain w-full h-full" /></div>
               <p className="text-xs truncate text-center text-gray-500 font-medium px-1">{img.name}</p>
               <button onClick={() => setProject(p => ({ ...p, images: p.images.filter(image => image.id !== img.id) }))} className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14} /></button>
            </div>
         ))}
      </div>
    </div>
  );

  const renderStylesView = () => {
    let previewContent = '';
    const activeStyle = PRESET_STYLES.find(s => s.id === project.activeStyleId);

    if (stylePreviewMode === 'chapter') {
        previewContent = activeChapter ? activeChapter.content : '<h1>示例章节</h1><p>这是一个预览段落。请选择一个章节以查看实际效果。</p>';
    } else {
        const tocItems = project.chapters.map((c, index) => {
             const levelClass = c.level === 2 ? 'toc-level-2' : 'toc-level-1';
             return `<li class="toc-item ${levelClass}"><a class="toc-link" href="#">${c.title}</a></li>`;
        }).join('');
        previewContent = `<h1>目录</h1><ul class="toc-list">${tocItems || '<li class="toc-item">暂无章节</li>'}</ul>`;
    }

    const iframeSrc = `<!DOCTYPE html><html lang="zh"><head><meta charset="utf-8"><style>html, body { margin: 0; padding: 0; min-height: 100%; width: 100%; box-sizing: border-box; } ${activeStyle?.css || ''} ${project.customCSS}</style></head><body>${previewContent}</body></html>`;
    
    return (
        <div className="flex h-full bg-[#F5F5F7]">
            <div className="w-96 flex-none flex flex-col border-r border-gray-200 bg-white p-6 overflow-y-auto space-y-8">
                <div>
                   <h2 className="text-xl font-bold mb-4 text-gray-800">预设主题</h2>
                   <div className="grid grid-cols-2 gap-3">
                       {PRESET_STYLES.map(style => (<button key={style.id} onClick={() => setProject(p => ({ ...p, activeStyleId: style.id }))} className={`w-full text-center px-4 py-3 rounded-xl border-2 transition-all ${ project.activeStyleId === style.id ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold shadow-sm' : 'border-gray-100 hover:border-gray-200 text-gray-600' }`}>{style.name}</button>))}
                   </div>
                </div>
                
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button onClick={() => setStylePreviewMode('chapter')} className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${stylePreviewMode === 'chapter' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>正文预览</button>
                    <button onClick={() => setStylePreviewMode('toc')} className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${stylePreviewMode === 'toc' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>目录预览</button>
                </div>

                <div className="flex-1 flex flex-col min-h-[300px]">
                    <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center justify-between">
                        <div className="flex items-center">
                            <Sparkles size={20} className="mr-2 text-yellow-500"/> AI 魔法样式
                        </div>
                        <button onClick={() => setShowApiKeyModal(true)} className="text-gray-400 hover:text-blue-500 p-1 rounded-full transition-colors" title="配置 API 密钥">
                            <Settings2 size={16} />
                        </button>
                    </h2>
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100 space-y-3 mb-6">
                        <textarea className="w-full h-20 bg-white/70 text-sm p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none shadow-inner" placeholder="请用自然语言描述您想要的样式...&#10;例如：我想要复古羊皮纸的感觉，图片带一点棕褐色调。" value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} />
                        <button onClick={handleAiGenerateCss} disabled={isAiGenerating || !aiPrompt} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-lg flex items-center justify-center transition-all shadow-md shadow-blue-500/20 active:scale-95 font-semibold text-sm disabled:bg-blue-300 disabled:cursor-not-allowed">
                            {isAiGenerating ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Sparkles size={16} className="mr-2" />}
                            {isAiGenerating ? '正在施展魔法...' : '生成样式'}
                        </button>
                    </div>
                    
                    <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center"><Code size={20} className="mr-2 text-purple-500"/> 自定义 CSS</h2>
                    <textarea className="flex-1 w-full bg-gray-900 text-green-400 font-mono text-xs p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none shadow-inner" placeholder="/* 输入 CSS 覆盖样式，或让 AI 为您生成 */" value={project.customCSS} onChange={(e) => setProject(p => ({ ...p, customCSS: e.target.value }))} />
                </div>
            </div>

            <div className="flex-1 bg-gray-100 p-8 overflow-y-auto flex justify-center">
                <div className="w-full max-w-[800px] h-[1000px] bg-white shadow-xl">
                     <iframe title="Style Preview" srcDoc={iframeSrc} className="w-full h-full border-none" />
                </div>
            </div>
        </div>
    )
  };

  return (
    <div className="flex h-screen bg-[#F5F5F7] font-sans text-gray-900 selection:bg-blue-100 selection:text-blue-800">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} onExport={handleExport} onReset={handleReset} />
      
      <main className="flex-1 flex overflow-hidden relative shadow-2xl rounded-l-[2.5rem] bg-[#F5F5F7] border-l border-white/50 ring-1 ring-black/5 clip-path-safe">
        <div className="absolute bottom-12 right-8 z-50 pointer-events-none transition-opacity duration-500 ease-in-out">
            <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full backdrop-blur-md border shadow-sm ${ saveStatus === 'saving' ? 'bg-yellow-50/80 border-yellow-200 text-yellow-600' : 'bg-green-50/80 border-green-200 text-green-600'}`}>
               {saveStatus === 'saving' ? <Cloud size={14} className="animate-pulse" /> : <CheckCircle2 size={14} />}
               <span className="text-xs font-medium">{saveStatus === 'saving' ? '保存中...' : '已自动保存'}</span>
            </div>
        </div>
        {currentView === 'chapters' && (
          <div className="w-80 border-r border-gray-100 bg-white/60 backdrop-blur-xl z-10 flex flex-col">
            <Directory chapters={project.chapters} currentChapterId={activeChapterId} onSelectChapter={(id) => { setActiveChapterId(id); setScrollToAnchor(null); }} onScrollToAnchor={(chapterId, anchorId) => { if (activeChapterId !== chapterId) setActiveChapterId(chapterId); setScrollToAnchor(anchorId); }} onUpdateChapters={(chapters) => setProject(p => ({ ...p, chapters }))} />
          </div>
        )}
        <div className="flex-1 bg-[#F5F5F7] relative overflow-hidden">
          {currentView === 'files' && renderFilesView()}
          {currentView === 'metadata' && renderMetadataView()}
          {currentView === 'styles' && renderStylesView()}
          {currentView === 'images' && renderImagesView()}
          {currentView === 'cover' && <CoverGenerator project={project} onUpdateCover={(cover) => setProject(p => ({ ...p, cover }))} onUpdateCoverCSS={(css) => setProject(p => ({ ...p, coverCustomCSS: css }))} apiKey={apiKey} onShowApiKeyModal={() => setShowApiKeyModal(true)} />}
          {currentView === 'chapters' && (activeChapter ? <Editor key={activeChapter.id} content={activeChapter.content} onContentChange={updateChapterContent} onSplitChapter={handleSplitChapter} project={project} scrollToId={scrollToAnchor} /> : <div className="flex flex-col items-center justify-center h-full text-gray-300"><BookOpen size={64} className="mb-4 opacity-20" /><p>请选择一个章节</p></div>)}
        </div>
      </main>

      {showApiKeyModal && (
        <div className="absolute inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-md w-full animate-in fade-in-0 zoom-in-95">
                <h3 className="text-lg font-bold mb-4">配置 API 密钥</h3>
                <p className="text-sm text-gray-500 mb-4">
                    AI 功能需要使用 Gemini API 密钥。您可以从 Google AI Studio 获取。
                </p>
                <input
                    type="password"
                    className="w-full font-mono text-sm bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="在此输入您的 API Key"
                    value={tempApiKey}
                    onChange={(e) => setTempApiKey(e.target.value)}
                />
                <div className="flex justify-end space-x-3 mt-6">
                    <button
                        onClick={() => {
                            setTempApiKey(apiKey); // Reset changes on cancel
                            setShowApiKeyModal(false);
                        }}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                    >
                        取消
                    </button>
                    <button
                        onClick={() => {
                            setApiKey(tempApiKey);
                            localStorage.setItem(API_KEY_STORAGE_KEY, tempApiKey);
                            setShowApiKeyModal(false);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                        保存
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
export default App;