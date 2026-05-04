import React from 'react';
import { Folder, FolderOpen, FileText, FileCode, FileImage, File, ChevronRight, ChevronDown, CornerDownRight, Edit2, Trash2 } from 'lucide-react';
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

interface FileTreeItemProps {
    node: FileNode; 
    depth?: number; 
    selectedId: string | null;
    onSelect: (node: FileNode) => void;
    searchTerm: string;
    expandedIds: Set<string>;
    onToggleNode: (id: string) => void;
    onDelete: (node: FileNode) => void;
    onRename: (node: FileNode) => void;
}

const FileTreeItem: React.FC<FileTreeItemProps> = ({ 
    node, depth = 0, selectedId, onSelect, searchTerm, 
    expandedIds, onToggleNode, onDelete, onRename
}) => {
  // If we are searching, force expand folders that match or have matching children
  const isExpanded = node.type === 'folder' && (expandedIds.has(node.id) || !!searchTerm);

  const getIcon = () => {
    if (node.type === 'folder') return isExpanded ? <FolderOpen size={18} className="text-blue-500" /> : <Folder size={18} className="text-blue-500" />;

    switch (node.fileType) {
      case 'xhtml': return <FileText size={16} className="text-orange-500" />;
      case 'css': return <FileCode size={16} className="text-purple-500" />;
      case 'image': return <FileImage size={16} className="text-pink-500" />;
      case 'xml':
      case 'opf':
      case 'ncx': return <FileCode size={16} className="text-slate-400" />;
      default: return <File size={16} className="text-slate-400" />;
    }
  };

  return (
    <div className="select-none text-sm font-sans">
      <div
        className={`flex items-center py-2.5 px-3 mx-1 rounded-xl cursor-pointer transition-all duration-200 group relative ${
            selectedId === node.id
            ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-slate-800 font-semibold shadow-sm border border-blue-200/50'
            : 'hover:bg-white/60 text-slate-600 hover:shadow-sm'
        }`}
        style={{ paddingLeft: `${depth * 16 + 12}px` }}
        onClick={(e) => {
            e.stopPropagation();
            if (node.type === 'folder') onToggleNode(node.id);
            else onSelect(node);
        }}
      >
        {depth > 0 && (
            <div className="absolute left-0 top-0 bottom-0 border-l border-slate-200/50" style={{ left: `${depth * 16}px` }} />
        )}

        <span className="mr-2 text-slate-400 flex-shrink-0 w-4 flex items-center justify-center hover:text-slate-600 transition-colors">
          {node.type === 'folder' ? (
            isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          ) : (
            <CornerDownRight size={10} className="text-slate-300 -ml-1" />
          )}
        </span>
        <span className="mr-2.5 flex-shrink-0">{getIcon()}</span>
        <span className="truncate flex-1 flex items-center min-w-0">
            <span className="truncate">{node.name}</span>
            {node.fileType === 'css' && node.isActive && (
                <span className="ml-2 w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse shadow-md shadow-blue-500/50 flex-shrink-0" title="已激活"></span>
            )}
        </span>

        {/* Inline Actions (Rename/Delete) */}
        <div className={`flex items-center space-x-1 ml-2 ${selectedId === node.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
             {node.canRename && (
                 <button
                    onClick={(e) => { e.stopPropagation(); onRename(node); }}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    title="重命名"
                 >
                     <Edit2 size={13} />
                 </button>
             )}
             {node.canDelete && (
                 <button
                    onClick={(e) => { e.stopPropagation(); onDelete(node); }}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    title="删除"
                 >
                     <Trash2 size={13} />
                 </button>
             )}
        </div>

        {node.type === 'file' && !node.canDelete && !node.canRename && (
             <span className={`ml-2 text-xs tabular-nums flex-shrink-0 font-medium ${selectedId === node.id ? 'text-blue-500' : 'text-slate-400 group-hover:text-slate-500'}`}>
                 {formatSize(node.sizeBytes)}
             </span>
        )}
      </div>
      {node.type === 'folder' && isExpanded && node.children && (
        <div className="border-l border-transparent ml-2">
          {node.children.map((child) => (
            <FileTreeItem
                key={child.id}
                node={child}
                depth={depth + 1}
                selectedId={selectedId}
                onSelect={onSelect}
                searchTerm={searchTerm}
                expandedIds={expandedIds}
                onToggleNode={onToggleNode}
                onDelete={onDelete}
                onRename={onRename}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FileTreeItem;