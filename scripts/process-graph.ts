import { promises as fs } from "node:fs";
import path from "node:path";
import { UndirectedGraph } from "graphology";
import louvain from "graphology-community-louvain";
import type { RawWikiGraph, ProcessedWikiGraph, ProcessedWikiGraphNode } from "@/types/graph";

const INPUT_PATH = path.join(process.cwd(), "data", "wiki_graph.json");
const OUTPUT_PATH = path.join(process.cwd(), "data", "processed_graph.json");

function ensureRawGraphShape(value: unknown): RawWikiGraph {
  if (!value || typeof value !== "object") {
    throw new Error("Input JSON must be an object.");
  }

  const candidate = value as Partial<RawWikiGraph>;
  if (!Array.isArray(candidate.nodes) || !Array.isArray(candidate.edges)) {
    throw new Error("Input JSON must include 'nodes' and 'edges' arrays.");
  }

  return {
    nodes: candidate.nodes,
    edges: candidate.edges,
  } as RawWikiGraph;
}

async function readInputGraph(inputPath: string): Promise<RawWikiGraph> {
  const content = await fs.readFile(inputPath, "utf8");
  const parsed = JSON.parse(content) as unknown;
  return ensureRawGraphShape(parsed);
}

function buildGraph(data: RawWikiGraph): UndirectedGraph {
  const graph = new UndirectedGraph();

  for (const node of data.nodes) {
    if (!node?.id) {
      continue;
    }

    if (!graph.hasNode(node.id)) {
      graph.addNode(node.id, {
        summary: node.summary ?? "",
        categories: Array.isArray(node.categories) ? node.categories : [],
      });
    }
  }

  for (const edge of data.edges) {
    if (!edge?.source || !edge?.target || edge.source === edge.target) {
      continue;
    }

    if (graph.hasNode(edge.source) && graph.hasNode(edge.target)) {
      graph.mergeUndirectedEdge(edge.source, edge.target);
    }
  }

  return graph;
}

function computeNodeMetrics(graph: UndirectedGraph): ProcessedWikiGraphNode[] {
  const order = Math.max(graph.order - 1, 1);
  const communities = louvain(graph) as Record<string, number>;

  return graph.nodes().map((nodeId: string) => {
    const degree = graph.degree(nodeId);
    const centrality = Number((degree / order).toFixed(6));
    const cluster = communities[nodeId] ?? -1;

    return {
      id: nodeId,
      degree,
      centrality,
      cluster,
    };
  });
}

function toProcessedGraph(graph: UndirectedGraph): ProcessedWikiGraph {
  const nodes = computeNodeMetrics(graph);
  const edges = graph.edges().map((edgeKey: string) => {
    const extremities = graph.extremities(edgeKey);
    return {
      source: extremities[0],
      target: extremities[1],
    };
  });

  return {
    nodes,
    edges,
  };
}

async function writeOutputGraph(outputPath: string, graph: ProcessedWikiGraph): Promise<void> {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(graph, null, 2), "utf8");
}

async function main(): Promise<void> {
  try {
    const rawGraph = await readInputGraph(INPUT_PATH);
    const graph = buildGraph(rawGraph);
    const processedGraph = toProcessedGraph(graph);

    await writeOutputGraph(OUTPUT_PATH, processedGraph);

    console.log(
      `Processed graph saved to ${OUTPUT_PATH} with ${processedGraph.nodes.length} nodes and ${processedGraph.edges.length} edges.`,
    );
  } catch (error) {
    console.error("Failed to process graph data.");
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

void main();
