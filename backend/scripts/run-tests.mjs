import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '..');
const testsDir = path.join(backendRoot, 'tests');

function collectTestFiles(dir) {
  const testFiles = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      testFiles.push(...collectTestFiles(fullPath));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.test.ts')) {
      testFiles.push(fullPath);
    }
  }

  return testFiles;
}

const testFiles = collectTestFiles(testsDir).sort();

if (testFiles.length === 0) {
  console.error(`No test files found in ${testsDir}`);
  process.exit(1);
}

const result = spawnSync(process.execPath, ['--import', 'tsx', '--test', ...testFiles], {
  cwd: backendRoot,
  stdio: 'inherit',
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
