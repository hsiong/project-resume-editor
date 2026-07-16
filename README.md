# 简历实时编辑器

这是一个本地 Markdown 简历编辑器。首页和概览部分沿用上级目录 `resume.html` / `resume/jf.css` 的版式；项目经验和开源贡献使用新的 Markdown A4 样式。

## 使用

```bash
cd /Users/vjf/Documents/resume/resume-editor
npm install
./start.sh
```

打开 `http://localhost:5173/`。

停止服务：

```bash
./stop.sh
```

`start.sh` 会先清理 5173 端口，再执行构建，并用项目内置 Node 静态服务后台托管 `dist/`。需要换端口时：

```bash
PORT=5174 ./start.sh
./stop.sh 5174
```

## 说明

- 左侧按「首页 / 项目经验 / 开源贡献」编辑内容。
- 初始内容不再写死在前端代码里，而是由本地服务读取这三个文件：
  - `首页-start.md`
  - `项目经验-detail.md`
  - `开源贡献-opensource.md`
- 点击「保存」会把三份 Markdown 都写回磁盘。
- `首页-start.md` 只作为数据源，渲染时会填入原 `page1/page2/page2-table` 样式，不使用新的 Markdown 样式。
- `项目经验-detail.md` 和 `开源贡献-opensource.md` 支持标准 Markdown、表格、链接、列表、引用和少量 HTML。
- 这两个详情文件需要手动分页时，在 Markdown 中写 `<div class="page-break"></div>`。
- 导出 PDF 使用右侧同一份 A4 预览 DOM。
- 点击「导出 PDF」会打开浏览器打印窗口，目标打印机选择「Save as PDF」即可。
