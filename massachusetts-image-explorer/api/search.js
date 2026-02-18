const UPSTREAM_TIMEOUT_MS = Number(process.env.UPSTREAM_TIMEOUT_MS || 15000);

function upstreamUrl(source, query, max) {
  if (source === 'wikimedia') {
    const u = new URL('https://commons.wikimedia.org/w/api.php');
    u.search = new URLSearchParams({ action: 'query', format: 'json', origin: '*', generator: 'search', gsrsearch: `filetype:bitmap Massachusetts ${query}`, gsrnamespace: '6', gsrlimit: String(max), prop: 'imageinfo', iiprop: 'url|user|extmetadata' });
    return u.toString();
  }
  if (source === 'digital') {
    const u = new URL('https://www.digitalcommonwealth.org/search.json');
    u.search = new URLSearchParams({ q: `Massachusetts ${query}`, per_page: String(max), search_field: 'all_fields', 'f[human_readable_type_ssim][]': 'Still Image' });
    return u.toString();
  }
  if (source === 'archive') {
    const u = new URL('https://archive.org/advancedsearch.php');
    u.search = new URLSearchParams({ q: `(mediatype:image) AND (title:(Massachusetts ${query}) OR subject:(Massachusetts ${query}))`, fl: 'identifier,title,creator,subject', rows: String(max), page: '1', output: 'json' });
    return u.toString();
  }
  if (source === 'openverse') {
    const u = new URL('https://api.openverse.engineering/v1/images/');
    u.search = new URLSearchParams({ q: `Massachusetts ${query}`, page_size: String(max), license_type: 'all' });
    return u.toString();
  }
  if (source === 'loc') {
    const u = new URL('https://www.loc.gov/photos/');
    u.search = new URLSearchParams({ q: `Massachusetts ${query}`, fo: 'json', c: String(max) });
    return u.toString();
  }
  if (source === 'aic') {
    const u = new URL('https://api.artic.edu/api/v1/artworks/search');
    u.search = new URLSearchParams({ q: `Massachusetts ${query}`, limit: String(max), fields: 'id,title,image_id,artist_title' });
    return u.toString();
  }
  return null;
}

function classifyError(error) {
  const code = error?.cause?.code || error?.code || null;
  if (error?.name === 'AbortError') return { category: 'timeout', code: 'ETIMEDOUT', hint: 'Upstream request timed out.' };
  if (['ENOTFOUND', 'EAI_AGAIN'].includes(code)) return { category: 'dns', code, hint: 'DNS/network resolution failed.' };
  if (['ECONNREFUSED', 'ECONNRESET', 'EHOSTUNREACH', 'ENETUNREACH'].includes(code)) return { category: 'connectivity', code, hint: 'Network path to upstream host failed.' };
  if (['CERT_HAS_EXPIRED', 'DEPTH_ZERO_SELF_SIGNED_CERT', 'UNABLE_TO_VERIFY_LEAF_SIGNATURE'].includes(code)) return { category: 'tls', code, hint: 'TLS certificate validation failed.' };
  return { category: 'unknown', code, hint: 'Unknown upstream failure (often proxy/firewall policy).' };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const { source, query = 'history', limit = '12' } = req.query || {};
  const max = Math.min(Math.max(parseInt(limit, 10) || 12, 1), 60);
  const target = upstreamUrl(source, query, max);

  if (!target) {
    res.status(400).json({ error: 'Invalid source. Use wikimedia, digital, archive, openverse, loc, or aic.', requestId });
    return;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const upstream = await fetch(target, { headers: { 'User-Agent': 'Massachusetts-Image-Explorer/1.0' }, signal: controller.signal });
    const contentType = upstream.headers.get('content-type') || '';
    const text = await upstream.text();

    if (!upstream.ok) {
      res.status(upstream.status).json({ error: `Upstream ${source} request failed`, requestId, source, target, upstreamStatus: upstream.status, upstreamBodyPreview: text.slice(0, 400) });
      return;
    }

    if (!contentType.includes('application/json')) {
      res.status(502).json({ error: `Upstream ${source} did not return JSON`, requestId, source, target });
      return;
    }

    res.setHeader('x-request-id', requestId);
    res.status(200).send(text);
  } catch (error) {
    res.status(502).json({ error: `Proxy request failed for ${source}`, requestId, source, target, detail: error?.message || 'fetch failed', ...classifyError(error) });
  } finally {
    clearTimeout(timer);
  }
}
