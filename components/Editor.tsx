import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { 
  Heading1, 
  Heading2, 
  Bold, 
  Italic, 
  Quote, 
  List, 
  ListOrdered, 
  Image as ImageIcon,
  AlignLeft,
  AlignJustify,
  RotateCcw,
  RotateCw,
  Search,
  X,
  ChevronDown,
  ChevronUp, 
  Type,
  Clock,
  CheckCircle2,
  Scissors,
  Minus,
  Captions,
  PowerOff
} from 'lucide-react';
import { ProjectData, PRESET_STYLES, ImageAsset, TocItem } from '../types';

interface EditorProps {
  content: string;
  onContentChange: (newContent: string, title?: string, subItems?: TocItem[]) => void;
  onSplitChapter: (beforeContent: string, afterContent: string) => void;
  project: ProjectData;
  scrollToId?: string | null;
  saveStatus?: 'saved' | 'saving';
  autoSaveEnabled: boolean;
  onToggleAutoSave: () => void;
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


const Editor: React.FC<EditorProps> = ({ 
    content, 
    onContentChange, 
    onSplitChapter, 
    project, 
    scrollToId, 
    saveStatus = 'saved',
    autoSaveEnabled,
    onToggleAutoSave
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showFindBar, setShowFindBar] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [stats, setStats] = useState({ chars: 0, time: 0 });

  // --- Search State ---
  const [matches, setMatches] = useState<Range[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);
  const searchUpdateRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);


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

