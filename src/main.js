import MarkdownIt from 'markdown-it';
import '../../resume/jf.css';
import './styles.css';

const tabs = [
  { id: 'start', label: '首页', title: '首页-start.md', filename: '首页-start.md' },
  { id: 'detail', label: '项目经验', title: '项目经验-detail.md', filename: '项目经验-detail.md' },
  { id: 'opensource', label: '开源贡献', title: '开源贡献-opensource.md', filename: '开源贡献-opensource.md' },
];

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: false,
  breaks: false,
});

md.renderer.rules.table_open = () => '<table class="md-table">';

const state = {
  activeTab: 'start',
  docs: Object.fromEntries(tabs.map((tab) => [tab.id, ''])),
  dirty: false,
  loading: true,
};

document.querySelector('#app').innerHTML = `
  <main class="shell">
    <section class="editor-panel">
      <header class="toolbar">
        <div>
          <h1>简历实时编辑器</h1>
          <p id="editor-title"></p>
        </div>
        <div class="actions">
          <button id="reload-button" type="button" class="ghost">重新读取</button>
          <button id="save-button" type="button">保存</button>
          <button id="print-button" type="button">导出 PDF</button>
        </div>
      </header>
      <nav class="tabs">
        ${tabs.map((tab) => `<button class="tab" data-tab="${tab.id}" type="button">${tab.label}</button>`).join('')}
      </nav>
      <textarea id="markdown-input" spellcheck="false"></textarea>
      <div id="status-line" class="status-line"></div>
    </section>
    <section class="preview-panel">
      <div class="preview-top">
        <span>实时 A4 预览</span>
        <span id="page-count"></span>
      </div>
      <div id="preview-root" class="preview-root"></div>
    </section>
  </main>
  <div id="measure-root" aria-hidden="true"></div>
`;

const input = document.querySelector('#markdown-input');
const title = document.querySelector('#editor-title');
const statusLine = document.querySelector('#status-line');
const previewRoot = document.querySelector('#preview-root');
const measureRoot = document.querySelector('#measure-root');
const pageCount = document.querySelector('#page-count');

document.querySelectorAll('.tab').forEach((button) => {
  button.addEventListener('click', () => {
    state.activeTab = button.dataset.tab;
    renderEditor();
  });
});

input.addEventListener('input', () => {
  state.docs[state.activeTab] = input.value;
  state.dirty = true;
  renderPreview();
  renderStatus();
});

document.querySelector('#save-button').addEventListener('click', () => {
  saveAllDocs();
});

document.querySelector('#reload-button').addEventListener('click', () => {
  loadDocs();
});

document.querySelector('#print-button').addEventListener('click', () => {
  renderPreview();
  requestAnimationFrame(() => window.print());
});

loadDocs();

async function loadDocs() {
  state.loading = true;
  renderStatus('正在读取 Markdown 文件...');

  try {
    const response = await fetch('/api/docs');
    if (!response.ok) {
      throw new Error(await response.text());
    }
    const payload = await response.json();
    state.docs = { ...state.docs, ...payload.docs };
    state.dirty = false;
    state.loading = false;
    renderEditor();
    renderPreview();
    renderStatus('已读取本地 Markdown 文件');
  } catch (error) {
    state.loading = false;
    renderStatus(`读取失败：${error.message}`, true);
  }
}

