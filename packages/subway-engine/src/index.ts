import type { KnowledgeGraph, SubwayLine, SubwayMap, SubwayStation } from '../../shared-types/src/index.js';

const LINE_PALETTE = ['#22d3ee', '#38bdf8', '#818cf8', '#a78bfa', '#34d399', '#f97316', '#fb7185', '#facc15'];

export function toSubwayMap(graph: KnowledgeGraph): SubwayMap {
  const byCategory = new Map<string, string[]>();

  for (const node of graph.nodes) {
    const list = byCategory.get(node.category) ?? [];
    list.push(node.id);
    byCategory.set(node.category, list);
  }

  const lines: SubwayLine[] = Array.from(byCategory.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, stationIds], index) => ({
      id: `line_${index}`,
      name: category,
      color: LINE_PALETTE[index % LINE_PALETTE.length],
      stationIds: stationIds.sort(),
    }));

  const lineIdsByStation = new Map<string, string[]>();
  lines.forEach((line) => {
    line.stationIds.forEach((stationId) => {
      const list = lineIdsByStation.get(stationId) ?? [];
      list.push(line.id);
      lineIdsByStation.set(stationId, list);
    });
  });

  const stations: SubwayStation[] = graph.nodes.map((node) => {
    const lineIds = lineIdsByStation.get(node.id) ?? [];
    return {
      id: node.id,
      title: node.title,
      lineIds,
      transfer: lineIds.length > 1,
      rank: node.rank,
      weight: node.weight,
    };
  });

  const transfers = graph.edges
    .filter((edge) => {
      const a = lineIdsByStation.get(edge.source) ?? [];
      const b = lineIdsByStation.get(edge.target) ?? [];
      return a.some((lineId) => !b.includes(lineId));
    })
    .map((edge) => ({ from: edge.source, to: edge.target }));

  return {
    lines,
    stations,
    transfers,
    version: graph.version,
  };
}
