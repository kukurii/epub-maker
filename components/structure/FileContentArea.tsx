import React, { useMemo } from 'react';
import { 
  ChevronRight, Save, Trash2, Download, Edit2, FileImage, 
  FolderOpen, Eye, CheckCircle2, Info, FileCode 
} from 'lucide-react';
import { FileNode } from './types';

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
    onDelete: () => void;
    onRename: () => void;
    onDownload: () => void;
    onToggleActive: () => void;
}

const FileContentArea: React.FC<FileContentAreaProps> = ({
    selectedNode, selectedNodeId, breadcrumbs, isDirty, 
    editorContent, setEditorContent, setIsDirty, previewUrl,
    onSave, onDelete, onRename, onDownload, onToggleActive
}) => {
    const lineCount = useMemo(() => editorContent.split('\n').length, [editorContent]);

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
                        <div className="ml-4 flex items-center flex-shrink-0">
                            <label className="flex items-center cursor-pointer group select-none">
                                <div className="relative">
                                    <input type="checkbox" className="sr-only" checked={selectedNode.isActive} onChange={onToggleActive} />
                                    <div className={`w-8 h-4 rounded-full shadow-inner transition-colors ${selectedNode.isActive ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                                    <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${selectedNode.isActive ? 'translate-x-4' : ''}`}></div>
                                </div>
                                <span className={`ml-2 text-[10px] font-bold transition-colors uppercase ${selectedNode.isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                                    {selectedNode.isActive ? '启用中' : '已禁用'}
                                </span>
                            </label>
                        </div>
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
                        <button onClick={onDelete} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="删除文件">
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
                        {selectedNode.fileType === 'css' && (
                            <div className="w-[30%] border-l border-gray-200 bg-white flex flex-col shadow-[-4px_0_15px_rgba(0,0,0,0.02)] z-10 hidden lg:flex">
                                <div className="p-3 bg-gray-50 border-b border-gray-200 text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center justify-between">
                                    <span className="flex items-center"><Eye size={12} className="mr-2"/> 实时预览</span>
                                    {!selectedNode.isActive && <span className="text-amber-500 flex items-center"><Info size={10} className="mr-1"/> 预览模式</span>}
                                </div>
                                <div className="flex-1 overflow-hidden relative">
                                    {selectedNode.isActive && selectedNodeId?.startsWith('extra-') ? (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-gray-50/50">
                                            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 shadow-sm">
                                                <CheckCircle2 size={24}/>
                                            </div>
                                            <h3 className="text-sm font-bold text-gray-800 mb-2">样式已激活</h3>
                                            <p className="text-xs text-gray-500 leading-relaxed max-w-[200px]">
                                                此 CSS 已应用到全局样式。请前往“样式主题”视图查看完整效果。
                                            </p>
                                        </div>
                                    ) : (
                                        <iframe 
                                            title="CSS Live Preview" 
                                            className="w-full h-full border-none" 
                                            srcDoc={`<!DOCTYPE html><html lang="zh"><head><meta charset="utf-8"><style>
                                                body { padding: 20px; font-family: sans-serif; background: #fff; color: #333; line-height: 1.6; }
                                                .preview-card { border: 1px solid #eee; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
                                                h1 { margin-top: 0; font-size: 1.5em; }
                                                p { margin-bottom: 1em; }
                                                ${editorContent}
                                            </style></head><body>
                                                <div class="preview-card">
                                                  <h1>示例章节标题</h1>
                                                  <p>这是一段示例文本。您可以通过左侧的编辑器实时修改这段文字的样式（如字体颜色、行高、缩进等）。</p>
                                                  <blockquote>这是一个引用块 (blockquote)。</blockquote>
                                                  <hr />
                                                  <p><strong>加粗文本</strong> 与 <em>斜体文本</em>。</p>
                                                </div>
                                            </body></html>`}
                                        />
                                    )}
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
