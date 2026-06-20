import { Chapter } from '../types';

export const escapeXml = (value: string | undefined | null): string =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

export const getTocTitle = (chapters: Chapter[]): string => {
  const firstTopLevelChapter = chapters.find(
    (chapter) => !chapter.excludeFromToc && chapter.level === 1 && chapter.title.trim().length > 0,
  );

  return firstTopLevelChapter?.title.trim() || '目录';
};

export const getTocStats = (chapters: Chapter[]) => {
  const includedChapters = chapters.filter((chapter) => !chapter.excludeFromToc);
  const subItemCount = includedChapters.reduce(
    (count, chapter) => count + (chapter.subItems?.length || 0),
    0,
  );

  return {
    totalChapters: chapters.length,
    includedChapters: includedChapters.length,
    excludedChapters: chapters.length - includedChapters.length,
    subItemCount,
  };
};

export const chapterHref = (chapterIndex: number, anchorId?: string): string => {
  const fragment = anchorId ? `#${encodeURIComponent(anchorId)}` : '';
  return `chapter_${chapterIndex}.xhtml${fragment}`;
};

const renderSubItems = (chapterIndex: number, chapter: Chapter): string => {
  if (!chapter.subItems?.length) return '';

  const subItems = chapter.subItems
    .map((item) => {
      const levelClass = item.level === 1 ? 'toc-anchor-level-1' : 'toc-anchor-level-2';
      return `<li class="toc-item toc-anchor ${levelClass}"><a class="toc-link" href="${chapterHref(chapterIndex, item.id)}">${escapeXml(item.text || '小节')}</a></li>`;
    })
    .join('\n');

  return `<ul class="toc-sub-list">\n${subItems}\n</ul>`;
};

export const renderTocXhtml = (chapters: Chapter[], tocTitle = getTocTitle(chapters)): string => {
  const tocHtmlItems = chapters
    .map((chapter, index) => {
      if (chapter.excludeFromToc) return '';

      const indentClass = chapter.level === 2 ? 'toc-level-2' : 'toc-level-1';
      return `<li class="toc-item ${indentClass}"><a class="toc-link" href="${chapterHref(index)}">${escapeXml(chapter.title || '无标题章节')}</a>${renderSubItems(index, chapter)}</li>`;
    })
    .filter(Boolean)
    .join('\n');

  return `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${escapeXml(tocTitle)}</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
  <h1>${escapeXml(tocTitle)}</h1>
  <ul class="toc-list">
    ${tocHtmlItems}
  </ul>
</body>
</html>`;
};
