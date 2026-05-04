/**
 * 编辑器工具函数
 *
 * 这个文件包含编辑器与外部数据交换时需要的转换函数：
 * - 内容在"存储格式"和"编辑器格式"之间转换
 * - 从 HTML 中提取标题和子项
 * - 字数和阅读时间统计
 */

import { ImageAsset, TocItem } from '../../types';

// ─── 图片文件名生成 ───

/** 根据图片 ID 和类型生成唯一文件名（用于 EPUB 导出） */
export const getUniqueImageFilename = (img: ImageAsset): string => {
  if (!img) return 'unknown.jpg';

  let ext = 'jpg';
  if (img.type.includes('png')) ext = 'png';
  else if (img.type.includes('gif')) ext = 'gif';
  else if (img.type.includes('webp')) ext = 'webp';

  return `img_${img.id}.${ext}`;
};

// ─── 图片引用解析 ───

/** 从 img 元素中获取图片引用信息 */
const getImageReference = (imgEl: Element) => ({
  id: imgEl.getAttribute('data-id') || imgEl.getAttribute('title') || '',
  filename: imgEl.getAttribute('data-filename') || imgEl.getAttribute('alt') || '',
});

// ─── 内容格式转换 ───

/**
 * 将存储格式的 HTML 转换为编辑器显示格式
 * 主要工作：把 img 的 src 从文件路径替换为 base64 数据
 */
export const contentToEditorHTML = (html: string, images: ImageAsset[]): string => {
  if (!html) return html;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const imageMap = new Map<string, ImageAsset>(images.map((img) => [img.id, img]));

  doc.querySelectorAll('img').forEach((imgEl) => {
    const { id, filename } = getImageReference(imgEl);

    if (id && imageMap.has(id)) {
      const image = imageMap.get(id)!;
      imgEl.setAttribute('src', image.data);
      imgEl.setAttribute('data-id', image.id);
      imgEl.setAttribute('data-filename', image.name);
      imgEl.setAttribute('title', image.id);
      imgEl.setAttribute('alt', image.name);
      imgEl.classList.remove('image-missing');
      imgEl.removeAttribute('data-missing-name');
      return;
    }

    // 图片不存在，标记为缺失
    imgEl.classList.add('image-missing');
    imgEl.setAttribute('data-missing-name', filename || 'Unknown image');
  });

  return doc.body.innerHTML;
};

/**
 * 将编辑器格式的 HTML 转换回存储格式
 * 主要工作：把 img 的 src 从 base64 数据替换回文件路径
 */
export const editorHTMLToContent = (html: string, images: ImageAsset[]): string => {
  if (!html) return html;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const imageMap = new Map<string, ImageAsset>(images.map((img) => [img.id, img]));

  doc.querySelectorAll('img').forEach((imgEl) => {
    const { id, filename } = getImageReference(imgEl);

    if (id && imageMap.has(id)) {
      const image = imageMap.get(id)!;
      const uniqueFilename = getUniqueImageFilename(image);
      imgEl.setAttribute('src', `images/${uniqueFilename}`);
      imgEl.setAttribute('data-id', image.id);
      imgEl.setAttribute('data-filename', image.name);
      imgEl.setAttribute('title', image.id);
      imgEl.setAttribute('alt', image.name);
      return;
    }

    // 保留引用信息，即使图片不存在
    if (id) {
      imgEl.setAttribute('data-id', id);
      imgEl.setAttribute('title', id);
    }
    if (filename) {
      imgEl.setAttribute('data-filename', filename);
      imgEl.setAttribute('alt', filename);
    }
  });

  return doc.body.innerHTML;
};

// ─── 标题和子项提取 ───

/**
 * 从 HTML 字符串中提取章节标题
 * 规则：第一个 H1 的文字就是章节标题
 */
export const extractTitleFromHTML = (html: string, fallbackTitle?: string): string => {
  if (!html) return fallbackTitle || 'Untitled';

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const firstH1 = doc.body.querySelector('h1');
  const text = firstH1?.textContent?.trim();
  return text || fallbackTitle || 'Untitled';
};

/**
 * 从 HTML 字符串中提取子标题列表（subItems）
 * 规则：跳过第一个 H1（它是章节标题），后续的 H1 和 H2 作为子项
 */
export const extractSubItemsFromHTML = (html: string): TocItem[] => {
  if (!html) return [];

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const headings = doc.body.querySelectorAll('h1, h2');
  const subItems: TocItem[] = [];
  let firstH1Skipped = false;

  headings.forEach((el) => {
    const text = (el.textContent || '').trim();

    if (el.tagName === 'H1') {
      if (!firstH1Skipped) {
        firstH1Skipped = true;
        return; // 跳过第一个 H1
      }
      subItems.push({
        id: el.id || '',
        text: text || 'Untitled',
        level: 1,
      });
    } else if (el.tagName === 'H2') {
      subItems.push({
        id: el.id || '',
        text: text || 'Untitled',
        level: 2,
      });
    }
  });

  return subItems;
};

/**
 * 从 ProseMirror 编辑器的 DOM 元素中提取标题（实时）
 * 用于编辑器 onUpdate 回调中
 */
export const extractChapterTitleFromDOM = (
  editorEl: HTMLElement,
  fallbackTitle?: string,
): string => {
  const firstH1 = editorEl.querySelector('h1');
  const text = firstH1?.textContent?.trim();
  return text || fallbackTitle || 'Untitled';
};

/**
 * 从 ProseMirror 编辑器的 DOM 元素中提取子项列表（实时）
 * 用于编辑器 onUpdate 回调中
 */
export const extractSubItemsFromDOM = (editorEl: HTMLElement): TocItem[] => {
  const headings = editorEl.querySelectorAll('h1, h2');
  const subItems: TocItem[] = [];
  let firstH1Skipped = false;

  headings.forEach((el) => {
    const text = (el.textContent || '').trim();

    if (el.tagName === 'H1') {
      if (!firstH1Skipped) {
        firstH1Skipped = true;
        return;
      }
      subItems.push({ id: el.id || '', text: text || 'Untitled', level: 1 });
    } else if (el.tagName === 'H2') {
      subItems.push({ id: el.id || '', text: text || 'Untitled', level: 2 });
    }
  });

  return subItems;
};

// ─── 统计 ───

/** 计算字数和预计阅读时间 */
export const calculateReadStats = (text: string) => {
  const cleanText = text.replace(/\s+/g, '');
  const chars = cleanText.length;
  const time = Math.ceil(chars / 400); // 假设阅读速度 400字/分钟
  return { chars, time };
};
