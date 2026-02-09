import React, { useState } from 'react';
import { ViewMode } from './types';
import Sidebar from './components/Sidebar';
import { generateEpub } from './services/epubService';
import { Menu, PowerOff, Cloud, CheckCircle2, AlertTriangle } from 'lucide-react';

// New Components & Hooks
import LoadingOverlay from './components/LoadingOverlay';
import ViewContainer from './components/ViewContainer';
import { useProject } from './hooks/useProject';
import { useAutoSave } from './hooks/useAutoSave';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewMode>('files');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrollToAnchor, setScrollToAnchor] = useState<string | null>(null);
  
  // Loading state for long-running operations (like imports)
  const [isProcessing, setIsProcessing] = useState(false);
  const [processMessage, setProcessMessage] = useState('');

  // Business Logic Hooks
  const {
    project,
    activeChapterId,
    activeChapter,
    isLoaded,
    setActiveChapterId,
    updateProject,
    updateChapters,
    updateChapterContent,
    splitChapter,
    loadChaptersFromImport,
  } = useProject();

  const { saveStatus, autoSaveEnabled, toggleAutoSave, clearStorage } = useAutoSave(project, isLoaded);

  // --- Handlers ---

  const handleReset = () => {
    clearStorage();
    window.location.reload();
  };

  const handleSelectChapter = (id: string) => {
    if (id === activeChapterId) return;
    setActiveChapterId(id);
    setScrollToAnchor(null); 
  };

  const handleScrollToAnchor = (chapterId: string, anchorId: string) => {
    if (activeChapterId !== chapterId) {
      setActiveChapterId(chapterId);
    }
    setTimeout(() => setScrollToAnchor(anchorId), 50);
  };

  const handleChaptersLoaded = (chapters: any[], firstChapterId: string) => {
      loadChaptersFromImport(chapters, firstChapterId);
      setCurrentView('chapters');
  };

  const handleLoadingStart = (msg: string) => {
      setProcessMessage(msg);
      setIsProcessing(true);
  };

  const handleLoadingEnd = () => {
      setIsProcessing(false);
  };

  if (!isLoaded) {
    return <LoadingOverlay message="正在恢复上次的项目..." />;
  }

  return (
    <div className="flex h-screen bg-white font-sans text-gray-900">
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

        {/* View Container */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
            <ViewContainer 
                currentView={currentView}
                project={project}
                activeChapterId={activeChapterId}
                activeChapter={activeChapter}
                scrollToAnchor={scrollToAnchor}
                onUpdateProject={updateProject}
                onUpdateChapters={updateChapters}
                onSelectChapter={handleSelectChapter}
                onScrollToAnchor={handleScrollToAnchor}
                onUpdateChapterContent={updateChapterContent}
                onSplitChapter={splitChapter}
                onChaptersLoaded={handleChaptersLoaded}
                onLoadingStart={handleLoadingStart}
                onLoadingEnd={handleLoadingEnd}
                onMobileBack={() => setActiveChapterId(null)}
            />
        </div>
        
        {/* Global Save Indicator */}
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
              <Cloud size={14} className="mr-2 animate-pulse"/>
              保存中...
            </div>
          ) : saveStatus === 'error' ? (
             <div className="flex items-center text-xs text-red-600 bg-red-50/90 backdrop-blur-md py-1.5 px-3 rounded-full shadow-md animate-in fade-in border border-red-200 hover:bg-red-100/80">
               <AlertTriangle size={14} className="mr-2"/>
               保存失败(容量不足)
             </div>
          ) : (
            <div className="flex items-center text-xs text-green-600 bg-green-50/80 backdrop-blur-md py-1.5 px-3 rounded-full shadow-md animate-in fade-in border border-green-100 hover:bg-green-100/80">
              <CheckCircle2 size={14} className="mr-2"/>
              已保存
            </div>
          )}
        </button>
        
        {/* Global Process Overlay */}
        {isProcessing && <LoadingOverlay message={processMessage} />}
      </main>
    </div>
  );
};

export default App;