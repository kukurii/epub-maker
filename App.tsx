

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
import { BookOpen, Cloud, CheckCircle2 } from 'lucide-react';

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

const INITIAL_PROJECT_STATE: ProjectData = {
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
    coverDesign: INITIAL_COVER_DESIGN,
    activeStyleId: 'classic',
    isPresetStyleActive: true,
    customCSS: ''
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewMode>('files');
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [scrollToAnchor, setScrollToAnchor] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  
  // Ref to strictly block auto-save when resetting
  const isResettingRef = useRef(false);

  const [project, setProject] = useState<ProjectData>(INITIAL_PROJECT_STATE);

  // Load from LocalStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setProject({
            ...INITIAL_PROJECT_STATE,
            ...parsed,
            // Ensure coverDesign exists for old projects
            coverDesign: parsed.coverDesign || INITIAL_COVER_DESIGN,
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
    setIsLoaded(true);
  }, []);

  // Auto-save Effect
  useEffect(() => {
    if (isLoaded && !isResettingRef.current) {
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
  }, [project, isLoaded]);

  const handleReset = () => {
    isResettingRef.current = true;
    localStorage.removeItem(STORAGE_KEY);
    setProject(INITIAL_PROJECT_STATE);
    setActiveChapterId(null);
    setCurrentView('files');
    setTimeout(() => {
      isResettingRef.current = false;
    }, 500);
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

  const activeChapter = project.chapters.find(c => c.id === activeChapterId);

  const renderView = () => {
    switch (currentView) {
      case 'files':
        return <FilesView onProjectUpdate={handleUpdateProject} onChaptersLoaded={handleChaptersLoaded} />;
      case 'chapters':
        return (
          <div className="flex flex-1 h-full overflow-hidden">
            <Directory
              chapters={project.chapters}
              currentChapterId={activeChapterId}
              onSelectChapter={handleSelectChapter}
              onScrollToAnchor={handleScrollToAnchor}
              onUpdateChapters={handleUpdateChapters}
            />
            {activeChapter ? (
              <Editor
                key={activeChapterId}
                content={activeChapter.content}
                onContentChange={handleUpdateChapterContent}
                onSplitChapter={handleSplitChapter}
                project={project}
                scrollToId={scrollToAnchor}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-gray-400">
                <BookOpen size={48} className="mb-4"/>
                <p>请从左侧选择一个章节开始编辑</p>
              </div>
            )}
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
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gray-100 text-gray-500">
        <BookOpen size={40} className="mr-4 text-blue-500 animate-pulse" />
        <span className="text-lg font-medium">正在加载项目...</span>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white font-sans">
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        onExport={() => generateEpub(project)}
        onReset={handleReset}
      />
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {renderView()}
        <div className="absolute bottom-4 right-4 z-50 pointer-events-none">
          {saveStatus === 'saving' && (
            <div className="flex items-center text-xs text-gray-500 bg-white/70 backdrop-blur-md py-1.5 px-3 rounded-full shadow-md animate-in fade-in">
              <Cloud size={14} className="mr-2"/>
              保存中...
            </div>
          )}
          {saveStatus === 'saved' && (
            <div className="flex items-center text-xs text-green-600 bg-white/70 backdrop-blur-md py-1.5 px-3 rounded-full shadow-md animate-in fade-in">
              <CheckCircle2 size={14} className="mr-2"/>
              已保存
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
