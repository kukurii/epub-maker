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
  editorFocusRequest: {
    anchorId?: string | null;
    searchText?: string | null;
    imageId?: string | null;
    key: number;
  } | null;
  // Actions
  onUpdateProject: (updates: Partial<ProjectData>) => void;
  onUpdateChapters: (chapters: Chapter[]) => void;
  onSelectChapter: (id: string) => void;
  onScrollToAnchor: (chapterId: string, anchorId: string) => void;
  onFocusSearchText: (chapterId: string, searchText: string) => void;
  onFocusImageReference: (chapterId: string, imageId: string) => void;
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
  editorFocusRequest,
  onUpdateProject,
  onUpdateChapters,
  onSelectChapter,
  onScrollToAnchor,
  onFocusSearchText,
  onFocusImageReference,
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
        {/* 目录列表区：固定 w-80 宽度，移动端全宽且只在没有选中章节时显示 */}
          <div className={`${activeChapterId ? 'hidden md:flex' : 'flex'} w-full md:w-80 h-full flex-col flex-shrink-0`}>
            <Directory
              chapters={project.chapters}
              images={project.images}
              currentChapterId={activeChapterId}
              onSelectChapter={onSelectChapter}
              onScrollToAnchor={onScrollToAnchor}
              onFocusSearchText={onFocusSearchText}
              onUpdateChapters={onUpdateChapters}
              className="w-full md:w-80"
            />
          </div>

          <div className={`${!activeChapterId ? 'hidden md:flex' : 'flex'} flex-1 h-full flex-col min-w-0`}>
            {activeChapter ? (
              <Editor
                key={activeChapterId}
                content={activeChapter.content}
                onContentChange={onUpdateChapterContent}
                onSplitChapter={onSplitChapter}
                project={project}
                focusRequest={editorFocusRequest}
                activeChapter={activeChapter}
                onMobileBack={onMobileBack}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-gray-400">
                <BookOpen size={48} className="mb-4" />
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
      return (
        <ImagesView
          images={project.images}
          chapters={project.chapters}
          onUpdateImages={(images) => onUpdateProject({ images })}
          onLocateUsage={onFocusImageReference}
        />
      );
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
