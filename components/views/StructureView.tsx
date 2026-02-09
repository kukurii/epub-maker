import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { ProjectData, ExtraFile, PRESET_STYLES } from '../../types';
import saveAs from 'file-saver';
import { FileNode } from '../structure/types';
import FileTree from '../structure/FileTree';
import FileContentArea from '../structure/FileContentArea';

interface StructureViewProps {
  project: ProjectData;
  onUpdateProject: (updates: Partial<ProjectData>) => void;
}

// Recursive function to filter the tree
const filterTree = (nodes: FileNode[], term: string): FileNode[] => {
  if (!term) return nodes;
  const lowerTerm = term.toLowerCase();
  
  return nodes.map(node => {
    if (node.type === 'folder' && node.children) {
      const filteredChildren = filterTree(node.children, term);
      // If folder matches or has matching children, keep it
      if (node.name.toLowerCase().includes(lowerTerm) || filteredChildren.length > 0) {
        return { ...node, children: filteredChildren }; 
      }
      return null;
    }
    // File matches
    return node.name.toLowerCase().includes(lowerTerm) ? node : null;
  }).filter(Boolean) as FileNode[];
};

const RESERVED_FILENAMES = [
    'mimetype', 
    'container.xml', 
    'content.opf', 
    'toc.ncx', 
    'toc.xhtml', 
    'style.css', 
    'cover.xhtml',
    'images',
    'META-INF',
    'OEBPS'
];

