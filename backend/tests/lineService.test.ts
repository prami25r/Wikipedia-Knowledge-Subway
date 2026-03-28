import test from 'node:test';
import assert from 'node:assert/strict';
import { GraphService } from '../src/services/graphService.js';

const service = new GraphService();

test('graph service exposes line summaries for the current dataset', () => {
  const lines = service.getLines();

  assert.ok(lines.length > 0);
  assert.ok(lines.some((line) => line.id === 'technology'));
  assert.ok(lines.every((line) => line.station_count > 0));
});

test('graph service exposes line detail with stations and transfer summaries', () => {
  const technologyLine = service.getLine('technology');

  assert.ok(technologyLine);
  assert.ok(technologyLine.stations.length > 0);
  assert.equal(technologyLine.station_count, technologyLine.stations.length);
  assert.ok(Array.isArray(technologyLine.connected_lines));
});
