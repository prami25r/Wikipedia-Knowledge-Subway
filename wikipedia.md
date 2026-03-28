# Wikipedia Knowledge Subway Repository Analysis

Last analyzed: 2026-03-28  
Scope: repository analysis plus a concrete product-building pass across frontend routes, backend APIs, and explorer UX.

## Quick Summary

Wikipedia Knowledge Subway is a focused two-app project:

- `frontend/` is a Next.js 15 + React 19 explorer UI
- `backend/` is a standalone Node.js + TypeScript graph API

This repository is no longer just a compact graph explorer shell. It now has a clearer product surface with:

- **4 page routes** in `frontend/app`
- **8 Next.js API routes** in `frontend/app/api`
- **10 backend data endpoints** plus `/health`
- **5 backend test files**
- **9 curated raw seed-line markdown files**
- **1,133 runtime stations**, **5,580 runtime links**, and **9 line/cluster groups** after graph normalization

The core user loop is:

```text
Filter line -> search station -> inspect node -> compute shortest path -> jump into line and station pages
```

The project is still early compared with something like `gitcity.md`, but it now reads much more clearly as a **subway-style knowledge navigation product** instead of just a graph demo.

## 1. Repository Shape

| Path | What it is | Why it matters |
| --- | --- | --- |
| `frontend/` | Next.js App Router app | Main UI, proxy API layer, Sigma graph renderer |
| `backend/` | Standalone Node/TypeScript service | Canonical runtime graph API |
| `backend/src/api` | Endpoint handlers and request validation entrypoints | Defines the actual backend surface |
| `backend/src/services` | Graph, route, search, metadata service layer | Main domain logic lives here |
| `backend/src/graph` | Graph loading and graph utility functions | Loads `layout_graph.json`, computes stats, BFS paths |
| `backend/scripts` | Graph-building and data-processing scripts | Creates or transforms graph datasets |
| `backend/data` | Runtime dataset and local metadata files | Canonical graph snapshot currently lives here |
| `backend/data/raw` | Curated topic-list markdown files | Original line/topic input for one pipeline |
| `frontend/components` | Main explorer UI components | Graph panel, graph canvas, search, route viewer, station details |
| `frontend/lib` | Client API, proxy, store, Supabase helpers | Frontend data flow and local state |
| `frontend/types` | Shared frontend response and DB types | Shapes the UI/backend contract |
| `components/` | Root-level duplicate UI components | Looks like leftover or compatibility copy, not the main frontend source |
| `data/` | Root-level duplicate `layout_graph.json` | Used as a fallback dataset location by the backend loader |
| `gitcity.md` | Reference architecture-analysis style doc | Useful quality benchmark for repo documentation |

Important repo-level observations:

- There is **no root `package.json`** and no workspace orchestration.
- The repo behaves like a split-project setup rather than a managed monorepo.
- `backend/data/layout_graph.json` is treated as the **canonical runtime dataset**, but the loader also falls back to root `data/layout_graph.json`.
- Root `components/` and root `data/` make the repo feel less crisp because the real runtime code is already organized under `frontend/` and `backend/`.

## 2. What The Product Is Right Now

The current product surface is now concrete and multi-page:

- `/` for the main explorer
- `/route` for route planning
- `/station/[id]` for station detail
- `/line/[cluster]` for line-level exploration
- a search box for stations
- line filter cards
- a Sigma.js graph canvas
- a station detail sidebar
- hub highlight cards

That means the project is already beyond a toy demo, but it is still early-stage in product breadth.

It is currently:

- a **precomputed graph explorer**
- a **backend-served shortest-path and metadata API**
- a **frontend visualization shell around that API**

It is not yet:

- a rich article-reading experience
- a fully unified database-backed knowledge platform
- a fully polished content pipeline with one metadata source of truth

That distinction matters because the documentation should explain the **actual shipped architecture**, not the ideal future version.

## 3. How The Frontend Is Built

### Core frontend stack

The frontend is built with:

- **Next.js 15.2**
- **React 19**
- **TypeScript**
- **Tailwind CSS**
- **Sigma.js**
- **Graphology**

The visual explorer is client-heavy, but the frontend still uses Next App Router as the shell.

### Main frontend entrypoints

