import React, { useMemo } from 'react';
import { Chapter, ImageAsset } from '../../types';
import { Wand2 } from 'lucide-react';
import { dialog } from '../../services/dialog';
import {
  CLEANUP_RULE_LABELS,
  CleanupOptions,
  CleanupRuleKey,
  executeCleanup,
  previewCleanup,
} from '../../services/bookAnalysis';

interface CleanupPanelProps {
  chapters: Chapter[];
  images: ImageAsset[];
  /** 清理选项 */
  options: CleanupOptions;
  /** 更新选项 */
  onOptionsChange: (opts: CleanupOptions) => void;
  /** 更新章节（清理后） */
  onUpdateChapters: (chapters: Chapter[]) => void;
}

/**
 * 一键清理面板
 * 预览和执行各项内容清理规则
 */
const CleanupPanel: React.FC<CleanupPanelProps> = ({
  chapters,
  images,
  options,
  onOptionsChange,
  onUpdateChapters,
}) => {
  // 预览清理结果
  const preview = useMemo(
    () => previewCleanup(chapters, images, options),
    [chapters, images, options],
  );

  const totalIssues = preview.reduce(
    (sum, ch) => sum + ch.changes.reduce((s, c) => s + c.total, 0),
    0,
  );

  /** 执行清理 */
  const handleRunCleanup = async () => {
    const result = executeCleanup(chapters, images, options);
    if (result.totalChanges === 0) {
      await dialog.alert('当前没有可清理的问题。');
      return;
    }

    if (!(await dialog.confirm(`即将应用 ${result.totalChanges} 处清理，是否继续？`))) return;

    onUpdateChapters(result.chapters);
    await dialog.alert(`清理完成，共处理 ${result.totalChanges} 处内容问题。`);
  };

  const ruleKeys = Object.keys(options) as CleanupRuleKey[];

  return (
    <div className="mt-3 rounded-2xl border border-amber-100 bg-amber-50/70 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-bold uppercase tracking-wider text-amber-700">一键清理</div>
        <span className="text-[10px] font-bold text-amber-600">{totalIssues} 处待处理</span>
      </div>

      {/* 规则复选框 */}
      <div className="space-y-2">
        {ruleKeys.map((key) => (
          <label
            key={key}
            className="flex items-center justify-between rounded-xl bg-white border border-amber-100 px-3 py-2 text-xs text-gray-700"
          >
            <span>{CLEANUP_RULE_LABELS[key]}</span>
            <input
              type="checkbox"
              checked={options[key]}
              onChange={(e) => onOptionsChange({ ...options, [key]: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
            />
          </label>
        ))}
      </div>

      {/* 预览区 */}
      <div className="max-h-40 overflow-y-auto space-y-2">
        {preview.length > 0 ? (
          preview.slice(0, 8).map((ch) => (
            <div key={ch.chapterId} className="rounded-xl bg-white border border-amber-100 px-3 py-2">
              <div className="text-xs font-semibold text-gray-800 truncate">{ch.chapterTitle}</div>
              <div className="mt-1 flex flex-wrap gap-1">
                {ch.changes.map((change) => (
                  <span
                    key={change.key}
                    className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700"
                  >
                    {change.label} {change.total}
                  </span>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl bg-white border border-amber-100 px-3 py-3 text-xs text-gray-500">
            当前没有可清理的问题。
          </div>
        )}
      </div>

      {/* 执行按钮 */}
      <button
        onClick={handleRunCleanup}
        className="w-full rounded-xl bg-amber-500 px-3 py-2 text-sm font-bold text-white hover:bg-amber-600 transition-colors"
      >
        <Wand2 size={14} className="inline mr-1.5" />
        执行清理
      </button>
    </div>
  );
};

export default CleanupPanel;
