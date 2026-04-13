import { Chapter } from '../types';

export const getTocTitle = (chapters: Chapter[]): string => {
  const firstTopLevelChapter = chapters.find((chapter) =>
    !chapter.excludeFromToc && chapter.level === 1 && chapter.title.trim().length > 0,
  );

  return firstTopLevelChapter?.title.trim() || '目录';
};
