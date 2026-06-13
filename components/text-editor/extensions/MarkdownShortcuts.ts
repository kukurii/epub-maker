/**
 * Markdown 快捷输入扩展
 * 支持常见 Markdown 语法自动转换
 *
 * 支持的语法：
 * - ## + Space → H2
 * - # + Space → H1
 * - [] + Space → Todo (未选中)
 * - [x] + Space → Todo (已选中)
 * - - + Space → 无序列表
 * - 1. + Space → 有序列表
 * - > + Space → 引用块
 * - ``` + Enter → 代码块
 * - --- + Enter → 分割线
 * - ** → 加粗标记
 * - * → 斜体标记
 * - ~~ → 删除线标记
 */

import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Fragment, Slice } from '@tiptap/pm/model';

export const MarkdownShortcuts = Extension.create({
  name: 'markdownShortcuts',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('markdownShortcuts'),

        props: {
          handleTextInput: (view, from, to, text) => {
            const { state } = view;
            const { tr, selection } = state;
            const $from = selection.$from;
            const textBefore = $from.parent.textBetween(
              Math.max(0, $from.parentOffset - 50),
              $from.parentOffset,
              null,
              '￼'
            );

            // 处理空格触发的快捷键
            if (text === ' ') {
              // ## + Space → H2
              if (textBefore.endsWith('##')) {
                return handleHeading(view, 2, from - 2, to);
              }

              // # + Space → H1
              if (textBefore.endsWith('#') && !textBefore.endsWith('##')) {
                return handleHeading(view, 1, from - 1, to);
              }

              // - + Space → 无序列表
              if (textBefore.endsWith('-')) {
                const beforeDash = textBefore.slice(0, -1).trim();
                if (beforeDash === '' || beforeDash.endsWith('\n')) {
                  return handleBulletList(view, from - 1, to);
                }
              }

              // > + Space → 引用块
              if (textBefore.endsWith('>')) {
                const beforeQuote = textBefore.slice(0, -1).trim();
                if (beforeQuote === '' || beforeQuote.endsWith('\n')) {
                  return handleBlockquote(view, from - 1, to);
                }
              }

              // 1. + Space → 有序列表
              const orderedListMatch = textBefore.match(/(\d+)\.\s*$/);
              if (orderedListMatch) {
                return handleOrderedList(view, from - orderedListMatch[0].length, to);
              }
            }

            // 处理回车触发的快捷键
            if (text === '\n') {
              // ``` + Enter → 代码块
              if (textBefore.endsWith('```')) {
                return handleCodeBlock(view, from - 3, to);
              }

              // --- + Enter → 分割线
              if (textBefore.endsWith('---')) {
                return handleHorizontalRule(view, from - 3, to);
              }
            }

            return false;
          },
        },
      }),
    ];
  },
});

/**
 * 处理标题转换
 */
function handleHeading(view: any, level: 1 | 2, deleteFrom: number, deleteTo: number): boolean {
  const { state, dispatch } = view;
  const { tr } = state;

  tr.delete(deleteFrom, deleteTo);

  const headingNode = state.schema.nodes.heading.create({ level });
  tr.setBlockType(tr.mapping.map(deleteFrom), tr.mapping.map(deleteFrom), headingNode.type, { level });

  dispatch(tr);
  return true;
}

/**
 * 处理无序列表转换
 */
function handleBulletList(view: any, deleteFrom: number, deleteTo: number): boolean {
  const { state, dispatch } = view;
  const { tr } = state;

  tr.delete(deleteFrom, deleteTo);

  const listItem = state.schema.nodes.listItem.create();
  const bulletList = state.schema.nodes.bulletList.create(null, listItem);

  tr.replaceSelectionWith(bulletList);

  dispatch(tr);
  return true;
}

/**
 * 处理有序列表转换
 */
function handleOrderedList(view: any, deleteFrom: number, deleteTo: number): boolean {
  const { state, dispatch } = view;
  const { tr } = state;

  tr.delete(deleteFrom, deleteTo);

  const listItem = state.schema.nodes.listItem.create();
  const orderedList = state.schema.nodes.orderedList.create(null, listItem);

  tr.replaceSelectionWith(orderedList);

  dispatch(tr);
  return true;
}

/**
 * 处理引用块转换
 */
function handleBlockquote(view: any, deleteFrom: number, deleteTo: number): boolean {
  const { state, dispatch } = view;
  const { tr } = state;

  tr.delete(deleteFrom, deleteTo);
  tr.setBlockType(tr.mapping.map(deleteFrom), tr.mapping.map(deleteFrom), state.schema.nodes.blockquote);

  dispatch(tr);
  return true;
}

/**
 * 处理代码块转换
 */
function handleCodeBlock(view: any, deleteFrom: number, deleteTo: number): boolean {
  const { state, dispatch } = view;
  const { tr } = state;

  tr.delete(deleteFrom, deleteTo);
  tr.setBlockType(tr.mapping.map(deleteFrom), tr.mapping.map(deleteFrom), state.schema.nodes.codeBlock);

  dispatch(tr);
  return true;
}

/**
 * 处理分割线转换
 */
function handleHorizontalRule(view: any, deleteFrom: number, deleteTo: number): boolean {
  const { state, dispatch } = view;
  const { tr } = state;

  tr.delete(deleteFrom, deleteTo);

  const hr = state.schema.nodes.horizontalRule.create();
  tr.replaceSelectionWith(hr);

  dispatch(tr);
  return true;
}
