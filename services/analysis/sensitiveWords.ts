/**
 * sensitiveWords.ts - 敏感词修正服务
 *
 * 提供两种模式：
 * 1. 批量替换：适合形近字等固定对应关系的替换
 * 2. 逐条审阅：适合占位符（如【不可描述】），显示上下文让用户逐条定位修改
 */

import { Chapter } from '../../types';

// ─── 类型定义 ───

/** 批量替换规则 */
export interface ReplaceRule {
  id: string;
  from: string;   // 要查找的文本
  to: string;     // 替换为
  enabled: boolean;
}

/** 批量替换预览（每条规则在全书中匹配多少处） */
export interface RulePreview {
  ruleId: string;
  from: string;
  to: string;
  totalMatches: number;
}

/** 批量替换执行结果 */
export interface BatchReplaceResult {
  chapters: Chapter[];
  totalChanges: number;
}

/** 占位符出现位置（逐条审阅用） */
export interface PlaceholderMatch {
  chapterId: string;
  chapterTitle: string;
  /** 上下文片段（前后约20字） */
  context: string;
  /** 占位符在上下文中的起始位置，用于高亮显示 */
  highlightStart: number;
  /** 占位符在上下文中的结束位置 */
  highlightEnd: number;
  /** 该占位符在所属章节 HTML 中是第几次出现（0-based），用于精确替换 */
  occurrenceIndex: number;
  /** 实际匹配到的文本（正则模式下每处可能不同） */
  matchedText: string;
}

/** 逐条替换的指令（用户为每一处指定替换词） */
export interface PerOccurrenceReplacement {
  chapterId: string;
  /** 该占位符在章节 HTML 中是第几次出现（0-based） */
  occurrenceIndex: number;
  /** 替换为什么 */
  replaceTo: string;
}

// ─── 内置模板 ───

/** 内置常用形近字替换模板 */
export const BUILTIN_TEMPLATES: { name: string; rules: { from: string; to: string }[] }[] = [
  {
    name: '「土」→「十」系列',
    rules: [
      { from: '土分', to: '十分' },
      { from: '土足', to: '十足' },
      { from: '土只', to: '十只' },
      { from: '土多', to: '十多' },
      { from: '土几', to: '十几' },
      { from: '土二', to: '十二' },
      { from: '土三', to: '十三' },
      { from: '土四', to: '十四' },
      { from: '土五', to: '十五' },
      { from: '土六', to: '十六' },
      { from: '土七', to: '十七' },
      { from: '土八', to: '十八' },
      { from: '土九', to: '十九' },
      { from: '土万', to: '十万' },
      { from: '土年', to: '十年' },
      { from: '土天', to: '十天' },
      { from: '土米', to: '十米' },
      { from: '土个', to: '十个' },
      { from: '土来', to: '十来' },
      { from: '土成', to: '十成' },
    ],
  },
  {
    name: '常见形近字',
    rules: [
      { from: '口区', to: '呕' },
      { from: '贝戒', to: '贼' },
    ],
  },
  {
    name: '常见占位符',
    rules: [
      { from: '【和谐】', to: '' },
      { from: '【河蟹】', to: '' },
      { from: '【屏蔽】', to: '' },
    ],
  },
];

/** 常用正则搜索预设 */
export const PRESET_PATTERNS: { label: string; pattern: string }[] = [
  { label: '第X章', pattern: '第.{1,4}章' },
  { label: '第X节', pattern: '第.{1,4}节' },
  { label: '第X卷', pattern: '第.{1,4}卷' },
  { label: '连续星号', pattern: '\\*{2,}' },
  { label: '方括号占位', pattern: '【[^】]+】' },
];

// ─── 规则持久化 ───

const STORAGE_KEY = 'epub_maker_sensitive_word_rules';
const WORDBANK_KEY = 'epub_maker_sensitive_word_bank';

/** 从 localStorage 加载已保存的规则 */
export const loadSavedRules = (): ReplaceRule[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load sensitive word rules', e);
  }
  return [];
};

