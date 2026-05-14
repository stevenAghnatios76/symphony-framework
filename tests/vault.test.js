import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import YAML from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const root = resolve(dirname(__filename), '..');
const readText = (p) => readFileSync(resolve(root, p), 'utf8');
const readYaml = (p) => YAML.parse(readText(p));

describe('Vault schema (Spec 7d)', () => {
  const path = '_symphony/core/vault/schema.yaml';

  it('exists and parses', () => {
    expect(existsSync(resolve(root, path))).toBe(true);
    expect(readYaml(path)).toBeTruthy();
  });

  it('has node_types array', () => {
    const data = readYaml(path);
    expect(Array.isArray(data.node_types)).toBe(true);
    expect(data.node_types.length).toBeGreaterThanOrEqual(5);
  });

  it('has edge_types array', () => {
    const data = readYaml(path);
    expect(Array.isArray(data.edge_types)).toBe(true);
    expect(data.edge_types.length).toBeGreaterThanOrEqual(4);
  });

  it('has query_interface', () => {
    expect(readYaml(path).query_interface).toBeTruthy();
  });
});

describe('Codebase index (Spec 7d)', () => {
  const path = '_symphony/core/vault/codebase-index.yaml';

  it('exists and parses', () => {
    expect(existsSync(resolve(root, path))).toBe(true);
    expect(readYaml(path)).toBeTruthy();
  });

  it('has file_patterns', () => {
    expect(readYaml(path).file_patterns).toBeTruthy();
  });

  it('has ignore_patterns array', () => {
    const data = readYaml(path);
    expect(Array.isArray(data.ignore_patterns)).toBe(true);
    expect(data.ignore_patterns.length).toBeGreaterThanOrEqual(3);
  });

  it('has indexing_frequency', () => {
    expect(readYaml(path).indexing_frequency).toBeTruthy();
  });
});

describe('Query patterns (Spec 7d)', () => {
  const path = '_symphony/core/vault/query-patterns.md';

  it('exists', () => {
    expect(existsSync(resolve(root, path))).toBe(true);
  });

  it('is under 150 lines', () => {
    const lines = readText(path).split('\n').length;
    expect(lines).toBeLessThanOrEqual(150);
  });

  it('has H1 title', () => {
    expect(readText(path)).toMatch(/^# /m);
  });

  it('has Pattern Examples section', () => {
    expect(readText(path)).toContain('## Pattern Examples');
  });

  it('has Anti-Patterns section', () => {
    expect(readText(path)).toContain('## Anti-Patterns');
  });

  it('has Integration Points section', () => {
    expect(readText(path)).toContain('## Integration Points');
  });
});
