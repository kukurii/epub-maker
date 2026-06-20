import React, { useEffect, useRef } from 'react';
import { Search, ChevronUp, ChevronDown, X, CaseSensitive, WholeWord, Type } from 'lucide-react';

/** 常用正则预设 */
const PRESET_PATTERNS = [
  { label: '第X章', pattern: '第.{1,4}章' },
  { label: '第X节', pattern: '第.{1,4}节' },
  { label: '第X卷', pattern: '第.{1,4}卷' },
  { label: '连续星号', pattern: '\\*{2,}' },
  { label: '方括号占位', pattern: '【[^】]+】' },
];

interface FindReplaceBarProps {
  findText: string;
  setFindText: (val: string) => void;
  replaceText: string;
  setReplaceText: (val: string) => void;
  matchCase: boolean;
  setMatchCase: (val: boolean) => void;
  wholeWord: boolean;
  setWholeWord: (val: boolean) => void;
  useRegex: boolean;
  setUseRegex: (val: boolean) => void;
  matchesCount: number;
  currentMatchIndex: number;
  onNavigateNext: () => void;
  onNavigatePrev: () => void;
  onReplace: () => void;
  onReplaceAll: () => void;
  onClose: () => void;
}

/**
 * 查找替换栏
 */
const FindReplaceBar: React.FC<FindReplaceBarProps> = ({
  findText,
  setFindText,
  replaceText,
  setReplaceText,
  matchCase,
  setMatchCase,
  wholeWord,
  setWholeWord,
  useRegex,
  setUseRegex,
  matchesCount,
  currentMatchIndex,
  onNavigateNext,
  onNavigatePrev,
  onReplace,
  onReplaceAll,
  onClose,
}) => {
  const findInputRef = useRef<HTMLInputElement>(null);

  // 打开时自动聚焦搜索框
  useEffect(() => {
    findInputRef.current?.focus();
    findInputRef.current?.select();
  }, []);

  return (
    <div className="flex-none bg-white border-b border-gray-200 px-6 py-2 space-y-2 animate-in slide-in-from-top-2 z-10 shadow-sm">
      {/* 主控制行 */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* 搜索输入区 */}
        <div className="flex items-center bg-gray-100 rounded-lg px-3 py-1.5 flex-1 min-w-[150px]">
          <Search size={14} className="text-gray-400 mr-2 flex-shrink-0" />
          <input
            ref={findInputRef}
            className="text-sm bg-transparent outline-none w-full min-w-0 placeholder:text-gray-400"
            placeholder={useRegex ? '正则表达式...' : '查找...'}
            value={findText}
            onChange={(e) => setFindText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (e.shiftKey) onNavigatePrev();
                else onNavigateNext();
              }
              if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
              }
            }}
          />

          <div className="h-4 w-px bg-gray-300 mx-2 flex-shrink-0" />

          {/* 区分大小写 */}
          <button
            onClick={() => setMatchCase(!matchCase)}
            className={`p-0.5 rounded transition-colors ${
              matchCase ? 'bg-blue-200 text-blue-700' : 'text-gray-400 hover:text-gray-600'
            }`}
            title="区分大小写"
          >
            <CaseSensitive size={14} />
          </button>

          {/* 全词匹配 */}
          <button
            onClick={() => setWholeWord(!wholeWord)}
            disabled={useRegex}
            className={`ml-1 p-0.5 rounded transition-colors ${
              wholeWord ? 'bg-blue-200 text-blue-700' : 'text-gray-400 hover:text-gray-600'
            } ${useRegex ? 'opacity-40 cursor-not-allowed' : ''}`}
            title={useRegex ? '正则模式下不可用' : '全词匹配'}
          >
            <WholeWord size={14} />
          </button>

          {/* 正则模式 */}
          <button
            onClick={() => setUseRegex(!useRegex)}
            className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors ${
              useRegex ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
            title={useRegex ? '关闭正则' : '开启正则'}
          >
            .*
          </button>

          {/* 匹配计数 */}
          {findText && (
            <span className="text-xs text-gray-400 ml-2 whitespace-nowrap tabular-nums border-l border-gray-300 pl-2">
              {matchesCount > 0 ? `${currentMatchIndex + 1}/${matchesCount}` : '0/0'}
            </span>
          )}
        </div>

        {/* 上/下导航按钮 */}
        <div className="flex space-x-1 flex-shrink-0 bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={onNavigatePrev}
            className="p-1 hover:bg-white hover:shadow-sm rounded transition-all text-gray-500"
            title="上一个"
          >
            <ChevronUp size={16} />
          </button>
          <button
            onClick={onNavigateNext}
            className="p-1 hover:bg-white hover:shadow-sm rounded transition-all text-gray-500"
            title="下一个"
          >
            <ChevronDown size={16} />
          </button>
        </div>

        {/* 替换输入区 */}
        <div className="flex items-center bg-gray-100 rounded-lg px-3 py-1.5 flex-1 min-w-[150px]">
          <Type size={14} className="text-gray-400 mr-2 flex-shrink-0" />
          <input
            className="text-sm bg-transparent outline-none w-full min-w-0 placeholder:text-gray-400"
            placeholder="替换..."
            value={replaceText}
            onChange={(e) => setReplaceText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (e.shiftKey) onReplaceAll();
                else onReplace();
              }
            }}
          />
        </div>

        {/* 替换按钮 */}
        <button
          onClick={onReplace}
          className="px-4 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-semibold transition-colors flex-shrink-0"
        >
          替换
        </button>
        <button
          onClick={onReplaceAll}
          className="px-4 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-sm font-semibold transition-colors flex-shrink-0"
        >
          全部替换
        </button>

        {/* 关闭按钮 */}
        <button onClick={onClose} className="ml-auto text-gray-400 hover:text-gray-600 flex-shrink-0">
          <X size={18} />
        </button>
      </div>

      {/* 正则预设（仅在正则模式下显示） */}
      {useRegex && (
        <div className="flex flex-wrap gap-1 px-1">
          {PRESET_PATTERNS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => setFindText(preset.pattern)}
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors ${
                findText === preset.pattern
                  ? 'bg-blue-500 text-white'
                  : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default FindReplaceBar;
