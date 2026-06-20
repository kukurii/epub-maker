import React from 'react';
import { Chapter } from '../../types';
import {
  BookOpenCheck,
  Combine,
  Eraser,
  Layers,
  ListChecks,
  ListTree,
  Trash2,
} from 'lucide-react';
import { dialog } from '../../services/dialog';

interface BatchPanelProps {
  chapters: Chapter[];
  selectedIds: Set<string>;
  filteredIds: string[];
  currentChapterId: string | null;
  onToggleSelectAll: () => void;
  onClearSelection: () => void;
  onUpdateChapters: (chapters: Chapter[]) => void;
  onSelectChapter: (id: string) => void;
  onSetSelectedIds: (ids: Set<string>) => void;
}

const joinChapterContent = (selectedChapters: Chapter[]) =>
  selectedChapters
    .map((chapter, index) => {
      const divider = index === 0 ? '' : '\n<hr class="merge-divider"/>\n';
      return `${divider}${chapter.content || ''}`;
    })
    .join('');

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
  const selectedChapters = chapters.filter((chapter) => selectedIds.has(chapter.id));
  const selectedRange =
    selectedChapters.length > 0
      ? `${chapters.findIndex((chapter) => chapter.id === selectedChapters[0].id) + 1} - ${
          chapters.findIndex((chapter) => chapter.id === selectedChapters[selectedChapters.length - 1].id) + 1
        }`
      : '无';

  const allFilteredSelected =
    filteredIds.length > 0 && filteredIds.every((id) => selectedIds.has(id));

  const applyBatchUpdate = (updater: (chapter: Chapter) => Chapter) => {
    if (selectedIds.size === 0) return;
    onUpdateChapters(chapters.map((chapter) => (selectedIds.has(chapter.id) ? updater(chapter) : chapter)));
  };

  const handleBatchRename = () => {
    if (selectedIds.size === 0) return;

    const template = window.prompt(
      '批量重命名模板，支持 {n} 和 {title}。例如：第{n}章 {title}',
      '第{n}章 {title}',
    );
    if (!template) return;

    let counter = 1;
    const updated = chapters.map((chapter) => {
      if (!selectedIds.has(chapter.id)) return chapter;
      const title = template
        .replace(/\{n\}/g, String(counter++))
        .replace(/\{title\}/g, chapter.title);
      return { ...chapter, title };
    });

    onUpdateChapters(updated);
  };

  const handleMergeSelected = async () => {
    if (selectedIds.size < 2) {
      await dialog.alert('请至少选择 2 个章节再合并。', '无法合并');
      return;
    }

    const orderedSelection = chapters.filter((chapter) => selectedIds.has(chapter.id));
    const firstChapter = orderedSelection[0];
    const defaultTitle =
      orderedSelection.length === 2
        ? `${firstChapter.title || '合并章节'} + ${orderedSelection[1].title || '下一章'}`
        : `${firstChapter.title || '合并章节'} 等 ${orderedSelection.length} 章`;

    const mergedTitle = window.prompt('合并后的章节标题', defaultTitle);
    if (mergedTitle === null) return;

    const mergedChapter: Chapter = {
      ...firstChapter,
      title: mergedTitle.trim() || defaultTitle,
      content: joinChapterContent(orderedSelection),
      level: firstChapter.level,
      excludeFromToc: orderedSelection.every((chapter) => chapter.excludeFromToc),
      subItems: orderedSelection.flatMap((chapter) => chapter.subItems || []),
    };

    let mergedInserted = false;
    const updated = chapters.reduce<Chapter[]>((next, chapter) => {
      if (!selectedIds.has(chapter.id)) {
        next.push(chapter);
        return next;
      }

      if (!mergedInserted) {
        next.push(mergedChapter);
        mergedInserted = true;
      }

      return next;
    }, []);

    onUpdateChapters(updated);
    onSetSelectedIds(new Set([mergedChapter.id]));
    onSelectChapter(mergedChapter.id);
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!(await dialog.confirm(`确定删除已选中的 ${selectedIds.size} 个章节吗？`, '批量删除'))) return;

    const updated = chapters.filter((chapter) => !selectedIds.has(chapter.id));
    onUpdateChapters(updated);
    onSetSelectedIds(new Set());

    if (currentChapterId && selectedIds.has(currentChapterId) && updated.length > 0) {
      onSelectChapter(updated[0].id);
    }
  };

  return (
    <div className="mt-3 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-3 shadow-sm shadow-indigo-100/40">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-700">
            <ListChecks size={14} />
            批量操作
          </div>
          <div className="mt-1 text-[11px] text-indigo-500">
            已选 {selectedCount} 个，范围 {selectedRange}
          </div>
        </div>
        <button
          onClick={onClearSelection}
          disabled={selectedCount === 0}
          className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          title="清空选择"
        >
          <Eraser size={14} />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          onClick={onToggleSelectAll}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-indigo-200 bg-white px-3 py-2 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-50"
        >
          <ListTree size={14} />
          {allFilteredSelected ? '取消全选' : '选择全部'}
        </button>
        <BatchButton
          icon={<Combine size={14} />}
          label="合并所选"
          disabled={selectedCount < 2}
          onClick={handleMergeSelected}
          strong
        />
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <BatchButton
          icon={<BookOpenCheck size={14} />}
          label="加入目录"
          disabled={selectedCount === 0}
          onClick={() => applyBatchUpdate((chapter) => ({ ...chapter, excludeFromToc: false }))}
        />
        <BatchButton
          icon={<BookOpenCheck size={14} />}
          label="排除目录"
          disabled={selectedCount === 0}
          onClick={() => applyBatchUpdate((chapter) => ({ ...chapter, excludeFromToc: true }))}
        />
        <BatchButton
          icon={<Layers size={14} />}
          label="设为一级"
          disabled={selectedCount === 0}
          onClick={() => applyBatchUpdate((chapter) => ({ ...chapter, level: 1 }))}
        />
        <BatchButton
          icon={<Layers size={14} />}
          label="设为二级"
          disabled={selectedCount === 0}
          onClick={() => applyBatchUpdate((chapter) => ({ ...chapter, level: 2 }))}
        />
        <BatchButton
          icon={<ListChecks size={14} />}
          label="批量重命名"
          disabled={selectedCount === 0}
          onClick={handleBatchRename}
        />
        <BatchButton
          icon={<Trash2 size={14} />}
          label="批量删除"
          disabled={selectedCount === 0}
          onClick={handleBatchDelete}
          danger
        />
      </div>

      <div className="mt-3 rounded-xl bg-white/70 px-3 py-2 text-[11px] leading-5 text-slate-500">
        合并会按当前目录顺序执行，并保留第一个所选章节的位置、ID、层级和目录状态。
      </div>
    </div>
  );
};

const BatchButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  strong?: boolean;
}> = ({ icon, label, onClick, disabled = false, danger = false, strong = false }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
      danger
        ? 'bg-red-500 text-white hover:bg-red-600'
        : strong
          ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20 hover:bg-indigo-700'
          : 'border border-indigo-100 bg-white text-slate-700 hover:bg-indigo-50'
    }`}
  >
    {icon}
    <span className="truncate">{label}</span>
  </button>
);

export default BatchPanel;
