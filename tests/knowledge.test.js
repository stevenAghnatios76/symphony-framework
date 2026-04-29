import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const root = resolve(dirname(__filename), '..');
const readText = (p) => readFileSync(resolve(root, p), 'utf8');

const languages = [
  { dir: 'typescript', count: 4, fragments: ['ts-conventions', 'react-patterns', 'nextjs-patterns', 'express-patterns'] },
  { dir: 'angular', count: 4, fragments: ['angular-conventions', 'angular-patterns', 'ngrx-state', 'rxjs-patterns'] },
  { dir: 'flutter', count: 4, fragments: ['dart-conventions', 'widget-patterns', 'state-management', 'platform-channels'] },
  { dir: 'python', count: 4, fragments: ['python-conventions', 'django-patterns', 'fastapi-patterns', 'data-pipelines'] },
  { dir: 'go', count: 3, fragments: ['go-conventions', 'go-stdlib-patterns', 'go-testing-patterns'] },
];

describe('Knowledge fragment directories (Spec 7a)', () => {
  it('has 5 language directories', () => {
    const dir = resolve(root, '_symphony/dev/knowledge');
    const dirs = readdirSync(dir, { withFileTypes: true }).filter(d => d.isDirectory());
    expect(dirs.length).toBe(5);
  });

  it('has 19 total knowledge fragments', () => {
    let total = 0;
    for (const lang of languages) {
      const dir = resolve(root, `_symphony/dev/knowledge/${lang.dir}`);
      const files = readdirSync(dir).filter(f => f.endsWith('.md'));
      total += files.length;
    }
    expect(total).toBe(19);
  });
});

for (const lang of languages) {
  describe(`Knowledge: ${lang.dir}/ (Spec 7a)`, () => {
    it(`has ${lang.count} fragments`, () => {
      const dir = resolve(root, `_symphony/dev/knowledge/${lang.dir}`);
      const files = readdirSync(dir).filter(f => f.endsWith('.md'));
      expect(files.length).toBe(lang.count);
    });

    for (const fragment of lang.fragments) {
      const path = `_symphony/dev/knowledge/${lang.dir}/${fragment}.md`;

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
