/**
 * EditorPaper - 编辑器纸张容器组件
 *
 * 职责：
 * 1. 渲染编辑器的"纸张"外观
 * 2. 处理图片拖拽上传的视觉反馈
 * 3. 显示章节标题水印
 * 4. 管理作用域 CSS
 */

import React from 'react';
import { EditorContent, Editor } from '@tiptap/react';
import { UseImageUploadReturn } from '../../hooks/useImageUpload';

interface EditorPaperProps {
  /** TipTap 编辑器实例 */
  editor: Editor | null;
  /** 章节标题 */
  chapterTitle: string;
  /** 纸张容器类名 */
  paperClassName: string;
  /** 编辑器内容样式 */
  editorStyle: React.CSSProperties;
  /** 作用域 CSS */
  scopedCSS: string;
  /** 图片上传 Hook 返回值 */
  imageUpload: UseImageUploadReturn;
  /** 容器 ref */
  containerRef: React.RefObject<HTMLDivElement>;
}

/** 带有 caretPositionFromPoint / caretRangeFromPoint 的 Document（跨浏览器声明）。 */
type CaretDocument = Document & {
  caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null;
  caretRangeFromPoint?: (x: number, y: number) => Range | null;
};

/**
 * 用浏览器自身的插入符定位 API 把视口坐标解析成 ProseMirror 文档位置。
 *
 * 为什么不直接用 `view.posAtCoords()`：它在纵向会对块节点做额外判断
 * （`posFromCaret` 里的 outsideBlock 逻辑），当 Y 落在两行之间的行距
 * 空隙、而不是文字行的字身框内时，它会返回**块边界位置**，该位置
 * 没有对应的插入符矩形，用户看到的就是「光标没出现 / 落到别的行」。
 * 浏览器自身的 caret 查询没有这层块语义，它会吸附到最近的一行文字，
 * 与真实鼠标点击落在同一个位置（实测 18/18 与原生点击一致）。
 */
const posFromPoint = (view: Editor['view'], x: number, y: number): number | null => {
  const doc = view.dom.ownerDocument as CaretDocument;

  let node: Node | null = null;
  let offset = 0;

  const position = doc.caretPositionFromPoint?.(x, y);
  if (position) {
    node = position.offsetNode;
    offset = position.offset;
  } else {
    const range = doc.caretRangeFromPoint?.(x, y);
    if (range) {
      node = range.startContainer;
      offset = range.startOffset;
    }
  }
  if (!node) return null;

  // 夹紧偏移，避免元素节点子节点数 / 文本节点长度越界导致 posAtDOM 抛错
  const max =
    node.nodeType === Node.TEXT_NODE
      ? node.nodeValue?.length ?? 0
      : node.childNodes.length;

  try {
    return view.posAtDOM(node, Math.min(offset, max));
  } catch {
    // 命中的 DOM 不在编辑器内（例如水印覆盖层）：交给调用方兜底
    return null;
  }
};

/**
 * 把鼠标点击坐标映射为编辑器内的文档位置并把光标放过去。
 *
 * 之前这里固定调用 `editor.commands.focus('end')`，导致点击页面中
 * 不属于正文的空白区域（例如左侧无文字的边距）时光标被强行移到
 * 全文末尾并滚动到底部（上游 Issue #2）。
 *
 * 注意：只按原始坐标调用 `view.posAtCoords()` 并不够。点击纸张两侧
 * 内边距时 X 落在正文列之外，`posAtCoords()` 会返回 null，于是退回
 * 到 `focus()`；而 Tiptap 的 focus 命令在延迟聚焦时会一并执行
 * `editor.commands.scrollIntoView()`，把视口滚动到**当前选区**。
 * 当前选区通常停在全文末尾，用户看到的就是「点侧边就跳到页尾」。
 *
 * 因此这里做两件事：
 *   1. 把点击的纵向位置映射到正文列内对应那一行（X 夹到正文列内），
 *      让光标落在点击高度对应的那一行上，而不是保留旧光标位置；
 *      左边距落到该行行首，右边距落到该行行尾；
 *   2. 聚焦时关闭 `scrollIntoView`，保持视口不动。
 */
