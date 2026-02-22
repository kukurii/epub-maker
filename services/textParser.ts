export const parseTxtToChapters = (text: string, customRegex?: string): { title: string, content: string, level: 1 | 2 }[] => {
    const lines = text.split('\n');
    const chapters: { title: string, content: string, level: 1 | 2 }[] = [];

    let currentTitle = 'Start';
    let currentContent: string[] = [];

    let chapterRegexStr = "^\\s*(Chapter\\s+\\d+|第[0-9一二三四五六七八九十百千]+[章回节]|序章|尾声|引子|[（(][0-9一二三四五六七八九十百千]+[)）])";

    if (customRegex && customRegex.trim().length > 0) {
        chapterRegexStr = customRegex;
    }

    let chapterRegex: RegExp;
    try {
        chapterRegex = new RegExp(chapterRegexStr, 'i');
    } catch (e) {
        console.error("Invalid Regex provided, falling back to default.", e);
        chapterRegex = /^\s*(Chapter\s+\d+|第[0-9一二三四五六七八九十百千]+[章回节]|序章|尾声|引子|[（(][0-9一二三四五六七八九十百千]+[)）])/i;
    }

    const flushChapter = () => {
        if (currentContent.length > 0 || currentTitle !== 'Start') {
            const body = currentContent.map(l => `<p>${l}</p>`).join('');
            const contentWithTitle = `<h1>${currentTitle}</h1>\n${body}`;
            chapters.push({
                title: currentTitle,
                content: contentWithTitle,
                level: 1
            });
        }
    };

    for (const line of lines) {
        const trimmed = line.trim();
        if (chapterRegex.test(trimmed)) {
            flushChapter();
            currentTitle = trimmed;
            currentContent = [];
        } else {
            if (trimmed) {
                currentContent.push(trimmed);
            }
        }
    }

    flushChapter();

    if (chapters.length === 0) {
        const body = lines.map(l => l ? `<p>${l}</p>` : '').join('');
        return [{ title: 'Chapter 1', content: `<h1>Chapter 1</h1>\n${body}`, level: 1 }];
    }

    return chapters;
};
