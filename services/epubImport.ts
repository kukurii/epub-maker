import JSZip from 'jszip';
import { ProjectData, Metadata, ImageAsset, ExtraFile, TocItem, Chapter } from '../types';

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
                    const asset: ImageAsset = {
                        id: assetId,
                        name: href.split('/').pop() || 'image',
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
    const chapterPromises = Array.from(spineItems).map(async (spineItem, chapterIndex) => {
        const idref = spineItem.getAttribute('idref');
        if (!idref) return null;

        const chapterItem = itemMap.get(idref);
        if (chapterItem && chapterItem.mediaType === 'application/xhtml+xml') {
            const chapterFile = zip.file(chapterItem.zipPath);
            if (chapterFile) {
                const chapterHtml = await chapterFile.async('text');
                const chapterDoc = parser.parseFromString(chapterHtml, 'text/html');

                const imagesInChapter = chapterDoc.querySelectorAll('img, image');
                imagesInChapter.forEach(img => {
                    const srcAttr = img.tagName.toLowerCase() === 'img' ? 'src' : 'href';
                    const src = img.getAttribute(srcAttr) || img.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
                    if (src) {
                        const decodedSrc = decodeURIComponent(src);
                        const chapterDir = chapterItem.zipPath.substring(0, chapterItem.zipPath.lastIndexOf('/'));
                        const imageZipPath = normalizePath(`${chapterDir}/${decodedSrc}`);

                        if (imagePathMap.has(imageZipPath)) {
                            const asset = imagePathMap.get(imageZipPath)!;

                            const getExtension = (type: string): string => {
                                if (type.includes('png')) return 'png';
                                if (type.includes('gif')) return 'gif';
                                if (type.includes('webp')) return 'webp';
                                return 'jpg';
                            }
                            const relativePath = `images/img_${asset.id}.${getExtension(asset.type)}`;

                            img.setAttribute(srcAttr, relativePath);
                            img.setAttribute('data-id', asset.id);
                            img.setAttribute('data-filename', asset.name);
                        }
                    }
                });

                if (options?.removeImages) {
                    imagesInChapter.forEach(img => img.remove());
                }

                if (options?.cleanHtml) {
                    // Remove scripts and styles completely
                    chapterDoc.querySelectorAll('script, style, link, meta').forEach(el => el.remove());
                    // Remove purely visual/empty elements replacing with space or nothing
                    chapterDoc.querySelectorAll('br').forEach(el => el.remove()); // Br is often abused for spacing

                    // Unwrap spans (keep content but remove the span tag wrapper itself)
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
                    chapterDoc.body.querySelectorAll('*').forEach(el => {
                        el.removeAttribute('style');
                        el.removeAttribute('class');
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

    const coverId = opfDoc.querySelector('meta[name="cover"]')?.getAttribute('content');
    let coverDataUrl: string | null = null;
    if (coverId) {
        const coverItem = itemMap.get(coverId);
        if (coverItem) {
            coverDataUrl = imagePathMap.get(coverItem.zipPath)?.data || null;
        }
    }

    return {
        metadata: newMetadata,
        chapters: resolvedChapters,
        images: newImages,
        extraFiles: newExtraFiles,
        customCSS: importedCustomCSS,
        cover: coverDataUrl,
    };
};
