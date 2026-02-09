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
        <div className="flex flex-col text-right pr-3 select-none text-gray-300 font-mono text-sm leading-relaxed bg-gray-50/50 py-6 min-h-full border-r border-gray-100">
            {Array.from({ length: count }).map((_, i) => (
                <span key={i} className="h-[24px] leading-[24px] block">{i + 1}</span>
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
              <div className="flex-1 flex flex-col items-center justify-center text-gray-300 p-8 text-center bg-[#F5F5F7] pattern-grid opacity-80 h-full overflow-hidden">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <FolderOpen size={48} className="text-gray-300 ml-2" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-400 mb-2">未选择文件</h3>
                  <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
                      请从左侧资源管理器中选择一个文件以查看、编辑或管理。
                  </p>
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
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden relative">
            {/* Header Toolbar */}
            <div className="h-12 border-b border-gray-200 bg-white flex items-center justify-between px-4 flex-shrink-0 shadow-sm z-20">
                <div className="flex items-center space-x-2 overflow-hidden mr-4">
                    {/* Breadcrumbs */}
                    <div className="flex items-center text-xs text-gray-500 whitespace-nowrap overflow-hidden text-ellipsis">
                        {breadcrumbs?.map((node, i) => (
                            <React.Fragment key={node.id}>
                                {i > 0 && <ChevronRight size={12} className="mx-1 text-gray-300 flex-shrink-0"/>}
                                <span className={`flex items-center ${i === breadcrumbs.length - 1 ? 'font-bold text-gray-800' : 'hover:text-gray-700'}`}>
                                    {node.name}
                                </span>
                            </React.Fragment>
                        ))}
                    </div>
                    
                    {isDirty && <span className="flex-shrink-0 ml-2 text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium border border-amber-200 animate-in fade-in">未保存</span>}
                    
                    {selectedNode.fileType === 'css' && selectedNodeId?.startsWith('extra-') && (
                        <>
                            <div className="h-4 w-px bg-gray-200 mx-3"></div>
                            <div className="flex items-center flex-shrink-0 gap-3">
                                <label className="flex items-center cursor-pointer group select-none" title="启用/禁用此 CSS 文件">
                                    <div className="relative">
                                        <input type="checkbox" className="sr-only" checked={selectedNode.isActive} onChange={onToggleActive} />
                                        <div className={`w-8 h-4 rounded-full shadow-inner transition-colors ${selectedNode.isActive ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                                        <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${selectedNode.isActive ? 'translate-x-4' : ''}`}></div>
                                    </div>
                                    <span className={`ml-2 text-[10px] font-bold transition-colors uppercase ${selectedNode.isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                                        {selectedNode.isActive ? '启用' : '禁用'}
                                    </span>
                                </label>
                                
                                <button 
                                    onClick={() => setShowScopeModal(true)}
                                    className="flex items-center bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 px-2 py-1 rounded-md transition-colors group"
                                    title="点击配置应用范围"
                                >
                                    <SlidersHorizontal size={12} className="text-gray-400 group-hover:text-blue-500 mr-1.5"/>
                                    <span className={`text-[10px] font-bold ${scopeInfo.color}`}>
                                        {scopeInfo.text}
                                    </span>
                                </button>
                            </div>
                        </>
                    )}
                </div>

                <div className="flex items-center space-x-1">
                    {selectedNode.canRename && (
                        <button onClick={onRename} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="重命名">
                            <Edit2 size={16}/>
                        </button>
                    )}
                    <button onClick={onDownload} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="下载文件">
                        <Download size={16}/>
                    </button>
                    {selectedNode.canDelete && (
                        <div className="w-px h-4 bg-gray-200 mx-1"></div>
                    )}
                    {selectedNode.canDelete && (
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(selectedNode.id); // Pass ID explicitly
                            }} 
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" 
                            title="删除文件"
                        >
                            <Trash2 size={16}/>
                        </button>
                    )}
                    {(isDirty || selectedNode.isEditable) && (
                        <div className="ml-2 pl-2 border-l border-gray-200">
                            <button 
                                onClick={onSave} 
                                disabled={!isDirty}
                                className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    isDirty 
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 active:scale-95' 
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                                <Save size={14} className="mr-1.5" /> 保存
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Scope Configuration Modal */}
            {showScopeModal && selectedNode.fileType === 'css' && selectedNodeId?.startsWith('extra-') && (
                <div className="absolute inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-start justify-center pt-20 animate-in fade-in duration-200" onClick={() => setShowScopeModal(false)}>
                    <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 m-4 max-h-[80vh]" onClick={e => e.stopPropagation()}>
                         <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <div className="flex items-center gap-2">
                                <SlidersHorizontal size={16} className="text-blue-600"/>
                                <h3 className="font-bold text-gray-800 text-sm">CSS 应用范围设置</h3>
                            </div>
                            <button onClick={() => setShowScopeModal(false)} className="text-gray-400 hover:text-gray-600"><X size={16}/></button>
                         </div>
                         
                         <div className="p-4 bg-blue-50 border-b border-blue-100">
                            <p className="text-xs text-blue-700 leading-relaxed">
                                勾选此 CSS 需要生效的章节。如果需要全局应用，请勾选所有章节。<br/>
                                <span className="opacity-70 text-[10px]">未被选中的章节将不会加载此样式表。</span>
                            </p>
                         </div>

                         <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                            <label className="flex items-center p-3 rounded-lg hover:bg-gray-50 cursor-pointer border-b border-gray-100 mb-2">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center mr-3 transition-colors ${selectedNode.targetChapterIds?.length === chapters.length ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'}`}>
                                     {selectedNode.targetChapterIds?.length === chapters.length && <Check size={12} className="text-white"/>}
                                </div>
                                <input type="checkbox" className="hidden" checked={selectedNode.targetChapterIds?.length === chapters.length} onChange={handleToggleAllChapters} />
                                <span className="text-sm font-bold text-gray-800">全选 (全局应用)</span>
                            </label>
                            
                            <div className="space-y-1">
                                {chapters.map(chapter => {
                                    const isChecked = selectedNode.targetChapterIds 
                                        ? selectedNode.targetChapterIds.includes(chapter.id)
                                        : true; // Default logic in service, but here we treat explicit list
                                    
                                    // Actually, if targetChapterIds is undefined, logic usually implies global. 
                                    // But to be explicit in UI, we check if it is in the list.
                                    // However, our data model in StructureView handles undefined as 'manual list' in UI logic? 
                                    // In StructureView we initialize targetChapterIds as [] for new files.
                                    // Let's rely on the passed prop logic.
                                    
                                    const effectivelyChecked = selectedNode.targetChapterIds?.includes(chapter.id);

                                    return (
                                        <label key={chapter.id} className="flex items-center p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-all">
                                            <div className={`w-4 h-4 rounded border flex items-center justify-center mr-3 transition-colors ${effectivelyChecked ? 'bg-blue-500 border-blue-500' : 'border-gray-300 bg-white'}`}>
                                                 {effectivelyChecked && <Check size={10} className="text-white"/>}
                                            </div>
                                            <input 
                                                type="checkbox" 
                                                className="hidden"
                                                checked={!!effectivelyChecked}
                                                onChange={() => handleToggleTargetChapter(chapter.id)}
                                            />
                                            <span className="text-xs text-gray-600 truncate select-none flex-1">{chapter.title}</span>
                                            {effectivelyChecked && <span className="text-[10px] text-blue-600 font-medium bg-blue-50 px-1.5 py-0.5 rounded">生效</span>}
                                        </label>
                                    );
                                })}
                            </div>
                         </div>
                         
                         <div className="p-3 border-t border-gray-100 bg-gray-50 flex justify-end">
                             <button onClick={() => setShowScopeModal(false)} className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 shadow-sm">完成配置</button>
                         </div>
                    </div>
                </div>
            )}

            {/* Editor / Preview Area */}
            <div className="flex-1 flex overflow-hidden">
                {selectedNode.isEditable ? (
                    <>
                        <div className="flex-1 relative flex bg-white">
                            <LineNumbers count={lineCount || 1} />
                            <textarea 
                                className="flex-1 w-full h-full p-6 font-mono text-sm leading-[24px] bg-white text-gray-800 resize-none focus:outline-none custom-scrollbar"
                                spellCheck={false}
                                value={editorContent}
                                onChange={(e) => {
                                    setEditorContent(e.target.value);
                                    setIsDirty(true);
                                }}
                            />
                        </div>
                        {selectedNode.fileType === 'css' && selectedNodeId?.startsWith('extra-') && (
                            <div className="w-[35%] border-l border-gray-200 bg-white flex flex-col shadow-[-4px_0_15px_rgba(0,0,0,0.02)] z-10 hidden lg:flex">
                                {/* Header */}
                                <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200">
                                     <div className="flex items-center text-xs font-bold text-gray-500 uppercase tracking-widest">
                                        <Eye size={12} className="mr-2 text-blue-500"/> 实时预览
                                     </div>
                                </div>
                                
                                <div className="flex-1 overflow-hidden relative bg-gray-50/30">
                                        {selectedNode.isActive ? (
                                            <div className="flex flex-col h-full">
                                                <div className="p-2 border-b border-gray-200 bg-white flex items-center justify-between">
                                                    <span className="text-[10px] text-gray-400">选择预览底本:</span>
                                                    <select 
                                                        value={previewChapterId}
                                                        onChange={(e) => setPreviewChapterId(e.target.value)}
                                                        className="text-xs border border-gray-200 rounded bg-white py-1 px-2 focus:ring-1 focus:ring-blue-500 outline-none max-w-[150px]"
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
                                            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-gray-50">
                                                <div className="w-12 h-12 bg-gray-200 text-gray-400 rounded-full flex items-center justify-center mb-4">
                                                    <Info size={24}/>
                                                </div>
                                                <h3 className="text-sm font-bold text-gray-500 mb-2">样式已禁用</h3>
                                                <p className="text-xs text-gray-400 leading-relaxed max-w-[200px]">
                                                    请先启用此文件以查看预览效果。
                                                </p>
                                            </div>
                                        )}
                                </div>
                            </div>
                        )}
                        {/* Fallback for style.css which is global */}
                        {selectedNode.fileType === 'css' && selectedNodeId === 'style-css' && (
                             <div className="w-[35%] border-l border-gray-200 bg-white flex flex-col shadow-[-4px_0_15px_rgba(0,0,0,0.02)] z-10 hidden lg:flex">
                                <div className="p-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center">
                                        <Eye size={12} className="mr-2"/> 全局样式预览
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
                    <div className="flex-1 flex flex-col items-center justify-center bg-[#F5F5F7] h-full overflow-hidden relative">
                         {/* Checkerboard background for images */}
                         <div className="absolute inset-0 opacity-10" style={{ 
                             backgroundImage: `linear-gradient(45deg, #000 25%, transparent 25%), linear-gradient(-45deg, #000 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #000 75%), linear-gradient(-45deg, transparent 75%, #000 75%)`,
                             backgroundSize: '20px 20px',
                             backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px' 
                         }}></div>

                         {previewUrl ? (
                              <div className="relative z-10 flex flex-col items-center justify-center w-full h-full p-8">
                                   <div className="bg-white p-2 rounded-xl shadow-xl border border-gray-200 max-h-full max-w-full overflow-auto">
                                      <img src={previewUrl} alt="Preview" className="max-w-full max-h-[60vh] object-contain rounded-lg" />
                                   </div>
                                   <div className="mt-6 bg-white/90 backdrop-blur px-6 py-2 rounded-full shadow-sm border border-gray-200 flex items-center space-x-3">
                                       <FileImage size={16} className="text-purple-500"/>
                                       <div className="flex flex-col text-left">
                                           <span className="text-xs font-bold text-gray-700">{selectedNode.name}</span>
                                           <span className="text-[10px] text-gray-400 font-mono">{formatSize(selectedNode.sizeBytes)}</span>
                                       </div>
                                   </div>
                              </div>
                         ) : (
                              <div className="relative z-10 bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-sm text-center">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FileCode size={32} className="text-gray-400" />
                                </div>
                                <h3 className="font-bold text-gray-700 mb-2">{selectedNode.name}</h3>
                                <p className="text-xs text-gray-500 leading-relaxed mb-4">
                                    此文件为系统自动生成的标准文件（{selectedNode.fileType?.toUpperCase()}）。
                                    它将包含项目的元数据或目录结构，不支持直接编辑。
                                </p>
                                <button onClick={onDownload} className="text-blue-500 text-xs font-bold hover:underline">
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