async function saveAllDocs() {
  renderStatus('正在保存三份 Markdown 文件...');

  try {
    await Promise.all(tabs.map(async (tab) => {
      const response = await fetch(`/api/docs/${tab.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: state.docs[tab.id] }),
      });
      if (!response.ok) {
        throw new Error(`${tab.filename}: ${await response.text()}`);
      }
    }));
    state.dirty = false;
    renderStatus('已保存三份 Markdown 文件');
  } catch (error) {
    renderStatus(`保存失败：${error.message}`, true);
  }
}

function renderEditor() {
  const active = getActiveTab();
  document.querySelectorAll('.tab').forEach((button) => {
    button.classList.toggle('active', button.dataset.tab === state.activeTab);
  });
  title.textContent = active.title;
  input.value = state.docs[state.activeTab] || '';
  input.disabled = state.loading;
  input.focus();
}

function renderStatus(message, isError = false) {
  if (message) {
    statusLine.textContent = message;
  } else {
    const active = getActiveTab();
    statusLine.textContent = `${active.filename}${state.dirty ? ' 有未保存修改' : ' 已同步'}`;
  }
  statusLine.classList.toggle('error', isError);
}

function renderPreview() {
  previewRoot.innerHTML = '';

  appendStartPages(state.docs.start || '');
  appendMarkdownPages(state.docs.detail || '', tabs[1]);
  appendMarkdownPages(state.docs.opensource || '', tabs[2]);

  initOriginalTables(previewRoot);
  const total = previewRoot.querySelectorAll('.a4-page').length;
  pageCount.textContent = `${total} 页`;
}

function appendStartPages(markdown) {
  const data = parseStartMarkdown(markdown);
  const pages = [renderCoverPage(data), renderOverviewPage(data, 0), renderOverviewPage(data, 1)];
  pages.forEach((page) => previewRoot.appendChild(page));
}

function appendMarkdownPages(markdown, tab) {
  const pages = paginateHtml(md.render(markdown), () => createMarkdownPage(tab));
  pages.forEach((page, index) => {
    page.dataset.section = tab.label;
    page.dataset.file = tab.filename;
    page.querySelector('.page-label').textContent = `${tab.label}${pages.length > 1 ? ` / ${index + 1}` : ''}`;
    previewRoot.appendChild(page);
  });
}

function renderCoverPage(data) {
  const page = createOriginalPage('page1');
  page.innerHTML = `
    <div class="page1-title">
      <p class="page1-title-font">个人简历</p>
    </div>
    <div class="page1-div1">
      <p class="page1-intro1">${escapeHtml(data.meta.school)}</p>
      <img class="page1-separator" src="https://user-images.githubusercontent.com/37357447/189835997-e968e90e-38d7-4fed-8166-f75d18d41dc1.png">
      <p class="page1-intro2">${escapeHtml(data.meta.name)}</p>
    </div>
    <ul class="page1-info-list">
      <li>应聘岗位: &nbsp;${escapeHtml(data.meta.job)}</li>
      <li>工作经验: &nbsp;${escapeHtml(data.meta.experience)}</li>
      <li>联系邮箱: &nbsp;${escapeHtml(data.meta.email)}</li>
      <li>电话号码: &nbsp;${escapeHtml(data.meta.phone)}</li>
    </ul>
  `;
  return page;
}

function renderOverviewPage(data, pageIndex) {
  const page = createOriginalPage('page2');
  const workRows = pageIndex === 0 ? data.workRows.slice(0, 5) : data.workRows.slice(5);
  const tableId = pageIndex === 0 ? 'page2-table' : 'page3-table';
  const stringId = pageIndex === 0 ? 'page2-image-string' : 'page3-image-string';
  const dividerPadding = pageIndex === 0 ? '5mm' : '2mm';

  page.innerHTML = `
    ${renderOriginalHeader(data.meta)}
    <div style="padding: ${dividerPadding};">
      <img style="width: 100%;" src="https://user-images.githubusercontent.com/37357447/190067385-b9d6cb80-2a5b-4bb2-8572-5355dab841a3.png">
    </div>
    <div>
      <table class="page2-table" id="${tableId}">
        ${pageIndex === 0 ? renderFirstOverviewRows(data, stringId, workRows) : renderSecondOverviewRows(data, stringId, workRows)}
      </table>
    </div>
  `;
  return page;
}

function renderFirstOverviewRows(data, stringId, workRows) {
  return `
    ${renderSectionTitle('教育背景', stringId)}
    <tr>
      <td class="page2-td-time">${escapeHtml(data.education.time)}</td>
      <td class="page2-td-blank"></td>
      <td class="page2-td-brief">${escapeHtml(data.education.school)}</td>
      <td class="page2-td-job">${escapeHtml(data.education.degree)}</td>
    </tr>
    <tr>
      <td class="page2-td-time"></td>
      <td class="page2-td-blank"></td>
      <td class="page2-td-detail">${renderNumberedLines(data.education.details)}</td>
      <td></td>
    </tr>
    ${renderSectionTitle('技术亮点')}
    <tr>
      <td class="page2-td-time"></td>
      <td class="page2-td-blank"></td>
      <td class="page2-td-detail">${renderNumberedLines(data.highlights)}</td>
      <td></td>
    </tr>
    ${renderSectionTitle('工作经历')}
    ${renderWorkRows(workRows)}
  `;
}

function renderSecondOverviewRows(data, stringId, workRows) {
  return `
    ${renderSectionTitle('工作经历', stringId)}
    ${renderWorkRows(workRows)}
    ${renderSectionTitle('开源贡献')}
    <tr>
      <td class="page2-td-time">${escapeHtml(data.opensource.time)}</td>
      <td class="page2-td-blank"></td>
      <td class="page2-td-brief">${escapeHtml(data.opensource.platform)}</td>
      <td class="page2-td-job"><a href="${escapeAttribute(data.meta.github)}">${escapeHtml(data.meta.github)}</a></td>
    </tr>
    <tr>
      <td class="page2-td-time"></td>
      <td class="page2-td-blank"></td>
      <td class="page2-td-brief">${renderInline(data.opensource.summary)}${data.opensource.items.length ? `<br />${renderNumberedLines(data.opensource.items)}` : ''}</td>
      <td class="page2-td-job"></td>
    </tr>
    ${renderSectionTitle('职称证书')}
    <tr>
      <td class="page2-td-time"></td>
      <td class="page2-td-blank"></td>
      <td class="page2-td-detail">${renderNumberedLines(data.certificates)}<br /><br /></td>
      <td></td>
    </tr>
  `;
}

function renderOriginalHeader(meta) {
  return `
    <div class="page2-div1">
      <span class="page2-div1-job">
        <div class="page2-div1-job-word">
          <div style="font-size: 30px;">${escapeHtml(meta.name)}</div>
          <div style="font-size: 15px;">应聘岗位: ${escapeHtml(meta.job)}</div>
        </div>
      </span>
      <span class="page2-div1-info-list">
        <ul style="margin: 0">
          <li>毕业院校: &nbsp;${escapeHtml(meta.school)}</li>
          <li>工作经验: &nbsp;${escapeHtml(meta.experience)}</li>
          <li>电话号码: &nbsp;${escapeHtml(meta.phone)}</li>
        </ul>
      </span>
      <span>
        <img class="page2-div1-image" src="${escapeAttribute(meta.avatar)}">
      </span>
    </div>
  `;
}

function renderSectionTitle(title, stringId = '') {
  return `
    <tr>
      <td class="page2-td-title">${escapeHtml(title)}</td>
      <td class="page2-td-blank">
        ${stringId ? `<img class="page-image-string" id="${stringId}" src="https://user-images.githubusercontent.com/37357447/190121583-8f302a44-30f1-40b7-a770-5bae7b6aff7d.png">` : ''}
        <img style="width: 4mm;" src="https://user-images.githubusercontent.com/37357447/190117858-e2bff0ce-50df-479b-938d-ff98470dfe4f.png">
      </td>
      <td class="page2-td-title-blank">
        <img style="width: 100%" src="https://user-images.githubusercontent.com/37357447/190070065-9858c881-6688-4cd4-b4e2-7ea13d3d0118.png">
      </td>
      <td></td>
    </tr>
  `;
}

function renderWorkRows(rows) {
  return rows.map((row, index) => `
    ${index > 0 ? renderNextLine() : ''}
    <tr>
      <td class="page2-td-time">${escapeHtml(row.time)}</td>
      <td class="page2-td-blank"></td>
      <td class="page2-td-brief">${escapeHtml(row.company)}</td>
      <td class="page2-td-job">${escapeHtml(row.role)}</td>
    </tr>
    <tr>
      <td class="page2-td-time"></td>
      <td class="page2-td-blank"></td>
      <td class="page2-td-detail">${renderInline(row.summary)}</td>
      <td class="page2-td-job"></td>
    </tr>
  `).join('');
}

function renderNextLine() {
  return `
    <tr>
      <td></td>
      <td></td>
      <td class="page2-td-next-line"></td>
      <td class="page2-td-next-line"></td>
    </tr>
  `;
}

function parseStartMarkdown(markdown) {
  const { meta: frontMatter, body } = parseFrontMatter(markdown);
  const info = parseKeyValueTable(body);
  const title = (body.match(/^#\s+(.+)$/m)?.[1] || '').trim();
  const educationSection = getSection(body, '教育背景');
  const workSection = getSection(body, '工作经历概览');
  const openSourceSection = getSection(body, '开源贡献概览');

  const meta = {
    name: frontMatter.name || title || '张三',
    school: frontMatter.school || info['毕业院校'] || '某某名牌大学',
    job: frontMatter.job || info['应聘岗位'] || '后端开发',
    experience: frontMatter.experience || info['工作经验'] || '6年',
    email: frontMatter.email || info['联系邮箱'] || 'zhangsan_demo@example.com',
    phone: frontMatter.phone || info['电话号码'] || '138-0000-0000',
    avatar: frontMatter.avatar || info['头像'] || 'https://example.com/avatar.png',
    github: frontMatter.github || info.GitHub || 'https://github.com/hsiong',
  };

  return {
    meta,
    education: parseEducation(educationSection),
    highlights: parseListItems(getSection(body, '技术亮点')),
    workRows: parseWorkRows(workSection),
    opensource: parseOpenSource(openSourceSection, meta.github),
    certificates: parseListItems(getSection(body, '职称证书')),
  };
}

function parseFrontMatter(markdown) {
  const match = markdown.match(/^(\s*<!--[\s\S]*?-->\s*)*---\n([\s\S]*?)\n---\n?/);
  if (!match) {
    return { meta: {}, body: markdown };
  }
  const meta = {};
  match[2].split('\n').forEach((line) => {
    const index = line.indexOf(':');
    if (index > -1) {
      meta[line.slice(0, index).trim()] = line.slice(index + 1).trim();
    }
  });
  return { meta, body: markdown.slice(match[0].length) };
}

function parseKeyValueTable(markdown) {
  const table = parseMarkdownTables(markdown)[0] || [];
  return Object.fromEntries(table.map((row) => [row[0], stripMarkdown(row[1])]));
}

function parseEducation(section) {
  const table = parseMarkdownTables(section)[0];
  if (table?.length) {
    const row = table[0];
    return {
      time: stripMarkdown(row[0] || ''),
      school: stripMarkdown(row[1] || ''),
      degree: stripMarkdown(row[2] || ''),
      details: row.slice(3).filter(Boolean).map(stripMarkdown),
    };
  }

  const match = section.match(/\*\*(.*?)\*\*\s+(.+)/);
  const parts = (match?.[2] || '某某名牌大学 计算机科学，本科学士学位').split(/[，,]/);
  return {
    time: match?.[1] || '2013.09 - 2017.07',
    school: stripMarkdown(parts[0] || '某某名牌大学 计算机科学'),
    degree: stripMarkdown(parts[1] || '本科学士学位'),
    details: parseListItems(section),
  };
}

function parseWorkRows(section) {
  const table = parseMarkdownTables(section)[0] || [];
  return table.map((row) => ({
    time: stripMarkdown(row[0] || ''),
    company: stripMarkdown(row[1] || ''),
    role: stripMarkdown(row[2] || ''),
    summary: stripMarkdown(row[3] || ''),
  })).filter((row) => row.time || row.company || row.role || row.summary);
}

function parseOpenSource(section, github) {
  const items = parseListItems(section);
  const summary = section
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line && !line.startsWith('|') && !line.startsWith('-') && !line.match(/^\d+\./));

  return {
    time: '2022.01 - 至今',
    platform: 'github',
    github,
    summary: summary ? stripMarkdown(summary) : '核心贡献:',
    items,
  };
}

function getSection(markdown, title) {
  const lines = markdown.split('\n');
  const startIndex = lines.findIndex((line) => line.trim() === `## ${title}`);
  if (startIndex === -1) {
    return '';
  }

  const collected = [];
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    if (/^##\s+/.test(lines[index])) {
      break;
    }
    collected.push(lines[index]);
  }
  return collected.join('\n').trim();
}

function parseListItems(section) {
  return section
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^([-+*]|\d+\.)\s+/.test(line))
    .map((line) => stripMarkdown(line.replace(/^([-+*]|\d+\.)\s+/, '')));
}

function parseMarkdownTables(markdown) {
  const lines = markdown.split('\n');
  const tables = [];
  for (let index = 0; index < lines.length; index += 1) {
    if (!lines[index].trim().startsWith('|') || !lines[index + 1]?.match(/^\s*\|?\s*:?-{3,}/)) {
      continue;
    }
    const tableLines = [];
    index += 2;
    while (index < lines.length && lines[index].trim().startsWith('|')) {
      tableLines.push(lines[index]);
      index += 1;
    }
    tables.push(tableLines.map(parseTableRow));
  }
  return tables;
}

function parseTableRow(line) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

function stripMarkdown(value) {
  return String(value)
    .replace(/^<(.+)>$/, '$1')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .trim();
}

function renderNumberedLines(items) {
  return items.map((item, index) => `${index + 1}. ${renderInline(item)}`).join('<br />');
}

function renderInline(value) {
  return md.renderInline(String(value || ''));
}

function initOriginalTables(root) {
  root.querySelectorAll('.page2-td-title-blank, .page2-td-detail').forEach((element) => {
    element.setAttribute('colspan', '2');
  });

  computeOriginalString(root.querySelector('#page2-image-string'), root.querySelector('#page2-table'));
  computeOriginalString(root.querySelector('#page3-image-string'), root.querySelector('#page3-table'));
}

function computeOriginalString(imageString, table) {
  if (!imageString || !table) {
    return;
  }
  const firstRow = table.getElementsByTagName('tr')[0];
  const body = table.getElementsByTagName('tbody')[0];
  if (!firstRow || !body) {
    return;
  }
  const height = body.clientHeight - firstRow.clientHeight - 5;
  imageString.setAttribute('style', `top: 50%; height:${height}px`);
}

function paginateHtml(html, createTargetPage) {
  measureRoot.innerHTML = '';
  const sourceBody = document.createElement('div');
  sourceBody.innerHTML = html;

  const pages = [];
  let page = createTargetPage();
  measureRoot.appendChild(page);
  let body = page.querySelector('[data-page-body]');
  const maxHeight = lockBodyHeight(body);
  const nodes = Array.from(sourceBody.childNodes).filter((node) => {
    return node.nodeType === Node.ELEMENT_NODE || node.textContent.trim();
  });

  nodes.forEach((node) => {
    if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('page-break')) {
      if (body.children.length > 0) {
        pages.push(page);
        page = createTargetPage();
        measureRoot.appendChild(page);
        body = page.querySelector('[data-page-body]');
        lockBodyHeight(body);
      }
      return;
    }

    if (node.nodeType === Node.ELEMENT_NODE && ['UL', 'OL'].includes(node.tagName)) {
      ({ page, body } = appendList(node, page, body, pages, maxHeight, createTargetPage));
      return;
    }

    body.appendChild(node.cloneNode(true));
    if (body.scrollHeight > maxHeight && body.children.length > 1) {
      body.removeChild(body.lastChild);
      pages.push(page);
      page = createTargetPage();
      measureRoot.appendChild(page);
      body = page.querySelector('[data-page-body]');
      lockBodyHeight(body);
      body.appendChild(node.cloneNode(true));
    }
  });

  pages.push(page);
  pages.forEach((item) => item.remove());
  measureRoot.innerHTML = '';
  return pages;
}

function appendList(listNode, page, body, pages, maxHeight, createTargetPage) {
  let targetList = document.createElement(listNode.tagName.toLowerCase());
  copyAttributes(listNode, targetList);
  body.appendChild(targetList);

  Array.from(listNode.children).forEach((item) => {
    targetList.appendChild(item.cloneNode(true));
    if (body.scrollHeight <= maxHeight || targetList.children.length === 1) {
      return;
    }

    targetList.removeChild(targetList.lastChild);
    pages.push(page);
    page = createTargetPage();
    measureRoot.appendChild(page);
    body = page.querySelector('[data-page-body]');
    lockBodyHeight(body);
    targetList = document.createElement(listNode.tagName.toLowerCase());
    copyAttributes(listNode, targetList);
    body.appendChild(targetList);
    targetList.appendChild(item.cloneNode(true));
  });

  if (!targetList.children.length) {
    body.removeChild(targetList);
  }

  return { page, body };
}

function createMarkdownPage(tab) {
  const page = document.createElement('article');
  page.className = `a4-page markdown-page ${tab.id}-page`;
  page.innerHTML = `
    <div class="page-label"></div>
    <div class="markdown-body" data-page-body></div>
  `;
  return page;
}

function createOriginalPage(className) {
  const page = document.createElement('article');
  page.className = `a4-page ${className}`;
  return page;
}

function lockBodyHeight(body) {
  const height = Math.max(Math.floor(body.getBoundingClientRect().height), 1);
  body.style.height = `${height}px`;
  return height;
}

function getActiveTab() {
  return tabs.find((tab) => tab.id === state.activeTab);
}

function copyAttributes(from, to) {
  Array.from(from.attributes).forEach((attribute) => {
    to.setAttribute(attribute.name, attribute.value);
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll('`', '&#96;');
}
