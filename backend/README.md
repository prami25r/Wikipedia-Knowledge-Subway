# Wikipedia Knowledge Subway Backend

Production-oriented backend modules for graph exploration APIs.

## Architecture

- `src/graph`: graph loading/building and graph algorithms.
- `src/services`: domain services (graph, route, search, metadata).
- `src/api`: endpoint handlers mapped to REST contracts.
- `src/middleware`: rate limit and structured error handling.
- `src/utils/id.ts`: canonical station ID normalization.
- `public/data/layout_graph.json`: startup dataset with nodes and edges.
- `tests`: unit tests for graph loading, BFS routing, search, and ID normalization.

## Endpoint behavior

- All requests use normalized paths (`/api/graph` and `/api/graph/` behave identically).
- Station IDs are normalized (trim + space/hyphen to underscore + lowercase).
- Dynamic station/neighbors routes reject empty IDs with HTTP 400.
- Unknown routes return structured HTTP 404 JSON errors.

## Endpoints

- `GET /api/graph`
- `GET /api/station/:id`
- `GET /api/search?q=`
- `GET /api/neighbors/:id`
- `GET /api/route?start=&end=`
- `GET /api/stats`
- `GET /api/export/graph.json`
- `GET /api/export/stations.csv`

## Startup flow

1. Load `public/data/layout_graph.json` from absolute path (`process.cwd()`).
2. Normalize and build Graphology graph in memory once.
3. Compute stats.
4. Build Fuse.js search index.
5. Start Node HTTP server.

## Run

```bash
npm run backend:dev
npm run backend:test
```
