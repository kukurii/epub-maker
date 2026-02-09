import React from 'react';
import { ViewMode, ProjectData, Chapter, TocItem } from '../types';
import Editor from './Editor';
import Directory from './ChapterManager';
import CoverGenerator from './views/CoverGenerator';
import FilesView from './views/FilesView';
import MetadataView from './views/MetadataView';
import StylesView from './views/StylesView';
import ImagesView from './views/ImagesView';
import StructureView from './views/StructureView';
import { BookOpen } from 'lucide-react';

interface ViewContainerProps {
  currentView: ViewMode;
  project: ProjectData;
  activeChapterId: string | null;
  activeChapter: Chapter | undefined;
  scrollToAnchor: string | null;
  // Actions
  onUpdateProject: (updates: Partial<ProjectData>) => void;
  onUpdateChapters: (chapters: Chapter[]) => void;
  onSelectChapter: (id: string) => void;
  onScrollToAnchor: (chapterId: string, anchorId: string) => void;
  onUpdateChapterContent: (newContent: string, newTitle?: string, subItems?: TocItem[]) => void;
  onSplitChapter: (before: string, after: string) => void;
  onChaptersLoaded: (chapters: Chapter[], firstId: string) => void;
  onLoadingStart: (msg: string) => void;
  onLoadingEnd: () => void;
  onMobileBack: () => void;
}

const ViewContainer: React.FC<ViewContainerProps> = ({
  currentView,
  project,
  activeChapterId,
  activeChapter,
  scrollToAnchor,
  onUpdateProject,
  onUpdateChapters,
  onSelectChapter,
  onScrollToAnchor,
  onUpdateChapterContent,
  onSplitChapter,
  onChaptersLoaded,
  onLoadingStart,
  onLoadingEnd,
  onMobileBack
}) => {
  switch (currentView) {
    case 'files':
      return <FilesView 
          onProjectUpdate={onUpdateProject} 
          onChaptersLoaded={onChaptersLoaded} 
          onLoadingStart={onLoadingStart}
          onLoadingEnd={onLoadingEnd}
      />;
    case 'chapters':
      return (
        <div className="flex flex-1 h-full overflow-hidden relative">
          <div className={`${activeChapterId ? 'hidden md:flex' : 'flex'} w-full md:w-auto h-full flex-col`}>
              <Directory
                  chapters={project.chapters}
                  currentChapterId={activeChapterId}
                  onSelectChapter={onSelectChapter}
                  onScrollToAnchor={onScrollToAnchor}
                  onUpdateChapters={onUpdateChapters}
                  className="w-full md:w-80"
              />
          </div>
          
          <div className={`${!activeChapterId ? 'hidden md:flex' : 'flex'} flex-1 h-full flex-col`}>
              {activeChapter ? (
              <Editor
                  key={activeChapterId}
                  content={activeChapter.content}
                  onContentChange={onUpdateChapterContent}
                  onSplitChapter={onSplitChapter}
                  project={project}
                  scrollToId={scrollToAnchor}
                  onMobileBack={onMobileBack}
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
      return <MetadataView metadata={project.metadata} onUpdate={(m) => onUpdateProject({ metadata: m })} />;
    case 'styles':
      return <StylesView project={project} activeChapter={activeChapter} onUpdateProject={onUpdateProject} />;
    case 'images':
      return <ImagesView images={project.images} onUpdateImages={(images) => onUpdateProject({ images })} />;
    case 'cover':
      return <CoverGenerator 
                project={project} 
                onUpdateCover={(cover, coverId) => onUpdateProject({ cover, coverId: coverId || null })} 
                onUpdateCoverCSS={(coverCustomCSS) => onUpdateProject({ coverCustomCSS })}
                onUpdateCoverDesign={(coverDesign) => onUpdateProject({ coverDesign })}
                onAddImage={(img) => onUpdateProject({ images: [...project.images, img] })}
                coverGeneratorState={project.coverGeneratorState}
                onUpdateGeneratorState={(state) => onUpdateProject({ coverGeneratorState: { ...project.coverGeneratorState, ...state } })}
             />;
    case 'structure':
      return <StructureView project={project} onUpdateProject={onUpdateProject} />;
    default:
      return <div>Unknown view</div>;
  }
};

export default ViewContainer;