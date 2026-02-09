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
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
          <div className="p-4 border-b border-gray-100 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                  <h2 className="font-bold text-gray-800 text-sm flex items-center tracking-tight">
                      <Database size={16} className="mr-2 text-blue-600"/> 
                      资源管理器
                  </h2>
                  <button onClick={onAddFile} className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors text-xs font-medium" title="新建 CSS 文件">
                      <FilePlus2 size={14} /> 新建 CSS
                  </button>
              </div>
              <div className="relative">
                  <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="搜索文件..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-100 text-xs rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-gray-400"
                  />
                  {searchTerm && (
                      <button onClick={() => setSearchTerm('')} className="absolute right-2 top-2 text-gray-400 hover:text-gray-600">
                          <X size={14} />
                      </button>
                  )}
              </div>
          </div>
          
          <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
             {displayedNodes.length > 0 ? (
                 displayedNodes.map((child) => (
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
                 ))
             ) : (
                 <div className="text-center py-8 text-xs text-gray-400">未找到文件</div>
             )}
          </div>
          
          <div className="p-3 bg-gray-50 border-t border-gray-200">
             <div className="flex justify-between items-center text-[10px] text-gray-500 font-medium">
                 <span>项目总大小</span>
                 <span className="bg-gray-200 px-1.5 py-0.5 rounded text-gray-700">{formatSize(totalSize)}</span>
             </div>
          </div>
      </div>
    );
};

export default FileTree;