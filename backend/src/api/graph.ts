import type { AppContext } from './context.js';

export function getGraphHandler(context: AppContext): { nodes: unknown[]; edges: unknown[] } {
  return context.graphService.getGraph();
}
