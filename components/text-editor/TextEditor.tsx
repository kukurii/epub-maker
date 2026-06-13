/**
 * TextEditor - 文本编辑器主组件（重构版）
 *
 * 改进：
 * 1. 使用 useEditorContent hook 管理内容同步
 * 2. 使用 useEditorSearch hook 管理查找替换
 * 3. 使用 useEditorSettings hook 管理编辑器设置（字体大小等）
 * 4. CSS 作用域逻辑提取到独立工具函数
 * 5. 状态栏独立为组件，代码更清晰
 * 6. 响应式布局优化，适配不同屏幕尺寸
 */

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
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
import EditorStatusBar from './EditorStatusBar';
import FindReplaceBar from './FindReplaceBar';
import ImagePicker from './ImagePicker';
import { dialog } from '../../services/dialog';
import { contentToEditorHTML, editorHTMLToContent } from './editorHelpers';
import { useEditorContent } from './useEditorContent';
import { useEditorSearch } from './useEditorSearch';
import { useImageUpload } from '../../hooks/useImageUpload';
import { useEditorSettings } from '../../hooks/useEditorSettings';
import { buildScopedCSS } from '../../utils/cssScoper';
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

  // ─── 编辑器设置（字体大小等）───
  const editorSettings = useEditorSettings();

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

  // ─── 图片列表变化时更新编辑器 ───
  useEffect(() => {
    if (!editor || !content) return;

    // 当图片列表变化时，重新加载编辑器内容
    const newHTML = contentToEditorHTML(content, project.images);
    const currentHTML = editor.getHTML();

    // 只在内容实际不同时才更新（避免无限循环）
    if (newHTML !== currentHTML) {
      console.log('🔄 图片列表变化，重新加载编辑器内容');
      editor.commands.setContent(newHTML, { emitUpdate: false });
    }
  }, [editor, content, project.images]);

  // ─── 搜索 Hook ───
  const search = useEditorSearch(editor, scrollRef);

  // ─── 快捷键处理 ───
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMeta = event.ctrlKey || event.metaKey;

      // 查找功能
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

      // 字体大小快捷键
      if (isMeta && event.key === '=' || isMeta && event.key === '+') {
        event.preventDefault();
        editorSettings.increaseFontSize();
        return;
      }
      if (isMeta && event.key === '-') {
        event.preventDefault();
        editorSettings.decreaseFontSize();
        return;
      }
      if (isMeta && event.key === '0') {
        event.preventDefault();
        editorSettings.setFontSize('base');
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [search.setShowFindBar, search.showFindBar, editorSettings]);

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

  // ─── CSS 作用域（使用独立工具函数）───
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

  // ─── 获取响应式编辑器纸张类名 ───
  const paperClassName = useMemo(() => {
    // 根据字体大小动态调整纸张最大宽度
    const fontSizeValue = editorSettings.getFontSizeValue();
    const maxWidthClass =
      fontSizeValue <= 14 ? 'max-w-[680px] md:max-w-[760px] lg:max-w-[800px]' :
      fontSizeValue <= 16 ? 'max-w-[720px] md:max-w-[800px] lg:max-w-[840px]' :
      fontSizeValue <= 18 ? 'max-w-[760px] md:max-w-[840px] lg:max-w-[880px]' :
      'max-w-[800px] md:max-w-[880px] lg:max-w-[920px]';

    return `relative mx-auto w-full ${maxWidthClass} bg-white ring-1 ring-gray-900/5 shadow-xl
      min-h-screen p-4 md:p-8 lg:p-12 xl:p-16 cursor-text transition-all rounded-xl flex flex-col`;
  }, [editorSettings]);

  // ─── 编辑器内容样式（根据字体设置）───
  const editorStyle = useMemo(() => ({
    fontSize: `${editorSettings.getFontSizeValue()}px`,
    lineHeight: editorSettings.lineHeight,
  }), [editorSettings]);

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
      <div ref={scrollRef} className="flex-1 overflow-y-auto bg-slate-50 p-2 md:p-4 lg:p-8 scroll-smooth">
        <div
          ref={containerRef}
          className={paperClassName}
          style={editorStyle}
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
          {/* 拖拽图片提示覆盖层 */}
          {imageUpload.isDragging && (
            <div className="absolute inset-0 z-50 bg-blue-500/10 backdrop-blur-sm border-4 border-dashed border-blue-500 rounded-xl flex items-center justify-center pointer-events-none animate-in fade-in duration-200">
              <div className="bg-white/95 backdrop-blur-md px-8 py-6 rounded-2xl shadow-2xl text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-lg font-semibold text-gray-900 mb-1">释放以插入图片</p>
                <p className="text-sm text-gray-500">支持 JPG、PNG、GIF、WebP、SVG</p>
              </div>
            </div>
          )}

          {/* 图片上传错误提示 */}
          {imageUpload.error && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-lg animate-in slide-in-from-top duration-300">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">{imageUpload.error}</span>
                <button
                  onClick={imageUpload.clearError}
                  className="ml-2 text-red-600 hover:text-red-800 font-bold"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* 图片处理中提示 */}
          {imageUpload.isProcessing && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg shadow-lg animate-in slide-in-from-top duration-300">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm font-medium">正在处理图片...</span>
              </div>
            </div>
          )}

          {/* 章节标题水印（桌面端显示）*/}
          <div className="hidden md:block absolute top-4 right-4 lg:top-12 lg:right-12 text-gray-400 font-serif text-sm lg:text-lg opacity-30 select-none pointer-events-none transition-all">
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
              <div className="absolute left-0 right-0 top-1 text-gray-300 pointer-events-none select-none">
                <p className="text-base md:text-lg leading-relaxed mb-3">
                  ✨ 在这里开始写作
                </p>
                <div className="text-xs md:text-sm space-y-1 text-gray-400">
                  <p>💡 <strong>拖拽图片</strong>到编辑器即可插入</p>
                  <p>⌨️ <strong>Ctrl/Cmd + F</strong> 查找文字</p>
                  <p>🔤 <strong>Ctrl/Cmd + +/-</strong> 调整字体大小</p>
                </div>
              </div>
            )}
            <EditorContent editor={editor} className="flex-1 min-h-[400px] md:min-h-[600px] lg:min-h-[800px]" />
          </div>
        </div>
      </div>

      {/* 底部状态栏（使用独立组件）*/}
      <EditorStatusBar
        charCount={stats.chars}
        readingTime={stats.time}
        fontSize={editorSettings.fontSize}
        onIncreaseFontSize={editorSettings.increaseFontSize}
        onDecreaseFontSize={editorSettings.decreaseFontSize}
        canIncrease={editorSettings.fontSize !== 'large'}
        canDecrease={editorSettings.fontSize !== 'small'}
      />

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

export default TextEditor;
