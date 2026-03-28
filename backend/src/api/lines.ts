import type { AppContext } from './context.js';

export function linesHandler(context: AppContext) {
  return {
    lines: context.graphService.getLines(),
  };
}
