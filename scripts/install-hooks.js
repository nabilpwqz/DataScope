#!/usr/bin/env node

/**
 * Configure local Git hooks for DataScope repository without external dependencies.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

try {
  const gitDir = path.resolve(__dirname, '..', '.git');
  if (fs.existsSync(gitDir)) {
    execSync('git config core.hooksPath .githooks', { stdio: 'inherit' });
    console.log('Configured Git hooks path to .githooks/');
  } else {
    console.log('Notice: .git directory not found. Skipping hook installation.');
  }
} catch (err) {
  console.error('Failed to configure Git hooks:', err);
}

