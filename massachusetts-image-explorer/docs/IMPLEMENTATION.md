# Implementation Notes

## Goal
Provide one modern web app that aggregates Massachusetts-related images from multiple open archives.

## Sources currently supported
1. Wikimedia Commons API
2. Massachusetts Digital Commonwealth (`search.json`)
3. Internet Archive (`advancedsearch.php`)
4. Openverse API
5. Library of Congress Photos (`loc.gov/photos?fo=json`)
6. Art Institute of Chicago API

## Request strategy
- Frontend is proxy-first (`/api/search`) and falls back to direct browser fetch.
- Proxy exists in:
  - `server.mjs` (local full-stack mode)
  - `api/search.js` (serverless deployment mode)

## Massachusetts filtering
Two layers:
1. each source query includes `Massachusetts`
2. normalized metadata blob is regex-filtered for `massachusetts`

## Load more behavior
- Base per-source limit is 12.
- Clicking **Load more results** increases per-source limit by 12 and reruns the same query.
- This is a limit-expansion model rather than true cursor pagination.

## Diagnostics payload
On proxy failures, JSON includes:
- `requestId`
- `source`
- `target`
- `category` (`dns`, `connectivity`, `tls`, `timeout`, `unknown`)
- `code`
- `detail`
- `hint`

## UI direction
- Bootstrap 5 base
- Dark gradient + glass cards
- source chips and responsive cards
- loading spinner, status pill, warnings
