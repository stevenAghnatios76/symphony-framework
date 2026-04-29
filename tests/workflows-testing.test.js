import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const root = resolve(dirname(__filename), '..');
const readText = (p) => readFileSync(resolve(root, p), 'utf8');

const workflows = [
  'gap-analysis', 'performance-testing', 'mobile-testing', 'ci-setup',
  'test-review', 'fill-test-gaps', 'edit-test-plan', 'nfr-assessment',
  'test-automation', 'test-execution', 'security-testing', 'teach-me-testing',
];

describe('Testing workflows inventory (Spec 7b)', () => {
  it('has exactly 12 workflow directories', () => {
    const dir = resolve(root, '_symphony/testing/workflows');
    const dirs = readdirSync(dir, { withFileTypes: true }).filter(d => d.isDirectory());
    expect(dirs.length).toBe(12);
  });
});

for (const wf of workflows) {
  const base = `_symphony/testing/workflows/${wf}`;

  describe(`Workflow: ${wf} (Spec 7b)`, () => {
    it('has workflow.yaml', () => {
      expect(existsSync(resolve(root, `${base}/workflow.yaml`))).toBe(true);
    });

    it('has instructions.xml', () => {
      expect(existsSync(resolve(root, `${base}/instructions.xml`))).toBe(true);
    });

    it('has template.md', () => {
      expect(existsSync(resolve(root, `${base}/template.md`))).toBe(true);
    });

    it('has checklist.md', () => {
      expect(existsSync(resolve(root, `${base}/checklist.md`))).toBe(true);
    });

    it('workflow.yaml has required fields', () => {
      const text = readText(`${base}/workflow.yaml`);
      expect(text).toContain('id:');
      expect(text).toContain('owner: test-architect');
      expect(text).toContain('execution:');
      expect(text).toContain('inputs:');
      expect(text).toContain('outputs:');
      expect(text).toContain('gates:');
      expect(text).toContain('disciplines:');
    });

    it('instructions.xml has steps', () => {
      const text = readText(`${base}/instructions.xml`);
      expect(text).toContain('<instructions');
      expect(text).toContain('<steps>');
    });

    it('checklist.md has pre-start and post-complete', () => {
      const text = readText(`${base}/checklist.md`);
      expect(text).toContain('## Pre-start');
      expect(text).toContain('## Post-complete');
    });
  });
}
