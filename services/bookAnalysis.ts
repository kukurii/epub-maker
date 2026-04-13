import { Chapter, ImageAsset, TocItem } from '../types';

export interface ChapterImageUsage {
  imageId: string;
  imageName: string;
}

export interface ChapterSearchMatch {
  chapterId: string;
  chapterTitle: string;
  occurrences: number;
  snippets: string[];
}

export interface CleanupRuleSummary {
  key: CleanupRuleKey;
  label: string;
  total: number;
}

export interface CleanupPreview {
  chapterId: string;
  chapterTitle: string;
  changes: CleanupRuleSummary[];
}

export interface CleanupExecutionResult {
  chapters: Chapter[];
  previews: CleanupPreview[];
  totalChanges: number;
}

export interface ImageUsageSummary {
  image: ImageAsset;
  usageCount: number;
  chapters: Array<{ chapterId: string; chapterTitle: string }>;
  missing: boolean;
}

export type CleanupRuleKey =
  | 'removeEmptyParagraphs'
  | 'removeBrOnlyParagraphs'
  | 'removeInvalidImageRefs'
  | 'normalizeHeadingIds'
  | 'removeInlineStyles';

export interface CleanupOptions {
  removeEmptyParagraphs: boolean;
  removeBrOnlyParagraphs: boolean;
  removeInvalidImageRefs: boolean;
  normalizeHeadingIds: boolean;
  removeInlineStyles: boolean;
}

export const CLEANUP_RULE_LABELS: Record<CleanupRuleKey, string> = {
  removeEmptyParagraphs: '删除空段落',
  removeBrOnlyParagraphs: '删除仅含换行的段落',
  removeInvalidImageRefs: '删除失效图片引用',
  normalizeHeadingIds: '修复重复/缺失标题锚点',
  removeInlineStyles: '清除内联样式与对齐属性',
};

const DEFAULT_CLEANUP_OPTIONS: CleanupOptions = {
  removeEmptyParagraphs: true,
  removeBrOnlyParagraphs: true,
  removeInvalidImageRefs: true,
  normalizeHeadingIds: true,
  removeInlineStyles: false,
};

const collapseWhitespace = (text: string) => text.replace(/\s+/g, ' ').trim();

const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-')
    .replace(/^-+|-+$/g, '');

const buildHeadingId = (text: string, index: number, usedIds: Set<string>) => {
  const base = slugify(text) || `heading-${index + 1}`;
  let candidate = base;
  let suffix = 2;

  while (usedIds.has(candidate)) {
    candidate = `${base}-${suffix++}`;
  }

  usedIds.add(candidate);
  return candidate;
};

const extractPlainText = (content: string) => {
  const doc = new DOMParser().parseFromString(content || '', 'text/html');
  return collapseWhitespace(doc.body.textContent || '');
};

const getSnippet = (text: string, index: number, length: number) => {
  const start = Math.max(0, index - 18);
  const end = Math.min(text.length, index + length + 18);
  const prefix = start > 0 ? '...' : '';
  const suffix = end < text.length ? '...' : '';
  return `${prefix}${text.slice(start, end)}${suffix}`;
};

export const extractSubItemsFromContent = (content: string): TocItem[] => {
  const doc = new DOMParser().parseFromString(content || '', 'text/html');
  const headings = Array.from(doc.body.querySelectorAll('h1, h2'));
  const subItems: TocItem[] = [];
  let firstH1Consumed = false;

  headings.forEach((heading, index) => {
    const text = collapseWhitespace(heading.textContent || '') || `标题 ${index + 1}`;
    const id = heading.id || `heading-${index + 1}`;

    if (heading.tagName === 'H1') {
      if (!firstH1Consumed) {
        firstH1Consumed = true;
        return;
      }

      subItems.push({ id, text, level: 1 });
      return;
    }

    subItems.push({ id, text, level: 2 });
  });

  return subItems;
};

export const searchChapters = (
  chapters: Chapter[],
  query: string,
  matchCase: boolean = false,
): ChapterSearchMatch[] => {
  const normalizedQuery = matchCase ? query.trim() : query.trim().toLowerCase();
  if (!normalizedQuery) return [];

  return chapters
    .map((chapter) => {
      const text = extractPlainText(chapter.content);
      const source = matchCase ? text : text.toLowerCase();
      let index = 0;
      const snippets: string[] = [];
      let occurrences = 0;

      while ((index = source.indexOf(normalizedQuery, index)) > -1) {
        occurrences += 1;
        if (snippets.length < 3) {
          snippets.push(getSnippet(text, index, normalizedQuery.length));
        }
        index += normalizedQuery.length || 1;
      }

      return {
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        occurrences,
        snippets,
      };
    })
    .filter((match) => match.occurrences > 0);
};

