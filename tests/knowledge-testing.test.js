import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const root = resolve(dirname(__filename), '..');
const readText = (p) => readFileSync(resolve(root, p), 'utf8');

const categories = [
  { dir: 'strategies', count: 6, fragments: ['test-pyramid', 'risk-based-testing', 'bdd-gherkin', 'contract-testing', 'mutation-testing', 'regression-strategy'] },
  { dir: 'frameworks', count: 6, fragments: ['vitest-jest', 'pytest-patterns', 'flutter-testing', 'go-testing', 'playwright-patterns', 'cypress-patterns'] },
  { dir: 'patterns', count: 6, fragments: ['test-doubles', 'fixture-management', 'data-builders', 'snapshot-testing', 'property-based', 'visual-regression'] },
  { dir: 'performance', count: 4, fragments: ['load-testing', 'profiling', 'benchmarking', 'lighthouse'] },
  { dir: 'security', count: 4, fragments: ['owasp-testing', 'dependency-scanning', 'sast-dast', 'pen-testing'] },
  { dir: 'mobile', count: 4, fragments: ['device-testing', 'app-store-testing', 'gesture-testing', 'push-notification-testing'] },
];

describe('Testing knowledge fragment directories (Spec 7b)', () => {
  it('has 6 category directories', () => {
    const dir = resolve(root, '_symphony/testing/knowledge');
    const dirs = readdirSync(dir, { withFileTypes: true }).filter(d => d.isDirectory());
    expect(dirs.length).toBe(6);
  });

  it('has 30 total knowledge fragments', () => {
    let total = 0;
    for (const cat of categories) {
      const dir = resolve(root, `_symphony/testing/knowledge/${cat.dir}`);
      const files = readdirSync(dir).filter(f => f.endsWith('.md'));
      total += files.length;
    }
    expect(total).toBe(30);
  });
});

for (const cat of categories) {
  describe(`Testing Knowledge: ${cat.dir}/ (Spec 7b)`, () => {
    it(`has ${cat.count} fragments`, () => {
      const dir = resolve(root, `_symphony/testing/knowledge/${cat.dir}`);
      const files = readdirSync(dir).filter(f => f.endsWith('.md'));
      expect(files.length).toBe(cat.count);
    });

    for (const fragment of cat.fragments) {
      const path = `_symphony/testing/knowledge/${cat.dir}/${fragment}.md`;

      describe(`Fragment: ${fragment}`, () => {
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
    }
  });
}
