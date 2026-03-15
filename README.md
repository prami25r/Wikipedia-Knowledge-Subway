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
scripts/      # operational scripts (seed, migrations helpers)
types/        # shared TypeScript types
api/          # typed client API wrappers
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
