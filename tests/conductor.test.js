import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { XMLParser } from 'fast-xml-parser';
import YAML from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const root = resolve(dirname(__filename), '..');
const readText = (p) => readFileSync(resolve(root, p), 'utf8');
const parser = new XMLParser({ ignoreAttributes: false, allowBooleanAttributes: true, preserveOrder: true });

const conductorPath = '_symphony/core/engine/conductor.xml';

describe('Conductor runtime (Spec 3)', () => {
  it('exists and parses as well-formed XML', () => {
    expect(existsSync(resolve(root, conductorPath))).toBe(true);
    expect(() => parser.parse(readText(conductorPath))).not.toThrow();
  });

  it('has status runtime', () => {
    expect(readText(conductorPath)).toContain('<status>runtime</status>');
  });

  it('has mandates block', () => {
    expect(readText(conductorPath)).toContain('<mandates>');
  });

  it('has flow with at least 8 steps', () => {
    const text = readText(conductorPath);
    expect(text).toContain('<flow>');
    const stepMatches = text.match(/<step\s/g) || [];
    expect(stepMatches.length).toBeGreaterThanOrEqual(8);
  });

  describe('phase detection rules', () => {
    const text = () => readText(conductorPath);

    it('contains all 9 phase detection rules', () => {
      const t = text();
      expect(t).toMatch(/fix.*debug|debug.*fix/i);
      expect(t).toMatch(/onboard.*scan|scan.*analyze/i);
      expect(t).toMatch(/source code.*no.*artifact|no.*Symphony.*artifact/i);
      expect(t).toMatch(/small.*scope|quick.*path/i);
      expect(t).toMatch(/no product.brief|no.*brief/i);
      expect(t).toMatch(/brief exists.*no PRD|no.*PRD/i);
      expect(t).toMatch(/PRD exists.*no.*architecture|no.*architecture/i);
      expect(t).toMatch(/sprint.*active/i);
      expect(t).toMatch(/all.*stories.*done|stories.*done.*not.*shipped/i);
    });
  });

  describe('confidence scoring', () => {
    const text = () => readText(conductorPath);

    it('contains confidence threshold 0.80', () => {
      expect(text()).toContain('0.80');
    });

    it('describes 3 confidence components', () => {
      const t = text();
      expect(t).toMatch(/intent.match/i);
      expect(t).toMatch(/project.state/i);
      expect(t).toMatch(/prior.*routing.*memory|routing.*memory/i);
    });

    it('describes auto-dispatch vs user confirmation', () => {
      const t = text();
      expect(t).toMatch(/auto.dispatch/i);
      expect(t).toMatch(/top.2|two.*option|present.*option/i);
    });
  });

  describe('advisory pattern hints', () => {
    const text = () => readText(conductorPath);

    it('contains diagnostic patterns', () => {
      expect(text()).toMatch(/fix.*debug.*error|debug.*error.*trace/i);
    });

    it('contains create patterns', () => {
      expect(text()).toMatch(/create.*build|build.*write/i);
    });

    it('contains deploy patterns', () => {
      expect(text()).toMatch(/deploy.*release|release.*ship/i);
    });
  });

  it('references routing memory sidecar', () => {
    expect(readText(conductorPath)).toContain('conductor-sidecar');
  });

  it('contains complexity classification', () => {
    const text = readText(conductorPath);
    expect(text).toContain('simple');
    expect(text).toContain('medium');
    expect(text).toContain('complex');
  });

  it('describes dispatch to workflow-engine or wave-executor', () => {
    const text = readText(conductorPath);
    expect(text).toMatch(/workflow.engine/i);
    expect(text).toMatch(/wave.executor/i);
  });
});

// Lifecycle sequence tests
const seqPath = '_symphony/_config/lifecycle-sequence.yaml';

describe('Lifecycle sequence (Spec 3)', () => {
  it('exists and parses as valid YAML', () => {
    expect(existsSync(resolve(root, seqPath))).toBe(true);
    const text = readText(seqPath);
    expect(() => YAML.parse(text)).not.toThrow();
  });

  it('has entries for key workflows', () => {
    const seq = YAML.parse(readText(seqPath));
    expect(seq['brainstorm']).toBeDefined();
    expect(seq['create-prd']).toBeDefined();
    expect(seq['create-arch']).toBeDefined();
    expect(seq['dev-story']).toBeDefined();
    expect(seq['release-plan']).toBeDefined();
  });

  it('each entry has phase and next fields', () => {
    const seq = YAML.parse(readText(seqPath));
    for (const [id, entry] of Object.entries(seq)) {
      expect(entry.phase, `${id} missing phase`).toBeDefined();
      expect(entry.next, `${id} missing next`).toBeDefined();
    }
  });

  it('validate-prd has on_pass and on_fail', () => {
    const seq = YAML.parse(readText(seqPath));
    expect(seq['validate-prd'].next.on_pass).toBeDefined();
    expect(seq['validate-prd'].next.on_fail).toBeDefined();
  });

  it('post-deploy has terminal: true', () => {
    const seq = YAML.parse(readText(seqPath));
    expect(seq['post-deploy'].next.terminal).toBe(true);
  });

  it('has anytime workflows with standalone: true', () => {
    const seq = YAML.parse(readText(seqPath));
    expect(seq['memory-hygiene'].next.standalone).toBe(true);
    expect(seq['party'].next.standalone).toBe(true);
  });
});
