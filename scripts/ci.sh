#!/usr/bin/env bash
# DataScope Enterprise CI Pipeline Runner (POSIX/Linux/macOS)
set -euo pipefail

echo "================================================================"
echo "DataScope CI Pipeline Runner"
echo "================================================================"

echo "[1/4] TypeScript Typecheck"
npx tsc --noEmit

echo "[2/4] Hallmark Sloplint Audit"
node scripts/run-sloplint.js

echo "[3/4] Vitest Unit & Integration Tests"
npm test

echo "[4/4] Production Next.js Build"
npm run build

echo "================================================================"
echo "CI Pipeline Completed Successfully!"
echo "================================================================"

