import { createReadStream, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { homedir } from 'node:os';
import { extname, join, normalize, resolve } from 'node:path';

const port = Number(process.argv[2] || process.env.PORT || 5173);
const root = resolve(process.argv[3] || join(process.cwd(), 'dist'));
const workspace = resolve(process.cwd());
const suffix = process.env.DATA_SUFFIX || '';
const docs = {
  start: `data/首页-start${suffix}.md`,
  detail: `data/项目经验-detail${suffix}.md`,
  opensource: `data/开源贡献-opensource${suffix}.md`,
};

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

// 本地图片(头像等)支持的格式，仅允许读取图片文件
const imageContentTypes = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.tif': 'image/tiff',
  '.tiff': 'image/tiff',
};

createServer((request, response) => {
  const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);

  if (url.pathname === '/api/local-image' && request.method === 'GET') {
    sendLocalImage(response, url.searchParams.get('path'));
    return;
  }

  if (url.pathname === '/api/docs' && request.method === 'GET') {
    sendJson(response, {
      files: docs,
      docs: Object.fromEntries(Object.entries(docs).map(([id, filename]) => {
        return [id, readDoc(filename)];
      })),
    });
    return;
  }

  const docMatch = url.pathname.match(/^\/api\/docs\/([a-z]+)$/);
  if (docMatch && request.method === 'POST') {
    const id = docMatch[1];
    const filename = docs[id];
    if (!filename) {
      response.writeHead(404);
      response.end('Unknown document');
      return;
    }

    readJsonBody(request)
      .then((body) => {
        if (typeof body.content !== 'string') {
          response.writeHead(400);
          response.end('content must be a string');
          return;
        }
        writeDoc(filename, body.content);
        sendJson(response, { ok: true, filename });
      })
      .catch((error) => {
        response.writeHead(400);
        response.end(error.message);
      });
    return;
  }

  const pathname = decodeURIComponent(url.pathname);
  const safePath = normalize(pathname).replace(/^(\.\.[/\\])+/, '');
  let filePath = resolve(join(root, safePath));

  if (!filePath.startsWith(root)) {
    response.writeHead(403);
    response.end('Forbidden');
    return;
  }

  if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
    filePath = join(root, 'index.html');
  }

  const type = contentTypes[extname(filePath)] || 'application/octet-stream';
  response.writeHead(200, { 'Content-Type': type });

  if (request.method === 'HEAD') {
    response.end();
    return;
  }

  createReadStream(filePath).pipe(response);
}).listen(port, () => {
  console.log(`resume editor serving ${root} at http://localhost:${port}/`);
});

function sendLocalImage(response, rawPath) {
  if (!rawPath) {
    response.writeHead(400);
    response.end('path is required');
    return;
  }

  // 支持 ~ 家目录展开，交由服务端从本地磁盘读取绝对路径图片
  const filePath = resolve(rawPath.replace(/^~(?=[/\\]|$)/, homedir()));
  const type = imageContentTypes[extname(filePath).toLowerCase()];
  if (!type) {
    response.writeHead(415);
    response.end('Unsupported image type');
    return;
  }

  if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
    response.writeHead(404);
    response.end('Image not found');
    return;
  }

  response.writeHead(200, { 'Content-Type': type });
  createReadStream(filePath).pipe(response);
}

function readDoc(filename) {
  const filePath = resolve(join(workspace, filename));
  assertInWorkspace(filePath);
  if (!existsSync(filePath)) {
    return '';
  }
  return readFileSync(filePath, 'utf8');
}

function writeDoc(filename, content) {
  const filePath = resolve(join(workspace, filename));
  assertInWorkspace(filePath);
  mkdirSync(workspace, { recursive: true });
  writeFileSync(filePath, content, 'utf8');
}

function assertInWorkspace(filePath) {
  if (!filePath.startsWith(workspace)) {
    throw new Error('Path is outside workspace');
  }
}

function sendJson(response, payload) {
  response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
}

function readJsonBody(request) {
  return new Promise((resolveRequest, rejectRequest) => {
    let raw = '';
    request.setEncoding('utf8');
    request.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1024 * 1024) {
        rejectRequest(new Error('request body too large'));
        request.destroy();
      }
    });
    request.on('end', () => {
      try {
        resolveRequest(JSON.parse(raw || '{}'));
      } catch {
        rejectRequest(new Error('invalid json'));
      }
    });
    request.on('error', rejectRequest);
  });
}
