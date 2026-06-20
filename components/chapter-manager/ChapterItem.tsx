import React from 'react';
import { Chapter } from '../../types';
import {
  ArrowDownToLine,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Settings,
  Square,
  Trash2,
} from 'lucide-react';
import SubItemTree from './SubItemTree';
import { DragHandle } from '../../hooks/useDragSort';

interface ChapterItemProps {
  chapter: Chapter & { originalIndex: number };
  currentChapterId: string | null;
  totalChapters: number;
  onSelect: (id: string) => void;
  onScrollToAnchor: (chapterId: string, anchorId: string) => void;
  onToggleToc: (index: number) => void;
  onMergeNext: (index: number) => void;
  onEdit: (e: React.MouseEvent, chapter: Chapter) => void;
  onMove: (index: number, direction: 'up' | 'down') => void;
  onDelete: (index: number) => void;
  selectionMode?: boolean;
  batchSelected?: boolean;
  onToggleBatchSelect?: (chapterId: string) => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: () => void;
  onDrop?: (e: React.DragEvent) => void;
  isDragging?: boolean;
  isDropTarget?: boolean;
}

const ChapterItem: React.FC<ChapterItemProps> = ({
  chapter,
  currentChapterId,
  totalChapters,
  onSelect,
  onScrollToAnchor,
  onToggleToc,
  onMergeNext,
  onEdit,
  onMove,
  onDelete,
  selectionMode = false,
  batchSelected = false,
  onToggleBatchSelect,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  isDragging = false,
  isDropTarget = false,
}) => {
  const isActive = currentChapterId === chapter.id;
  const isIncludedInToc = !chapter.excludeFromToc;
  const idx = chapter.originalIndex;

  const handleRowClick = () => {
    if (selectionMode) {
      onToggleBatchSelect?.(chapter.id);
      return;
    }
    onSelect(chapter.id);
  };

  return (
    <div className="mb-1.5">
      <div
        draggable={!selectionMode}
        onClick={handleRowClick}
        onDoubleClick={(event) => onEdit(event, chapter)}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`group relative rounded-2xl px-3 py-3 transition-all duration-200 ${
          isActive
            ? 'bg-blue-500 text-white shadow-md shadow-blue-200'
            : 'text-slate-800 hover:bg-slate-100/80'
        } ${batchSelected ? 'ring-2 ring-indigo-300' : ''} ${isDragging ? 'opacity-50' : ''} ${
          isDropTarget ? 'outline outline-2 outline-blue-300 outline-dashed' : ''
        }`}
      >
        <div className="flex min-w-0 items-start gap-2 pr-2">
          {selectionMode ? (
            <button
              onClick={(event) => {
                event.stopPropagation();
                onToggleBatchSelect?.(chapter.id);
              }}
              className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-xl transition-colors ${
                isActive ? 'hover:bg-white/20' : 'text-indigo-600 hover:bg-indigo-50'
              }`}
              title={batchSelected ? '取消选择' : '选择章节'}
            >
              {batchSelected ? <CheckSquare size={17} /> : <Square size={17} />}
            </button>
          ) : (
            <DragHandle className="mt-1 shrink-0" />
          )}

          <button
            onClick={(event) => {
              event.stopPropagation();
              onToggleToc(idx);
            }}
            className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-xl transition-colors ${
              isActive
                ? 'bg-white/15 text-white hover:bg-white/25'
                : isIncludedInToc
                  ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                  : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
            }`}
            title={isIncludedInToc ? '已加入目录，点击排除' : '已排除目录，点击加入'}
          >
            {isIncludedInToc ? <Eye size={15} /> : <EyeOff size={15} />}
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className={`shrink-0 rounded-lg px-2 py-1 text-[11px] font-bold ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : chapter.level === 1
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600'
                }`}
              >
                {chapter.level === 1 ? '一级' : '二级'}
              </span>
              <div
                className={`min-w-0 flex-1 truncate text-sm font-bold leading-6 ${
                  isActive ? 'text-white' : 'text-slate-900'
                }`}
                title={chapter.title}
              >
                {chapter.title || '无标题章节'}
              </div>
            </div>

            <div
              className={`mt-1 flex min-w-0 items-center gap-2 whitespace-nowrap text-[11px] ${
                isActive ? 'text-blue-100' : 'text-slate-500'
              }`}
            >
              <span>#{idx + 1}</span>
              <span>{chapter.subItems?.length || 0} 个小标题</span>
              {!isIncludedInToc && <span className="truncate">不导出到目录</span>}
            </div>
          </div>
        </div>

        <div className="absolute right-2 top-2 flex items-center gap-0.5 rounded-xl bg-white/95 p-1 opacity-0 shadow-lg shadow-slate-900/10 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          {idx < totalChapters - 1 && (
            <ActionButton
              icon={<ArrowDownToLine size={14} />}
              title="与下一章合并"
              onClick={(event) => {
                event.stopPropagation();
                onMergeNext(idx);
              }}
            />
          )}
          <ActionButton
            icon={<Settings size={14} />}
            title="编辑标题和 ID"
            onClick={(event) => {
              event.stopPropagation();
              onEdit(event, chapter);
            }}
          />
          <ActionButton
            icon={<ChevronUp size={14} />}
            title="上移"
            disabled={idx === 0}
            onClick={(event) => {
              event.stopPropagation();
              onMove(idx, 'up');
            }}
          />
          <ActionButton
            icon={<ChevronDown size={14} />}
            title="下移"
            disabled={idx === totalChapters - 1}
            onClick={(event) => {
              event.stopPropagation();
              onMove(idx, 'down');
            }}
          />
          <button
            onMouseDown={(event) => event.preventDefault()}
            onClick={(event) => {
              event.stopPropagation();
              onDelete(idx);
            }}
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-red-500 transition-colors hover:bg-red-50"
            title="删除章节"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <SubItemTree
        items={chapter.subItems || []}
        onClickItem={(anchorId) => {
          onSelect(chapter.id);
          setTimeout(() => onScrollToAnchor(chapter.id, anchorId), 50);
        }}
      />
    </div>
  );
};

const ActionButton: React.FC<{
  icon: React.ReactNode;
  title: string;
  disabled?: boolean;
  onClick: (event: React.MouseEvent) => void;
}> = ({ icon, title, disabled = false, onClick }) => (
  <button
    onMouseDown={(event) => event.preventDefault()}
    onClick={onClick}
    disabled={disabled}
    className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
    title={title}
  >
    {icon}
  </button>
);

export default ChapterItem;
