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
  { id: 'create-story', phase: '4-implementation', mode: 'sequential', hasTemplate: true },
  { id: 'validate-story', phase: '4-implementation', mode: 'sequential', hasTemplate: false },
  { id: 'sprint-plan', phase: '4-implementation', mode: 'sequential', hasTemplate: true },
  { id: 'dev-story', phase: '4-implementation', mode: 'sequential', hasTemplate: true },
  { id: 'check-dod', phase: '4-implementation', mode: 'sequential', hasTemplate: false },
  { id: 'code-review', phase: '4-implementation', mode: 'sequential', hasTemplate: true },
  { id: 'qa-tests', phase: '4-implementation', mode: 'sequential', hasTemplate: true },
  { id: 'security-review', phase: '4-implementation', mode: 'sequential', hasTemplate: true },
  { id: 'run-all-reviews', phase: '4-implementation', mode: 'parallel-waves', hasTemplate: true },
  { id: 'review-gate', phase: '4-implementation', mode: 'sequential', hasTemplate: false },
  { id: 'sprint-status', phase: '4-implementation', mode: 'sequential', hasTemplate: false },
  { id: 'retro', phase: '4-implementation', mode: 'ensemble', hasTemplate: true },
  { id: 'change-request', phase: '4-implementation', mode: 'sequential', hasTemplate: true },
  { id: 'correct-course', phase: '4-implementation', mode: 'sequential', hasTemplate: false },
  { id: 'release-plan', phase: '5-deployment', mode: 'sequential', hasTemplate: true },
  { id: 'rollback-plan', phase: '5-deployment', mode: 'sequential', hasTemplate: true },
  { id: 'deploy-checklist', phase: '5-deployment', mode: 'sequential', hasTemplate: true },
  { id: 'post-deploy', phase: '5-deployment', mode: 'sequential', hasTemplate: true },
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
      it('instructions.xml has topic block', () => {
        expect(readText(`${base}/instructions.xml`)).toContain('<topic>');
      });
      it('workflow.yaml has ensemble_participants', () => {
        const y = readYaml(`${base}/workflow.yaml`);
        expect(Array.isArray(y.execution.ensemble_participants)).toBe(true);
        expect(y.execution.ensemble_participants.length).toBeGreaterThanOrEqual(2);
      });
    } else if (wf.mode === 'parallel-waves') {
      it('instructions.xml has steps with inputs/outputs attributes', () => {
        const text = readText(`${base}/instructions.xml`);
        expect(text).toContain('outputs=');
        expect(text).toContain('inputs=');
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

describe('Workflow-specific checks (Phase 4-5)', () => {
  it('run-all-reviews has parallel-waves mode', () => {
    const y = readYaml('_symphony/lifecycle/workflows/4-implementation/run-all-reviews/workflow.yaml');
    expect(y.execution.mode).toBe('parallel-waves');
  });

  it('retro has ensemble mode with participants', () => {
    const y = readYaml('_symphony/lifecycle/workflows/4-implementation/retro/workflow.yaml');
    expect(y.execution.mode).toBe('ensemble');
    expect(y.execution.ensemble_participants).toContain('scrum-master');
  });

  it('dev-story is owned by developer', () => {
    const y = readYaml('_symphony/lifecycle/workflows/4-implementation/dev-story/workflow.yaml');
    expect(y.owner).toBe('developer');
  });

  it('post-deploy outputs to implementation-artifacts', () => {
    const y = readYaml('_symphony/lifecycle/workflows/5-deployment/post-deploy/workflow.yaml');
    expect(y.outputs.primary).toContain('implementation-artifacts');
  });
});
