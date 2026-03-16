import type { AppContext } from './context.js';
import { ApiError } from '../middleware/errorHandler.js';
import { stationIdParamSchema } from './validators.js';

export async function stationHandler(context: AppContext, params: Record<string, unknown>) {
  const parsed = stationIdParamSchema.safeParse(params);
  if (!parsed.success) {
    throw new ApiError(400, 'INVALID_PARAMS', 'Invalid station id parameter', parsed.error.flatten());
  }

  const station = context.graphService.getNode(parsed.data.id);
  if (!station) {
    throw new ApiError(404, 'STATION_NOT_FOUND', `Station ${parsed.data.id} was not found`);
  }

  const metadata = await context.metadataService.getStationMetadata(parsed.data.id);
  const neighbors = context.graphService.getNeighbors(parsed.data.id).map((neighbor) => ({
    id: neighbor.id,
    title: neighbor.label,
    cluster: neighbor.cluster,
    degree: neighbor.degree,
  }));

  return {
    id: station.id,
    title: metadata.title || station.label,
    cluster: station.cluster,
    summary: metadata.summary,
    categories: metadata.categories,
    degree: station.degree,
    neighbors,
    wikipedia_url: metadata.wikipedia_url,
  };
}
