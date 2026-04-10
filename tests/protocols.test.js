import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { XMLParser } from 'fast-xml-parser';

const __filename = fileURLToPath(import.meta.url);
const root = resolve(dirname(__filename), '..');
const readText = (p) => readFileSync(resolve(root, p), 'utf8');
const parser = new XMLParser({ ignoreAttributes: false, allowBooleanAttributes: true, preserveOrder: true });

const protocols = [
  { id: 'self-critique', path: '_symphony/core/protocols/self-critique.xml', specRef: '§5.2' },
  { id: 'trust-levels', path: '_symphony/core/protocols/trust-levels.xml', specRef: '§5.2' },
  { id: 'anti-rationalization', path: '_symphony/core/protocols/anti-rationalization.xml', specRef: '§5.2' },
  { id: 'diagnose-then-fix', path: '_symphony/core/protocols/diagnose-then-fix.xml', specRef: '§5.2' },
  { id: 'status-sync', path: '_symphony/core/protocols/status-sync.xml', specRef: '§5.2' },
  { id: 'review-gate-check', path: '_symphony/core/protocols/review-gate-check.xml', specRef: '§2.8' },
  { id: 'checkpoint-resume', path: '_symphony/core/protocols/checkpoint-resume.xml', specRef: '§5.2' },
  { id: 'memory-hygiene', path: '_symphony/core/protocols/memory-hygiene.xml', specRef: '§5.2' },
  { id: 'artifact-enrichment-hook', path: '_symphony/core/protocols/artifact-enrichment-hook.xml', specRef: '§2.9' },
];

for (const proto of protocols) {
  describe(`Protocol: ${proto.id} runtime (Spec 2b)`, () => {
    it('exists and parses as well-formed XML', () => {
      expect(existsSync(resolve(root, proto.path))).toBe(true);
      expect(() => parser.parse(readText(proto.path))).not.toThrow();
    });

    it('has status runtime', () => {
      expect(readText(proto.path)).toContain('<status>runtime</status>');
    });

    it(`has protocol id="${proto.id}"`, () => {
      expect(readText(proto.path)).toContain(`id="${proto.id}"`);
    });

    it('has mandates block', () => {
      expect(readText(proto.path)).toContain('<mandates>');
    });

    it('has flow with step elements', () => {
      const text = readText(proto.path);
      expect(text).toContain('<flow>');
      const stepMatches = text.match(/<step\s/g) || [];
      expect(stepMatches.length).toBeGreaterThanOrEqual(2);
    });
  });
}

// Protocol-specific tests
describe('Protocol: self-critique — specific checks', () => {
  const text = () => readText('_symphony/core/protocols/self-critique.xml');

  it('references confidence threshold 0.85', () => {
    expect(text()).toMatch(/0\.85/);
  });

  it('describes retry-once-then-escalate behavior', () => {
    expect(text()).toMatch(/retry|escalate/i);
  });

  it('states YOLO does not bypass self-critique', () => {
    expect(text()).toMatch(/YOLO.*never.*bypass|YOLO.*does not bypass/i);
  });
});

describe('Protocol: anti-rationalization — specific checks', () => {
  const text = () => readText('_symphony/core/protocols/anti-rationalization.xml');

  it('contains at least 4 excuse-rebuttal pairs', () => {
    const excuseMatches = text().match(/<excuse>/g) || [];
    expect(excuseMatches.length).toBeGreaterThanOrEqual(4);
  });
});

describe('Protocol: diagnose-then-fix — specific checks', () => {
  const text = () => readText('_symphony/core/protocols/diagnose-then-fix.xml');

  it('references debugger confidence threshold 0.7', () => {
    expect(text()).toMatch(/0\.7/);
  });

  it('describes max 2 retries', () => {
    expect(text()).toMatch(/max.*2|2.*retr|2 total/i);
  });
});

describe('Protocol: review-gate-check — specific checks', () => {
  const text = () => readText('_symphony/core/protocols/review-gate-check.xml');

  it('lists all 6 standard gates', () => {
    const t = text();
    expect(t).toContain('Code Review');
    expect(t).toContain('QA Tests');
    expect(t).toContain('Security Review');
    expect(t).toContain('Test Automation');
    expect(t).toContain('Test Review');
    expect(t).toContain('Performance');
  });

  it('references infrastructure gate substitutions (IR-/OR-/SR-)', () => {
    expect(text()).toMatch(/IR-|OR-|SR-/);
  });
});

describe('Protocol: checkpoint-resume — specific checks', () => {
  const text = () => readText('_symphony/core/protocols/checkpoint-resume.xml');

  it('references SHA256 verification', () => {
    expect(text()).toMatch(/sha256|SHA256/i);
  });

  it('describes Proceed/Start Fresh/Review options', () => {
    const t = text();
    expect(t).toMatch(/proceed/i);
    expect(t).toMatch(/start.fresh|start-fresh/i);
    expect(t).toMatch(/review/i);
  });
});

describe('Protocol: artifact-enrichment-hook — specific checks', () => {
  const text = () => readText('_symphony/core/protocols/artifact-enrichment-hook.xml');

  it('states hooks are non-blocking', () => {
    expect(text()).toMatch(/non-blocking|never.*halt|NEVER.*halt/i);
  });
});
