#!/usr/bin/env node
/**
 * scripts/prepare.js
 *
 * Runs on `pnpm install` via the `prepare` lifecycle hook.
 * Checks for required .env files and prints setup hints.
 */
const fs = require('fs');
const path = require('path');

const envChecks = [
  { dir: 'apps/api', file: '.env', example: '.env.example' },
  { dir: 'apps/mobile', file: '.env', example: '.env.example' },
];

let anyMissing = false;

for (const check of envChecks) {
  const envPath = path.join(__dirname, '..', check.dir, check.file);
  const examplePath = path.join(__dirname, '..', check.dir, check.example);

  if (!fs.existsSync(envPath) && fs.existsSync(examplePath)) {
    console.info(`\n  ⚠️  Missing ${check.dir}/${check.file}`);
    console.info(`     Run: cp ${check.dir}/${check.example} ${check.dir}/${check.file}`);
    anyMissing = true;
  }
}

if (anyMissing) {
  console.info('\n  Fill in the .env files before running the project.\n');
} else {
  console.info('\n  ✅ Environment files present.\n');
}
