# Massachusetts Image Explorer (Standalone Repo)

This folder is organized as a standalone mini-repo for a Massachusetts-focused image explorer.

## Included sources
The app can pull Massachusetts-related images from:
- Wikimedia Commons
- Massachusetts Digital Commonwealth
- Internet Archive
- Creative Commons Search (Openverse)
- Library of Congress Photos
- Art Institute of Chicago

## Run locally (full mode)
```bash
cd massachusetts-image-explorer
node server.mjs
```
Then open `http://127.0.0.1:8787/`.

This mode serves both:
- `index.html`
- `/api/search` proxy route

## Quick preview
If you only want static preview (no proxy):
```bash
python3 -m http.server 8080
```
Then open `http://127.0.0.1:8080/`.

## Features
- Source picker (multi-select checkboxes)
- Massachusetts keyword + metadata filtering
- Proxy-first requests with diagnostics
- **Load more results** button (increases per-source limit and reruns search)
- Modern Bootstrap + glassmorphism UI

## Troubleshooting Digital Commonwealth/Openverse failures
If a source fails, inspect proxy diagnostics:

```bash
curl "http://127.0.0.1:8787/api/search?source=digital&query=history&limit=1"
```

Diagnostic fields include:
- `requestId`
- `category` (`dns`, `connectivity`, `tls`, `timeout`, `unknown`)
- `code`
- `detail`
- `hint`

## Deploy as its own repo
1. Create a new GitHub repository (e.g. `massachusetts-image-explorer`).
2. Copy this folder's contents into that repo root.
3. Deploy on Vercel/Netlify or similar static+functions platform.
