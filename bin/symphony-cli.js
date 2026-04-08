#!/usr/bin/env node
// Symphony CLI — entry point for npx symphony-framework
// Status: stub — full command surface (init, update, validate, status)
// lands in the Spec 8 Release Polish plan.

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const pkgPath = resolve(dirname(__filename), '..', 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));

const args = process.argv.slice(2);

if (args.includes('--version') || args.includes('-v')) {
  console.log(`${pkg.name} ${pkg.version}`);
  process.exit(0);
}

console.log(`Symphony ${pkg.version}`);
console.log('');
console.log('Usage:');
console.log('  npx symphony-framework --version     Print version and exit');
console.log('  npx symphony-framework init <path>   (not yet implemented)');
console.log('  npx symphony-framework update <path> (not yet implemented)');
console.log('  npx symphony-framework validate      (not yet implemented)');
console.log('  npx symphony-framework status        (not yet implemented)');
console.log('');
console.log('See docs/superpowers/specs/2026-04-08-symphony-architecture-design.md');
console.log('for architecture. Full command surface lands in Spec 8.');
process.exit(0);
