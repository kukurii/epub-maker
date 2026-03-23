import React, { useState, useEffect } from 'react';
import { Chapter } from '../../types';
import { X, Save } from 'lucide-react';
import { dialog } from '../../services/dialog';

interface ChapterEditModalProps {
  chapter: Chapter;
  chapters: Chapter[];
  onSave: (id: string, title: string) => Promise<void>;
  onClose: () => void;
}

const ChapterEditModal: React.FC<ChapterEditModalProps> = ({ chapter, chapters, onSave, onClose }) => {
  const [editFormData, setEditFormData] = useState({ id: chapter.id, title: chapter.title });

  // Update effect in case props change
  useEffect(() => {
    setEditFormData({ id: chapter.id, title: chapter.title });
  }, [chapter]);

  const handleSave = async () => {
    const { id, title } = editFormData;

    if (!id.trim()) {
      await dialog.alert('ID 不能为空');
      return;
    }

    if (id !== chapter.id && chapters.some(c => c.id === id)) {
      await dialog.alert('ID 已存在，请使用唯一的 ID');
      return;
    }

    await onSave(id, title);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800">章节设置</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">章节标题</label>
          <input
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={editFormData.title}
            onChange={e => setEditFormData(prev => ({ ...prev, title: e.target.value }))}
            autoFocus
            onKeyDown={e => e.key === 'Enter' && handleSave()}
          />
        </div>

        <div className="mb-6">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">唯一 ID</label>
          <input
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono text-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
            value={editFormData.id}
            onChange={e => setEditFormData(prev => ({ ...prev, id: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
          />
          <p className="text-[10px] text-gray-400 mt-1">此 ID 可用于内部锚点链接 (如 href="#chapter-id")</p>
        </div>

        <div className="flex justify-end space-x-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">取消</button>
          <button onClick={handleSave} className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium shadow-sm shadow-blue-500/30 flex items-center">
            <Save size={14} className="mr-1.5" /> 保存更改
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChapterEditModal;
