/**
 * 编辑器工具函数
 *
 * 这个文件包含编辑器与外部数据交换时需要的转换函数：
 * - 内容在"存储格式"和"编辑器格式"之间转换
 * - 从 HTML 中提取标题和子项
 * - 字数和阅读时间统计
 */

import { ImageAsset, TocItem } from '../../types';

// ─── 图片ID管理 ───

/**
 * 从现有图片列表中获取下一个可用的图片ID
 * 确保ID格式统一为三位数字（001, 002, 003...）
 */
export function getNextImageId(images: ImageAsset[]): string {
  const existingIds = images
    .map(img => parseInt(img.id) || 0)
    .filter(id => !isNaN(id));
  const maxId = Math.max(0, ...existingIds);
  return (maxId + 1).toString().padStart(3, '0');
}

/**
 * 清理文件名，移除不安全字符
 * 防止路径遍历攻击和文件系统错误
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return 'unnamed.jpg';

  return filename
    .replace(/[\/\\]/g, '_')        // 替换路径分隔符
    .replace(/[<>:"|?*]/g, '')      // 移除Windows非法字符
    .replace(/^\.+/, '')             // 移除开头的点
    .replace(/\s+/g, '_')            // 空格替换为下划线
    .substring(0, 255);              // 限制长度
}

// ─── 图片文件名生成 ───

/** 根据图片 ID 和类型生成唯一文件名（用于 EPUB 导出） */
export const getUniqueImageFilename = (img: ImageAsset): string => {
  if (!img) return 'unknown.jpg';

  // 直接使用原始文件名，不再重命名
  return img.name;
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
  const imageMapById = new Map<string, ImageAsset>(images.map((img) => [img.id, img]));
  const imageMapByName = new Map<string, ImageAsset>(images.map((img) => [img.name, img]));

  console.log('🖼️ contentToEditorHTML: 图片库有', images.length, '张图片');
  console.log('📋 ID 列表:', Array.from(imageMapById.keys()));
  console.log('📋 文件名列表:', Array.from(imageMapByName.keys()));

  doc.querySelectorAll('img').forEach((imgEl, index) => {
    const { id, filename } = getImageReference(imgEl);
    const src = imgEl.getAttribute('src') || '';

    console.log(`\n🔍 处理图片 #${index + 1}:`);
    console.log('  - data-id:', id);
    console.log('  - data-filename:', filename);
    console.log('  - src:', src);

    let foundImage: ImageAsset | undefined;

    // 优先通过 ID 匹配
    if (id && imageMapById.has(id)) {
      foundImage = imageMapById.get(id)!;
      console.log('  ✅ 通过 ID 匹配成功:', foundImage.name);
    }
    // 其次通过文件名匹配
    else if (filename && imageMapByName.has(filename)) {
      foundImage = imageMapByName.get(filename)!;
      console.log('  ✅ 通过 filename 匹配成功:', foundImage.name);
    }
    // 最后尝试从 src 中提取文件名匹配
    else if (src) {
      const srcFilename = src.split('/').pop() || '';
      console.log('  🔎 尝试从 src 提取文件名:', srcFilename);

      if (srcFilename) {
        // 策略1: 尝试匹配 img_001.jpg 格式
        const imgIdMatch = srcFilename.match(/img_(\d+)\.(jpg|png|gif|webp|svg)/);
        if (imgIdMatch) {
          const imgId = imgIdMatch[1].padStart(3, '0'); // 确保ID格式统一
          console.log('  🔎 提取到 ID:', imgId);
          if (imageMapById.has(imgId)) {
            foundImage = imageMapById.get(imgId)!;
            console.log('  ✅ 通过 src ID 匹配成功:', foundImage.name);
          }
        }

        // 策略2: 直接按完整文件名匹配（支持普通文件名如 photo.jpg）
        if (!foundImage && imageMapByName.has(srcFilename)) {
          foundImage = imageMapByName.get(srcFilename)!;
          console.log('  ✅ 通过 src 文件名匹配成功:', foundImage.name);
        }

        // 策略3: 尝试提取纯数字ID（如 001.jpg）
        if (!foundImage) {
          const pureIdMatch = srcFilename.match(/^(\d+)\.(jpg|png|gif|webp|svg)/);
          if (pureIdMatch) {
            const pureId = pureIdMatch[1].padStart(3, '0');
            if (imageMapById.has(pureId)) {
              foundImage = imageMapById.get(pureId)!;
              console.log('  ✅ 通过纯数字 ID 匹配成功:', foundImage.name);
            }
          }
        }
      }
    }

    if (foundImage) {
      imgEl.setAttribute('src', foundImage.data);
      imgEl.setAttribute('data-id', foundImage.id);
      imgEl.setAttribute('data-filename', foundImage.name);
      imgEl.setAttribute('title', foundImage.id);
      imgEl.setAttribute('alt', foundImage.name);
      imgEl.classList.remove('image-missing');
      imgEl.removeAttribute('data-missing-name');
      console.log('  ✅ 设置 base64 数据成功');
      return;
    }

    // 图片不存在，标记为缺失，使用SVG占位符
    console.warn('  ❌ 图片未找到! id:', id, 'filename:', filename, 'src:', src);
    const missingName = filename || id || '未知文件';

    // 使用SVG占位符代替CSS伪元素，提高兼容性
    const placeholderSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="150"><rect width="300" height="150" fill="%23fee" stroke="%23f00" stroke-width="2" stroke-dasharray="5,5"/><text x="150" y="75" text-anchor="middle" fill="%23c00" font-size="14" font-family="sans-serif">图片缺失: ${encodeURIComponent(missingName)}</text></svg>`;

    imgEl.setAttribute('src', placeholderSvg);
    imgEl.classList.add('image-missing');
    imgEl.setAttribute('data-missing-name', missingName);
    imgEl.setAttribute('alt', `[图片缺失: ${missingName}]`);
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
