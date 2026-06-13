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
        editor.commands.focus('end');
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
            editor.commands.focus('end');
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
);

export default EditorPaper;

// ─── 类型导出 ───
export type { EditorPaperProps };
