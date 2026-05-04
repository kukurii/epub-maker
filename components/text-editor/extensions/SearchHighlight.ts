import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

// 这个 PluginKey 用来在编辑器状态中存储高亮数据
export const searchHighlightKey = new PluginKey<DecorationSet>('searchHighlight');

/**
 * SearchHighlight 扩展
 * 
 * 工作原理：
 * - 通过 TipTap 的 Decoration 机制，在编辑器视图层叠加高亮颜色
 * - 不修改文档内容，只是视觉上的装饰
 * - 所有匹配项：黄色背景
 * - 当前匹配项：橙色背景（优先显示）
 * 
 * 这样不论编辑器是否有焦点，高亮都始终可见。
 */
export const SearchHighlight = Extension.create({
  name: 'searchHighlight',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: searchHighlightKey,
        state: {
          // 初始状态：没有任何高亮
          init() {
            return DecorationSet.empty;
          },
          // 当外部调用 setSearchHighlights transaction 时，更新装饰集合
          apply(tr, oldSet) {
            // 尝试从 transaction meta 中读取新的高亮信息
            const meta = tr.getMeta(searchHighlightKey);
            if (meta !== undefined) {
              return meta; // 直接替换为新的 DecorationSet
            }
            // 如果文档内容变化了，需要把装饰的位置映射到新文档
            if (tr.docChanged) {
              return oldSet.map(tr.mapping, tr.doc);
            }
            return oldSet;
          },
        },
        // 把当前 state 里的 DecorationSet 提供给视图层渲染
        props: {
          decorations(state) {
            return searchHighlightKey.getState(state);
          },
        },
      }),
    ];
  },
});

/**
 * 构建高亮 DecorationSet
 * @param doc      当前 ProseMirror 文档
 * @param matches  所有匹配项的 {from, to} 列表
 * @param activeIndex  当前激活的匹配项索引（-1 表示无）
 */
export const buildHighlightDecorations = (
  doc: import('@tiptap/pm/model').Node,
  matches: Array<{ from: number; to: number }>,
  activeIndex: number,
): DecorationSet => {
  if (matches.length === 0) return DecorationSet.empty;

  const decorations = matches.map((match, index) => {
    const isActive = index === activeIndex;
    return Decoration.inline(match.from, match.to, {
      // 激活项用橙色，其他用黄色
      style: isActive
        ? 'background-color: #fb923c; color: white; border-radius: 2px;'
        : 'background-color: #fef08a; color: #1a1a1a; border-radius: 2px;',
      // 用 class 方便 CSS 覆盖
      class: isActive ? 'search-highlight-active' : 'search-highlight',
    });
  });

  return DecorationSet.create(doc, decorations);
};
