# 文本编辑器重写计划

## 📋 项目概述

重写目录管理界面的文本编辑器，优化界面大小、响应式布局和用户体验。

## 🎯 核心目标

1. **响应式优化** - 让编辑器在不同屏幕尺寸下都有最佳显示效果
2. **界面大小优化** - 调整编辑器纸张区域、工具栏、字体大小等
3. **布局灵活性** - 支持目录列表宽度调整，编辑器自适应
4. **移动端体验** - 优化小屏幕下的操作和显示

## 📊 当前问题分析

### 1. 布局问题
- **目录列表固定宽度** (`w-80` = 320px) - 无法调整，空间浪费或不足
- **编辑器纸张固定最大宽度** (`max-w-[800px]`) - 小屏幕下可能过宽
- **最小高度不灵活** - `min-h-[900px]` 在平板上可能过高

### 2. 工具栏问题
- **按钮过多** - 在小屏幕上可能拥挤
- **响应式不够细致** - 中等屏幕下体验不佳
- **快捷操作不够明显** - 常用功能隐藏太深

### 3. 编辑体验问题
- **字体大小固定** - 不同用户、不同设备需求不同
- **编辑区域内边距** - 移动端 `p-6` 可能浪费空间
- **状态栏信息** - 移动端显示不完整

### 4. 性能问题
- **组件文件过大** - TextEditor.tsx 有 635 行
- **CSS 作用域计算** - 每次渲染都重新计算

## 🔧 重写方案

### 阶段一：布局系统重构 (优先级：🔴 最高)

#### 1.1 可调整的目录列表宽度
```typescript
// 新增功能：拖拽调整目录宽度
- 默认宽度：320px (w-80)
- 最小宽度：240px
- 最大宽度：480px
- 保存用户偏好到 localStorage
```

**实现要点：**
- 在目录和编辑器之间添加拖拽分割条
- 使用 `ResizeObserver` 监听宽度变化
- 状态管理：新增 `sidebarWidth` 状态

**文件修改：**
- `components/layout/ViewContainer.tsx` - 添加拖拽逻辑
- 新建 `hooks/useResizableSidebar.ts` - 封装拖拽逻辑

#### 1.2 编辑器区域响应式优化
```scss
// 编辑器纸张宽度分级
移动端 (< 768px):  100% (无左右 padding)
平板 (768-1024px): max-w-[680px]
桌面 (1024-1440px): max-w-[760px]
大屏 (> 1440px):   max-w-[840px]
```

**实现要点：**
- 使用 Tailwind 的响应式断点
- 动态计算内边距：`p-4 md:p-8 lg:p-12 xl:p-16`
- 纸张高度自适应：移除固定 `min-h`，改用 `min-h-screen`

**文件修改：**
- `components/text-editor/TextEditor.tsx` - 调整容器类名

#### 1.3 移动端全屏模式
```typescript
// 移动端编辑器占满整个视口
- 隐藏不必要的装饰元素（水印、阴影）
- 状态栏固定在底部
- 工具栏可收起
```

**实现要点：**
- 检测屏幕尺寸，自动切换模式
- 新增 `isMobile` 状态
- 工具栏添加折叠按钮

---

### 阶段二：工具栏重构 (优先级：🟡 高)

#### 2.1 工具栏分组优化
```
当前结构：
[撤销/重做] | [标题] | [格式] | [对齐] | [插入] | [拆分] | [查找]

优化后结构：
核心区（始终显示）：
  [撤销/重做] | [标题] | [粗/斜/下划线]

扩展区（桌面端显示）：
  [删除线/链接/引用/注音] | [对齐]

操作区（始终显示）：
  [图片] [拆分] | [更多▾] [查找]
```

**实现要点：**
- 使用 `<ButtonGroup>` 组件明确分组
- "更多"按钮收纳次要功能
- 移动端优先显示最常用操作

**文件修改：**
- `components/text-editor/EditorToolbar.tsx` - 重新排版

#### 2.2 工具栏响应式断点
```typescript
// 三种显示模式
- 移动端 (< 640px): 精简模式，只显示核心+操作区
- 平板 (640-1024px): 标准模式，显示核心+部分扩展+操作区
- 桌面 (> 1024px): 完整模式，显示所有按钮
```

#### 2.3 快捷操作提示
```typescript
// 工具栏顶部显示快捷键提示（可关闭）
"💡 快捷键：Ctrl+B 加粗 | Ctrl+F 查找 | Ctrl+Enter 分段"
```

**实现要点：**
- 新增提示条组件 `<ToolbarTips>`
- 用户可永久关闭（保存到 localStorage）

---

### 阶段三：编辑体验优化 (优先级：🟢 中)

