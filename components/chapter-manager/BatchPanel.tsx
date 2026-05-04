import React from 'react';
import { Chapter } from '../../types';
import { ListChecks } from 'lucide-react';
import { dialog } from '../../services/dialog';

interface BatchPanelProps {
  chapters: Chapter[];
  /** 当前选中的章节 ID 集合 */
  selectedIds: Set<string>;
  /** 当前筛选后显示的章节 ID 列表 */
  filteredIds: string[];
  /** 当前选中的章节 ID（用于判断删除后是否需要切换） */
  currentChapterId: string | null;
  /** 切换全选/取消 */
  onToggleSelectAll: () => void;
  /** 清空选择 */
  onClearSelection: () => void;
  /** 更新章节列表 */
  onUpdateChapters: (chapters: Chapter[]) => void;
  /** 切换选中的章节 */
  onSelectChapter: (id: string) => void;
  /** 更新选中集合 */
  onSetSelectedIds: (ids: Set<string>) => void;
}

/**
 * 批量操作面板
 * 提供全选、批量重命名、批量删除、设层级、加入/排除目录等功能
 */
const BatchPanel: React.FC<BatchPanelProps> = ({
  chapters,
  selectedIds,
  filteredIds,
  currentChapterId,
  onToggleSelectAll,
  onClearSelection,
  onUpdateChapters,
  onSelectChapter,
  onSetSelectedIds,
}) => {
  const selectedCount = selectedIds.size;

  // 检查当前筛选的章节是否全部选中
  const allFilteredSelected =
    filteredIds.length > 0 && filteredIds.every((id) => selectedIds.has(id));

  /** 对选中章节应用一个更新函数 */
  const applyBatchUpdate = (updater: (chapter: Chapter) => Chapter) => {
    if (selectedIds.size === 0) return;
    const updated = chapters.map((ch) => (selectedIds.has(ch.id) ? updater(ch) : ch));
    onUpdateChapters(updated);
  };

  /** 批量重命名 */
  const handleBatchRename = () => {
    if (selectedIds.size === 0) return;

    const template = window.prompt(
      '批量重命名模板，支持 {n} 和 {title}，例如：第{n}章 {title}',
      '第{n}章',
    );
    if (!template) return;

    let counter = 1;
    const updated = chapters.map((ch) => {
      if (!selectedIds.has(ch.id)) return ch;
      const title = template
        .replace(/\{n\}/g, String(counter++))
        .replace(/\{title\}/g, ch.title);
      return { ...ch, title };
    });
    onUpdateChapters(updated);
  };

  /** 批量删除 */
  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!(await dialog.confirm(`确定要删除已选中的 ${selectedIds.size} 个章节吗？`))) return;

    const updated = chapters.filter((ch) => !selectedIds.has(ch.id));
    onUpdateChapters(updated);
    onSetSelectedIds(new Set());

    // 如果当前选中的章节被删除了，切换到第一个
    if (currentChapterId && selectedIds.has(currentChapterId)) {
      onSelectChapter(updated[0]?.id || '');
    }
  };

  return (
    <div className="mt-3 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-bold uppercase tracking-wider text-indigo-600">批量操作</div>
        <span className="text-[10px] text-indigo-500">{selectedCount} 已选</span>
      </div>

      {/* 选择控制 */}
      <div className="flex gap-2">
        <button
          onClick={onToggleSelectAll}
          className="flex-1 rounded-xl bg-white border border-indigo-200 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 transition-colors"
        >
          {allFilteredSelected ? '取消当前筛选全选' : '全选当前筛选'}
        </button>
        <button
          onClick={onClearSelection}
          className="rounded-xl bg-white border border-indigo-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
        >
          清空
        </button>
      </div>

      {/* 批量操作按钮 */}
      <div className="grid grid-cols-2 gap-2">
        <BatchButton
          label="加入目录"
          onClick={() => applyBatchUpdate((ch) => ({ ...ch, excludeFromToc: false }))}
        />
        <BatchButton
          label="排除目录"
          onClick={() => applyBatchUpdate((ch) => ({ ...ch, excludeFromToc: true }))}
        />
        <BatchButton
          label="设为一级"
          onClick={() => applyBatchUpdate((ch) => ({ ...ch, level: 1 }))}
        />
        <BatchButton
          label="设为二级"
          onClick={() => applyBatchUpdate((ch) => ({ ...ch, level: 2 }))}
        />
        <BatchButton label="批量重命名" onClick={handleBatchRename} />
        <button
          onClick={handleBatchDelete}
          className="rounded-xl bg-red-500 px-3 py-2 text-xs font-semibold text-white hover:bg-red-600 transition-colors"
        >
          批量删除
        </button>
      </div>

      <div className="text-[10px] text-gray-500 flex items-center">
        <ListChecks size={12} className="mr-1.5 text-indigo-500" />
        打开后可在章节列表左侧勾选需要批量处理的章节。
      </div>
    </div>
  );
};

/** 批量操作按钮通用样式 */
const BatchButton: React.FC<{ label: string; onClick: () => void }> = ({ label, onClick }) => (
  <button
    onClick={onClick}
    className="rounded-xl bg-white border border-indigo-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-indigo-50 transition-colors"
  >
    {label}
  </button>
);

export default BatchPanel;
