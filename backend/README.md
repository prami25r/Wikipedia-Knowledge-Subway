# Backend

Standalone Node/TypeScript backend for Wikipedia Knowledge Subway.

## Structure

- `src/api`: endpoint handlers
- `src/services`: graph/search/route/metadata service layer
- `src/graph`: Graphology loader and utilities
- `src/middleware`: structured errors + rate limiter
- `src/utils`: ID normalization
- `data/layout_graph.json`: canonical graph dataset
- `tests`: backend unit tests

## Endpoints

- `GET /health`
- `GET /api/graph`
- `GET /api/station/:id`
- `GET /api/search?q=`
- `GET /api/neighbors/:id`
- `GET /api/route?start=&end=`
- `GET /api/stats`
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
