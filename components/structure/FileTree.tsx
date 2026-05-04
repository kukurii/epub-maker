import React from 'react';
import { Database, FilePlus2, Search, X } from 'lucide-react';
import { FileNode } from './types';
import FileTreeItem from './FileTreeItem';

// Helper to format bytes
const formatSize = (bytes: number | undefined) => {
    if (bytes === undefined) return '-';
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

interface FileTreeProps {
    displayedNodes: FileNode[];
    selectedNodeId: string | null;
    setSelectedNodeId: (id: string | null) => void;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    totalSize: number;
    onAddFile: () => void;
    expandedIds: Set<string>;
    onToggleNode: (id: string) => void;
    onDelete: (node: FileNode) => void;
    onRename: (node: FileNode) => void;
}

const FileTree: React.FC<FileTreeProps> = ({
    displayedNodes, selectedNodeId, setSelectedNodeId,
    searchTerm, setSearchTerm, totalSize, onAddFile,
    expandedIds, onToggleNode, onDelete, onRename
}) => {
    return (
      <div className="w-80 bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 border-r border-slate-200/60 flex flex-col flex-shrink-0 z-10 shadow-[4px_0_32px_rgba(0,0,0,0.04)] backdrop-blur-sm">
          {/* 顶部标题区 - 采用渐变卡片设计 */}
          <div className="p-5 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                          <Database size={18} className="text-white"/>
                      </div>
                      <div>
                          <h2 className="font-bold text-slate-800 text-base tracking-tight">资源管理器</h2>
                          <p className="text-[10px] text-slate-400 mt-0.5">Project Files</p>
                      </div>
                  </div>
              </div>

              {/* 搜索框 - 毛玻璃效果 */}
              <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl opacity-0 group-focus-within:opacity-100 blur transition-opacity duration-300"></div>
                  <div className="relative bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/50 group-focus-within:border-blue-300/50 transition-all">
                      <Search size={16} className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      <input
                        type="text"
                        placeholder="搜索文件或文件夹..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-transparent text-sm rounded-2xl pl-11 pr-10 py-3 focus:outline-none text-slate-700 placeholder:text-slate-400"
                      />
                      {searchTerm && (
                          <button
                              onClick={() => setSearchTerm('')}
                              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg p-1 transition-all"
                          >
                              <X size={14} />
                          </button>
                      )}
                  </div>
              </div>

              {/* 新建按钮 - 渐变设计 */}
              <button
                  onClick={onAddFile}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 text-sm font-semibold active:scale-95 group"
                  title="新建 CSS 文件"
              >
                  <FilePlus2 size={16} className="group-hover:rotate-90 transition-transform duration-300" />
                  <span>新建 CSS 文件</span>
              </button>
          </div>

          {/* 文件列表区域 */}
          <div className="flex-1 overflow-y-auto px-3 pb-3 custom-scrollbar">
             {displayedNodes.length > 0 ? (
                 <div className="space-y-1">
                     {displayedNodes.map((child) => (
                        <FileTreeItem
                            key={child.id}
                            node={child}
                            selectedId={selectedNodeId}
                            onSelect={(n) => setSelectedNodeId(n.id)}
                            searchTerm={searchTerm}
                            expandedIds={expandedIds}
                            onToggleNode={onToggleNode}
                            onDelete={onDelete}
                            onRename={onRename}
                        />
                     ))}
                 </div>
             ) : (
                 <div className="flex flex-col items-center justify-center py-12 text-center">
                     <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                         <Search size={24} className="text-slate-300" />
                     </div>
                     <p className="text-sm text-slate-400 font-medium">未找到文件</p>
                     <p className="text-xs text-slate-300 mt-1">尝试其他搜索关键词</p>
                 </div>
             )}
          </div>

          {/* 底部状态栏 - 渐变卡片 */}
          <div className="m-3 p-4 bg-white/60 backdrop-blur-md rounded-2xl border border-slate-200/50 shadow-sm">
             <div className="flex justify-between items-center">
                 <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 animate-pulse"></div>
                     <span className="text-xs text-slate-600 font-medium">项目总大小</span>
                 </div>
                 <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                     {formatSize(totalSize)}
                 </span>
             </div>
          </div>
      </div>
    );
};

export default FileTree;