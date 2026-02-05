# 📚 EPUB制作工具 (EPUB Maker)

<div align="center">

一个功能强大的在线EPUB电子书制作应用，使用React和TypeScript构建。轻松创建、编辑和导出专业级的EPUB格式电子书。

由gemini创建：https://ai.studio/apps/drive/1WYZBLyRmq5yTn2mXE__0zAZ0zs4Yxwbs?fullscreenApplet=true

</div>

---

## ✨ 主要功能

### 📖 章节管理
- **创建和编辑章节**：使用富文本编辑器创建书籍内容
- **章节层级**：支持一级和二级标题，自动生成目录结构
- **拖拽排序**：方便地重新排列章节顺序
- **批量操作**：支持章节的删除、复制等操作

### 🎨 封面设计
- **AI生成**：集成Google Gemini API，使用AI自动生成创意封面
- **自定义设计**：完整的设计工具，支持：
  - 文字位置选择（文字覆盖、文字上方、文字下方）
  - 字体和颜色自定义
  - 渐变背景、纹理、图案
  - 透明度和阴影效果
- **CSS代码片段**：预定义的样式模板库
- **实时预览**：所见即所得的编辑体验

### 📝 元数据编辑
- **书籍基本信息**：标题、作者、出版社、出版日期
- **描述信息**：书籍描述、语言、系列、主题标签
- **SEO优化**：完整的元数据支持，便于电子书平台索引

### 🖼️ 图像管理
- **上传图片**：支持多格式图片（JPG、PNG、GIF、WebP等）
- **批量导入**：一次上传多张图片
- **图片库**：清晰的图片管理界面
- **EPUB集成**：自动嵌入到电子书中

### 🎭 样式管理
- **预设样式**：多个内置CSS主题
  - Classic（经典）
  - Modern（现代）
  - Minimal（极简）
  - 更多主题持续添加...
- **自定义CSS**：在全局样式表中添加自定义CSS规则
- **代码片段库**：常用CSS片段快速插入

### 📦 文件管理
- **文件上传**：支持上传额外的文件和资源
- **文件结构**：清晰显示EPUB内部的文件组织
- **资源管理**：管理字体、脚本、配置文件等

### 📱 数据持久化
- **本地存储**：自动保存项目到浏览器LocalStorage
- **自动保存**：修改内容自动保存，无需手动操作
- **断网恢复**：即使断网也能继续工作，恢复连接后自动同步

### 📥 导出功能
- **EPUB3标准**：生成符合EPUB3标准的电子书文件
- **验证优化**：自动处理XHTML转换和验证
- **媒体集成**：完整支持图片、字体、CSS等资源
- **一键下载**：直接下载生成的EPUB文件

---

## 🚀 快速开始

### 前置要求
- **Node.js** v16 或更高版本
- **npm** 或 **yarn** 包管理器

### 安装步骤

1. **克隆仓库**
```bash
git clone https://github.com/yourusername/epub-maker.git
cd epub-maker
```

2. **安装依赖**
```bash
npm install
```

3. **配置API密钥（可选）**
   - 若要使用AI封面生成功能，需要Google Gemini API密钥
   - 创建 `.env.local` 文件：
```bash
VITE_GEMINI_API_KEY=your_api_key_here
```
   - 获取密钥：https://ai.google.dev/

4. **启动开发服务器**
```bash
npm run dev
```
   - 应用将运行在 `http://localhost:5173`

### 构建生产版本
```bash
npm run build
```

### 预览构建结果
```bash
npm run preview
```

---

## 📋 项目结构

```
epub-maker/
├── components/              # React组件
│   ├── ChapterManager.tsx   # 章节管理组件
│   ├── CoverGenerator.tsx   # 封面设计组件
│   ├── Editor.tsx           # 富文本编辑器
│   ├── Sidebar.tsx          # 侧边栏导航
│   └── views/               # 各个视图
│       ├── FilesView.tsx    # 文件管理视图
│       ├── ImagesView.tsx   # 图像管理视图
│       ├── MetadataView.tsx # 元数据编辑视图
│       ├── StructureView.tsx# 结构管理视图
│       └── StylesView.tsx   # 样式管理视图
├── services/
│   └── epubService.ts       # EPUB生成核心服务
├── types.ts                 # TypeScript类型定义
├── App.tsx                  # 主应用组件
├── index.tsx                # 入口文件
├── metadata.json            # 元数据配置
├── vite.config.ts           # Vite配置
└── package.json             # 项目依赖配置
```

---

## 🛠️ 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| **React** | ^19.2.4 | UI框架 |
| **TypeScript** | ~5.8.2 | 类型检查 |
| **Vite** | ^6.2.0 | 构建工具 |
| **JSZip** | ^3.10.1 | ZIP文件处理（生成EPUB） |
| **html-to-image** | ^1.11.13 | 封面转图片 |
| **file-saver** | ^2.0.5 | 文件下载 |
| **lucide-react** | ^0.563.0 | 图标库 |
| **@google/genai** | latest | AI封面生成 |

---

## 📖 使用指南

### 创建新书籍

1. **填写元数据**
   - 在"元数据"标签页填写书籍基本信息
   - 包括标题、作者、描述等

2. **添加章节**
   - 点击"新建章节"按钮
   - 编辑章节标题和内容
   - 支持HTML富文本编辑

3. **设计封面**
   - 在"封面"标签页选择设计方式：
     - **上传图片**：使用现有图片作为封面
     - **自定义设计**：使用设计工具自定义
     - **AI生成**：使用AI自动生成创意封面

