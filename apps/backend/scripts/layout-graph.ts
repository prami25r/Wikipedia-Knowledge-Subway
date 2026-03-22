import { promises as fs } from "node:fs";
import path from "node:path";
import Graph from "graphology";
import forceAtlas2 from "graphology-layout-forceatlas2";
import type { ProcessedWikiGraph } from "@/types/graph";

const INPUT_PATH = path.join(process.cwd(), "data", "processed_graph.json");
const OUTPUT_PATH = path.join(process.cwd(), "data", "layout_graph.json");

const MAX_ITERATIONS = 2000;
const STEP_ITERATIONS = 20;
const CONVERGENCE_EPSILON = 0.0015;
const TARGET_WIDTH = 1000;
const TARGET_HEIGHT = 1000;

type LayoutNode = {
  id: string;
  x: number;
  y: number;
  cluster: string | number;
  degree: number;
};

type LayoutGraph = {
  nodes: LayoutNode[];
  edges: Array<{ source: string; target: string }>;
};

function validateProcessedGraph(value: unknown): ProcessedWikiGraph {
  if (!value || typeof value !== "object") {
    throw new Error("Processed graph must be a JSON object.");
  }

  const candidate = value as Partial<ProcessedWikiGraph>;
  if (!Array.isArray(candidate.nodes) || !Array.isArray(candidate.edges)) {
    throw new Error("Processed graph must include nodes[] and edges[].");
  }

  return candidate as ProcessedWikiGraph;
}

async function loadProcessedGraph(filePath: string): Promise<ProcessedWikiGraph> {
  const content = await fs.readFile(filePath, "utf8");
  return validateProcessedGraph(JSON.parse(content) as unknown);
}

function createGraph(data: ProcessedWikiGraph): Graph {
  const graph = new Graph({ type: "undirected", multi: false, allowSelfLoops: false });

  for (const node of data.nodes) {
    if (!node?.id || graph.hasNode(node.id)) {
      continue;
    }

    graph.addNode(node.id, {
      degree: Number(node.degree) || 0,
      cluster: node.cluster ?? -1,
      x: Math.random(),
      y: Math.random(),
      size: 1,
    });
  }

  for (const edge of data.edges) {
    if (!edge?.source || !edge?.target || edge.source === edge.target) {
      continue;
    }

    if (!graph.hasNode(edge.source) || !graph.hasNode(edge.target)) {
      continue;
    }

    graph.mergeUndirectedEdge(edge.source, edge.target);
  }

  return graph;
}

function totalAverageDisplacement(previous: Map<string, { x: number; y: number }>, currentGraph: Graph): number {
  if (currentGraph.order === 0) {
    return 0;
  }

  let total = 0;

  currentGraph.forEachNode((node, attrs) => {
    const before = previous.get(node);
    if (!before) {
      return;
    }

    const dx = (attrs.x ?? 0) - before.x;
    const dy = (attrs.y ?? 0) - before.y;
    total += Math.sqrt(dx * dx + dy * dy);
  });

  return total / currentGraph.order;
}

function snapshotPositions(graph: Graph): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  graph.forEachNode((node, attrs) => {
    positions.set(node, {
      x: attrs.x ?? 0,
      y: attrs.y ?? 0,
    });
  });

  return positions;
}

function runUntilConvergence(graph: Graph): void {
  if (graph.order === 0) {
    return;
  }

  const settings = forceAtlas2.inferSettings(graph);

  let completed = 0;

  while (completed < MAX_ITERATIONS) {
    const before = snapshotPositions(graph);

    forceAtlas2.assign(graph, {
      iterations: STEP_ITERATIONS,
      settings,
    });

    completed += STEP_ITERATIONS;

    const displacement = totalAverageDisplacement(before, graph);
    if (displacement <= CONVERGENCE_EPSILON) {
      break;
    }
  }
}

function normalizePositions(graph: Graph): void {
  if (graph.order === 0) {
    return;
  }

  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  graph.forEachNode((_, attrs) => {
    const x = attrs.x ?? 0;
    const y = attrs.y ?? 0;

    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  });

  const width = Math.max(maxX - minX, 1e-9);
  const height = Math.max(maxY - minY, 1e-9);

  graph.updateEachNodeAttributes((_, attrs) => ({
    ...attrs,
    x: Number((((attrs.x ?? 0) - minX) / width * TARGET_WIDTH).toFixed(3)),
    y: Number((((attrs.y ?? 0) - minY) / height * TARGET_HEIGHT).toFixed(3)),
  }));
}

function buildOutput(graph: Graph): LayoutGraph {
  const nodes: LayoutNode[] = graph.nodes().map((id) => {
    const attrs = graph.getNodeAttributes(id) as {
      x?: number;
      y?: number;
      cluster?: string | number;
      degree?: number;
    };

    return {
      id,
      x: attrs.x ?? 0,
      y: attrs.y ?? 0,
      cluster: attrs.cluster ?? -1,
      degree: attrs.degree ?? 0,
    };
  });

  const edges = graph.edges().map((edgeKey) => {
    const [source, target] = graph.extremities(edgeKey);
    return { source, target };
  });

  return { nodes, edges };
}

async function saveLayout(filePath: string, output: LayoutGraph): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(output, null, 2), "utf8");
}

async function main(): Promise<void> {
  try {
    const processed = await loadProcessedGraph(INPUT_PATH);
    const graph = createGraph(processed);

    runUntilConvergence(graph);
    normalizePositions(graph);

    const output = buildOutput(graph);
    await saveLayout(OUTPUT_PATH, output);

    console.log(`Saved layout graph to ${OUTPUT_PATH} (${output.nodes.length} nodes, ${output.edges.length} edges).`);
  } catch (error) {
    console.error("Failed to build graph layout.");
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

void main();
