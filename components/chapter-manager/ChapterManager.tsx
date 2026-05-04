import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Chapter, ImageAsset } from '../../types';
import { Plus, Search, Eye, Sparkles, Layers3 } from 'lucide-react';
import { dialog } from '../../services/dialog';
import { CleanupOptions } from '../../services/bookAnalysis';
import { getTocTitle } from '../../services/toc';

import ChapterItem from './ChapterItem';
import ChapterEditDialog from './ChapterEditDialog';
import TocPreview from './TocPreview';
import BookSearchPanel from './BookSearchPanel';
import BatchPanel from './BatchPanel';
import CleanupPanel from './CleanupPanel';

interface ChapterManagerProps {
  chapters: Chapter[];
  images: ImageAsset[];
  currentChapterId: string | null;
  onSelectChapter: (id: string) => void;
  onScrollToAnchor: (chapterId: string, anchorId: string) => void;
  onFocusSearchText: (chapterId: string, searchText: string) => void;
  onUpdateChapters: (chapters: Chapter[]) => void;
  className?: string;
}

/** 面板类型：同一时间只显示一个面板 */
type PanelType = 'none' | 'search' | 'cleanup' | 'batch';

/**
 * 目录管理主组件
 *
 * 职责：
 * - 渲染章节列表和标题搜索
 * - 管理功能面板（全书搜索、批量操作、清理）的显示切换
 * - 提供章节的增删改查操作
 */
