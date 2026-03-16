import type { AppContext } from './context.js';
import { ApiError } from '../middleware/errorHandler.js';
import { idParamSchema } from './validators.js';

export function neighborsHandler(context: AppContext, params: Record<string, unknown>) {
  const parsed = idParamSchema.safeParse(params);
  if (!parsed.success) {
    throw new ApiError(400, 'INVALID_PARAMS', 'Invalid node id parameter', parsed.error.flatten());
  }

  const node = context.graphService.getNode(parsed.data.id);
  if (!node) {
    throw new ApiError(404, 'NODE_NOT_FOUND', `Station ${parsed.data.id} was not found`);
  }

  const neighbors = context.graphService.getNeighbors(parsed.data.id);
  return { node, neighbors };
}
