import React, { useMemo, useState } from 'react';
import { Chapter } from '../../types';
import { searchChapters } from '../../services/analysis/book';

/** 常用正则预设 */
const PRESET_PATTERNS = [
  { label: '第X章', pattern: '第.{1,4}章' },
  { label: '第X节', pattern: '第.{1,4}节' },
  { label: '第X卷', pattern: '第.{1,4}卷' },
  { label: '连续星号', pattern: '\\*{2,}' },
  { label: '方括号占位', pattern: '【[^】]+】' },
];

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
  const [matchCase, setMatchCase] = useState(false);
  const [useRegex, setUseRegex] = useState(false);

  const results = useMemo(
    () => searchChapters(chapters, searchTerm, matchCase, useRegex),
    [chapters, searchTerm, matchCase, useRegex],
  );

  return (
    <div className="mt-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-bold uppercase tracking-wider text-blue-600">全书搜索</div>
        <span className="text-[10px] text-blue-500">{results.length} 个命中章节</span>
      </div>

      {/* 搜索输入框 */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={useRegex ? '输入正则表达式...' : '输入关键词，跨章节搜索正文'}
          className="flex-1 rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
          autoFocus
        />
        {/* 区分大小写 */}
        <button
          onClick={() => setMatchCase(!matchCase)}
          className={`flex-shrink-0 rounded-lg px-2 py-2 text-xs font-medium transition-colors ${
            matchCase
              ? 'bg-blue-500 text-white'
              : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
          }`}
          title={matchCase ? '区分大小写：开' : '区分大小写：关'}
        >
          Aa
        </button>
        {/* 正则模式 */}
        <button
          onClick={() => setUseRegex(!useRegex)}
          className={`flex-shrink-0 rounded-lg px-2 py-2 text-[10px] font-bold transition-colors ${
            useRegex
              ? 'bg-blue-500 text-white'
              : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
          }`}
          title={useRegex ? '关闭正则' : '开启正则'}
        >
          .*
        </button>
      </div>

      {/* 正则预设（仅在正则模式下显示） */}
      {useRegex && (
        <div className="flex flex-wrap gap-1">
          {PRESET_PATTERNS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => setSearchTerm(preset.pattern)}
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors ${
                searchTerm === preset.pattern
                  ? 'bg-blue-500 text-white'
                  : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}

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
