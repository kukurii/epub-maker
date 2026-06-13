import JSZip from 'jszip';
import { ProjectData, Metadata, ImageAsset, ExtraFile, TocItem, Chapter } from '../../types';
import { sanitizeFilename } from '../../components/text-editor/editorHelpers';
import { generateImageFilename } from '../../utils/imageNaming';

const normalizePath = (path: string) => {
    const parts = path.split('/');
    const result: string[] = [];
    for (const part of parts) {
        if (part === '..') {
            result.pop();
        } else if (part !== '' && part !== '.') {
            result.push(part);
        }
    }
    return result.join('/');
};

export const parseEpub = async (file: File, options?: { imageStartId?: number; cleanHtml?: boolean; removeImages?: boolean; }): Promise<Partial<ProjectData>> => {
    const zip = await JSZip.loadAsync(file);
    const parser = new DOMParser();

    const containerFile = zip.file('META-INF/container.xml');
    if (!containerFile) throw new Error('Invalid EPUB: META-INF/container.xml not found.');
    const containerXmlText = await containerFile.async('text');
    const containerDoc = parser.parseFromString(containerXmlText, 'application/xml');
    const opfPath = containerDoc.getElementsByTagName('rootfile')[0]?.getAttribute('full-path');
    if (!opfPath) throw new Error('Invalid EPUB: OPF file path not found in container.xml.');

    const opfDir = opfPath.substring(0, opfPath.lastIndexOf('/'));

    const opfFile = zip.file(opfPath);
    if (!opfFile) throw new Error(`Invalid EPUB: OPF file not found at ${opfPath}.`);
    const opfXmlText = await opfFile.async('text');
    const opfDoc = parser.parseFromString(opfXmlText, 'application/xml');

    const metadataEl = opfDoc.getElementsByTagName('metadata')[0];
    const dc = (tag: string) => metadataEl.getElementsByTagNameNS('http://purl.org/dc/elements/1.1/', tag)[0]?.textContent?.trim() || '';
    const newMetadata: Metadata = {
        title: dc('title') || file.name.replace(/\.epub$/i, ''),
        creator: dc('creator') || 'Unknown Author',
        language: dc('language') || 'en',
        description: dc('description') || '',
        publisher: dc('publisher') || '',
        date: dc('date') ? new Date(dc('date')).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        subjects: Array.from(metadataEl.getElementsByTagNameNS('http://purl.org/dc/elements/1.1/', 'subject')).map(s => s.textContent?.trim() || '').filter(s => s),
        series: metadataEl.querySelector('meta[name="calibre:series"]')?.getAttribute('content') || '',
    };

    const manifestItems = opfDoc.getElementsByTagName('item');
    const itemMap = new Map<string, { href: string; mediaType: string; zipPath: string }>();
    const imagePathMap = new Map<string, ImageAsset>();
    const newImages: ImageAsset[] = [];
    const newExtraFiles: ExtraFile[] = [];
    let importedCustomCSS = '';

    // ID Counter for images
    let currentImageId = options?.imageStartId || 1;

    const manifestPromises = Array.from(manifestItems).map(async (item) => {
        const id = item.getAttribute('id') || 'unknown';
        const href = decodeURIComponent(item.getAttribute('href') || '');
        const mediaType = item.getAttribute('media-type');
        if (id && href && mediaType) {
            const zipPath = normalizePath(`${opfDir}/${href}`);
            itemMap.set(id, { href, mediaType, zipPath });

            if (mediaType.startsWith('image/')) {
                const imageFile = zip.file(zipPath);
                if (imageFile) {
                    // Pre-assign ID to ensure sequence
                    const assetId = (currentImageId++).toString().padStart(3, '0');

                    const data = await imageFile.async('base64');
                    const dataUrl = `data:${mediaType};base64,${data}`;

                    const base64 = dataUrl.split(',')[1] || '';
                    const size = Math.floor((base64.length * 3) / 4) - ((base64.match(/=/g) || []).length);

                    // 🎯 使用统一命名规则：img_001.jpg, img_002.png, ...
                    const originalName = href.split('/').pop() || 'image.jpg';
                    const unifiedName = generateImageFilename(currentImageId - 1, originalName);
                    const safeName = sanitizeFilename(unifiedName);

                    const asset: ImageAsset = {
                        id: assetId,
                        name: safeName,
                        data: dataUrl,
                        type: mediaType,
                        dimensions: 'N/A',
                        size: size
                    };
                    newImages.push(asset);
                    imagePathMap.set(zipPath, asset);
                }
            } else if (mediaType === 'text/css') {
                const cssFile = zip.file(zipPath);
                if (cssFile) {
                    const text = await cssFile.async('text');
                    const filename = href.split('/').pop() || '';
                    if (filename.toLowerCase() === 'style.css' || filename.toLowerCase() === 'main.css' || filename.toLowerCase() === 'stylesheet.css') {
                        importedCustomCSS += text + '\n';
                    } else {
                        newExtraFiles.push({
                            id: id,
                            filename: filename,
                            content: text,
                            type: 'css',
                            isActive: true
                        });
                    }
                }
            }
        }
    });
    await Promise.all(manifestPromises);

    const spineItems = opfDoc.getElementsByTagName('itemref');

    // 需要排除的章节（封面、版权页等）
    const excludedChapterNames = ['cover', 'titlepage', 'title', 'cover-page', 'copyright', 'toc'];

    const chapterPromises = Array.from(spineItems).map(async (spineItem, chapterIndex) => {
        const idref = spineItem.getAttribute('idref');
        if (!idref) return null;

        const chapterItem = itemMap.get(idref);
        if (chapterItem && chapterItem.mediaType === 'application/xhtml+xml') {
            // 检查是否是封面章节
            const fileName = chapterItem.href.toLowerCase().replace(/\.x?html?$/, '').split('/').pop() || '';
            const shouldExclude = excludedChapterNames.some(name => fileName.includes(name));

            if (shouldExclude) {
                console.log('⏭️ 跳过封面/版权章节:', chapterItem.href);
                return null; // 跳过封面章节
            }

            const chapterFile = zip.file(chapterItem.zipPath);
            if (chapterFile) {
                const chapterHtml = await chapterFile.async('text');
                const chapterDoc = parser.parseFromString(chapterHtml, 'text/html');

                // 先处理图片引用（在任何 DOM 操作之前）
                const imagesInChapter = chapterDoc.querySelectorAll('img, image');
                console.log(`📷 章节 "${chapterItem.href}" 找到 ${imagesInChapter.length} 张图片`);

                imagesInChapter.forEach(img => {
                    const srcAttr = img.tagName.toLowerCase() === 'img' ? 'src' : 'href';
                    const src = img.getAttribute(srcAttr) || img.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
                    if (src) {
                        const decodedSrc = decodeURIComponent(src);
                        const chapterDir = chapterItem.zipPath.substring(0, chapterItem.zipPath.lastIndexOf('/'));

                        // 处理绝对路径和相对路径
                        let imageZipPath: string;
                        if (decodedSrc.startsWith('/') || decodedSrc.startsWith('../')) {
                            // 绝对路径或父级相对路径
                            imageZipPath = normalizePath(`${opfDir}/${decodedSrc}`);
                        } else {
                            // 相对路径
                            imageZipPath = normalizePath(`${chapterDir}/${decodedSrc}`);
                        }

                        console.log('🔍 查找图片:', decodedSrc, '→', imageZipPath);

                        if (imagePathMap.has(imageZipPath)) {
                            const asset = imagePathMap.get(imageZipPath)!;

                            // 使用原始文件名，不再重命名
                            const relativePath = `images/${asset.name}`;

                            img.setAttribute(srcAttr, relativePath);
                            img.setAttribute('data-id', asset.id);
                            img.setAttribute('data-filename', asset.name);
                            console.log('✅ 图片匹配成功:', asset.name, '→', relativePath);
                        } else {
                            console.warn('❌ 图片未找到:', imageZipPath);
                        }
                    }
                });

                if (options?.removeImages) {
                    imagesInChapter.forEach(img => img.remove());
                }

                // 然后处理 cleanHtml（保护图片标签）
                if (options?.cleanHtml) {
                    // Remove scripts and styles completely
                    chapterDoc.querySelectorAll('script, style, link, meta').forEach(el => el.remove());

                    // Unwrap spans (keep content but remove the span wrapper itself)
                    chapterDoc.querySelectorAll('span, font').forEach(el => {
                        const parent = el.parentNode;
                        if (parent) {
                            while (el.firstChild) {
                                parent.insertBefore(el.firstChild, el);
                            }
                            parent.removeChild(el);
                        }
                    });

                    // Remove inline styles and classes to allow global theme take over
                    // 🔧 重要：保留图片标签的 src、data-id、data-filename 等关键属性
                    chapterDoc.body.querySelectorAll('*').forEach(el => {
                        // 对所有元素：只移除样式、类名、对齐属性
                        // 不移除 src、href、data-* 等数据属性
                        el.removeAttribute('style');
                        el.removeAttribute('class');
                        el.removeAttribute('align');
                    });

                    // Convert divs to p (保留 DOM 结构，不用字符串替换)
                    chapterDoc.querySelectorAll('div').forEach(div => {
                        const p = chapterDoc.createElement('p');
                        while (div.firstChild) {
                            p.appendChild(div.firstChild);
                        }
                        div.parentNode?.replaceChild(p, div);
                    });

                    // Clean up empty paragraphs
                    chapterDoc.querySelectorAll('p').forEach(p => {
                        // Keep if it has an image, otherwise if text is empty, remove it
                        if (!p.textContent?.trim() && !p.querySelector('img')) {
                            p.remove();
                        }
                    });
                }

                const headings = chapterDoc.querySelectorAll('h1, h2');
                let foundTitle = false;
                let chapterTitle = `Chapter ${chapterIndex + 1}`;
                const subItems: TocItem[] = [];

                headings.forEach(el => {
                    if (!el.id) el.id = 'heading-' + Math.random().toString(36).substr(2, 9);
                    const text = el.textContent?.trim() || 'Untitled';

                    if (el.tagName === 'H1') {
                        if (!foundTitle) {
                            chapterTitle = text;
                            foundTitle = true;
                        } else {
                            subItems.push({ id: el.id, text, level: 1 });
                        }
                    } else if (el.tagName === 'H2') {
                        subItems.push({ id: el.id, text, level: 2 });
                    }
                });

                if (!foundTitle) {
                    const titleTag = chapterDoc.querySelector('title');
                    if (titleTag && titleTag.textContent) chapterTitle = titleTag.textContent.trim();
                }

                return {
                    id: Date.now().toString(36) + Math.random().toString(36).substr(2, 4) + chapterIndex,
                    title: chapterTitle,
                    content: chapterDoc.body.innerHTML,
                    level: 1,
                    subItems: subItems,
                } as Chapter;
            }
        }
        return null;
    });

    const resolvedChapters = (await Promise.all(chapterPromises)).filter(Boolean) as Chapter[];

    // ─── 封面处理（增强版）───
    const coverMetaId = opfDoc.querySelector('meta[name="cover"]')?.getAttribute('content');
    let coverDataUrl: string | null = null;
    let coverAssetId: string | null = null;

    // 方式1: 通过 OPF meta 标签查找封面
    if (coverMetaId) {
        const coverItem = itemMap.get(coverMetaId);
        if (coverItem) {
            const coverAsset = imagePathMap.get(coverItem.zipPath);
            if (coverAsset) {
                coverDataUrl = coverAsset.data;
                coverAssetId = coverAsset.id;
                console.log('✅ 封面从 meta 标签找到:', coverAsset.name);
            }
        }
    }

    // 方式2: 如果没找到，从 cover.xhtml 或 titlepage.xhtml 中提取
    if (!coverDataUrl) {
        const coverChapterNames = ['cover', 'titlepage', 'title', 'cover-page'];
        for (const [id, item] of itemMap.entries()) {
            const fileName = item.href.toLowerCase().replace(/\.x?html?$/, '');
            if (coverChapterNames.includes(fileName)) {
                const coverChapterFile = zip.file(item.zipPath);
                if (coverChapterFile) {
                    const coverHtml = await coverChapterFile.async('text');
                    const coverDoc = parser.parseFromString(coverHtml, 'text/html');

                    // 查找 cover.xhtml 中的第一张图片
                    const firstImg = coverDoc.querySelector('img');
                    if (firstImg) {
                        const src = firstImg.getAttribute('src');
                        if (src) {
                            const chapterDir = item.zipPath.substring(0, item.zipPath.lastIndexOf('/'));
                            const imageZipPath = normalizePath(`${chapterDir}/${decodeURIComponent(src)}`);
                            const coverAsset = imagePathMap.get(imageZipPath);

                            if (coverAsset) {
                                coverDataUrl = coverAsset.data;
                                coverAssetId = coverAsset.id;
                                console.log('✅ 封面从章节中提取:', coverAsset.name);
                                break;
                            }
                        }
                    }
                }
            }
        }
    }

    // 方式3: 如果还是没找到，尝试使用第一张图片作为封面
    if (!coverDataUrl && newImages.length > 0) {
        const firstImage = newImages[0];
        coverDataUrl = firstImage.data;
        coverAssetId = firstImage.id;
        console.log('⚠️ 使用第一张图片作为封面:', firstImage.name);
    }

    return {
        metadata: newMetadata,
        chapters: resolvedChapters,
        images: newImages,
        extraFiles: newExtraFiles,
        customCSS: importedCustomCSS,
        cover: coverDataUrl,
        coverId: coverAssetId,
    };
};
