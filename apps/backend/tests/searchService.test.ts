import test from 'node:test';
import assert from 'node:assert/strict';
import { SearchService } from '../src/services/searchService.js';

const service = new SearchService([
  { id: 'Machine_learning', label: 'Machine Learning', cluster: 'technology', x: 0, y: 0, degree: 10 },
  { id: 'Quantum_mechanics', label: 'Quantum Mechanics', cluster: 'physics', x: 0, y: 0, degree: 8 },
  { id: 'Mathematics', label: 'Mathematics', cluster: 'math', x: 0, y: 0, degree: 12 },
]);

test('search service supports partial/fuzzy match', () => {
  const results = service.search('mach');
  assert.ok(results.length > 0);
  assert.equal(results[0].id, 'Machine_learning');
});

test('search service is case-insensitive', () => {
  const results = service.search('QUANTUM');
  assert.ok(results.some((item) => item.id === 'Quantum_mechanics'));
});
