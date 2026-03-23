import { useState, useCallback, useEffect, useMemo } from 'react';
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

export const useEditorSearch = (editor: Editor | null, contentDeps: string) => {
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

  useEffect(() => {
    if (!editor || currentMatchIndex < 0 || currentMatchIndex >= matches.length) return;

    const active = matches[currentMatchIndex];
    editor.chain().setTextSelection(active).scrollIntoView().run();
  }, [editor, matches, currentMatchIndex]);

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
    editor.chain().setTextSelection(matches[currentMatchIndex]).scrollIntoView().run();
  }, [editor, matches, currentMatchIndex]);

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
