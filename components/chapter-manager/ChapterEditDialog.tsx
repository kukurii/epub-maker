import React, { useState, useEffect } from 'react';
import { Chapter } from '../../types';
import { X, Save } from 'lucide-react';
import { dialog } from '../../services/dialog';

interface ChapterEditDialogProps {
  /** 正在编辑的章节 */
  chapter: Chapter;
  /** 所有章节（用于 ID 唯一性检查） */
  allChapters: Chapter[];
  /** 保存回调 */
  onSave: (id: string, title: string) => Promise<void>;
  /** 关闭弹窗 */
  onClose: () => void;
}

/**
 * 章节编辑弹窗
 * 可编辑章节的标题和唯一 ID
 */
const ChapterEditDialog: React.FC<ChapterEditDialogProps> = ({
  chapter,
  allChapters,
  onSave,
  onClose,
}) => {
  const [formData, setFormData] = useState({ id: chapter.id, title: chapter.title });

  // 当外部传入的 chapter 变化时，同步表单
  useEffect(() => {
    setFormData({ id: chapter.id, title: chapter.title });
  }, [chapter.id, chapter.title]);

  const handleSave = async () => {
    const { id, title } = formData;

    if (!id.trim()) {
      await dialog.alert('ID 不能为空');
      return;
    }

    // 如果 ID 改变了，检查是否已被其他章节使用
    if (id !== chapter.id && allChapters.some((c) => c.id === id)) {
      await dialog.alert('ID 已存在，请使用唯一的 ID');
      return;
    }

    await onSave(id, title);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800">章节设置</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        {/* 标题输入 */}
        <div className="mb-4">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">章节标题</label>
          <input
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
              focus:ring-2 focus:ring-blue-500 outline-none"
            value={formData.title}
            onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        </div>

        {/* ID 输入 */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">唯一 ID</label>
          <input
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono text-gray-600
              focus:ring-2 focus:ring-blue-500 outline-none"
            value={formData.id}
            onChange={(e) => setFormData((prev) => ({ ...prev, id: e.target.value }))}
            onKeyDown={handleKeyDown}
          />
          <p className="text-[10px] text-gray-400 mt-1">
            此 ID 可用于内部锚点链接 (如 href="#chapter-id")
          </p>
        </div>

        {/* 按钮栏 */}
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg
              font-medium shadow-sm shadow-blue-500/30 flex items-center"
          >
            <Save size={14} className="mr-1.5" /> 保存更改
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChapterEditDialog;
