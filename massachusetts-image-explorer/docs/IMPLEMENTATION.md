# Implementation Notes

## Goal
Provide one page that can browse Massachusetts-related images from multiple open collections using only client-side JavaScript.

## Data sources
1. **Wikimedia Commons API**
   - Endpoint: `https://commons.wikimedia.org/w/api.php`
   - Query includes `filetype:bitmap Massachusetts <user term>`
2. **Digital Commonwealth**
   - Endpoint: `https://www.digitalcommonwealth.org/search.json`
   - Query includes `Massachusetts <user term>` and image-only filter
3. **Internet Archive**
   - Endpoint: `https://archive.org/advancedsearch.php`
   - Query includes media type image + Massachusetts in title or subject
4. **Openverse (CC Search)**
   - Endpoint: `https://api.openverse.engineering/v1/images/`
   - Query includes `Massachusetts <user term>`

## Result normalization
All source responses are normalized to:
- source
- title
- image URL
- page URL
- creator
- license
- metadata blob for keyword filtering

## Massachusetts-only enforcement
Two layers:
1. request-level inclusion of `Massachusetts`
2. response-level regex filter requiring `massachusetts` in metadata blob

## Failure behavior
- Each source is fetched independently.
- If one source fails, the page still renders other source results.
- Warning message indicates which source failed.

## Local development
Use any static file server (example):

```bash
python3 -m http.server 8080
```


## Source picker
- The UI provides per-source checkboxes.
- Search only runs against selected sources.
- If no source is selected, it falls back to three defaults (Wikimedia, Digital Commonwealth, Internet Archive).


## Server-side proxy
- File: `api/search.js`
- Accepts query params: `source`, `query`, `limit`
- Builds upstream URL server-side and returns JSON response
- Adds permissive CORS headers and handles `OPTIONS` preflight
- Used to avoid browser-side blocking/CORS limitations for Openverse and Digital Commonwealth

## Frontend proxy strategy
- Frontend first tries `${window.location.origin}/api/search` (or `window.MA_PROXY_BASE` override).
- If proxy is unavailable or fails, it falls back to direct client-side `fetch` to each source endpoint.


## Local full-stack mode
- File: `server.mjs`
- Serves `index.html` and exposes `/api/search` in one local process
- Lets you test proxy-backed behavior locally without Vercel
