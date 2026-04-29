import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const root = resolve(dirname(__filename), '..');
const readText = (p) => readFileSync(resolve(root, p), 'utf8');

const adapters = [
  'vitest-adapter', 'pytest-adapter', 'go-test-adapter',
  'flutter-test-adapter', 'xctest-adapter',
];

describe('Test execution adapters inventory (Spec 7b)', () => {
  it('has exactly 5 adapter files', () => {
    const dir = resolve(root, '_symphony/testing/adapters');
    const files = readdirSync(dir).filter(f => f.endsWith('.md'));
    expect(files.length).toBe(5);
  });
});

for (const adapter of adapters) {
  describe(`Adapter: ${adapter} (Spec 7b)`, () => {
    const path = `_symphony/testing/adapters/${adapter}.md`;

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

    it('has Discovery section', () => {
      expect(readText(path)).toContain('## Discovery');
    });

    it('has Execution section', () => {
      expect(readText(path)).toContain('## Execution');
    });

    it('has Result Parsing section', () => {
      expect(readText(path)).toContain('## Result Parsing');
    });
  });
}
