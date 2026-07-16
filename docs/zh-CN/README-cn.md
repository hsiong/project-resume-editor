# 简历实时编辑器

[English](../../README.md) | 简体中文

<p align="center">
  <a href="../../LICENSE"><img alt="GPL-3.0 开源协议" src="https://img.shields.io/badge/license-GPL--3.0-2563eb.svg"></a>
  <img alt="需要 Node.js 18 或更高版本" src="https://img.shields.io/badge/Node.js-18%2B-339933.svg">
  <img alt="使用 Vite 构建" src="https://img.shields.io/badge/built%20with-Vite-646CFF.svg">
</p>

**在本机编辑多板块 Markdown 简历，输入时实时预览适合打印的 A4 页面，并通过浏览器导出同一套排版。**

<p align="center">
  <img src="../images/readme/editor-overview.png" alt="简历实时编辑器左侧显示 Markdown、右侧显示五页 A4 预览" width="100%">
  <br>
  <em>在一个工作区内完成 Markdown 编辑、分页预览、本地保存和 PDF 导出。</em>
</p>

## 它能做什么

- **以本地文件为唯一数据源。** 内置 Node.js 服务读取配置好的 Markdown 文档，点击保存时将修改写回磁盘。
- **即时预览打印结果。** 编辑器按 A4 尺寸渲染页面、显示当前页数，并在内容变化时重新分页。
- **分板块管理长简历。** 可在个人信息、项目经验和开源贡献标签之间切换，无需维护一个过长的文档。
- **支持常用简历排版。** 通过 `markdown-it` 渲染标题、列表、链接、表格、内联 HTML 和显式分页符。
- **通过浏览器导出。** PDF 按钮会对屏幕上同一套 A4 预览调用浏览器原生打印窗口。

## 快速开始

### 环境要求

- Node.js 18 或更高版本
- npm
- 现代桌面浏览器

### 本地运行

```bash
git clone https://github.com/hsiong/project-resume-editor.git
cd project-resume-editor/code
npm install
npm run build
node server.mjs 5173 dist
```

打开 [http://localhost:5173](http://localhost:5173)。使用完毕后，在终端按 `Ctrl+C` 停止服务。

如需更换端口，只需替换最后一条命令中的 `5173`：

```bash
node server.mjs 5174 dist
```

## 日常使用流程

1. 在标签栏选择要编辑的板块。
2. 在左侧修改 Markdown，右侧 A4 预览会同步更新。
3. 点击**保存**，将所有已配置板块写回本地文件。
4. 点击**导出 PDF**，然后在浏览器打印窗口中选择**另存为 PDF**。

**重新读取**会再次从磁盘加载文件，并替换浏览器中当前的编辑状态。重新读取前，请先保存需要保留的修改。

## 排版与分页

个人信息板块使用结构化 Markdown 生成封面和概览页；其他板块可以使用常规 Markdown，包括表格和列表。

需要精确分页时，在两段内容之间插入：

```html
<div class="page-break"></div>
```

分页标记只控制预览和打印结果，本身不会显示在最终文档中。

## 本地持久化原理

| 步骤 | 组件 | 结果 |
| --- | --- | --- |
| 读取 | `code/server.mjs` | 通过 `GET /api/docs` 读取 `code/data/` 下配置好的文档 |
| 编辑 | `code/src/main.js` | 在浏览器内存中保存当前 Markdown，并重新渲染预览 |
| 保存 | 本地 HTTP API | 将各板块发送至 `POST /api/docs/:id`，并覆盖对应文件 |
| 导出 | 浏览器打印引擎 | 只打印 A4 预览页面 |

简历内容由本地服务处理，并保存在本地 Markdown 文件中。默认视觉模板引用了部分远程装饰图片，简历中也可能包含远程头像或链接地址。如果需要完全离线使用，请将这些资源替换为本地文件。

## 项目结构

```text
.
├── code/
│   ├── data/          # 本地 Markdown 数据源
│   ├── src/           # 编辑器、渲染、分页与样式
│   ├── server.mjs     # 静态服务与本地文档 API
│   └── package.json   # Vite 与 markdown-it 依赖
├── docs/              # 中文 README 与产品图片
├── LICENSE
└── README.md
```

## 开发

首次安装依赖后，可以用生产构建完成最小项目校验：

```bash
cd code
npm install
npm run build
```

项目保持了较小的技术栈：Vite 驱动的原生 JavaScript 前端、负责渲染的 `markdown-it`，以及提供本地持久化能力的 Node.js HTTP 服务。

## 当前边界

- 工作区以桌面端为主，目前至少需要 `1080px` 的横向空间。
- PDF 效果取决于浏览器打印引擎和所选打印参数。
- 自动分页会在页面间移动顶层块和列表项；需要严格控制位置时请使用显式分页符。
- 保存操作会更新全部三个已配置板块，而不只是当前标签页。

## 参与贡献

欢迎提交 Issue 和 Pull Request。请保持改动聚焦，运行 `npm run build` 完成验证，并在 Pull Request 中说明可见的打印或分页差异。

## 开源协议

简历实时编辑器基于 [GNU General Public License v3.0](../../LICENSE) 发布。
