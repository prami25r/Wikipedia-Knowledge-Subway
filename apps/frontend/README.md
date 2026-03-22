# Frontend Rendering Engine

The frontend is organized as a rendering engine with explicit layers:

- **Data layer**: `lib/backend-api.ts`
- **State layer**: `lib/frontend-store.ts`
- **Rendering layer**: `components/GraphCanvas.tsx`
- **Interaction layer**: `SearchBar`, `RouteViewer`, `StationPanel`

## Run

```bash
npm --prefix apps/frontend run dev
npm --prefix apps/frontend run typecheck
```
