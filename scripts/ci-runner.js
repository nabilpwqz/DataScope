#!/usr/bin/env node

/**
 * DataScope Enterprise Continuous Integration Pipeline Runner
 *
 * Standalone cross-platform CI runner replacing external CI service dependencies.
 * Executes automated validation:
 * 1. Typecheck: npx tsc --noEmit
 * 2. Code Quality & Hallmark Sloplint: node scripts/run-sloplint.js
 * 3. Unit & Integration Tests: npm test (Vitest)
 * 4. Production Next.js Build: npm run build
 * 5. Optional E2E Smoke Tests: npx playwright test (when invoked with --e2e)
 */

const { spawnSync } = require('child_process');
const path = require('path');

const isQuick = process.argv.includes('--quick');
const includeE2E = process.argv.includes('--e2e');

const stages = [
  {
    name: 'TypeScript Compilation Check',
    command: 'npx',
    args: ['tsc', '--noEmit'],
    critical: true,
  },
  {
    name: 'Hallmark Sloplint Audit',
    command: 'node',
    args: ['scripts/run-sloplint.js'],
    critical: true,
  },
  {
    name: 'Vitest Unit & Integration Tests',
    command: 'npx',
    args: ['vitest', 'run'],
    critical: true,
  },
];

if (!isQuick) {
  stages.push({
    name: 'Next.js Production Build',
    command: 'npm',
    args: ['run', 'build'],
    critical: true,
  });
}

if (includeE2E) {
  stages.push({
    name: 'Playwright E2E Suite',
    command: 'npx',
    args: ['playwright', 'test', '--project=chromium'],
    critical: true,
  });
}

console.log('================================================================');
console.log('DataScope Enterprise Continuous Integration (CI) Runner');
console.log(`Execution Mode: ${isQuick ? 'Quick (lint + test)' : 'Full (lint + test + build)'}`);
console.log(`Timestamp: ${new Date().toISOString()}`);
console.log('================================================================\n');

let failedStages = 0;
const startTime = Date.now();

for (let i = 0; i < stages.length; i++) {
  const stage = stages[i];
  console.log(`[Stage ${i + 1}/${stages.length}] Starting: ${stage.name}`);
  const stageStart = Date.now();

  const isWindows = process.platform === 'win32';
  const cmd = isWindows && stage.command === 'npm' ? 'npm.cmd' : stage.command;

  const result = spawnSync(cmd, stage.args, {
    stdio: 'inherit',
    shell: isWindows,
    cwd: path.resolve(__dirname, '..'),
    env: {
      ...process.env,
      NODE_ENV: 'test',
      NEXT_TELEMETRY_DISABLED: '1',
    },
  });

  const durationSec = ((Date.now() - stageStart) / 1000).toFixed(2);

  if (result.status !== 0) {
    console.error(`\n[Stage ${i + 1} FAILED] ${stage.name} exited with status ${result.status} (${durationSec}s)\n`);
    failedStages++;
    if (stage.critical) {
      console.error('Halting CI pipeline due to critical stage failure.\n');
      process.exit(1);
    }
  } else {
    console.log(`[Stage ${i + 1} PASSED] ${stage.name} (${durationSec}s)\n`);
  }
}

const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
console.log('================================================================');
if (failedStages === 0) {
  console.log(`CI Pipeline SUCCESS: All ${stages.length} stages passed in ${totalDuration}s.`);
  console.log('================================================================');
  process.exit(0);
} else {
  console.error(`CI Pipeline FAILURE: ${failedStages} of ${stages.length} stages failed in ${totalDuration}s.`);
  console.log('================================================================');
  process.exit(1);
}

