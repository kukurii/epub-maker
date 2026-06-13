# Base64 图片显示问题诊断

## 🔴 问题描述

编辑器无法显示 base64 图片，图片转换成 base64 后无法正常显示。

## 🔍 可能的原因

### 1. Base64 数据格式问题
- Base64 数据缺少 `data:image/...;base64,` 前缀
- Base64 编码损坏或不完整

### 2. TipTap 编辑器问题
- `CustomImage` 扩展配置问题
- 编辑器在更新时丢失 src 属性
- CSP (Content Security Policy) 阻止 base64 图片

### 3. HTML 转换问题
- `contentToEditorHTML` 虽然设置了 base64，但后续被覆盖
- DOM 解析器改变了 src 属性

### 4. 图片数据存储问题
- 图片库中的 `data` 字段不是有效的 base64
- EPUB 导入时图片数据没有正确读取

## 🧪 调试步骤

### 步骤 1: 检查图片库数据
打开浏览器控制台，运行：
```javascript
// 查看图片库中的第一张图片
console.log(project.images[0])
```

期望看到：
```javascript
{
  id: "001",
  name: "img_xxx.jpg",
  data: "data:image/jpeg;base64,/9j/4AAQSkZJRg...", // 完整的 data URL
  type: "image/jpeg",
  dimensions: "800×600",
  size: 123456
}
```

### 步骤 2: 检查 contentToEditorHTML 输出
查看控制台日志：
```
🖼️ contentToEditorHTML: 图片库有 5 张图片
✅ 设置 base64 数据成功
```

### 步骤 3: 检查编辑器 DOM
在浏览器中：
1. 右键点击编辑器区域
2. 选择"检查元素"
3. 查找 `<img>` 标签
4. 检查 `src` 属性是否是完整的 base64 数据

### 步骤 4: 检查 CSP 设置
查看控制台是否有类似错误：
```
Refused to load the image 'data:image/jpeg;base64,...' because it violates the following Content Security Policy directive: "img-src 'self'"
```

## 🔧 可能的修复方案

### 方案 1: 确保 base64 数据完整
确认图片的 `data` 字段包含完整的 data URL 前缀。

### 方案 2: 延迟设置图片
TipTap 可能在初始化时覆盖了 src，需要在编辑器准备好后再设置。

### 方案 3: 使用 renderHTML 钩子
在 CustomImage 扩展中添加自定义渲染逻辑。

### 方案 4: 检查 TipTap 配置
确保 `editorProps` 允许 base64 图片。

## 📝 下一步

1. 启动开发服务器：`npm run dev`
2. 打开浏览器控制台 (F12)
3. 导入一个带图片的 EPUB
4. 查看控制台日志
5. 检查图片元素的 src 属性
6. 将发现的问题反馈给我

---

**创建时间**: 2026-06-13  
**问题状态**: 🔍 诊断中
