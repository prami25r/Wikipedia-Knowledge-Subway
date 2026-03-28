# Backend

Standalone Node/TypeScript backend for Wikipedia Knowledge Subway.

## Structure

- `src/api` -> endpoint handlers and request validation
- `src/services` -> graph, search, route, metadata, and line summary service layer
- `src/graph` -> Graphology loader and utility functions
- `src/middleware` -> structured errors and in-memory rate limiting
- `src/utils` -> ID normalization helpers
- `data/layout_graph.json` -> canonical runtime graph dataset
- `tests` -> backend unit tests

## Endpoints

- `GET /health`
- `GET /api/graph`
- `GET /api/station/:id`
- `GET /api/search?q=`
- `GET /api/neighbors/:id`
- `GET /api/route?start=&end=`
- `GET /api/stats`
- `GET /api/lines`
- `GET /api/line/:cluster`
- `GET /api/export/graph.json`
- `GET /api/export/stations.csv`

## Run backend only

```bash
cd backend
npm install
npm run dev
```

## Test backend only

```bash
cd backend
npm run test
```
