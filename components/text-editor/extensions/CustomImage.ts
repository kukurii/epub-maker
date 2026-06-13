/**
 * CustomImage - 自定义图片扩展（修复 base64 显示问题）
 *
 * 问题：TipTap 默认的 ImageExtension 只保留 src、alt、title 属性，
 * 会在解析 HTML 时丢弃 data-id、data-filename 等自定义属性。
 *
 * 修复：
 * 1. 扩展保留 data-id 和 data-filename
 * 2. 确保 src 属性正确解析和渲染 base64 数据
 * 3. 添加调试日志帮助排查问题
 */

import ImageExtension from '@tiptap/extension-image';

export const CustomImage = ImageExtension.extend({
  addAttributes() {
    return {
      // 继承原有属性（src、alt、title、class 等）
      ...this.parent?.(),

      // 🔧 确保 src 正确处理 base64
      src: {
        default: null,
        parseHTML: (element) => {
          const src = element.getAttribute('src');
          // 保留完整的 src，包括 base64 data URL
          return src;
        },
        renderHTML: (attributes) => {
          if (!attributes.src) return {};
          return { src: attributes.src };
        },
      },

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

  // 🔧 添加解析规则，确保正确处理 base64
  parseHTML() {
    return [
      {
        tag: 'img[src]',
        getAttrs: (node) => {
          const element = node as HTMLElement;
          const src = element.getAttribute('src');

          // 调试日志
          if (src?.startsWith('data:image')) {
            console.log('🖼️ CustomImage parseHTML: 检测到 base64 图片', {
              src: src.substring(0, 50) + '...',
              dataId: element.getAttribute('data-id'),
              dataFilename: element.getAttribute('data-filename'),
            });
          }

          return {
            src,
            alt: element.getAttribute('alt'),
            title: element.getAttribute('title'),
            'data-id': element.getAttribute('data-id'),
            'data-filename': element.getAttribute('data-filename'),
            'data-missing-name': element.getAttribute('data-missing-name'),
          };
        },
      },
    ];
  },
});
