import JSZip from 'jszip';
import saveAs from 'file-saver';
import { ProjectData, PRESET_STYLES, Chapter, Metadata, ImageAsset, ExtraFile, TocItem } from '../types';

// Helper to ensure HTML is valid XHTML for EPUB (self-closing tags, entities)
const fixXHTML = (html: string): string => {
  let fixed = html;
  
  // 1. Properly encode ampersands that are not already part of an HTML entity
  fixed = fixed.replace(/&(?![a-zA-Z#0-9]+;)/g, "&amp;");

  // 2. Close void tags that browsers might leave open (e.g., <br> to <br />)
  const voidTags = ['br', 'hr', 'img', 'input', 'link', 'meta'];
  voidTags.forEach(tag => {
    // Regex to find <tag ... > (without / at end)
    const regex = new RegExp(`<${tag}\\b([^>]*)(?<!/)>`, 'gi');
    fixed = fixed.replace(regex, `<${tag}$1 />`);
  });

  return fixed;
};

export const generateEpub = async (project: ProjectData) => {
  const zip = new JSZip();

  // 1. Mimetype (must be first, uncompressed)
  zip.file('mimetype', 'application/epub+zip', { compression: "STORE" });

  // 2. META-INF/container.xml
  const containerXml = `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
   <rootfiles>
      <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
   </rootfiles>
</container>`;
  zip.folder('META-INF')?.file('container.xml', containerXml);

  // 3. OEBPS Folder
  const oebps = zip.folder('OEBPS');
  if (!oebps) return;

  // --- CSS ---
  const activeStyle = PRESET_STYLES.find(s => s.id === project.activeStyleId) || PRESET_STYLES[0];
  const presetCss = project.isPresetStyleActive !== false ? activeStyle.css : '/* Preset style disabled by user. */';
  const finalCss = `${presetCss}\n\n/* Custom CSS */\n${project.customCSS}`;
  oebps.file('style.css', finalCss);

  // --- Extra Files (Custom CSS created in Structure View) ---
  if (project.extraFiles) {
      project.extraFiles.forEach(file => {
          // Only include active extra files in the final EPUB
          if (file.isActive === false) return;
          oebps.file(file.filename, file.content);
      });
  }

  // --- Images Processing ---
  const imageMapByName = new Map<string, string>();
  const imageMapById = new Map<string, string>();
  
  project.images.forEach((img) => {
    const imgData = img.data.split(',')[1];
    // Get extension
    let ext = 'jpg';
    if (img.type.includes('png')) ext = 'png';
    else if (img.type.includes('gif')) ext = 'gif';
    else if (img.type.includes('webp')) ext = 'webp';

    const uniqueFilename = `img_${img.id}.${ext}`;
    
    imageMapByName.set(img.name, uniqueFilename);
    imageMapById.set(img.id, uniqueFilename);
    
    oebps.file(`images/${uniqueFilename}`, imgData, { base64: true });
  });

  // --- Cover Logic ---
  let coverFilename = '';
  let isCoverFromImages = false;

  // Attempt to use referenced image for cover if available
  if (project.coverId) {
      const referencedImg = project.images.find(i => i.id === project.coverId);
      if (referencedImg) {
          const uniqueName = imageMapById.get(referencedImg.id);
          if (uniqueName) {
              coverFilename = `images/${uniqueName}`;
              isCoverFromImages = true;
          }
      }
  }

  // Fallback to generating standalone cover file if no valid reference
  if (!isCoverFromImages && project.cover) {
    const coverData = project.cover.split(',')[1]; 
    const isPng = project.cover.startsWith('data:image/png');
    coverFilename = isPng ? 'cover.png' : 'cover.jpg';
    oebps.file(coverFilename, coverData, { base64: true });
  }

  // Write cover.xhtml if there is a cover
  if (coverFilename) {
    // Cover usually doesn't need extra chapter-specific styles, but let's include 'global' ones just in case?
    // For now, only style.css
    const coverXhtml = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>Cover</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body class="cover-page">
  <div class="cover-container">
     <img src="${coverFilename}" alt="Cover Image" class="cover-image" />
  </div>
</body>
</html>`;
    oebps.file('cover.xhtml', coverXhtml);
  }

  const processContent = (htmlContent: string) => {
     const parser = new DOMParser();
     const doc = parser.parseFromString(htmlContent, 'text/html');
     
     const images = doc.querySelectorAll('img');
     images.forEach(img => {
         const id = img.getAttribute('data-id');
         const filename = img.getAttribute('data-filename');
         
         let uniqueName = null;
         
         if (id && imageMapById.has(id)) {
             uniqueName = imageMapById.get(id);
         } else if (filename && imageMapByName.has(filename)) {
             uniqueName = imageMapByName.get(filename);
         }
         
         if (uniqueName) {
             img.setAttribute('src', `images/${uniqueName}`);
         }
     });
     
     return fixXHTML(doc.body.innerHTML);
  };

  // --- Chapters ---
  project.chapters.forEach((chapter, index) => {
    const processedContent = processContent(chapter.content);
    
    // Calculate which extra files apply to this chapter
    const extraCssLinks = project.extraFiles
        ?.filter(f => {
            if (f.type !== 'css' || f.isActive === false) return false;
            // If targetChapterIds is undefined, treat as global (legacy compat)
            if (f.targetChapterIds === undefined) return true;
            // Otherwise check if this chapter is in the target list
            return f.targetChapterIds.includes(chapter.id);
        })
        .map(f => `<link rel="stylesheet" type="text/css" href="${f.filename}"/>`)
        .join('\n  ') || '';

    const chapterContent = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${chapter.title}</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
  ${extraCssLinks}
</head>
<body>
  ${processedContent}
</body>
</html>`;
    oebps.file(`chapter_${index}.xhtml`, chapterContent);
  });

  // --- TOC.xhtml (Visual Table of Contents) ---
  let tocHtmlItems = '';
  project.chapters.forEach((chapter, index) => {
      // Exclude from TOC if marked
      if (chapter.excludeFromToc) return;

      const indentClass = chapter.level === 2 ? 'toc-level-2' : 'toc-level-1';
      tocHtmlItems += `<li class="toc-item ${indentClass}"><a class="toc-link" href="chapter_${index}.xhtml">${chapter.title}</a></li>\n`;
  });

  const tocXhtml = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>Table of Contents</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
  <h1>目录</h1>
  <ul class="toc-list">
    ${tocHtmlItems}
  </ul>
</body>
</html>`;
  oebps.file('toc.xhtml', tocXhtml);

  // --- OPF (Package File) ---
  const uid = `urn:uuid:${Date.now()}`;
  
  let manifestItems = '';
  let spineItems = '';

  // Handle Cover Item in Manifest
  if (coverFilename) {
      if (!isCoverFromImages) {
        // Standalone cover file needs its own item entry
        const mediaType = project.cover?.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';
        manifestItems += `<item id="cover-image" href="${coverFilename}" media-type="${mediaType}"/>\n`;
      }
      // cover.xhtml
      manifestItems += `<item id="cover" href="cover.xhtml" media-type="application/xhtml+xml"/>\n`;
      spineItems += `<itemref idref="cover"/>\n`;
  }

  manifestItems += `<item id="toc" href="toc.xhtml" media-type="application/xhtml+xml"/>\n`;
  manifestItems += `<item id="style" href="style.css" media-type="text/css"/>\n`;
  manifestItems += `<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>\n`;

  if (project.extraFiles) {
      project.extraFiles.forEach(file => {
          // Only manifest active extra files
          if (file.isActive === false) return;
          const mediaType = file.type === 'css' ? 'text/css' : 'application/xml';
          manifestItems += `<item id="extra_${file.id}" href="${file.filename}" media-type="${mediaType}"/>\n`;
      });
  }

  project.images.forEach((img) => {
    const uniqueName = imageMapById.get(img.id);
    if (uniqueName) {
        manifestItems += `<item id="img_${img.id}" href="images/${uniqueName}" media-type="${img.type}"/>\n`;
    }
  });

  project.chapters.forEach((_, index) => {
    manifestItems += `<item id="chapter_${index}" href="chapter_${index}.xhtml" media-type="application/xhtml+xml"/>\n`;
  });

  spineItems += `<itemref idref="toc"/>\n`;
  project.chapters.forEach((_, index) => {
    spineItems += `<itemref idref="chapter_${index}"/>\n`;
  });

  let extraMetadata = '';
  if (project.metadata.series) {
      extraMetadata += `<meta name="calibre:series" content="${project.metadata.series}" />\n`;
  }
  if (project.metadata.subjects && project.metadata.subjects.length > 0) {
      project.metadata.subjects.forEach(tag => {
          extraMetadata += `<dc:subject>${tag}</dc:subject>\n`;
      });
  }

  // Determine the ID of the cover image item for the <meta name="cover"> tag
  let coverImageMetaId = '';
  if (coverFilename) {
      if (isCoverFromImages && project.coverId) {
          coverImageMetaId = `img_${project.coverId}`;
      } else {
          coverImageMetaId = 'cover-image';
      }
  }

  const opfContent = `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:title>${project.metadata.title}</dc:title>
    <dc:creator opf:role="aut">${project.metadata.creator}</dc:creator>
    <dc:language>${project.metadata.language}</dc:language>
    <dc:identifier id="BookId" opf:scheme="UUID">${uid}</dc:identifier>
    <dc:description>${project.metadata.description}</dc:description>
    ${extraMetadata}
    ${coverImageMetaId ? `<meta name="cover" content="${coverImageMetaId}" />` : ''}
  </metadata>
  <manifest>
    ${manifestItems}
  </manifest>
  <spine toc="ncx">
    ${spineItems}
  </spine>
  <guide>
    ${coverFilename ? '<reference type="cover" title="Cover" href="cover.xhtml"/>' : ''}
    <reference type="toc" title="Table of Contents" href="toc.xhtml"/>
  </guide>
</package>`;

  oebps.file('content.opf', opfContent);

  // --- NCX ---
  let navPoints = '';
  let playOrder = 1;

  if (coverFilename) {
    navPoints += `
    <navPoint id="navPoint-cover" playOrder="${playOrder++}">
      <navLabel><text>Cover</text></navLabel>
      <content src="cover.xhtml"/>
    </navPoint>`;
  }

  navPoints += `
    <navPoint id="navPoint-toc" playOrder="${playOrder++}">
      <navLabel><text>目录</text></navLabel>
      <content src="toc.xhtml"/>
    </navPoint>`;

  let currentLevel = 0; 

  project.chapters.forEach((c, i) => {
    // Exclude from NCX (TOC) if marked
    if (c.excludeFromToc) return;

    if (c.level === 1) {
       if (currentLevel === 2) {
          navPoints += `</navPoint>\n`; 
          navPoints += `</navPoint>\n`; 
       } else if (currentLevel === 1) {
          navPoints += `</navPoint>\n`; 
       }
       
       navPoints += `<navPoint id="navPoint-${i}" playOrder="${playOrder++}">
          <navLabel><text>${c.title}</text></navLabel>
          <content src="chapter_${i}.xhtml"/>\n`;
       
       currentLevel = 1;
    } 
    else if (c.level === 2) {
       if (currentLevel === 2) {
          navPoints += `</navPoint>\n`; 
       }
       
       navPoints += `<navPoint id="navPoint-${i}" playOrder="${playOrder++}">
          <navLabel><text>${c.title}</text></navLabel>
          <content src="chapter_${i}.xhtml"/>\n`;
          
       currentLevel = 2;
    }
  });

  if (currentLevel === 2) {
     navPoints += `</navPoint>\n`; 
     navPoints += `</navPoint>\n`; 
  } else if (currentLevel === 1) {
     navPoints += `</navPoint>\n`; 
  }

  const ncxContent = `<?xml version="1.0" encoding="utf-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${uid}"/>
    <meta name="dtb:depth" content="2"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle><text>${project.metadata.title}</text></docTitle>
  <navMap>
    ${navPoints}
  </navMap>
</ncx>`;

  oebps.file('toc.ncx', ncxContent);

  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, `${project.metadata.title || 'ebook'}.epub`);
};

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

export const parseEpub = async (file: File, options?: { imageStartId?: number }): Promise<Partial<ProjectData>> => {
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

                // Identify Title and SubItems, and ensure IDs
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
                
                // If no H1 found, maybe use title tag or fallback
                if (!foundTitle) {
                     const titleTag = chapterDoc.querySelector('title');
                     if (titleTag && titleTag.textContent) chapterTitle = titleTag.textContent.trim();
                }

                return {
                    id: Date.now().toString(36) + Math.random().toString(36).substr(2, 4) + chapterIndex,
                    title: chapterTitle,
                    content: chapterDoc.body.innerHTML, // Updated content with IDs
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