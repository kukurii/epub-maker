/**
 * useEditorContent - 编辑器内容同步 Hook
 *
 * 核心改进：
 * 1. 编辑器 onUpdate 回调通过 ref 保持最新，避免闭包过期
 * 2. 标题和 subItems 从编辑器 DOM 中实时提取
 * 3. 提供 syncContentFromOutside() 方法，允许外部推送 content 变化
 */

import { useCallback, useEffect, useRef } from 'react';
import type { Editor } from '@tiptap/react';
import { TocItem, ImageAsset } from '../../types';
import {
  editorHTMLToContent,
  extractChapterTitleFromDOM,
  extractSubItemsFromDOM,
  calculateReadStats,
} from './editorHelpers';

interface ContentChangeCallback {
  (newContent: string, title?: string, subItems?: TocItem[]): void;
}

interface UseEditorContentOptions {
  /** TipTap 编辑器实例 */
  editor: Editor | null;
  /** 内容变更回调 */
  onContentChange: ContentChangeCallback;
  /** 图片资源列表 */
  images: ImageAsset[];
  /** 当前章节标题（作为 fallback） */
  chapterTitle?: string;
  /** 编辑器容器 ref */
  containerRef: React.RefObject<HTMLElement | null>;
  /** 统计数据回调 */
  onStatsUpdate?: (stats: { chars: number; time: number }) => void;
}

/**
 * 管理编辑器内容的双向同步
 *
 * - 编辑器内容变化 → 通过 onContentChange 通知外部
 * - 外部内容变化 → 通过返回的 setContent 方法更新编辑器
 */
export const useEditorContent = ({
  editor,
  onContentChange,
  images,
  chapterTitle,
  containerRef,
  onStatsUpdate,
}: UseEditorContentOptions) => {
  // 用 ref 保存最新的回调和数据，避免闭包过期
  const onContentChangeRef = useRef(onContentChange);
  const imagesRef = useRef(images);
  const chapterTitleRef = useRef(chapterTitle);

  useEffect(() => {
    onContentChangeRef.current = onContentChange;
  }, [onContentChange]);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    chapterTitleRef.current = chapterTitle;
  }, [chapterTitle]);

  // 监听编辑器更新事件
  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      const editorHTML = editor.getHTML();
      const storedContent = editorHTMLToContent(editorHTML, imagesRef.current);

      // 更新统计
      onStatsUpdate?.(calculateReadStats(editor.getText()));

      // 从编辑器 DOM 中提取标题和子项
      const proseMirrorEl = containerRef.current?.querySelector('.ProseMirror') as HTMLElement | null;
      let newTitle = chapterTitleRef.current;
      let subItems: TocItem[] = [];

      if (proseMirrorEl) {
        newTitle = extractChapterTitleFromDOM(proseMirrorEl, chapterTitleRef.current);
        subItems = extractSubItemsFromDOM(proseMirrorEl);
      }

      onContentChangeRef.current(storedContent, newTitle, subItems);
    };

    editor.on('update', handleUpdate);
    return () => {
      editor.off('update', handleUpdate);
    };
  }, [editor, containerRef, onStatsUpdate]);

  // 初始化统计
  useEffect(() => {
    if (!editor) return;
    onStatsUpdate?.(calculateReadStats(editor.getText()));
  }, [editor, onStatsUpdate]);

  /**
   * 从外部设置编辑器内容
   * 使用场景：目录中修改标题后，需要同步更新编辑器
   */
  const setContent = useCallback(
    (html: string) => {
      if (!editor) return;
      // 只在内容确实不同时才更新，避免不必要的重渲染
      const currentHTML = editor.getHTML();
      if (currentHTML !== html) {
        editor.commands.setContent(html, { emitUpdate: false }); // 不触发 onUpdate
      }
    },
    [editor],
  );

  return { setContent };
};
