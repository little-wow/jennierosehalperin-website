# Massachusetts Image Explorer (Standalone Repo)

This folder is organized as a **standalone repo** for the Massachusetts image page.

It includes a static web app that searches for Massachusetts-focused images from:
- Wikimedia Commons
- Massachusetts Digital Commonwealth
- Internet Archive
- Creative Commons Search (Openverse)

## Why this exists
The original implementation was added directly into the site. This version isolates the page into a dedicated mini-repo structure so it can be published independently.

## Files
- `index.html` — full app (HTML/CSS/JS)
- `docs/IMPLEMENTATION.md` — design notes, API mapping, and behavior

## Run locally
From this folder:

```bash
python3 -m http.server 8080
```

Then open:

- `http://127.0.0.1:8080/`

## Publish as its own repository
1. Create a new GitHub repository (e.g. `massachusetts-image-explorer`).
2. Copy this folder's contents into that repo root.
3. Push and enable GitHub Pages (or deploy to Netlify/Vercel as static site).

## Notes
- The app always injects the word `Massachusetts` into source queries.
- It applies an extra client-side metadata filter for `Massachusetts` to reduce unrelated hits.
- If any source API errors or blocks CORS in-browser, a warning appears while other sources still render.


## Source picker
Use the checkboxes to choose which archives to search each time.
If none are checked, the app defaults to three core sources: Wikimedia Commons, Digital Commonwealth, and Internet Archive.
