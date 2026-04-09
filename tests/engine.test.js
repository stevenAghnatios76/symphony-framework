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

const parser = new XMLParser({
  ignoreAttributes: false,
  allowBooleanAttributes: true,
  preserveOrder: true,
});

const parseXml = (relPath) => {
  const text = readText(relPath);
  return parser.parse(text);
};

describe('Symphony engine XML — parse validity', () => {
  const engineFiles = [
    '_symphony/core/engine/workflow-engine.xml',
    '_symphony/core/engine/task-runner.xml',
    '_symphony/core/engine/protocols/preflight-check.xml',
    '_symphony/core/engine/protocols/variable-resolution.xml',
    '_symphony/core/engine/protocols/planning-gate.xml',
  ];

  for (const file of engineFiles) {
    it(`${file} exists and parses as well-formed XML`, () => {
      expect(existsSync(resolve(root, file))).toBe(true);
      expect(() => parseXml(file)).not.toThrow();
    });
  }
});

const engineText = () => readText('_symphony/core/engine/workflow-engine.xml');

describe('Symphony engine XML — contract markers on workflow-engine.xml', () => {
  describe('extension point invocations (all eight)', () => {
    const markers = [
      '<invoke protocol="preflight-check" phase="before-workflow-start"/>',
      '<invoke protocol="gate-enforcer" phase="pre-start"/>',
      '<invoke protocol="gate-enforcer" phase="post-complete"/>',
      '<invoke protocol="trust-levels" on="before-step-execute"/>',
      '<invoke protocol="anti-rationalization" on="before-persist"/>',
      '<invoke protocol="self-critique" on="before-persist"/>',
      '<invoke protocol="checkpoint-resume" on="after-step-complete"/>',
      '<invoke protocol="artifact-enrichment-hook" on="after-output-persist"/>',
    ];
    for (const marker of markers) {
      it(`contains ${marker}`, () => {
        expect(engineText()).toContain(marker);
      });
    }
  });

  describe('execution mode branches', () => {
    it('has a sequential mode branch marker', () => {
      expect(engineText()).toMatch(/execution_mode\s*==\s*['"]sequential['"]|<mode name="sequential"/);
    });
    it('has an ensemble mode branch marker', () => {
      expect(engineText()).toMatch(/execution_mode\s*==\s*['"]ensemble['"]|<mode name="ensemble"/);
    });
    it('has a parallel-waves reservation with a Spec 4 handoff note', () => {
      const text = engineText();
      expect(text).toContain('parallel-waves');
      expect(text).toContain('Spec 4');
    });
  });

  describe('interaction modes', () => {
    it('has a normal mode description', () => {
      expect(engineText()).toMatch(/<mode name="normal">|interaction_mode\s*==\s*['"]normal['"]/);
    });
    it('has a YOLO mode description that mentions gates/self-critique cannot be bypassed', () => {
      const text = engineText();
      expect(text).toContain('YOLO');
      expect(text).toMatch(/never bypass|NEVER bypass|does not bypass/i);
    });
    it('has a planning mode description that invokes planning-gate', () => {
      const text = engineText();
      expect(text).toContain('planning');
      expect(text).toContain('planning-gate');
    });
  });

  describe('HALT directives', () => {
    const haltStatuses = [
      'halted_unresolved_variable',
      'halted_gate_failure',
      'halted_retry_exhausted',
    ];
    for (const status of haltStatuses) {
      it(`declares HALT status "${status}"`, () => {
        expect(engineText()).toContain(status);
      });
    }
  });
});

// --- Fixture tests ---------------------------------------------------------

describe('Symphony engine fixtures — sequential-hello', () => {
  it('workflow.yaml has all required fields', () => {
    const y = readYaml('tests/fixtures/sequential-hello/workflow.yaml');
    expect(y.id).toBe('sequential-hello');
    expect(y.owner).toBe('orchestrator');
    expect(y.execution.mode).toBe('sequential');
    expect(y.inputs).toBeDefined();
    expect(Array.isArray(y.inputs.required)).toBe(true);
    expect(y.outputs.primary).toBe('tests/fixtures/sequential-hello/hello-output.md');
    expect(Array.isArray(y.gates.pre_start)).toBe(true);
    expect(Array.isArray(y.gates.post_complete)).toBe(true);
  });

  it('instructions.xml parses and contains exactly one step with a template-output', () => {
    const text = readText('tests/fixtures/sequential-hello/instructions.xml');
    expect(() => parser.parse(text)).not.toThrow();
    const stepMatches = text.match(/<step\s/g) || [];
    expect(stepMatches.length).toBe(1);
    expect(text).toContain('<template-output file="tests/fixtures/sequential-hello/hello-output.md">');
    expect(text).toContain('<action>');
  });

  it('checklist.md and template.md exist', () => {
    expect(existsSync(resolve(root, 'tests/fixtures/sequential-hello/checklist.md'))).toBe(true);
    expect(existsSync(resolve(root, 'tests/fixtures/sequential-hello/template.md'))).toBe(true);
  });
});
