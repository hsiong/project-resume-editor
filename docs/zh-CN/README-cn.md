# 简历实时编辑器

[English](../../README.md) | 简体中文

**一款本地优先的 Markdown 简历工作区：分板块编辑内容、即时查看可打印的 A4 效果，并直接通过浏览器导出。**

<p align="center">
  <a href="../../LICENSE"><img alt="GPL-3.0 开源协议" src="https://img.shields.io/badge/license-GPL--3.0-2563eb.svg"></a>
  <img alt="需要 Node.js 18 或更高版本" src="https://img.shields.io/badge/Node.js-18%2B-339933.svg">
  <img alt="使用 Vite 构建" src="https://img.shields.io/badge/built%20with-Vite-646CFF.svg">
</p>

<p align="center">
  <img src="../images/readme/editor-overview.png" alt="简历实时编辑器显示 Markdown 源码、操作按钮和完整样式的五页 A4 预览" width="100%">
  <br>
  <em>使用安全演示数据运行真实应用后捕获；截图前已通过样式表、字体、图片资源和关键计算样式检查。</em>
</p>

## 为什么使用它

简历实时编辑器把内容编写和版面确认放在同一个桌面工作区：左侧维护纯 Markdown，右侧将完整简历重新分页为 A4 页面。

- **即时确认打印效果**——Markdown 变化时同步更新页数和 A4 分页。
- **本地文件保持权威**——内置 Node.js 服务直接读取和写入配置好的磁盘文档。
- **按板块专注编辑**——在个人信息、项目经验和开源贡献间切换，无需维护一个过长的源文件。
- **支持实用 Markdown 排版**——通过 <code>markdown-it</code> 渲染标题、列表、链接、表格、内联 HTML 和显式分页符。
- **无需额外 PDF 渲染器**——导出时直接打开浏览器打印窗口，使用预览中的同一套页面。

## 快速开始

### 环境要求

- Node.js 18 或更高版本
- npm
- 现代桌面浏览器

~~~bash
git clone https://github.com/hsiong/project-resume-editor.git
cd project-resume-editor/code
npm ci
npm run build
node server.mjs 5173 dist
~~~

打开 [http://localhost:5173](http://localhost:5173)。使用完毕后，在终端按 <code>Ctrl+C</code> 停止服务。

修改第一个参数即可更换端口：

~~~bash
node server.mjs 5174 dist
~~~

## 日常使用流程

| 操作 | 实际行为 |
| --- | --- |
| 选择标签 | 切换编辑器当前显示的 Markdown 文档 |
| 在编辑器输入 | 更新内存中的文档，并重新分页完整预览 |
| **保存** | 将全部已配置板块写回各自映射的本地文件 |
| **重新读取** | 使用磁盘上的最新内容替换浏览器状态 |
| **导出 PDF** | 为 A4 预览页面打开浏览器原生打印窗口 |

选择**重新读取**前，请先保存需要保留的修改。当前保存操作会更新所有已配置板块，而不只是活动标签页。

## 内容编写与分页

个人信息文档使用结构化 Markdown 填充封面和概览页面，其余板块使用常规 Markdown，可包含表格、列表、链接和内联 HTML。

当自动分页不够精确时，可以插入显式分页符：

~~~html
<div class="page-break"></div>
~~~

该标记只控制预览和打印分页，不会出现在导出的文档中。

## 工作原理

~~~mermaid
flowchart LR
    Files[本地 Markdown 文件] -->|GET /api/docs| Server[Node.js 服务]
    Server --> Editor[浏览器编辑器]
    Editor --> Renderer[markdown-it 渲染器]
    Renderer --> Preview[A4 分页预览]
    Editor -->|保存全部板块| Server
    Preview -->|导出 PDF| Print[浏览器打印窗口]
~~~

简历内容保存在本地 Markdown 文件中，并由本地 HTTP 服务处理。视觉模板目前引用了远程装饰图片，简历内容也可能引用远程头像或链接。如需完全离线使用，请将这些资源替换为本地文件。

## 项目结构

~~~text
.
├── code/
│   ├── data/          # 本地 Markdown 数据源
│   ├── src/           # 编辑器、渲染、分页和打印样式
│   ├── server.mjs     # 静态服务与本地文档 API
│   └── package.json   # Vite 与 markdown-it 依赖
├── docs/
│   ├── images/readme/ # 已验证的 README 产品截图
│   ├── readme-captures.json
│   └── zh-CN/         # 简体中文文档
├── LICENSE
└── README.md
~~~

## 开发

使用生产构建完成最小项目检查：

~~~bash
cd code
npm ci
npm run build
~~~

前端使用 Vite 驱动的原生 JavaScript，<code>markdown-it</code> 负责渲染，小型 Node.js 服务负责持久化。仓库中的[截图配置](../readme-captures.json)记录了 README 图片使用的安全演示响应、视口、就绪条件和 CSS 断言。

## 当前边界

- 工作区以桌面端为主，至少需要 <code>1080px</code> 的横向空间。
- PDF 效果取决于浏览器打印引擎和所选打印参数。
- 自动分页会在页面间移动顶层块和列表项；边界必须精确时请使用显式标记。
- 本地保存 API 会覆盖其映射的 Markdown 文件，建议配合常规版本控制或备份。

## 参与贡献

欢迎提交 Issue 和 Pull Request。请保持改动聚焦，运行 <code>npm run build</code>，并说明可见的预览、分页或打印差异。

## 开源协议

简历实时编辑器基于 [GNU General Public License v3.0](../../LICENSE) 发布。
