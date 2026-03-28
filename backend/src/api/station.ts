import type { AppContext } from './context.js';
import { ApiError } from '../middleware/errorHandler.js';
import { stationIdParamSchema } from './validators.js';
import { normalizeNodeId } from '../utils/id.js';

export async function stationHandler(context: AppContext, params: Record<string, unknown>) {
  const parsed = stationIdParamSchema.safeParse(params);
  if (!parsed.success) {
    throw new ApiError(400, 'INVALID_PARAMS', 'Invalid station id parameter', parsed.error.flatten());
  }

  const rawId = String(parsed.data.id);
  const id = normalizeNodeId(rawId);

  // eslint-disable-next-line no-console
  console.log(`[station] lookup raw="${rawId}" normalized="${id}"`);

  if (!id) {
    throw new ApiError(400, 'INVALID_PARAMS', 'Station id must not be empty.');
  }

  if (!context.graphService.hasNode(id)) {
    throw new ApiError(404, 'STATION_NOT_FOUND', `Station ${rawId} was not found`);
  }

  const station = context.graphService.getNode(id);
  if (!station) {
    throw new ApiError(404, 'STATION_NOT_FOUND', `Station ${rawId} was not found`);
  }

  const metadata = await context.metadataService.getStationMetadata(id);
  const neighbors = context.graphService.getNeighbors(id).map((neighbor) => ({
    id: neighbor.id,
    title: neighbor.label,
    cluster: neighbor.cluster,
    degree: neighbor.degree,
  }));
  const neighborClustersMap = new Map<string, number>();
  for (const neighbor of neighbors) {
    neighborClustersMap.set(neighbor.cluster, (neighborClustersMap.get(neighbor.cluster) ?? 0) + 1);
  }
  const neighbor_clusters = Array.from(neighborClustersMap.entries())
    .map(([cluster, count]) => ({ cluster, count }))
    .sort((left, right) => right.count - left.count || left.cluster.localeCompare(right.cluster));
  const is_transfer_station = neighbor_clusters.some((entry) => entry.cluster !== station.cluster);

  return {
    id: station.id,
    title: metadata.title || station.label,
    cluster: station.cluster,
    summary: metadata.summary,
    categories: metadata.categories,
    degree: station.degree,
    neighbors,
    neighbor_clusters,
    is_transfer_station,
    wikipedia_url: metadata.wikipedia_url,
  };
}
