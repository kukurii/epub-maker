import React, { useState, useEffect, useRef } from 'react';
import { ProjectData, ViewMode, CoverDesign, TocItem, Chapter, ImageAsset, ExtraFile } from './types';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import Directory from './components/ChapterManager';
import CoverGenerator from './components/CoverGenerator';
import FilesView from './components/views/FilesView';
import MetadataView from './components/views/MetadataView';
import StylesView from './components/views/StylesView';
import ImagesView from './components/views/ImagesView';
import StructureView from './components/views/StructureView';
import { generateEpub } from './services/epubService';
import { BookOpen, Cloud, CheckCircle2, Loader2, PowerOff, Menu } from 'lucide-react';

const STORAGE_KEY = 'epub_maker_project_v1';

const INITIAL_COVER_DESIGN: CoverDesign = {
    layoutMode: 'text-over',
    fontFamilyTitle: 'serif',
    fontSizeTitle: 48,
    fontColorTitle: '#ffffff',
    fontWeightTitle: 'bold',
    letterSpacingTitle: 0,
    fontFamilyAuthor: 'sans-serif',
    fontSizeAuthor: 24,
    fontColorAuthor: '#f3f4f6',
    textAlign: 'center',
    verticalOffset: 0,
    overlayOpacity: 0.3,
    textShadow: true,
    borderStyle: 'none',
    backgroundCSS: 'background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);',
    showSeries: false // 默认不显示系列名
};

// Helper to get a fresh copy of initial state to avoid reference mutation issues
const getInitialState = (): ProjectData => ({
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
    extraFiles: [],
    cover: null,
    coverCustomCSS: '',
    coverDesign: { ...INITIAL_COVER_DESIGN },
    activeStyleId: 'classic',
    isPresetStyleActive: true,
    customCSS: ''
});

