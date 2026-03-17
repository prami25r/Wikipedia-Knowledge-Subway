import test from 'node:test';
import assert from 'node:assert/strict';
import { buildGraph, loadGraphDataset } from '../src/graph/graphLoader.js';
import { normalizeNodeId } from '../src/utils/id.js';

test('graph loader loads dataset and builds graph with degrees', () => {
  const dataset = loadGraphDataset();
  assert.ok(dataset.nodes.length > 0);
  assert.ok(dataset.edges.length > 0);

  const graph = buildGraph(dataset);
  assert.ok(graph.order > 0);
  assert.ok(graph.order <= dataset.nodes.length);
  assert.ok(graph.size > 0);

  const sampleNode = normalizeNodeId(dataset.nodes[0].id);
  assert.equal(typeof graph.getNodeAttribute(sampleNode, 'degree'), 'number');
});
