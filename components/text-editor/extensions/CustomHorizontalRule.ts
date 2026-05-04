import HorizontalRule from '@tiptap/extension-horizontal-rule';

// 扩展默认的水平线，让它能支持自定义 class（用于不同样式的分割线）
export const CustomHorizontalRule = HorizontalRule.extend({
  addAttributes() {
    return {
      class: {
        default: null,
        // 从 HTML 中读取 class 属性
        parseHTML: element => element.getAttribute('class'),
        // 渲染时把 class 写入 HTML
        renderHTML: attributes => {
          if (!attributes.class) return {};
          return { class: attributes.class };
        },
      },
    };
  },

  // 告诉 Tiptap 如何解析来自粘贴或加载的 HTML
  parseHTML() {
    return [
      {
        tag: 'hr',
      },
    ];
  },

  // 告诉 Tiptap 如何把节点渲染成 HTML
  renderHTML({ HTMLAttributes }) {
    return ['hr', HTMLAttributes];
  },
});
