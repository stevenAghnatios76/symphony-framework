import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const root = resolve(dirname(__filename), '..');
const readText = (p) => readFileSync(resolve(root, p), 'utf8');

const skills = [
  'git-workflow',
  'api-design',
  'database-design',
  'docker-workflow',
  'testing-patterns',
  'code-review-standards',
  'documentation-standards',
  'security-basics',
  'figma-integration',
  'edge-cases',
  'validation-patterns',
];

describe('Dev Skills inventory (Spec 7a)', () => {
  it('has exactly 11 skill files', () => {
    const dir = resolve(root, '_symphony/dev/skills');
    const files = readdirSync(dir).filter(f => f.endsWith('.md'));
    expect(files.length).toBe(11);
  });
});

for (const skill of skills) {
  describe(`Skill: ${skill} (Spec 7a)`, () => {
    const path = `_symphony/dev/skills/${skill}.md`;

    it('exists', () => {
      expect(existsSync(resolve(root, path))).toBe(true);
    });

    it('is under 300 lines', () => {
      const lines = readText(path).split('\n').length;
      expect(lines).toBeLessThanOrEqual(300);
    });

    it('has H1 title', () => {
      expect(readText(path)).toMatch(/^# /m);
    });

    it('has at least 2 SECTION markers', () => {
      const sections = readText(path).match(/<!-- SECTION: /g) || [];
      expect(sections.length).toBeGreaterThanOrEqual(2);
    });

    it('has at least 2 H2 headings', () => {
      const headings = readText(path).match(/^## /gm) || [];
      expect(headings.length).toBeGreaterThanOrEqual(2);
    });
  });
}
