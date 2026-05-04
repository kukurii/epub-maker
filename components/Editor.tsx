import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { AlignJustify, Clock } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import ImageExtension from '@tiptap/extension-image';
import LinkExtension from '@tiptap/extension-link';
import TextAlignExtension from '@tiptap/extension-text-align';
import UnderlineExtension from '@tiptap/extension-underline';
import { RubyMark } from './editor/extensions/RubyMark';
import { CustomHeading } from './editor/extensions/CustomHeading';
import { CustomHorizontalRule } from './editor/extensions/CustomHorizontalRule';
import { SearchHighlight } from './editor/extensions/SearchHighlight';
import { ProjectData, TocItem, ImageAsset } from '../types';
import EditorToolbar from './editor/EditorToolbar';
import FindReplaceBar from './editor/FindReplaceBar';
import ImageModal from './editor/ImageModal';
import { dialog } from '../services/dialog';
import { contentToEditorHTML, editorHTMLToContent, extractHeadingsToSubItems, extractChapterTitle, calculateReadStats } from './editor/utils';
import { useEditorSearch } from './editor/useEditorSearch';
import { PRESET_STYLES } from '../themes';

interface EditorProps {
  content: string;
  onContentChange: (newContent: string, title?: string, subItems?: TocItem[]) => void;
  onSplitChapter: (beforeContent: string, afterContent: string) => void;
  project: ProjectData;
  focusRequest?: {
    anchorId?: string | null;
    searchText?: string | null;
    imageId?: string | null;
    key: number;
  } | null;
  onMobileBack?: () => void;
  activeChapter?: { title: string };
}

