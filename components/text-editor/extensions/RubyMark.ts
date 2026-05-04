import { Node, mergeAttributes } from '@tiptap/core';

// Ruby 注音实现说明：
// ProseMirror 的 Mark 格式无法在文本占位符(0)旁边同时插入 <rt> 子元素，
// 所以改为 inline Node 实现：将"被注音的文字"和"注音文字"都存在节点属性里，
// 渲染为标准的 <ruby>文字<rt>注音</rt></ruby> HTML 结构。

export interface RubyOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    ruby: {
      /**
       * 插入一个注音节点：将选中的文字替换为 ruby 节点
       * @param text 被注音的文字（原文）
       * @param rt 注音文字（小字）
       */
      setRuby: (attributes: { text: string; rt: string }) => ReturnType;
      /**
       * 将光标处的注音节点还原为普通文字
       */
      unsetRuby: () => ReturnType;
    };
  }
}

export const RubyMark = Node.create<RubyOptions>({
  name: 'ruby',

  // inline node，可以在段落中使用（和文字混排）
  inline: true,
  group: 'inline',
  atom: true, // 作为一个整体，不能在内部编辑

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      // 被注音的原文
      text: {
        default: '',
        parseHTML: element => element.querySelector('ruby')?.childNodes[0]?.textContent
          || element.childNodes[0]?.textContent
          || '',
      },
      // 注音小字
      rt: {
        default: '',
        parseHTML: element => {
          const rtEl = element.querySelector('rt') || (element.tagName === 'RUBY' ? element.querySelector('rt') : null);
          return rtEl?.textContent || '';
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        // 解析 <ruby>文字<rt>注音</rt></ruby> 结构
        tag: 'ruby',
        getAttrs: element => {
          const el = element as HTMLElement;
          const rtEl = el.querySelector('rt');
          const rt = rtEl?.textContent || '';
          // 获取 ruby 节点中除 rt 之外的文字内容
          const text = Array.from(el.childNodes)
            .filter(n => n.nodeName !== 'RT')
            .map(n => n.textContent)
            .join('');
          return { text, rt };
        },
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const { text, rt } = node.attrs;
    // 输出标准 ruby HTML: <ruby>文字<rt>注音</rt></ruby>
    return [
      'ruby',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      text,
      ['rt', {}, rt],
    ];
  },

  addCommands() {
    return {
      // 将当前选中文字替换为注音节点
      setRuby:
        ({ text, rt }) =>
        ({ chain, state }) => {
          const { from, to } = state.selection;
          return chain()
            .focus()
            .deleteRange({ from, to })
            .insertContentAt(from, {
              type: this.name,
              attrs: { text, rt },
            })
            .run();
        },

      // 将光标处的 ruby 节点还原为普通文字
      unsetRuby:
        () =>
        ({ chain, state, tr }) => {
          const { from } = state.selection;
          // 查找光标周围的 ruby node
          let found = false;
          state.doc.nodesBetween(Math.max(0, from - 1), Math.min(state.doc.content.size, from + 1), (node, pos) => {
            if (node.type.name === 'ruby' && !found) {
              found = true;
              const text = node.attrs.text || '';
              // 用普通文字替换 ruby 节点
              chain()
                .focus()
                .command(({ tr: transaction }) => {
                  transaction.replaceWith(pos, pos + node.nodeSize, state.schema.text(text));
                  return true;
                })
                .run();
            }
          });
          return found;
        },
    };
  },
});
