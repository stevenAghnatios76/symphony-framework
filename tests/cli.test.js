import { execSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const root = resolve(dirname(__filename), '..');

describe('symphony-cli', () => {
  it('prints version when run with --version', () => {
    const out = execSync(`node ${resolve(root, 'bin/symphony-cli.js')} --version`, {
      encoding: 'utf8',
    }).trim();
    expect(out).toBe('symphony-framework 0.1.0');
  });

  it('prints help when run with no arguments', () => {
    const out = execSync(`node ${resolve(root, 'bin/symphony-cli.js')}`, {
      encoding: 'utf8',
    });
    expect(out).toContain('Symphony');
    expect(out).toContain('Usage:');
  });
});
