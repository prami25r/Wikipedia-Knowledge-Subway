# Backend API + Pipeline Runtime

## Responsibilities

- Ingestion and normalization of raw knowledge data
- Typed graph construction
- Subway abstraction generation
- Deterministic layout generation
- Exploration/recommendation primitives

## Endpoints

### Versioned contracts
- `GET /v1/graph`
- `GET /v1/subway`
- `GET /v1/layout`
- `GET /v1/explore?focus=<stationId>`

### Compatibility endpoints
- `GET /api/graph`
- `GET /api/station/:id`
- `GET /api/search?q=`
- `GET /api/neighbors/:id`
- `GET /api/route?start=&end=`
- `GET /api/stats`
- `GET /api/export/graph.json`
- `GET /api/export/stations.csv`

## Run

```bash
npm --prefix apps/backend run dev
npm --prefix apps/backend run typecheck
npm --prefix apps/backend run test
```
