export type LayoutGraphNode = {
  id: string;
  label: string;
  cluster: string;
  x: number;
  y: number;
};

export type LayoutGraphEdge = {
  source: string;
  target: string;
};

export type LayoutGraphData = {
  nodes: LayoutGraphNode[];
  edges: LayoutGraphEdge[];
};

function parseGraph(data: unknown): LayoutGraphData {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid graph payload.");
  }

  const maybe = data as { nodes?: unknown; edges?: unknown };
  if (!Array.isArray(maybe.nodes) || !Array.isArray(maybe.edges)) {
    throw new Error("Graph payload must include nodes and edges arrays.");
  }

  const nodes = maybe.nodes
    .map((node) => {
      const n = node as Partial<LayoutGraphNode>;
      if (!n.id || typeof n.id !== "string") return null;

      return {
        id: n.id,
        label: typeof n.label === "string" ? n.label : n.id,
        cluster: typeof n.cluster === "string" ? n.cluster : "unknown",
        x: typeof n.x === "number" ? n.x : 0,
        y: typeof n.y === "number" ? n.y : 0,
      } satisfies LayoutGraphNode;
    })
    .filter((value): value is LayoutGraphNode => value !== null);

  const nodeIdSet = new Set(nodes.map((node) => node.id));

  const edges = maybe.edges
    .map((edge) => {
      const e = edge as Partial<LayoutGraphEdge>;
      if (!e.source || !e.target || typeof e.source !== "string" || typeof e.target !== "string") {
        return null;
      }
      if (!nodeIdSet.has(e.source) || !nodeIdSet.has(e.target)) {
        return null;
      }

      return { source: e.source, target: e.target } satisfies LayoutGraphEdge;
    })
    .filter((value): value is LayoutGraphEdge => value !== null);

  return { nodes, edges };
}

export async function loadGraphData(): Promise<LayoutGraphData> {
  const response = await fetch("/data/layout_graph.json", {
    method: "GET",
    cache: "force-cache",
  });

  if (!response.ok) {
    throw new Error(`Failed to load graph dataset: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as unknown;
  return parseGraph(data);
}
