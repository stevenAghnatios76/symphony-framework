import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import YAML from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const root = resolve(dirname(__filename), '..');
const readYaml = (p) => YAML.parse(readFileSync(resolve(root, p), 'utf8'));

describe('Command registry (Spec 7d)', () => {
  const path = '_symphony/core/cli/command-registry.yaml';

  it('exists and parses', () => {
    expect(existsSync(resolve(root, path))).toBe(true);
    expect(readYaml(path)).toBeTruthy();
  });

  it('has commands array', () => {
    const data = readYaml(path);
    expect(Array.isArray(data.commands)).toBe(true);
    expect(data.commands.length).toBeGreaterThanOrEqual(20);
  });

  it('each command has id, command, description, workflow_ref', () => {
    const data = readYaml(path);
    for (const cmd of data.commands) {
      expect(cmd.id).toBeTruthy();
      expect(cmd.command).toBeTruthy();
      expect(cmd.description).toBeTruthy();
      expect(cmd.workflow_ref).toBeTruthy();
    }
  });

  it('has categories array', () => {
    const data = readYaml(path);
    expect(Array.isArray(data.categories)).toBe(true);
    expect(data.categories.length).toBeGreaterThanOrEqual(4);
  });

  it('every command category references a valid category id', () => {
    const data = readYaml(path);
    const categoryIds = new Set(data.categories.map(c => c.id));
    for (const cmd of data.commands) {
      expect(categoryIds.has(cmd.category)).toBe(true);
    }
  });
});

describe('SDK interface (Spec 7d)', () => {
  const path = '_symphony/core/cli/sdk-interface.yaml';

  it('exists and parses', () => {
    expect(existsSync(resolve(root, path))).toBe(true);
    expect(readYaml(path)).toBeTruthy();
  });

  it('has methods array', () => {
    const data = readYaml(path);
    expect(Array.isArray(data.methods)).toBe(true);
    expect(data.methods.length).toBeGreaterThanOrEqual(4);
  });

  it('each method has id, description, params, returns', () => {
    const data = readYaml(path);
    for (const m of data.methods) {
      expect(m.id).toBeTruthy();
      expect(m.description).toBeTruthy();
      expect(m.params).toBeTruthy();
      expect(m.returns).toBeTruthy();
    }
  });

  it('has events array', () => {
    const data = readYaml(path);
    expect(Array.isArray(data.events)).toBe(true);
    expect(data.events.length).toBeGreaterThanOrEqual(3);
  });

  it('has extensions array', () => {
    const data = readYaml(path);
    expect(Array.isArray(data.extensions)).toBe(true);
    expect(data.extensions.length).toBeGreaterThanOrEqual(2);
  });
});
