

import React, { useMemo, useState, useEffect } from 'react';
import { ProjectData, ExtraFile, PRESET_STYLES } from '../../types';
import { 
  Folder, 
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
  Circle
} from 'lucide-react';

// Define StructureViewProps interface
interface StructureViewProps {
  project: ProjectData;
  onUpdateProject: (updates: Partial<ProjectData>) => void;
}

interface FileNode {
  id: string; // Unique ID for selection
  name: string;
  type: 'folder' | 'file';
  fileType?: 'xhtml' | 'css' | 'image' | 'xml' | 'opf' | 'ncx' | 'mimetype';
  children?: FileNode[];
  sizeBytes?: number; // Raw bytes
  isEditable?: boolean;
  isActive?: boolean;
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

const FileTreeItem: React.FC<{ 
    node: FileNode; 
    depth?: number; 
    selectedId: string | null;
    onSelect: (node: FileNode) => void;
}> = ({ node, depth = 0, selectedId, onSelect }) => {
  const [isOpen, setIsOpen] = useState(true);
  
  const getIcon = () => {
    if (node.type === 'folder') return isOpen ? <Folder size={16} className="text-blue-500 fill-blue-500/20" /> : <Folder size={16} className="text-blue-500" />;
    
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
    <div className="select-none text-xs font-mono">
      <div 
        className={`flex items-center py-1.5 px-2 rounded-lg cursor-pointer transition-colors group ${
            selectedId === node.id 
            ? 'bg-blue-100 text-blue-800 font-medium' 
            : 'hover:bg-gray-100 text-gray-600'
        } ${node.type === 'folder' ? 'font-medium text-gray-700' : ''}`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={(e) => {
            e.stopPropagation();
            if (node.type === 'folder') setIsOpen(!isOpen);
            else onSelect(node);
        }}
      >
        <span className="mr-1 text-gray-400 flex-shrink-0 w-4 flex items-center justify-center hover:text-gray-600">
          {node.type === 'folder' && (
            isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />
          )}
        </span>
        <span className="mr-2 flex-shrink-0">{getIcon()}</span>
        <span className="truncate flex-1 flex items-center">
            {node.name}
            {node.fileType === 'css' && node.isActive && (
                <span className="ml-2 w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" title="已激活"></span>
            )}
        </span>
        {node.type === 'file' && (
             <span className={`ml-2 text-[10px] ${selectedId === node.id ? 'text-blue-400' : 'text-gray-300 group-hover:text-gray-400'}`}>
                 {formatSize(node.sizeBytes)}
             </span>
        )}
      </div>
      {node.type === 'folder' && isOpen && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeItem key={child.id} node={child} depth={depth + 1} selectedId={selectedId} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
};

const StructureView: React.FC<StructureViewProps> = ({ project, onUpdateProject }) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [editorContent, setEditorContent] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Helper to calculate byte size of string
  const getByteSize = (str: string) => new Blob([str]).size;
  
  // Helper to calculate binary size from base64 (approx)
  const getImageByteSize = (dataUrl: string) => {
      const base64 = dataUrl.split(',')[1] || '';
      return Math.floor((base64.length * 3) / 4) - ((base64.match(/=/g) || []).length);
  };

  const CUSTOM_CSS_MARKER = '/* --- 自定义样式开始 --- */';

  // Compute merged style content for real-time reflection
  const mergedMainCss = useMemo(() => {
    const isPresetActive = project.isPresetStyleActive !== false;
    
    if (isPresetActive) {
        const activeStyle = PRESET_STYLES.find(s => s.id === project.activeStyleId) || PRESET_STYLES[0];
        return `/* 预设主题: ${activeStyle.name} (由样式面板控制) */\n${activeStyle.css}\n\n${CUSTOM_CSS_MARKER}\n${project.customCSS}`;
    } else {
        return `/* 预设主题已停用。下方仅为您的自定义 CSS。 */\n\n${CUSTOM_CSS_MARKER}\n${project.customCSS}`;
    }
  }, [project.activeStyleId, project.customCSS, project.isPresetStyleActive]);

  // Memoize structure calculation
  const { structure, totalSize } = useMemo(() => {
    let total = 0;

    // 1. Images
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
         isEditable: false
       };
    });

    if (project.cover) {
       const size = getImageByteSize(project.cover);
       total += size;
       images.unshift({
           id: 'cover-img',
           name: project.cover.startsWith('data:image/png') ? 'cover.png' : 'cover.jpg',
           type: 'file',
           fileType: 'image',
           sizeBytes: size,
           isEditable: false
       });
    }

    // 2. Chapters
    const chapters: FileNode[] = (project.chapters || []).map((c, idx) => {
        const size = getByteSize(c.content);
        total += size;
        return {
          id: `chapter-${idx}`,
          name: `chapter_${idx}.xhtml`,
          type: 'file',
          fileType: 'xhtml',
          sizeBytes: size,
          isEditable: true
        };
    });
    
    // 3. Extra Files
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
            isActive: f.isActive !== false
        };
    });
    
    // Virtual Files (Wrappers)
    const coverHtmlSize = 500; // approx
    if (project.cover) {
        total += coverHtmlSize;
        chapters.unshift({ id: 'cover-html', name: 'cover.xhtml', type: 'file', fileType: 'xhtml', sizeBytes: coverHtmlSize, isEditable: false });
    }
    const tocHtmlSize = 1000; // approx
    total += tocHtmlSize;
    chapters.unshift({ id: 'toc-html', name: 'toc.xhtml', type: 'file', fileType: 'xhtml', sizeBytes: tocHtmlSize, isEditable: false });

    // OEBPS Folder Children
    const opfSize = 2000; // approx
    const ncxSize = 1000; // approx
    const cssSize = getByteSize(mergedMainCss);
    total += opfSize + ncxSize + cssSize;

    const oebpsChildren: FileNode[] = [
      { id: 'opf', name: 'content.opf', type: 'file', fileType: 'opf', sizeBytes: opfSize, isEditable: false },
      { id: 'ncx', name: 'toc.ncx', type: 'file', fileType: 'ncx', sizeBytes: ncxSize, isEditable: false },
      { id: 'style-css', name: 'style.css (Merged)', type: 'file', fileType: 'css', sizeBytes: cssSize, isEditable: true, isActive: true },
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

    // Root Structure
    const root: FileNode = {
      id: 'root',
      name: 'Root',
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

  // Find the actual node object based on ID (helper)
  const findNode = (id: string, nodes: FileNode[]): FileNode | null => {
      for (const node of nodes) {
          if (node.id === id) return node;
          if (node.children) {
              const found = findNode(id, node.children);
              if (found) return found;
          }
      }
      return null;
  };

  const selectedNode = selectedNodeId ? findNode(selectedNodeId, structure.children || []) : null;

  // Load content when selection changes or project updates
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
          } else if (selectedNodeId === 'cover-img' && project.cover) {
              newPreviewUrl = project.cover;
          } else if (selectedNodeId.startsWith('img-')) {
             const imgId = selectedNodeId.replace('img-', '');
             const img = project.images.find(i => i.id === imgId);
             if (img) newPreviewUrl = img.data;
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
  }, [selectedNodeId, project.chapters, project.extraFiles, project.cover, project.images, mergedMainCss]); 

  const handleSave = () => {
      if (!selectedNodeId) return;

      if (selectedNodeId === 'style-css') {
          // Attempt to extract only the custom part if marker is present
          if (editorContent.includes(CUSTOM_CSS_MARKER)) {
              const customPart = editorContent.split(CUSTOM_CSS_MARKER)[1].trim();
              onUpdateProject({ customCSS: customPart });
          } else {
              // Fallback if marker was deleted
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
      let name = prompt("输入新 CSS 文件名 (例如: dark-theme.css)", "custom.css");
      if (!name) return;
      
      name = name.trim();
      if (!name.toLowerCase().endsWith('.css')) {
          name += '.css';
      }

      if (project.extraFiles?.some(f => f.filename === name)) {
          alert('文件名已存在');
          return;
      }

      const newFile: ExtraFile = {
          id: Date.now().toString(),
          filename: name,
          content: '/* Custom CSS */\n',
          type: 'css',
          isActive: true
      };
      
      const updatedFiles = [...(project.extraFiles || []), newFile];
      onUpdateProject({ extraFiles: updatedFiles });
      
      setTimeout(() => {
          setSelectedNodeId(`extra-${newFile.id}`);
      }, 100);
  };

  const handleDeleteFile = () => {
      if (selectedNodeId && selectedNodeId.startsWith('extra-')) {
          const node = findNode(selectedNodeId, structure.children || []);
          if (node && confirm(`确定要删除 ${node.name} 吗?`)) {
              const extraId = selectedNodeId.replace('extra-', '');
              onUpdateProject({ extraFiles: project.extraFiles?.filter(f => f.id !== extraId) || [] });
              setSelectedNodeId(null);
          }
      }
  };

  // Live CSS Preview Component
  const CSSPreview = ({ css }: { css: string }) => {
      const iframeSrc = `<!DOCTYPE html><html lang="zh"><head><meta charset="utf-8"><style>
        body { padding: 20px; font-family: sans-serif; background: #fff; color: #333; }
        .preview-box { border: 1px solid #eee; padding: 20px; border-radius: 8px; }
        ${css}
      </style></head><body>
        <div class="preview-box">
          <h1>示例章节标题</h1>
          <p>这是一段用于预览样式的正文内容。通过这段文字，您可以查看段落的行高、字体颜色以及首行缩进等效果。</p>
          <blockquote>这是一个引用块（Blockquote）的样式演示。</blockquote>
          <p>下方是一段包含<strong>加粗</strong>和<em>斜体</em>的文字。</p>
        </div>
      </body></html>`;
      return (
          <div className="flex-1 border-l border-gray-200 bg-white overflow-hidden flex flex-col">
              <div className="p-3 bg-gray-50 border-b border-gray-200 text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center">
                  <Eye size={12} className="mr-2"/> 实时渲染效果
              </div>
              <iframe title="CSS Live Preview" srcDoc={iframeSrc} className="w-full h-full border-none" />
          </div>
      );
  };

  return (
    <div className="flex h-full bg-[#F5F5F7] overflow-hidden">
      {/* Sidebar: File Explorer */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 z-10">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80 backdrop-blur">
              <h2 className="font-bold text-gray-700 text-sm flex items-center"><Database size={14} className="mr-2 text-blue-500"/> 资源管理器</h2>
              <button 
                onClick={handleAddFile} 
                className="flex items-center space-x-1 px-2 py-1 bg-white border border-gray-200 hover:border-blue-400 hover:text-blue-500 rounded shadow-sm text-gray-600 text-xs font-medium transition-all" 
                title="新建 CSS 文件"
              >
                  <FilePlus size={14} />
                  <span>新建 CSS</span>
              </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
             {structure.children?.map((child) => (
                <FileTreeItem 
                    key={child.id} 
                    node={child} 
                    selectedId={selectedNodeId} 
                    onSelect={(n) => setSelectedNodeId(n.id)} 
                />
             ))}
          </div>
          
          <div className="p-3 bg-gray-50 border-t border-gray-200">
             <div className="flex justify-between items-center text-xs text-gray-500 font-medium mb-1">
                 <span>预估总大小 (解压后)</span>
                 <span className="text-gray-800">{formatSize(totalSize)}</span>
             </div>
             <div className="text-[10px] text-gray-400 leading-relaxed">
                 提示: 只有处于“激活”状态的 CSS 文件才会被链接到 EPUB 章节中。
             </div>
          </div>
      </div>

      {/* Main Area: Editor or Viewer */}
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden relative">
          {selectedNodeId && selectedNode?.isEditable ? (
              <>
                <div className="h-12 border-b border-gray-200 bg-white flex items-center justify-between px-4 flex-shrink-0 shadow-sm z-10">
                    <div className="flex items-center">
                        <span className="text-sm font-bold text-gray-700 font-mono flex items-center">
                            {selectedNode.name}
                        </span>
                        {isDirty && <span className="ml-3 text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">未保存</span>}
                        
                        {selectedNode.fileType === 'css' && selectedNodeId.startsWith('extra-') && (
                            <div className="ml-6 flex items-center">
                                <label className="flex items-center cursor-pointer group">
                                    <div className="relative">
                                        <input type="checkbox" className="sr-only" checked={selectedNode.isActive} onChange={toggleFileActive} />
                                        <div className={`w-8 h-4 rounded-full shadow-inner transition-colors ${selectedNode.isActive ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                                        <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${selectedNode.isActive ? 'translate-x-4' : ''}`}></div>
                                    </div>
                                    <span className="ml-2 text-[10px] font-bold text-gray-500 group-hover:text-blue-500 transition-colors uppercase">
                                        {selectedNode.isActive ? '已激活' : '已停用'}
                                    </span>
                                </label>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center space-x-2">
                        {selectedNodeId.startsWith('extra-') && (
                            <button onClick={handleDeleteFile} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded transition-colors mr-2" title="删除文件">
                                <Trash2 size={16}/>
                            </button>
                        )}
                        <button 
                            onClick={handleSave} 
                            disabled={!isDirty}
                            className={`flex items-center px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                isDirty 
                                ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700 hover:scale-[1.02] cursor-pointer' 
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                        >
                            <Save size={14} className="mr-1.5" /> 保存更改
                        </button>
                    </div>
                </div>
                <div className="flex-1 flex overflow-hidden">
                    <div className="flex-1 relative border-r border-gray-200 bg-white">
                        <textarea 
                            className="absolute inset-0 w-full h-full p-6 font-mono text-sm leading-relaxed bg-white text-gray-800 resize-none focus:outline-none scrollbar-thin"
                            spellCheck={false}
                            value={editorContent}
                            onChange={(e) => {
                                setEditorContent(e.target.value);
                                setIsDirty(true);
                            }}
                        />
                    </div>
                    {selectedNode.fileType === 'css' && (
                        <div className="w-1/3 flex flex-col animate-in slide-in-from-right-2 duration-300">
                            {selectedNode.isActive ? (
                                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50/50">
                                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                                        <CheckCircle2 size={24}/>
                                    </div>
                                    <h3 className="text-sm font-bold text-gray-800 mb-2">样式已应用</h3>
                                    <p className="text-xs text-gray-500 leading-relaxed px-4">
                                        该 CSS 文件已处于激活状态。您可以在“样式主题”视图中查看它与主样式的最终融合效果。
                                    </p>
                                    <button onClick={toggleFileActive} className="mt-6 text-[10px] font-bold text-blue-500 hover:underline">暂时停用此样式</button>
                                </div>
                            ) : (
                                <CSSPreview css={editorContent} />
                            )}
                        </div>
                    )}
                </div>
              </>
          ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-300 p-8 text-center bg-[#F5F5F7] pattern-grid opacity-80 h-full overflow-hidden">
                  {selectedNodeId && previewUrl ? (
                      <div className="flex flex-col items-center justify-center w-full h-full">
                           <div className="bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0iI2YwZjBmMCI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiAvPjxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiAvPjwvc3ZnPg==')] bg-repeat p-1 rounded-xl shadow-lg border border-gray-200 max-h-[80%] max-w-full overflow-auto">
                              <img src={previewUrl} alt="Preview" className="max-w-full max-h-[600px] object-contain rounded-lg" />
                           </div>
                           <div className="mt-6 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100 flex items-center space-x-2">
                               <FileImage size={14} className="text-purple-500"/>
                               <span className="text-sm font-bold text-gray-700">{selectedNode?.name}</span>
                               <span className="text-xs text-gray-400">|</span>
                               <span className="text-xs text-gray-500 font-mono">{formatSize(selectedNode?.sizeBytes)}</span>
                           </div>
                      </div>
                  ) : selectedNodeId && !selectedNode?.isEditable ? (
                      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md">
                        <FileCode size={48} className="mb-4 mx-auto text-blue-200" />
                        <p className="font-bold text-gray-700 mb-2">{selectedNode?.name}</p>
                        <p className="text-xs text-gray-500">此文件为系统自动生成，暂不支持直接预览。</p>
                      </div>
                  ) : (
                      <>
                        <Folder size={64} className="mb-6 opacity-10 text-gray-500" />
                        <p className="text-gray-400 font-medium">从左侧选择一个文件开始编辑</p>
                      </>
                  )}
              </div>
          )}
      </div>
    </div>
  );
};

export default StructureView;