  const toggleCaption = () => {
    let currentBlock = getContainingBlock();
    if (!currentBlock) return;

    // If currently H1, H2, Blockquote, convert to P
    if (['H1', 'H2', 'BLOCKQUOTE'].includes(currentBlock.tagName)) {
        execCmd('formatBlock', 'P');
        // We need to find the block again because the DOM node was replaced
        currentBlock = getContainingBlock(); 
    }

    if (currentBlock) {
        currentBlock.classList.toggle('caption');
        processContentUpdates();
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
  
  // --- Robust Search & Highlight Logic ---

  const clearHighlights = useCallback(() => {
    if (!editorRef.current) return;
    const marks = editorRef.current.querySelectorAll('mark.search-highlight');
    marks.forEach(mark => {
      const parent = mark.parentNode;
      if (!parent) return;
      while (mark.firstChild) {
        parent.insertBefore(mark.firstChild, mark);
      }
      parent.removeChild(mark);
      parent.normalize(); // Merges adjacent text nodes
    });
  }, []);

  const runSearch = useCallback((textToFind: string) => {
    if (!editorRef.current || !textToFind) return [];

    const textNodes: Text[] = [];
    const walker = document.createTreeWalker(editorRef.current, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      textNodes.push(walker.currentNode as Text);
    }

    const fullText = textNodes.map(n => n.nodeValue).join('');
    const searchLower = textToFind.toLowerCase();
    const fullTextLower = fullText.toLowerCase();

    const ranges: Range[] = [];
    let startIndex = 0;
    while ((startIndex = fullTextLower.indexOf(searchLower, startIndex)) > -1) {
      const endIndex = startIndex + textToFind.length;

      let charCount = 0;
      let startNode, startOffset, endNode, endOffset;

      for (const node of textNodes) {
        const nodeLen = node.nodeValue!.length;
        const currentEnd = charCount + nodeLen;
        
        if (startNode === undefined && startIndex < currentEnd) {
          startNode = node;
          startOffset = startIndex - charCount;
        }

        if (endNode === undefined && endIndex <= currentEnd) {
          endNode = node;
          endOffset = endIndex - charCount;
          break;
        }
        charCount += nodeLen;
      }
      
      if (startNode && endNode) {
        const range = document.createRange();
        range.setStart(startNode, startOffset!);
        range.setEnd(endNode, endOffset!);
        ranges.push(range);
      }
      
      startIndex += 1;
    }
    return ranges;
  }, []);

  useEffect(() => {
    if (searchUpdateRef.current) {
      clearTimeout(searchUpdateRef.current);
    }
    searchUpdateRef.current = setTimeout(() => {
      clearHighlights();
      if (findText) {
        const foundRanges = runSearch(findText);
        setMatches(foundRanges);
        if (foundRanges.length > 0) {
          // Highlight all matches by wrapping them in <mark> tags
          // Iterate backwards to avoid invalidating ranges
          for (let i = foundRanges.length - 1; i >= 0; i--) {
            try {
              const mark = document.createElement('mark');
              mark.className = 'search-highlight';
              foundRanges[i].surroundContents(mark);
            } catch (e) {
              console.warn("Could not highlight range", foundRanges[i], e);
            }
          }
          setCurrentMatchIndex(0);
        } else {
          setCurrentMatchIndex(-1);
        }
      } else {
        setMatches([]);
        setCurrentMatchIndex(-1);
      }
    }, 300); // Debounce search
  }, [findText, content, runSearch, clearHighlights]);

  useEffect(() => {
    if (!editorRef.current) return;
    const allMarks = editorRef.current.querySelectorAll('.search-highlight');
    allMarks.forEach((mark, index) => {
      if (index === currentMatchIndex) {
        if (!mark.classList.contains('search-highlight--current')) {
           mark.classList.add('search-highlight--current');
           mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else {
        mark.classList.remove('search-highlight--current');
      }
    });
  }, [currentMatchIndex, matches]);

  const navigateMatch = (direction: 'next' | 'prev') => {
    if (matches.length === 0) return;
    const nextIndex = direction === 'next'
      ? (currentMatchIndex + 1) % matches.length
      : (currentMatchIndex - 1 + matches.length) % matches.length;
    setCurrentMatchIndex(nextIndex);
  };
  
  const handleReplace = () => {
    if (currentMatchIndex === -1 || !editorRef.current) return;
    const currentMark = editorRef.current.querySelector('.search-highlight--current');
    if (currentMark) {
      currentMark.textContent = replaceText;
      const text = findText;
      setFindText(''); 
      setTimeout(() => setFindText(text), 50); 
    }
  };

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
    .editor-paper .search-highlight {
      background-color: #fef08a; /* yellow-200 */
      border-radius: 2px;
      transition: background-color 0.3s;
    }
    .editor-paper .search-highlight--current {
      background-color: #f97316; /* orange-600 */
      color: white;
    }
  `}, [project.activeStyleId, project.customCSS, extraCSS, project.isPresetStyleActive]);
  
  // Extract chapter title for display
  const chapterTitle = useMemo(() => {
     if (!editorRef.current) return '';
     const h1 = editorRef.current.querySelector('h1');
     return h1?.innerText || '';
  }, [content]); // Not perfect, but a rough sync

  return (
    <div className="flex flex-col h-full bg-[#F9FAFB] relative overflow-hidden">
      
      {/* Redesigned Toolbar */}
      <div className="flex-none h-14 bg-white border-b border-gray-200 px-6 flex items-center justify-between z-20 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
        <div className="flex items-center">
            {/* History */}
            <div className="flex items-center space-x-1 mr-2">
                <ToolbarButton icon={<RotateCcw size={16} />} onClick={() => execCmd('undo')} title="撤销" />
                <ToolbarButton icon={<RotateCw size={16} />} onClick={() => execCmd('redo')} title="重做" />
            </div>
            
            <div className="h-5 w-px bg-gray-200 mx-2" />

            {/* Headings */}
            <div className="flex items-center space-x-1 mx-2">
                <ToolbarButton icon={<Heading1 size={16} />} onClick={() => toggleBlock('H1')} title="标题 1 (章节名)" />
                <ToolbarButton icon={<Heading2 size={16} />} onClick={() => toggleBlock('H2')} title="标题 2 (小节)" />
            </div>

            <div className="h-5 w-px bg-gray-200 mx-2" />

            {/* Formatting */}
            <div className="flex items-center space-x-1 mx-2">
                <ToolbarButton icon={<Bold size={16} />} onClick={() => execCmd('bold')} />
                <ToolbarButton icon={<Italic size={16} />} onClick={() => execCmd('italic')} />
                <ToolbarButton icon={<Quote size={16} />} onClick={toggleBlockquote} title="引用" />
                <ToolbarButton icon={<Captions size={16} />} onClick={toggleCaption} title="图片说明 (图注)" />
            </div>

            <div className="h-5 w-px bg-gray-200 mx-2" />

            {/* Lists */}
            <div className="flex items-center space-x-1 mx-2">
                <ToolbarButton icon={<List size={16} />} onClick={() => execCmd('insertUnorderedList')} title="无序列表" />
                <ToolbarButton icon={<ListOrdered size={16} />} onClick={() => execCmd('insertOrderedList')} title="有序列表" />
            </div>

            <div className="h-5 w-px bg-gray-200 mx-2" />

            {/* Alignment */}
            <div className="flex items-center space-x-1 mx-2">
                <ToolbarButton icon={<AlignLeft size={16} />} onClick={() => execCmd('justifyLeft')} />
                <ToolbarButton icon={<AlignJustify size={16} />} onClick={() => execCmd('justifyCenter')} />
            </div>

            <div className="h-5 w-px bg-gray-200 mx-2" />

            {/* Insert & Actions */}
            <div className="flex items-center space-x-1 mx-2">
                <ToolbarButton icon={<ImageIcon size={16} />} onClick={() => setShowImageModal(true)} title="插入图片" />
                <ToolbarButton icon={<Minus size={16} />} onClick={() => execCmd('insertHorizontalRule')} title="插入分割线" />
            </div>

            <div className="h-5 w-px bg-gray-200 mx-2" />

             {/* Tools */}
            <div className="flex items-center space-x-1 mx-2">
                <ToolbarButton icon={<Scissors size={16} />} onClick={handleSplit} title="手动切分章节" />
            </div>
        </div>

        <div className="flex items-center">
             <button 
                onClick={() => setShowFindBar(!showFindBar)} 
                className={`p-2 rounded-lg transition-colors ${showFindBar ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                title="查找与替换"
             >
                <Search size={18} />
             </button>
        </div>
      </div>

      {/* Find & Replace Bar */}
      {showFindBar && (
        <div className="flex-none bg-white border-b border-gray-200 px-6 py-2 flex flex-wrap gap-3 items-center animate-in slide-in-from-top-2 z-10 shadow-sm">
           <div className="flex items-center bg-gray-100 rounded-lg px-3 py-1.5 flex-1 min-w-[200px]">
              <Search size={14} className="text-gray-400 mr-2 flex-shrink-0" />
              <input 
                className="text-sm bg-transparent outline-none w-full min-w-0 placeholder:text-gray-400" 
                placeholder="查找内容..." 
                value={findText} 
                onChange={e => setFindText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') navigateMatch('next')}}
              />
              {findText && <span className="text-xs text-gray-400 ml-2 whitespace-nowrap tabular-nums">{matches.length > 0 ? `${currentMatchIndex + 1}/${matches.length}` : '0/0'}</span>}
           </div>
           
           <div className="flex space-x-1 flex-shrink-0 bg-gray-100 rounded-lg p-0.5">
               <button onClick={() => navigateMatch('prev')} className="p-1 hover:bg-white hover:shadow-sm rounded transition-all text-gray-500"><ChevronUp size={16}/></button>
               <button onClick={() => navigateMatch('next')} className="p-1 hover:bg-white hover:shadow-sm rounded transition-all text-gray-500"><ChevronDown size={16}/></button>
           </div>

           <div className="flex items-center bg-gray-100 rounded-lg px-3 py-1.5 flex-1 min-w-[200px]">
              <Type size={14} className="text-gray-400 mr-2 flex-shrink-0" />
              <input 
                className="text-sm bg-transparent outline-none w-full min-w-0 placeholder:text-gray-400" 
                placeholder="替换为..." 
                value={replaceText} 
                onChange={e => setReplaceText(e.target.value)}
              />
           </div>
           
           <button onClick={handleReplace} className="px-4 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-semibold transition-colors flex-shrink-0">替换</button>
           <button onClick={() => setShowFindBar(false)} className="ml-auto text-gray-400 hover:text-gray-600 flex-shrink-0"><X size={18}/></button>
        </div>
      )}

      {/* Editor Content Area */}
      <div className="flex-1 overflow-y-auto bg-[#F9FAFB] p-8 scroll-smooth pb-20">
        <div className="relative mx-auto w-full max-w-[800px] bg-white shadow-sm border border-gray-100/50 min-h-[1100px] p-16 cursor-text transition-all rounded-sm">
          {/* Visual Chapter Title Hint - Non-Editable */}
          <div className="absolute top-12 right-12 text-gray-400 font-serif text-lg opacity-30 select-none pointer-events-none">
             {chapterTitle || 'Untitled'}
          </div>

          <style>{scopedCSS}</style>
          <div className="editor-paper outline-none min-h-[900px]">
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
      </div>

      {/* Status Footer */}
      <div className="flex-none h-10 bg-white border-t border-gray-100 flex items-center justify-between px-6 text-xs text-gray-500 select-none z-20">
         <div className="flex items-center space-x-6">
            <span className="flex items-center font-medium text-gray-400">
                <AlignJustify size={14} className="mr-2 text-gray-300 transform rotate-90"/> 
                {stats.chars} 字
            </span>
            <span className="flex items-center font-medium text-gray-400">
                <Clock size={14} className="mr-2 text-gray-300"/> 
                约 {stats.time} 分钟阅读
            </span>
         </div>
         <div className="flex items-center">
            <button 
                onClick={onToggleAutoSave}
                className="focus:outline-none"
                title={autoSaveEnabled ? "点击关闭自动保存" : "点击开启自动保存"}
            >
                {!autoSaveEnabled ? (
                     <div className="flex items-center text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full border border-gray-200 hover:bg-gray-200 transition-colors">
                        <PowerOff size={12} className="mr-1.5" />
                        自动保存已关
                    </div>
                ) : saveStatus === 'saving' ? (
                    <div className="flex items-center text-amber-500 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100 hover:bg-amber-100 transition-colors">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse mr-2"></span>
                        保存中...
                    </div>
                ) : (
                    <div className="flex items-center text-green-600 bg-green-50 px-2.5 py-1 rounded-full border border-green-100 hover:bg-green-100 transition-colors">
                        <CheckCircle2 size={12} className="mr-1.5" />
                        已保存
                    </div>
                )}
            </button>
         </div>
      </div>

      {/* Image Modal */}
      {showImageModal && (
        <div className="absolute inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center p-8">
           <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-2xl w-full max-h-[80%] flex flex-col animate-in zoom-in-95 duration-200">
              <div className="flex justify-between mb-4">
                 <h3 className="font-bold text-gray-800">选择图片插入</h3>
                 <button onClick={() => setShowImageModal(false)} className="text-gray-400 hover:text-gray-600"><X/></button>
              </div>
              <div className="overflow-y-auto grid grid-cols-4 gap-4 p-2 custom-scrollbar">
                 {project.images.map((img) => (
                    <button key={img.id} onClick={() => insertImage(img)} className="border border-gray-200 rounded-xl p-2 hover:border-blue-500 hover:ring-2 hover:ring-blue-100 transition-all bg-gray-50">
                       <img src={img.data} className="w-full h-24 object-contain rounded-lg mb-2 bg-white" />
                       <p className="text-[10px] text-gray-500 truncate w-full">{img.name}</p>
                    </button>
                 ))}
                 {project.images.length === 0 && (
                     <div className="col-span-4 py-10 flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                         <ImageIcon size={32} className="mb-2 opacity-50"/>
                         <p>素材库为空，请先在“图片素材”中上传</p>
                     </div>
                 )}
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
    className={`p-2 rounded-lg transition-all duration-200 ${
        active 
        ? 'bg-blue-50 text-blue-600' 
        : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'
    }`}
  >
    {icon}
  </button>
);

export default Editor;