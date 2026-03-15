# Wikipedia Knowledge Subway

A full-stack TypeScript web application for exploring Wikipedia topics as an interactive subway-style graph.

## Stack

- **Next.js (App Router)**
- **TypeScript**
- **Tailwind CSS**
- **Sigma.js + Graphology**
- **Supabase PostgreSQL**
- **Next.js API routes**

## Project Structure

```text
app/          # routes, pages, and API handlers
components/   # UI components
lib/          # server/client shared utilities
scripts/      # operational scripts (seed, data collection)
types/        # shared TypeScript types
api/          # typed client API wrappers
data/         # generated graph artifacts
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in values:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `OPENAI_API_KEY`

## Getting Started

```bash
npm install
npm run dev
```

## Seed Supabase

```bash
npm run seed
```

Ensure a `wikipedia_edges` table exists with the expected schema.

## Collect Wikipedia Graph Data

Run the graph collector script (writes to `data/wiki_graph.json` by default):

```bash
npm run collect:wiki
```

Override defaults:

```bash
node scripts/collect-wikipedia-graph.js \
  --seeds='["Artificial Intelligence","Physics"]' \
  --max-articles=2000 \
  --batch-size=20 \
  --rate-limit-ms=250
```

Or use a seed file containing a JSON array of topic strings:

```bash
node scripts/collect-wikipedia-graph.js --seed-file ./data/seeds.json
```

## Process Collected Graph

Compute degree, centrality, and Louvain communities from `data/wiki_graph.json` and export `data/processed_graph.json`:

```bash
npm run process:graph
```

## Build Graph Layout

Run ForceAtlas2 on `data/processed_graph.json`, iterate until convergence, normalize coordinates, and export `data/layout_graph.json`:

```bash
npm run layout:graph
```

## PostgreSQL Graph Schema (Supabase)

Schema SQL is provided at `scripts/sql/graph_schema.sql` and includes:

- `articles(id, title, summary, cluster, x, y, degree, created_at, updated_at)`
- `links(id, source, target, created_at)`

Apply it in Supabase SQL editor, then use the TypeScript data helpers in `lib/graph-data.ts`:

- `insertArticles()`
- `insertEdges()`
- `getGraphData()`
