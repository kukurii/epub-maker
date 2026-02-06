import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { 
  Heading1, 
  Heading2, 
  Bold, 
  Italic, 
  Scissors, 
  Search, 
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  X,
  ChevronDown,
  ChevronUp, 
  Type,
  RotateCcw,
  RotateCw,
  Clock,
  AlignJustify,
  Quote,
  List,
  ListOrdered,
  Minus
} from 'lucide-react';
import { ProjectData, PRESET_STYLES, ImageAsset, TocItem } from '../types';

interface EditorProps {
  content: string;
  onContentChange: (newContent: string, title?: string, subItems?: TocItem[]) => void;
  onSplitChapter: (beforeContent: string, afterContent: string) => void;
  project: ProjectData;
  scrollToId?: string | null;
}

// --- Image Path Conversion Helpers ---

const getUniqueImageFilename = (img: ImageAsset): string => {
    if (!img) return 'unknown.jpg';
    let ext = 'jpg';
    if (img.type.includes('png')) ext = 'png';
    else if (img.type.includes('gif')) ext = 'gif';
    else if (img.type.includes('webp')) ext = 'webp';
    return `img_${img.id}.${ext}`;
};

// Converts stored HTML (with relative paths) to editor-displayable HTML (with Base64)
const contentToEditorHTML = (html: string, images: ImageAsset[]): string => {
    if (!html || !images.length) return html;
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const imageMap = new Map<string, ImageAsset>(images.map(img => [img.id, img]));

    doc.querySelectorAll('img[data-id]').forEach(imgEl => {
        const id = imgEl.getAttribute('data-id');
        if (id && imageMap.has(id)) {
            imgEl.setAttribute('src', imageMap.get(id)!.data);
        }
    });
    return doc.body.innerHTML;
};

// Converts editor HTML (with Base64) to storable HTML (with relative paths)
const editorHTMLToContent = (html: string, images: ImageAsset[]): string => {
    if (!html || !images.length) return html;
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const imageMap = new Map<string, ImageAsset>(images.map(img => [img.id, img]));

    doc.querySelectorAll('img[data-id]').forEach(imgEl => {
        const id = imgEl.getAttribute('data-id');
        if (id && imageMap.has(id)) {
            const image = imageMap.get(id)!;
            const filename = getUniqueImageFilename(image);
            imgEl.setAttribute('src', `images/${filename}`);
        }
    });
    return doc.body.innerHTML;
};


