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
 * ⚠️ 注意：只修改文件名，保持 ID 不变（ID 是图片的唯一标识）
 *
 * @param images - 要重命名的图片列表
 * @returns { images: 重命名后的图片列表, oldNameMap: 旧文件名 -> 新文件名的映射 }
 */
export function renameImages(images: any[]): {
  images: any[];
  oldNameMap: Map<string, string>;
} {
  const oldNameMap = new Map<string, string>();

  const renamedImages = images.map((img, index) => {
    const oldName = img.name;
    const newName = generateImageFilename(index + 1, img.name);

    // 记录旧文件名 -> 新文件名的映射
    oldNameMap.set(oldName, newName);

    return {
      ...img,
      name: newName,
      // ⚠️ ID 保持不变 - 它是图片的唯一标识符
      // id 字段不应该被修改，否则会破坏所有引用关系
    };
  });

  return { images: renamedImages, oldNameMap };
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

/**
 * 更新章节内容中的图片引用
 * 用于批量重命名后同步更新所有章节中的图片文件名
 *
 * @param chapters - 章节列表
 * @param oldNameMap - 旧文件名 -> 新文件名的映射
 * @returns 更新后的章节列表
 */
export function updateChapterImageReferences(
  chapters: any[],
  oldNameMap: Map<string, string>
): any[] {
  return chapters.map(chapter => {
    let updatedContent = chapter.content;

    // 遍历所有旧文件名，替换为新文件名
    oldNameMap.forEach((newName, oldName) => {
      // 替换 src 属性中的文件名
      // 例如：src="images/old_photo.jpg" -> src="images/img_001.jpg"
      const srcPattern = new RegExp(`(src=["']images/)${escapeRegExp(oldName)}(["'])`, 'g');
      updatedContent = updatedContent.replace(srcPattern, `$1${newName}$2`);

      // 替换 data-filename 属性
      // 例如：data-filename="old_photo.jpg" -> data-filename="img_001.jpg"
      const dataFilenamePattern = new RegExp(`(data-filename=["'])${escapeRegExp(oldName)}(["'])`, 'g');
      updatedContent = updatedContent.replace(dataFilenamePattern, `$1${newName}$2`);

      // 替换 alt 属性（如果恰好等于文件名）
      // 例如：alt="old_photo.jpg" -> alt="img_001.jpg"
      const altPattern = new RegExp(`(alt=["'])${escapeRegExp(oldName)}(["'])`, 'g');
      updatedContent = updatedContent.replace(altPattern, `$1${newName}$2`);
    });

    return {
      ...chapter,
      content: updatedContent,
    };
  });
}

/**
 * 转义正则表达式中的特殊字符
 * 防止文件名中的特殊字符（如 . () [] 等）被误解析
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
