/**
 * 图片重命名工具函数
 *
 * 用于统一图片命名：
 * 1. 手动上传的图片
 * 2. EPUB 导入的图片
 * 3. 批量重命名现有图片
 */

/**
 * 生成统一的图片文件名
 * 格式：img_001.扩展名, img_002.jpg, ...
 *
 * @param index - 图片序号（从1开始）
 * @param originalName - 原始文件名（用于提取扩展名）
 * @returns 新的文件名
 */
export function generateImageFilename(index: number, originalName: string): string {
  // 提取扩展名
  const ext = originalName.includes('.')
    ? originalName.split('.').pop()?.toLowerCase() || 'jpg'
    : 'jpg';

  // 生成序号：001, 002, 003, ...
  const paddedIndex = index.toString().padStart(3, '0');

  return `img_${paddedIndex}.${ext}`;
}

/**
 * 批量重命名图片列表
 * 从 001 开始重新编号
 *
 * @param images - 要重命名的图片列表
 * @returns 重命名后的图片列表
 */
export function renameImages(images: any[]): any[] {
  return images.map((img, index) => {
    const newName = generateImageFilename(index + 1, img.name);
    return {
      ...img,
      name: newName,
      // 更新 ID 以匹配新的序号
      id: (index + 1).toString().padStart(3, '0'),
    };
  });
}

/**
 * 为新上传的图片生成文件名
 * 基于现有图片数量确定起始序号
 *
 * @param existingImages - 现有图片列表
 * @param newImageOriginalName - 新图片的原始文件名
 * @returns 新的文件名
 */
export function generateNewImageFilename(existingImages: any[], newImageOriginalName: string): string {
  const nextIndex = existingImages.length + 1;
  return generateImageFilename(nextIndex, newImageOriginalName);
}
