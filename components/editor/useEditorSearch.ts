import { useState, useCallback, useEffect, useMemo, RefObject } from 'react';
import type { Editor } from '@tiptap/react';

interface SearchMatch {
  from: number;
  to: number;
}

interface TextSegment {
  text: string;
  startIndex: number;
  endIndex: number;
  from: number;
}

const WORD_CHAR_REGEX = /[\w\u00C0-\u024F\u4E00-\u9FFF]/;

const collectTextSegments = (editor: Editor): { fullText: string; segments: TextSegment[] } => {
  const segments: TextSegment[] = [];
  let fullText = '';

  editor.state.doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return;

    const startIndex = fullText.length;
    fullText += node.text;
    segments.push({
      text: node.text,
      startIndex,
      endIndex: fullText.length,
      from: pos,
    });
  });

  return { fullText, segments };
};

const resolveDocPosition = (segments: TextSegment[], index: number) => {
  const segment = segments.find(item => index >= item.startIndex && index < item.endIndex);
  if (!segment) return null;
  return segment.from + (index - segment.startIndex);
};

const buildSearchMatches = (
  editor: Editor,
  findText: string,
  matchCase: boolean,
  wholeWord: boolean,
): SearchMatch[] => {
  if (!findText) return [];

  const { fullText, segments } = collectTextSegments(editor);
  if (!fullText) return [];

  const source = matchCase ? fullText : fullText.toLowerCase();
  const pattern = matchCase ? findText : findText.toLowerCase();
  const matches: SearchMatch[] = [];

  let startIndex = 0;
  while ((startIndex = source.indexOf(pattern, startIndex)) > -1) {
    const endIndex = startIndex + pattern.length;

    if (wholeWord) {
      const prevChar = startIndex > 0 ? source[startIndex - 1] : ' ';
      const nextChar = endIndex < source.length ? source[endIndex] : ' ';
      if (WORD_CHAR_REGEX.test(prevChar) || WORD_CHAR_REGEX.test(nextChar)) {
        startIndex += 1;
        continue;
      }
    }

    const from = resolveDocPosition(segments, startIndex);
    const inclusiveEnd = resolveDocPosition(segments, endIndex - 1);
    if (from !== null && inclusiveEnd !== null) {
      matches.push({ from, to: inclusiveEnd + 1 });
    }

    startIndex += 1;
  }

  return matches;
};

/**
 * 将编辑器中某个文档位置滚动到外层滚动容器的可视区域中央。
 *
 * 原因：TipTap 的 scrollIntoView() 命令只能控制 ProseMirror 自身内部的
 * scrollable 容器，但本项目的外层滚动区是 Editor.tsx 里的 overflow-y-auto
 * div（scrollRef）。需要用 view.coordsAtPos() 取到目标文字的屏幕坐标，
 * 再换算成滚动容器的 scrollTop 来实现真正的跳转。
 */
const scrollMatchIntoView = (
  editor: Editor,
  match: SearchMatch,
  scrollContainer: HTMLElement,
) => {
  try {
    const { view } = editor;
    // 取匹配范围起始位置的屏幕坐标（相对于视口）
    const coords = view.coordsAtPos(match.from);
    // 计算相对于滚动容器顶部的偏移量
    const containerRect = scrollContainer.getBoundingClientRect();
    const relativeTop = coords.top - containerRect.top + scrollContainer.scrollTop;
    // 将目标滚动到容器可视区的中央
    const targetScrollTop = relativeTop - scrollContainer.clientHeight / 2;
    scrollContainer.scrollTo({ top: Math.max(0, targetScrollTop), behavior: 'smooth' });
  } catch {
    // 如果坐标计算失败（例如文档还未渲染完全），降级到 TipTap 内置方法
    editor.chain().setTextSelection(match).scrollIntoView().run();
  }
};

/**
 * useEditorSearch - 编辑器搜索与替换逻辑 hook
 * @param editor    TipTap 编辑器实例
 * @param contentDeps 内容依赖字符串，用于在内容变化时重新计算匹配项
 * @param scrollRef 外层可滚动容器的 ref，用于实现真正的滚动跳转
 */
export const useEditorSearch = (
  editor: Editor | null,
  contentDeps: string,
  scrollRef?: RefObject<HTMLElement | null>,
) => {
  const [showFindBar, setShowFindBar] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);
  const [matchCase, setMatchCase] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);

  const matches = useMemo(
    () => (editor && showFindBar ? buildSearchMatches(editor, findText, matchCase, wholeWord) : []),
    [editor, findText, showFindBar, matchCase, wholeWord, contentDeps],
  );

  // 当搜索词或匹配总数变化时，重置/调整当前索引
  useEffect(() => {
    if (!findText || matches.length === 0) {
      setCurrentMatchIndex(-1);
      return;
    }

    setCurrentMatchIndex(prev => {
      if (prev < 0) return 0;
      return Math.min(prev, matches.length - 1);
    });
  }, [findText, matches.length]);

  // 当前索引变化时，先选中文字，再滚动到可视区
  useEffect(() => {
    if (!editor || currentMatchIndex < 0 || currentMatchIndex >= matches.length) return;

    const active = matches[currentMatchIndex];
    // 先设置选区（高亮选中）
    editor.chain().setTextSelection(active).run();

    // 再滚动：优先使用外层容器，否则降级到 TipTap 内置
    const container = scrollRef?.current;
    if (container) {
      scrollMatchIntoView(editor, active, container);
    } else {
      editor.commands.scrollIntoView();
    }
  }, [editor, currentMatchIndex]); // 注意：只依赖 index，避免 matches 引用变化导致重复触发

  const navigateMatch = useCallback((direction: 'next' | 'prev') => {
    if (matches.length === 0) return;

    setCurrentMatchIndex(prev => {
      if (prev < 0) return 0;
      return direction === 'next'
        ? (prev + 1) % matches.length
        : (prev - 1 + matches.length) % matches.length;
    });
  }, [matches.length]);

  const handleReplace = useCallback(() => {
    if (!editor || currentMatchIndex < 0 || currentMatchIndex >= matches.length) return;

    const active = matches[currentMatchIndex];
    editor.chain().focus().insertContentAt(active, replaceText).run();
  }, [editor, matches, currentMatchIndex, replaceText]);

  const handleReplaceAll = useCallback(() => {
    if (!editor || matches.length === 0) return;

    const chain = editor.chain().focus();
    [...matches].reverse().forEach(match => {
      chain.insertContentAt(match, replaceText);
    });
    chain.run();
  }, [editor, matches, replaceText]);

  const selectCurrentMatch = useCallback(() => {
    if (!editor || currentMatchIndex < 0 || currentMatchIndex >= matches.length) return;
    const active = matches[currentMatchIndex];
    editor.chain().setTextSelection(active).run();
    const container = scrollRef?.current;
    if (container) {
      scrollMatchIntoView(editor, active, container);
    } else {
      editor.commands.scrollIntoView();
    }
  }, [editor, matches, currentMatchIndex, scrollRef]);

  return {
    showFindBar,
    setShowFindBar,
    findText,
    setFindText,
    replaceText,
    setReplaceText,
    matches,
    currentMatchIndex,
    matchCase,
    setMatchCase,
    wholeWord,
    setWholeWord,
    navigateMatch,
    handleReplace,
    handleReplaceAll,
    selectCurrentMatch,
  };
};
