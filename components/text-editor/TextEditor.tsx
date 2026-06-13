/**
 * TextEditor - 文本编辑器主组件
 *
 * 核心改进：
 * 1. 使用 useEditorContent hook 管理内容同步，解决闭包过期问题
 * 2. 使用改进的 useEditorSearch hook，替换后自动重新计算匹配
 * 3. CSS 作用域逻辑提取为独立函数，更易维护
 */

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { AlignJustify, Clock } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { CustomImage } from './extensions/CustomImage';
import LinkExtension from '@tiptap/extension-link';
import TextAlignExtension from '@tiptap/extension-text-align';
import UnderlineExtension from '@tiptap/extension-underline';

import { RubyMark } from './extensions/RubyMark';
import { CustomHeading } from './extensions/CustomHeading';
import { CustomHorizontalRule } from './extensions/CustomHorizontalRule';
import { SearchHighlight } from './extensions/SearchHighlight';
import { MarkdownShortcuts } from './extensions/MarkdownShortcuts';

import { ProjectData, TocItem, ImageAsset } from '../../types';
import EditorToolbar from './EditorToolbar';
import FindReplaceBar from './FindReplaceBar';
import ImagePicker from './ImagePicker';
import { dialog } from '../../services/dialog';
import { contentToEditorHTML, editorHTMLToContent } from './editorHelpers';
import { useEditorContent } from './useEditorContent';
import { useEditorSearch } from './useEditorSearch';
import { useImageUpload } from '../../hooks/useImageUpload';
import { PRESET_STYLES } from '../../themes';

interface TextEditorProps {
  content: string;
  onContentChange: (newContent: string, title?: string, subItems?: TocItem[]) => void;
  onSplitChapter: (beforeContent: string, afterContent: string) => void;
  project: ProjectData;
  onUpdateProject: (updates: Partial<ProjectData>) => void; // 🎯 添加这个，用于更新图片
  focusRequest?: {
    anchorId?: string | null;
    searchText?: string | null;
    imageId?: string | null;
    key: number;
  } | null;
  onMobileBack?: () => void;
  activeChapter?: { title: string };
}

