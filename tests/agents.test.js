import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const root = resolve(dirname(__filename), '..');
const readText = (p) => readFileSync(resolve(root, p), 'utf8');

const agents = [
  { id: 'product-manager', hasWorkflows: true },
  { id: 'architect', hasWorkflows: true },
  { id: 'research-analyst', hasWorkflows: true },
  { id: 'ux-designer', hasWorkflows: true },
  { id: 'developer', hasWorkflows: true },
  { id: 'test-architect', hasWorkflows: true },
  { id: 'security-agent', hasWorkflows: true },
  { id: 'devops-agent', hasWorkflows: true },
  { id: 'reviewer', hasWorkflows: true },
  { id: 'scrum-master', hasWorkflows: true },
  { id: 'tech-writer', hasWorkflows: true },
  { id: 'performance-agent', hasWorkflows: true },
  { id: 'validator', hasWorkflows: true },
  { id: 'debugger', hasWorkflows: false },
  { id: 'data-engineer', hasWorkflows: false },
];

for (const agent of agents) {
  describe(`Agent: ${agent.id} (Spec 5a)`, () => {
    const path = `_symphony/lifecycle/agents/${agent.id}.md`;

    it('exists', () => {
      expect(existsSync(resolve(root, path))).toBe(true);
    });

    it('is under 200 lines', () => {
      const lines = readText(path).split('\n').length;
      expect(lines).toBeLessThanOrEqual(200);
    });

    it(`contains <agent id="${agent.id}"`, () => {
      expect(readText(path)).toContain(`<agent id="${agent.id}"`);
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

    if (agent.hasWorkflows) {
      it('has <workflows-owned> with at least one workflow', () => {
        const text = readText(path);
        expect(text).toContain('<workflows-owned>');
        const workflows = text.match(/<workflow>/g) || [];
        expect(workflows.length).toBeGreaterThanOrEqual(1);
      });
    }

    it('has <memory-sidecar>', () => {
      expect(readText(path)).toContain('<memory-sidecar');
    });

    it('does NOT contain activation menus or greeting', () => {
      const text = readText(path);
      expect(text).not.toMatch(/<activation/i);
      expect(text).not.toMatch(/<menu/i);
      expect(text).not.toMatch(/greet.*user/i);
    });
  });
}
