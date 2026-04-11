import { existsSync, readFileSync, mkdtempSync, rmSync, mkdirSync, readdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const root = resolve(dirname(__filename), '..');

describe('Claude Code adapter', () => {
  let translate, metadata;

  beforeAll(async () => {
    const mod = await import('../adapters/claude-code/translator.js');
    translate = mod.translate;
    metadata = mod.metadata;
  });

  it('metadata.stub is false', () => {
    expect(metadata.stub).toBe(false);
  });

  it('metadata.id is claude-code', () => {
    expect(metadata.id).toBe('claude-code');
  });

  it('translate is a function', () => {
    expect(typeof translate).toBe('function');
  });

  describe('translate with fixtures', () => {
    let tmpDir;

    beforeAll(async () => {
      tmpDir = mkdtempSync(join(tmpdir(), 'symphony-adapter-test-'));
      await translate(root, tmpDir);
    });

    afterAll(() => {
      rmSync(tmpDir, { recursive: true, force: true });
    });

    it('creates .claude/commands/ directory', () => {
      expect(existsSync(join(tmpDir, '.claude', 'commands'))).toBe(true);
    });

    it('creates entry command symphony.md', () => {
      const entryPath = join(tmpDir, '.claude', 'commands', 'symphony.md');
      expect(existsSync(entryPath)).toBe(true);
      const content = readFileSync(entryPath, 'utf8');
      expect(content).toContain('conductor.xml');
    });

    it('creates command files for fixture workflows', () => {
      const cmdsDir = join(tmpDir, '.claude', 'commands');
      const files = existsSync(cmdsDir)
        ? readdirSync(cmdsDir).filter(f => f.startsWith('symphony-'))
        : [];
      // At least the fixture workflows should produce command files
      expect(files.length).toBeGreaterThanOrEqual(1);
    });

    it('generated command files contain conductor.xml reference', () => {
      const cmdsDir = join(tmpDir, '.claude', 'commands');
      const files = readdirSync(cmdsDir).filter(f => f.startsWith('symphony-'));
      for (const file of files) {
        const content = readFileSync(join(cmdsDir, file), 'utf8');
        expect(content).toContain('conductor.xml');
      }
    });
  });
});

describe('Copilot adapter', () => {
  let translate, metadata;

  beforeAll(async () => {
    const mod = await import('../adapters/copilot/translator.js');
    translate = mod.translate;
    metadata = mod.metadata;
  });

  it('metadata.stub is false', () => {
    expect(metadata.stub).toBe(false);
  });

  it('metadata.id is copilot', () => {
    expect(metadata.id).toBe('copilot');
  });

  it('translate is a function', () => {
    expect(typeof translate).toBe('function');
  });

  describe('translate with fixtures', () => {
    let tmpDir;

    beforeAll(async () => {
      tmpDir = mkdtempSync(join(tmpdir(), 'symphony-copilot-test-'));
      await translate(root, tmpDir);
    });

    afterAll(() => {
      rmSync(tmpDir, { recursive: true, force: true });
    });

    it('creates .github/prompts/ directory', () => {
      expect(existsSync(join(tmpDir, '.github', 'prompts'))).toBe(true);
    });

    it('creates entry command symphony.prompt.md', () => {
      const entryPath = join(tmpDir, '.github', 'prompts', 'symphony.prompt.md');
      expect(existsSync(entryPath)).toBe(true);
      const content = readFileSync(entryPath, 'utf8');
      expect(content).toContain('conductor.xml');
    });

    it('creates prompt files for fixture workflows', () => {
      const promptsDir = join(tmpDir, '.github', 'prompts');
      const files = existsSync(promptsDir)
        ? readdirSync(promptsDir).filter(f => f.startsWith('symphony-'))
        : [];
      expect(files.length).toBeGreaterThanOrEqual(1);
    });

    it('generated prompt files contain conductor.xml reference', () => {
      const promptsDir = join(tmpDir, '.github', 'prompts');
      const files = readdirSync(promptsDir).filter(f => f.startsWith('symphony-'));
      for (const file of files) {
        const content = readFileSync(join(promptsDir, file), 'utf8');
        expect(content).toContain('conductor.xml');
      }
    });
  });
});
