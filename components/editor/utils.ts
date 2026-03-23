import { ImageAsset, TocItem } from '../../types';

export const getUniqueImageFilename = (img: ImageAsset): string => {
  if (!img) return 'unknown.jpg';

  let ext = 'jpg';
  if (img.type.includes('png')) ext = 'png';
  else if (img.type.includes('gif')) ext = 'gif';
  else if (img.type.includes('webp')) ext = 'webp';

  return `img_${img.id}.${ext}`;
};

const getImageReference = (imgEl: Element) => ({
  id: imgEl.getAttribute('data-id') || imgEl.getAttribute('title') || '',
  filename: imgEl.getAttribute('data-filename') || imgEl.getAttribute('alt') || '',
});

export const contentToEditorHTML = (html: string, images: ImageAsset[]): string => {
  if (!html) return html;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const imageMap = new Map<string, ImageAsset>(images.map(img => [img.id, img]));

  doc.querySelectorAll('img').forEach(imgEl => {
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

    imgEl.classList.add('image-missing');
    imgEl.setAttribute('data-missing-name', filename || 'Unknown image');
  });

  return doc.body.innerHTML;
};

export const editorHTMLToContent = (html: string, images: ImageAsset[]): string => {
  if (!html) return html;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const imageMap = new Map<string, ImageAsset>(images.map(img => [img.id, img]));

  doc.querySelectorAll('img').forEach(imgEl => {
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

export const generateId = (text: string) => {
  return 'heading-' + Math.random().toString(36).substr(2, 9);
};

export const extractHeadingsToSubItems = (editorEl: HTMLElement): TocItem[] => {
  const headings = editorEl.querySelectorAll('h1, h2');
  const subItems: TocItem[] = [];

  headings.forEach((el) => {
    const text = (el.textContent || '').trim();

    if (el.tagName === 'H1') {
      subItems.push({
        id: el.id || '',
        text: text || 'Untitled',
        level: 1
      });
    } else if (el.tagName === 'H2') {
      subItems.push({
        id: el.id || '',
        text: text || 'Untitled',
        level: 2
      });
    }
  });

  return subItems;
};

export const calculateReadStats = (text: string) => {
  const cleanText = text.replace(/\s+/g, '');
  const chars = cleanText.length;
  const time = Math.ceil(chars / 400);
  return { chars, time };
};
