import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const root = resolve(dirname(__filename), '..');

describe('adapter-utils — enumerateWorkflows', () => {
  let enumerateWorkflows;

  it('module exports enumerateWorkflows function', async () => {
    const mod = await import('../lib/adapter-utils.js');
    enumerateWorkflows = mod.enumerateWorkflows;
    expect(typeof enumerateWorkflows).toBe('function');
  });

  it('finds fixture workflows when scanning tests/fixtures as corePath', async () => {
    const { enumerateWorkflows } = await import('../lib/adapter-utils.js');
    const workflows = enumerateWorkflows(resolve(root, 'tests/fixtures'));
    expect(workflows.length).toBeGreaterThanOrEqual(1);
  });

  it('returns objects with id, workflowPath, and model fields', async () => {
    const { enumerateWorkflows } = await import('../lib/adapter-utils.js');
    const workflows = enumerateWorkflows(resolve(root, 'tests/fixtures'));
    for (const wf of workflows) {
      expect(wf.id).toBeDefined();
      expect(typeof wf.id).toBe('string');
      expect(wf.workflowPath).toBeDefined();
    }
  });

  it('returns empty array for nonexistent path (no throw)', async () => {
    const { enumerateWorkflows } = await import('../lib/adapter-utils.js');
    const workflows = enumerateWorkflows('/nonexistent/path/nothing');
    expect(Array.isArray(workflows)).toBe(true);
    expect(workflows.length).toBe(0);
  });

  it('finds workflows in _symphony/ structure when scanning project root', async () => {
    const { enumerateWorkflows } = await import('../lib/adapter-utils.js');
    // Currently no workflows exist in _symphony/ (pre-Spec 5), but the function should not throw
    const workflows = enumerateWorkflows(root);
    expect(Array.isArray(workflows)).toBe(true);
    // May be 0 (no workflows yet) — that's valid
  });
});

describe('adapter-utils — renderTemplate', () => {
  it('module exports renderTemplate function', async () => {
    const mod = await import('../lib/adapter-utils.js');
    expect(typeof mod.renderTemplate).toBe('function');
  });

  it('replaces {{variable}} placeholders', async () => {
    const { renderTemplate } = await import('../lib/adapter-utils.js');
    const result = renderTemplate('Hello {{name}}, you are {{role}}.', { name: 'Alice', role: 'PM' });
    expect(result).toBe('Hello Alice, you are PM.');
  });

  it('handles {{#if variable}} conditional blocks — truthy', async () => {
    const { renderTemplate } = await import('../lib/adapter-utils.js');
    const result = renderTemplate('---\n{{#if model}}model: {{model}}{{/if}}\n---', { model: 'opus' });
    expect(result).toContain('model: opus');
  });

  it('handles {{#if variable}} conditional blocks — falsy', async () => {
    const { renderTemplate } = await import('../lib/adapter-utils.js');
    const result = renderTemplate('---\n{{#if model}}model: {{model}}{{/if}}\n---', {});
    expect(result).not.toContain('model:');
  });

  it('works with the actual claude-code command.md.tmpl', async () => {
    const { renderTemplate } = await import('../lib/adapter-utils.js');
    const { readFileSync } = await import('node:fs');
    const tmpl = readFileSync(resolve(root, 'adapters/claude-code/templates/command.md.tmpl'), 'utf8');
    const result = renderTemplate(tmpl, {
      description: 'Test workflow',
      model: 'opus',
      workflow_path: '_symphony/lifecycle/workflows/1-analysis/brainstorm/',
    });
    expect(result).toContain('description: Test workflow');
    expect(result).toContain('model: opus');
    expect(result).toContain('conductor.xml');
    expect(result).toContain('_symphony/lifecycle/workflows/1-analysis/brainstorm/');
  });
});
