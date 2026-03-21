# Wikipedia Knowledge Subway

Clean split repository with two top-level apps:

- `frontend/` → Next.js + TypeScript UI (Sigma.js graph explorer)
- `backend/` → Node.js + TypeScript API (Graphology graph engine)

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

- Frontend talks to backend via `NEXT_PUBLIC_BACKEND_URL` (defaults to `http://localhost:4000`).
- Backend uses `backend/data/layout_graph.json` as canonical graph dataset.
