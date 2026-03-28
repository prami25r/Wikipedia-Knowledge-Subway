import type { AppContext } from './context.js';
import { ApiError } from '../middleware/errorHandler.js';
import { clusterParamSchema } from './validators.js';

export function lineHandler(context: AppContext, params: Record<string, unknown>) {
  const parsed = clusterParamSchema.safeParse(params);
  if (!parsed.success) {
    throw new ApiError(400, 'INVALID_PARAMS', 'Invalid line parameter', parsed.error.flatten());
  }

  const cluster = String(parsed.data.cluster).trim().toLowerCase();
  if (!cluster) {
    throw new ApiError(400, 'INVALID_PARAMS', 'Line id must not be empty.');
  }

  const line = context.graphService.getLine(cluster);
  if (!line) {
    throw new ApiError(404, 'LINE_NOT_FOUND', `Line ${parsed.data.cluster} was not found.`);
  }

  return line;
}
