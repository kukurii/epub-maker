import React, { useEffect, useMemo, useState } from 'react';
import { Chapter, ImageAsset } from '../types';
import {
  Plus,
  Search,
  Eye,
  Sparkles,
  Wand2,
  Layers3,
  ListChecks,
} from 'lucide-react';
import { dialog } from '../services/dialog';
import TocPreviewModal from './chapter/TocPreviewModal';
import ChapterEditModal from './chapter/ChapterEditModal';
import ChapterListItem from './chapter/ChapterListItem';
import {
  CLEANUP_RULE_LABELS,
  CleanupOptions,
  executeCleanup,
  previewCleanup,
  searchChapters,
} from '../services/bookAnalysis';
import { getTocTitle } from '../services/toc';

interface DirectoryProps {
  chapters: Chapter[];
  images: ImageAsset[];
  currentChapterId: string | null;
  onSelectChapter: (id: string) => void;
  onScrollToAnchor: (chapterId: string, anchorId: string) => void;
  onFocusSearchText: (chapterId: string, searchText: string) => void;
  onUpdateChapters: (chapters: Chapter[]) => void;
  className?: string;
}

const Directory: React.FC<DirectoryProps> = ({
  chapters,
  images,
  currentChapterId,
  onSelectChapter,
  onScrollToAnchor,
  onFocusSearchText,
  onUpdateChapters,
  className
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [bookSearchTerm, setBookSearchTerm] = useState('');
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showBookSearch, setShowBookSearch] = useState(false);
  const [showCleanupPanel, setShowCleanupPanel] = useState(false);
  const [showBatchPanel, setShowBatchPanel] = useState(false);
  const [selectedChapterIds, setSelectedChapterIds] = useState<Set<string>>(new Set());
  const [cleanupOptions, setCleanupOptions] = useState<CleanupOptions>({
    removeEmptyParagraphs: true,
    removeBrOnlyParagraphs: true,
    removeInvalidImageRefs: true,
    normalizeHeadingIds: true,
    removeInlineStyles: false,
  });

  const cleanupPreview = useMemo(
    () => previewCleanup(chapters, images, cleanupOptions),
    [chapters, images, cleanupOptions],
  );

  const bookSearchResults = useMemo(
    () => searchChapters(chapters, bookSearchTerm),
    [chapters, bookSearchTerm],
  );

  useEffect(() => {
    setSelectedChapterIds(prev => {
      const validIds = new Set(chapters.map(chapter => chapter.id));
      const next = new Set(Array.from(prev).filter(id => validIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [chapters]);

  const handleMove = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index <= 0) return;
    if (direction === 'down' && index >= chapters.length - 1) return;

    const newChapters = [...chapters];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = newChapters[index];
    newChapters[index] = newChapters[swapIndex];
    newChapters[swapIndex] = temp;
    onUpdateChapters(newChapters);
  };

  const handleDelete = (index: number) => {
    const newChapters = chapters.filter((_, i) => i !== index);
    onUpdateChapters(newChapters);

    if (chapters[index] && chapters[index].id === currentChapterId) {
      if (newChapters.length > 0) {
        const nextIndex = index > 0 ? index - 1 : 0;
        onSelectChapter(newChapters[nextIndex].id);
      } else {
        onSelectChapter('');
      }
    }
  };

  const handleMergeNext = async (index: number) => {
    if (index >= chapters.length - 1) return;
    if (!(await dialog.confirm(`确定要将 "${chapters[index].title}" 与下一章合并吗？`))) return;

    const current = chapters[index];
    const next = chapters[index + 1];
    const mergedContent = `${current.content}\n<hr class="merge-divider"/>\n${next.content}`;
    const mergedChapter = {
      ...current,
      content: mergedContent,
      subItems: [...(current.subItems || []), ...(next.subItems || [])]
    };

    const newChapters = [...chapters];
    newChapters[index] = mergedChapter;
    newChapters.splice(index + 1, 1);
    onUpdateChapters(newChapters);
  };

  const handleAdd = () => {
    const newChapter: Chapter = {
      id: Date.now().toString(),
      title: '新建章节',
      content: '',
      level: 1,
      subItems: []
    };
    onUpdateChapters([...chapters, newChapter]);
    onSelectChapter(newChapter.id);
  };

  const toggleTocInclusion = (index: number) => {
    const newChapters = [...chapters];
    const chapter = newChapters[index];
    newChapters[index] = { ...chapter, excludeFromToc: !chapter.excludeFromToc };
    onUpdateChapters(newChapters);
  };

  const startEdit = (e: React.MouseEvent, chapter: Chapter) => {
    e.stopPropagation();
    setEditingChapter(chapter);
  };

  const saveEdit = async (id: string, title: string) => {
    if (!editingChapter) return;

    const newChapters = chapters.map(c => {
      if (c.id !== editingChapter.id) return c;

      let newContent = c.content;
      // 同步更新章节内容中的第一个 H1 标题文字
      // 如果标题改变了，把 content 里第一个 <h1...>...</h1> 的文字替换为新标题
      if (title !== editingChapter.title && newContent) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(newContent, 'text/html');
        const firstH1 = doc.body.querySelector('h1');
        if (firstH1) {
          // 保留 h1 的属性（如 id），只更改文字内容
          firstH1.textContent = title;
          newContent = doc.body.innerHTML;
        }
      }

      return { ...c, id, title, content: newContent };
    });

    onUpdateChapters(newChapters);

    if (currentChapterId === editingChapter.id && id !== editingChapter.id) {
      onSelectChapter(id);
    }

    setEditingChapter(null);
  };

  const filteredChapters = chapters
    .map((chapter, idx) => ({ ...chapter, originalIndex: idx }))
    .filter(chapter =>
      chapter.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chapter.subItems?.some(item => item.text.toLowerCase().includes(searchTerm.toLowerCase()))
    );

  const selectedCount = selectedChapterIds.size;
  const filteredIds = filteredChapters.map(chapter => chapter.id);

  const toggleBatchSelection = (chapterId: string) => {
    setSelectedChapterIds(prev => {
      const next = new Set(prev);
      if (next.has(chapterId)) next.delete(chapterId);
      else next.add(chapterId);
      return next;
    });
  };

  const toggleSelectAllFiltered = () => {
    const allSelected = filteredIds.length > 0 && filteredIds.every(id => selectedChapterIds.has(id));
    if (allSelected) {
      setSelectedChapterIds(prev => {
        const next = new Set(prev);
        filteredIds.forEach(id => next.delete(id));
        return next;
      });
      return;
    }

    setSelectedChapterIds(prev => {
      const next = new Set(prev);
      filteredIds.forEach(id => next.add(id));
      return next;
    });
  };

  const applyBatchUpdate = (updater: (chapter: Chapter) => Chapter) => {
    if (selectedChapterIds.size === 0) return;

    const updated = chapters.map(chapter =>
      selectedChapterIds.has(chapter.id) ? updater(chapter) : chapter
    );
    onUpdateChapters(updated);
  };

  const handleBatchRename = async () => {
    if (selectedChapterIds.size === 0) return;

    const template = window.prompt('批量重命名模板，支持 {n} 和 {title}，例如：第{n}章 {title}', '第{n}章');
    if (!template) return;

    let counter = 1;
    const updated = chapters.map(chapter => {
      if (!selectedChapterIds.has(chapter.id)) return chapter;

      const title = template
        .replace(/\{n\}/g, String(counter++))
        .replace(/\{title\}/g, chapter.title);

      return { ...chapter, title };
    });

    onUpdateChapters(updated);
  };

  const handleBatchDelete = async () => {
    if (selectedChapterIds.size === 0) return;
    if (!(await dialog.confirm(`确定要删除已选中的 ${selectedChapterIds.size} 个章节吗？`))) return;

    const updated = chapters.filter(chapter => !selectedChapterIds.has(chapter.id));
    onUpdateChapters(updated);
    setSelectedChapterIds(new Set());

    if (currentChapterId && selectedChapterIds.has(currentChapterId)) {
      onSelectChapter(updated[0]?.id || '');
    }
  };

  const handleRunCleanup = async () => {
    const result = executeCleanup(chapters, images, cleanupOptions);
    if (result.totalChanges === 0) {
      await dialog.alert('当前没有可清理的问题。');
      return;
    }

    if (!(await dialog.confirm(`即将应用 ${result.totalChanges} 处清理，是否继续？`))) return;

    onUpdateChapters(result.chapters);
    await dialog.alert(`清理完成，共处理 ${result.totalChanges} 处内容问题。`);
  };

  const cleanupTotal = cleanupPreview.reduce(
    (sum, chapter) => sum + chapter.changes.reduce((chapterSum, item) => chapterSum + item.total, 0),
    0,
  );
  const tocTitle = useMemo(() => getTocTitle(chapters), [chapters]);

  return (
    <div className={`h-full flex flex-col bg-white/70 backdrop-blur-xl border-r border-gray-200/50 relative flex-shrink-0 ${className || 'w-80'}`}>
      <div className="pt-6 pb-2 px-4 sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-gray-200/50">
        <div className="flex justify-between items-center mb-3 gap-3">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">目录</h2>
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setShowBookSearch(prev => !prev)}
              className={`font-medium text-sm flex items-center px-2 py-1 rounded-lg transition-colors ${showBookSearch ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'}`}
              title="全书搜索"
            >
              <Search size={16} />
            </button>
            <button
              onClick={() => setShowCleanupPanel(prev => !prev)}
              className={`font-medium text-sm flex items-center px-2 py-1 rounded-lg transition-colors ${showCleanupPanel ? 'bg-amber-100 text-amber-700' : 'text-gray-500 hover:text-amber-700 hover:bg-amber-50'}`}
              title="一键清理"
            >
              <Sparkles size={16} />
            </button>
            <button
              onClick={() => setShowBatchPanel(prev => !prev)}
              className={`font-medium text-sm flex items-center px-2 py-1 rounded-lg transition-colors ${showBatchPanel ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50'}`}
              title="批量操作"
            >
              <Layers3 size={16} />
            </button>
            <button
              onClick={() => setShowPreview(true)}
              className="text-gray-500 hover:text-indigo-600 font-medium text-sm flex items-center hover:bg-indigo-50 px-2 py-1 rounded-lg transition-colors"
              title="预览总目录"
            >
              <Eye size={16} />
            </button>
            <button
              onClick={handleAdd}
              className="text-blue-500 hover:text-blue-600 font-medium text-sm flex items-center bg-blue-50 px-2 py-1 rounded-lg transition-colors"
            >
              <Plus size={16} className="mr-1" /> 添加
            </button>
          </div>
        </div>

        <div className="relative group">
          <Search className="absolute left-3 top-2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={16} />
          <input
            type="text"
            placeholder="搜索标题..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#767680]/10 text-sm rounded-xl pl-9 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white transition-all placeholder:text-gray-500"
          />
        </div>

        {showBookSearch && (
          <div className="mt-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-wider text-blue-600">全书搜索</div>
              <span className="text-[10px] text-blue-500">{bookSearchResults.length} 个命中章节</span>
            </div>
            <input
              type="text"
              value={bookSearchTerm}
              onChange={(e) => setBookSearchTerm(e.target.value)}
              placeholder="输入关键词，跨章节搜索正文"
              className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
            />
            {bookSearchTerm.trim() && (
              <div className="max-h-52 overflow-y-auto space-y-2">
                {bookSearchResults.length > 0 ? bookSearchResults.map(result => (
                  <button
                    key={result.chapterId}
                    onClick={() => onFocusSearchText(result.chapterId, bookSearchTerm)}
                    className="w-full rounded-xl border border-blue-100 bg-white px-3 py-2 text-left hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-800 truncate">{result.chapterTitle}</span>
                      <span className="text-[10px] text-blue-600 font-bold">{result.occurrences} 次</span>
                    </div>
                    {result.snippets.map((snippet, index) => (
                      <div key={index} className="mt-1 text-xs text-gray-500 line-clamp-1">{snippet}</div>
                    ))}
                  </button>
                )) : (
                  <div className="text-xs text-gray-500 bg-white rounded-xl px-3 py-3 border border-blue-100">
                    没有找到匹配内容。
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {showBatchPanel && (
          <div className="mt-3 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-wider text-indigo-600">批量操作</div>
              <span className="text-[10px] text-indigo-500">{selectedCount} 已选</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={toggleSelectAllFiltered}
                className="flex-1 rounded-xl bg-white border border-indigo-200 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 transition-colors"
              >
                {filteredIds.length > 0 && filteredIds.every(id => selectedChapterIds.has(id)) ? '取消当前筛选全选' : '全选当前筛选'}
              </button>
              <button
                onClick={() => setSelectedChapterIds(new Set())}
                className="rounded-xl bg-white border border-indigo-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                清空
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => applyBatchUpdate(chapter => ({ ...chapter, excludeFromToc: false }))} className="rounded-xl bg-white border border-indigo-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-indigo-50">加入目录</button>
              <button onClick={() => applyBatchUpdate(chapter => ({ ...chapter, excludeFromToc: true }))} className="rounded-xl bg-white border border-indigo-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-indigo-50">排除目录</button>
              <button onClick={() => applyBatchUpdate(chapter => ({ ...chapter, level: 1 }))} className="rounded-xl bg-white border border-indigo-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-indigo-50">设为一级</button>
              <button onClick={() => applyBatchUpdate(chapter => ({ ...chapter, level: 2 }))} className="rounded-xl bg-white border border-indigo-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-indigo-50">设为二级</button>
              <button onClick={handleBatchRename} className="rounded-xl bg-white border border-indigo-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-indigo-50">批量重命名</button>
              <button onClick={handleBatchDelete} className="rounded-xl bg-red-500 px-3 py-2 text-xs font-semibold text-white hover:bg-red-600">批量删除</button>
            </div>
            <div className="text-[10px] text-gray-500 flex items-center">
              <ListChecks size={12} className="mr-1.5 text-indigo-500" />
              打开后可在章节列表左侧勾选需要批量处理的章节。
            </div>
          </div>
        )}

        {showCleanupPanel && (
          <div className="mt-3 rounded-2xl border border-amber-100 bg-amber-50/70 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-700">一键清理</div>
              <span className="text-[10px] font-bold text-amber-600">{cleanupTotal} 处待处理</span>
            </div>
            <div className="space-y-2">
              {(Object.keys(cleanupOptions) as Array<keyof CleanupOptions>).map((key) => (
                <label key={key} className="flex items-center justify-between rounded-xl bg-white border border-amber-100 px-3 py-2 text-xs text-gray-700">
                  <span>{CLEANUP_RULE_LABELS[key]}</span>
                  <input
                    type="checkbox"
                    checked={cleanupOptions[key]}
                    onChange={(e) => setCleanupOptions(prev => ({ ...prev, [key]: e.target.checked }))}
                    className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                  />
                </label>
              ))}
            </div>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {cleanupPreview.length > 0 ? cleanupPreview.slice(0, 8).map((chapter) => (
                <div key={chapter.chapterId} className="rounded-xl bg-white border border-amber-100 px-3 py-2">
                  <div className="text-xs font-semibold text-gray-800 truncate">{chapter.chapterTitle}</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {chapter.changes.map(change => (
                      <span key={change.key} className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                        {change.label} {change.total}
                      </span>
                    ))}
                  </div>
                </div>
              )) : (
                <div className="rounded-xl bg-white border border-amber-100 px-3 py-3 text-xs text-gray-500">
                  当前没有可清理的问题。
                </div>
              )}
            </div>
            <button
              onClick={handleRunCleanup}
              className="w-full rounded-xl bg-amber-500 px-3 py-2 text-sm font-bold text-white hover:bg-amber-600 transition-colors"
            >
              <Wand2 size={14} className="inline mr-1.5" />
              执行清理
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 custom-scrollbar">
        {filteredChapters.map((chapterItem) => (
          <ChapterListItem
            key={chapterItem.id}
            chapterItem={chapterItem}
            currentChapterId={currentChapterId}
            totalChapters={chapters.length}
            onSelectChapter={onSelectChapter}
            onScrollToAnchor={onScrollToAnchor}
            onToggleTocInclusion={toggleTocInclusion}
            onMergeNext={handleMergeNext}
            onStartEdit={startEdit}
            onMove={handleMove}
            onDelete={handleDelete}
            selectionMode={showBatchPanel}
            batchSelected={selectedChapterIds.has(chapterItem.id)}
            onToggleBatchSelected={toggleBatchSelection}
          />
        ))}

        {chapters.length === 0 && (
          <div className="text-center text-gray-400 py-20">
            <p className="text-sm">暂无内容</p>
            <p className="text-xs mt-2">点击上方“添加”创建第一章</p>
          </div>
        )}
      </div>

      {editingChapter && (
        <ChapterEditModal
          chapter={editingChapter}
          chapters={chapters}
          onSave={saveEdit}
          onClose={() => setEditingChapter(null)}
        />
      )}

      {showPreview && <TocPreviewModal chapters={chapters} tocTitle={tocTitle} onClose={() => setShowPreview(false)} />}
    </div>
  );
};

export default Directory;
