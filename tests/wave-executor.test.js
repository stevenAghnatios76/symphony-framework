import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { XMLParser } from 'fast-xml-parser';
import YAML from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const root = resolve(dirname(__filename), '..');
const readText = (p) => readFileSync(resolve(root, p), 'utf8');
const readYaml = (p) => YAML.parse(readText(p));
const parser = new XMLParser({ ignoreAttributes: false, allowBooleanAttributes: true, preserveOrder: true });

const wePath = '_symphony/core/engine/wave-executor.xml';

describe('Wave Executor runtime (Spec 4)', () => {
  it('exists and parses as well-formed XML', () => {
    expect(existsSync(resolve(root, wePath))).toBe(true);
    expect(() => parser.parse(readText(wePath))).not.toThrow();
  });

  it('has status runtime', () => {
    expect(readText(wePath)).toContain('<status>runtime</status>');
  });

  it('has mandates block', () => {
    expect(readText(wePath)).toContain('<mandates>');
  });

  it('has flow with at least 6 steps', () => {
    const text = readText(wePath);
    expect(text).toContain('<flow>');
    const stepMatches = text.match(/<step\s/g) || [];
    expect(stepMatches.length).toBeGreaterThanOrEqual(6);
  });

  it('references topological sort', () => {
    expect(readText(wePath)).toMatch(/topological.*sort|topo.*sort/i);
  });

  it('references integration gate', () => {
    expect(readText(wePath)).toMatch(/integration.gate|integration-gate/i);
  });

  it('contains max parallel limit', () => {
    expect(readText(wePath)).toMatch(/max.*4|≤\s*4|max_wave_siblings/i);
  });

  it('references diagnose-then-fix protocol', () => {
    expect(readText(wePath)).toMatch(/diagnose.then.fix/i);
  });

  it('references self-critique protocol', () => {
    expect(readText(wePath)).toMatch(/self.critique/i);
  });

  it('contains conflict detection logic', () => {
    expect(readText(wePath)).toMatch(/conflict.*detect|detect.*conflict/i);
  });
});

describe('Wave Executor — workflow-engine.xml integration', () => {
  it('workflow-engine.xml no longer contains "parallel-waves not yet implemented"', () => {
    const text = readText('_symphony/core/engine/workflow-engine.xml');
    expect(text).not.toContain('parallel-waves not yet implemented');
  });

  it('workflow-engine.xml references wave-executor in parallel-waves branch', () => {
    const text = readText('_symphony/core/engine/workflow-engine.xml');
    expect(text).toMatch(/wave.executor/i);
  });
});

describe('Wave Executor fixtures — wave-hello', () => {
  it('workflow.yaml has execution.mode parallel-waves', () => {
    const y = readYaml('tests/fixtures/wave-hello/workflow.yaml');
    expect(y.execution.mode).toBe('parallel-waves');
  });

  it('workflow.yaml has max_wave_siblings', () => {
    const y = readYaml('tests/fixtures/wave-hello/workflow.yaml');
    expect(y.execution.max_wave_siblings).toBeDefined();
    expect(y.execution.max_wave_siblings).toBeLessThanOrEqual(4);
  });

  it('instructions.xml has steps with inputs/outputs attributes for DAG', () => {
    const text = readText('tests/fixtures/wave-hello/instructions.xml');
    expect(() => parser.parse(text)).not.toThrow();
    expect(text).toContain('outputs=');
    expect(text).toContain('inputs=');
  });

  it('steps 1 and 2 have no inputs (Wave 1 candidates)', () => {
    const text = readText('tests/fixtures/wave-hello/instructions.xml');
    const step1Match = text.match(/<step[^>]*id="alpha-scan"[^>]*/);
    const step2Match = text.match(/<step[^>]*id="beta-scan"[^>]*/);
    expect(step1Match[0]).not.toContain('inputs=');
    expect(step2Match[0]).not.toContain('inputs=');
  });

  it('step 3 has inputs referencing outputs of steps 1 and 2', () => {
    const text = readText('tests/fixtures/wave-hello/instructions.xml');
    const step3Match = text.match(/<step[^>]*id="synthesis"[^>]*/);
    expect(step3Match[0]).toContain('inputs=');
    expect(step3Match[0]).toContain('alpha-output.md');
    expect(step3Match[0]).toContain('beta-output.md');
  });

  it('checklist.md exists', () => {
    expect(existsSync(resolve(root, 'tests/fixtures/wave-hello/checklist.md'))).toBe(true);
  });
});
