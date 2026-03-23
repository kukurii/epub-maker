import React from 'react';
import { Chapter } from '../../types';
import { ChevronUp, ChevronDown, Trash2, ArrowDownToLine, Settings, Hash } from 'lucide-react';

interface ChapterListItemProps {
  chapterItem: Chapter & { originalIndex: number };
  currentChapterId: string | null;
  totalChapters: number;
  onSelectChapter: (id: string) => void;
  onScrollToAnchor: (chapterId: string, anchorId: string) => void;
  onToggleTocInclusion: (index: number) => void;
  onMergeNext: (index: number) => void;
  onStartEdit: (e: React.MouseEvent, chapter: Chapter) => void;
  onMove: (index: number, direction: 'up' | 'down') => void;
  onDelete: (index: number) => void;
}

const ChapterListItem: React.FC<ChapterListItemProps> = ({
  chapterItem,
  currentChapterId,
  totalChapters,
  onSelectChapter,
  onScrollToAnchor,
  onToggleTocInclusion,
  onMergeNext,
  onStartEdit,
  onMove,
  onDelete
}) => {
  const isSelected = currentChapterId === chapterItem.id;
  const isIncluded = !chapterItem.excludeFromToc;

  return (
    <div className="mb-2">
      {/* Main Chapter Item */}
      <div
        className={`group flex items-center p-2.5 rounded-xl cursor-default transition-all duration-200 ${
          isSelected
            ? 'bg-blue-500 text-white shadow-md shadow-blue-200'
            : 'hover:bg-gray-100/80 text-gray-800'
        }`}
      >
        {/* Checkbox for TOC Inclusion */}
        <div
          className={`flex items-center justify-center w-6 h-6 mr-2 cursor-pointer group/toc rounded hover:bg-black/10 transition-colors ${isSelected ? 'hover:bg-white/20' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleTocInclusion(chapterItem.originalIndex);
          }}
          title="是否包含在目录中 (绿色=包含)"
        >
          <div className={`w-3.5 h-3.5 rounded-[3px] border flex items-center justify-center transition-all duration-200 ${
            isIncluded
              ? 'bg-green-500 border-green-500 shadow-sm'
              : `border-gray-300 bg-white ${isSelected ? 'border-white/50' : ''}`
          }`}>
            {isIncluded && <div className="w-1.5 h-1.5 bg-white rounded-full shadow-sm" />}
          </div>
        </div>

        <div
          className="flex-1 min-w-0 font-semibold text-sm truncate pr-2 select-none cursor-pointer"
          title={chapterItem.title}
          onClick={() => onSelectChapter(chapterItem.id)}
          onDoubleClick={(e) => onStartEdit(e, chapterItem)}
        >
          {chapterItem.title || '无标题章节'}
        </div>

        {/* Action Buttons - Strictly Manual Sort */}
        <div className={`flex-shrink-0 flex items-center space-x-0.5 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
          
          {chapterItem.originalIndex < totalChapters - 1 && (
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => { e.stopPropagation(); onMergeNext(chapterItem.originalIndex); }}
              className={`p-1.5 rounded ${isSelected ? 'hover:bg-blue-600 text-blue-100' : 'hover:bg-gray-200 text-gray-500'}`}
              title="向下合并"
            >
              <ArrowDownToLine size={13} />
            </button>
          )}

          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => onStartEdit(e, chapterItem)}
            className={`p-1.5 rounded ${isSelected ? 'hover:bg-blue-600 text-blue-100' : 'hover:bg-gray-200 text-gray-500'}`}
            title="设置 (ID/标题)"
          >
            <Settings size={13} />
          </button>

          {/* Sort Up */}
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => { e.stopPropagation(); onMove(chapterItem.originalIndex, 'up'); }}
            disabled={chapterItem.originalIndex === 0}
            className={`p-1.5 rounded transition-all ${
              isSelected
                ? 'hover:bg-blue-600 text-blue-100 disabled:opacity-40 disabled:hover:bg-transparent'
                : 'hover:bg-gray-200 text-gray-500 disabled:opacity-30 disabled:hover:bg-transparent'
            }`}
            title="上移"
          >
            <ChevronUp size={13} />
          </button>

          {/* Sort Down */}
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => { e.stopPropagation(); onMove(chapterItem.originalIndex, 'down'); }}
            disabled={chapterItem.originalIndex === totalChapters - 1}
            className={`p-1.5 rounded transition-all ${
              isSelected
                ? 'hover:bg-blue-600 text-blue-100 disabled:opacity-40 disabled:hover:bg-transparent'
                : 'hover:bg-gray-200 text-gray-500 disabled:opacity-30 disabled:hover:bg-transparent'
            }`}
            title="下移"
          >
            <ChevronDown size={13} />
          </button>

          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => { e.stopPropagation(); onDelete(chapterItem.originalIndex); }}
            className={`p-1.5 rounded ${isSelected ? 'hover:bg-blue-600 text-blue-100' : 'hover:bg-red-100 text-red-500'}`}
            title="删除"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Sub Items (TOC Levels) */}
      <div className="relative pl-4 space-y-0.5 mt-1">
        {chapterItem.subItems && chapterItem.subItems.length > 0 && (
          <div className="absolute left-6 top-0 bottom-2 w-px bg-gray-200"></div>
        )}

        {chapterItem.subItems?.map((item, index) => {
          const isLast = index === chapterItem.subItems!.length - 1;
          return (
            <div
              key={item.id}
              onClick={() => {
                onSelectChapter(chapterItem.id);
                setTimeout(() => onScrollToAnchor(chapterItem.id, item.id), 50);
              }}
              className={`flex items-center pr-2 py-1.5 rounded-lg text-sm transition-colors relative hover:bg-blue-50 cursor-pointer ${
                item.level === 1
                  ? 'pl-6 font-medium text-gray-700 hover:text-blue-700'
                  : 'pl-10 text-gray-500 hover:text-blue-600'
              }`}
            >
              {/* Visual tree connecting lines for H1 subItems */}
              {item.level === 1 && (
                <>
                  {/* Vertical line extension if not last */}
                  {!isLast && <div className="absolute left-[26px] top-4 bottom-[-16px] w-[1px] border-l border-dashed border-gray-300 z-0"></div>}
                  {/* Horizontal elbow */}
                  <div className="absolute left-[8px] top-1/2 -translate-y-1/2 w-4 h-[1px] bg-gray-300"></div>
                </>
              )}

              {/* Visual tree connecting lines for H2 subItems */}
              {item.level === 2 && (
                <>
                  <div className="absolute left-[26px] top-1/2 -translate-y-1/2 w-4 h-[1px] bg-gray-200"></div>
                </>
              )}

              <span className="truncate flex-1 min-w-0 flex items-center shadow-[0_0_0_4px_white] z-10" title={item.text}>
                <Hash size={10} className="mr-1.5 opacity-40 flex-shrink-0" />
                {item.text || '小节'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChapterListItem;
