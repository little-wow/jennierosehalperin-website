import http from 'node:http';
import { createReadStream, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 8787;
const UPSTREAM_TIMEOUT_MS = Number(process.env.UPSTREAM_TIMEOUT_MS || 15000);

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

function classifyError(error) {
  const code = error?.cause?.code || error?.code || null;
  if (error?.name === 'AbortError') {
    return { category: 'timeout', code: 'ETIMEDOUT', hint: 'Upstream request timed out. Try again or increase UPSTREAM_TIMEOUT_MS.' };
  }
  if (['ENOTFOUND', 'EAI_AGAIN'].includes(code)) {
    return { category: 'dns', code, hint: 'DNS/network resolution failed for upstream host.' };
  }
  if (['ECONNREFUSED', 'ECONNRESET', 'EHOSTUNREACH', 'ENETUNREACH'].includes(code)) {
    return { category: 'connectivity', code, hint: 'Network path to upstream host failed.' };
  }
  if (['CERT_HAS_EXPIRED', 'DEPTH_ZERO_SELF_SIGNED_CERT', 'UNABLE_TO_VERIFY_LEAF_SIGNATURE'].includes(code)) {
    return { category: 'tls', code, hint: 'TLS certificate validation failed while connecting upstream.' };
  }
  return { category: 'unknown', code, hint: 'Unknown upstream fetch failure (often proxy or firewall policy).' };
}

async function proxyFetch({ source, target, requestId }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const upstream = await fetch(target, {
      headers: { 'User-Agent': 'Massachusetts-Image-Explorer/1.0' },
      signal: controller.signal,
    });

    const text = await upstream.text();
    if (!upstream.ok) {
      return {
        ok: false,
        status: upstream.status,
        payload: {
          error: `Upstream ${source} request failed`,
          requestId,
          source,
          target,
          upstreamStatus: upstream.status,
          upstreamBodyPreview: text.slice(0, 400),
        },
      };
    }

    return { ok: true, text };
  } catch (error) {
    const details = classifyError(error);
    return {
      ok: false,
      status: 502,
      payload: {
        error: `Proxy request failed for ${source}`,
        requestId,
        source,
        target,
        detail: error?.message || 'fetch failed',
        ...details,
      },
    };
  } finally {
    clearTimeout(timer);
  }
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

    const requestId = randomUUID();
    const source = url.searchParams.get('source');
    const query = url.searchParams.get('query') || 'history';
    const max = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '10', 10) || 10, 1), 25);
    const target = upstreamUrl(source, query, max);

    if (!target) {
      res.writeHead(400, { 'Content-Type': 'application/json', 'x-request-id': requestId });
      res.end(JSON.stringify({ error: 'Invalid source. Use wikimedia, digital, archive, or openverse.', requestId }));
      return;
    }

    const result = await proxyFetch({ source, target, requestId });

    if (!result.ok) {
      res.writeHead(result.status, { 'Content-Type': 'application/json', 'x-request-id': requestId });
      res.end(JSON.stringify(result.payload));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json', 'x-request-id': requestId });
    res.end(result.text);
    return;
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
  console.log(`Upstream timeout: ${UPSTREAM_TIMEOUT_MS}ms`);
});
