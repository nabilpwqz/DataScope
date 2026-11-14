const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function walk(dir) {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(walk(full));
    } else if (entry.name.endsWith('.tsx')) {
      results.push(full);
    }
  }
  return results;
}

const files = walk('src');
console.log(`Auditing ${files.length} tsx files with Hallmark sloplint...`);

try {
  const output = execSync(`node .skills/hallmark/scripts/sloplint.mjs ${files.join(' ')}`, {
    encoding: 'utf-8',
    stdio: 'pipe'
  });
  console.log(output);
} catch (e) {
  console.log(e.stdout || e.message);
  if (e.stderr) console.error(e.stderr);
}

