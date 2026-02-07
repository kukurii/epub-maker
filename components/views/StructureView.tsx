import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { ProjectData, ExtraFile, PRESET_STYLES } from '../../types';
import { 
  Folder, 
  FolderOpen,
  FileText, 
  FileCode, 
  FileImage, 
  File, 
  ChevronRight, 
  ChevronDown,
  Save,
  Trash2,
  FilePlus,
  Database,
  Eye,
  CheckCircle2,
  Info,
  Search,
  Download,
  Edit2,
  CornerDownRight,
  X
} from 'lucide-react';
import saveAs from 'file-saver';

interface StructureViewProps {
  project: ProjectData;
  onUpdateProject: (updates: Partial<ProjectData>) => void;
}

interface FileNode {
  id: string;
  name: string;
  type: 'folder' | 'file';
  fileType?: 'xhtml' | 'css' | 'image' | 'xml' | 'opf' | 'ncx' | 'mimetype';
  children?: FileNode[];
  sizeBytes?: number;
  isEditable?: boolean;
  isActive?: boolean;
  canRename?: boolean;
  canDelete?: boolean;
  dataUrl?: string; // For direct download of images
}

// Helper to format bytes
const formatSize = (bytes: number | undefined) => {
    if (bytes === undefined) return '-';
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Recursive function to filter the tree
const filterTree = (nodes: FileNode[], term: string): FileNode[] => {
  if (!term) return nodes;
  const lowerTerm = term.toLowerCase();
  
  return nodes.map(node => {
    if (node.type === 'folder' && node.children) {
      const filteredChildren = filterTree(node.children, term);
      // If folder matches or has matching children, keep it
      if (node.name.toLowerCase().includes(lowerTerm) || filteredChildren.length > 0) {
        return { ...node, children: filteredChildren, isOpen: true }; // Force open if searching
      }
      return null;
    }
    // File matches
    return node.name.toLowerCase().includes(lowerTerm) ? node : null;
  }).filter(Boolean) as FileNode[];
};

const FileTreeItem: React.FC<{ 
    node: FileNode; 
    depth?: number; 
    selectedId: string | null;
    onSelect: (node: FileNode) => void;
    searchTerm: string;
}> = ({ node, depth = 0, selectedId, onSelect, searchTerm }) => {
  const [isOpen, setIsOpen] = useState(node.type === 'folder' && (depth === 0 || !!searchTerm));
  
  // Auto-expand when searching
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

// Line Numbers Component
const LineNumbers = ({ count }: { count: number }) => {
    return (
        <div className="flex flex-col text-right pr-3 select-none text-gray-300 font-mono text-sm leading-relaxed bg-gray-50/50 py-6 min-h-full border-r border-gray-100">
            {Array.from({ length: count }).map((_, i) => (
                <span key={i} className="h-[24px] leading-[24px] block">{i + 1}</span>
            ))}
        </div>
    );
};

const StructureView: React.FC<StructureViewProps> = ({ project, onUpdateProject }) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [editorContent, setEditorContent] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);

  // Helper to calculate byte size
  const getByteSize = (str: string) => new Blob([str]).size;
  const getImageByteSize = (dataUrl: string) => {
      const base64 = dataUrl.split(',')[1] || '';
      return Math.floor((base64.length * 3) / 4) - ((base64.match(/=/g) || []).length);
  };

  const CUSTOM_CSS_MARKER = '/* --- 自定义样式开始 --- */';

  const mergedMainCss = useMemo(() => {
    const isPresetActive = project.isPresetStyleActive !== false;
    const activeStyle = PRESET_STYLES.find(s => s.id === project.activeStyleId) || PRESET_STYLES[0];
    const prefix = isPresetActive 
        ? `/* 预设主题: ${activeStyle.name} */\n${activeStyle.css}` 
        : `/* 预设主题已停用 */`;
    return `${prefix}\n\n${CUSTOM_CSS_MARKER}\n${project.customCSS}`;
  }, [project.activeStyleId, project.customCSS, project.isPresetStyleActive]);

  // Compute structure
  const { structure, totalSize } = useMemo(() => {
    let total = 0;

    const images: FileNode[] = (project.images || []).map((img) => {
       const ext = img.type.includes('png') ? 'png' : img.type.includes('gif') ? 'gif' : 'jpg';
       const size = getImageByteSize(img.data);
       total += size;
       return {
         id: `img-${img.id}`,
         name: `img_${img.id}.${ext}`,
         type: 'file',
         fileType: 'image',
         sizeBytes: size,
         isEditable: false,
         dataUrl: img.data,
         canDelete: true,
         canRename: false
       };
    });

    if (project.cover) {
       // Check if this is a reference to an existing image
       const isReferenced = !!project.coverId && project.images.some(i => i.id === project.coverId);
       const size = getImageByteSize(project.cover);
       
       // Only count size and show separate cover node if NOT referenced
       // If referenced, the size is already counted in the 'images' array above, and the file lives in images/
       if (!isReferenced) {
           total += size;
           images.unshift({
               id: 'cover-img',
               name: project.cover.startsWith('data:image/png') ? 'cover.png' : 'cover.jpg',
               type: 'file',
               fileType: 'image',
               sizeBytes: size,
               isEditable: false,
               dataUrl: project.cover,
               canRename: false
           });
       }
    }

    const chapters: FileNode[] = (project.chapters || []).map((c, idx) => {
        const size = getByteSize(c.content);
        total += size;
        return {
          id: `chapter-${idx}`,
          name: `chapter_${idx}.xhtml`,
          type: 'file',
          fileType: 'xhtml',
          sizeBytes: size,
          isEditable: true,
          canRename: false
        };
    });
    
    const extraFileNodes: FileNode[] = (project.extraFiles || []).map(f => {
        const size = getByteSize(f.content);
        total += size;
        return {
            id: `extra-${f.id}`,
            name: f.filename,
            type: 'file',
            fileType: f.type === 'css' ? 'css' : 'xml',
            sizeBytes: size,
            isEditable: true,
            isActive: f.isActive !== false,
            canRename: true,
            canDelete: true
        };
    });
    
    // Virtual Files
    const coverHtmlSize = 500; 
    if (project.cover) {
        total += coverHtmlSize;
        chapters.unshift({ id: 'cover-html', name: 'cover.xhtml', type: 'file', fileType: 'xhtml', sizeBytes: coverHtmlSize, isEditable: false });
    }
    const tocHtmlSize = 1000;
    total += tocHtmlSize;
    chapters.unshift({ id: 'toc-html', name: 'toc.xhtml', type: 'file', fileType: 'xhtml', sizeBytes: tocHtmlSize, isEditable: false });

    // OEBPS Folder Children
    const opfSize = 2000; 
    const ncxSize = 1000;
    const cssSize = getByteSize(mergedMainCss);
    total += opfSize + ncxSize + cssSize;

    const oebpsChildren: FileNode[] = [
      { id: 'opf', name: 'content.opf', type: 'file', fileType: 'opf', sizeBytes: opfSize, isEditable: false },
      { id: 'ncx', name: 'toc.ncx', type: 'file', fileType: 'ncx', sizeBytes: ncxSize, isEditable: false },
      { id: 'style-css', name: 'style.css', type: 'file', fileType: 'css', sizeBytes: cssSize, isEditable: true, isActive: true },
      ...extraFileNodes,
      ...chapters,
    ];

    if (images.length > 0) {
        oebpsChildren.push({
            id: 'images-folder',
            name: 'images',
            type: 'folder',
            children: images
        });
    }

    const root: FileNode = {
      id: 'root',
      name: 'Project Root',
      type: 'folder',
      children: [
        { id: 'mimetype', name: 'mimetype', type: 'file', fileType: 'mimetype', sizeBytes: 20, isEditable: false },
        { 
          id: 'meta-inf',
          name: 'META-INF', 
          type: 'folder', 
          children: [
            { id: 'container-xml', name: 'container.xml', type: 'file', fileType: 'xml', sizeBytes: 256, isEditable: false }
          ]
        },
        {
          id: 'oebps',
          name: 'OEBPS',
          type: 'folder',
          children: oebpsChildren
        }
      ]
    };
    
    return { structure: root, totalSize: total };
  }, [project, mergedMainCss]);

  // Find node helper
  const findNode = useCallback((id: string, nodes: FileNode[]): FileNode | null => {
      for (const node of nodes) {
          if (node.id === id) return node;
          if (node.children) {
              const found = findNode(id, node.children);
              if (found) return found;
          }
      }
      return null;
  }, []);
  
  // Find path helper for breadcrumbs
  const findPath = useCallback((targetId: string, nodes: FileNode[], path: FileNode[] = []): FileNode[] | null => {
      for (const node of nodes) {
          const currentPath = [...path, node];
          if (node.id === targetId) return currentPath;
          if (node.children) {
              const found = findPath(targetId, node.children, currentPath);
              if (found) return found;
          }
      }
      return null;
  }, []);

  const selectedNode = selectedNodeId ? findNode(selectedNodeId, structure.children || []) : null;
  const breadcrumbs = selectedNodeId ? findPath(selectedNodeId, structure.children || []) : null;

  // Filter the tree for display
  const displayedNodes = useMemo(() => filterTree(structure.children || [], searchTerm), [structure, searchTerm]);

  // Load content
  useEffect(() => {
      if (selectedNodeId) {
          let content = '';
          let editable = false;
          let found = false;
          let newPreviewUrl = null;

          if (selectedNodeId === 'style-css') {
              content = mergedMainCss;
              editable = true;
              found = true;
          } else if (selectedNodeId.startsWith('chapter-')) {
              const chapterIndex = parseInt(selectedNodeId.split('-')[1]);
              if (project.chapters[chapterIndex]) {
                  content = project.chapters[chapterIndex].content;
                  editable = true;
                  found = true;
              }
          } else if (selectedNodeId.startsWith('extra-')) {
              const extraId = selectedNodeId.replace('extra-', '');
              const file = project.extraFiles?.find(f => f.id === extraId);
              if (file) {
                  content = file.content;
                  editable = true;
                  found = true;
              }
          } else if (selectedNode?.dataUrl) {
              newPreviewUrl = selectedNode.dataUrl;
          }
          
          if (found && editable) {
              setEditorContent(content);
              setIsDirty(false);
              setPreviewUrl(null);
          } else {
              setPreviewUrl(newPreviewUrl);
          }
      } else {
          setPreviewUrl(null);
      }
  }, [selectedNodeId, project.chapters, project.extraFiles, project.cover, project.images, mergedMainCss, selectedNode]); 

  const handleSave = () => {
      if (!selectedNodeId) return;

      if (selectedNodeId === 'style-css') {
          if (editorContent.includes(CUSTOM_CSS_MARKER)) {
              const customPart = editorContent.split(CUSTOM_CSS_MARKER)[1].trim();
              onUpdateProject({ customCSS: customPart });
          } else {
              onUpdateProject({ customCSS: editorContent });
          }
      } else if (selectedNodeId.startsWith('chapter-')) {
          const chapterIndex = parseInt(selectedNodeId.split('-')[1]);
          const newChapters = [...project.chapters];
          if (newChapters[chapterIndex]) {
              newChapters[chapterIndex] = { ...newChapters[chapterIndex], content: editorContent };
              onUpdateProject({ chapters: newChapters });
          }
      } else if (selectedNodeId.startsWith('extra-')) {
          const extraId = selectedNodeId.replace('extra-', '');
          const newExtras = project.extraFiles ? project.extraFiles.map(f => f.id === extraId ? { ...f, content: editorContent } : f) : [];
          onUpdateProject({ extraFiles: newExtras });
      }
      setIsDirty(false);
  };

  const toggleFileActive = () => {
      if (selectedNodeId && selectedNodeId.startsWith('extra-')) {
          const extraId = selectedNodeId.replace('extra-', '');
          const newExtras = project.extraFiles ? project.extraFiles.map(f => f.id === extraId ? { ...f, isActive: !f.isActive } : f) : [];
          onUpdateProject({ extraFiles: newExtras });
      }
  };

  const handleAddFile = () => {
      const name = prompt("输入新文件名称 (例如: theme-dark.css)", "custom.css");
      if (!name) return;
      
      const cleanName = name.trim();
      if (project.extraFiles?.some(f => f.filename === cleanName)) {
          alert('文件名已存在');
          return;
      }

      const type = cleanName.endsWith('.css') ? 'css' : 'xml';
      const newFile: ExtraFile = {
          id: Date.now().toString(),
          filename: cleanName,
          content: type === 'css' ? '/* New File */\n' : '<?xml version="1.0"?>\n',
          type,
          isActive: true
      };
      
      onUpdateProject({ extraFiles: [...(project.extraFiles || []), newFile] });
      setTimeout(() => setSelectedNodeId(`extra-${newFile.id}`), 100);
  };

  const handleDeleteFile = () => {
      if (!selectedNodeId || !selectedNode?.canDelete) return;

      if (confirm(`确定要删除 ${selectedNode.name} 吗?`)) {
          if (selectedNodeId.startsWith('extra-')) {
              const extraId = selectedNodeId.replace('extra-', '');
              onUpdateProject({ extraFiles: project.extraFiles?.filter(f => f.id !== extraId) || [] });
          } else if (selectedNodeId.startsWith('img-')) {
              const imgId = selectedNodeId.replace('img-', '');
              onUpdateProject({ images: project.images?.filter(i => i.id !== imgId) || [] });
          }
          setSelectedNodeId(null);
      }
  };

  const handleRenameFile = () => {
      if (!selectedNodeId || !selectedNode?.canRename) return;
      const newName = prompt("重命名文件:", selectedNode.name);
      if (newName && newName !== selectedNode.name) {
          if (selectedNodeId.startsWith('extra-')) {
              const extraId = selectedNodeId.replace('extra-', '');
              onUpdateProject({ 
                  extraFiles: project.extraFiles?.map(f => f.id === extraId ? { ...f, filename: newName } : f) || [] 
              });
          }
      }
  };

  const handleDownloadFile = () => {
      if (!selectedNode) return;
      
      if (selectedNode.dataUrl) {
          // Download image
          saveAs(selectedNode.dataUrl, selectedNode.name);
      } else {
          // Download text content
          // If it's dirty in editor, download editor content, else download source
          const contentToDownload = isDirty ? editorContent : (
             selectedNodeId === 'style-css' ? mergedMainCss : 
             selectedNodeId?.startsWith('chapter-') ? project.chapters[parseInt(selectedNodeId.split('-')[1])].content :
             selectedNodeId?.startsWith('extra-') ? project.extraFiles?.find(f => f.id === selectedNodeId.replace('extra-', ''))?.content : ''
          );
          
          if (contentToDownload) {
             const blob = new Blob([contentToDownload], { type: "text/plain;charset=utf-8" });
             saveAs(blob, selectedNode.name);
          }
      }
  };

  const lineCount = useMemo(() => editorContent.split('\n').length, [editorContent]);

  return (
    <div className="flex h-full bg-[#F5F5F7] overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
          <div className="p-4 border-b border-gray-100 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                  <h2 className="font-bold text-gray-800 text-sm flex items-center tracking-tight">
                      <Database size={16} className="mr-2 text-blue-600"/> 
                      资源管理器
                  </h2>
                  <button onClick={handleAddFile} className="p-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors" title="新建文件">
                      <FilePlus size={16} />
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden relative">
          {selectedNode ? (
              <>
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
                                        <input type="checkbox" className="sr-only" checked={selectedNode.isActive} onChange={toggleFileActive} />
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
                            <button onClick={handleRenameFile} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="重命名">
                                <Edit2 size={16}/>
                            </button>
                        )}
                        <button onClick={handleDownloadFile} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="下载文件">
                            <Download size={16}/>
                        </button>
                        {selectedNode.canDelete && (
                            <div className="w-px h-4 bg-gray-200 mx-1"></div>
                        )}
                        {selectedNode.canDelete && (
                            <button onClick={handleDeleteFile} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="删除文件">
                                <Trash2 size={16}/>
                            </button>
                        )}
                        {(isDirty || selectedNode.isEditable) && (
                            <div className="ml-2 pl-2 border-l border-gray-200">
                                <button 
                                    onClick={handleSave} 
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
                                    <button onClick={handleDownloadFile} className="text-blue-500 text-xs font-bold hover:underline">
                                        下载以查看内容
                                    </button>
                                  </div>
                             )}
                        </div>
                    )}
                </div>
              </>
          ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-300 p-8 text-center bg-[#F5F5F7] pattern-grid opacity-80 h-full overflow-hidden">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <FolderOpen size={48} className="text-gray-300 ml-2" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-400 mb-2">未选择文件</h3>
                  <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
                      请从左侧资源管理器中选择一个文件以查看、编辑或管理。
                  </p>
              </div>
          )}
      </div>
    </div>
  );
};

export default StructureView;