const Editor: React.FC<EditorProps> = ({
  content,
  onContentChange,
  onSplitChapter,
  project,
  focusRequest,
  activeChapter,
  onMobileBack
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  // scrollRef 指向外层 overflow-y-auto 滚动容器，用于搜索跳转时精准滚动
  const scrollRef = useRef<HTMLDivElement>(null);
  const onContentChangeRef = useRef(onContentChange);
  const imagesRef = useRef(project.images);
  const activeChapterTitleRef = useRef(activeChapter?.title);
  const [showImageModal, setShowImageModal] = useState(false);
  const [stats, setStats] = useState({ chars: 0, time: 0 });

  useEffect(() => {
    onContentChangeRef.current = onContentChange;
  }, [onContentChange]);

  useEffect(() => {
    imagesRef.current = project.images;
  }, [project.images]);

  useEffect(() => {
    activeChapterTitleRef.current = activeChapter?.title;
  }, [activeChapter?.title]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        horizontalRule: false,
      }),
      CustomHeading.configure({
        levels: [1, 2],
        HTMLAttributes: {
          class: 'heading',
        },
      }),
      CustomHorizontalRule,
      ImageExtension.configure({
        inline: false,
        HTMLAttributes: {
          class: 'editor-image',
        },
      }),
      LinkExtension.configure({
        openOnClick: false,
        autolink: true,
      }),
      UnderlineExtension,
      TextAlignExtension.configure({
        types: ['heading', 'paragraph'],
      }),
      RubyMark,
      SearchHighlight, // 搜索高亮 Decoration 插件
    ],
    content: contentToEditorHTML(content, project.images),
    onCreate: ({ editor }) => {
      setStats(calculateReadStats(editor.getText()));
    },
    onUpdate: ({ editor }) => {
      const newEditorHTML = editor.getHTML();
      const newContent = editorHTMLToContent(newEditorHTML, imagesRef.current);
      setStats(calculateReadStats(editor.getText()));

      let newTitle = activeChapterTitleRef.current;
      let subItems: TocItem[] = [];
      if (containerRef.current) {
        const proseMirrorEl = containerRef.current.querySelector('.ProseMirror') as HTMLElement | null;
        if (proseMirrorEl) {
          newTitle = extractChapterTitle(proseMirrorEl, activeChapterTitleRef.current);
          subItems = extractHeadingsToSubItems(proseMirrorEl);
        }
      }

      onContentChangeRef.current(newContent, newTitle, subItems);
    },
    editorProps: {
      attributes: {
        class: 'outline-none flex-1',
        spellcheck: 'false',
      },
    },
  }, []);

  // 将外层滚动容器 ref 传给 useEditorSearch，确保搜索跳转能滚动到正确位置
  const searchProps = useEditorSearch(editor, content, scrollRef);

  useEffect(() => {
    if (!focusRequest?.anchorId || !containerRef.current) return;

    const element = containerRef.current.querySelector(`#${focusRequest.anchorId}`);
    if (!element) return;

    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    element.classList.add('bg-yellow-100', 'transition-colors', 'duration-1000');
    setTimeout(() => element.classList.remove('bg-yellow-100'), 1500);
  }, [focusRequest?.anchorId, focusRequest?.key]);

  useEffect(() => {
    if (!focusRequest?.imageId || !containerRef.current) return;

    const element = containerRef.current.querySelector(`img[data-id="${focusRequest.imageId}"]`);
    if (!element) return;

    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    element.classList.add('ring-4', 'ring-amber-300', 'transition-all', 'duration-1000');
    setTimeout(() => element.classList.remove('ring-4', 'ring-amber-300'), 1500);
  }, [focusRequest?.imageId, focusRequest?.key]);

  // 解构出稳定的引用，避免 searchProps 对象每次渲染都变化导致事件监听器重复注册
  const { setShowFindBar, showFindBar: isFindBarVisible, setFindText: setSearchFindText } = searchProps;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMeta = event.ctrlKey || event.metaKey;

      if (isMeta && event.key.toLowerCase() === 'f') {
        event.preventDefault();
        setShowFindBar(true);
        return;
      }

      if (isMeta && event.shiftKey && event.key.toLowerCase() === 'h') {
        event.preventDefault();
        setShowFindBar(true);
        return;
      }

      if (event.key === 'Escape' && isFindBarVisible) {
        event.preventDefault();
        setShowFindBar(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setShowFindBar, isFindBarVisible]);

  useEffect(() => {
    if (!focusRequest?.searchText || !editor) return;

    setShowFindBar(true);
    setSearchFindText(focusRequest.searchText);
  }, [editor, focusRequest?.key, setShowFindBar, setSearchFindText]);

  const insertImage = useCallback((img: ImageAsset) => {
    if (!editor) return;

    editor.chain().focus().setImage({
      src: img.data,
      alt: img.name,
      title: img.id,
    }).run();
    setShowImageModal(false);
  }, [editor]);

  const handleSplit = useCallback(async () => {
    if (!editor) return;

    const { from } = editor.state.selection;
    if (from === undefined || from <= 0) {
      await dialog.alert('请先把光标放到需要拆分的位置。');
      return;
    }

    try {
      const doc = editor.state.doc;
      const beforeFragment = doc.slice(0, from);
      const afterFragment = doc.slice(from, doc.content.size);

      const { DOMSerializer } = await import('@tiptap/pm/model');
      const serializer = DOMSerializer.fromSchema(editor.schema);

      const beforeDocNode = editor.schema.nodes.doc.create(undefined, beforeFragment.content);
      const afterDocNode = editor.schema.nodes.doc.create(undefined, afterFragment.content);

      const beforeDiv = document.createElement('div');
      beforeDiv.appendChild(serializer.serializeFragment(beforeDocNode.content));

      const afterDiv = document.createElement('div');
      afterDiv.appendChild(serializer.serializeFragment(afterDocNode.content));

      const beforeHtml = editorHTMLToContent(beforeDiv.innerHTML, project.images);
      const afterHtml = editorHTMLToContent(afterDiv.innerHTML, project.images);

      onSplitChapter(beforeHtml, afterHtml);
    } catch (error) {
      console.error('Split failed', error);
      await dialog.alert('拆分失败，请重试。');
    }
  }, [editor, onSplitChapter, project.images]);

  const extraCSS = project.extraFiles
    ?.filter(f => f.type === 'css' && f.isActive !== false)
    .map(f => f.content)
    .join('\n') || '';

  const scopedCSS = useMemo(() => {
    const activeStyle = PRESET_STYLES.find(s => s.id === project.activeStyleId) || PRESET_STYLES[0];
    const presetCss = project.isPresetStyleActive !== false ? activeStyle.css : 'body {}';

    // 从 body {} 规则中提取允许的样式属性（过滤掉布局相关的）
    const sanitizeEditorBodyStyles = (bodyStyles: string) => {
      const blockedProps = new Set([
        'width', 'min-width', 'max-width',
        'height', 'min-height', 'max-height',
        'margin', 'margin-left', 'margin-right', 'margin-top', 'margin-bottom',
        'padding', 'padding-left', 'padding-right', 'padding-top', 'padding-bottom',
        'overflow', 'overflow-x', 'overflow-y',
        'position', 'left', 'right', 'top', 'bottom', 'display',
      ]);
      return bodyStyles
        .split(';')
        .map(rule => rule.trim())
        .filter(Boolean)
        .filter(rule => {
          const colonIndex = rule.indexOf(':');
          if (colonIndex === -1) return false;
          const property = rule.slice(0, colonIndex).trim().toLowerCase();
          return !blockedProps.has(property);
        })
        .join(';\n      ');
    };

    /**
     * 基于规则解析的 CSS 作用域函数。
     * 替代之前有缺陷的单行正则，正确处理：
     * - CSS 注释 (不修改)
     * - 字符串/content 属性值 (不修改)
     * - @media / @keyframes 等 at-rule (递归处理内部规则)
     * - body 选择器 → .editor-paper
     * - :root 选择器 → .editor-paper
     * - 普通选择器 → 添加 .editor-paper 前缀
     */
    const scopeCSS = (css: string): string => {
      // 第一步：去掉注释，保留位置信息不重要
      const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');

      const result: string[] = [];
      let i = 0;

      while (i < stripped.length) {
        // 跳过空白
        while (i < stripped.length && /\s/.test(stripped[i])) { i++; }
        if (i >= stripped.length) break;

        // 检测 @规则
        if (stripped[i] === '@') {
          const atStart = i;
          // 读取到 { 或 ; (如 @import)
          while (i < stripped.length && stripped[i] !== '{' && stripped[i] !== ';') { i++; }
          const atHeader = stripped.slice(atStart, i).trim();

          if (i < stripped.length && stripped[i] === ';') {
            // 单行 @规则 (如 @import)，原样保留
            result.push(atHeader + ';');
            i++;
            continue;
          }

          if (i < stripped.length && stripped[i] === '{') {
            // 带块的 @规则
            i++; // 跳过 {
            // 读取匹配的 } (处理嵌套)
            let depth = 1;
            const blockStart = i;
            while (i < stripped.length && depth > 0) {
              if (stripped[i] === '{') depth++;
              else if (stripped[i] === '}') depth--;
              if (depth > 0) i++;
            }
            const blockContent = stripped.slice(blockStart, i);
            i++; // 跳过 }

            if (/^@(media|supports|layer)/i.test(atHeader)) {
              // 可嵌套的 @规则：递归处理内部
              result.push(`${atHeader} {\n${scopeCSS(blockContent)}\n}`);
            } else {
              // @keyframes / @font-face 等：原样保留
              result.push(`${atHeader} {${blockContent}}`);
            }
            continue;
          }
        }

        // 普通规则：读取选择器（到 { 为止）
        const ruleStart = i;
        while (i < stripped.length && stripped[i] !== '{') { i++; }
        if (i >= stripped.length) break;

        const rawSelector = stripped.slice(ruleStart, i).trim();
        i++; // 跳过 {

        // 读取声明块（到匹配的 } 为止）
        let depth = 1;
        const declStart = i;
        while (i < stripped.length && depth > 0) {
          if (stripped[i] === '{') depth++;
          else if (stripped[i] === '}') depth--;
          if (depth > 0) i++;
        }
        const declarations = stripped.slice(declStart, i).trim();
        i++; // 跳过 }

        if (!rawSelector) continue;

        // 处理选择器列表（逗号分隔）
        const scopedSelectors = rawSelector.split(',').map(sel => {
          sel = sel.trim();
          if (!sel) return '';

          // body / html → 替换为 .editor-paper
          if (/^(body|html)(\s|$|\.|#|\[|:|,)/i.test(sel) || /^(body|html)$/i.test(sel)) {
            return sel.replace(/^(body|html)/i, '.editor-paper');
          }

          // :root → .editor-paper
          if (sel.startsWith(':root')) {
            return sel.replace(/^:root/, '.editor-paper');
          }

          // 其他选择器添加前缀
          return `.editor-paper ${sel}`;
        }).filter(Boolean).join(', ');

        if (scopedSelectors) {
          result.push(`${scopedSelectors} {\n  ${declarations}\n}`);
        }
      }

      return result.join('\n');
    };

    return `
    .editor-paper {
      ${sanitizeEditorBodyStyles(presetCss.match(/body\s*{([^}]*)}/)?.[1] || '')}
      width: 100%;
      max-width: none;
      margin: 0;
      padding: 0;
    }
    ${scopeCSS(presetCss)}
    ${scopeCSS(project.customCSS)}
    ${scopeCSS(extraCSS)}

    .editor-paper .ProseMirror {
      outline: none !important;
      min-height: 100%;
      height: 100%;
      caret-color: #3b82f6;
    }

    .editor-paper p.caption {
      text-indent: 0;
      text-align: center;
      font-size: 0.9em;
      color: #6b7280;
      margin-top: -0.5em;
      margin-bottom: 1.5em;
    }

    .editor-paper img {
      cursor: pointer;
      transition: all 0.2s ease-in-out;
      max-width: 100%;
      height: auto;
    }
    .editor-paper img.ProseMirror-selectednode {
      outline: 3px solid rgba(59, 130, 246, 0.8);
      outline-offset: 2px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }

    .editor-paper fy {
      display: none;
      page-break-after: always;
      break-after: page;
    }

    .editor-paper .image-missing {
      display: block;
      width: 100%;
      max-width: 400px;
      min-height: 80px;
      background: #FEF2F2 !important;
      border: 2px dashed #EF4444 !important;
      border-radius: 12px !important;
      position: relative;
      margin: 1.5rem auto;
      cursor: pointer;
      transition: all 0.2s;
    }
    .editor-paper .image-missing:hover {
      background: #FEE2E2 !important;
      transform: scale(1.02);
    }
    .editor-paper .image-missing::before {
      content: '图片已删除: ' attr(data-missing-name);
      display: block;
      padding: 1.75rem 1rem;
      color: #dc2626;
      text-align: center;
      font-size: 0.95rem;
      font-weight: 600;
    }
  `;
  }, [project.activeStyleId, project.customCSS, extraCSS, project.isPresetStyleActive]);

  const chapterTitle = useMemo(() => activeChapter?.title || 'Untitled', [activeChapter]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !editor) return;

    const handleClick = async (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG' && target.classList.contains('image-missing')) {
        e.preventDefault();
        e.stopPropagation();
        if (await dialog.confirm('确认从文章中移除这个失效图片引用吗？')) {
          // 通过 TipTap 事务系统删除节点，而不是直接操作 DOM
          const { state } = editor;
          let nodePos: number | null = null;
          state.doc.descendants((node, pos) => {
            if (nodePos !== null) return false; // 已找到，停止遍历
            if (node.type.name === 'image') {
              // 通过 view.nodeDOM 匹配点击的 DOM 元素
              try {
                const domNode = editor.view.nodeDOM(pos);
                if (domNode === target || (domNode as Element)?.querySelector?.('img') === target) {
                  nodePos = pos;
                  return false;
                }
              } catch { /* ignore */ }
            }
          });

          if (nodePos !== null) {
            const node = state.doc.nodeAt(nodePos);
            if (node) {
              editor.chain().focus().deleteRange({ from: nodePos, to: nodePos + node.nodeSize }).run();
            }
          }
        }
      }
    };

    el.addEventListener('click', handleClick);
    return () => el.removeEventListener('click', handleClick);
  }, [editor]);

  return (
    <div className="flex flex-col h-full bg-[#F9FAFB] relative overflow-hidden min-w-0">
      <EditorToolbar
        editor={editor}
        onMobileBack={onMobileBack}
        handleSplit={handleSplit}
        setShowImageModal={setShowImageModal}
        showFindBar={searchProps.showFindBar}
        setShowFindBar={searchProps.setShowFindBar}
      />

      {searchProps.showFindBar && (
        <FindReplaceBar
          findText={searchProps.findText}
          setFindText={searchProps.setFindText}
          replaceText={searchProps.replaceText}
          setReplaceText={searchProps.setReplaceText}
          matchCase={searchProps.matchCase}
          setMatchCase={searchProps.setMatchCase}
          wholeWord={searchProps.wholeWord}
          setWholeWord={searchProps.setWholeWord}
          matchesCount={searchProps.matches.length}
          currentMatchIndex={searchProps.currentMatchIndex}
          onNavigateNext={() => searchProps.navigateMatch('next')}
          onNavigatePrev={() => searchProps.navigateMatch('prev')}
          onReplace={searchProps.handleReplace}
          onReplaceAll={searchProps.handleReplaceAll}
          onClose={() => searchProps.setShowFindBar(false)}
        />
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto bg-slate-50 p-2 md:p-8 scroll-smooth pb-20">
        <div
          ref={containerRef}
          className="relative mx-auto w-full max-w-[800px] bg-white ring-1 ring-gray-900/5 shadow-xl min-h-[900px] md:min-h-[1100px] p-6 md:p-16 cursor-text transition-all rounded-xl flex flex-col"
          onMouseDown={(e) => {
            if (!editor) return;

            const target = e.target as HTMLElement;
            if (
              target.closest('.ProseMirror') ||
              target.closest('img') ||
              target.closest('a') ||
              target.closest('button') ||
              target.closest('input') ||
              target.closest('textarea')
            ) {
              return;
            }

            e.preventDefault();
            editor.commands.focus('end');
          }}
        >
          <div className="absolute top-4 right-4 md:top-12 md:right-12 text-gray-400 font-serif text-sm md:text-lg opacity-30 select-none pointer-events-none transition-all">
            《{chapterTitle}》
          </div>

          <style>{scopedCSS}</style>

          <div
            className="editor-paper outline-none flex-1 flex flex-col cursor-text relative"
            onMouseDown={(e) => {
              if (!editor) return;
              if (e.target === e.currentTarget) {
                e.preventDefault();
                editor.commands.focus('end');
              }
            }}
          >
            {editor?.isEmpty && (
              <div className="absolute left-0 right-0 top-1 text-gray-300 pointer-events-none select-none text-sm md:text-base leading-7">
                在这里开始写作。支持标题、图注、图片、注音和查找替换。
                <span className="block mt-2 text-xs md:text-sm">快捷键：`Ctrl/Cmd + F` 打开查找，`Shift + Enter` 在查找框中反向跳转。</span>
              </div>
            )}
            <EditorContent editor={editor} className="flex-1 min-h-[600px] md:min-h-[900px]" />
          </div>
        </div>
      </div>

      <div className="flex-none h-10 bg-white border-t border-gray-100 flex items-center justify-center md:justify-between px-4 md:px-6 text-xs text-gray-500 select-none z-20">
        <div className="flex items-center space-x-3 md:space-x-6">
          <span className="flex items-center font-medium text-gray-400">
            <AlignJustify size={14} className="mr-2 text-gray-300 transform rotate-90" />
            {stats.chars} 字
          </span>
          <span className="hidden md:flex items-center font-medium text-gray-400">
            <Clock size={14} className="mr-2 text-gray-300" />
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
