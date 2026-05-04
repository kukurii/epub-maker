import React from 'react';
import { Chapter } from '../../types';
import {
  ChevronUp,
  ChevronDown,
  Trash2,
  ArrowDownToLine,
  Settings,
  CheckSquare,
  Square,
} from 'lucide-react';
import SubItemTree from './SubItemTree';

interface ChapterItemProps {
  /** 章节数据（附带 originalIndex） */
  chapter: Chapter & { originalIndex: number };
  /** 当前选中的章节 ID */
  currentChapterId: string | null;
  /** 章节总数（用于判断边界按钮是否可用） */
  totalChapters: number;
  /** 选中章节 */
  onSelect: (id: string) => void;
  /** 点击子项跳转锚点 */
  onScrollToAnchor: (chapterId: string, anchorId: string) => void;
  /** 切换 TOC 包含/排除 */
  onToggleToc: (index: number) => void;
  /** 合并下一章 */
  onMergeNext: (index: number) => void;
  /** 打开编辑弹窗 */
  onEdit: (e: React.MouseEvent, chapter: Chapter) => void;
  /** 上移/下移 */
  onMove: (index: number, direction: 'up' | 'down') => void;
  /** 删除 */
  onDelete: (index: number) => void;
  /** 是否处于批量选择模式 */
  selectionMode?: boolean;
  /** 当前章节是否被批量选中 */
  batchSelected?: boolean;
  /** 切换批量选择 */
  onToggleBatchSelect?: (chapterId: string) => void;
}

/**
 * 单个章节项组件
 * 展示章节标题、操作按钮、子项树
 */
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
}) => {
  const isActive = currentChapterId === chapter.id;
  const isIncludedInToc = !chapter.excludeFromToc;
  const idx = chapter.originalIndex;

  return (
    <div className="mb-1.5">
      {/* 章节主行 */}
      <div
        className={`
          group flex items-center p-2.5 rounded-xl cursor-default
          transition-all duration-200
          ${isActive
            ? 'bg-blue-500 text-white shadow-md shadow-blue-200'
            : 'hover:bg-gray-100/80 text-gray-800'
          }
        `}
      >
        {/* 批量选择复选框 */}
        {selectionMode && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleBatchSelect?.(chapter.id);
            }}
            className={`mr-1 flex h-6 w-6 items-center justify-center rounded transition-colors ${
              isActive ? 'hover:bg-white/20' : 'hover:bg-gray-200'
            }`}
            title="选择章节"
          >
            {batchSelected ? <CheckSquare size={16} /> : <Square size={16} />}
          </button>
        )}

        {/* TOC 包含/排除 指示器 */}
        <div
          className={`flex items-center justify-center w-6 h-6 mr-2 cursor-pointer rounded
            hover:bg-black/10 transition-colors ${isActive ? 'hover:bg-white/20' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleToc(idx);
          }}
          title={isIncludedInToc ? '已包含在目录中（点击排除）' : '已排除出目录（点击包含）'}
        >
          <div
            className={`w-3.5 h-3.5 rounded-[3px] border flex items-center justify-center transition-all duration-200
              ${isIncludedInToc
                ? 'bg-green-500 border-green-500 shadow-sm'
                : `border-gray-300 bg-white ${isActive ? 'border-white/50' : ''}`
              }`}
          >
            {isIncludedInToc && <div className="w-1.5 h-1.5 bg-white rounded-full shadow-sm" />}
          </div>
        </div>

        {/* 标题（点击选中，双击编辑） */}
        <div
          className="flex-1 min-w-0 font-semibold text-sm truncate pr-2 select-none cursor-pointer"
          title={chapter.title}
          onClick={() => onSelect(chapter.id)}
          onDoubleClick={(e) => onEdit(e, chapter)}
        >
          {chapter.title || '无标题章节'}
        </div>

        {/* 操作按钮组 */}
        <div
          className={`flex-shrink-0 flex items-center space-x-0.5 transition-opacity
            ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
        >
          {/* 合并下一章 */}
          {idx < totalChapters - 1 && (
            <ActionButton
              icon={<ArrowDownToLine size={13} />}
              title="向下合并"
              isActive={isActive}
              onClick={(e) => { e.stopPropagation(); onMergeNext(idx); }}
            />
          )}

          {/* 编辑设置 */}
          <ActionButton
            icon={<Settings size={13} />}
            title="设置 (ID/标题)"
            isActive={isActive}
            onClick={(e) => onEdit(e, chapter)}
          />

          {/* 上移 */}
          <ActionButton
            icon={<ChevronUp size={13} />}
            title="上移"
            isActive={isActive}
            disabled={idx === 0}
            onClick={(e) => { e.stopPropagation(); onMove(idx, 'up'); }}
          />

          {/* 下移 */}
          <ActionButton
            icon={<ChevronDown size={13} />}
            title="下移"
            isActive={isActive}
            disabled={idx === totalChapters - 1}
            onClick={(e) => { e.stopPropagation(); onMove(idx, 'down'); }}
          />

          {/* 删除 */}
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => { e.stopPropagation(); onDelete(idx); }}
            className={`p-1.5 rounded ${
              isActive ? 'hover:bg-blue-600 text-blue-100' : 'hover:bg-red-100 text-red-500'
            }`}
            title="删除"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* 子项树 */}
      <SubItemTree
        items={chapter.subItems || []}
        onClickItem={(anchorId) => {
          // 先选中章节，等一帧再跳转锚点
          onSelect(chapter.id);
          setTimeout(() => onScrollToAnchor(chapter.id, anchorId), 50);
        }}
      />
    </div>
  );
};

/** 通用操作小按钮 */
const ActionButton: React.FC<{
  icon: React.ReactNode;
  title: string;
  isActive: boolean;
  disabled?: boolean;
  onClick: (e: React.MouseEvent) => void;
}> = ({ icon, title, isActive, disabled, onClick }) => (
  <button
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    disabled={disabled}
    className={`p-1.5 rounded transition-all ${
      disabled
        ? 'opacity-30 cursor-not-allowed'
        : isActive
          ? 'hover:bg-blue-600 text-blue-100'
          : 'hover:bg-gray-200 text-gray-500'
    }`}
    title={title}
  >
    {icon}
  </button>
);

export default ChapterItem;
