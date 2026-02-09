import { useState, useEffect } from 'react';
import { ProjectData, CoverDesign, Chapter, TocItem } from '../types';

const STORAGE_KEY = 'epub_maker_project_v1';

const INITIAL_COVER_DESIGN: CoverDesign = {
    layoutMode: 'text-over',
    fontFamilyTitle: 'serif',
    fontSizeTitle: 48,
    fontColorTitle: '#ffffff',
    fontWeightTitle: 'bold',
    letterSpacingTitle: 0,
    fontFamilyAuthor: 'sans-serif',
    fontSizeAuthor: 24,
    fontColorAuthor: '#f3f4f6',
    textAlign: 'center',
    verticalOffset: 0,
    overlayOpacity: 0.3,
    textShadow: true,
    borderStyle: 'none',
    backgroundCSS: 'background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);',
    showSeries: false 
};

export const getInitialState = (): ProjectData => ({
    metadata: {
      title: '未命名书籍',
      creator: '未知作者',
      language: 'zh',
      description: '',
      publisher: '',
      date: new Date().toISOString().split('T')[0],
      series: '',
      subjects: []
    },
    chapters: [],
    images: [],
    extraFiles: [],
    cover: null,
    coverId: null,
    coverCustomCSS: '',
    coverDesign: { ...INITIAL_COVER_DESIGN },
    activeStyleId: 'classic',
    isPresetStyleActive: true,
    customCSS: '',
    coverGeneratorState: {
        selectedBgImageId: null,
        activeTemplateIndex: 0,
        showTextOnCover: true,
        aiCoverPrompt: ''
    }
});

export const useProject = () => {
    const [project, setProject] = useState<ProjectData>(getInitialState());
    const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from LocalStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setProject({
                    ...getInitialState(), 
                    ...parsed,
                    coverDesign: parsed.coverDesign || { ...INITIAL_COVER_DESIGN },
                    extraFiles: parsed.extraFiles || [],
                    isPresetStyleActive: parsed.isPresetStyleActive !== undefined ? parsed.isPresetStyleActive : true,
                    coverGeneratorState: parsed.coverGeneratorState || {
                        selectedBgImageId: null,
                        activeTemplateIndex: 0,
                        showTextOnCover: true,
                        aiCoverPrompt: ''
                    }
                });
                if (parsed.chapters && parsed.chapters.length > 0) {
                    setActiveChapterId(parsed.chapters[0].id);
                }
            } catch (e) {
                console.error("Failed to load project", e);
            }
        }
        setTimeout(() => setIsLoaded(true), 500);
    }, []);

    const updateProject = (updates: Partial<ProjectData>) => {
        setProject(prev => ({ ...prev, ...updates }));
    };

    const updateChapters = (chapters: Chapter[]) => {
        updateProject({ chapters });
    };

    const updateChapterContent = (newContent: string, newTitle?: string, subItems?: TocItem[]) => {
        if (!activeChapterId) return;
        setProject(prev => ({
            ...prev,
            chapters: prev.chapters.map(c => {
                if (c.id === activeChapterId) {
                    const updatedChapter = { ...c, content: newContent };
                    if (newTitle !== undefined) {
                        updatedChapter.title = newTitle;
                    }
                    if (subItems !== undefined) {
                        updatedChapter.subItems = subItems;
                    }
                    return updatedChapter;
                }
                return c;
            })
        }));
    };

    const splitChapter = (beforeContent: string, afterContent: string) => {
        if (!activeChapterId) return;

        // Helper to parse title and subItems from HTML content
        const parseMeta = (html: string, defaultTitle: string) => {
             const parser = new DOMParser();
             const doc = parser.parseFromString(html, 'text/html');
             const headings = doc.querySelectorAll('h1, h2');
             let title = defaultTitle;
             const subItems: TocItem[] = [];
             let titleFound = false;
             
             headings.forEach(el => {
                 // IDs should usually exist from Editor, if not we ignore or should have ensured they exist
                 const text = el.textContent?.trim() || '';
                 if (el.tagName === 'H1') {
                     if (!titleFound) {
                         title = text;
                         titleFound = true;
                     } else {
                         if (el.id) subItems.push({ id: el.id, text, level: 1 });
                     }
                 } else if (el.tagName === 'H2') {
                     if (el.id) subItems.push({ id: el.id, text, level: 2 });
                 }
             });
             return { title, subItems };
        };

        setProject(prev => {
            const chapterIndex = prev.chapters.findIndex(c => c.id === activeChapterId);
            if (chapterIndex === -1) return prev;

            const currentChapter = prev.chapters[chapterIndex];
            
            // Recalculate metadata for both parts
            // Use current title as fallback for the first part
            const beforeMeta = parseMeta(beforeContent, currentChapter.title);
            const updatedCurrentChapter = { 
                ...currentChapter, 
                content: beforeContent,
                title: beforeMeta.title, 
                subItems: beforeMeta.subItems
            };

            const afterMeta = parseMeta(afterContent, '新章节 (切分)');
            
            const newChapter: Chapter = {
                id: Date.now().toString(),
                title: afterMeta.title,
                content: afterContent,
                level: currentChapter.level,
                subItems: afterMeta.subItems,
            };

            const newChapters = [...prev.chapters];
            newChapters[chapterIndex] = updatedCurrentChapter;
            newChapters.splice(chapterIndex + 1, 0, newChapter);

            setActiveChapterId(newChapter.id);
            return { ...prev, chapters: newChapters };
        });
    };
    
    // Specifically for when files are imported
    const loadChaptersFromImport = (chapters: Chapter[], firstChapterId: string) => {
        updateProject({ chapters });
        setActiveChapterId(firstChapterId);
    };

    const activeChapter = project.chapters.find(c => c.id === activeChapterId);

    return {
        project,
        activeChapterId,
        activeChapter,
        isLoaded,
        setActiveChapterId,
        updateProject,
        updateChapters,
        updateChapterContent,
        splitChapter,
        loadChaptersFromImport,
    };
};
