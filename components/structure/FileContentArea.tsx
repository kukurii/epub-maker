import React, { useMemo, useState } from 'react';
import { 
  ChevronRight, Save, Trash2, Download, Edit2, FileImage, 
  FolderOpen, Eye, Info, FileCode, SlidersHorizontal, Check, X
} from 'lucide-react';
import { FileNode } from './types';
import { Chapter, ExtraFile } from '../../types';

// Helper to format bytes
const formatSize = (bytes: number | undefined) => {
    if (bytes === undefined) return '-';
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const LineNumbers = ({ count }: { count: number }) => {
    return (
        <div className="flex flex-col text-right pr-4 select-none text-slate-400 font-mono text-xs leading-relaxed bg-gradient-to-r from-slate-50/80 to-transparent py-6 min-h-full border-r border-slate-200/60">
            {Array.from({ length: count }).map((_, i) => (
                <span key={i} className="h-[24px] leading-[24px] block hover:text-blue-500 transition-colors">{i + 1}</span>
            ))}
        </div>
    );
};

interface FileContentAreaProps {
    selectedNode: FileNode | null;
    selectedNodeId: string | null;
    breadcrumbs: FileNode[] | null;
    isDirty: boolean;
    editorContent: string;
    setEditorContent: (val: string) => void;
    setIsDirty: (val: boolean) => void;
    previewUrl: string | null;
    onSave: () => void;
    onDelete: (id: string) => void;
    onRename: () => void;
    onDownload: () => void;
    onToggleActive: () => void;
    chapters?: Chapter[];
    onUpdateFile?: (id: string, updates: Partial<ExtraFile>) => void;
}

const FileContentArea: React.FC<FileContentAreaProps> = ({
    selectedNode, selectedNodeId, breadcrumbs, isDirty, 
    editorContent, setEditorContent, setIsDirty, previewUrl,
    onSave, onDelete, onRename, onDownload, onToggleActive,
    chapters = [], onUpdateFile
}) => {
    const lineCount = useMemo(() => editorContent.split('\n').length, [editorContent]);
    const [previewChapterId, setPreviewChapterId] = useState<string>('default');
    const [showScopeModal, setShowScopeModal] = useState(false);

    if (!selectedNode) {
        return (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-300 p-8 text-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 h-full overflow-hidden relative">
                  {/* 背景装饰 */}
                  <div className="absolute inset-0 opacity-30">
                      <div className="absolute top-20 left-20 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl"></div>
                      <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl"></div>
                  </div>

                  <div className="relative z-10 flex flex-col items-center">
                      <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-blue-500/10 backdrop-blur-sm border border-white/50">
                        <FolderOpen size={56} className="text-slate-400 ml-2" />
                      </div>
                      <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-600 to-slate-800 mb-3">未选择文件</h3>
                      <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
                          请从左侧资源管理器中选择一个文件
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                          以查看、编辑或管理文件内容
                      </p>
                  </div>
              </div>
        );
    }

    const getPreviewHtml = () => {
        let bodyContent = '';
        if (previewChapterId === 'default') {
            bodyContent = `
                <div class="preview-card">
                    <h1>示例章节标题</h1>
                    <p>这是一段示例文本。您可以通过左侧的编辑器实时修改这段文字的样式（如字体颜色、行高、缩进等）。</p>
                    <p>
                        这里展示了 <strong>加粗文本(Bold)</strong>、<em>斜体文本(Italic)</em>、<u>下划线(Underline)</u> 以及 <s>删除线(Strikethrough)</s>。
                        此外，这是一个 <a href="#">超链接示例</a>。
                    </p>
                    <blockquote>
                        “这是一个引用块 (blockquote)。通常用于引用他人的话语或突出显示一段文字。”
                    </blockquote>
                    <hr />
                    <p>下方是图片示例（带图注）：</p>
                    <div style="background:#f0f0f0;height:100px;display:flex;align-items:center;justify-content:center;color:#aaa;border:2px dashed #ccc;margin:1em auto;border-radius:4px;">
                        [图片占位区域]
                    </div>
                    <p class="caption">图1.1 示例图片说明文字</p>
                    <ul>
                        <li>列表项一</li>
                        <li>列表项二</li>
                    </ul>
                </div>`;
        } else {
            const chapter = chapters.find(c => c.id === previewChapterId);
            if (chapter) {
                bodyContent = `<div class="chapter-content">${chapter.content}</div>`;
            } else {
                bodyContent = '<p>章节未找到</p>';
            }
        }

        return `<!DOCTYPE html><html lang="zh"><head><meta charset="utf-8"><style>
            body { padding: 20px; font-family: sans-serif; background: #fff; color: #333; line-height: 1.6; }
            .preview-card { border: 1px solid #eee; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
            img { max-width: 100%; height: auto; }
            ${editorContent}
        </style></head><body>${bodyContent}</body></html>`;
    };

    const handleToggleTargetChapter = (chapterId: string) => {
        if (!onUpdateFile || !selectedNodeId) return;
        
        const currentTargets = selectedNode.targetChapterIds || [];
        const isSelected = currentTargets.includes(chapterId);
        let newTargets: string[];
        
        if (isSelected) {
            newTargets = currentTargets.filter(id => id !== chapterId);
        } else {
            newTargets = [...currentTargets, chapterId];
        }
        
        onUpdateFile(selectedNodeId, { targetChapterIds: newTargets });
    };

    const handleToggleAllChapters = () => {
        if (!onUpdateFile || !selectedNodeId) return;
        
        const currentTargets = selectedNode.targetChapterIds || [];
        if (currentTargets.length === chapters.length) {
             onUpdateFile(selectedNodeId, { targetChapterIds: [] });
        } else {
             onUpdateFile(selectedNodeId, { targetChapterIds: chapters.map(c => c.id) });
        }
    };

    // Calculate scope display text
    const getScopeLabel = () => {
        if (!selectedNode.targetChapterIds || selectedNode.targetChapterIds.length === 0) {
            return { text: "应用到: 未指定", color: "text-gray-400" };
        }
        if (selectedNode.targetChapterIds.length === chapters.length) {
            return { text: "应用到: 全局 (所有章节)", color: "text-green-600" };
        }
        return { text: `应用到: ${selectedNode.targetChapterIds.length} 个章节`, color: "text-blue-600" };
    };

    const scopeInfo = getScopeLabel();

    return (
      <div className="flex-1 flex flex-col bg-gradient-to-br from-slate-50 via-white to-blue-50/20 overflow-hidden relative">
            {/* Header Toolbar - 全新渐变设计 */}
            <div className="h-14 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl flex items-center justify-between px-6 flex-shrink-0 shadow-sm z-20">
                <div className="flex items-center space-x-3 overflow-hidden mr-4">
                    {/* Breadcrumbs - 现代面包屑导航 */}
                    <div className="flex items-center text-sm text-slate-600 whitespace-nowrap overflow-hidden text-ellipsis">
                        {breadcrumbs?.map((node, i) => (
                            <React.Fragment key={node.id}>
                                {i > 0 && <ChevronRight size={14} className="mx-2 text-slate-300 flex-shrink-0"/>}
                                <span className={`flex items-center transition-colors ${i === breadcrumbs.length - 1 ? 'font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600' : 'hover:text-slate-800'}`}>
                                    {node.name}
                                </span>
                            </React.Fragment>
                        ))}
                    </div>

                    {isDirty && (
                        <span className="flex-shrink-0 ml-2 text-xs bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 px-3 py-1 rounded-full font-semibold border border-amber-200/50 animate-in fade-in shadow-sm">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 animate-pulse"></span>
                            未保存
                        </span>
                    )}

                    {selectedNode.fileType === 'css' && selectedNodeId?.startsWith('extra-') && (
                        <>
                            <div className="h-6 w-px bg-gradient-to-b from-transparent via-slate-300 to-transparent mx-3"></div>
                            <div className="flex items-center flex-shrink-0 gap-3">
                                {/* 启用/禁用开关 - 现代化设计 */}
                                <label className="flex items-center cursor-pointer group select-none" title="启用/禁用此 CSS 文件">
                                    <div className="relative">
                                        <input type="checkbox" className="sr-only" checked={selectedNode.isActive} onChange={onToggleActive} />
                                        <div className={`w-11 h-6 rounded-full shadow-inner transition-all duration-300 ${selectedNode.isActive ? 'bg-gradient-to-r from-blue-500 to-purple-600' : 'bg-slate-300'}`}></div>
                                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300 ${selectedNode.isActive ? 'translate-x-5' : ''}`}></div>
                                    </div>
                                    <span className={`ml-2.5 text-xs font-bold transition-colors uppercase tracking-wide ${selectedNode.isActive ? 'text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600' : 'text-slate-400'}`}>
                                        {selectedNode.isActive ? '已启用' : '已禁用'}
                                    </span>
                                </label>

                                {/* 应用范围按钮 - 渐变卡片 */}
                                <button
                                    onClick={() => setShowScopeModal(true)}
                                    className="flex items-center bg-white/80 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 border border-slate-200 hover:border-blue-300 px-3 py-1.5 rounded-xl transition-all duration-300 group shadow-sm hover:shadow-md"
                                    title="点击配置应用范围"
                                >
                                    <SlidersHorizontal size={14} className="text-slate-400 group-hover:text-blue-500 mr-2 transition-colors"/>
                                    <span className={`text-xs font-bold ${scopeInfo.color}`}>
                                        {scopeInfo.text}
                                    </span>
                                </button>
                            </div>
                        </>
                    )}
                </div>

                {/* 工具栏按钮组 - 现代化设计 */}
                <div className="flex items-center space-x-2">
                    {selectedNode.canRename && (
                        <button onClick={onRename} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 hover:scale-105" title="重命名">
                            <Edit2 size={18}/>
                        </button>
                    )}
                    <button onClick={onDownload} className="p-2 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all duration-200 hover:scale-105" title="下载文件">
                        <Download size={18}/>
                    </button>
                    {selectedNode.canDelete && (
                        <div className="w-px h-5 bg-gradient-to-b from-transparent via-slate-300 to-transparent mx-1"></div>
                    )}
                    {selectedNode.canDelete && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(selectedNode.id);
                            }}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200 hover:scale-105"
                            title="删除文件"
                        >
                            <Trash2 size={18}/>
                        </button>
                    )}
                    {(isDirty || selectedNode.isEditable) && (
                        <div className="ml-2 pl-3 border-l border-slate-200">
                            <button
                                onClick={onSave}
                                disabled={!isDirty}
                                className={`flex items-center px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
                                    isDirty
                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 active:scale-95'
                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                }`}
                            >
                                <Save size={16} className="mr-2" /> 保存更改
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Scope Configuration Modal */}
            {showScopeModal && selectedNode.fileType === 'css' && selectedNodeId?.startsWith('extra-') && (
                <div className="absolute inset-0 z-50 bg-black/30 backdrop-blur-md flex items-start justify-center pt-20 animate-in fade-in duration-300" onClick={() => setShowScopeModal(false)}>
                    <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/50 w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 m-4 max-h-[80vh]" onClick={e => e.stopPropagation()}>
                         <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-blue-50 to-purple-50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md shadow-blue-500/30">
                                    <SlidersHorizontal size={18} className="text-white"/>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-base">CSS 应用范围设置</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">配置样式生效的章节</p>
                                </div>
                            </div>
                            <button onClick={() => setShowScopeModal(false)} className="text-slate-400 hover:text-slate-600 bg-white/50 hover:bg-white rounded-xl p-2 transition-all">
                                <X size={18}/>
                            </button>
                         </div>

                         <div className="p-4 bg-gradient-to-r from-blue-50/50 to-purple-50/50 border-b border-slate-100">
                            <p className="text-xs text-slate-600 leading-relaxed">
                                勾选此 CSS 需要生效的章节。如果需要全局应用，请勾选所有章节。
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                                未被选中的章节将不会加载此样式表。
                            </p>
                         </div>

                         <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                            <label className="flex items-center p-4 rounded-2xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 cursor-pointer border border-slate-200 mb-3 transition-all group">
                                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center mr-3 transition-all ${selectedNode.targetChapterIds?.length === chapters.length ? 'bg-gradient-to-br from-blue-600 to-purple-600 border-transparent shadow-md shadow-blue-500/30' : 'border-slate-300 bg-white group-hover:border-blue-400'}`}>
                                     {selectedNode.targetChapterIds?.length === chapters.length && <Check size={14} className="text-white font-bold"/>}
                                </div>
                                <input type="checkbox" className="hidden" checked={selectedNode.targetChapterIds?.length === chapters.length} onChange={handleToggleAllChapters} />
                                <span className="text-sm font-bold text-slate-800">全选 (全局应用)</span>
                            </label>

                            <div className="space-y-2">
                                {chapters.map(chapter => {
                                    const effectivelyChecked = selectedNode.targetChapterIds?.includes(chapter.id);

                                    return (
                                        <label key={chapter.id} className="flex items-center p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-all group">
                                            <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center mr-3 transition-all ${effectivelyChecked ? 'bg-gradient-to-br from-blue-500 to-purple-600 border-transparent shadow-sm shadow-blue-500/20' : 'border-slate-300 bg-white group-hover:border-blue-300'}`}>
                                                 {effectivelyChecked && <Check size={12} className="text-white font-bold"/>}
                                            </div>
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={!!effectivelyChecked}
                                                onChange={() => handleToggleTargetChapter(chapter.id)}
                                            />
                                            <span className="text-sm text-slate-600 truncate select-none flex-1">{chapter.title}</span>
                                            {effectivelyChecked && <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-1 rounded-lg">生效</span>}
                                        </label>
                                    );
                                })}
                            </div>
                         </div>

                         <div className="p-4 border-t border-slate-100 bg-gradient-to-r from-slate-50 to-white flex justify-end">
                             <button onClick={() => setShowScopeModal(false)} className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 active:scale-95">
                                 完成配置
                             </button>
                         </div>
                    </div>
                </div>
            )}

            {/* Editor / Preview Area - 全新设计 */}
            <div className="flex-1 flex overflow-hidden">
                {selectedNode.isEditable ? (
                    <>
                        {/* 编辑器区域 - 现代化设计 */}
                        <div className="flex-1 relative flex bg-white shadow-inner">
                            <LineNumbers count={lineCount || 1} />
                            <textarea
                                className="flex-1 w-full h-full p-6 font-mono text-sm leading-[24px] bg-gradient-to-br from-white to-slate-50/30 text-slate-800 resize-none focus:outline-none custom-scrollbar selection:bg-blue-200/50"
                                spellCheck={false}
                                value={editorContent}
                                onChange={(e) => {
                                    setEditorContent(e.target.value);
                                    setIsDirty(true);
                                }}
                                placeholder="在此输入代码..."
                            />
                        </div>
                        {selectedNode.fileType === 'css' && selectedNodeId?.startsWith('extra-') && (
                            <div className="w-[35%] border-l border-slate-200/60 bg-gradient-to-br from-white to-slate-50/30 flex flex-col shadow-[-8px_0_24px_rgba(0,0,0,0.03)] z-10 hidden lg:flex">
                                {/* 预览区头部 */}
                                <div className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm border-b border-slate-200/60">
                                     <div className="flex items-center text-sm font-bold text-slate-700">
                                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mr-3 shadow-md shadow-blue-500/20">
                                            <Eye size={14} className="text-white"/>
                                        </div>
                                        <span>实时预览</span>
                                     </div>
                                </div>

                                <div className="flex-1 overflow-hidden relative bg-slate-50/50">
                                        {selectedNode.isActive ? (
                                            <div className="flex flex-col h-full">
                                                <div className="p-3 border-b border-slate-200/60 bg-white/60 backdrop-blur-sm flex items-center justify-between">
                                                    <span className="text-xs text-slate-500 font-medium">选择预览底本:</span>
                                                    <select
                                                        value={previewChapterId}
                                                        onChange={(e) => setPreviewChapterId(e.target.value)}
                                                        className="text-xs border border-slate-200 rounded-xl bg-white py-1.5 px-3 focus:ring-2 focus:ring-blue-500/50 outline-none max-w-[150px] shadow-sm"
                                                    >
                                                        <option value="default">默认示例</option>
                                                        <optgroup label="项目章节">
                                                            {chapters.map(c => (
                                                                <option key={c.id} value={c.id}>{c.title}</option>
                                                            ))}
                                                        </optgroup>
                                                    </select>
                                                </div>
                                                <div className="flex-1">
                                                    <iframe
                                                        title="CSS Live Preview"
                                                        className="w-full h-full border-none"
                                                        srcDoc={getPreviewHtml()}
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-slate-50 to-blue-50/30">
                                                <div className="w-16 h-16 bg-gradient-to-br from-slate-200 to-slate-300 text-slate-400 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                                                    <Info size={28}/>
                                                </div>
                                                <h3 className="text-sm font-bold text-slate-600 mb-2">样式已禁用</h3>
                                                <p className="text-xs text-slate-400 leading-relaxed max-w-[200px]">
                                                    请先启用此文件以查看预览效果
                                                </p>
                                            </div>
                                        )}
                                </div>
                            </div>
                        )}
                        {/* Fallback for style.css which is global */}
                        {selectedNode.fileType === 'css' && selectedNodeId === 'style-css' && (
                             <div className="w-[35%] border-l border-slate-200/60 bg-gradient-to-br from-white to-slate-50/30 flex flex-col shadow-[-8px_0_24px_rgba(0,0,0,0.03)] z-10 hidden lg:flex">
                                <div className="p-4 bg-white/80 backdrop-blur-sm border-b border-slate-200/60 flex items-center justify-between">
                                    <div className="flex items-center text-sm font-bold text-slate-700">
                                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mr-3 shadow-md shadow-green-500/20">
                                            <Eye size={14} className="text-white"/>
                                        </div>
                                        <span>全局样式预览</span>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-hidden relative">
                                    <iframe
                                        title="CSS Live Preview"
                                        className="w-full h-full border-none"
                                        srcDoc={getPreviewHtml()}
                                    />
                                </div>
                             </div>
                        )}
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/20 to-purple-50/10 h-full overflow-hidden relative">
                         {/* 背景装饰 */}
                         <div className="absolute inset-0 opacity-20">
                             <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/30 rounded-full blur-3xl"></div>
                             <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/30 rounded-full blur-3xl"></div>
                         </div>

                         {previewUrl ? (
                              <div className="relative z-10 flex flex-col items-center justify-center w-full h-full p-8">
                                   <div className="bg-white/80 backdrop-blur-md p-4 rounded-3xl shadow-2xl border border-white/50 max-h-full max-w-full overflow-auto">
                                      <img src={previewUrl} alt="Preview" className="max-w-full max-h-[60vh] object-contain rounded-2xl" />
                                   </div>
                                   <div className="mt-8 bg-white/90 backdrop-blur-md px-8 py-4 rounded-2xl shadow-lg border border-slate-200/50 flex items-center space-x-4">
                                       <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-md shadow-purple-500/30">
                                           <FileImage size={20} className="text-white"/>
                                       </div>
                                       <div className="flex flex-col text-left">
                                           <span className="text-sm font-bold text-slate-700">{selectedNode.name}</span>
                                           <span className="text-xs text-slate-400 font-mono">{formatSize(selectedNode.sizeBytes)}</span>
                                       </div>
                                   </div>
                              </div>
                         ) : (
                              <div className="relative z-10 bg-white/80 backdrop-blur-md p-10 rounded-3xl shadow-xl border border-white/50 max-w-md text-center">
                                <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                                    <FileCode size={36} className="text-slate-400" />
                                </div>
                                <h3 className="font-bold text-slate-700 mb-3 text-lg">{selectedNode.name}</h3>
                                <p className="text-sm text-slate-500 leading-relaxed mb-6">
                                    此文件为系统自动生成的标准文件（{selectedNode.fileType?.toUpperCase()}）。
                                    它将包含项目的元数据或目录结构，不支持直接编辑。
                                </p>
                                <button onClick={onDownload} className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 active:scale-95">
                                    下载以查看内容
                                </button>
                              </div>
                         )}
                    </div>
                )}
            </div>
      </div>
    );
};

export default FileContentArea;