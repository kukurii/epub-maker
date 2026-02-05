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
  Trash,
  FolderOpen
} from 'lucide-react';

interface SidebarProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onExport: () => void;
  onReset: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, onExport, onReset }) => {
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
    if (window.confirm('确定要清空所有数据并重置项目吗？此操作无法撤销。')) {
        onReset();
    }
  };

  return (
    <div className="w-64 bg-gray-50/90 backdrop-blur-xl border-r border-gray-200 flex flex-col h-full font-sans select-none z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      <div className="p-6 pb-4">
        <div className="flex items-center space-x-3 text-gray-800 mb-8">
           <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 text-white">
              <Book size={20} />
           </div>
           <h1 className="text-xl font-bold tracking-tight">EPUB Maker</h1>
        </div>
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 pl-2">Editor</div>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onViewChange(item.id)}
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
          onClick={onExport}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl flex items-center justify-center transition-all shadow-lg shadow-blue-500/20 active:scale-95 font-semibold text-sm"
        >
          <Download size={16} className="mr-2" />
          导出 EPUB
        </button>
        
        <button
            type="button"
            onClick={handleResetClick}
            className="w-full text-gray-400 hover:text-red-500 hover:bg-red-50 py-2 px-4 rounded-lg flex items-center justify-center transition-colors text-xs font-medium"
        >
            <Trash size={12} className="mr-1.5" />
            重置项目
        </button>
      </div>
    </div>
  );
};

export default Sidebar;