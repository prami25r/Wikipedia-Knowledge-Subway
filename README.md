# Wikipedia Knowledge Subway

Wikipedia Knowledge Subway is a split frontend/backend repository for exploring curated Wikipedia knowledge as a subway-style network.

Current product surfaces:

- `/` -> main interactive explorer with line filters, graph canvas, station sidebar, and hub highlights
- `/route` -> dedicated route planner
- `/station/[id]` -> station detail page
- `/line/[cluster]` -> line overview page

## Repository Layout

- `frontend/` -> Next.js 15 + React 19 + TypeScript explorer UI
- `backend/` -> standalone Node.js + TypeScript graph API
- `backend/data/layout_graph.json` -> canonical runtime dataset
- `backend/data/raw/*.md` -> curated raw line/topic inputs

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend checks:

```bash
cd frontend
npm run typecheck
npm run build
```

## Backend

```bash
cd backend
npm install
npm run dev
```

Backend checks:

```bash
cd backend
npm run typecheck
npm run test
```

## Notes

- Frontend talks to backend via `NEXT_PUBLIC_BACKEND_URL` or `BACKEND_URL` and falls back to `http://127.0.0.1:4000`.
- Backend keeps the graph in memory after loading `backend/data/layout_graph.json`.
- Line-level APIs now expose subway-oriented summaries that power the line pages and graph filters.
