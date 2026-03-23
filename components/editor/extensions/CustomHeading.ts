import Heading from '@tiptap/extension-heading';
import { Plugin, PluginKey } from '@tiptap/pm/state';

export const CustomHeading = Heading.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      id: {
        default: null,
        parseHTML: element => element.getAttribute('id'),
        renderHTML: attributes => {
          if (!attributes.id) return {};
          return { id: attributes.id };
        },
      },
    };
  },

  addProseMirrorPlugins() {
    const plugins = this.parent?.() || [];
    
    plugins.push(
      new Plugin({
        key: new PluginKey('headingId'),
        appendTransaction: (transactions, oldState, newState) => {
          // 只在文档变化时扫描
          if (!transactions.some(tr => tr.docChanged)) {
            return null;
          }

          let tr = newState.tr;
          let modified = false;

          newState.doc.descendants((node, pos) => {
            if (node.type.name === this.name && !node.attrs.id) {
              const id = 'heading-' + Math.random().toString(36).substr(2, 9);
              tr.setNodeMarkup(pos, undefined, { ...node.attrs, id });
              modified = true;
            }
          });

          return modified ? tr : null;
        },
      })
    );
    
    return plugins;
  },
});
