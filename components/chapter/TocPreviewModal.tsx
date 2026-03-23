import React from 'react';
import { Chapter } from '../../types';
import { X, Hash } from 'lucide-react';

interface TocPreviewModalProps {
  chapters: Chapter[];
  onClose: () => void;
}

const TocPreviewModal: React.FC<TocPreviewModalProps> = ({ chapters, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] ring-1 ring-black/5"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white rounded-t-3xl">
          <div>
            <h3 className="text-xl font-bold text-gray-800 tracking-tight">全书目录树预览</h3>
            <p className="text-xs text-gray-500 mt-1.5 font-medium">预览实际导出时的树状结构 (已隐身章节将自动隐藏)</p>
          </div>
          <button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-gray-50/50 rounded-b-3xl">
          <div className="space-y-2">
            {chapters.filter(c => !c.excludeFromToc).map((chapter, index) => (
              <div key={chapter.id} className="bg-white rounded-xl border border-gray-100/80 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="flex items-start py-3 px-4 bg-white">
                  <div className="w-8 shrink-0 text-sm font-semibold text-blue-500/70 font-mono pt-0.5">{index + 1}.</div>
                  <div className="flex-1 font-bold text-gray-800 leading-relaxed break-words">{chapter.title || '无标题'}</div>
                </div>
                {chapter.subItems && chapter.subItems.length > 0 && (
                  <div className="border-t border-gray-50 bg-gray-50/50 px-4 py-2 space-y-1">
                    {chapter.subItems.map((sub, sIdx) => (
                      <div key={sIdx} className="flex items-start py-1.5 px-2 rounded-lg hover:bg-white text-sm transition-colors text-gray-600 group/sub">
                        <Hash size={14} className="mr-2.5 mt-0.5 text-gray-300 group-hover/sub:text-blue-400 transition-colors shrink-0" />
                        <span className={`leading-relaxed break-words flex-1 ${sub.level === 1 ? 'font-semibold text-gray-700' : 'pl-5 text-gray-500'}`}>{sub.text || '小节'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {chapters.filter(c => !c.excludeFromToc).length === 0 && (
              <div className="text-center py-10 text-gray-400 text-sm italic">当前目录为空</div>
            )}
          </div>
        </div>
      </div>
    </div>
    
  );
};

export default TocPreviewModal;
