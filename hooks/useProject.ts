import { useState, useEffect } from 'react';
import { ProjectData, CoverDesign, Chapter, TocItem } from '../types';
import localforage from 'localforage';

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

    // Load from IndexedDB (localforage) on mount
    useEffect(() => {
        const loadProjectData = async () => {
            try {
                // Try to get from localforage first
                let savedData: any = await localforage.getItem(STORAGE_KEY);

                // If not found in localforage, try migrating from legacy localStorage
                if (!savedData) {
                    const legacyDataStr = localStorage.getItem(STORAGE_KEY);
                    if (legacyDataStr) {
                        try {
                            savedData = JSON.parse(legacyDataStr);
                            // Migrate it to localforage immediately
                            await localforage.setItem(STORAGE_KEY, savedData);
                            // Clear legacy data
                            localStorage.removeItem(STORAGE_KEY);
                            console.log('Project data successfully migrated from LocalStorage to IndexedDB.');
                        } catch (legacyErr) {
                            console.error('Failed to parse legacy localStorage data', legacyErr);
                        }
                    }
                }

                if (savedData) {
                    setProject({
                        ...getInitialState(),
                        ...savedData,
                        coverDesign: savedData.coverDesign || { ...INITIAL_COVER_DESIGN },
                        extraFiles: savedData.extraFiles || [],
                        isPresetStyleActive: savedData.isPresetStyleActive !== undefined ? savedData.isPresetStyleActive : true,
                        coverGeneratorState: savedData.coverGeneratorState || {
                            selectedBgImageId: null,
                            activeTemplateIndex: 0,
                            showTextOnCover: true,
                            aiCoverPrompt: ''
                        }
                    });
                    if (savedData.chapters && savedData.chapters.length > 0) {
                        setActiveChapterId(savedData.chapters[0].id);
                    }
                }
            } catch (e) {
                console.error("Failed to load project from storage", e);
            } finally {
                // We add a tiny delay for smooth UI transition
                setTimeout(() => setIsLoaded(true), 300);
            }
        };

        loadProjectData();
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