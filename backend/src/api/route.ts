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

  const steps = result.path.map((nodeId, index, path) => {
    const node = context.graphService.getNode(nodeId);
    if (!node) {
      throw new ApiError(500, 'ROUTE_NODE_MISSING', `Route node ${nodeId} could not be resolved.`);
    }

    const previousCluster = index > 0 ? context.graphService.getNode(path[index - 1])?.cluster ?? node.cluster : node.cluster;
    const nextCluster = index < path.length - 1 ? context.graphService.getNode(path[index + 1])?.cluster ?? node.cluster : node.cluster;

    return {
      id: node.id,
      title: node.label,
      cluster: node.cluster,
      degree: node.degree,
      is_transfer: previousCluster !== node.cluster || nextCluster !== node.cluster,
    };
  });

  const clusters = Array.from(new Set(steps.map((step) => step.cluster)));
  let line_change_count = 0;
  for (let i = 1; i < steps.length; i += 1) {
    if (steps[i - 1].cluster !== steps[i].cluster) {
      line_change_count += 1;
    }
  }

  return {
    ...result,
    steps,
    clusters,
    line_change_count,
  };
}
