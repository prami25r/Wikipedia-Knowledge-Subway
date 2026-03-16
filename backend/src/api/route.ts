import type { AppContext } from './context.js';
import { ApiError } from '../middleware/errorHandler.js';
import { routeQuerySchema } from './validators.js';

export function routeHandler(context: AppContext, query: Record<string, unknown>) {
  const parsed = routeQuerySchema.safeParse(query);
  if (!parsed.success) {
    throw new ApiError(400, 'INVALID_QUERY', 'Invalid route query', parsed.error.flatten());
  }

  const result = context.routeService.shortestPath(parsed.data.start, parsed.data.end);
  if (result.path.length === 0) {
    throw new ApiError(404, 'ROUTE_NOT_FOUND', `No route found from ${parsed.data.start} to ${parsed.data.end}`);
  }

  return result;
}
