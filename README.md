# Wikipedia Knowledge Subway Monorepo

Wikipedia Knowledge Subway models **knowledge as infrastructure**:
- Articles → stations
- Categories → subway lines
- Cross-links → transfers
- Exploration → routes across a deterministic knowledge map

## Monorepo layout

```text
apps/
  frontend/          Next.js rendering engine (interaction + visualization)
  backend/           Node.js API/pipeline runtime
packages/
  shared-types/      Contract-first schemas shared across apps
  graph-core/        Raw ingestion normalization + typed knowledge graph build
  subway-engine/     Deterministic graph→subway transformation
  layout-engine/     Stable deterministic layout algorithms
```

## Data pipeline architecture

1. **Ingestion**: raw wiki data loaded in backend services.
2. **Graph Core**: normalized typed graph (`KnowledgeGraph`).
3. **Subway Engine**: categories become lines, stations and transfers inferred.
4. **Layout Engine**: deterministic layout (`LayoutMap`) with stable checksums.
5. **API Layer**: versioned endpoints (`/v1/graph`, `/v1/subway`, `/v1/layout`, `/v1/explore`) and compatibility endpoints under `/api/*`.

## Run frontend

```bash
npm --prefix apps/frontend install
npm --prefix apps/frontend run dev
```

## Run backend

```bash
npm --prefix apps/backend install
npm --prefix apps/backend run dev
```

## Validation

```bash
npm --prefix apps/frontend run typecheck
npm --prefix apps/backend run typecheck
npm --prefix apps/backend run test
```

## Environment

Frontend (`apps/frontend/.env.local`) supports:
- `NEXT_PUBLIC_BACKEND_URL` (defaults to `http://localhost:4000`)

Backend uses optional Supabase metadata env vars:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