/** 保存规则到 localStorage */
export const saveRules = (rules: ReplaceRule[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
  } catch (e) {
    console.error('Failed to save sensitive word rules', e);
  }
};

/** 从 localStorage 加载词库 */
export const loadWordBank = (): string[] => {
  try {
    const raw = localStorage.getItem(WORDBANK_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load word bank', e);
  }
  return [];
};

/** 保存词库到 localStorage */
export const saveWordBank = (words: string[]): void => {
  try {
    localStorage.setItem(WORDBANK_KEY, JSON.stringify(words));
  } catch (e) {
    console.error('Failed to save word bank', e);
  }
};

// ─── 工具函数 ───

/** 从 HTML 内容中提取纯文本 */
const extractPlainText = (html: string): string => {
  const doc = new DOMParser().parseFromString(html || '', 'text/html');
  return doc.body.textContent || '';
};

/** 获取某个位置前后的上下文片段 */
const getContext = (
  text: string,
  matchStart: number,
  matchLength: number,
  contextRadius: number = 20,
): { context: string; highlightStart: number; highlightEnd: number } => {
  const start = Math.max(0, matchStart - contextRadius);
  const end = Math.min(text.length, matchStart + matchLength + contextRadius);
  const prefix = start > 0 ? '...' : '';
  const suffix = end < text.length ? '...' : '';
  const context = prefix + text.slice(start, end) + suffix;
  const highlightStart = prefix.length + (matchStart - start);
  const highlightEnd = highlightStart + matchLength;
  return { context, highlightStart, highlightEnd };
};

// ─── 批量替换功能 ───

/**
 * 预览批量替换：统计每条规则在全书中的匹配数
 */
export const previewBatchReplace = (
  chapters: Chapter[],
  rules: ReplaceRule[],
): RulePreview[] => {
  const enabledRules = rules.filter((r) => r.enabled && r.from.trim());

  return enabledRules.map((rule) => {
    let totalMatches = 0;
    const searchText = rule.from;

    chapters.forEach((chapter) => {
      // 在 HTML 源码中搜索（因为替换也是在 HTML 中进行的）
      const content = chapter.content || '';
      let index = 0;
      while ((index = content.indexOf(searchText, index)) > -1) {
        totalMatches++;
        index += searchText.length || 1;
      }
    });

    return {
      ruleId: rule.id,
      from: rule.from,
      to: rule.to,
      totalMatches,
    };
  });
};

/**
 * 执行批量替换：对所有章节应用启用的替换规则
 */
export const executeBatchReplace = (
  chapters: Chapter[],
  rules: ReplaceRule[],
): BatchReplaceResult => {
  const enabledRules = rules.filter((r) => r.enabled && r.from.trim() && r.to !== undefined);
  let totalChanges = 0;

  const updatedChapters = chapters.map((chapter) => {
    let content = chapter.content || '';
    let changed = false;

    enabledRules.forEach((rule) => {
      const searchText = rule.from;
      let count = 0;
      // 统计匹配数
      let idx = 0;
      while ((idx = content.indexOf(searchText, idx)) > -1) {
        count++;
        idx += searchText.length || 1;
      }

      if (count > 0) {
        // 使用 split + join 进行全局替换（避免正则特殊字符问题）
        content = content.split(searchText).join(rule.to);
        totalChanges += count;
        changed = true;
      }
    });

    if (changed) {
      // 更新标题（如果 H1 内容被替换了的话）
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, 'text/html');
      const firstH1 = doc.body.querySelector('h1');
      const newTitle = firstH1?.textContent?.trim() || chapter.title;

      return { ...chapter, content, title: newTitle };
    }
    return chapter;
  });

  return { chapters: updatedChapters, totalChanges };
};

// ─── 逐条审阅功能 ───

