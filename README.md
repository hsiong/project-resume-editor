# Resume Editor

English | [简体中文](docs/zh-CN/README-cn.md)

**A local-first Markdown workspace for editing multi-section resumes, seeing the printable A4 result immediately, and exporting it with the browser you already use.**

<p align="center">
  <a href="LICENSE"><img alt="GPL-3.0 license" src="https://img.shields.io/badge/license-GPL--3.0-2563eb.svg"></a>
  <img alt="Node.js 18 or newer" src="https://img.shields.io/badge/Node.js-18%2B-339933.svg">
  <img alt="Built with Vite" src="https://img.shields.io/badge/built%20with-Vite-646CFF.svg">
</p>

<p align="center">
  <img src="docs/images/readme/editor-overview.png" alt="Resume Editor with Markdown source, controls, and a fully styled five-page A4 preview" width="100%">
  <br>
  <em>Real application capture with safe demo data; stylesheet, font, image, and key computed-style checks passed before capture.</em>
</p>

## Why use it

Resume Editor keeps writing and layout in one desktop workspace. You edit plain Markdown on the left while the complete resume is repaginated into A4 sheets on the right.

- **Immediate print feedback** — page count and A4 pagination update as the Markdown changes.
- **Local files remain authoritative** — the bundled Node.js server reads and writes the configured documents on disk.
- **Focused sections** — switch between profile, project experience, and open-source contributions without maintaining one oversized source file.
- **Practical Markdown output** — headings, lists, links, tables, inline HTML, and explicit page breaks are rendered with <code>markdown-it</code>.
- **No separate PDF renderer** — export opens the browser print dialog with the same pages shown in the preview.

## Quick start

### Requirements

- Node.js 18 or newer
- npm
- A modern desktop browser

~~~bash
git clone https://github.com/hsiong/project-resume-editor.git
cd project-resume-editor/code
npm ci
npm run build
node server.mjs 5173 dist
~~~

Open [http://localhost:5173](http://localhost:5173). Press <code>Ctrl+C</code> in the terminal to stop the server.

Use a different port by changing the first argument:

~~~bash
node server.mjs 5174 dist
~~~

## Everyday workflow

| Action | What happens |
| --- | --- |
| Choose a tab | Changes the Markdown document shown in the editor |
| Type in the editor | Updates the in-memory document and repaginates the complete preview |
| **Save** | Writes all configured sections back to their mapped local files |
| **Reload** | Replaces the browser state with the latest content from disk |
| **Export PDF** | Opens the native print dialog for the A4 preview pages |

Save changes you want to keep before selecting **Reload**. Saving currently updates every configured section, not only the active tab.

## Authoring and pagination

The profile document uses structured Markdown to populate the cover and overview pages. The remaining sections use regular Markdown and can include tables, lists, links, and inline HTML.

Insert an explicit page break when automatic pagination is not precise enough:

~~~html
<div class="page-break"></div>
~~~

The marker controls preview and print pagination but is hidden from the exported document.

## How it works

~~~mermaid
flowchart LR
    Files[Local Markdown files] -->|GET /api/docs| Server[Node.js server]
    Server --> Editor[Browser editor]
    Editor --> Renderer[markdown-it renderer]
    Renderer --> Preview[A4 paginated preview]
    Editor -->|Save all sections| Server
    Preview -->|Export PDF| Print[Browser print dialog]
~~~

Resume content stays in local Markdown files and is handled by the local HTTP server. The visual template currently references remotely hosted decorative images, and resume content may reference a remote avatar or links. Replace them with local assets when a fully offline workflow is required.

## Project layout

~~~text
.
├── code/
│   ├── data/          # Local Markdown data sources
│   ├── src/           # Editor, renderer, pagination, and print styles
│   ├── server.mjs     # Static server and local document API
│   └── package.json   # Vite and markdown-it dependencies
├── docs/
│   ├── images/readme/ # Verified README product capture
│   ├── readme-captures.json
│   └── zh-CN/         # Simplified Chinese documentation
├── LICENSE
└── README.md
~~~

## Development

Use the production build as the minimum project check:

~~~bash
cd code
npm ci
npm run build
~~~

The frontend is vanilla JavaScript powered by Vite, with <code>markdown-it</code> for rendering and a small Node.js server for persistence. The checked-in [capture configuration](docs/readme-captures.json) records the safe demo response, viewport, readiness condition, and CSS assertions used for the README image.

## Current boundaries

- The workspace is desktop-first and requires at least <code>1080px</code> of horizontal space.
- PDF output depends on the browser print engine and the selected print settings.
- Automatic pagination moves top-level blocks and list items between pages; use an explicit marker when the boundary must be exact.
- The local save API overwrites its mapped Markdown files, so normal version control or backups are recommended.

## Contributing

Issues and pull requests are welcome. Keep changes focused, run <code>npm run build</code>, and describe visible preview, pagination, or print differences.

## License

Resume Editor is distributed under the [GNU General Public License v3.0](LICENSE).
