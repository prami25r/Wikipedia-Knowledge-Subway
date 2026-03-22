import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Graph from 'graphology';
import type { GraphDataset } from '../types/graph.js';
import { normalizeNodeId } from '../utils/id.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_DATASET_PATHS = [
  path.resolve(__dirname, '../../data/layout_graph.json'),
  path.resolve(__dirname, '../../../data/layout_graph.json'),
];

function resolveDefaultGraphDatasetPath(): string {
  for (const candidate of DEFAULT_DATASET_PATHS) {
    if (fs.existsSync(candidate)) return candidate;
  }

  throw new Error(
    `Unable to locate graph dataset. Checked: ${DEFAULT_DATASET_PATHS.join(', ')}`,
  );
}

export function loadGraphDataset(filePath = resolveDefaultGraphDatasetPath()): GraphDataset {
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = JSON.parse(raw) as GraphDataset;

  if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
    throw new Error('Invalid dataset format. Expected nodes[] and edges[].');
  }

  return parsed;
}

export function buildGraph(dataset: GraphDataset): Graph {
  const graph = new Graph({ multi: false, type: 'undirected' });

  for (const node of dataset.nodes) {
    const normalizedId = normalizeNodeId(node.id);
    if (!normalizedId || graph.hasNode(normalizedId)) continue;

    graph.addNode(normalizedId, {
      id: normalizedId,
      sourceId: node.id,
      label: node.label,
      cluster: node.cluster,
      x: node.x,
      y: node.y,
    });
  }

  for (const edge of dataset.edges) {
    const source = normalizeNodeId(edge.source);
    const target = normalizeNodeId(edge.target);
    if (!source || !target) continue;
    if (!graph.hasNode(source) || !graph.hasNode(target)) continue;
    if (!graph.hasEdge(source, target)) {
      graph.addUndirectedEdge(source, target);
    }
  }

  graph.forEachNode((nodeKey) => {
    graph.mergeNodeAttributes(nodeKey, { degree: graph.degree(nodeKey) });
  });

  // eslint-disable-next-line no-console
  console.log(`[graphLoader] loaded nodes=${graph.order} edges=${graph.size}`);

  if (graph.order === 0 || graph.size === 0) {
    throw new Error('Graph dataset is empty after loading.');
  }

  return graph;
}
