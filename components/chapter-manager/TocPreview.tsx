import React, { useMemo, useState } from 'react';
import { Chapter, TocItem } from '../../types';
import { Eye, EyeOff, ListTree, Save, Trash2, X } from 'lucide-react';
import { getTocStats } from '../../services/toc';

interface TocPreviewProps {
  chapters: Chapter[];
  tocTitle: string;
  onUpdateChapters: (chapters: Chapter[]) => void;
  onUpdateTocTitle: (title: string | undefined) => void;
  onClose: () => void;
}

const TocPreview: React.FC<TocPreviewProps> = ({
  chapters,
  tocTitle,
  onUpdateChapters,
  onUpdateTocTitle,
  onClose,
}) => {
  const [draftChapters, setDraftChapters] = useState<Chapter[]>(chapters.map(cloneChapter));
  const [draftTocTitle, setDraftTocTitle] = useState(tocTitle);
  const stats = useMemo(() => getTocStats(draftChapters), [draftChapters]);

  const updateChapter = (chapterId: string, updates: Partial<Chapter>) => {
    setDraftChapters((prev) =>
      prev.map((chapter) => (chapter.id === chapterId ? { ...chapter, ...updates } : chapter)),
    );
  };

  const updateSubItem = (chapterId: string, itemId: string, updates: Partial<TocItem>) => {
    setDraftChapters((prev) =>
      prev.map((chapter) => {
        if (chapter.id !== chapterId) return chapter;
        return {
          ...chapter,
          subItems: (chapter.subItems || []).map((item) =>
            item.id === itemId ? { ...item, ...updates } : item,
          ),
        };
      }),
    );
  };

  const removeSubItem = (chapterId: string, itemId: string) => {
    setDraftChapters((prev) =>
      prev.map((chapter) => {
        if (chapter.id !== chapterId) return chapter;
        return {
          ...chapter,
          subItems: (chapter.subItems || []).filter((item) => item.id !== itemId),
        };
      }),
    );
  };

  const handleSave = () => {
    onUpdateChapters(draftChapters);
    onUpdateTocTitle(draftTocTitle.trim() || undefined);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-3 backdrop-blur-sm animate-in fade-in duration-200 md:p-6"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-[min(1120px,96vw)] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="shrink-0 border-b border-gray-100 bg-white px-5 py-4 md:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-semibold text-indigo-600">
                <ListTree size={16} />
                编辑导出目录
              </div>
              <h3 className="mt-1 truncate text-xl font-bold text-gray-900">{draftTocTitle || '目录'}</h3>
              <p className="mt-1 text-xs text-gray-500">
                修改目录文字、层级和显示状态后，导出 EPUB 会使用这里保存的目录。
              </p>
            </div>
            <button
              onClick={onClose}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              title="关闭"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <Stat label="入目录" value={stats.includedChapters} />
            <Stat label="小标题" value={stats.subItemCount} />
            <Stat label="已排除" value={stats.excludedChapters} />
          </div>

          <label className="mt-4 block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-gray-400">
              目录页标题（写入 title 和 h1）
            </span>
            <input
              value={draftTocTitle}
              onChange={(event) => setDraftTocTitle(event.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              placeholder="目录"
            />
          </label>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-gray-50/70 px-3 py-4 custom-scrollbar md:px-5">
          <div className="space-y-3">
            {draftChapters.map((chapter, index) => {
              const included = !chapter.excludeFromToc;

              return (
                <div
                  key={chapter.id}
                  className={`rounded-2xl border bg-white p-4 shadow-sm transition-opacity ${
                    included ? 'border-gray-100' : 'border-gray-100 opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-100 font-mono text-sm font-bold text-gray-500">
                      {index + 1}
                    </div>

                    <div className="min-w-0 flex-1 space-y-3">
                      <label className="block">
                        <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-gray-400">
                          目录标题
                        </span>
                        <input
                          value={chapter.title}
                          onChange={(event) => updateChapter(chapter.id, { title: event.target.value })}
                          className="w-full min-w-0 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                          placeholder="目录标题"
                        />
                      </label>

                      <div className="flex flex-wrap items-end gap-2">
                        <label className="block w-32">
                          <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-gray-400">
                            层级
                          </span>
                          <select
                            value={chapter.level}
                            onChange={(event) =>
                              updateChapter(chapter.id, { level: Number(event.target.value) as 1 | 2 })
                            }
                            className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-600 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                          >
                            <option value={1}>一级</option>
                            <option value={2}>二级</option>
                          </select>
                        </label>

                        <button
                          onClick={() => updateChapter(chapter.id, { excludeFromToc: included })}
                          className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-semibold transition-colors ${
                            included
                              ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                          }`}
                          title={included ? '点击从目录隐藏' : '点击显示到目录'}
                        >
                          {included ? <Eye size={16} /> : <EyeOff size={16} />}
                          {included ? '显示' : '隐藏'}
                        </button>
                      </div>

                      {(chapter.subItems?.length || 0) > 0 && (
                        <div className="space-y-2 border-l border-gray-200 pl-3">
                          {chapter.subItems?.map((subItem) => (
                            <div key={subItem.id} className="rounded-xl bg-gray-50 p-3">
                              <label className="block">
                                <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-gray-400">
                                  小标题
                                </span>
                                <input
                                  value={subItem.text}
                                  onChange={(event) =>
                                    updateSubItem(chapter.id, subItem.id, { text: event.target.value })
                                  }
                                  className="w-full min-w-0 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                  placeholder="小标题"
                                />
                              </label>

                              <div className="mt-2 flex flex-wrap items-end gap-2">
                                <label className="block w-32">
                                  <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-gray-400">
                                    层级
                                  </span>
                                  <select
                                    value={subItem.level}
                                    onChange={(event) =>
                                      updateSubItem(chapter.id, subItem.id, {
                                        level: Number(event.target.value) as 1 | 2,
                                      })
                                    }
                                    className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-600 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                  >
                                    <option value={1}>小节</option>
                                    <option value={2}>子节</option>
                                  </select>
                                </label>

                                <button
                                  onClick={() => removeSubItem(chapter.id, subItem.id)}
                                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-red-400 transition-colors hover:bg-red-50 hover:text-red-500"
                                  title="从导出目录移除"
                                >
                                  <Trash2 size={15} />
                                  移除
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {draftChapters.length === 0 && (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-12 text-center text-sm text-gray-400">
                当前没有目录项
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0 border-t border-gray-100 bg-white px-5 py-4 md:px-6">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="inline-flex items-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-colors hover:bg-blue-700"
            >
              <Save size={15} className="mr-1.5" />
              保存目录
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const cloneChapter = (chapter: Chapter): Chapter => ({
  ...chapter,
  subItems: chapter.subItems?.map((item) => ({ ...item })) || [],
});

const Stat: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="rounded-xl bg-gray-50 px-3 py-2">
    <div className="text-base font-bold text-gray-900">{value}</div>
    <div className="text-[11px] text-gray-500">{label}</div>
  </div>
);

export default TocPreview;