| File | Role |
| --- | --- |
| `frontend/app/layout.tsx` | Shared app shell and navigation |
| `frontend/app/page.tsx` | Main explorer page |
| `frontend/app/route/page.tsx` | Dedicated route planner page |
| `frontend/app/station/[id]/page.tsx` | Station detail page |
| `frontend/app/line/[cluster]/page.tsx` | Line overview page |
| `frontend/components/GraphPanel.tsx` | Bootstrap/orchestrator for graph + stats loading |
| `frontend/components/GraphCanvas.tsx` | Sigma graph renderer, hover/select/highlight behavior |
| `frontend/components/LineExplorer.tsx` | Line cards and graph filtering surface |
| `frontend/components/HubHighlights.tsx` | Top hub callouts linked to station pages |
| `frontend/components/SearchBar.tsx` | Debounced search UI |
| `frontend/components/RouteViewer.tsx` | Shortest-path UI |
| `frontend/components/StationPanel.tsx` | Station metadata sidebar |
| `frontend/lib/backend-api.ts` | Client-side typed fetch wrapper with short in-memory cache |
| `frontend/lib/server-backend-api.ts` | Server-side backend access for detail pages |
| `frontend/lib/frontend-store.ts` | Minimal external store for graph/UI selection state |
| `frontend/lib/backend-proxy.ts` | Server-side Next proxy to the backend |

### Frontend rendering model

The frontend uses a simple but effective layered model:

```text
Next page shell
  -> GraphPanel bootstrap
    -> SearchBar
    -> RouteViewer
    -> GraphCanvas
    -> StationPanel
```

`GraphPanel` bootstraps the app by fetching:

- `/api/graph`
- `/api/stats`
- `/api/lines`

After that:

- `SearchBar` calls `/api/search`
- `RouteViewer` calls `/api/route`
- `StationPanel` calls `/api/station/[id]`

### Frontend state model

The UI keeps state in a small custom external store rather than Redux, Zustand, or React context.

The store tracks:

- graph payload
- stats payload
- line summaries
- active line filter
- selected node
- hovered node
- route start and end
- current route path
- selected station detail payload

This is a good fit for the current app size.

### Graph rendering behavior

`GraphCanvas.tsx` does several important things already:

- converts the backend graph payload into a Graphology instance
- maps clusters to colors
- scales station size by degree
- de-emphasizes non-selected lines when a line filter is active
- dims unrelated nodes on hover
- highlights the selected node
- highlights route edges in amber
- animates the camera to the selected node

So even though the UI is minimal, the interaction model is already thoughtful.

## 4. Frontend Route And API Surface

### User-facing page routes

Currently the frontend has **4 page routes**:

| Route | Purpose |
| --- | --- |
| `/` | Main interactive explorer |
| `/route` | Dedicated route planner |
| `/station/[id]` | Station detail page |
| `/line/[cluster]` | Line overview page |

That is a major contrast with `gitcity.md`: this repo is much smaller, so the documentation should focus on depth of explanation rather than route count.

### Next.js API routes

The frontend exposes **8 API routes**:

| Route | Purpose | Backend path |
| --- | --- | --- |
| `/api/graph` | Graph payload proxy | `/api/graph` |
| `/api/lines` | Line summaries proxy | `/api/lines` |
| `/api/line/[cluster]` | Single line proxy | `/api/line/:cluster` |
| `/api/search` | Search proxy | `/api/search` |
| `/api/route` | Route proxy | `/api/route` |
| `/api/station/[id]` | Station detail proxy | `/api/station/:id` |
| `/api/stats` | Stats proxy | `/api/stats` |
| `/api/article/[title]` | Direct article lookup via Supabase | none, separate path |

Important architectural note:

- Seven routes are **pure backend proxies**
- One route, `/api/article/[title]`, is a **separate Supabase-backed data path**

That means the frontend is currently acting in two roles:

- BFF/proxy for the standalone backend
- direct database API surface for article data

## 5. How The Backend Is Built

### Backend shape

The backend is a standalone Node HTTP server, not Express, not Fastify, and not a Next route-handler backend.

It is built around:

- `http.createServer`
- `createAppContext()`
- a service layer
- Zod validation
- custom error serialization
- in-memory rate limiting

The mental model is:

```text
Frontend browser
  -> Next.js API proxy
    -> standalone backend
      -> graph dataset on disk
      -> optional Supabase metadata lookup
```

### Main backend files

