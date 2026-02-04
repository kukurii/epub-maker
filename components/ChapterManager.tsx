import React, { useState } from 'react';
import { Chapter } from '../types';
import { ChevronUp, ChevronDown, Trash2, Plus, Search, ChevronRight, Hash, ArrowDownToLine, Scissors } from 'lucide-react';

interface DirectoryProps {
  chapters: Chapter[];
  currentChapterId: string | null;
  onSelectChapter: (id: string) => void;
  onScrollToAnchor: (chapterId: string, anchorId: string) => void;
  onUpdateChapters: (chapters: Chapter[]) => void;
}

const Directory: React.FC<DirectoryProps> = ({ 
  chapters, 
  currentChapterId, 
  onSelectChapter, 
  onScrollToAnchor,
  onUpdateChapters
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleMove = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === chapters.length - 1) return;

    const newChapters = [...chapters];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newChapters[index], newChapters[swapIndex]] = [newChapters[swapIndex], newChapters[index]];
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

  const handleMergeNext = (index: number) => {
    if (index >= chapters.length - 1) return;
    if (!window.confirm(`确定要将 "${chapters[index].title}" 与下一章合并吗？`)) return;

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
      content: '<h1>新建章节</h1><p>开始写作...</p>',
      level: 1,
      subItems: []
    };
    onUpdateChapters([...chapters, newChapter]);
    onSelectChapter(newChapter.id);
  };

  const filteredChapters = chapters.map((c, idx) => ({ ...c, originalIndex: idx })).filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.subItems?.some(s => s.text.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="h-full flex flex-col bg-white/70 backdrop-blur-xl border-r border-gray-200/50">
      {/* Header */}
      <div className="pt-6 pb-2 px-4 sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-gray-200/50">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">目录</h2>
          <button 
            onClick={handleAdd}
            className="text-blue-500 hover:text-blue-600 font-medium text-sm flex items-center bg-blue-50 px-2 py-1 rounded-lg transition-colors"
          >
            <Plus size={16} className="mr-1" /> 添加
          </button>
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
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {filteredChapters.map(({ originalIndex, ...chapter }) => (
          <div key={chapter.id} className="mb-2">
            {/* Main Chapter Item */}
            <div 
              onClick={() => onSelectChapter(chapter.id)}
              className={`group flex items-center p-2.5 rounded-xl cursor-pointer transition-all duration-200 ${
                currentChapterId === chapter.id 
                  ? 'bg-blue-500 text-white shadow-md shadow-blue-200' 
                  : 'hover:bg-gray-100/80 text-gray-800'
              }`}
            >
              <div className="flex-1 font-semibold text-sm truncate pr-2">
                {chapter.title || '无标题章节'}
              </div>

              {/* Action Buttons */}
              <div className={`flex items-center space-x-0.5 ${currentChapterId === chapter.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                  
                  {originalIndex < chapters.length - 1 && (
                      <button 
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={(e) => { e.stopPropagation(); handleMergeNext(originalIndex); }}
                        className={`p-1.5 rounded ${currentChapterId === chapter.id ? 'hover:bg-blue-600 text-blue-100' : 'hover:bg-gray-200 text-gray-500'}`}
                        title="向下合并"
                      >
                        <ArrowDownToLine size={13} />
                      </button>
                  )}
                  
                  <button 
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={(e) => { e.stopPropagation(); handleMove(originalIndex, 'up'); }}
                    className={`p-1.5 rounded ${currentChapterId === chapter.id ? 'hover:bg-blue-600 text-blue-100' : 'hover:bg-gray-200 text-gray-500'}`}
                    title="上移"
                  >
                    <ChevronUp size={13} />
                  </button>
                  <button 
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={(e) => { e.stopPropagation(); handleMove(originalIndex, 'down'); }}
                    className={`p-1.5 rounded ${currentChapterId === chapter.id ? 'hover:bg-blue-600 text-blue-100' : 'hover:bg-gray-200 text-gray-500'}`}
                    title="下移"
                  >
                    <ChevronDown size={13} />
                  </button>
                  <button 
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={(e) => { e.stopPropagation(); handleDelete(originalIndex); }}
                    className={`p-1.5 rounded ${currentChapterId === chapter.id ? 'hover:bg-blue-600 text-blue-100' : 'hover:bg-red-100 text-red-500'}`}
                    title="删除"
                  >
                    <Trash2 size={13} />
                  </button>
              </div>
            </div>

            {/* Sub Items */}
            <div className="relative pl-4 space-y-0.5 mt-1">
               {chapter.subItems && chapter.subItems.length > 0 && (
                 <div className="absolute left-6 top-0 bottom-2 w-px bg-gray-200"></div>
               )}
               
               {chapter.subItems?.map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => {
                        onSelectChapter(chapter.id);
                        setTimeout(() => onScrollToAnchor(chapter.id, item.id), 50); 
                    }}
                    className="flex items-center pl-6 pr-2 py-1.5 rounded-lg text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 cursor-pointer transition-colors relative"
                  >
                    <div className="absolute left-[23px] top-1/2 -translate-y-1/2 w-2 h-px bg-gray-300"></div>
                    <Hash size={10} className="mr-2 opacity-50 flex-shrink-0" />
                    <span className="truncate">{item.text || '小节'}</span>
                  </div>
               ))}
            </div>
          </div>
        ))}

        {chapters.length === 0 && (
          <div className="text-center text-gray-400 py-20">
            <p className="text-sm">暂无内容</p>
            <p className="text-xs mt-2">点击上方 "添加" 创建第一章</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Directory;