4. **添加图片和资源**
   - 在"图像"标签页上传图片
   - 在"文件"标签页管理其他资源

5. **自定义样式**
   - 在"样式"标签页选择预设样式
   - 添加自定义CSS规则

6. **导出EPUB**
   - 点击"导出"按钮
   - 自动下载生成的EPUB文件

### 编辑EPUB

1. **打开已保存项目**
   - 应用自动保存到本地存储
   - 刷新页面后自动恢复项目

2. **修改内容**
   - 任何修改都会自动保存
   - 无需手动点击保存

3. **版本控制**
   - 建议定期导出备份

---

## 🎨 设计特性

### 封面自定义选项

- **布局模式**：文字覆盖 / 文字上方 / 文字下方
- **字体设置**：字体族、大小、颜色、粗细、字间距
- **背景样式**：纯色、渐变、纹理、图片
- **特效**：透明度、阴影、边框
- **垂直对齐**：自定义文字垂直位置
- **CSS代码**：完整的CSS自定义支持

### 样式预设

内置多个精美的CSS主题，可快速应用到电子书：

- **Classic** - 经典简洁风格
- **Modern** - 现代极简风格
- **Minimal** - 极简主义风格
- 更多主题持续增加中...

---

## ⚙️ 配置说明

### 环境变量

创建 `.env.local` 文件：

```env
# Google Gemini API 密钥（用于AI封面生成）
VITE_GEMINI_API_KEY=your_api_key_here

# 其他配置（可选）
VITE_API_BASE_URL=http://localhost:3000
```

### 本地存储键

项目使用 `epub_maker_project_v1` 作为LocalStorage键来保存项目数据。

---

## 🐛 故障排除

### 问题：导出的EPUB无法打开

**解决方案**：
- 确保已填写必要的元数据（标题、作者）
- 检查章节内容是否为有效HTML
- 尝试验证EPUB文件的完整性

### 问题：AI封面生成失败

**解决方案**：
- 确保已配置有效的Gemini API密钥
- 检查网络连接
- 查看浏览器控制台的错误信息
- 确保API配额未超出

### 问题：样式未应用到EPUB

**解决方案**：
- 确保CSS语法正确
- 检查选择器是否与HTML结构匹配
- 避免使用EPUB不支持的CSS属性
- 查看预览中的样式是否生效

### 问题：图片未显示在EPUB中

**解决方案**：
- 确保图片已上传到"图像"标签页
- 检查HTML中的图片引用路径
- 确保图片格式受支持（JPG、PNG、GIF、WebP）
- 检查图片文件大小

---

## 🚀 高级用法

### 自定义CSS

在"样式"标签页的自定义CSS区域添加规则：

```css
/* 调整章节标题样式 */
h1 {
  color: #2c3e50;
  font-family: 'Georgia', serif;
  line-height: 1.5;
  margin-bottom: 1em;
}

/* 调整段落样式 */
p {
  line-height: 1.8;
  text-align: justify;
  margin-bottom: 1em;
}

/* 添加首字下沉效果 */
p:first-of-type::first-letter {
  font-size: 1.5em;
  float: left;
  line-height: 0.8;
}
```

### 使用HTML编辑器

在编辑器中支持完整的HTML：

```html
<h1>章节标题</h1>
<p>段落内容</p>

<!-- 图片引用 -->
<img src="image.jpg" alt="描述" />

<!-- 格式化文本 -->
<strong>粗体</strong>
<em>斜体</em>

<!-- 列表 -->
<ul>
  <li>项目1</li>
  <li>项目2</li>
</ul>
```

### API集成

#### 生成EPUB

```typescript
import { generateEpub } from './services/epubService';

const project = {
  metadata: { /* ... */ },
  chapters: [ /* ... */ ],
  images: [ /* ... */ ],
  cover: null,
  coverDesign: { /* ... */ },
  // ...
};

await generateEpub(project);
```

---

## 📝 更新日志

### v0.0.1 (初始版本)
- ✅ 章节管理
- ✅ EPUB生成和导出
- ✅ 自定义封面设计
- ✅ 图像管理
- ✅ 样式定制
- ✅ AI封面生成（Gemini）
- ✅ 本地自动保存
- ✅ 多语言支持

---

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

### 开发流程

1. Fork本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

### 代码规范

- 使用TypeScript
- 遵循现有代码风格
- 添加必要的注释和文档
- 更新README（如适用）

---

## 📄 许可证

本项目采用 [MIT许可证](LICENSE)。详见LICENSE文件。

---

## 💡 常见问题（FAQ）

### Q: 我的项目数据会被保存多久？
A: 项目数据存储在浏览器的LocalStorage中，不会自动删除。清除浏览器缓存或数据会导致项目丢失。建议定期导出备份。

### Q: 支持哪些EPUB阅读器？
A: 生成的EPUB文件符合EPUB3标准，支持大多数主流电子书阅读器，如：
- Kindle（部分支持）
- Apple Books
- Google Play Books
- Calibre
- Adobe Digital Editions
- 等等

### Q: 可以编辑已导出的EPUB文件吗？
A: 可以。EPUB实际上是ZIP格式，可以用解压工具打开编辑，但建议在本应用中修改后重新导出。

### Q: 支持哪些图片格式？
A: 支持JPG、PNG、GIF、WebP、SVG等现代图片格式。建议使用JPG或PNG以获得最好的兼容性。

### Q: 是否有文件大小限制？
A: 浏览器LocalStorage通常有5-10MB的限制。超大型书籍（包含高清图片）可能会超出限制。

---