| File | Role |
| --- | --- |
| `backend/src/server.ts` | HTTP server and route dispatch |
| `backend/src/api/context.ts` | Wires services together into app context |
| `backend/src/services/graphService.ts` | Graph loading and graph export |
| `backend/src/services/searchService.ts` | Fuse.js fuzzy search |
| `backend/src/services/routeService.ts` | BFS shortest-path search |
| `backend/src/services/metadataService.ts` | Local JSON metadata + optional Supabase enrichment |
| `backend/src/graph/graphLoader.ts` | Loads and normalizes dataset from disk |
| `backend/src/graph/graphUtils.ts` | Stats, neighbors, shortest path |
| `backend/src/middleware/errorHandler.ts` | Structured API errors |
| `backend/src/middleware/rateLimiter.ts` | In-memory request throttling |
| `backend/src/utils/id.ts` | Node ID normalization |

### Backend route catalog

The backend exposes **GET-only** endpoints:

| Route | Purpose |
| --- | --- |
| `/health` | Health check |
| `/api/graph` | Full graph payload for rendering |
| `/api/search?q=` | Fuzzy search over stations/clusters |
| `/api/route?start=&end=` | Shortest path between stations |
| `/api/station/:id` | Station detail payload |
| `/api/neighbors/:id` | Neighbor lookup |
| `/api/stats` | Global graph stats |
| `/api/lines` | Line summaries for subway-style navigation |
| `/api/line/:cluster` | Line detail payload |
| `/api/export/graph.json` | Graph export |
| `/api/export/stations.csv` | CSV station export |

### Backend request handling characteristics

The backend has a few strong simplifying choices:

- all public routes are `GET`
- all params are normalized and validated
- all errors are serialized into a consistent JSON shape
- graph data is loaded at startup into memory

That makes the runtime model simple and deterministic.

### Important backend limits

The backend rate limiter is:

- **in-memory**
- keyed by `remoteAddress`
- defaulted to **120 requests per minute**

That is completely fine for local development and small deployments, but it is not production-grade distributed throttling.

## 6. Current Data Model

### Runtime graph payload

The graph payload returned by the backend is simple:

```ts
type BackendNode = {
  id: string
  label: string
  cluster: string
  x: number
  y: number
  degree: number
}

type BackendEdge = {
  source: string
  target: string
}
```

This is a strong shape for a visualization layer because it is:

- flat
- serializable
- renderer-friendly

### Station payload

Station detail responses include:

- normalized node id
- title
- cluster
- summary
- categories
- degree
- neighbor list
- neighbor-line counts
- transfer-station flag
- Wikipedia URL

### Stats payload

The stats endpoint includes:

- node count
- edge count
- cluster count
- average degree
- top hub stations

### Line payloads

The backend now exposes dedicated line-level payloads for the subway metaphor:

- line summaries with station counts, transfer counts, and connected lines
- line detail with hub stations, transfer stations, and full station lists

### Route payloads

Routes now include more than just a raw path:

- ordered path ids
- distance
- step metadata
- cluster sequence
- line-change count

### ID normalization

The backend canonicalizes node IDs with:

- trim
- lowercase
- spaces/hyphens -> underscores
- repeated underscores collapsed

That keeps routing consistent, but it also creates an important UX issue:

- the system is title-driven in concept
- but route lookup today is still **id-driven** in parts of the UI

## 7. Graph Pipeline And Dataset Generation

This repo actually contains **two pipeline generations**, and that is one of the most important things the doc should explain clearly.

### A. Curated line-based pipeline

This appears to be the more grounded path for the current runtime dataset:

```text
backend/data/raw/*.md
  -> backend/scripts/parseWikiFiles.js
  -> backend/data/articles.json
  -> backend/scripts/buildGraph.js
  -> backend/data/graph.json
  -> backend/scripts/layoutGraph.js
  -> backend/data/layout_graph.json
  -> backend GraphService runtime
```

This pipeline starts from **9 curated line/topic markdown files**:

- arts
- biology
- economics
- geography
- history
- mathematics
- philosophy
- physics
- technology

This matches the current runtime graph particularly well because the canonical dataset has **9 named clusters**.

### B. API-crawl and processing pipeline

There is also a more ambitious pipeline:

