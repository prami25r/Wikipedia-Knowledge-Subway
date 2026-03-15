import type { GraphRendererEdge, GraphRendererNode } from "@/components/GraphRenderer";

type ClusterLabel = {
  name: string;
  x: number;
  y: number;
  color: string;
};

type ExportGraphViewParams = {
  nodes: GraphRendererNode[];
  edges: GraphRendererEdge[];
  selectedTitle: string;
  routePath: string[];
  highlightedPathEdgeKeys: string[];
  clusterLabels: ClusterLabel[];
  width?: number;
  height?: number;
  scale?: number;
};

function toEdgeKey(source: string, target: string) {
  return source < target ? `${source}::${target}` : `${target}::${source}`;
}

export function exportGraphViewAsPng({
  nodes,
  edges,
  selectedTitle,
  routePath,
  highlightedPathEdgeKeys,
  clusterLabels,
  width = 2200,
  height = 1400,
  scale = 2,
}: ExportGraphViewParams): string {
  if (nodes.length === 0) {
    throw new Error("No visible nodes to export.");
  }

  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not initialize canvas export.");
  }

  context.scale(scale, scale);
  context.fillStyle = "#020617";
  context.fillRect(0, 0, width, height);

  const graphPadding = 110;
  const legendWidth = 360;
  const graphWidth = width - legendWidth - graphPadding * 2;
  const graphHeight = height - graphPadding * 2;

  const minX = Math.min(...nodes.map((node) => node.x));
  const maxX = Math.max(...nodes.map((node) => node.x));
  const minY = Math.min(...nodes.map((node) => node.y));
  const maxY = Math.max(...nodes.map((node) => node.y));

  const toPxX = (x: number) => graphPadding + ((x - minX) / Math.max(maxX - minX, 1)) * graphWidth;
  const toPxY = (y: number) => graphPadding + ((y - minY) / Math.max(maxY - minY, 1)) * graphHeight;

  const byId = new Map<string, GraphRendererNode>(nodes.map((node) => [node.id, node]));
  const routeEdgeSet = new Set(highlightedPathEdgeKeys);

  for (const edge of edges) {
    const source = byId.get(edge.source);
    const target = byId.get(edge.target);
    if (!source || !target) continue;

    const sameCluster = source.cluster === target.cluster;
    const edgeKey = toEdgeKey(edge.source, edge.target);
    const isRouteEdge = routeEdgeSet.has(edgeKey);

    context.strokeStyle = isRouteEdge ? "#fbbf24" : sameCluster ? source.color || "#38bdf8" : "#334155";
    context.lineWidth = isRouteEdge ? 6 : sameCluster ? 4.2 : 1.8;
    context.beginPath();
    context.moveTo(toPxX(source.x), toPxY(source.y));

    const controlX = (toPxX(source.x) + toPxX(target.x)) / 2;
    const controlY = (toPxY(source.y) + toPxY(target.y)) / 2 - (sameCluster ? 12 : 4);
    context.quadraticCurveTo(controlX, controlY, toPxX(target.x), toPxY(target.y));
    context.stroke();
  }

  for (const node of nodes) {
    const x = toPxX(node.x);
    const y = toPxY(node.y);
    const isSelected = node.id === selectedTitle;
    const isInRoute = routePath.includes(node.id);

    context.fillStyle = isSelected ? "#f8fafc" : isInRoute ? "#f59e0b" : node.color || "#38bdf8";
    context.beginPath();
    context.arc(x, y, isSelected ? 11 : 8, 0, Math.PI * 2);
    context.fill();
  }

  context.fillStyle = "#e2e8f0";
  context.font = "bold 22px Inter, Arial, sans-serif";
  context.fillText("Wikipedia Knowledge Subway", graphPadding, 56);

  context.font = "bold 16px Inter, Arial, sans-serif";
  clusterLabels.forEach((label) => {
    context.fillStyle = label.color;
    context.fillText(label.name, toPxX(label.x), toPxY(label.y));
  });

  const legendX = width - legendWidth + 28;
  const legendY = 90;
  context.fillStyle = "#0f172a";
  context.fillRect(width - legendWidth, 0, legendWidth, height);

  context.fillStyle = "#67e8f9";
  context.font = "bold 20px Inter, Arial, sans-serif";
  context.fillText("Subway Line Legend", legendX, legendY);

  context.font = "15px Inter, Arial, sans-serif";
  clusterLabels.forEach((cluster, index) => {
    const itemY = legendY + 42 + index * 34;
    context.fillStyle = cluster.color;
    context.fillRect(legendX, itemY - 10, 26, 8);
    context.fillStyle = "#e2e8f0";
    context.fillText(cluster.name, legendX + 36, itemY);
  });

  context.fillStyle = "#94a3b8";
  context.font = "13px Inter, Arial, sans-serif";
  context.fillText(`Visible nodes: ${nodes.length}`, legendX, height - 70);
  context.fillText(`Visible edges: ${edges.length}`, legendX, height - 48);

  const imageDataUrl = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = imageDataUrl;
  link.download = `wikipedia-subway-view-${Date.now()}.png`;
  link.click();

  return imageDataUrl;
}
