import type { AppContext } from './context.js';
import { ApiError } from '../middleware/errorHandler.js';
import { routeQuerySchema } from './validators.js';
import { normalizeNodeId } from '../utils/id.js';

export function routeHandler(context: AppContext, query: Record<string, unknown>) {
  const parsed = routeQuerySchema.safeParse(query);
  if (!parsed.success) {
    throw new ApiError(400, 'INVALID_QUERY', 'Invalid route query', parsed.error.flatten());
  }

  const start = normalizeNodeId(parsed.data.start);
  const end = normalizeNodeId(parsed.data.end);

  if (!start || !end) {
    throw new ApiError(400, 'INVALID_QUERY', 'Route start and end must not be empty.');
  }

  if (!context.graphService.hasNode(start) || !context.graphService.hasNode(end)) {
    throw new ApiError(404, 'ROUTE_NODE_NOT_FOUND', 'Start or end station does not exist.');
  }

  const result = context.routeService.shortestPath(start, end);
  if (result.path.length === 0) {
    throw new ApiError(404, 'ROUTE_NOT_FOUND', `No route found from ${parsed.data.start} to ${parsed.data.end}`);
  }

  return result;
}
