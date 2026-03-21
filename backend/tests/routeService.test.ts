import test from 'node:test';
import assert from 'node:assert/strict';
import Graph from 'graphology';
import { RouteService } from '../src/services/routeService.js';

function createTinyGraph() {
  const graph = new Graph({ type: 'undirected' });
  graph.addNode('A');
  graph.addNode('B');
  graph.addNode('C');
  graph.addNode('D');
  graph.addUndirectedEdge('A', 'B');
  graph.addUndirectedEdge('B', 'C');
  graph.addUndirectedEdge('C', 'D');
  return graph;
}

test('route service returns shortest BFS path', () => {
  const service = new RouteService(createTinyGraph());
  const result = service.shortestPath('A', 'D');

  assert.deepEqual(result.path, ['A', 'B', 'C', 'D']);
  assert.equal(result.distance, 3);
});

test('route service returns empty path when disconnected', () => {
  const graph = createTinyGraph();
  graph.dropEdge('B', 'C');

  const service = new RouteService(graph);
  const result = service.shortestPath('A', 'D');

  assert.deepEqual(result.path, []);
  assert.equal(result.distance, -1);
});
