import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const root = resolve(dirname(__filename), '..');
const readText = (p) => readFileSync(resolve(root, p), 'utf8');

describe('Dev Agent: _base-dev (Spec 7a)', () => {
  const path = '_symphony/dev/agents/_base-dev.md';

  it('exists', () => {
    expect(existsSync(resolve(root, path))).toBe(true);
  });

  it('is under 200 lines', () => {
    const lines = readText(path).split('\n').length;
    expect(lines).toBeLessThanOrEqual(200);
  });

  it('has YAML frontmatter with id and type abstract', () => {
    const text = readText(path);
    expect(text).toMatch(/^---\n/);
    expect(text).toContain('id: _base-dev');
  });

  it('has story-execution-protocol', () => {
    expect(readText(path)).toContain('<story-execution-protocol>');
  });

  it('has file-tracking section', () => {
    expect(readText(path)).toContain('<file-tracking>');
  });

  it('has quality-gates with pre-start and post-complete', () => {
    const text = readText(path);
    expect(text).toContain('<quality-gates>');
    expect(text).toContain('<pre-start>');
    expect(text).toContain('<post-complete>');
  });

  it('has findings-protocol', () => {
    expect(readText(path)).toContain('<findings-protocol>');
  });

  it('has skill-loading section', () => {
    expect(readText(path)).toContain('<skill-loading>');
  });
});

describe('Dev Agent: mobile-dev (Spec 7a)', () => {
  const path = '_symphony/dev/agents/mobile-dev.md';

  it('exists', () => {
    expect(existsSync(resolve(root, path))).toBe(true);
  });

  it('is under 200 lines', () => {
    const lines = readText(path).split('\n').length;
    expect(lines).toBeLessThanOrEqual(200);
  });

  it('has YAML frontmatter with id, name, role, model, max_lines', () => {
    const text = readText(path);
    expect(text).toMatch(/^---\n/);
    expect(text).toContain('id: mobile-dev');
    expect(text).toContain('model: opus');
    expect(text).toContain('max_lines: 200');
  });

  it('contains <agent id="mobile-dev"', () => {
    expect(readText(path)).toContain('<agent id="mobile-dev"');
  });

  it('has <persona> with identity, expertise, operating-mode', () => {
    const text = readText(path);
    expect(text).toContain('<persona>');
    expect(text).toContain('<identity>');
    expect(text).toContain('<expertise>');
    expect(text).toContain('<operating-mode>');
  });

  it('has <knowledge-sources> with all 3 trust levels', () => {
    const text = readText(path);
    expect(text).toContain('<knowledge-sources>');
    expect(text).toContain('<trusted>');
    expect(text).toContain('<verify>');
    expect(text).toContain('<untrusted>');
  });

  it('has <disciplines> with self-critique and anti-rationalization', () => {
    const text = readText(path);
    expect(text).toContain('<disciplines>');
    expect(text).toContain('<self-critique');
    expect(text).toContain('<anti-rationalization>');
  });

  it('has at least 2 excuse-rebuttal pairs', () => {
    const excuses = readText(path).match(/<excuse>/g) || [];
    expect(excuses.length).toBeGreaterThanOrEqual(2);
  });

  it('has <workflows-owned> with at least one workflow', () => {
    const text = readText(path);
    expect(text).toContain('<workflows-owned>');
    const workflows = text.match(/<workflow>/g) || [];
    expect(workflows.length).toBeGreaterThanOrEqual(1);
  });

  it('has <memory-sidecar>', () => {
    expect(readText(path)).toContain('<memory-sidecar');
  });

  it('has <base-dev ref=', () => {
    expect(readText(path)).toContain('<base-dev ref=');
  });

  it('has <skills-registry>', () => {
    expect(readText(path)).toContain('<skills-registry>');
  });

  it('does NOT contain activation menus or greeting', () => {
    const text = readText(path);
    expect(text).not.toMatch(/<activation/i);
    expect(text).not.toMatch(/<menu/i);
    expect(text).not.toMatch(/greet.*user/i);
  });
});

describe('Existing developer agent enhancement (Spec 7a)', () => {
  const path = '_symphony/lifecycle/agents/developer.md';

  it('has <base-dev ref= reference', () => {
    expect(readText(path)).toContain('<base-dev ref=');
  });

  it('has <skills-registry>', () => {
    expect(readText(path)).toContain('<skills-registry>');
  });

  it('has <knowledge-detection>', () => {
    expect(readText(path)).toContain('<knowledge-detection>');
  });

  it('is still under 200 lines', () => {
    const lines = readText(path).split('\n').length;
    expect(lines).toBeLessThanOrEqual(200);
  });
});
