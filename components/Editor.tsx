import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { AlignJustify, Clock } from 'lucide-react';
import { ProjectData, PRESET_STYLES, ImageAsset, TocItem } from '../types';
import EditorToolbar from './editor/EditorToolbar';
import FindReplaceBar from './editor/FindReplaceBar';
import ImageModal from './editor/ImageModal';

interface EditorProps {
  content: string;
  onContentChange: (newContent: string, title?: string, subItems?: TocItem[]) => void;
  onSplitChapter: (beforeContent: string, afterContent: string) => void;
  project: ProjectData;
  scrollToId?: string | null;
  onMobileBack?: () => void; 
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
    onMobileBack
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
  const [matchCase, setMatchCase] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
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
    editorRef.current?.focus(); 
    processContentUpdates();
  };
  
  const getContainingBlock = (): HTMLElement | null => {
      const selection = window.getSelection();
      if (!selection?.rangeCount) return null;
      let node = selection.getRangeAt(0).commonAncestorContainer;
      
      if (node.nodeType !== Node.ELEMENT_NODE) {
          node = node.parentNode!;
      }
      if (!node) return null;

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
    if (currentBlock && currentBlock.tagName === tag) {
        execCmd('formatBlock', 'P');
    } else {
        execCmd('formatBlock', 'H1' === tag ? 'H1' : 'H2');
    }
  };
  
  const toggleBlockquote = () => {
    const currentBlock = getContainingBlock();
    if (currentBlock && currentBlock.tagName === 'BLOCKQUOTE') {
        execCmd('formatBlock', 'P');
    } else {
        execCmd('formatBlock', 'BLOCKQUOTE');
    }
  };

  const toggleCaption = () => {
    let currentBlock = getContainingBlock();
    if (!currentBlock) return;

    if (['H1', 'H2', 'BLOCKQUOTE'].includes(currentBlock.tagName)) {
        execCmd('formatBlock', 'P');
        currentBlock = getContainingBlock(); 
    }

    if (currentBlock) {
        currentBlock.classList.toggle('caption');
        processContentUpdates();
    }
  };

  const insertImage = (img: ImageAsset) => {
    const html = `<img src="${img.data}" data-id="${img.id}" data-filename="${img.name}" alt="${img.name}" />`;
    editorRef.current?.focus();
    execCmd('insertHTML', html);
    setShowImageModal(false);
  };

  const handleSplit = () => {
    // Ensure IDs exist on content before splitting, as splitting logic depends on them for TOC
    processContentUpdates();

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !editorRef.current) {
        alert("请先点击编辑器内容，将光标放在要切分的位置。");
        return;
    }

    const range = selection.getRangeAt(0);
    
    if (!editorRef.current.contains(range.commonAncestorContainer)) {
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
      parent.normalize(); 
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
    
    const textToSearch = matchCase ? fullText : fullText.toLowerCase();
    const pattern = matchCase ? textToFind : textToFind.toLowerCase();

    const ranges: Range[] = [];
    let startIndex = 0;
    while ((startIndex = textToSearch.indexOf(pattern, startIndex)) > -1) {
      const endIndex = startIndex + pattern.length;

      // Whole Word Check
      if (wholeWord) {
          const prevChar = startIndex > 0 ? textToSearch[startIndex - 1] : ' ';
          const nextChar = endIndex < textToSearch.length ? textToSearch[endIndex] : ' ';
          const isWordChar = (c: string) => /[\w\u00C0-\u00FF]/.test(c);
          
          if (isWordChar(prevChar) || isWordChar(nextChar)) {
              startIndex += 1; 
              continue;
          }
      }

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
  }, [matchCase, wholeWord]);

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
    }, 300);
  }, [findText, content, runSearch, clearHighlights, matchCase, wholeWord]);

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
  
  const chapterTitle = useMemo(() => {
     if (!editorRef.current) return '';
     const h1 = editorRef.current.querySelector('h1');
     return h1?.innerText || '';
  }, [content]);

  return (
    <div className="flex flex-col h-full bg-[#F9FAFB] relative overflow-hidden">
      
      <EditorToolbar 
        onMobileBack={onMobileBack}
        execCmd={execCmd}
        toggleBlock={toggleBlock}
        toggleBlockquote={toggleBlockquote}
        toggleCaption={toggleCaption}
        handleSplit={handleSplit}
        setShowImageModal={setShowImageModal}
        showFindBar={showFindBar}
        setShowFindBar={setShowFindBar}
      />

      {showFindBar && (
          <FindReplaceBar 
            findText={findText} setFindText={setFindText}
            replaceText={replaceText} setReplaceText={setReplaceText}
            matchCase={matchCase} setMatchCase={setMatchCase}
            wholeWord={wholeWord} setWholeWord={setWholeWord}
            matchesCount={matches.length}
            currentMatchIndex={currentMatchIndex}
            onNavigateNext={() => navigateMatch('next')}
            onNavigatePrev={() => navigateMatch('prev')}
            onReplace={handleReplace}
            onClose={() => setShowFindBar(false)}
          />
      )}

      {/* Editor Content Area */}
      <div className="flex-1 overflow-y-auto bg-[#F9FAFB] p-2 md:p-8 scroll-smooth pb-20">
        <div className="relative mx-auto w-full max-w-[800px] bg-white shadow-sm border border-gray-100/50 min-h-[900px] md:min-h-[1100px] p-6 md:p-16 cursor-text transition-all rounded-sm">
          {/* Visual Chapter Title Hint - Non-Editable */}
          <div className="absolute top-4 right-4 md:top-12 md:right-12 text-gray-400 font-serif text-sm md:text-lg opacity-30 select-none pointer-events-none">
             {chapterTitle || 'Untitled'}
          </div>

          <style>{scopedCSS}</style>
          <div className="editor-paper outline-none min-h-[600px] md:min-h-[900px]">
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
      <div className="flex-none h-10 bg-white border-t border-gray-100 flex items-center justify-center md:justify-between px-4 md:px-6 text-xs text-gray-500 select-none z-20">
         <div className="flex items-center space-x-3 md:space-x-6">
            <span className="flex items-center font-medium text-gray-400">
                <AlignJustify size={14} className="mr-2 text-gray-300 transform rotate-90"/> 
                {stats.chars} 字
            </span>
            <span className="hidden md:flex items-center font-medium text-gray-400">
                <Clock size={14} className="mr-2 text-gray-300"/> 
                约 {stats.time} 分钟阅读
            </span>
         </div>
      </div>

      {showImageModal && (
          <ImageModal 
            images={project.images}
            onInsert={insertImage}
            onClose={() => setShowImageModal(false)}
          />
      )}
    </div>
  );
};

export default Editor;