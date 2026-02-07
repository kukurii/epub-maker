import React from 'react';
import { ViewMode } from '../types';
import { 
  FileText, 
  Settings, 
  ListTree, 
  Palette, 
  Image as ImageIcon, 
  Book,
  Download,
  RotateCcw,
  FolderOpen,
  X
} from 'lucide-react';

interface SidebarProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onExport: () => void;
  onReset: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, onExport, onReset, isOpen, onClose }) => {
  const menuItems: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
    { id: 'files', label: '文件导入', icon: <FileText size={18} /> },
    { id: 'chapters', label: '目录管理', icon: <ListTree size={18} /> },
    { id: 'metadata', label: '书籍信息', icon: <Settings size={18} /> },
    { id: 'styles', label: '样式主题', icon: <Palette size={18} /> },
    { id: 'images', label: '图片素材', icon: <ImageIcon size={18} /> },
    { id: 'cover', label: '封面设计', icon: <Book size={18} /> },
    { id: 'structure', label: '文件管理', icon: <FolderOpen size={18} /> },
  ];

  const handleResetClick = () => {
    // Confirmation is handled here to prevent accidental clicks
    if (window.confirm('⚠️ 警告：确定要清空所有数据吗？\n\n此操作将删除所有章节、图片、样式和设置，且无法撤销。\n页面将会刷新以完成重置。')) {
        onReset();
        if (window.innerWidth < 768) onClose();
    }
  };

  const handleMenuClick = (id: ViewMode) => {
    onViewChange(id);
    if (window.innerWidth < 768) onClose();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden animate-in fade-in"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-gray-50/95 backdrop-blur-xl border-r border-gray-200 flex flex-col h-full font-sans select-none shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-transform duration-300 ease-in-out
        md:static md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 pb-4 flex justify-between items-start">
          <div>
            <div className="flex items-center space-x-3 text-gray-800 mb-8">
               <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 text-white">
                  <Book size={20} />
               </div>
               <h1 className="text-xl font-bold tracking-tight">EPUB Maker</h1>
            </div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 pl-2">Editor</div>
          </div>
          <button onClick={onClose} className="md:hidden text-gray-400 hover:text-gray-600 p-1">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleMenuClick(item.id)}
              className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${
                currentView === item.id
                  ? 'bg-white text-blue-600 shadow-md shadow-gray-200 ring-1 ring-gray-100'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <span className={`mr-3 ${currentView === item.id ? 'text-blue-500' : 'text-gray-400'}`}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 space-y-3 border-t border-gray-200 bg-gray-50/50">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => { onExport(); if(window.innerWidth < 768) onClose(); }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-xl flex items-center justify-center transition-all shadow-lg shadow-blue-500/20 active:scale-95 font-semibold text-xs"
          >
            <Download size={14} className="mr-2" />
            导出 EPUB
          </button>
          
          <button
              type="button"
              onClick={handleResetClick}
              className="w-full bg-transparent text-gray-400 hover:text-red-600 py-2 px-4 rounded-xl flex items-center justify-center transition-all text-[10px] font-medium"
          >
              <RotateCcw size={12} className="mr-1.5" />
              重置项目
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;