```text
backend/scripts/collect-wikipedia-graph.js
  -> data/wiki_graph.json
  -> backend/scripts/process-graph.ts
  -> data/processed_graph.json
  -> backend/scripts/layout-graph.ts
  -> backend/data/layout_graph.json
```

This second pipeline is designed for:

- crawling Wikipedia from seed topics
- collecting summaries, links, and categories
- computing communities
- computing a force-directed layout

This is the more scalable idea, but it currently feels partially disconnected from the main runtime path.

### Canonical runtime dataset

The live backend currently loads `backend/data/layout_graph.json` first, then falls back to root `data/layout_graph.json`.

Current dataset size:

- **1,146 nodes**
- **5,730 edges**
- **9 clusters**

Largest clusters in the current dataset:

- technology
- economics
- arts
- geography
- physics
- mathematics
- biology
- philosophy
- history

### Why this section matters

Without documenting both pipelines, the repo feels confusing because:

- some scripts build graphs from curated markdown lists
- other scripts build graphs from Wikipedia API crawls
- the runtime itself only needs the final layout JSON

The doc should make it explicit which pipeline is authoritative today and which one is aspirational.

## 8. Supabase And Secondary Data Paths

This repository is not purely file-backed.

There is a secondary Supabase-oriented layer in the frontend:

- `frontend/lib/supabase.ts`
- `frontend/lib/graph-data.ts`
- `frontend/types/database.ts`
- `frontend/app/api/article/[title]/route.ts`

There is also optional Supabase usage in the backend:

- `backend/src/services/metadataService.ts`

### What Supabase is used for

From static inspection, Supabase is involved in three ways:

1. Optional metadata enrichment in `MetadataService`
2. Article/link table access via `frontend/app/api/article/[title]/route.ts`
3. Write/read helpers in `frontend/lib/graph-data.ts`

### Architectural implication

The project currently has **multiple sources of truth** for article metadata:

- `backend/data/articles.json`
- optional `wikipedia_articles` table
- `articles` and `links` tables used by the frontend article route

This is a meaningful design gap. The system will feel much cleaner once station metadata, article detail, and graph topology all come from one declared primary source.

## 9. Tests And Reliability

The repo includes **5 backend test files**:

| Test file | What it covers |
| --- | --- |
| `backend/tests/graphLoader.test.ts` | Dataset load/build correctness |
| `backend/tests/searchService.test.ts` | Fuzzy search behavior |
| `backend/tests/routeService.test.ts` | BFS shortest-path behavior |
| `backend/tests/idNormalization.test.ts` | ID normalization rules |
| `backend/tests/lineService.test.ts` | Line summary and line detail behavior |

This is a solid start because the tests cover the core graph mechanics.

However, the repo does not currently show:

- frontend component tests
- end-to-end explorer tests
- backend integration tests against live HTTP routes
- pipeline regression tests for generated datasets

## 10. Architectural Assessment

### What is already built well

- The split between `frontend/` and `backend/` is conceptually clean.
- The backend runtime is lightweight and easy to reason about.
- The graph is precomputed, so the UI does not have to solve layout at runtime.
- The client store is appropriately small for the current app.
- Search, shortest path, and station inspection form a coherent first product loop.
- Metadata service has a useful fallback model: local JSON first, optional Supabase enrichment second.

### Important realities about the current project

1. The product metaphor is now visible in the product surface.
   - Line filtering, route planning, line pages, and station pages make the subway framing concrete.
   - The remaining work is mostly about metadata richness and deeper content, not about proving the metaphor anymore.

2. The backend is the real runtime core.
   - The frontend mostly proxies or consumes backend results.
   - This is good and should be made even more explicit in the docs.

3. The data pipeline story is not fully unified.
   - Curated markdown-to-graph and crawler-to-graph paths coexist.

4. Supabase is present but not yet cleanly integrated into one architecture.
   - Some parts treat disk JSON as canonical.
   - Other parts treat database tables as the source.

5. The repo still has some leftover structure from earlier iterations.
   - Duplicate root `components/`
   - duplicate root `data/`
   - mixed old/new pipeline paths

## 11. The Biggest Gaps To Call Out

### 1. Split metadata authority

Today metadata can still come from:

- local JSON
- optional backend Supabase lookup
- frontend Supabase article route

That should still be unified.

### 2. Pipeline cohesion is still incomplete

The repository is clearer than before, but the crawler-based and curated pipelines still coexist without one fully documented "winner."