const TextEditor: React.FC<TextEditorProps> = ({
  content,
  onContentChange,
  onSplitChapter,
  project,
  onUpdateProject,
  focusRequest,
  activeChapter,
  onMobileBack,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [stats, setStats] = useState({ chars: 0, time: 0 });

  // ─── 图片上传 Hook ───
  const imageUpload = useImageUpload({
    images: project.images, // 🔧 修复：传入当前图片列表用于生成正确的ID
    onUpload: (image) => {
      // 添加到项目图片库
      const newImages = [...project.images, image];
      onUpdateProject({ images: newImages });

      // 自动插入到编辑器当前光标位置
      if (editor) {
        editor.chain().focus().setImage({
          src: image.data,
          alt: image.name,
          title: image.id,
          'data-id': image.id,
          'data-filename': image.name,
        } as any).run();
      }
    },
  });

  // ─── 初始化 TipTap 编辑器 ───
  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({ heading: false, horizontalRule: false }),
        CustomHeading.configure({ levels: [1, 2], HTMLAttributes: { class: 'heading' } }),
        CustomHorizontalRule,
        CustomImage.configure({ inline: false, HTMLAttributes: { class: 'editor-image' } }),
        LinkExtension.configure({ openOnClick: false, autolink: true }),
        UnderlineExtension,
        TextAlignExtension.configure({ types: ['heading', 'paragraph'] }),
        RubyMark,
        SearchHighlight,
        MarkdownShortcuts, // 🎯 Markdown 快捷输入
      ],
      content: contentToEditorHTML(content, project.images),
      editorProps: {
        attributes: {
          class: 'outline-none flex-1',
          spellcheck: 'false',
        },
      },
    },
    [], // 空依赖 = 只初始化一次（通过 key={chapterId} 重建）
  );

  // ─── 内容同步 Hook ───
  useEditorContent({
    editor,
    onContentChange,
    images: project.images,
    chapterTitle: activeChapter?.title,
    containerRef,
    onStatsUpdate: setStats,
  });

  // ─── 搜索 Hook ───
  const search = useEditorSearch(editor, scrollRef);

  // ─── 快捷键处理 ───
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMeta = event.ctrlKey || event.metaKey;

      if (isMeta && event.key.toLowerCase() === 'f') {
        event.preventDefault();
        search.setShowFindBar(true);
        return;
      }
      if (isMeta && event.shiftKey && event.key.toLowerCase() === 'h') {
        event.preventDefault();
        search.setShowFindBar(true);
        return;
      }
      if (event.key === 'Escape' && search.showFindBar) {
        event.preventDefault();
        search.setShowFindBar(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [search.setShowFindBar, search.showFindBar]);

  // ─── 粘贴图片处理 ───
  useEffect(() => {
    window.addEventListener('paste', imageUpload.handlePaste);
    return () => window.removeEventListener('paste', imageUpload.handlePaste);
  }, [imageUpload.handlePaste]);

  // ─── 外部跳转：锚点 ───
  useEffect(() => {
    if (!focusRequest?.anchorId || !containerRef.current) return;

    const element = containerRef.current.querySelector(`#${focusRequest.anchorId}`);
    if (!element) return;

    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    element.classList.add('bg-yellow-100', 'transition-colors', 'duration-1000');
    setTimeout(() => element.classList.remove('bg-yellow-100'), 1500);
  }, [focusRequest?.anchorId, focusRequest?.key]);

  // ─── 外部跳转：图片引用 ───
  useEffect(() => {
    if (!focusRequest?.imageId || !containerRef.current) return;

    const element = containerRef.current.querySelector(`img[data-id="${focusRequest.imageId}"]`);
    if (!element) return;

    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    element.classList.add('ring-4', 'ring-amber-300', 'transition-all', 'duration-1000');
    setTimeout(() => element.classList.remove('ring-4', 'ring-amber-300'), 1500);
  }, [focusRequest?.imageId, focusRequest?.key]);

  // ─── 外部跳转：搜索文本 ───
  useEffect(() => {
    if (!focusRequest?.searchText || !editor) return;

    search.setShowFindBar(true);
    search.setFindText(focusRequest.searchText);
  }, [editor, focusRequest?.key, focusRequest?.searchText, search.setShowFindBar, search.setFindText]);

  // ─── 插入图片 ───
  const insertImage = useCallback(
    (img: ImageAsset) => {
      if (!editor) return;
      editor
        .chain()
        .focus()
        .setImage({
          src: img.data, // 🎯 使用 base64 数据，不是路径
          alt: img.name,
          title: img.id,
          // 同时写入 data-id 和 data-filename，确保保存时能正确匹配图片
          'data-id': img.id,
          'data-filename': img.name,
        } as any)
        .run();
      setShowImagePicker(false);
    },
    [editor],
  );

  // ─── 拆分章节 ───
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

  // ─── 失效图片点击删除 ───
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !editor) return;

    const handleClick = async (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG' && target.classList.contains('image-missing')) {
        e.preventDefault();
        e.stopPropagation();
        if (await dialog.confirm('确认从文章中移除这个失效图片引用吗？')) {
          const { state } = editor;
          let nodePos: number | null = null;

          state.doc.descendants((node, pos) => {
            if (nodePos !== null) return false;
            if (node.type.name === 'image') {
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

  // ─── CSS 作用域 ───
  const extraCSS = project.extraFiles
    ?.filter((f) => f.type === 'css' && f.isActive !== false)
    .map((f) => f.content)
    .join('\n') || '';

  const scopedCSS = useMemo(() => {
    const activeStyle = PRESET_STYLES.find((s) => s.id === project.activeStyleId) || PRESET_STYLES[0];
    const presetCss = project.isPresetStyleActive !== false ? activeStyle.css : 'body {}';

    return buildScopedCSS(presetCss, project.customCSS, extraCSS);
  }, [project.activeStyleId, project.customCSS, project.isPresetStyleActive, extraCSS]);

  const chapterTitle = useMemo(() => activeChapter?.title || 'Untitled', [activeChapter]);

  // ─── 渲染 ───
  return (
    <div className="flex flex-col h-full bg-[#F9FAFB] relative overflow-hidden min-w-0">
      {/* 工具栏 */}
      <EditorToolbar
        editor={editor}
        onMobileBack={onMobileBack}
        onSplit={handleSplit}
        onOpenImagePicker={() => setShowImagePicker(true)}
        showFindBar={search.showFindBar}
        onToggleFindBar={search.setShowFindBar}
      />

      {/* 查找替换栏 */}
      {search.showFindBar && (
        <FindReplaceBar
          findText={search.findText}
          setFindText={search.setFindText}
          replaceText={search.replaceText}
          setReplaceText={search.setReplaceText}
          matchCase={search.matchCase}
          setMatchCase={search.setMatchCase}
          wholeWord={search.wholeWord}
          setWholeWord={search.setWholeWord}
          matchesCount={search.matches.length}
          currentMatchIndex={search.currentMatchIndex}
          onNavigateNext={() => search.navigateMatch('next')}
          onNavigatePrev={() => search.navigateMatch('prev')}
          onReplace={search.handleReplace}
          onReplaceAll={search.handleReplaceAll}
          onClose={() => search.setShowFindBar(false)}
        />
      )}

      {/* 编辑器正文区 */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto bg-slate-50 p-2 md:p-8 scroll-smooth pb-20">
        <div
          ref={containerRef}
          className="relative mx-auto w-full max-w-[800px] bg-white ring-1 ring-gray-900/5 shadow-xl
            min-h-[900px] md:min-h-[1100px] p-6 md:p-16 cursor-text transition-all rounded-xl flex flex-col"
          onDragEnter={imageUpload.handleDragEnter}
          onDragLeave={imageUpload.handleDragLeave}
          onDragOver={imageUpload.handleDragOver}
          onDrop={imageUpload.handleDrop}
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
          {/* 章节标题水印 */}
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
            {/* 空内容提示 */}
            {editor?.isEmpty && (
              <div className="absolute left-0 right-0 top-1 text-gray-300 pointer-events-none select-none text-sm md:text-base leading-7">
                在这里开始写作。支持标题、图注、图片、注音和查找替换。
                <span className="block mt-2 text-xs md:text-sm">
                  快捷键：`Ctrl/Cmd + F` 打开查找，`Shift + Enter` 在查找框中反向跳转。
                </span>
              </div>
            )}
            <EditorContent editor={editor} className="flex-1 min-h-[600px] md:min-h-[900px]" />
          </div>
        </div>
      </div>

      {/* 底部状态栏 */}
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

      {/* 图片选择弹窗 */}
      {showImagePicker && (
        <ImagePicker
          images={project.images}
          onInsert={insertImage}
          onClose={() => setShowImagePicker(false)}
        />
      )}
    </div>
  );
};

// ─── CSS 作用域工具函数 ───

/**
 * 构建编辑器作用域 CSS
 * 将主题 CSS 的选择器限定在 .editor-paper 内，避免影响全局
 */
function buildScopedCSS(presetCss: string, customCSS: string, extraCSS: string): string {
  const bodyStyles = extractBodyStyles(presetCss);

  return `
    .editor-paper {
      ${sanitizeBodyStyles(bodyStyles)}
      width: 100%;
      max-width: none;
      margin: 0;
      padding: 0;
    }
    ${scopeCSS(presetCss)}
    ${scopeCSS(customCSS)}
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
      display: inline-block;
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      /* SVG占位符会显示文字，不需要::before伪元素 */
    }
    .editor-paper .image-missing:hover {
      opacity: 0.8;
      transform: scale(1.02);
    }
  `;
}

/** 从 CSS 中提取 body {} 块的样式 */
function extractBodyStyles(css: string): string {
  const match = css.match(/body\s*\{([^}]*)\}/);
  return match?.[1] || '';
}

/** 过滤掉布局相关的样式属性 */
function sanitizeBodyStyles(styles: string): string {
  const blockedProps = new Set([
    'width', 'min-width', 'max-width',
    'height', 'min-height', 'max-height',
    'margin', 'margin-left', 'margin-right', 'margin-top', 'margin-bottom',
    'padding', 'padding-left', 'padding-right', 'padding-top', 'padding-bottom',
    'overflow', 'overflow-x', 'overflow-y',
    'position', 'left', 'right', 'top', 'bottom', 'display',
  ]);

  return styles
    .split(';')
    .map((rule) => rule.trim())
    .filter(Boolean)
    .filter((rule) => {
      const colonIndex = rule.indexOf(':');
      if (colonIndex === -1) return false;
      const property = rule.slice(0, colonIndex).trim().toLowerCase();
      return !blockedProps.has(property);
    })
    .join(';\n      ');
}

/**
 * CSS 作用域函数
 * 将选择器限定在 .editor-paper 内
 */
function scopeCSS(css: string): string {
  if (!css) return '';

  // 去掉注释
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const result: string[] = [];
  let i = 0;

  while (i < stripped.length) {
    // 跳过空白
    while (i < stripped.length && /\s/.test(stripped[i])) i++;
    if (i >= stripped.length) break;

    // @规则
    if (stripped[i] === '@') {
      const atStart = i;
      while (i < stripped.length && stripped[i] !== '{' && stripped[i] !== ';') i++;
      const atHeader = stripped.slice(atStart, i).trim();

      if (i < stripped.length && stripped[i] === ';') {
        result.push(atHeader + ';');
        i++;
        continue;
      }

      if (i < stripped.length && stripped[i] === '{') {
        i++;
        let depth = 1;
        const blockStart = i;
        while (i < stripped.length && depth > 0) {
          if (stripped[i] === '{') depth++;
          else if (stripped[i] === '}') depth--;
          if (depth > 0) i++;
        }
        const blockContent = stripped.slice(blockStart, i);
        i++;

        if (/^@(media|supports|layer)/i.test(atHeader)) {
          result.push(`${atHeader} {\n${scopeCSS(blockContent)}\n}`);
        } else {
          result.push(`${atHeader} {${blockContent}}`);
        }
        continue;
      }
    }

    // 普通规则
    const ruleStart = i;
    while (i < stripped.length && stripped[i] !== '{') i++;
    if (i >= stripped.length) break;

    const rawSelector = stripped.slice(ruleStart, i).trim();
    i++;

    let depth = 1;
    const declStart = i;
    while (i < stripped.length && depth > 0) {
      if (stripped[i] === '{') depth++;
      else if (stripped[i] === '}') depth--;
      if (depth > 0) i++;
    }
    const declarations = stripped.slice(declStart, i).trim();
    i++;

    if (!rawSelector) continue;

    // 处理选择器
    const scopedSelectors = rawSelector
      .split(',')
      .map((sel) => {
        sel = sel.trim();
        if (!sel) return '';

        if (/^(body|html)(\s|$|\.|#|\[|:|,)/i.test(sel) || /^(body|html)$/i.test(sel)) {
          return sel.replace(/^(body|html)/i, '.editor-paper');
        }
        if (sel.startsWith(':root')) {
          return sel.replace(/^:root/, '.editor-paper');
        }
        return `.editor-paper ${sel}`;
      })
      .filter(Boolean)
      .join(', ');

    if (scopedSelectors) {
      result.push(`${scopedSelectors} {\n  ${declarations}\n}`);
    }
  }

  return result.join('\n');
}

export default TextEditor;