#### 3.1 字体大小调整
```typescript
// 新增字体大小设置
- 小号：14px
- 默认：16px ⭐
- 中号：18px
- 大号：20px
```

**实现要点：**
- 在状态栏右侧添加字体调整按钮 `[A-] [A+]`
- 保存到 `localStorage`
- 应用到 `.editor-paper` 的 `font-size`

**文件修改：**
- `components/text-editor/TextEditor.tsx` - 添加字体状态
- 新建 `hooks/useEditorSettings.ts` - 管理编辑器设置

#### 3.2 编辑区内边距优化
```scss
// 根据屏幕宽度动态调整
移动端:  p-4  (16px)
平板:    p-8  (32px)
桌面:    p-12 (48px)
大屏:    p-16 (64px)
```

#### 3.3 状态栏信息优化
```typescript
// 桌面端：完整信息
[📏 1,234 字] [⏱ 约 5 分钟阅读] [字体 A- A+]

// 移动端：精简信息
[1,234 字] [5 min] [A]
```

**实现要点：**
- 使用响应式显示
- 图标替代文字（移动端）

---

### 阶段四：组件拆分与性能优化 (优先级：🟢 中)

#### 4.1 组件拆分策略
```
当前：TextEditor.tsx (635 行)

拆分后：
- TextEditor.tsx (主组件，< 200 行)
  ├─ EditorToolbar.tsx (工具栏，已独立)
  ├─ EditorContent.tsx (编辑区域)
  ├─ EditorStatusBar.tsx (状态栏) ⭐ 新建
  ├─ EditorPaper.tsx (纸张容器) ⭐ 新建
  └─ FindReplaceBar.tsx (查找替换，已独立)
```

**新组件职责：**

**EditorStatusBar.tsx** - 底部状态栏
```typescript
interface EditorStatusBarProps {
  charCount: number;
  readingTime: number;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
}
```

**EditorPaper.tsx** - 编辑器纸张容器
```typescript
interface EditorPaperProps {
  children: React.ReactNode;
  chapterTitle: string;
  fontSize: number;
  scopedCSS: string;
  onDragHandlers: {...};
}
```

#### 4.2 CSS 作用域优化
```typescript
// 问题：每次渲染都重新计算 scopedCSS
// 方案：使用 useMemo 缓存，依赖项精确控制

const scopedCSS = useMemo(() => {
  return buildScopedCSS(presetCss, project.customCSS, extraCSS);
}, [
  project.activeStyleId,
  project.customCSS,
  project.isPresetStyleActive,
  extraCSS
]);
```

**优化要点：**
- 将 `buildScopedCSS` 等工具函数移到单独文件
- 新建 `utils/cssScoper.ts`

#### 4.3 图片上传逻辑优化
```typescript
// 将 useImageUpload hook 的逻辑简化
// 减少不必要的重新渲染
```

---

### 阶段五：新增功能 (优先级：🔵 低)

#### 5.1 编辑器主题切换
```typescript
// 用户可选择编辑器背景色
- 白纸模式（默认）
- 护眼模式（浅绿色）
- 夜间模式（深色背景）
```

#### 5.2 专注模式
```typescript
// 隐藏左侧目录，编辑器居中
// 按 F11 或点击按钮切换
```

#### 5.3 行号显示
```typescript
// 左侧显示行号（可选）
// 方便定位和引用
```

---

## 📁 文件清单

### 需要修改的文件
1. ✏️ `components/text-editor/TextEditor.tsx` - 主要重构
2. ✏️ `components/text-editor/EditorToolbar.tsx` - 工具栏优化
3. ✏️ `components/layout/ViewContainer.tsx` - 添加拖拽分割
4. ✏️ `App.tsx` - 可能需要调整状态管理

### 需要新建的文件
1. ⭐ `components/text-editor/EditorStatusBar.tsx` - 状态栏组件
2. ⭐ `components/text-editor/EditorPaper.tsx` - 纸张容器组件
3. ⭐ `hooks/useResizableSidebar.ts` - 侧边栏拖拽调整
4. ⭐ `hooks/useEditorSettings.ts` - 编辑器设置管理
5. ⭐ `utils/cssScoper.ts` - CSS 作用域工具函数

### 需要删除的代码
- `TextEditor.tsx` 中的内联工具函数（移到 `utils/cssScoper.ts`）
- 重复的响应式类名（统一管理）

---

## 🎨 设计规范

### 颜色主题
```scss
// 编辑器区域
--editor-bg: #F9FAFB;        // 背景
--editor-paper: #FFFFFF;      // 纸张
--editor-border: #E5E7EB;     // 边框
--editor-shadow: 0 4px 20px rgba(0,0,0,0.08);

// 工具栏
--toolbar-bg: #FFFFFF;
--toolbar-border: #E5E7EB;
--toolbar-hover: #F3F4F6;
--toolbar-active: #DBEAFE;

// 状态栏
--status-bg: #FFFFFF;
--status-text: #6B7280;
```

