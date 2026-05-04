/**
 * useEditorSearch - 编辑器搜索与替换 Hook
 *
 * 改进点：
 * 1. 替换后立即重新计算 matches（通过 editor.on('update') 监听）
 * 2. 替换后自动跳到下一个匹配项
 * 3. 搜索跳转同时设置 text selection
 */

import { useState, useCallback, useEffect, useMemo, RefObject } from 'react';
import type { Editor } from '@tiptap/react';
import { searchHighlightKey, buildHighlightDecorations } from './extensions/SearchHighlight';

interface SearchMatch {
  from: number;
  to: number;
}

const WORD_CHAR_REGEX = /[\w\u00C0-\u024F\u4E00-\u9FFF]/;

/**
 * 收集文档中所有文本节点，拼成完整字符串，
 * 并记录每段的位置映射（用于后续把全文偏移量换算成文档位置）
 */
const collectTextSegments = (editor: Editor) => {
  const segments: Array<{ text: string; startIndex: number; endIndex: number; from: number }> = [];
  let fullText = '';

  editor.state.doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return;
    const startIndex = fullText.length;
    fullText += node.text;
    segments.push({ text: node.text, startIndex, endIndex: fullText.length, from: pos });
  });

  return { fullText, segments };
};

/** 把全文字符串的偏移量换算成 ProseMirror 文档中的位置 */
const resolveDocPosition = (
  segments: Array<{ startIndex: number; endIndex: number; from: number }>,
  index: number,
) => {
  const seg = segments.find((s) => index >= s.startIndex && index < s.endIndex);
  return seg ? seg.from + (index - seg.startIndex) : null;
};

/** 在文档中搜索所有匹配项 */
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

    // 全词匹配检查
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
 * 将匹配项滚动到外层滚动容器的可视区域中央
 */
const scrollMatchIntoView = (
  editor: Editor,
  match: SearchMatch,
  scrollContainer: HTMLElement,
) => {
  try {
    const coords = editor.view.coordsAtPos(match.from);
    const containerRect = scrollContainer.getBoundingClientRect();
    const relativeTop = coords.top - containerRect.top + scrollContainer.scrollTop;
    const targetScrollTop = relativeTop - scrollContainer.clientHeight / 2;
    scrollContainer.scrollTo({ top: Math.max(0, targetScrollTop), behavior: 'smooth' });
  } catch {
    // 降级到 TipTap 内置方法
    editor.chain().setTextSelection(match).scrollIntoView().run();
  }
};

/** 更新编辑器中的搜索高亮 Decoration */
const applyHighlightDecorations = (
  editor: Editor,
  matches: SearchMatch[],
  activeIndex: number,
) => {
  const { state, view } = editor;
  const decorations = buildHighlightDecorations(state.doc, matches, activeIndex);
  const tr = state.tr.setMeta(searchHighlightKey, decorations);
  view.dispatch(tr);
};

/**
 * useEditorSearch Hook
 *
 * @param editor 编辑器实例
 * @param scrollRef 外层滚动容器的 ref
 */
export const useEditorSearch = (
  editor: Editor | null,
  scrollRef?: RefObject<HTMLElement | null>,
) => {
  const [showFindBar, setShowFindBar] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);
  const [matchCase, setMatchCase] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  // 用一个递增的数字触发重新计算（替换操作后递增）
  const [searchVersion, setSearchVersion] = useState(0);

  // 计算所有匹配项
  const matches = useMemo(
    () => (editor && showFindBar ? buildSearchMatches(editor, findText, matchCase, wholeWord) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editor, findText, showFindBar, matchCase, wholeWord, searchVersion],
  );

  // 监听编辑器文档变化，自动递增 searchVersion 触发重新搜索
  useEffect(() => {
    if (!editor || !showFindBar) return;

    const handleUpdate = () => {
      setSearchVersion((v) => v + 1);
    };

    editor.on('update', handleUpdate);
    return () => {
      editor.off('update', handleUpdate);
    };
  }, [editor, showFindBar]);

  // 匹配项变化时，调整当前索引
  useEffect(() => {
    if (!findText || matches.length === 0) {
      setCurrentMatchIndex(-1);
      return;
    }
    setCurrentMatchIndex((prev) => {
      if (prev < 0) return 0;
      return Math.min(prev, matches.length - 1);
    });
  }, [findText, matches.length]);

  // 关闭查找栏时清除高亮
  useEffect(() => {
    if (!editor) return;
    if (!showFindBar) {
      applyHighlightDecorations(editor, [], -1);
    }
  }, [editor, showFindBar]);

  // 更新高亮 Decoration
  useEffect(() => {
    if (!editor) return;
    applyHighlightDecorations(editor, matches, currentMatchIndex);
  }, [editor, matches, currentMatchIndex]);

  // 当前索引变化时，滚动到可视区 + 设置文本选区
  useEffect(() => {
    if (!editor || currentMatchIndex < 0 || currentMatchIndex >= matches.length) return;

    const active = matches[currentMatchIndex];

    // 设置文本选区，让光标跟随搜索结果
    editor.chain().setTextSelection(active).run();

    // 滚动到可视区
    const container = scrollRef?.current;
    if (container) {
      scrollMatchIntoView(editor, active, container);
    } else {
      editor.commands.scrollIntoView();
    }
    // 只依赖 index，避免 matches 引用变化导致重复触发
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, currentMatchIndex]);

  /** 导航到上/下一个匹配项 */
  const navigateMatch = useCallback(
    (direction: 'next' | 'prev') => {
      if (matches.length === 0) return;
      setCurrentMatchIndex((prev) => {
        if (prev < 0) return 0;
        return direction === 'next'
          ? (prev + 1) % matches.length
          : (prev - 1 + matches.length) % matches.length;
      });
    },
    [matches.length],
  );

  /** 替换当前匹配项 */
  const handleReplace = useCallback(() => {
    if (!editor || currentMatchIndex < 0 || currentMatchIndex >= matches.length) return;

    const active = matches[currentMatchIndex];
    editor.chain().focus().insertContentAt(active, replaceText).run();

    // 替换后 searchVersion 会通过 editor.on('update') 自动递增
    // matches 会自动重新计算，currentMatchIndex 也会自动调整
  }, [editor, matches, currentMatchIndex, replaceText]);

  /** 替换所有匹配项 */
  const handleReplaceAll = useCallback(() => {
    if (!editor || matches.length === 0) return;

    // 从后往前替换，避免位置偏移
    const chain = editor.chain().focus();
    [...matches].reverse().forEach((match) => {
      chain.insertContentAt(match, replaceText);
    });
    chain.run();
  }, [editor, matches, replaceText]);

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
  };
};