export const analyzeImageUsages = (chapters: Chapter[], images: ImageAsset[]): ImageUsageSummary[] => {
  const imageMap = new Map(images.map((image) => [image.id, image]));
  const usageMap = new Map<string, ImageUsageSummary>();

  images.forEach((image) => {
    usageMap.set(image.id, {
      image,
      usageCount: 0,
      chapters: [],
      missing: false,
    });
  });

  chapters.forEach((chapter) => {
    const doc = new DOMParser().parseFromString(chapter.content || '', 'text/html');
    const seenInChapter = new Set<string>();

    doc.body.querySelectorAll('img').forEach((img) => {
      const imageId = img.getAttribute('data-id') || img.getAttribute('title') || '';
      if (!imageId || seenInChapter.has(imageId) || !imageMap.has(imageId)) return;

      seenInChapter.add(imageId);
      const summary = usageMap.get(imageId);
      if (!summary) return;

      summary.usageCount += 1;
      summary.chapters.push({
        chapterId: chapter.id,
        chapterTitle: chapter.title,
      });
    });
  });

  return Array.from(usageMap.values()).sort((a, b) => {
    if (b.usageCount !== a.usageCount) return b.usageCount - a.usageCount;
    return a.image.name.localeCompare(b.image.name, 'zh');
  });
};

const cleanupChapter = (
  chapter: Chapter,
  validImageIds: Set<string>,
  options: CleanupOptions,
): { chapter: Chapter; preview: CleanupPreview | null } => {
  const doc = new DOMParser().parseFromString(chapter.content || '', 'text/html');
  const usedHeadingIds = new Set<string>();
  const counts: Record<CleanupRuleKey, number> = {
    removeEmptyParagraphs: 0,
    removeBrOnlyParagraphs: 0,
    removeInvalidImageRefs: 0,
    normalizeHeadingIds: 0,
    removeInlineStyles: 0,
  };

  if (options.removeInvalidImageRefs) {
    doc.body.querySelectorAll('img').forEach((img) => {
      const imageId = img.getAttribute('data-id') || img.getAttribute('title') || '';
      if (imageId && !validImageIds.has(imageId)) {
        img.remove();
        counts.removeInvalidImageRefs += 1;
      }
    });
  }

  if (options.removeInlineStyles) {
    doc.body.querySelectorAll<HTMLElement>('[style], [align], [class]').forEach((el) => {
      let changed = false;
      if (el.hasAttribute('style')) {
        el.removeAttribute('style');
        changed = true;
      }
      if (el.hasAttribute('align')) {
        el.removeAttribute('align');
        changed = true;
      }
      if (el.hasAttribute('class') && !el.classList.contains('merge-divider')) {
        el.removeAttribute('class');
        changed = true;
      }
      if (changed) counts.removeInlineStyles += 1;
    });
  }

  doc.body.querySelectorAll('p').forEach((paragraph) => {
    const normalizedHtml = paragraph.innerHTML.replace(/&nbsp;/gi, '').replace(/\s+/g, '');
    const hasImage = !!paragraph.querySelector('img');

    if (options.removeBrOnlyParagraphs && !hasImage && /^((<br\s*\/?>)*)$/.test(normalizedHtml)) {
      paragraph.remove();
      counts.removeBrOnlyParagraphs += 1;
      return;
    }

    if (options.removeEmptyParagraphs && !hasImage && !collapseWhitespace(paragraph.textContent || '')) {
      paragraph.remove();
      counts.removeEmptyParagraphs += 1;
    }
  });

  if (options.normalizeHeadingIds) {
    doc.body.querySelectorAll('h1, h2').forEach((heading, index) => {
      const text = collapseWhitespace(heading.textContent || '');
      const existingId = heading.id.trim();
      const needsNewId = !existingId || usedHeadingIds.has(existingId);

      if (needsNewId) {
        heading.id = buildHeadingId(text, index, usedHeadingIds);
        counts.normalizeHeadingIds += 1;
      } else {
        usedHeadingIds.add(existingId);
      }
    });
  }

  const changes = (Object.keys(counts) as CleanupRuleKey[])
    .filter((key) => counts[key] > 0)
    .map((key) => ({
      key,
      label: CLEANUP_RULE_LABELS[key],
      total: counts[key],
    }));

  if (changes.length === 0) {
    return { chapter, preview: null };
  }

  const updatedContent = doc.body.innerHTML;
  const updatedChapter: Chapter = {
    ...chapter,
    content: updatedContent,
    subItems: extractSubItemsFromContent(updatedContent),
  };

  return {
    chapter: updatedChapter,
    preview: {
      chapterId: chapter.id,
      chapterTitle: chapter.title,
      changes,
    },
  };
};

export const previewCleanup = (
  chapters: Chapter[],
  images: ImageAsset[],
  overrides?: Partial<CleanupOptions>,
): CleanupPreview[] => {
  const options = { ...DEFAULT_CLEANUP_OPTIONS, ...overrides };
  const validImageIds = new Set(images.map((image) => image.id));

  return chapters
    .map((chapter) => cleanupChapter(chapter, validImageIds, options).preview)
    .filter(Boolean) as CleanupPreview[];
};

export const executeCleanup = (
  chapters: Chapter[],
  images: ImageAsset[],
  overrides?: Partial<CleanupOptions>,
): CleanupExecutionResult => {
  const options = { ...DEFAULT_CLEANUP_OPTIONS, ...overrides };
  const validImageIds = new Set(images.map((image) => image.id));
  const previews: CleanupPreview[] = [];
  let totalChanges = 0;

  const cleanedChapters = chapters.map((chapter) => {
    const result = cleanupChapter(chapter, validImageIds, options);
    if (result.preview) {
      previews.push(result.preview);
      totalChanges += result.preview.changes.reduce((sum, item) => sum + item.total, 0);
    }
    return result.chapter;
  });

  return {
    chapters: cleanedChapters,
    previews,
    totalChanges,
  };
};
