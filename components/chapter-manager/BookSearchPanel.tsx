import React, { useMemo, useState } from 'react';
import { Chapter } from '../../types';
import { searchChapters } from '../../services/bookAnalysis';

interface BookSearchPanelProps {
  chapters: Chapter[];
  /** 点击搜索结果，跳转到对应章节和文本 */
  onFocusSearchText: (chapterId: string, searchText: string) => void;
}

/**
 * 全书搜索面板
 * 跨章节搜索正文内容，点击结果跳转到对应位置
 */
const BookSearchPanel: React.FC<BookSearchPanelProps> = ({ chapters, onFocusSearchText }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const results = useMemo(
    () => searchChapters(chapters, searchTerm),
    [chapters, searchTerm],
  );

  return (
    <div className="mt-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-bold uppercase tracking-wider text-blue-600">全书搜索</div>
        <span className="text-[10px] text-blue-500">{results.length} 个命中章节</span>
      </div>

      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="输入关键词，跨章节搜索正文"
        className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
        autoFocus
      />

      {searchTerm.trim() && (
        <div className="max-h-52 overflow-y-auto space-y-2">
          {results.length > 0 ? (
            results.map((result) => (
              <button
                key={result.chapterId}
                onClick={() => onFocusSearchText(result.chapterId, searchTerm)}
                className="w-full rounded-xl border border-blue-100 bg-white px-3 py-2 text-left
                  hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-800 truncate">
                    {result.chapterTitle}
                  </span>
                  <span className="text-[10px] text-blue-600 font-bold">
                    {result.occurrences} 次
                  </span>
                </div>
                {result.snippets.map((snippet, i) => (
                  <div key={i} className="mt-1 text-xs text-gray-500 line-clamp-1">
                    {snippet}
                  </div>
                ))}
              </button>
            ))
          ) : (
            <div className="text-xs text-gray-500 bg-white rounded-xl px-3 py-3 border border-blue-100">
              没有找到匹配内容。
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BookSearchPanel;