const focusAtPointer = (editor: Editor | null, event: React.MouseEvent) => {
  if (!editor) return;

  const { view } = editor;
  const column = view.dom.getBoundingClientRect();
  const coords = { left: event.clientX, top: event.clientY };

  // 点击高度是否落在正文列纵向范围内；超出（例如正文下方的纸张留白）
  // 则不猜位置，只聚焦并保留选区。
  const insideVertically = coords.top >= column.top && coords.top <= column.bottom;

  let target: number | null = null;

  if (insideVertically) {
    // 两侧内边距或正文内部：忽略列外的 X，把点击高度映射到对应那一行。
    const probeX =
      coords.left < column.left
        ? column.left + 1
        : coords.left > column.right
          ? column.right - 1
          : coords.left;
    target = posFromPoint(view, probeX, coords.top);
  }

  if (target !== null && target >= 0) {
    // scrollIntoView:false —— 设置选区并聚焦，但不滚动视口
    editor.chain().focus(target, { scrollIntoView: false }).run();
    return;
  }

  // 点击处没有可定位的文本：仅聚焦、保留当前选区，且不滚到底部
  editor.commands.focus(null, { scrollIntoView: false });
};

const EditorPaper: React.FC<EditorPaperProps> = ({
  editor,
  chapterTitle,
  paperClassName,
  editorStyle,
  scopedCSS,
  imageUpload,
  containerRef,
}) => {
  return (
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
        focusAtPointer(editor, e);
      }}
    >
      {/* 拖拽图片提示覆盖层 */}
      {imageUpload.isDragging && <DragOverlay />}

      {/* 图片上传错误提示 */}
      {imageUpload.error && (
        <ErrorNotification error={imageUpload.error} onClose={imageUpload.clearError} />
      )}

      {/* 图片处理中提示 */}
      {imageUpload.isProcessing && <ProcessingNotification />}

      {/* 章节标题水印（桌面端显示）*/}
      <div className="hidden md:block absolute top-4 right-4 lg:top-12 lg:right-12 text-gray-400 font-serif text-sm lg:text-lg opacity-30 select-none pointer-events-none transition-all">
        《{chapterTitle}》
      </div>

      {/* 作用域 CSS */}
      <style>{scopedCSS}</style>

      {/* 编辑器内容 */}
      <div
        className="editor-paper outline-none flex-1 flex flex-col cursor-text relative"
        onMouseDown={(e) => {
          if (!editor) return;
          if (e.target === e.currentTarget) {
            e.preventDefault();
            focusAtPointer(editor, e);
          }
        }}
      >
        {/* 空内容提示 */}
        {editor?.isEmpty && <EmptyPlaceholder />}

        <EditorContent editor={editor} className="flex-1 min-h-[400px] md:min-h-[600px] lg:min-h-[800px]" />
      </div>
    </div>
  );
};

// ─── 子组件 ───

/** 拖拽覆盖层 */
const DragOverlay: React.FC = () => (
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
);

/** 错误通知 */
const ErrorNotification: React.FC<{ error: string; onClose: () => void }> = ({ error, onClose }) => (
  <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-lg animate-in slide-in-from-top duration-300">
    <div className="flex items-center gap-2">
      <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
      <span className="text-sm font-medium">{error}</span>
      <button
        onClick={onClose}
        className="ml-2 text-red-600 hover:text-red-800 font-bold"
      >
        ✕
      </button>
    </div>
  </div>
);

/** 处理中通知 */
const ProcessingNotification: React.FC = () => (
  <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg shadow-lg animate-in slide-in-from-top duration-300">
    <div className="flex items-center gap-2">
      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span className="text-sm font-medium">正在处理图片...</span>
    </div>
  </div>
);

/** 空内容占位符 */
const EmptyPlaceholder: React.FC = () => (
  <div className="absolute left-0 right-0 top-1 text-gray-300 pointer-events-none select-none opacity-50">
    <p className="text-base md:text-lg leading-relaxed mb-3 opacity-70">
      ✨ 在这里开始写作
    </p>
    <div className="text-xs md:text-sm space-y-1 text-gray-400 opacity-60">
      <p>💡 <strong>拖拽图片</strong>到编辑器即可插入</p>
      <p>⌨️ <strong>Ctrl/Cmd + F</strong> 查找文字</p>
      <p>🔤 <strong>Ctrl/Cmd + +/-</strong> 调整字体大小</p>
    </div>
  </div>
);

export default EditorPaper;

// ─── 类型导出 ───
export type { EditorPaperProps };
