import fs from "fs";
import path from "path";

const input = path.join(process.cwd(), "data/articles.json");
const output = path.join(process.cwd(), "data/graph.json");

const dataset = JSON.parse(fs.readFileSync(input));

const nodes = dataset.nodes.map((n) => ({
  id: n.id,
  label: n.id,
  cluster: n.line
}));

const edges = [];

const MAX_CONNECTIONS = 5;

dataset.nodes.forEach((node) => {
  const sameLine = dataset.nodes
    .filter((n) => n.line === node.line && n.id !== node.id)
    .slice(0, MAX_CONNECTIONS);

  sameLine.forEach((target) => {
    edges.push({
      source: node.id,
      target: target.id
    });
  });
});

fs.writeFileSync(
  output,
  JSON.stringify({ nodes, edges }, null, 2)
);

console.log("Graph created");
console.log("Nodes:", nodes.length);
console.log("Edges:", edges.length);