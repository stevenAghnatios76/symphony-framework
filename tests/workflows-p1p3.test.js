import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { XMLParser } from 'fast-xml-parser';
import YAML from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const root = resolve(dirname(__filename), '..');
const readText = (p) => readFileSync(resolve(root, p), 'utf8');
const exists = (p) => existsSync(resolve(root, p));
const readYaml = (p) => YAML.parse(readText(p));
const parser = new XMLParser({ ignoreAttributes: false, allowBooleanAttributes: true, preserveOrder: true });

const workflows = [
  { id: 'brainstorm', phase: '1-analysis', mode: 'ensemble', hasTemplate: true },
  { id: 'market-research', phase: '1-analysis', mode: 'sequential', hasTemplate: true },
  { id: 'domain-research', phase: '1-analysis', mode: 'sequential', hasTemplate: true },
  { id: 'tech-research', phase: '1-analysis', mode: 'sequential', hasTemplate: true },
  { id: 'advanced-elicitation', phase: '1-analysis', mode: 'sequential', hasTemplate: true },
  { id: 'product-brief', phase: '1-analysis', mode: 'sequential', hasTemplate: true },
  { id: 'create-prd', phase: '2-planning', mode: 'sequential', hasTemplate: true },
  { id: 'validate-prd', phase: '2-planning', mode: 'sequential', hasTemplate: false },
  { id: 'edit-prd', phase: '2-planning', mode: 'sequential', hasTemplate: false },
  { id: 'create-ux', phase: '2-planning', mode: 'sequential', hasTemplate: true },
  { id: 'review-a11y', phase: '2-planning', mode: 'sequential', hasTemplate: true },
  { id: 'create-arch', phase: '3-solutioning', mode: 'sequential', hasTemplate: true },
  { id: 'edit-arch', phase: '3-solutioning', mode: 'sequential', hasTemplate: false },
  { id: 'test-design', phase: '3-solutioning', mode: 'sequential', hasTemplate: true },
  { id: 'create-epics', phase: '3-solutioning', mode: 'sequential', hasTemplate: true },
  { id: 'atdd', phase: '3-solutioning', mode: 'sequential', hasTemplate: true },
  { id: 'threat-model', phase: '3-solutioning', mode: 'sequential', hasTemplate: true },
  { id: 'infra-design', phase: '3-solutioning', mode: 'sequential', hasTemplate: true },
  { id: 'trace', phase: '3-solutioning', mode: 'sequential', hasTemplate: true },
  { id: 'readiness-check', phase: '3-solutioning', mode: 'sequential', hasTemplate: true },
  { id: 'overture', phase: '3-solutioning', mode: 'parallel-waves', hasTemplate: true },
];

for (const wf of workflows) {
  const base = `_symphony/lifecycle/workflows/${wf.phase}/${wf.id}`;

  describe(`Workflow: ${wf.id} (${wf.phase})`, () => {
    it('workflow.yaml exists and parses', () => {
      expect(exists(`${base}/workflow.yaml`)).toBe(true);
      expect(() => readYaml(`${base}/workflow.yaml`)).not.toThrow();
    });

    it(`workflow.yaml has id="${wf.id}"`, () => {
      const y = readYaml(`${base}/workflow.yaml`);
      expect(y.id).toBe(wf.id);
    });

    it('workflow.yaml has owner, execution.mode, inputs, outputs, gates', () => {
      const y = readYaml(`${base}/workflow.yaml`);
      expect(y.owner).toBeDefined();
      expect(y.execution.mode).toBe(wf.mode);
      expect(y.inputs).toBeDefined();
      expect(y.outputs).toBeDefined();
      expect(y.gates).toBeDefined();
    });

    it('instructions.xml exists and parses', () => {
      expect(exists(`${base}/instructions.xml`)).toBe(true);
      expect(() => parser.parse(readText(`${base}/instructions.xml`))).not.toThrow();
    });

    if (wf.mode === 'ensemble') {
      it('instructions.xml has topic block (ensemble mode)', () => {
        expect(readText(`${base}/instructions.xml`)).toContain('<topic>');
      });

      it('workflow.yaml has ensemble_participants and turn_policy', () => {
        const y = readYaml(`${base}/workflow.yaml`);
        expect(Array.isArray(y.execution.ensemble_participants)).toBe(true);
        expect(y.execution.ensemble_participants.length).toBeGreaterThanOrEqual(2);
        expect(y.execution.ensemble_turn_policy).toBeDefined();
      });
    } else if (wf.mode === 'parallel-waves') {
      it('instructions.xml has steps with inputs/outputs attributes', () => {
        const text = readText(`${base}/instructions.xml`);
        expect(text).toContain('outputs=');
        expect(text).toContain('inputs=');
      });
    } else {
      it('instructions.xml has at least 1 step element', () => {
        const text = readText(`${base}/instructions.xml`);
        const steps = text.match(/<step\s/g) || [];
        expect(steps.length).toBeGreaterThanOrEqual(1);
      });
    }

    it('checklist.md exists', () => {
      expect(exists(`${base}/checklist.md`)).toBe(true);
    });

    if (wf.hasTemplate) {
      it('template.md exists', () => {
        expect(exists(`${base}/template.md`)).toBe(true);
      });
    }
  });
}

// Workflow-specific checks
describe('Workflow-specific checks', () => {
  it('brainstorm has ensemble mode with participants', () => {
    const y = readYaml('_symphony/lifecycle/workflows/1-analysis/brainstorm/workflow.yaml');
    expect(y.execution.mode).toBe('ensemble');
    expect(y.execution.ensemble_participants).toContain('product-manager');
  });

  it('validate-prd is owned by validator', () => {
    const y = readYaml('_symphony/lifecycle/workflows/2-planning/validate-prd/workflow.yaml');
    expect(y.owner).toBe('validator');
  });

  it('overture has parallel-waves mode', () => {
    const y = readYaml('_symphony/lifecycle/workflows/3-solutioning/overture/workflow.yaml');
    expect(y.execution.mode).toBe('parallel-waves');
  });

  it('create-prd traces to product-brief', () => {
    const y = readYaml('_symphony/lifecycle/workflows/2-planning/create-prd/workflow.yaml');
    expect(y.outputs.traceable_to).toContain('product-brief');
  });
});
