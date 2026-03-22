import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeNodeId } from '../src/utils/id.js';

test('normalizeNodeId trims, lowercases, and converts spaces/hyphens', () => {
  assert.equal(normalizeNodeId(' Machine learning '), 'machine_learning');
  assert.equal(normalizeNodeId('Machine-learning'), 'machine_learning');
  assert.equal(normalizeNodeId('MACHINE__LEARNING'), 'machine_learning');
});
