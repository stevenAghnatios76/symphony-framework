import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const root = resolve(dirname(__filename), '..');
const readText = (p) => readFileSync(resolve(root, p), 'utf8');

const agents = [
  { id: 'critic', file: '_symphony/utility/agents/critic.md' },
  { id: 'code-simplifier', file: '_symphony/utility/agents/code-simplifier.md' },
  { id: 'browser-tester', file: '_symphony/utility/agents/browser-tester.md' },
];

for (const agent of agents) {
  describe(`Utility Agent: ${agent.id} (Spec 7c)`, () => {
    it('exists', () => {
      expect(existsSync(resolve(root, agent.file))).toBe(true);
    });

    it('is under 200 lines', () => {
      const lines = readText(agent.file).split('\n').length;
      expect(lines).toBeLessThanOrEqual(200);
    });

    it('has YAML frontmatter with id, name, role, model', () => {
      const text = readText(agent.file);
      expect(text).toContain(`id: ${agent.id}`);
      expect(text).toContain('model: opus');
    });

    it(`has <agent> root element`, () => {
      expect(readText(agent.file)).toContain(`<agent id="${agent.id}"`);
    });

    it('has <persona> with identity, expertise, operating-mode', () => {
      const text = readText(agent.file);
      expect(text).toContain('<persona>');
      expect(text).toContain('<identity>');
      expect(text).toContain('<expertise>');
      expect(text).toContain('<operating-mode>');
    });

    it('has <knowledge-sources> with all 3 trust levels', () => {
      const text = readText(agent.file);
      expect(text).toContain('<knowledge-sources>');
      expect(text).toContain('<trusted>');
      expect(text).toContain('<verify>');
      expect(text).toContain('<untrusted>');
    });

    it('has <disciplines> with self-critique and anti-rationalization', () => {
      const text = readText(agent.file);
      expect(text).toContain('<disciplines>');
      expect(text).toContain('<self-critique');
      expect(text).toContain('<anti-rationalization>');
    });

    it('has at least 2 excuse-rebuttal pairs', () => {
      const excuses = readText(agent.file).match(/<excuse>/g) || [];
      expect(excuses.length).toBeGreaterThanOrEqual(2);
    });

    it('has <memory-sidecar>', () => {
      expect(readText(agent.file)).toContain('<memory-sidecar');
    });
  });
}
