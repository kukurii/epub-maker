import { Chapter } from '../../types';

/**
 * 生成唯一的章节 ID
 * 使用时间戳 + 随机数确保不会冲突
 */
const generateUniqueId = (): string => {
    return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * 解析HTML文件为章节
 * 支持多种HTML结构：
 * 1. 按 <h1> 标签切分章节
 * 2. 按 <section> 或 <article> 标签切分
 * 3. 如果没有明显结构，作为单个章节导入
 */
export const parseHtmlToChapters = (htmlContent: string): Chapter[] => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const chapters: Chapter[] = [];

    // 移除 script 和 style 标签
    doc.querySelectorAll('script, style').forEach(el => el.remove());

    // 策略1: 尝试按 <h1> 标签切分
    const h1Elements = doc.querySelectorAll('h1');
    if (h1Elements.length > 0) {
        h1Elements.forEach((h1, index) => {
            const title = h1.textContent?.trim() || `章节 ${index + 1}`;
            const contentParts: string[] = [];

            // 收集该 h1 之后、下一个 h1 之前的所有内容
            let currentNode = h1.nextSibling;
            while (currentNode) {
                // 如果遇到下一个 h1，停止
                if (currentNode.nodeType === Node.ELEMENT_NODE) {
                    const element = currentNode as Element;
                    if (element.tagName === 'H1') break;

                    // 收集内容
                    const html = element.outerHTML;
                    if (html.trim()) {
                        contentParts.push(html);
                    }
                } else if (currentNode.nodeType === Node.TEXT_NODE) {
                    const text = currentNode.textContent?.trim();
                    if (text) {
                        contentParts.push(`<p>${text}</p>`);
                    }
                }
                currentNode = currentNode.nextSibling;
            }

            const content = `<h1>${title}</h1>\n${contentParts.join('\n')}`;
            chapters.push({
                id: generateUniqueId(),
                title,
                content,
                level: 1,
                subItems: []
            });
        });

        return chapters;
    }

    // 策略2: 尝试按 <section> 或 <article> 切分
    const sections = doc.querySelectorAll('section, article');
    if (sections.length > 0) {
        sections.forEach((section, index) => {
            // 尝试从 section 中找标题
            const heading = section.querySelector('h1, h2, h3');
            const title = heading?.textContent?.trim() || `章节 ${index + 1}`;

            // 获取 section 的完整内容
            let content = section.innerHTML.trim();

            // 如果没有 h1 标题，添加一个
            if (!section.querySelector('h1')) {
                content = `<h1>${title}</h1>\n${content}`;
            }

            chapters.push({
                id: generateUniqueId(),
                title,
                content,
                level: 1,
                subItems: []
            });
        });

        return chapters;
    }

    // 策略3: 没有明显结构，将整个 body 作为单个章节
    const bodyContent = doc.body.innerHTML.trim();
    if (bodyContent) {
        // 尝试从文档中提取标题
        const titleElement = doc.querySelector('title, h1, h2');
        const title = titleElement?.textContent?.trim() || '导入的章节';

        const content = bodyContent.includes('<h1>')
            ? bodyContent
            : `<h1>${title}</h1>\n${bodyContent}`;

        chapters.push({
            id: generateUniqueId(),
            title,
            content,
            level: 1,
            subItems: []
        });
    }

    // 如果完全没有内容，返回一个空章节
    if (chapters.length === 0) {
        chapters.push({
            id: generateUniqueId(),
            title: '空章节',
            content: '<h1>空章节</h1>\n<p>未能从HTML文件中提取到内容。</p>',
            level: 1,
            subItems: []
        });
    }

    return chapters;
};

/**
 * 清理HTML内容
 * 移除不必要的属性和标签
 */
export const cleanHtmlContent = (html: string): string => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // 移除所有元素的 class 和 style 属性（保留基本结构）
    doc.querySelectorAll('*').forEach(el => {
        el.removeAttribute('class');
        el.removeAttribute('style');
        el.removeAttribute('id');
    });

    // 移除空的 span 和 div
    doc.querySelectorAll('span, div').forEach(el => {
        if (!el.textContent?.trim()) {
            el.remove();
        }
    });

    return doc.body.innerHTML;
};