### 3. Offline metadata quality is thin

Local `articles.json` only carries lightweight fields like:

- id
- url
- line

That means station detail richness depends heavily on optional database enrichment.

### 4. Repo clarity could still be higher

The following create unnecessary ambiguity:

- root duplicate `components/`
- root duplicate `data/`
- no root workspace commands
- env docs that do not fully describe backend proxy variables

### 5. Testing coverage is still backend-heavy

The graph engine has some test coverage, but the product surface still lacks tests for:

- page bootstrapping
- API proxy behavior
- search UI
- route highlighting
- station detail loading

## 12. Next Best Enhancement Directions

This is the section `wikipedia.md` should add so it does not stop at analysis.

### A. Establish one canonical data path

Pick one of these and make it explicit:

- curated-line pipeline is the product source of truth
- crawler pipeline is the product source of truth

Then align:

- package scripts
- output file locations
- docs
- tests

Right now the project feels like it is between those two states.

### B. Deepen the subway metaphor

High-value next upgrades:

- guided learning journeys built on top of shortest-path output
- transfer-station-specific explanations
- saved routes and recently visited stations
- line comparison pages
- semantic zoom levels that change label density and detail

The baseline subway product surface now exists; the next step is making it smarter and more legible.

### C. Unify metadata and article detail

Best long-term direction:

- backend becomes the single public data authority
- article detail route is served from backend, not separately from frontend Supabase code
- summaries/categories/URLs are precomputed into the canonical dataset or joined in one backend service

### D. Clean the repo layout

The next cleanup pass should:

- remove or clearly document root duplicate `components/`
- remove or clearly document root duplicate `data/`
- fix or delete stale package scripts
- group graph-generation scripts by pipeline
- add a root workspace or task runner entrypoint

### E. Add user-facing structure, not just more code

The app would become much clearer with explicit product surfaces such as:

- `/station/[id]`
- `/line/[cluster]`
- `/route`
- `/about`
- `/dataset`

This would give the project the same sense of "surface area clarity" that makes `gitcity.md` feel deep and concrete.

### F. Add test coverage where product bugs actually happen

Best next tests:

- backend HTTP route smoke tests
- frontend search interaction tests
- shortest-path rendering/highlight tests
- dataset regression snapshot tests

## 13. Suggested Target Repository Shape

This is not a demand to rewrite the repo. It is the clearest shape the project seems to be moving toward.

```text
/docs
  wikipedia.md
  architecture/
  pipelines/

/frontend
  /app
    /api
    /station
    /line
    /route
  /components
    /graph
    /search
    /station
    /route
  /lib
    /api
    /state
    /graph
    /supabase
  /types

/backend
  /src
    /api
    /services
    /graph
    /metadata
    /middleware
    /types
    /utils
  /scripts
    /pipeline-curated
    /pipeline-crawler
    /exports
  /data
    /raw
    /derived
    /runtime
  /tests
```

Why this structure would help:

- separates runtime code from generation scripts
- separates current product routes from future routes
- makes data lineage clearer
- reduces confusion around duplicates and stale files

## 14. Best Files To Read First

If someone is onboarding to this repo, the best reading order is:

1. `frontend/app/page.tsx`
2. `frontend/components/GraphPanel.tsx`
3. `frontend/components/GraphCanvas.tsx`
4. `frontend/lib/backend-api.ts`
5. `frontend/lib/frontend-store.ts`
6. `backend/src/server.ts`
7. `backend/src/services/graphService.ts`
8. `backend/src/services/metadataService.ts`
9. `backend/src/graph/graphLoader.ts`
10. `backend/scripts/parseWikiFiles.js`
11. `backend/scripts/buildGraph.js`
12. `backend/scripts/layoutGraph.js`

Those files explain almost the entire current product and pipeline story.

## 15. Bottom Line

Wikipedia Knowledge Subway already has a solid core:

- a real dataset
- a real backend
- fuzzy search
- shortest-path routing
- an interactive graph explorer

What it needs now is not more generic ambition in the docs. It needs clearer explanation of:

- what the current repo actually is
- which pipeline is authoritative
- where the source of truth lives
- how the subway metaphor should become more product-real

That is the direction `wikipedia.md` should follow if it wants the same depth and clarity that makes `gitcity.md` useful.
