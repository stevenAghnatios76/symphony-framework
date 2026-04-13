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
  { id: 'quick-spec', mode: 'sequential', hasTemplate: true },
  { id: 'quick-dev', mode: 'sequential', hasTemplate: true },
  { id: 'party', mode: 'ensemble', hasTemplate: true },
  { id: 'create-stakeholder', mode: 'sequential', hasTemplate: true },
  { id: 'memory-hygiene', mode: 'sequential', hasTemplate: false },
  { id: 'document-project', mode: 'sequential', hasTemplate: true },
  { id: 'performance-review', mode: 'sequential', hasTemplate: true },
  { id: 'tech-debt-review', mode: 'sequential', hasTemplate: true },
];

for (const wf of workflows) {
  const base = `_symphony/lifecycle/workflows/anytime/${wf.id}`;

  describe(`Workflow: ${wf.id} (anytime)`, () => {
    it('workflow.yaml exists and parses', () => {
      expect(exists(`${base}/workflow.yaml`)).toBe(true);
      expect(() => readYaml(`${base}/workflow.yaml`)).not.toThrow();
    });

    it(`workflow.yaml has id="${wf.id}"`, () => {
      expect(readYaml(`${base}/workflow.yaml`).id).toBe(wf.id);
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
      it('instructions.xml has topic block', () => {
        expect(readText(`${base}/instructions.xml`)).toContain('<topic>');
      });
      it('workflow.yaml has ensemble_participants', () => {
        const y = readYaml(`${base}/workflow.yaml`);
        expect(Array.isArray(y.execution.ensemble_participants)).toBe(true);
        expect(y.execution.ensemble_participants.length).toBeGreaterThanOrEqual(2);
      });
    } else {
      it('instructions.xml has at least 1 step', () => {
        const steps = readText(`${base}/instructions.xml`).match(/<step\s/g) || [];
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

describe('Anytime workflow-specific checks', () => {
  it('party has ensemble mode with user-picks turn policy', () => {
    const y = readYaml('_symphony/lifecycle/workflows/anytime/party/workflow.yaml');
    expect(y.execution.mode).toBe('ensemble');
    expect(y.execution.ensemble_turn_policy).toBe('user-picks');
  });

  it('quick-dev requires quick-spec as input', () => {
    const y = readYaml('_symphony/lifecycle/workflows/anytime/quick-dev/workflow.yaml');
    expect(y.inputs.required).toContain('quick-spec');
  });
});
