# Wikipedia Knowledge Subway Backend

Production-oriented backend modules for graph exploration APIs.

## Architecture

- `src/graph`: graph loading/building and graph algorithms.
- `src/services`: domain services (graph, route, search, metadata).
- `src/api`: endpoint handlers mapped to REST contracts.
- `src/middleware`: rate limit and structured error handling.
- `data/layout_graph.json`: startup dataset with nodes and edges.
- `tests`: unit tests for graph loading, BFS routing, and search.

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

1. Load `data/layout_graph.json`.
2. Build Graphology graph in memory once.
3. Compute stats.
4. Build Fuse.js search index.
5. Start HTTP server.

## Run

```bash
npm run backend:dev
npm run backend:test
```

