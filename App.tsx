import React, { useState, useEffect, useRef } from 'react';
import { ProjectData, ViewMode, CoverDesign, TocItem, Chapter } from './types';
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
    backgroundCSS: 'background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);'
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
            ...parsed,
            // Ensure coverDesign exists for old projects
            coverDesign: parsed.coverDesign || INITIAL_COVER_DESIGN,
            extraFiles: parsed.extraFiles || []
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
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
        console.error("Failed to clear local storage", e);
    }
    setProject(INITIAL_PROJECT_STATE);
    setActiveChapterId(null);
    setCurrentView('files');
    // Reload to ensure clean state and clear any in-memory component states
    setTimeout(() => {
        window.location.reload();
    }, 100);
  };

  const activeChapter = project.chapters.find(c => c.id === activeChapterId);

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
      
      const parser = new DOMParser();

      // 1. Process New Chapter (After Content)
      const docAfter = parser.parseFromString(afterContent, 'text/html');
      const firstH1After = docAfter.querySelector('h1');
      let newChapterTitle = '新建切分章节';
      
      if (firstH1After && firstH1After.textContent?.trim()) {
          newChapterTitle = firstH1After.textContent.trim();
      }

      const newSubItems: TocItem[] = [];
      const headingsAfter = docAfter.querySelectorAll('h1, h2');
      let foundTitleAfter = false;
      
      headingsAfter.forEach((el) => {
          if (!el.id) {
             el.id = 'heading-' + Math.random().toString(36).substr(2, 9);
          }
          
          const text = (el.textContent || '').trim();
          if (el.tagName === 'H1') {
              if (!foundTitleAfter) {
                  foundTitleAfter = true;
              } else {
                  newSubItems.push({ id: el.id, text, level: 1 });
              }
          } else {
              newSubItems.push({ id: el.id, text, level: 2 });
          }
      });
      
      const finalAfterContent = docAfter.body.innerHTML;

      // 2. Process Current Chapter (Before Content) to update subItems
      const docBefore = parser.parseFromString(beforeContent, 'text/html');
      const currentSubItems: TocItem[] = [];
      const headingsBefore = docBefore.querySelectorAll('h1, h2');
      let foundTitleBefore = false;
      
      headingsBefore.forEach((el) => {
           // IDs should typically already exist
           if (!el.id) el.id = 'heading-' + Math.random().toString(36).substr(2, 9);
           
           const text = (el.textContent || '').trim();
           if (el.tagName === 'H1') {
               if (!foundTitleBefore) {
                   foundTitleBefore = true;
               } else {
                   currentSubItems.push({ id: el.id, text, level: 1 });
               }
           } else {
               currentSubItems.push({ id: el.id, text, level: 2 });
           }
      });
      const finalBeforeContent = docBefore.body.innerHTML;

      const currentChapter = project.chapters[currentIndex];
      const updatedCurrentChapter = { 
          ...currentChapter, 
          content: finalBeforeContent,
          subItems: currentSubItems
      };
      
      const newChapterId = Date.now().toString();
      const newChapter: Chapter = { 
          id: newChapterId, 
          title: newChapterTitle, 
          content: finalAfterContent, 
          level: 1, 
          subItems: newSubItems 
      };

      const newChapters = [...project.chapters];
      newChapters[currentIndex] = updatedCurrentChapter;
      newChapters.splice(currentIndex + 1, 0, newChapter);
      setProject(p => ({ ...p, chapters: newChapters }));
      setActiveChapterId(newChapterId);
  };

  return (
    <div className="flex h-screen bg-[#F5F5F7] font-sans text-gray-900 selection:bg-blue-100 selection:text-blue-800">
      <Sidebar 
        currentView={currentView} 
        onViewChange={setCurrentView} 
        onExport={() => generateEpub(project)} 
        onReset={handleReset} 
      />
      
      <main className="flex-1 flex overflow-hidden relative shadow-2xl rounded-l-[2.5rem] bg-[#F5F5F7] border-l border-white/50 ring-1 ring-black/5 clip-path-safe">
        <div className="absolute bottom-12 right-8 z-50 pointer-events-none transition-opacity duration-500 ease-in-out">
            <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full backdrop-blur-md border shadow-sm ${ saveStatus === 'saving' ? 'bg-yellow-50/80 border-yellow-200 text-yellow-600' : 'bg-green-50/80 border-green-200 text-green-600'}`}>
               {saveStatus === 'saving' ? <Cloud size={14} className="animate-pulse" /> : <CheckCircle2 size={14} />}
               <span className="text-xs font-medium">{saveStatus === 'saving' ? '保存中...' : '已自动保存'}</span>
            </div>
        </div>

        {currentView === 'chapters' && (
          <div className="w-80 border-r border-gray-100 bg-white/60 backdrop-blur-xl z-10 flex flex-col">
            <Directory 
              chapters={project.chapters} 
              currentChapterId={activeChapterId} 
              onSelectChapter={(id) => { setActiveChapterId(id); setScrollToAnchor(null); }} 
              onScrollToAnchor={(chapterId, anchorId) => { if (activeChapterId !== chapterId) setActiveChapterId(chapterId); setScrollToAnchor(anchorId); }} 
              onUpdateChapters={(chapters) => setProject(p => ({ ...p, chapters }))} 
            />
          </div>
        )}

        <div className="flex-1 bg-[#F5F5F7] relative overflow-hidden">
          {currentView === 'files' && (
            <FilesView 
                onProjectUpdate={(updates) => setProject(prev => ({ ...prev, ...updates }))}
                onChaptersLoaded={(newChapters, firstId) => {
                    setProject(prev => ({ ...prev, chapters: newChapters }));
                    setActiveChapterId(firstId);
                    setCurrentView('chapters');
                }}
            />
          )}

          {currentView === 'structure' && (
            <StructureView project={project} onUpdateProject={(updates) => setProject(prev => ({ ...prev, ...updates }))} />
          )}

          {currentView === 'metadata' && (
            <MetadataView 
                metadata={project.metadata}
                onUpdate={(newMetadata) => setProject(p => ({ ...p, metadata: newMetadata }))}
            />
          )}

          {currentView === 'styles' && (
            <StylesView 
                project={project}
                activeChapter={activeChapter}
                onUpdateProject={(updates) => setProject(p => ({ ...p, ...updates }))}
            />
          )}

          {currentView === 'images' && (
            <ImagesView 
                images={project.images}
                onUpdateImages={(newImages) => setProject(p => ({ ...p, images: newImages }))}
            />
          )}

          {currentView === 'cover' && (
            <CoverGenerator 
               project={project} 
               onUpdateCover={(cover) => setProject(p => ({ ...p, cover }))} 
               onUpdateCoverCSS={(css) => setProject(p => ({ ...p, coverCustomCSS: css }))}
               onUpdateCoverDesign={(design) => setProject(p => ({ ...p, coverDesign: design }))}
             />
          )}

          {currentView === 'chapters' && (
            activeChapter ? (
                <Editor 
                    key={activeChapter.id} 
                    content={activeChapter.content} 
                    onContentChange={updateChapterContent} 
                    onSplitChapter={handleSplitChapter} 
                    project={project} 
                    scrollToId={scrollToAnchor} 
                />
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-300">
                    <BookOpen size={64} className="mb-4 opacity-20" />
                    <p>请选择一个章节</p>
                </div>
            )
          )}
        </div>
      </main>
    </div>
  );
};
export default App;