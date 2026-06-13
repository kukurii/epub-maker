/**
 * CSS 作用域工具函数
 *
 * 将主题 CSS 限定在特定作用域内，避免影响全局样式
 */

// ─── 导出的工具函数 ───

/**
 * 构建编辑器作用域 CSS
 * 将主题 CSS 的选择器限定在 .editor-paper 内
 */
export function buildScopedCSS(
  presetCss: string,
  customCSS: string,
  extraCSS: string
): string {
  const bodyStyles = extractBodyStyles(presetCss);

  return `
    .editor-paper {
      ${sanitizeBodyStyles(bodyStyles)}
      width: 100%;
      max-width: none;
      margin: 0;
      padding: 0;
    }
    ${scopeCSS(presetCss)}
    ${scopeCSS(customCSS)}
    ${scopeCSS(extraCSS)}

    .editor-paper .ProseMirror {
      outline: none !important;
      min-height: 100%;
      height: 100%;
      caret-color: #3b82f6;
    }

    .editor-paper p.caption {
      text-indent: 0;
      text-align: center;
      font-size: 0.9em;
      color: #6b7280;
      margin-top: -0.5em;
      margin-bottom: 1.5em;
    }

    .editor-paper img {
      cursor: pointer;
      transition: all 0.2s ease-in-out;
      max-width: 100%;
      height: auto;
    }
    .editor-paper img.ProseMirror-selectednode {
      outline: 3px solid rgba(59, 130, 246, 0.8);
      outline-offset: 2px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }

    .editor-paper fy {
      display: none;
      page-break-after: always;
      break-after: page;
    }

    .editor-paper .image-missing {
      display: inline-block;
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .editor-paper .image-missing:hover {
      opacity: 0.8;
      transform: scale(1.02);
    }
  `;
}

// ─── 内部工具函数 ───

/**
 * 从 CSS 中提取 body {} 块的样式
 */
function extractBodyStyles(css: string): string {
  const match = css.match(/body\s*\{([^}]*)\}/);
  return match?.[1] || '';
}

/**
 * 过滤掉布局相关的样式属性
 */
function sanitizeBodyStyles(styles: string): string {
  const blockedProps = new Set([
    'width',
    'min-width',
    'max-width',
    'height',
    'min-height',
    'max-height',
    'margin',
    'margin-left',
    'margin-right',
    'margin-top',
    'margin-bottom',
    'padding',
    'padding-left',
    'padding-right',
    'padding-top',
    'padding-bottom',
    'overflow',
    'overflow-x',
    'overflow-y',
    'position',
    'left',
    'right',
    'top',
    'bottom',
    'display',
  ]);

  return styles
    .split(';')
    .map((rule) => rule.trim())
    .filter(Boolean)
    .filter((rule) => {
      const colonIndex = rule.indexOf(':');
      if (colonIndex === -1) return false;
      const property = rule.slice(0, colonIndex).trim().toLowerCase();
      return !blockedProps.has(property);
    })
    .join(';\n      ');
}

/**
 * CSS 作用域函数
 * 将选择器限定在 .editor-paper 内
 */
function scopeCSS(css: string): string {
  if (!css) return '';

  // 去掉注释
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const result: string[] = [];
  let i = 0;

  while (i < stripped.length) {
    // 跳过空白
    while (i < stripped.length && /\s/.test(stripped[i])) i++;
    if (i >= stripped.length) break;

    // @规则
    if (stripped[i] === '@') {
      const atStart = i;
      while (i < stripped.length && stripped[i] !== '{' && stripped[i] !== ';') i++;
      const atHeader = stripped.slice(atStart, i).trim();

      if (i < stripped.length && stripped[i] === ';') {
        result.push(atHeader + ';');
        i++;
        continue;
      }

      if (i < stripped.length && stripped[i] === '{') {
        i++;
        let depth = 1;
        const blockStart = i;
        while (i < stripped.length && depth > 0) {
          if (stripped[i] === '{') depth++;
          else if (stripped[i] === '}') depth--;
          if (depth > 0) i++;
        }
        const blockContent = stripped.slice(blockStart, i);
        i++;

        if (/^@(media|supports|layer)/i.test(atHeader)) {
          result.push(`${atHeader} {\n${scopeCSS(blockContent)}\n}`);
        } else {
          result.push(`${atHeader} {${blockContent}}`);
        }
        continue;
      }
    }

    // 普通规则
    const ruleStart = i;
    while (i < stripped.length && stripped[i] !== '{') i++;
    if (i >= stripped.length) break;

    const rawSelector = stripped.slice(ruleStart, i).trim();
    i++;

    let depth = 1;
    const declStart = i;
    while (i < stripped.length && depth > 0) {
      if (stripped[i] === '{') depth++;
      else if (stripped[i] === '}') depth--;
      if (depth > 0) i++;
    }
    const declarations = stripped.slice(declStart, i).trim();
    i++;

    if (!rawSelector) continue;

    // 处理选择器
    const scopedSelectors = rawSelector
      .split(',')
      .map((sel) => {
        sel = sel.trim();
        if (!sel) return '';

        if (/^(body|html)(\s|$|\.|#|\[|:|,)/i.test(sel) || /^(body|html)$/i.test(sel)) {
          return sel.replace(/^(body|html)/i, '.editor-paper');
        }
        if (sel.startsWith(':root')) {
          return sel.replace(/^:root/, '.editor-paper');
        }
        return `.editor-paper ${sel}`;
      })
      .filter(Boolean)
      .join(', ');

    if (scopedSelectors) {
      result.push(`${scopedSelectors} {\n  ${declarations}\n}`);
    }
  }

  return result.join('\n');
}
