export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const { source, query = 'history', limit = '10' } = req.query || {};
  const max = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 25);

  const upstreams = {
    wikimedia: () => {
      const u = new URL('https://commons.wikimedia.org/w/api.php');
      u.search = new URLSearchParams({
        action: 'query',
        format: 'json',
        origin: '*',
        generator: 'search',
        gsrsearch: `filetype:bitmap Massachusetts ${query}`,
        gsrnamespace: '6',
        gsrlimit: String(max),
        prop: 'imageinfo',
        iiprop: 'url|user|extmetadata',
      });
      return u.toString();
    },
    digital: () => {
      const u = new URL('https://www.digitalcommonwealth.org/search.json');
      u.search = new URLSearchParams({
        q: `Massachusetts ${query}`,
        per_page: String(max),
        search_field: 'all_fields',
        'f[human_readable_type_ssim][]': 'Still Image',
      });
      return u.toString();
    },
    archive: () => {
      const u = new URL('https://archive.org/advancedsearch.php');
      u.search = new URLSearchParams({
        q: `(mediatype:image) AND (title:(Massachusetts ${query}) OR subject:(Massachusetts ${query}))`,
        fl: 'identifier,title,creator,subject',
        rows: String(max),
        page: '1',
        output: 'json',
      });
      return u.toString();
    },
    openverse: () => {
      const u = new URL('https://api.openverse.engineering/v1/images/');
      u.search = new URLSearchParams({
        q: `Massachusetts ${query}`,
        page_size: String(max),
        license_type: 'all',
      });
      return u.toString();
    },
  };

  if (!source || !upstreams[source]) {
    res.status(400).json({ error: 'Invalid source. Use wikimedia, digital, archive, or openverse.' });
    return;
  }

  try {
    const response = await fetch(upstreams[source](), {
      headers: { 'User-Agent': 'Massachusetts-Image-Explorer/1.0' },
    });

    const contentType = response.headers.get('content-type') || '';
    const text = await response.text();

    if (!response.ok) {
      res.status(response.status).json({
        error: `Upstream ${source} request failed`,
        status: response.status,
        body: text.slice(0, 400),
      });
      return;
    }

    if (!contentType.includes('application/json')) {
      res.status(502).json({ error: `Upstream ${source} did not return JSON` });
      return;
    }

    res.status(200).send(text);
  } catch (error) {
    res.status(502).json({ error: `Proxy request failed for ${source}`, detail: error.message });
  }
}
