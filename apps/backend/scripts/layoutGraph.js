import fs from "fs";
import path from "path";
import Graph from "graphology";
import forceAtlas2 from "graphology-layout-forceatlas2";

const INPUT_PATH = path.join(process.cwd(), "data/graph.json");
const OUTPUT_PATH = path.join(process.cwd(), "data/layout_graph.json");

const LAYOUT_ITERATIONS = 500;
const TARGET_WIDTH = 1000;
const TARGET_HEIGHT = 1000;

/**
 * Normalize coordinates into a fixed bounding box
 */
function normalizePositions(graph) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  graph.forEachNode((node, attrs) => {
    const { x, y } = attrs;

    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  });

  const width = maxX - minX || 1;
  const height = maxY - minY || 1;

  graph.updateEachNodeAttributes((node, attrs) => ({
    ...attrs,
    x: ((attrs.x - minX) / width) * TARGET_WIDTH,
    y: ((attrs.y - minY) / height) * TARGET_HEIGHT,
  }));
}

/**
 * Build Graphology graph
 */
function createGraph(data) {
  const graph = new Graph({
    type: "undirected",
    multi: false,
    allowSelfLoops: false,
  });

  data.nodes.forEach((node) => {
    if (!node?.id) return;

    if (!graph.hasNode(node.id)) {
      graph.addNode(node.id, {
        label: node.label || node.id,
        cluster: node.cluster,
        x: Math.random(),
        y: Math.random(),
        size: 1,
      });
    }
  });

  data.edges.forEach((edge) => {
    if (!edge?.source || !edge?.target) return;
    if (edge.source === edge.target) return;

    if (
      graph.hasNode(edge.source) &&
      graph.hasNode(edge.target)
    ) {
      graph.mergeUndirectedEdge(edge.source, edge.target);
    }
  });

  return graph;
}

/**
 * Export graph into layout dataset
 */
function buildOutput(graph) {
  const nodes = graph.nodes().map((id) => {
    const attrs = graph.getNodeAttributes(id);

    return {
      id,
      label: attrs.label,
      cluster: attrs.cluster,
      x: Number(attrs.x.toFixed(3)),
      y: Number(attrs.y.toFixed(3)),
    };
  });

  const edges = graph.edges().map((edgeKey) => {
    const [source, target] = graph.extremities(edgeKey);

    return { source, target };
  });

  return { nodes, edges };
}

/**
 * Main pipeline
 */
function main() {
  const raw = JSON.parse(fs.readFileSync(INPUT_PATH, "utf8"));

  const graph = createGraph(raw);

  console.log("Running ForceAtlas2 layout...");

  forceAtlas2.assign(graph, {
    iterations: LAYOUT_ITERATIONS,
    settings: {
      gravity: 1,
      scalingRatio: 10,
    },
  });

  normalizePositions(graph);

  const output = buildOutput(graph);

  fs.writeFileSync(
    OUTPUT_PATH,
    JSON.stringify(output, null, 2)
  );

  console.log(
    `Layout computed\nNodes: ${output.nodes.length}\nEdges: ${output.edges.length}`
  );
}

main();