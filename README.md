# 📚 EPUB Maker (EPUB 制作工具)

<div align="center">

![GitHub Stars](https://img.shields.io/github/stars/kukurii/epub-maker?style=flat-square)
![GitHub Forks](https://img.shields.io/github/forks/kukurii/epub-maker?style=flat-square)
![GitHub License](https://img.shields.io/github/license/kukurii/epub-maker?style=flat-square)
![Deployment Status](https://img.shields.io/github/deployments/kukurii/epub-maker/github-pages?label=deploy&style=flat-square)

一个功能强大的在线 EPUB 电子书制作应用，使用 React 19 和 TypeScript 构建。轻松创建、编辑和导出专业级的 EPUB 3 格式电子书。

[立即体验](https://kukurii.github.io/epub-maker/) | [报告 Bug](https://github.com/kukurii/epub-maker/issues) | [提交建议](https://github.com/kukurii/epub-maker/issues)

</div>

---

## ✨ 主要功能

### 📖 章节管理
- **可视化编辑**：使用功能齐全的富文本编辑器编写内容。
- **灵活结构**：支持多级章节嵌套，自动生成符合标准的目录（NCX/Nav）。
- **拖拽排序**：通过直观的界面轻松调整书籍结构。

### 🎨 智能封面设计
- **AI 赋能**：集成 Google Gemini API，根据书籍描述一键生成创意封面。
- **深度自定义**：内置设计工具，支持调整文字布局、字体、渐变背景及特效。
- **实时预览**：所见即所得，确保导出效果完美。

### 📝 完善的元数据
- 支持标准 EPUB 元数据，包括标题、作者、出版社、语言、描述及标签，提升书籍在阅读器中的识别度。

### 🖼️ 资源管理
- **媒体库**：集中管理图片资源（JPG, PNG, WebP, SVG）。
- **文件管理**：支持上传字体、CSS 或其他辅助文件，高度定制阅读体验。

---

## 🚀 技术栈

- **核心框架**: [React 19](https://react.dev/)
- **开发语言**: [TypeScript](https://www.typescriptlang.org/)
- **构建工具**: [Vite 6](https://vitejs.dev/)
- **核心组件**:
  - **JSZip**: 处理 EPUB 容器生成。
  - **Lucide React**: 优美的图标库。
  - **@google/genai**: 驱动 AI 封面生成。

---

## 🛠️ 快速开始

### 开发环境搭建

1. **克隆项目**
   ```bash
   git clone https://github.com/kukurii/epub-maker.git
   cd epub-maker
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置 API (可选)**
   创建 `.env.local` 文件以启用 AI 功能：
   ```env
   VITE_GEMINI_API_KEY=你的密钥
   ```

4. **运行**
   ```bash
   npm run dev
   ```

---

## 🤝 贡献与反馈

欢迎任何形式的贡献！无论是代码提交、功能建议还是文档改进。

1. Fork 本仓库
2. 创建分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源。

---

<div align="center">
Made with ❤️ by kukurii
</div>
