import type { AppContext } from './context.js';
import { ApiError } from '../middleware/errorHandler.js';
import { idParamSchema } from './validators.js';
import { normalizeNodeId } from '../utils/id.js';

export function neighborsHandler(context: AppContext, params: Record<string, unknown>) {
  const parsed = idParamSchema.safeParse(params);
  if (!parsed.success) {
    throw new ApiError(400, 'INVALID_PARAMS', 'Invalid node id parameter', parsed.error.flatten());
  }

  const id = normalizeNodeId(String(parsed.data.id));
  if (!id) {
    throw new ApiError(400, 'INVALID_PARAMS', 'Node id must not be empty.');
  }

  if (!context.graphService.hasNode(id)) {
    throw new ApiError(404, 'NODE_NOT_FOUND', `Station ${parsed.data.id} was not found`);
  }

  const node = context.graphService.getNode(id);
  if (!node) {
    throw new ApiError(404, 'NODE_NOT_FOUND', `Station ${parsed.data.id} was not found`);
  }

  const neighbors = context.graphService.getNeighbors(id);
  return { node, neighbors };
}