### 间距规范
```scss
// 移动端
--mobile-padding: 1rem;      // 16px
--mobile-margin: 0.5rem;     // 8px

// 桌面端
--desktop-padding: 2rem;     // 32px
--desktop-margin: 1rem;      // 16px
```

### 字体规范
```scss
--font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
--font-size-small: 14px;
--font-size-base: 16px;
--font-size-large: 18px;
--line-height: 1.8;
```

---

## ✅ 实施步骤

### Phase 1: 准备工作 (1 天)
- [ ] 创建功能分支 `feature/editor-rewrite`
- [ ] 备份当前 TextEditor.tsx 为 `TextEditor.backup.tsx`
- [ ] 创建新组件文件骨架

### Phase 2: 布局系统 (2-3 天)
- [ ] 实现 `useResizableSidebar` hook
- [ ] 修改 `ViewContainer.tsx` 添加拖拽分割条
- [ ] 优化 `TextEditor.tsx` 响应式布局
- [ ] 测试不同屏幕尺寸下的显示效果

### Phase 3: 工具栏优化 (1-2 天)
- [ ] 重构 `EditorToolbar.tsx` 按钮分组
- [ ] 实现响应式显示逻辑
- [ ] 优化"更多"菜单
- [ ] 测试移动端工具栏

### Phase 4: 编辑体验 (1-2 天)
- [ ] 创建 `EditorStatusBar.tsx`
- [ ] 实现字体大小调整功能
- [ ] 创建 `useEditorSettings` hook
- [ ] 优化内边距和间距
- [ ] 测试编辑体验

### Phase 5: 组件拆分 (1 天)
- [ ] 创建 `EditorPaper.tsx`
- [ ] 创建 `utils/cssScoper.ts`
- [ ] 重构 `TextEditor.tsx` 主组件
- [ ] 清理冗余代码

### Phase 6: 测试与优化 (1-2 天)
- [ ] 全面测试所有功能
- [ ] 性能测试和优化
- [ ] 修复 bug
- [ ] 调整细节

### Phase 7: 文档与发布 (0.5 天)
- [ ] 更新代码注释
- [ ] 提交 commit（分阶段提交）
- [ ] 合并到主分支
- [ ] 删除备份文件

---

## 🧪 测试清单

### 功能测试
- [ ] 目录宽度拖拽调整
- [ ] 编辑器在不同屏幕尺寸下的显示
- [ ] 移动端全屏编辑
- [ ] 工具栏所有按钮功能
- [ ] 字体大小调整
- [ ] 查找替换功能
- [ ] 图片上传和插入
- [ ] 章节拆分
- [ ] 撤销/重做

### 响应式测试
- [ ] iPhone SE (375px)
- [ ] iPad (768px)
- [ ] iPad Pro (1024px)
- [ ] MacBook (1440px)
- [ ] 4K 显示器 (2560px)

### 性能测试
- [ ] 大文档 (> 10,000 字) 编辑流畅度
- [ ] 内存占用
- [ ] CSS 计算性能
- [ ] 图片处理性能

### 兼容性测试
- [ ] Chrome
- [ ] Safari
- [ ] Firefox
- [ ] Edge

---

## 📈 预期效果

### 性能提升
- 组件渲染速度提升 **20-30%**
- 内存占用降低 **15%**
- CSS 计算性能提升 **40%**

### 用户体验提升
- 移动端编辑体验 **显著改善**
- 响应式布局 **完美适配** 所有设备
- 操作流畅度 **提升 30%**

### 代码质量提升
- 组件文件行数减少 **50%**
- 代码可维护性 **显著提升**
- 功能模块化 **清晰明确**

---

## 🔄 后续迭代

### v2.0 规划
- AI 辅助写作功能
- 多人协作编辑
- 版本历史管理
- 云端同步

### v2.1 规划
- 语法高亮（针对特殊格式）
- 自定义快捷键
- 宏命令支持
- 插件系统

---

## 📝 备注

- 本次重写保持功能完整性，不删除现有功能
- 优先保证稳定性，再追求性能
- 保持与现有代码风格一致
- 所有改动都要有注释说明

---

**计划制定时间：** 2026-06-13  
**预计完成时间：** 7-10 天  
**负责人：** Kiro AI Assistant  
**审核人：** 用户

---

## 🚀 开始实施

准备好后，执行以下命令开始重写：

```bash
# 1. 创建功能分支
git checkout -b feature/editor-rewrite

# 2. 备份当前文件
cp components/text-editor/TextEditor.tsx components/text-editor/TextEditor.backup.tsx

# 3. 开始开发...
```
