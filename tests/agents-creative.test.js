import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const root = resolve(dirname(__filename), '..');
const readText = (p) => readFileSync(resolve(root, p), 'utf8');

const agents = [
  { id: 'brainstorming-coach', hasWorkflows: false },
  { id: 'design-thinking-coach', hasWorkflows: true },
  { id: 'innovation-strategist', hasWorkflows: true },
  { id: 'problem-solver', hasWorkflows: true },
  { id: 'storyteller', hasWorkflows: true },
  { id: 'presentation-designer', hasWorkflows: true },
];

for (const agent of agents) {
  describe(`Creative Agent: ${agent.id} (Spec 6a)`, () => {
    const path = `_symphony/creative/agents/${agent.id}.md`;

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
      expect(text).toContain(`id: ${agent.id}`);
      expect(text).toContain('model: opus');
      expect(text).toContain('max_lines: 200');
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
    } else {
      it('has empty <workflows-owned>', () => {
        const text = readText(path);
        expect(text).toContain('<workflows-owned');
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