/** 在字符串中查找所有匹配（支持纯文本和正则），返回 [{position, matchedText}] */
const findAllMatches = (
  text: string,
  pattern: string,
  useRegex: boolean,
): { position: number; matchedText: string }[] => {
  const results: { position: number; matchedText: string }[] = [];

  if (useRegex) {
    try {
      const regex = new RegExp(pattern, 'g');
      let m: RegExpExecArray | null;
      while ((m = regex.exec(text)) !== null) {
        results.push({ position: m.index, matchedText: m[0] });
        // 防止空匹配无限循环
        if (m[0].length === 0) regex.lastIndex++;
      }
    } catch {
      // 正则语法错误时返回空
    }
  } else {
    let idx = 0;
    while ((idx = text.indexOf(pattern, idx)) > -1) {
      results.push({ position: idx, matchedText: pattern });
      idx += pattern.length || 1;
    }
  }

  return results;
};

/**
 * 查找占位符在全书中的所有出现位置，并附带上下文
 * 同时记录每处在章节 HTML 中是第几次出现，用于后续精确替换
 */
export const findPlaceholderOccurrences = (
  chapters: Chapter[],
  placeholder: string,
  useRegex: boolean = false,
): PlaceholderMatch[] => {
  if (!placeholder.trim()) return [];

  const matches: PlaceholderMatch[] = [];

  chapters.forEach((chapter) => {
    const content = chapter.content || '';
    const plainText = extractPlainText(content);

    // 在纯文本中查找（用于显示上下文）
    const plainMatches = findAllMatches(plainText, placeholder, useRegex);

    // 在 HTML 中查找（用于记录 occurrenceIndex，以便后续替换）
    const htmlMatches = findAllMatches(content, placeholder, useRegex);

    // 配对：纯文本匹配用于显示，HTML 匹配用于定位
    const count = Math.min(plainMatches.length, htmlMatches.length);

    for (let i = 0; i < count; i++) {
      const plain = plainMatches[i];
      const { context, highlightStart, highlightEnd } = getContext(
        plainText,
        plain.position,
        plain.matchedText.length,
      );

      matches.push({
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        context,
        highlightStart,
        highlightEnd,
        occurrenceIndex: i,
        matchedText: plain.matchedText,
      });
    }
  });

  return matches;
};

/**
 * 逐条替换：为每处占位符指定不同的替换词
 *
 * 原理：在每个章节的 HTML 中，按出现顺序找到第 N 次出现的占位符并替换。
 * 为避免替换后位置偏移，从后往前替换。
 */
export const executePerOccurrenceReplace = (
  chapters: Chapter[],
  placeholder: string,
  replacements: PerOccurrenceReplacement[],
  useRegex: boolean = false,
): BatchReplaceResult => {
  // 按章节分组
  const byChapter = new Map<string, PerOccurrenceReplacement[]>();
  replacements.forEach((r) => {
    if (!byChapter.has(r.chapterId)) byChapter.set(r.chapterId, []);
    byChapter.get(r.chapterId)!.push(r);
  });

  let totalChanges = 0;

  const updatedChapters = chapters.map((chapter) => {
    const chapterReplacements = byChapter.get(chapter.id);
    if (!chapterReplacements || chapterReplacements.length === 0) return chapter;

    let content = chapter.content || '';

    // 找到所有匹配在 HTML 中的位置和匹配文本
    const htmlMatches = findAllMatches(content, placeholder, useRegex);

    // 按 occurrenceIndex 降序排列（从后往前替换，避免位置偏移）
    const sorted = [...chapterReplacements].sort(
      (a, b) => b.occurrenceIndex - a.occurrenceIndex,
    );

    sorted.forEach((r) => {
      if (r.occurrenceIndex < htmlMatches.length) {
        const match = htmlMatches[r.occurrenceIndex];
        content =
          content.substring(0, match.position) +
          r.replaceTo +
          content.substring(match.position + match.matchedText.length);
        totalChanges++;
      }
    });

    // 更新标题
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const firstH1 = doc.body.querySelector('h1');
    const newTitle = firstH1?.textContent?.trim() || chapter.title;

    return { ...chapter, content, title: newTitle };
  });

  return { chapters: updatedChapters, totalChanges };
};

