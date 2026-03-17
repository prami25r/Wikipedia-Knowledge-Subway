import type { AppContext } from './context.js';

export function statsHandler(context: AppContext) {
  return context.graphService.getStats();
}