const StructureView: React.FC<StructureViewProps> = ({ project, onUpdateProject }) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [editorContent, setEditorContent] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Persist expanded folders state
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['root', 'oebps', 'meta-inf', 'images-folder']));

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
       const isReferenced = !!project.coverId && project.images.some(i => i.id === project.coverId);
       const size = getImageByteSize(project.cover);
       
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
            canDelete: true,
            targetChapterIds: f.targetChapterIds
        };
    });
    
    const coverHtmlSize = 500; 
    if (project.cover) {
        total += coverHtmlSize;
        chapters.unshift({ id: 'cover-html', name: 'cover.xhtml', type: 'file', fileType: 'xhtml', sizeBytes: coverHtmlSize, isEditable: false });
    }
    const tocHtmlSize = 1000;
    total += tocHtmlSize;
    chapters.unshift({ id: 'toc-html', name: 'toc.xhtml', type: 'file', fileType: 'xhtml', sizeBytes: tocHtmlSize, isEditable: false });

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

  const displayedNodes = useMemo(() => filterTree(structure.children || [], searchTerm), [structure, searchTerm]);

  // Content Saving Logic (extracted to reuse)
  const saveContent = (id: string, content: string) => {
      if (id === 'style-css') {
          if (content.includes(CUSTOM_CSS_MARKER)) {
              const customPart = content.split(CUSTOM_CSS_MARKER)[1].trim();
              onUpdateProject({ customCSS: customPart });
          } else {
              onUpdateProject({ customCSS: content });
          }
      } else if (id.startsWith('chapter-')) {
          const chapterIndex = parseInt(id.split('-')[1]);
          const newChapters = [...project.chapters];
          if (newChapters[chapterIndex]) {
              newChapters[chapterIndex] = { ...newChapters[chapterIndex], content: content };
              onUpdateProject({ chapters: newChapters });
          }
      } else if (id.startsWith('extra-')) {
          const extraId = id.replace('extra-', '');
          const newExtras = project.extraFiles ? project.extraFiles.map(f => f.id === extraId ? { ...f, content: content } : f) : [];
          onUpdateProject({ extraFiles: newExtras });
      }
  };

  const handleSave = () => {
      if (!selectedNodeId) return;
      saveContent(selectedNodeId, editorContent);
      setIsDirty(false);
  };
  
  const handleUpdateFileMeta = (id: string, updates: Partial<ExtraFile>) => {
      if (id.startsWith('extra-')) {
          const extraId = id.replace('extra-', '');
          const newExtras = project.extraFiles ? project.extraFiles.map(f => f.id === extraId ? { ...f, ...updates } : f) : [];
          onUpdateProject({ extraFiles: newExtras });
      }
  };

  // Safe Node Selection (Auto-save previous)
  const handleSelectNode = (id: string | null) => {
      if (selectedNodeId && isDirty) {
          // Auto-save the current file before switching
          saveContent(selectedNodeId, editorContent);
          setIsDirty(false);
      }
      setSelectedNodeId(id);
  };

  // Load content when selectedNodeId changes
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

  const toggleFileActive = () => {
      if (selectedNodeId && selectedNodeId.startsWith('extra-')) {
          const extraId = selectedNodeId.replace('extra-', '');
          const newExtras = project.extraFiles ? project.extraFiles.map(f => f.id === extraId ? { ...f, isActive: !f.isActive } : f) : [];
          onUpdateProject({ extraFiles: newExtras });
      }
  };

  const handleAddFile = () => {
      // Find highest suffix for style_XXX.css
      const cssFiles = project.extraFiles?.filter(f => f.type === 'css' && f.filename.startsWith('style_')) || [];
      let maxNum = 0;
      cssFiles.forEach(f => {
          const match = f.filename.match(/style_(\d+)\.css/);
          if (match) {
              const num = parseInt(match[1], 10);
              if (num > maxNum) maxNum = num;
          }
      });
      const newName = `style_${String(maxNum + 1).padStart(3, '0')}.css`;
      
      const newFile: ExtraFile = {
          id: Date.now().toString(),
          filename: newName,
          content: `/* ${newName} */\n`,
          type: 'css',
          isActive: true,
          targetChapterIds: [] // Default empty (manual opt-in)
      };
      
      onUpdateProject({ extraFiles: [...(project.extraFiles || []), newFile] });
      setExpandedIds(prev => new Set(prev).add('oebps'));
      setTimeout(() => setSelectedNodeId(`extra-${newFile.id}`), 150);
  };

  const handleDeleteFile = (id?: string) => {
      const targetId = id || selectedNodeId;
      if (!targetId) return;
      
      // Find name for confirmation
      const targetNode = findNode(targetId, structure.children || []);
      const displayName = targetNode ? targetNode.name : '此文件';

      if (window.confirm(`确定要删除 ${displayName} 吗?`)) {
          if (targetId.startsWith('extra-')) {
              const extraId = targetId.replace('extra-', '');
              const newExtras = (project.extraFiles || []).filter(f => f.id !== extraId);
              onUpdateProject({ extraFiles: newExtras });
          } else if (targetId.startsWith('img-')) {
              const imgId = targetId.replace('img-', '');
              const newImages = (project.images || []).filter(i => i.id !== imgId);
              onUpdateProject({ images: newImages });
          }
          
          // Only clear selection if we deleted the currently selected node
          if (targetId === selectedNodeId) {
              setSelectedNodeId(null);
          }
      }
  };

  const handleRenameFile = (node?: FileNode) => {
      const targetNode = node || selectedNode;
      if (!targetNode || !targetNode.canRename) return;
      
      const newName = prompt("重命名文件:", targetNode.name);
      
      if (newName && newName !== targetNode.name) {
          const cleanName = newName.trim();
          
          if (RESERVED_FILENAMES.includes(cleanName) || RESERVED_FILENAMES.some(r => cleanName.toLowerCase() === r.toLowerCase())) {
              alert('无法重命名：目标文件名是系统保留文件。');
              return;
          }

          if (project.extraFiles?.some(f => f.filename === cleanName)) {
              alert('文件名已存在');
              return;
          }

          if (targetNode.id.startsWith('extra-')) {
              const extraId = targetNode.id.replace('extra-', '');
              onUpdateProject({ 
                  extraFiles: project.extraFiles?.map(f => f.id === extraId ? { ...f, filename: cleanName } : f) || [] 
              });
          }
      }
  };
  
  const handleDeleteNode = (node: FileNode) => {
      handleDeleteFile(node.id);
  };

  const handleDownloadFile = () => {
      if (!selectedNode) return;
      
      if (selectedNode.dataUrl) {
          saveAs(selectedNode.dataUrl, selectedNode.name);
      } else {
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

  const toggleNode = (id: string) => {
      setExpandedIds(prev => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
      });
  };

  return (
    <div className="flex h-full bg-[#F5F5F7] overflow-hidden">
      <FileTree 
          displayedNodes={displayedNodes}
          selectedNodeId={selectedNodeId}
          setSelectedNodeId={handleSelectNode}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          totalSize={totalSize}
          onAddFile={handleAddFile}
          expandedIds={expandedIds}
          onToggleNode={toggleNode}
          onDelete={handleDeleteNode}
          onRename={handleRenameFile}
      />

      <FileContentArea 
          selectedNode={selectedNode}
          selectedNodeId={selectedNodeId}
          breadcrumbs={breadcrumbs}
          isDirty={isDirty}
          editorContent={editorContent}
          setEditorContent={setEditorContent}
          setIsDirty={setIsDirty}
          previewUrl={previewUrl}
          onSave={handleSave}
          onDelete={handleDeleteFile}
          onRename={() => handleRenameFile()}
          onDownload={handleDownloadFile}
          onToggleActive={toggleFileActive}
          chapters={project.chapters}
          onUpdateFile={handleUpdateFileMeta}
      />
    </div>
  );
};

export default StructureView;