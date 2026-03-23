import React, { useState } from 'react';
import { Chapter, ImageAsset } from '../types';
import { Plus, Search, Eye, ImageMinus } from 'lucide-react';
import { dialog } from '../services/dialog';
import TocPreviewModal from './chapter/TocPreviewModal';
import ChapterEditModal from './chapter/ChapterEditModal';
import ChapterListItem from './chapter/ChapterListItem';

interface DirectoryProps {
  chapters: Chapter[];
  images: ImageAsset[];
  currentChapterId: string | null;
  onSelectChapter: (id: string) => void;
  onScrollToAnchor: (chapterId: string, anchorId: string) => void;
  onUpdateChapters: (chapters: Chapter[]) => void;
  className?: string;
}

const Directory: React.FC<DirectoryProps> = ({
  chapters,
  images,
  currentChapterId,
  onSelectChapter,
  onScrollToAnchor,
  onUpdateChapters,
  className
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Edit Modal State
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Manual Sort Handler (Button based only)
  const handleMove = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index <= 0) return;
    if (direction === 'down' && index >= chapters.length - 1) return;

    const newChapters = [...chapters];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;

    // Swap elements
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
    newChapters.splice(index + 1, 1); // Remove next chapter

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
    // Default is included (excludeFromToc: undefined/false). Toggle it.
    // If included -> exclude (true)
    // If excluded -> include (false)
    const isCurrentlyExcluded = !!chapter.excludeFromToc;
    newChapters[index] = { ...chapter, excludeFromToc: !isCurrentlyExcluded };
    onUpdateChapters(newChapters);
  };

  const handleCleanInvalidImages = async () => {
    if (!(await dialog.confirm('确定要清理所有章节中引用已失效的图片吗？这不可恢复。'))) return;

    let totalRemoved = 0;
    const newChapters = chapters.map(chapter => {
      let content = chapter.content;
      if (!content) return chapter;

      const parser = new DOMParser();
      const doc = parser.parseFromString(content, 'text/html');
      const imageNodes = doc.querySelectorAll('img[data-id]');

      let removedInChapter = 0;
      imageNodes.forEach(img => {
        const id = img.getAttribute('data-id');
        if (id && !images.some(image => image.id === id)) {
          img.remove();
          removedInChapter++;
        }
      });

      if (removedInChapter > 0) {
        totalRemoved += removedInChapter;
        return { ...chapter, content: doc.body.innerHTML };
      }
      return chapter;
    });

    if (totalRemoved > 0) {
      onUpdateChapters(newChapters);
      await dialog.alert(`清理完成，共移除了 ${totalRemoved} 个失效图片引用。`);
    } else {
      await dialog.alert('没有发现失效的图片引用。');
    }
  };

  const startEdit = (e: React.MouseEvent, chapter: Chapter) => {
    e.stopPropagation();
    setEditingChapter(chapter);
  };

  const saveEdit = async (id: string, title: string) => {
    if (!editingChapter) return;

    const newChapters = chapters.map(c =>
      c.id === editingChapter.id ? { ...c, id, title } : c
    );

    onUpdateChapters(newChapters);

    if (currentChapterId === editingChapter.id && id !== editingChapter.id) {
      onSelectChapter(id);
    }

    setEditingChapter(null);
  };

  // Filter chapters for search
  // We preserve originalIndex to ensure sorting operations work on the main array even when filtered
  const filteredChapters = chapters.map((c, idx) => ({ ...c, originalIndex: idx })).filter(c =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.subItems?.some(s => s.text.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className={`h-full flex flex-col bg-white/70 backdrop-blur-xl border-r border-gray-200/50 relative flex-shrink-0 ${className || 'w-80'}`}>
      {/* Header */}
      <div className="pt-6 pb-2 px-4 sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-gray-200/50">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">目录</h2>
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setShowPreview(true)}
              className="text-gray-500 hover:text-indigo-600 font-medium text-sm flex items-center hover:bg-indigo-50 px-2 py-1 rounded-lg transition-colors"
              title="预览总目录"
            >
              <Eye size={16} />
            </button>
            <button
              onClick={handleCleanInvalidImages}
              className="text-gray-500 hover:text-red-600 font-medium text-sm flex items-center hover:bg-red-50 px-2 py-1 rounded-lg transition-colors"
              title="一键移除所有章节中的失效图片"
            >
              <ImageMinus size={16} />
            </button>
            <button
              onClick={handleAdd}
              className="text-blue-500 hover:text-blue-600 font-medium text-sm flex items-center bg-blue-50 px-2 py-1 rounded-lg transition-colors"
            >
              <Plus size={16} className="mr-1" /> 添加
            </button>
          </div>
        </div>

        {/* Search Bar */}
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
      </div>

      {/* Directory List */}
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
          />
        ))}

        {chapters.length === 0 && (
          <div className="text-center text-gray-400 py-20">
            <p className="text-sm">暂无内容</p>
            <p className="text-xs mt-2">点击上方 "添加" 创建第一章</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingChapter && (
        <ChapterEditModal
          chapter={editingChapter}
          chapters={chapters}
          onSave={saveEdit}
          onClose={() => setEditingChapter(null)}
        />
      )}

      {/* Global TOC Preview Modal */}
      {showPreview && <TocPreviewModal chapters={chapters} onClose={() => setShowPreview(false)} />}
    </div>
  );
};

export default Directory;