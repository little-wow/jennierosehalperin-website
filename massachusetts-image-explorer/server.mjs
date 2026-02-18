import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { createReadStream, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 8787;

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function upstreamUrl(source, query, max) {
  const q = query || 'history';
  if (source === 'wikimedia') {
    const u = new URL('https://commons.wikimedia.org/w/api.php');
    u.search = new URLSearchParams({ action: 'query', format: 'json', origin: '*', generator: 'search', gsrsearch: `filetype:bitmap Massachusetts ${q}`, gsrnamespace: '6', gsrlimit: String(max), prop: 'imageinfo', iiprop: 'url|user|extmetadata' });
    return u.toString();
  }
  if (source === 'digital') {
    const u = new URL('https://www.digitalcommonwealth.org/search.json');
    u.search = new URLSearchParams({ q: `Massachusetts ${q}`, per_page: String(max), search_field: 'all_fields', 'f[human_readable_type_ssim][]': 'Still Image' });
    return u.toString();
  }
  if (source === 'archive') {
    const u = new URL('https://archive.org/advancedsearch.php');
    u.search = new URLSearchParams({ q: `(mediatype:image) AND (title:(Massachusetts ${q}) OR subject:(Massachusetts ${q}))`, fl: 'identifier,title,creator,subject', rows: String(max), page: '1', output: 'json' });
    return u.toString();
  }
  if (source === 'openverse') {
    const u = new URL('https://api.openverse.engineering/v1/images/');
    u.search = new URLSearchParams({ q: `Massachusetts ${q}`, page_size: String(max), license_type: 'all' });
    return u.toString();
  }
  return null;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === '/api/search') {
    setCors(res);
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }
    const source = url.searchParams.get('source');
    const query = url.searchParams.get('query') || 'history';
    const max = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '10', 10) || 10, 1), 25);
    const target = upstreamUrl(source, query, max);
    if (!target) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid source. Use wikimedia, digital, archive, or openverse.' }));
      return;
    }

    try {
      const upstream = await fetch(target, { headers: { 'User-Agent': 'Massachusetts-Image-Explorer/1.0' } });
      const text = await upstream.text();
      if (!upstream.ok) {
        res.writeHead(upstream.status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Upstream ${source} request failed`, status: upstream.status, body: text.slice(0, 400) }));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(text);
      return;
    } catch (e) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Proxy request failed for ${source}`, detail: e.message }));
      return;
    }
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405);
    res.end('Method Not Allowed');
    return;
  }

  const pathname = url.pathname === '/' ? '/index.html' : url.pathname;
  const filePath = path.join(__dirname, pathname);
  if (!filePath.startsWith(__dirname) || !existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
    return;
  }

  const ext = path.extname(filePath);
  const type = ext === '.html' ? 'text/html; charset=utf-8' : ext === '.js' ? 'application/javascript; charset=utf-8' : 'text/plain; charset=utf-8';
  res.writeHead(200, { 'Content-Type': type });
  createReadStream(filePath).pipe(res);
});

server.listen(PORT, () => {
  console.log(`Massachusetts Image Explorer running at http://127.0.0.1:${PORT}`);
});
