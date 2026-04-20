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
  { id: 'design-thinking', mode: 'ensemble', turnPolicy: 'round-robin', maxTurns: 20 },
  { id: 'innovation-strategy', mode: 'ensemble', turnPolicy: 'user-picks', maxTurns: 18 },
  { id: 'problem-solving', mode: 'ensemble', turnPolicy: 'round-robin', maxTurns: 16 },
  { id: 'creative-sprint', mode: 'ensemble', turnPolicy: 'user-picks', maxTurns: 20 },
  { id: 'storytelling', mode: 'sequential' },
  { id: 'slide-deck', mode: 'sequential' },
  { id: 'pitch-deck', mode: 'sequential' },
];

for (const wf of workflows) {
  const base = `_symphony/creative/workflows/${wf.id}`;

  describe(`Creative Workflow: ${wf.id} (Spec 6a)`, () => {
    it('workflow.yaml exists and parses', () => {
      expect(exists(`${base}/workflow.yaml`)).toBe(true);
      expect(() => readYaml(`${base}/workflow.yaml`)).not.toThrow();
    });

    it(`workflow.yaml has id="${wf.id}"`, () => {
      expect(readYaml(`${base}/workflow.yaml`).id).toBe(wf.id);
    });

    it('workflow.yaml has owner, model, description', () => {
      const y = readYaml(`${base}/workflow.yaml`);
      expect(y.owner).toBeDefined();
      expect(y.model).toBe('opus');
      expect(y.description).toBeDefined();
    });

    it('workflow.yaml has execution.mode, inputs, outputs, gates, disciplines', () => {
      const y = readYaml(`${base}/workflow.yaml`);
      expect(y.execution.mode).toBe(wf.mode);
      expect(y.inputs).toBeDefined();
      expect(y.outputs).toBeDefined();
      expect(y.gates).toBeDefined();
      expect(y.disciplines).toBeDefined();
    });

    it('instructions.xml exists and parses', () => {
      expect(exists(`${base}/instructions.xml`)).toBe(true);
      expect(() => parser.parse(readText(`${base}/instructions.xml`))).not.toThrow();
    });

    if (wf.mode === 'ensemble') {
      it('instructions.xml has topic block', () => {
        expect(readText(`${base}/instructions.xml`)).toContain('<topic>');
      });

      it('workflow.yaml has ensemble_participants with >= 2 members', () => {
        const y = readYaml(`${base}/workflow.yaml`);
        expect(Array.isArray(y.execution.ensemble_participants)).toBe(true);
        expect(y.execution.ensemble_participants.length).toBeGreaterThanOrEqual(2);
      });

      it(`workflow.yaml has ensemble_turn_policy="${wf.turnPolicy}"`, () => {
        const y = readYaml(`${base}/workflow.yaml`);
        expect(y.execution.ensemble_turn_policy).toBe(wf.turnPolicy);
      });

      it(`workflow.yaml has max_turns=${wf.maxTurns}`, () => {
        const y = readYaml(`${base}/workflow.yaml`);
        expect(y.execution.max_turns).toBe(wf.maxTurns);
      });
    } else {
      it('instructions.xml has at least 1 step element', () => {
        const text = readText(`${base}/instructions.xml`);
        const steps = text.match(/<step\s/g) || [];
        expect(steps.length).toBeGreaterThanOrEqual(1);
      });
    }

    it('checklist.md exists with >= 3 checkbox items', () => {
      expect(exists(`${base}/checklist.md`)).toBe(true);
      const checks = readText(`${base}/checklist.md`).match(/- \[ \]/g) || [];
      expect(checks.length).toBeGreaterThanOrEqual(3);
    });

    it('template.md exists', () => {
      expect(exists(`${base}/template.md`)).toBe(true);
    });
  });
}

describe('Creative workflow-specific checks', () => {
  it('design-thinking is owned by design-thinking-coach', () => {
    const y = readYaml('_symphony/creative/workflows/design-thinking/workflow.yaml');
    expect(y.owner).toBe('design-thinking-coach');
  });

  it('design-thinking participants include brainstorming-coach, problem-solver, storyteller', () => {
    const y = readYaml('_symphony/creative/workflows/design-thinking/workflow.yaml');
    expect(y.execution.ensemble_participants).toContain('brainstorming-coach');
    expect(y.execution.ensemble_participants).toContain('problem-solver');
    expect(y.execution.ensemble_participants).toContain('storyteller');
  });

  it('innovation-strategy is owned by innovation-strategist', () => {
    const y = readYaml('_symphony/creative/workflows/innovation-strategy/workflow.yaml');
    expect(y.owner).toBe('innovation-strategist');
  });

  it('problem-solving is owned by problem-solver', () => {
    const y = readYaml('_symphony/creative/workflows/problem-solving/workflow.yaml');
    expect(y.owner).toBe('problem-solver');
  });

  it('creative-sprint is owned by brainstorming-coach', () => {
    const y = readYaml('_symphony/creative/workflows/creative-sprint/workflow.yaml');
    expect(y.owner).toBe('brainstorming-coach');
  });

  it('creative-sprint has all 6 creative agents as participants', () => {
    const y = readYaml('_symphony/creative/workflows/creative-sprint/workflow.yaml');
    const p = y.execution.ensemble_participants;
    expect(p).toContain('brainstorming-coach');
    expect(p).toContain('design-thinking-coach');
    expect(p).toContain('innovation-strategist');
    expect(p).toContain('problem-solver');
    expect(p).toContain('storyteller');
    expect(p).toContain('presentation-designer');
  });

  it('storytelling is owned by storyteller', () => {
    const y = readYaml('_symphony/creative/workflows/storytelling/workflow.yaml');
    expect(y.owner).toBe('storyteller');
  });

  it('slide-deck is owned by presentation-designer', () => {
    const y = readYaml('_symphony/creative/workflows/slide-deck/workflow.yaml');
    expect(y.owner).toBe('presentation-designer');
  });

  it('pitch-deck is owned by presentation-designer', () => {
    const y = readYaml('_symphony/creative/workflows/pitch-deck/workflow.yaml');
    expect(y.owner).toBe('presentation-designer');
  });
});