const ChapterManager: React.FC<ChapterManagerProps> = ({
  chapters,
  images,
  currentChapterId,
  onSelectChapter,
  onScrollToAnchor,
  onFocusSearchText,
  onUpdateChapters,
  className,
}) => {
  // ─── 本地状态 ───
  const [titleFilter, setTitleFilter] = useState('');
  const [activePanel, setActivePanel] = useState<PanelType>('none');
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [showTocPreview, setShowTocPreview] = useState(false);
  const [selectedChapterIds, setSelectedChapterIds] = useState<Set<string>>(new Set());
  const [cleanupOptions, setCleanupOptions] = useState<CleanupOptions>({
    removeEmptyParagraphs: true,
    removeBrOnlyParagraphs: true,
    removeInvalidImageRefs: true,
    normalizeHeadingIds: true,
    removeInlineStyles: false,
  });

  // ─── 清理无效的批量选择 ID ───
  useEffect(() => {
    const validIds = new Set(chapters.map((ch) => ch.id));
    setSelectedChapterIds((prev) => {
      const cleaned = new Set(Array.from(prev).filter((id) => validIds.has(id)));
      return cleaned.size === prev.size ? prev : cleaned;
    });
  }, [chapters]);

  // ─── 计算 ───
  const tocTitle = useMemo(() => getTocTitle(chapters), [chapters]);

  // 标题搜索过滤
  const filteredChapters = useMemo(() => {
    const lowerFilter = titleFilter.toLowerCase();
    return chapters
      .map((ch, idx) => ({ ...ch, originalIndex: idx }))
      .filter(
        (ch) =>
          ch.title.toLowerCase().includes(lowerFilter) ||
          ch.subItems?.some((item) => item.text.toLowerCase().includes(lowerFilter)),
      );
  }, [chapters, titleFilter]);

  const filteredIds = useMemo(() => filteredChapters.map((ch) => ch.id), [filteredChapters]);

  // ─── 切换面板（互斥） ───
  const togglePanel = useCallback((panel: PanelType) => {
    setActivePanel((prev) => (prev === panel ? 'none' : panel));
  }, []);

  // ─── 章节操作 ───

  /** 添加新章节 */
  const handleAdd = useCallback(() => {
    const newChapter: Chapter = {
      id: Date.now().toString(),
      title: '新建章节',
      content: '',
      level: 1,
      subItems: [],
    };
    onUpdateChapters([...chapters, newChapter]);
    onSelectChapter(newChapter.id);
  }, [chapters, onUpdateChapters, onSelectChapter]);

  /** 移动章节 */
  const handleMove = useCallback(
    (index: number, direction: 'up' | 'down') => {
      if (direction === 'up' && index <= 0) return;
      if (direction === 'down' && index >= chapters.length - 1) return;

      const newChapters = [...chapters];
      const swapIndex = direction === 'up' ? index - 1 : index + 1;
      [newChapters[index], newChapters[swapIndex]] = [newChapters[swapIndex], newChapters[index]];
      onUpdateChapters(newChapters);
    },
    [chapters, onUpdateChapters],
  );

  /** 删除章节 */
  const handleDelete = useCallback(
    (index: number) => {
      const deletedChapter = chapters[index];
      const newChapters = chapters.filter((_, i) => i !== index);
      onUpdateChapters(newChapters);

      // 如果删除的是当前选中的章节，选中相邻的
      if (deletedChapter && deletedChapter.id === currentChapterId) {
        if (newChapters.length > 0) {
          const nextIndex = Math.min(index, newChapters.length - 1);
          onSelectChapter(newChapters[nextIndex].id);
        }
        // 如果列表为空，不调用 onSelectChapter（避免传空字符串）
      }
    },
    [chapters, currentChapterId, onUpdateChapters, onSelectChapter],
  );

  /** 合并下一章 */
  const handleMergeNext = useCallback(
    async (index: number) => {
      if (index >= chapters.length - 1) return;
      if (!(await dialog.confirm(`确定要将 "${chapters[index].title}" 与下一章合并吗？`))) return;

      const current = chapters[index];
      const next = chapters[index + 1];
      const mergedChapter: Chapter = {
        ...current,
        content: `${current.content}\n<hr class="merge-divider"/>\n${next.content}`,
        subItems: [...(current.subItems || []), ...(next.subItems || [])],
      };

      const newChapters = [...chapters];
      newChapters[index] = mergedChapter;
      newChapters.splice(index + 1, 1);
      onUpdateChapters(newChapters);
    },
    [chapters, onUpdateChapters],
  );

  /** 切换 TOC 包含/排除 */
  const handleToggleToc = useCallback(
    (index: number) => {
      const newChapters = [...chapters];
      const ch = newChapters[index];
      newChapters[index] = { ...ch, excludeFromToc: !ch.excludeFromToc };
      onUpdateChapters(newChapters);
    },
    [chapters, onUpdateChapters],
  );

  /** 保存章节编辑（标题 + ID） */
  const handleSaveEdit = useCallback(
    async (newId: string, newTitle: string) => {
      if (!editingChapter) return;

      const newChapters = chapters.map((c) => {
        if (c.id !== editingChapter.id) return c;

        let newContent = c.content;
        // 如果标题变了，同步更新 content 中第一个 H1 的文字
        if (newTitle !== editingChapter.title && newContent) {
          const parser = new DOMParser();
          const doc = parser.parseFromString(newContent, 'text/html');
          const firstH1 = doc.body.querySelector('h1');
          if (firstH1) {
            firstH1.textContent = newTitle;
            newContent = doc.body.innerHTML;
          }
        }

        return { ...c, id: newId, title: newTitle, content: newContent };
      });

      onUpdateChapters(newChapters);

      // 如果正在编辑的章节是当前章节，且 ID 变了，需要同步
      if (currentChapterId === editingChapter.id && newId !== editingChapter.id) {
        onSelectChapter(newId);
      }

      setEditingChapter(null);
    },
    [editingChapter, chapters, currentChapterId, onUpdateChapters, onSelectChapter],
  );

  /** 开始编辑章节 */
  const handleStartEdit = useCallback((e: React.MouseEvent, chapter: Chapter) => {
    e.stopPropagation();
    setEditingChapter(chapter);
  }, []);

  // ─── 批量选择操作 ───

  const toggleBatchSelect = useCallback((chapterId: string) => {
    setSelectedChapterIds((prev) => {
      const next = new Set(prev);
      if (next.has(chapterId)) next.delete(chapterId);
      else next.add(chapterId);
      return next;
    });
  }, []);

  const toggleSelectAllFiltered = useCallback(() => {
    const allSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedChapterIds.has(id));
    setSelectedChapterIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        filteredIds.forEach((id) => next.delete(id));
      } else {
        filteredIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }, [filteredIds, selectedChapterIds]);

  // ─── 渲染 ───
  return (
    <div
      className={`h-full flex flex-col bg-white/70 backdrop-blur-xl border-r border-gray-200/50
        relative flex-shrink-0 ${className || 'w-80'}`}
    >
      {/* 顶部区：标题 + 功能按钮 + 搜索 + 面板 */}
      <div className="pt-6 pb-2 px-4 sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-gray-200/50">
        {/* 标题行 */}
        <div className="flex justify-between items-center mb-3 gap-3">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">目录</h2>
          <div className="flex items-center space-x-1.5">
            {/* 全书搜索 */}
            <PanelToggleButton
              icon={<Search size={16} />}
              title="全书搜索"
              active={activePanel === 'search'}
              onClick={() => togglePanel('search')}
              activeClass="bg-blue-100 text-blue-600"
              hoverClass="text-gray-500 hover:text-blue-600 hover:bg-blue-50"
            />
            {/* 一键清理 */}
            <PanelToggleButton
              icon={<Sparkles size={16} />}
              title="一键清理"
              active={activePanel === 'cleanup'}
              onClick={() => togglePanel('cleanup')}
              activeClass="bg-amber-100 text-amber-700"
              hoverClass="text-gray-500 hover:text-amber-700 hover:bg-amber-50"
            />
            {/* 批量操作 */}
            <PanelToggleButton
              icon={<Layers3 size={16} />}
              title="批量操作"
              active={activePanel === 'batch'}
              onClick={() => togglePanel('batch')}
              activeClass="bg-indigo-100 text-indigo-700"
              hoverClass="text-gray-500 hover:text-indigo-600 hover:bg-indigo-50"
            />
            {/* TOC 预览 */}
            <button
              onClick={() => setShowTocPreview(true)}
              className="text-gray-500 hover:text-indigo-600 font-medium text-sm flex items-center
                hover:bg-indigo-50 px-2 py-1 rounded-lg transition-colors"
              title="预览总目录"
            >
              <Eye size={16} />
            </button>
            {/* 添加章节 */}
            <button
              onClick={handleAdd}
              className="text-blue-500 hover:text-blue-600 font-medium text-sm flex items-center
                bg-blue-50 px-2 py-1 rounded-lg transition-colors"
            >
              <Plus size={16} className="mr-1" /> 添加
            </button>
          </div>
        </div>

        {/* 标题搜索框 */}
        <div className="relative group">
          <Search
            className="absolute left-3 top-2 text-gray-400 group-focus-within:text-blue-500 transition-colors"
            size={16}
          />
          <input
            type="text"
            placeholder="搜索标题..."
            value={titleFilter}
            onChange={(e) => setTitleFilter(e.target.value)}
            className="w-full bg-[#767680]/10 text-sm rounded-xl pl-9 pr-3 py-1.5
              focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white
              transition-all placeholder:text-gray-500"
          />
        </div>

        {/* 功能面板（互斥显示） */}
        {activePanel === 'search' && (
          <BookSearchPanel chapters={chapters} onFocusSearchText={onFocusSearchText} />
        )}
        {activePanel === 'batch' && (
          <BatchPanel
            chapters={chapters}
            selectedIds={selectedChapterIds}
            filteredIds={filteredIds}
            currentChapterId={currentChapterId}
            onToggleSelectAll={toggleSelectAllFiltered}
            onClearSelection={() => setSelectedChapterIds(new Set())}
            onUpdateChapters={onUpdateChapters}
            onSelectChapter={onSelectChapter}
            onSetSelectedIds={setSelectedChapterIds}
          />
        )}
        {activePanel === 'cleanup' && (
          <CleanupPanel
            chapters={chapters}
            images={images}
            options={cleanupOptions}
            onOptionsChange={setCleanupOptions}
            onUpdateChapters={onUpdateChapters}
          />
        )}
      </div>

      {/* 章节列表区 */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 custom-scrollbar">
        {filteredChapters.map((chapterItem) => (
          <ChapterItem
            key={chapterItem.id}
            chapter={chapterItem}
            currentChapterId={currentChapterId}
            totalChapters={chapters.length}
            onSelect={onSelectChapter}
            onScrollToAnchor={onScrollToAnchor}
            onToggleToc={handleToggleToc}
            onMergeNext={handleMergeNext}
            onEdit={handleStartEdit}
            onMove={handleMove}
            onDelete={handleDelete}
            selectionMode={activePanel === 'batch'}
            batchSelected={selectedChapterIds.has(chapterItem.id)}
            onToggleBatchSelect={toggleBatchSelect}
          />
        ))}

        {chapters.length === 0 && (
          <div className="text-center text-gray-400 py-20">
            <p className="text-sm">暂无内容</p>
            <p className="text-xs mt-2">点击上方"添加"创建第一章</p>
          </div>
        )}
      </div>

      {/* 弹窗 */}
      {editingChapter && (
        <ChapterEditDialog
          chapter={editingChapter}
          allChapters={chapters}
          onSave={handleSaveEdit}
          onClose={() => setEditingChapter(null)}
        />
      )}
      {showTocPreview && (
        <TocPreview
          chapters={chapters}
          tocTitle={tocTitle}
          onClose={() => setShowTocPreview(false)}
        />
      )}
    </div>
  );
};

/** 面板切换按钮 */
const PanelToggleButton: React.FC<{
  icon: React.ReactNode;
  title: string;
  active: boolean;
  onClick: () => void;
  activeClass: string;
  hoverClass: string;
}> = ({ icon, title, active, onClick, activeClass, hoverClass }) => (
  <button
    onClick={onClick}
    className={`font-medium text-sm flex items-center px-2 py-1 rounded-lg transition-colors
      ${active ? activeClass : hoverClass}`}
    title={title}
  >
    {icon}
  </button>
);

export default ChapterManager;
