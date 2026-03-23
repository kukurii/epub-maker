import { useCallback } from 'react';
import { dialog } from '../../services/dialog';
import { ImageAsset, ProjectData } from '../../types';
import { editorHTMLToContent } from './utils';

export const useEditorCommands = (
  editorRef: React.RefObject<HTMLDivElement>,
  project: ProjectData,
  flushUpdates: () => void,
  onSplitChapter: (beforeContent: string, afterContent: string) => void
) => {

  const execCmd = useCallback((command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    flushUpdates();
  }, [editorRef, flushUpdates]);

  const getContainingBlock = useCallback((): HTMLElement | null => {
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
  }, [editorRef]);

  const toggleBlock = useCallback((tag: 'H1' | 'H2') => {
    const currentBlock = getContainingBlock();
    if (currentBlock && currentBlock.tagName === tag) {
      execCmd('formatBlock', 'P');
    } else {
      execCmd('formatBlock', 'H1' === tag ? 'H1' : 'H2');
    }
  }, [execCmd, getContainingBlock]);

  const toggleBlockquote = useCallback(() => {
    const currentBlock = getContainingBlock();
    if (currentBlock && currentBlock.tagName === 'BLOCKQUOTE') {
      execCmd('formatBlock', 'P');
    } else {
      execCmd('formatBlock', 'BLOCKQUOTE');
    }
  }, [execCmd, getContainingBlock]);

  const toggleCaption = useCallback(() => {
    let currentBlock = getContainingBlock();
    if (!currentBlock) return;

    if (['H1', 'H2', 'BLOCKQUOTE'].includes(currentBlock.tagName)) {
      execCmd('formatBlock', 'P');
      currentBlock = getContainingBlock();
    }

    if (currentBlock) {
      currentBlock.classList.toggle('caption');
      flushUpdates();
    }
  }, [execCmd, getContainingBlock, flushUpdates]);

  const insertImage = useCallback((img: ImageAsset, closeImageModal: () => void) => {
    const html = `<img src="${img.data}" data-id="${img.id}" data-filename="${img.name}" alt="${img.name}" /><fy></fy>`;
    editorRef.current?.focus();
    execCmd('insertHTML', html);
    closeImageModal();
  }, [editorRef, execCmd]);

  const handleSplit = useCallback(async () => {
    // Ensure IDs exist on content before splitting, as splitting logic depends on them for TOC
    flushUpdates();

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !editorRef.current) {
      await dialog.alert("请先点击编辑器内容，将光标放在要切分的位置。");
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
  }, [editorRef, flushUpdates, onSplitChapter, project.images]);

  return {
    execCmd,
    toggleBlock,
    toggleBlockquote,
    toggleCaption,
    insertImage,
    handleSplit
  };
};
