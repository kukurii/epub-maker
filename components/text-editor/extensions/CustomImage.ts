/**
 * CustomImage - 自定义图片扩展
 *
 * 问题：TipTap 默认的 ImageExtension 只保留 src、alt、title 属性，
 * 会在解析 HTML 时丢弃 data-id、data-filename 等自定义属性。
 * 这导致从 EPUB 导入的图片（src 是相对路径，依赖 data-id 匹配）
 * 在编辑器中无法正常显示。
 *
 * 修复：扩展 ImageExtension，让它额外保留 data-id 和 data-filename，
 * 这样图片引用信息不会丢失，图片就能正确显示。
 */

import ImageExtension from '@tiptap/extension-image';

export const CustomImage = ImageExtension.extend({
  addAttributes() {
    return {
      // 继承原有属性（src、alt、title、class 等）
      ...this.parent?.(),

      // 图片 ID：用于在 images 资源列表中查找对应图片
      'data-id': {
        default: null,
        parseHTML: (element) => element.getAttribute('data-id'),
        renderHTML: (attributes) => {
          if (!attributes['data-id']) return {};
          return { 'data-id': attributes['data-id'] };
        },
      },

      // 图片原始文件名：用于显示"图片缺失"时的提示信息
      'data-filename': {
        default: null,
        parseHTML: (element) => element.getAttribute('data-filename'),
        renderHTML: (attributes) => {
          if (!attributes['data-filename']) return {};
          return { 'data-filename': attributes['data-filename'] };
        },
      },

      // 图片缺失标记：用于显示红色虚线框
      'data-missing-name': {
        default: null,
        parseHTML: (element) => element.getAttribute('data-missing-name'),
        renderHTML: (attributes) => {
          if (!attributes['data-missing-name']) return {};
          return { 'data-missing-name': attributes['data-missing-name'] };
        },
      },
    };
  },
});