const Editor: React.FC<EditorProps> = ({ content, onContentChange, onSplitChapter, project, scrollToId }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showFindBar, setShowFindBar] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [matchCount, setMatchCount] = useState({ current: 0, total: 0 });
  const [stats, setStats] = useState({ chars: 0, time: 0 });

  // --- Scroll Logic ---
  useEffect(() => {
    if (scrollToId && editorRef.current) {
      const element = editorRef.current.querySelector(`#${scrollToId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        element.classList.add('bg-yellow-100', 'transition-colors', 'duration-1000');
        setTimeout(() => element.classList.remove('bg-yellow-100'), 1500);
      }
    }
  }, [scrollToId]);

  // Apply content on mount or switch
  useEffect(() => {
    if (editorRef.current) {
      const editorHTML = contentToEditorHTML(content, project.images);
      if (editorRef.current.innerHTML !== editorHTML) {
        editorRef.current.innerHTML = editorHTML;
        updateStats(editorRef.current.innerText);
      }
    }
  }, [content, project.images]);

  // --- Stats Logic ---
  const updateStats = (text: string) => {
    const cleanText = text.replace(/\s+/g, '');
    const chars = cleanText.length;
    // Estimate reading time: 400 chars per minute
    const time = Math.ceil(chars / 400); 
    setStats({ chars, time });
  };

  // --- Parsing & ID Generation ---
  const generateId = (text: string) => {
    return 'heading-' + Math.random().toString(36).substr(2, 9);
  };

  const processContentUpdates = useCallback(() => {
    if (!editorRef.current) return;

    const headings = editorRef.current.querySelectorAll('h1, h2');
    const subItems: TocItem[] = [];
    let newTitle: string | undefined = undefined;

    headings.forEach((el) => {
        if (!el.id) {
            el.id = generateId(el.textContent || '');
        }
        
        const text = (el.textContent || '').trim();
        
        if (el.tagName === 'H1') {
            if (newTitle === undefined) {
                // First H1 is the Chapter Title
                newTitle = text;
            } else {
                // Subsequent H1s are level 1 sub-items
                subItems.push({
                    id: el.id,
                    text: text || '无标题',
                    level: 1
                });
            }
        } else if (el.tagName === 'H2') {
            subItems.push({
                id: el.id,
                text: text || '无标题',
                level: 2
            });
        }
    });

    const newEditorHTML = editorRef.current.innerHTML;
    const newContent = editorHTMLToContent(newEditorHTML, project.images);
    updateStats(editorRef.current.innerText);
    onContentChange(newContent, newTitle, subItems);
  }, [onContentChange, project.images]);

  const handleInput = () => {
    processContentUpdates();
  };

  // --- Commands ---
  const execCmd = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus(); // Re-focus editor after command
    processContentUpdates();
  };
  
  // Helper to reliably find the containing block-level element for the current selection
  const getContainingBlock = (): HTMLElement | null => {
      const selection = window.getSelection();
      if (!selection?.rangeCount) return null;
      let node = selection.getRangeAt(0).commonAncestorContainer;
      
      // If the node is a text node, start from its parent element
      if (node.nodeType !== Node.ELEMENT_NODE) {
          node = node.parentNode!;
      }
      if (!node) return null;

      // Traverse up the tree until a block-level element is found or the editor root is reached
      while (node && node !== editorRef.current) {
          const tagName = (node as Element).tagName;
          if (['P', 'H1', 'H2', 'BLOCKQUOTE', 'LI', 'DIV'].includes(tagName)) {
              return node as HTMLElement;
          }
          node = node.parentNode;
      }
      return null;
  }

  const toggleBlock = (tag: 'H1' | 'H2') => {
    const currentBlock = getContainingBlock();
    // If the current block is already the target tag, switch it to a paragraph.
    if (currentBlock && currentBlock.tagName === tag) {
        execCmd('formatBlock', 'P');
    } else {
        // Otherwise, format the selection with the target tag.
        execCmd('formatBlock', 'H1' === tag ? 'H1' : 'H2');
    }
  };
  
  const toggleBlockquote = () => {
    const currentBlock = getContainingBlock();
    // If it's already a blockquote, switch to a paragraph.
    if (currentBlock && currentBlock.tagName === 'BLOCKQUOTE') {
        execCmd('formatBlock', 'P');
    } else {
        // Otherwise, format as a blockquote.
        execCmd('formatBlock', 'BLOCKQUOTE');
    }
  };

  const insertImage = (img: ImageAsset) => {
    const html = `<img src="${img.data}" data-id="${img.id}" data-filename="${img.name}" alt="${img.name}" />`;
    // Restore focus before inserting
    editorRef.current?.focus();
    execCmd('insertHTML', html);
    setShowImageModal(false);
  };

  // --- Split Logic ---
  const handleSplit = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !editorRef.current) {
        alert("请先点击编辑器内容，将光标放在要切分的位置。");
        return;
    }

    const range = selection.getRangeAt(0);
    
    // Safety check: ensure selection is actually inside the editor
    if (!editorRef.current.contains(range.commonAncestorContainer)) {
        // Try to recover focus if user clicked button and lost focus
        editorRef.current.focus();
        return; 
    }

    try {
        const afterRange = range.cloneRange();
        afterRange.selectNodeContents(editorRef.current);
        afterRange.setStart(range.endContainer, range.endOffset);
        
        const afterFragment = afterRange.extractContents();
        
        const div = document.createElement('div');
        div.appendChild(afterFragment);
        
        const beforeHtml = editorHTMLToContent(editorRef.current.innerHTML, project.images);
        const afterHtml = editorHTMLToContent(div.innerHTML, project.images);

        if (!afterHtml && !beforeHtml) return;

        onSplitChapter(beforeHtml, afterHtml);
    } catch (e) {
        console.error("Split failed", e);
    }
  };
  
  // --- Search Logic (Custom TreeWalker) ---
  const findMatches = (text: string) => {
    if (!editorRef.current || !text) return [];
    
    const matches: Range[] = [];
    const treeWalker = document.createTreeWalker(editorRef.current, NodeFilter.SHOW_TEXT);
    
    let currentNode = treeWalker.nextNode();
    while (currentNode) {
        const nodeValue = currentNode.nodeValue || '';
        let startPos = 0;
        let index = nodeValue.toLowerCase().indexOf(text.toLowerCase(), startPos);
        
        while (index !== -1) {
            const range = document.createRange();
            range.setStart(currentNode, index);
            range.setEnd(currentNode, index + text.length);
            matches.push(range);
            
            startPos = index + text.length;
            index = nodeValue.toLowerCase().indexOf(text.toLowerCase(), startPos);
        }
        currentNode = treeWalker.nextNode();
    }
    return matches;
  };

  const navigateMatch = (direction: 'next' | 'prev') => {
      const matches = findMatches(findText);
      if (matches.length === 0) {
          setMatchCount({ current: 0, total: 0 });
          return;
      }

      const selection = window.getSelection();
      let nextIndex = 0;

      if (selection && selection.rangeCount > 0) {
          const r = selection.getRangeAt(0);
          if (direction === 'next') {
              nextIndex = matches.findIndex(m => m.compareBoundaryPoints(Range.START_TO_START, r) > 0);
              if (nextIndex === -1) nextIndex = 0; // wrap
          } else {
              for (let i = matches.length - 1; i >= 0; i--) {
                  if (matches[i].compareBoundaryPoints(Range.START_TO_START, r) < 0) {
                      nextIndex = i;
                      break;
                  }
              }
              if (nextIndex === -1 && matches.length > 0) nextIndex = matches.length - 1;
          }
      }

      const targetRange = matches[nextIndex];
      selection?.removeAllRanges();
      selection?.addRange(targetRange);
      
      const parent = targetRange.startContainer.parentElement;
      parent?.scrollIntoView({ behavior: 'smooth', block: 'center' });

      setMatchCount({ current: nextIndex + 1, total: matches.length });
  };

  const handleReplace = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    if (range.toString().toLowerCase() === findText.toLowerCase()) {
        range.deleteContents();
        range.insertNode(document.createTextNode(replaceText));
        processContentUpdates();
        navigateMatch('next');
    } else {
        navigateMatch('next');
    }
  };

  const activeStyle = PRESET_STYLES.find(s => s.id === project.activeStyleId) || PRESET_STYLES[0];
  const activeStyleName = activeStyle.name || project.activeStyleId;

  // Gather extra CSS from extraFiles
  const extraCSS = project.extraFiles
    ?.filter(f => f.type === 'css' && f.isActive !== false)
    .map(f => f.content)
    .join('\n') || '';

  const scopedCSS = useMemo(() => {
    const activeStyle = PRESET_STYLES.find(s => s.id === project.activeStyleId) || PRESET_STYLES[0];
    const presetCss = project.isPresetStyleActive !== false ? activeStyle.css : 'body {}';

    return `
    .editor-paper {
       ${presetCss.match(/body\s*{([^}]*)}/)?.[1] || ''}
    }
    ${presetCss
       .replace(/body\s*{[^}]*}/, '')
       .replace(/(^|\})\s*([a-z0-9]+)/gi, '$1 .editor-paper $2')
    }
    ${project.customCSS.replace(/(^|\})\s*([a-z0-9]+)/gi, '$1 .editor-paper $2')}
    
    /* Extra Files CSS (Scoped naively) */
    ${extraCSS.replace(/(^|\})\s*([a-z0-9\.\-\_]+)/gi, '$1 .editor-paper $2')}
    
    .editor-paper img {
        cursor: pointer;
        transition: all 0.2s ease-in-out;
    }
    .editor-paper img:hover {
        outline: 3px solid rgba(59, 130, 246, 0.5);
        outline-offset: 2px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }
  `}, [project.activeStyleId, project.customCSS, extraCSS, project.isPresetStyleActive]);
  
  return (
    <div className="flex flex-col h-full bg-[#F5F5F7] relative">
      
      {/* Top Toolbar */}
      <div className="flex-none bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-20 shadow-sm overflow-x-auto">
        <div className="flex items-center space-x-1 min-w-max">
            <ToolbarButton icon={<RotateCcw size={18} />} onClick={() => execCmd('undo')} title="撤销" />
            <ToolbarButton icon={<RotateCw size={18} />} onClick={() => execCmd('redo')} title="重做" />
            <div className="w-px h-5 bg-gray-300 mx-2" />
            <ToolbarButton icon={<Heading1 size={18} />} onClick={() => toggleBlock('H1')} title="标题 1 (章节名)" />
            <ToolbarButton icon={<Heading2 size={18} />} onClick={() => toggleBlock('H2')} title="标题 2 (小节)" />
            <div className="w-px h-5 bg-gray-300 mx-2" />
            <ToolbarButton icon={<Bold size={18} />} onClick={() => execCmd('bold')} />
            <ToolbarButton icon={<Italic size={18} />} onClick={() => execCmd('italic')} />
            <div className="w-px h-5 bg-gray-300 mx-2" />
            <ToolbarButton icon={<Quote size={18} />} onClick={toggleBlockquote} title="引用" />
            <ToolbarButton icon={<List size={18} />} onClick={() => execCmd('insertUnorderedList')} title="无序列表" />
            <ToolbarButton icon={<ListOrdered size={18} />} onClick={() => execCmd('insertOrderedList')} title="有序列表" />
            <div className="w-px h-5 bg-gray-300 mx-2" />
            <ToolbarButton icon={<AlignLeft size={18} />} onClick={() => execCmd('justifyLeft')} />
            <ToolbarButton icon={<AlignCenter size={18} />} onClick={() => execCmd('justifyCenter')} />
            <div className="w-px h-5 bg-gray-300 mx-2" />
            <ToolbarButton icon={<ImageIcon size={18} />} onClick={() => setShowImageModal(true)} title="插入图片" />
        </div>

        <div className="flex items-center space-x-2 ml-4 min-w-max">
            <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => execCmd('insertHorizontalRule')}
                className="flex items-center space-x-1 px-3 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md text-sm font-medium transition-colors"
                title="插入分割线"
            >
                <Minus size={16} />
                <span>插入分割线</span>
            </button>
            <button 
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleSplit}
                className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-md text-sm font-medium transition-colors"
                title="在光标位置切分章节"
            >
                <Scissors size={16} />
                <span>手动切分</span>
            </button>
            <div className="w-px h-5 bg-gray-300 mx-2" />
            <ToolbarButton icon={<Search size={18} />} onClick={() => setShowFindBar(!showFindBar)} active={showFindBar} title="查找替换" />
        </div>
      </div>

      {/* Find & Replace Bar */}
      {showFindBar && (
        <div className="flex-none bg-gray-50 border-b border-gray-200 px-4 py-2 flex flex-wrap gap-2 items-center animate-in slide-in-from-top-2 z-10">
           <div className="flex items-center bg-white border border-gray-300 rounded-md px-2 py-1 shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent flex-1 min-w-[150px]">
              <Search size={14} className="text-gray-400 mr-2 flex-shrink-0" />
              <input 
                className="text-sm outline-none w-full min-w-0" 
                placeholder="查找..." 
                value={findText} 
                onChange={e => setFindText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && navigateMatch('next')}
              />
              {matchCount.total > 0 && <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">{matchCount.current}/{matchCount.total}</span>}
           </div>
           
           <div className="flex space-x-1 flex-shrink-0">
               <button onClick={() => navigateMatch('prev')} className="p-1 hover:bg-gray-200 rounded"><ChevronUp size={16}/></button>
               <button onClick={() => navigateMatch('next')} className="p-1 hover:bg-gray-200 rounded"><ChevronDown size={16}/></button>
           </div>

           <div className="flex items-center bg-white border border-gray-300 rounded-md px-2 py-1 shadow-sm flex-1 min-w-[150px]">
              <Type size={14} className="text-gray-400 mr-2 flex-shrink-0" />
              <input 
                className="text-sm outline-none w-full min-w-0" 
                placeholder="替换为..." 
                value={replaceText} 
                onChange={e => setReplaceText(e.target.value)}
              />
           </div>
           
           <button onClick={handleReplace} className="px-3 py-1 bg-white border border-gray-300 hover:bg-gray-50 text-xs font-medium rounded shadow-sm flex-shrink-0">替换</button>
           <button onClick={() => setShowFindBar(false)} className="ml-auto text-gray-400 hover:text-gray-600 flex-shrink-0"><X size={16}/></button>
        </div>
      )}

      {/* Editor Content Area */}
      <div className="flex-1 overflow-y-auto bg-[#F5F5F7] p-8 scroll-smooth pb-40">
        <div className="editor-paper mx-auto w-full max-w-[800px] shadow-lg min-h-[1123px] p-[60px] cursor-text transition-all">
          <style>{scopedCSS}</style>
          <div
            ref={editorRef}
            contentEditable
            className="outline-none min-h-full"
            onInput={handleInput}
            suppressContentEditableWarning
            data-placeholder="在此输入内容..."
          />
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex-none h-8 bg-white border-t border-gray-200 flex items-center justify-between px-4 text-xs text-gray-500 select-none z-20">
         <div className="flex items-center space-x-4">
            <span className="flex items-center"><AlignJustify size={12} className="mr-1"/> {stats.chars} 字</span>
            <span className="flex items-center"><Clock size={12} className="mr-1"/> 约 {stats.time} 分钟阅读</span>
         </div>
         <div className="flex items-center space-x-2">
            <span>{activeStyleName}</span>
         </div>
      </div>

      {/* Image Modal */}
      {showImageModal && (
        <div className="absolute inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center p-8">
           <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-2xl w-full max-h-[80%] flex flex-col">
              <div className="flex justify-between mb-4">
                 <h3 className="font-bold">选择图片</h3>
                 <button onClick={() => setShowImageModal(false)}><X/></button>
              </div>
              <div className="overflow-y-auto grid grid-cols-4 gap-4 p-2">
                 {project.images.map((img) => (
                    <button key={img.id} onClick={() => insertImage(img)} className="border rounded-lg p-2 hover:border-blue-500">
                       <img src={img.data} className="w-full h-20 object-contain" />
                       <p className="text-[10px] truncate mt-1">{img.name}</p>
                    </button>
                 ))}
                 {project.images.length === 0 && <p className="col-span-4 text-center text-gray-400">请先在侧边栏上传图片</p>}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const ToolbarButton: React.FC<{ icon: React.ReactNode, onClick: () => void, title?: string, active?: boolean }> = ({ icon, onClick, title, active }) => (
  <button 
    onMouseDown={(e) => e.preventDefault()} // Prevent focus loss
    onClick={onClick} 
    title={title}
    className={`p-2 rounded-md transition-colors ${
        active 
        ? 'bg-blue-100 text-blue-600' 
        : 'text-gray-600 hover:bg-gray-100'
    }`}
  >
    {icon}
  </button>
);

export default Editor;