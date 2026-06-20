/**
 * SensitiveWordsPanel - 敏感词修正面板
 *
 * 两个 Tab：
 * 1. 批量替换：管理替换规则，一键批量替换
 * 2. 逐条审阅：搜索占位符，逐条定位到编辑器中手动修改
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Chapter } from '../../types';
import {
  Plus,
  Trash2,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Play,
  MapPin,
  X,
} from 'lucide-react';
import { dialog } from '../../services/dialog';
import {
  ReplaceRule,
  previewBatchReplace,
  executeBatchReplace,
  findPlaceholderOccurrences,
  executePerOccurrenceReplace,
  PlaceholderMatch,
  PerOccurrenceReplacement,
  BUILTIN_TEMPLATES,
  PRESET_PATTERNS,
  loadSavedRules,
  saveRules,
  loadWordBank,
  saveWordBank,
} from '../../services/analysis/sensitiveWords';

interface SensitiveWordsPanelProps {
  chapters: Chapter[];
  onUpdateChapters: (chapters: Chapter[]) => void;
  onFocusSearchText: (chapterId: string, searchText: string) => void;
}

type TabType = 'batch' | 'review';

const SensitiveWordsPanel: React.FC<SensitiveWordsPanelProps> = ({
  chapters,
  onUpdateChapters,
  onFocusSearchText,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('batch');

  // ─── 批量替换状态 ───
  const [rules, setRules] = useState<ReplaceRule[]>(() => loadSavedRules());
  const [newFrom, setNewFrom] = useState('');
  const [newTo, setNewTo] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);

  // ─── 逐条审阅状态 ───
  const [searchPlaceholder, setSearchPlaceholder] = useState('');
  const [useRegex, setUseRegex] = useState(false);
  const [placeholderMatches, setPlaceholderMatches] = useState<PlaceholderMatch[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  // 每条匹配的替换词，key = "chapterId-occurrenceIndex"
  const [reviewReplacements, setReviewReplacements] = useState<Record<string, string>>({});
  // 词库：常用替换词快捷填入
  const [wordBank, setWordBank] = useState<string[]>(() => loadWordBank());
  const [newBankWord, setNewBankWord] = useState('');

  // 规则变更时自动保存
  useEffect(() => {
    saveRules(rules);
  }, [rules]);

  // 词库变更时自动保存
  useEffect(() => {
    saveWordBank(wordBank);
  }, [wordBank]);

  // 批量替换预览
  const previews = useMemo(
    () => previewBatchReplace(chapters, rules),
    [chapters, rules],
  );

  const totalMatches = previews.reduce((sum, p) => sum + p.totalMatches, 0);

  // ─── 批量替换操作 ───

  const handleAddRule = useCallback(() => {
    const from = newFrom.trim();
    if (!from) return;
    const newRule: ReplaceRule = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      from,
      to: newTo,
      enabled: true,
    };
    setRules((prev) => [...prev, newRule]);
    setNewFrom('');
    setNewTo('');
  }, [newFrom, newTo]);

  const handleDeleteRule = useCallback((id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const handleToggleRule = useCallback((id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)),
    );
  }, []);

  const handleImportTemplate = useCallback((templateIndex: number) => {
    const template = BUILTIN_TEMPLATES[templateIndex];
    if (!template) return;
    const existingFroms = new Set(rules.map((r) => r.from));
    const newRules = template.rules
      .filter((r) => !existingFroms.has(r.from)) // 不重复添加
      .map((r) => ({
        id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        from: r.from,
        to: r.to,
        enabled: true,
      }));
    if (newRules.length === 0) {
      dialog.alert('该模板中的规则已全部存在，无需重复添加。');
      return;
    }
    setRules((prev) => [...prev, ...newRules]);
    setShowTemplates(false);
  }, [rules]);

  const handleClearRules = useCallback(async () => {
    if (rules.length === 0) return;
    if (await dialog.confirm(`确定清空全部 ${rules.length} 条规则吗？`)) {
      setRules([]);
    }
  }, [rules.length]);

  const handleExecute = useCallback(async () => {
    const enabledCount = rules.filter((r) => r.enabled && r.from.trim()).length;
    if (enabledCount === 0) {
      await dialog.alert('没有启用的替换规则。');
      return;
    }
    if (totalMatches === 0) {
      await dialog.alert('当前规则在全书中没有找到匹配项。');
      return;
    }
    if (!(await dialog.confirm(`即将替换全书中 ${totalMatches} 处匹配，是否继续？`))) return;

    const result = executeBatchReplace(chapters, rules);
    onUpdateChapters(result.chapters);
    await dialog.alert(`替换完成，共修正了 ${result.totalChanges} 处内容。`);
  }, [rules, totalMatches, chapters, onUpdateChapters]);

  // ─── 逐条审阅操作 ───

  const handleSearchPlaceholder = useCallback(() => {
    const text = searchPlaceholder.trim();
    if (!text) return;
    const matches = findPlaceholderOccurrences(chapters, text, useRegex);
    setPlaceholderMatches(matches);
    setHasSearched(true);
    // 清空之前的替换词
    setReviewReplacements({});
  }, [chapters, searchPlaceholder, useRegex]);

  const handleLocate = useCallback(
    (match: PlaceholderMatch) => {
      // 用实际匹配到的文本跳转（正则模式下每处可能不同）
      onFocusSearchText(match.chapterId, match.matchedText);
    },
    [onFocusSearchText],
  );

  /** 更新某条匹配的替换词 */
  const handleSetReviewReplacement = useCallback((chapterId: string, occurrenceIndex: number, value: string) => {
    const key = `${chapterId}-${occurrenceIndex}`;
    setReviewReplacements((prev) => ({ ...prev, [key]: value }));
  }, []);

  /** 执行逐条替换 */
  const handleExecuteReview = useCallback(async () => {
    // 收集所有已填写替换词的条目
    const replacements: PerOccurrenceReplacement[] = [];
    placeholderMatches.forEach((match) => {
      const key = `${match.chapterId}-${match.occurrenceIndex}`;
      const replaceTo = reviewReplacements[key];
      // 只替换用户填写了内容的条目（空字符串也算，表示删除该占位符）
      if (replaceTo !== undefined && replaceTo !== '') {
        replacements.push({
          chapterId: match.chapterId,
          occurrenceIndex: match.occurrenceIndex,
          replaceTo,
        });
      }
    });

    if (replacements.length === 0) {
      await dialog.alert('请先在输入框中填写至少一处的替换词。');
      return;
    }

    if (!(await dialog.confirm(`即将替换 ${replacements.length} 处内容，是否继续？`))) return;

    const result = executePerOccurrenceReplace(chapters, searchPlaceholder.trim(), replacements, useRegex);
    onUpdateChapters(result.chapters);
    await dialog.alert(`替换完成，共修正了 ${result.totalChanges} 处内容。`);

    // 重新搜索以刷新结果
    const newMatches = findPlaceholderOccurrences(result.chapters, searchPlaceholder.trim(), useRegex);
    setPlaceholderMatches(newMatches);
    setReviewReplacements({});
  }, [placeholderMatches, reviewReplacements, chapters, searchPlaceholder, useRegex, onUpdateChapters]);

  // 已填写替换词的条目数
  const filledCount = useMemo(() => {
    return Object.values(reviewReplacements).filter((v) => v !== '').length;
  }, [reviewReplacements]);

  // Enter 键快捷操作
  const handleAddKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddRule();
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchPlaceholder();
    }
  };

  return (
    <div className="mt-3 rounded-2xl border border-violet-100 bg-violet-50/70 p-3 space-y-3">
      {/* 标题和 Tab 切换 */}
      <div className="flex items-center justify-between">
        <div className="text-xs font-bold uppercase tracking-wider text-violet-700">
          敏感词修正
        </div>
      </div>

      <div className="flex rounded-xl bg-violet-100/60 p-0.5">
        <button
          onClick={() => setActiveTab('batch')}
          className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-colors ${
            activeTab === 'batch'
              ? 'bg-white text-violet-700 shadow-sm'
              : 'text-violet-500 hover:text-violet-700'
          }`}
        >
          批量替换
        </button>
        <button
          onClick={() => setActiveTab('review')}
          className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-colors ${
            activeTab === 'review'
              ? 'bg-white text-violet-700 shadow-sm'
              : 'text-violet-500 hover:text-violet-700'
          }`}
        >
          逐条审阅
        </button>
      </div>

      {/* ━━━ 批量替换 Tab ━━━ */}
      {activeTab === 'batch' && (
        <div className="space-y-2">
          {/* 添加规则输入区 */}
          <div className="flex items-center gap-1.5">
            <input
              className="flex-1 min-w-0 rounded-lg border border-violet-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-300 placeholder:text-gray-400"
              placeholder="原文"
              value={newFrom}
              onChange={(e) => setNewFrom(e.target.value)}
              onKeyDown={handleAddKeyDown}
            />
            <ArrowRight size={12} className="text-violet-400 flex-shrink-0" />
            <input
              className="flex-1 min-w-0 rounded-lg border border-violet-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-300 placeholder:text-gray-400"
              placeholder="替换为"
              value={newTo}
              onChange={(e) => setNewTo(e.target.value)}
              onKeyDown={handleAddKeyDown}
            />
            <button
              onClick={handleAddRule}
              disabled={!newFrom.trim()}
              className="flex-shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500 text-white hover:bg-violet-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="添加规则"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* 模板和清空按钮 */}
          <div className="flex items-center gap-1.5">
            <div className="relative flex-1">
              <button
                onClick={() => setShowTemplates((v) => !v)}
                className="w-full flex items-center justify-between rounded-lg border border-violet-200 bg-white px-2.5 py-1.5 text-xs text-violet-600 hover:bg-violet-50 transition-colors"
              >
                <span>导入常用模板</span>
                {showTemplates ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
              {showTemplates && (
                <div className="absolute left-0 right-0 top-full mt-1 z-10 rounded-xl border border-violet-200 bg-white shadow-lg p-1.5 space-y-0.5">
                  {BUILTIN_TEMPLATES.map((tpl, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleImportTemplate(idx)}
                      className="w-full text-left rounded-lg px-2.5 py-2 text-xs text-gray-700 hover:bg-violet-50 hover:text-violet-700 transition-colors"
                    >
                      <div className="font-semibold">{tpl.name}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">
                        {tpl.rules.length} 条规则
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {rules.length > 0 && (
              <button
                onClick={handleClearRules}
                className="flex-shrink-0 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs text-red-500 hover:bg-red-50 transition-colors"
                title="清空所有规则"
              >
                清空
              </button>
            )}
          </div>

          {/* 规则列表 */}
          <div className="max-h-48 overflow-y-auto space-y-1">
            {rules.length > 0 ? (
              rules.map((rule) => {
                const preview = previews.find((p) => p.ruleId === rule.id);
                const matchCount = preview?.totalMatches || 0;

                return (
                  <div
                    key={rule.id}
                    className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs transition-colors ${
                      rule.enabled
                        ? 'bg-white border-violet-100'
                        : 'bg-gray-50 border-gray-100 opacity-50'
                    }`}
                  >
                    {/* 启用/禁用复选框 */}
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={() => handleToggleRule(rule.id)}
                      className="h-3.5 w-3.5 rounded border-gray-300 text-violet-600 focus:ring-violet-500 flex-shrink-0"
                    />
                    {/* 规则内容 */}
                    <span className="text-red-500 font-medium truncate min-w-0" title={rule.from}>
                      {rule.from}
                    </span>
                    <ArrowRight size={10} className="text-gray-300 flex-shrink-0" />
                    <span className="text-green-600 font-medium truncate min-w-0 flex-1" title={rule.to}>
                      {rule.to || <span className="text-gray-400 italic">（删除）</span>}
                    </span>
                    {/* 匹配数 */}
                    {rule.enabled && (
                      <span
                        className={`flex-shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                          matchCount > 0
                            ? 'bg-violet-100 text-violet-700'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {matchCount}
                      </span>
                    )}
                    {/* 删除按钮 */}
                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="flex-shrink-0 p-0.5 text-gray-300 hover:text-red-500 transition-colors"
                      title="删除规则"
                    >
                      <X size={12} />
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="rounded-xl border border-violet-100 bg-white px-3 py-3 text-xs text-gray-400 text-center">
                暂无规则，请添加或导入模板
              </div>
            )}
          </div>

          {/* 执行按钮 */}
          <button
            onClick={handleExecute}
            disabled={totalMatches === 0}
            className="w-full rounded-xl bg-violet-500 px-3 py-2 text-sm font-bold text-white hover:bg-violet-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Play size={14} className="inline mr-1.5" />
            执行替换
            {totalMatches > 0 && (
              <span className="ml-1.5 text-violet-200">({totalMatches} 处)</span>
            )}
          </button>
        </div>
      )}

      {/* ━━━ 逐条审阅 Tab ━━━ */}
      {activeTab === 'review' && (
        <div className="space-y-2">
          {/* 搜索输入 */}
          <div className="flex items-center gap-1.5">
            <input
              className="flex-1 min-w-0 rounded-lg border border-violet-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-300 placeholder:text-gray-400"
              placeholder={useRegex ? '输入正则表达式...' : '输入要查找的文本...'}
              value={searchPlaceholder}
              onChange={(e) => setSearchPlaceholder(e.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
            <button
              onClick={() => setUseRegex((v) => !v)}
              className={`flex-shrink-0 rounded-lg px-2 py-1.5 text-[10px] font-bold transition-colors ${
                useRegex
                  ? 'bg-violet-500 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
              title={useRegex ? '关闭正则' : '开启正则'}
            >
              .*
            </button>
            <button
              onClick={handleSearchPlaceholder}
              disabled={!searchPlaceholder.trim()}
              className="flex-shrink-0 rounded-lg bg-violet-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              搜索
            </button>
          </div>

          {/* 常用正则预设 */}
          {useRegex && (
            <div className="flex flex-wrap gap-1">
              {PRESET_PATTERNS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSearchPlaceholder(preset.pattern);
                  }}
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors ${
                    searchPlaceholder === preset.pattern
                      ? 'bg-violet-500 text-white'
                      : 'bg-violet-100 text-violet-600 hover:bg-violet-200'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          )}

          {/* 词库区域 */}
          <div className="rounded-xl border border-violet-100 bg-white px-2.5 py-2 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-violet-500 uppercase tracking-wider">词库</span>
              {wordBank.length > 0 && (
                <span className="text-[10px] text-gray-400">点击词语可快速填入</span>
              )}
            </div>
            {/* 词库列表 */}
            <div className="flex flex-wrap gap-1">
              {wordBank.map((word, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-0.5 rounded-full bg-violet-100 pl-2 pr-1 py-0.5 text-[11px] font-medium text-violet-700"
                >
                  {word}
                  <button
                    onClick={() => setWordBank((prev) => prev.filter((_, i) => i !== idx))}
                    className="p-0.5 text-violet-400 hover:text-red-500 transition-colors rounded-full"
                    title="从词库删除"
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
              {wordBank.length === 0 && (
                <span className="text-[10px] text-gray-400">暂无词语，请添加</span>
              )}
            </div>
            {/* 添加词语 */}
            <div className="flex items-center gap-1">
              <input
                className="flex-1 min-w-0 rounded-md border border-violet-200 bg-violet-50/50 px-2 py-1 text-[11px] outline-none focus:border-violet-400 placeholder:text-gray-400"
                placeholder="添加词语到词库..."
                value={newBankWord}
                onChange={(e) => setNewBankWord(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const w = newBankWord.trim();
                    if (w && !wordBank.includes(w)) {
                      setWordBank((prev) => [...prev, w]);
                      setNewBankWord('');
                    }
                  }
                }}
              />
              <button
                onClick={() => {
                  const w = newBankWord.trim();
                  if (w && !wordBank.includes(w)) {
                    setWordBank((prev) => [...prev, w]);
                    setNewBankWord('');
                  }
                }}
                disabled={!newBankWord.trim() || wordBank.includes(newBankWord.trim())}
                className="flex-shrink-0 inline-flex h-6 w-6 items-center justify-center rounded-md bg-violet-500 text-white hover:bg-violet-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="添加到词库"
              >
                <Plus size={12} />
              </button>
            </div>
          </div>

          {/* 搜索结果列表 */}
          <div className="max-h-72 overflow-y-auto space-y-1.5">
            {hasSearched && placeholderMatches.length === 0 && (
              <div className="rounded-xl border border-violet-100 bg-white px-3 py-3 text-xs text-gray-400 text-center">
                未找到匹配项
              </div>
            )}
            {placeholderMatches.map((match, idx) => {
              const key = `${match.chapterId}-${match.occurrenceIndex}`;
              const currentValue = reviewReplacements[key] || '';
              return (
                <div
                  key={`${match.chapterId}-${idx}`}
                  className="rounded-xl border border-violet-100 bg-white px-3 py-2 space-y-1.5"
                >
                  {/* 章节名 + 定位按钮 */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-violet-600 truncate">
                      {match.chapterTitle}
                    </span>
                    <button
                      onClick={() => handleLocate(match)}
                      className="text-gray-300 hover:text-violet-500 transition-colors flex-shrink-0 p-0.5"
                      title="跳转定位"
                    >
                      <MapPin size={12} />
                    </button>
                  </div>
                  {/* 上下文高亮 */}
                  <div className="text-xs text-gray-600 leading-relaxed">
                    {match.context.substring(0, match.highlightStart)}
                    <span className="bg-yellow-200 text-yellow-900 font-semibold rounded px-0.5">
                      {match.context.substring(match.highlightStart, match.highlightEnd)}
                    </span>
                    {match.context.substring(match.highlightEnd)}
                  </div>
                  {/* 替换输入框 + 词库快捷按钮 */}
                  <div className="flex items-center gap-1">
                    <ArrowRight size={10} className="text-violet-300 flex-shrink-0" />
                    <input
                      className="flex-1 min-w-0 rounded-lg border border-violet-200 bg-violet-50/50 px-2 py-1 text-xs outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-300 placeholder:text-gray-400"
                      placeholder="替换为..."
                      value={currentValue}
                      onChange={(e) => handleSetReviewReplacement(match.chapterId, match.occurrenceIndex, e.target.value)}
                    />
                    {wordBank.map((word, wIdx) => (
                      <button
                        key={wIdx}
                        onClick={() => handleSetReviewReplacement(match.chapterId, match.occurrenceIndex, word)}
                        className={`flex-shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                          currentValue === word
                            ? 'bg-violet-500 text-white'
                            : 'bg-violet-100 text-violet-600 hover:bg-violet-200'
                        }`}
                        title={`填入「${word}」`}
                      >
                        {word}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 底部：统计 + 执行按钮 */}
          {hasSearched && placeholderMatches.length > 0 && (
            <>
              <div className="text-[10px] text-violet-500 text-center font-medium">
                共 {placeholderMatches.length} 处 · 已填写 {filledCount} 处
              </div>
              <button
                onClick={handleExecuteReview}
                disabled={filledCount === 0}
                className="w-full rounded-xl bg-violet-500 px-3 py-2 text-sm font-bold text-white hover:bg-violet-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Play size={14} className="inline mr-1.5" />
                执行替换
                {filledCount > 0 && (
                  <span className="ml-1.5 text-violet-200">({filledCount} 处)</span>
                )}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SensitiveWordsPanel;
