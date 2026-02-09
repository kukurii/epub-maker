import React, { useState, useEffect } from 'react';
import { Folder, FolderOpen, FileText, FileCode, FileImage, File, ChevronRight, ChevronDown, CornerDownRight } from 'lucide-react';
import { FileNode } from './types';

// Helper to format bytes (duplicated from StructureView to keep self-contained or move to shared utils later)
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
}

const FileTreeItem: React.FC<FileTreeItemProps> = ({ node, depth = 0, selectedId, onSelect, searchTerm }) => {
  const [isOpen, setIsOpen] = useState(node.type === 'folder' && (depth === 0 || !!searchTerm));
  
  useEffect(() => {
    if (searchTerm && node.type === 'folder') {
      setIsOpen(true);
    }
  }, [searchTerm, node.type]);

  const getIcon = () => {
    if (node.type === 'folder') return isOpen ? <FolderOpen size={16} className="text-blue-500" /> : <Folder size={16} className="text-blue-500" />;
    
    switch (node.fileType) {
      case 'xhtml': return <FileText size={15} className="text-orange-500" />;
      case 'css': return <FileCode size={15} className="text-blue-400" />;
      case 'image': return <FileImage size={15} className="text-purple-500" />;
      case 'xml': 
      case 'opf': 
      case 'ncx': return <FileCode size={15} className="text-gray-500" />;
      default: return <File size={15} className="text-gray-400" />;
    }
  };

  return (
    <div className="select-none text-xs font-sans">
      <div 
        className={`flex items-center py-1.5 px-2 mx-2 rounded-lg cursor-pointer transition-colors group relative ${
            selectedId === node.id 
            ? 'bg-blue-100/50 text-blue-700 font-medium ring-1 ring-blue-500/20' 
            : 'hover:bg-gray-100 text-gray-600'
        }`}
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
        onClick={(e) => {
            e.stopPropagation();
            if (node.type === 'folder') setIsOpen(!isOpen);
            else onSelect(node);
        }}
      >
        {depth > 0 && (
            <div className="absolute left-0 top-0 bottom-0 border-l border-gray-100" style={{ left: `${depth * 14}px` }} />
        )}
        
        <span className="mr-1.5 text-gray-400 flex-shrink-0 w-4 flex items-center justify-center hover:text-gray-600 transition-colors">
          {node.type === 'folder' ? (
            isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />
          ) : (
            <CornerDownRight size={8} className="text-gray-300 -ml-1" />
          )}
        </span>
        <span className="mr-2 flex-shrink-0">{getIcon()}</span>
        <span className="truncate flex-1 flex items-center">
            {node.name}
            {node.fileType === 'css' && node.isActive && (
                <span className="ml-2 w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse shadow-sm shadow-blue-500" title="已激活"></span>
            )}
        </span>
        {node.type === 'file' && (
             <span className={`ml-2 text-[10px] tabular-nums ${selectedId === node.id ? 'text-blue-400' : 'text-gray-300 group-hover:text-gray-400'}`}>
                 {formatSize(node.sizeBytes)}
             </span>
        )}
      </div>
      {node.type === 'folder' && isOpen && node.children && (
        <div className="border-l border-transparent ml-2">
          {node.children.map((child) => (
            <FileTreeItem key={child.id} node={child} depth={depth + 1} selectedId={selectedId} onSelect={onSelect} searchTerm={searchTerm} />
          ))}
        </div>
      )}
    </div>
  );
};

export default FileTreeItem;
