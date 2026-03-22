import crypto from 'node:crypto';
import type { LayoutEdge, LayoutMap, LayoutNode, SubwayMap } from '../../shared-types/src/index.js';

export function computeDeterministicGridLayout(subwayMap: SubwayMap): LayoutMap {
  const sortedStations = subwayMap.stations.slice().sort((a, b) => a.id.localeCompare(b.id));
  const columns = Math.max(8, Math.ceil(Math.sqrt(sortedStations.length || 1)));

  const nodes: LayoutNode[] = sortedStations.map((station, index) => ({
    id: station.id,
    label: station.title,
    lineIds: station.lineIds,
    x: index % columns,
    y: Math.floor(index / columns),
  }));

  const edges: LayoutEdge[] = subwayMap.transfers.map((transfer) => ({
    source: transfer.from,
    target: transfer.to,
  }));

  const checksum = crypto
    .createHash('sha1')
    .update(JSON.stringify({ nodes: nodes.map((n) => n.id), edges }))
    .digest('hex');

  return {
    nodes,
    edges,
    algorithm: 'grid',
    checksum,
  };
}
