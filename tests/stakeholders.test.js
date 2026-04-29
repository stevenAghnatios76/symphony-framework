import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const root = resolve(dirname(__filename), '..');
const readText = (p) => readFileSync(resolve(root, p), 'utf8');

const template = '_symphony/lifecycle/agents/stakeholders/_persona-template.md';
const personas = [
  { id: 'cto', file: '_symphony/lifecycle/agents/stakeholders/cto.md' },
  { id: 'product-owner', file: '_symphony/lifecycle/agents/stakeholders/product-owner.md' },
  { id: 'end-user', file: '_symphony/lifecycle/agents/stakeholders/end-user.md' },
  { id: 'security-officer', file: '_symphony/lifecycle/agents/stakeholders/security-officer.md' },
  { id: 'qa-lead', file: '_symphony/lifecycle/agents/stakeholders/qa-lead.md' },
];

describe('Stakeholder persona template (Spec 7c)', () => {
  it('exists', () => {
    expect(existsSync(resolve(root, template))).toBe(true);
  });

  it('is under 60 lines', () => {
    const lines = readText(template).split('\n').length;
    expect(lines).toBeLessThanOrEqual(60);
  });

  it('has abstract type in frontmatter', () => {
    expect(readText(template)).toContain('type: abstract');
  });
});

describe('Stakeholder personas inventory (Spec 7c)', () => {
  it('has exactly 5 concrete personas', () => {
    const dir = resolve(root, '_symphony/lifecycle/agents/stakeholders');
    const files = readdirSync(dir).filter(
      (f) => f.endsWith('.md') && f !== '_persona-template.md',
    );
    expect(files.length).toBe(5);
  });
});

for (const persona of personas) {
  describe(`Stakeholder: ${persona.id} (Spec 7c)`, () => {
    it('exists', () => {
      expect(existsSync(resolve(root, persona.file))).toBe(true);
    });

    it('is under 60 lines', () => {
      const lines = readText(persona.file).split('\n').length;
      expect(lines).toBeLessThanOrEqual(60);
    });

    it('has frontmatter with type stakeholder-persona', () => {
      expect(readText(persona.file)).toContain('type: stakeholder-persona');
    });

    it('has <persona> element', () => {
      expect(readText(persona.file)).toContain('<persona');
    });

    it('has <background>', () => {
      expect(readText(persona.file)).toContain('<background>');
    });

    it('has <priorities>', () => {
      expect(readText(persona.file)).toContain('<priorities>');
    });

    it('has <concerns>', () => {
      expect(readText(persona.file)).toContain('<concerns>');
    });

    it('has <review-lens>', () => {
      expect(readText(persona.file)).toContain('<review-lens>');
    });

    it('has <communication-style>', () => {
      expect(readText(persona.file)).toContain('<communication-style>');
    });
  });
}