// Loading Overlay Component
const LoadingOverlay: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div className="fixed inset-0 z-[100] bg-white/80 dark:bg-gray-950/80 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 flex flex-col items-center max-w-sm w-full mx-4">
          <div className="relative mb-6">
              <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
              <div className="relative bg-gradient-to-tr from-blue-600 to-indigo-600 text-white p-4 rounded-2xl shadow-lg">
                  <Loader2 size={32} className="animate-spin" />
              </div>
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 tracking-tight">请稍候</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center font-medium">{message}</p>
      </div>
  </div>
);

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewMode>('files');
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [scrollToAnchor, setScrollToAnchor] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Global loading state for long-running operations (like imports)
  const [isProcessing, setIsProcessing] = useState(false);
  const [processMessage, setProcessMessage] = useState('');

  // Ref to strictly block auto-save when resetting
  const isResettingRef = useRef(false);

  const [project, setProject] = useState<ProjectData>(getInitialState());

  // Load from LocalStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setProject({
            ...getInitialState(), // Use fresh initial state as base
            ...parsed,
            // Ensure coverDesign exists for old projects
            coverDesign: parsed.coverDesign || { ...INITIAL_COVER_DESIGN },
            extraFiles: parsed.extraFiles || [],
            isPresetStyleActive: parsed.isPresetStyleActive !== undefined ? parsed.isPresetStyleActive : true,
        });
        if (parsed.chapters && parsed.chapters.length > 0) {
           setActiveChapterId(parsed.chapters[0].id);
           setCurrentView('chapters');
        }
      } catch (e) {
        console.error("Failed to load project", e);
      }
    }
    // Simulate a small delay for better UX (so the loader doesn't flash too fast)
    setTimeout(() => setIsLoaded(true), 500);
  }, []);

  // Auto-save Effect
  useEffect(() => {
    if (isLoaded && !isResettingRef.current && autoSaveEnabled) {
      setSaveStatus('saving');
      const timeoutId = setTimeout(() => {
        // Double check ref before writing
        if (!isResettingRef.current) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
            setSaveStatus('saved');
        }
      }, 1000); // 1 second debounce
      return () => clearTimeout(timeoutId);
    }
  }, [project, isLoaded, autoSaveEnabled]);

  const handleReset = () => {
    isResettingRef.current = true; // Block auto-save
    localStorage.removeItem(STORAGE_KEY);
    
    // Reset state to a completely fresh object
    setProject(getInitialState());
    setActiveChapterId(null);
    setCurrentView('files');
    setSaveStatus('saved'); // Reset status
    setAutoSaveEnabled(true); // Reset auto-save to enabled

    // Keep the block active long enough for state updates to settle
    setTimeout(() => {
      isResettingRef.current = false;
    }, 1000);
  };

  const handleUpdateProject = (updates: Partial<ProjectData>) => {
    setProject(prev => ({ ...prev, ...updates }));
  };

  const handleChaptersLoaded = (chapters: Chapter[], firstChapterId: string) => {
    handleUpdateProject({ chapters });
    setActiveChapterId(firstChapterId);
    setCurrentView('chapters');
  };

  const handleSelectChapter = (id: string) => {
    if (id === activeChapterId) return;
    setActiveChapterId(id);
    setScrollToAnchor(null); // Clear scroll target when switching chapters manually
  };

  const handleScrollToAnchor = (chapterId: string, anchorId: string) => {
    if (activeChapterId !== chapterId) {
      setActiveChapterId(chapterId);
    }
    // Use a timeout to ensure the editor has re-rendered with the new chapter content
    setTimeout(() => setScrollToAnchor(anchorId), 50);
  };

  const handleUpdateChapters = (chapters: Chapter[]) => {
    handleUpdateProject({ chapters });
  };

  const handleUpdateChapterContent = (newContent: string, newTitle?: string, subItems?: TocItem[]) => {
    if (!activeChapterId) return;
    setProject(prev => ({
      ...prev,
      chapters: prev.chapters.map(c => {
        if (c.id === activeChapterId) {
          const updatedChapter = { ...c, content: newContent };
          if (newTitle !== undefined) {
            updatedChapter.title = newTitle;
          }
          if (subItems !== undefined) {
            updatedChapter.subItems = subItems;
          }
          return updatedChapter;
        }
        return c;
      })
    }));
  };
  
  const handleSplitChapter = (beforeContent: string, afterContent: string) => {
    if (!activeChapterId) return;
    setProject(prev => {
      const chapterIndex = prev.chapters.findIndex(c => c.id === activeChapterId);
      if (chapterIndex === -1) return prev;

      const currentChapter = prev.chapters[chapterIndex];
      const updatedCurrentChapter = { ...currentChapter, content: beforeContent };
      
      const newChapter: Chapter = {
        id: Date.now().toString(),
        title: '新章节 (切分)',
        content: afterContent,
        level: currentChapter.level,
        subItems: [],
      };

      const newChapters = [...prev.chapters];
      newChapters[chapterIndex] = updatedCurrentChapter;
      newChapters.splice(chapterIndex + 1, 0, newChapter);
      
      setActiveChapterId(newChapter.id);
      return { ...prev, chapters: newChapters };
    });
  };

  // Callbacks for child components to trigger global loading
  const handleLoadingStart = (msg: string) => {
      setProcessMessage(msg);
      setIsProcessing(true);
  };

  const handleLoadingEnd = () => {
      setIsProcessing(false);
  };

  const toggleAutoSave = () => {
    setAutoSaveEnabled(prev => !prev);
  };

  const activeChapter = project.chapters.find(c => c.id === activeChapterId);

  const renderView = () => {
    switch (currentView) {
      case 'files':
        return <FilesView 
            onProjectUpdate={handleUpdateProject} 
            onChaptersLoaded={handleChaptersLoaded} 
            onLoadingStart={handleLoadingStart}
            onLoadingEnd={handleLoadingEnd}
        />;
      case 'chapters':
        return (
          <div className="flex flex-1 h-full overflow-hidden relative">
            {/* 
               Mobile Layout Logic:
               - If no active chapter, show directory (full width).
               - If active chapter, show editor (full width).
               Desktop Layout:
               - Show directory (fixed width) AND editor (flex-1).
            */}
            <div className={`${activeChapterId ? 'hidden md:flex' : 'flex'} w-full md:w-auto h-full flex-col`}>
                <Directory
                    chapters={project.chapters}
                    currentChapterId={activeChapterId}
                    onSelectChapter={handleSelectChapter}
                    onScrollToAnchor={handleScrollToAnchor}
                    onUpdateChapters={handleUpdateChapters}
                    className="w-full md:w-80"
                />
            </div>
            
            <div className={`${!activeChapterId ? 'hidden md:flex' : 'flex'} flex-1 h-full flex-col`}>
                {activeChapter ? (
                <Editor
                    key={activeChapterId}
                    content={activeChapter.content}
                    onContentChange={handleUpdateChapterContent}
                    onSplitChapter={handleSplitChapter}
                    project={project}
                    scrollToId={scrollToAnchor}
                    saveStatus={saveStatus}
                    autoSaveEnabled={autoSaveEnabled}
                    onToggleAutoSave={toggleAutoSave}
                    onMobileBack={() => setActiveChapterId(null)}
                />
                ) : (
                <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-gray-400">
                    <BookOpen size={48} className="mb-4"/>
                    <p>请从左侧选择一个章节开始编辑</p>
                </div>
                )}
            </div>
          </div>
        );
      case 'metadata':
        return <MetadataView metadata={project.metadata} onUpdate={(m) => handleUpdateProject({ metadata: m })} />;
      case 'styles':
        return <StylesView project={project} activeChapter={activeChapter} onUpdateProject={handleUpdateProject} />;
      case 'images':
        return <ImagesView images={project.images} onUpdateImages={(images) => handleUpdateProject({ images })} />;
      case 'cover':
        return <CoverGenerator 
                  project={project} 
                  onUpdateCover={(cover) => handleUpdateProject({ cover })} 
                  onUpdateCoverCSS={(coverCustomCSS) => handleUpdateProject({ coverCustomCSS })}
                  onUpdateCoverDesign={(coverDesign) => handleUpdateProject({ coverDesign })}
               />;
      case 'structure':
        return <StructureView project={project} onUpdateProject={handleUpdateProject} />;
      default:
        return <div>Unknown view</div>;
    }
  };

  if (!isLoaded) {
    return <LoadingOverlay message="正在恢复上次的项目..." />;
  }

  return (
    <div className="flex h-screen bg-white font-sans dark:bg-gray-950">
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        onExport={() => generateEpub(project)}
        onReset={handleReset}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
      
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between h-14 bg-white border-b border-gray-200 px-4 flex-none z-30">
             <div className="flex items-center">
                 <button onClick={() => setMobileMenuOpen(true)} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                     <Menu size={20} />
                 </button>
                 <span className="font-bold text-gray-800 ml-2">EPUB Maker</span>
             </div>
        </div>

        {renderView()}
        
        {/* Global Save Indicator - Only show if NOT in chapters view (Editor handles it there) */}
        {currentView !== 'chapters' && (
            <button 
                onClick={toggleAutoSave}
                className="absolute bottom-4 right-4 z-50 transition-transform active:scale-95 focus:outline-none"
                title={autoSaveEnabled ? "点击关闭自动保存" : "点击开启自动保存"}
            >
              {!autoSaveEnabled ? (
                <div className="flex items-center text-xs text-gray-500 bg-gray-100/80 backdrop-blur-md py-1.5 px-3 rounded-full shadow-md border border-gray-200 hover:bg-gray-200/80">
                  <PowerOff size={14} className="mr-2"/>
                  自动保存已关
                </div>
              ) : saveStatus === 'saving' ? (
                <div className="flex items-center text-xs text-amber-600 bg-amber-50/80 backdrop-blur-md py-1.5 px-3 rounded-full shadow-md animate-in fade-in border border-amber-100 hover:bg-amber-100/80">
                  <Cloud size={14} className="mr-2"/>
                  保存中...
                </div>
              ) : (
                <div className="flex items-center text-xs text-green-600 bg-green-50/80 backdrop-blur-md py-1.5 px-3 rounded-full shadow-md animate-in fade-in border border-green-100 hover:bg-green-100/80">
                  <CheckCircle2 size={14} className="mr-2"/>
                  已保存
                </div>
              )}
            </button>
        )}
        
        {/* Global Process Overlay */}
        {isProcessing && <LoadingOverlay message={processMessage} />}
      </main>
    </div>
  );
};

export default App;