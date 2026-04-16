# Phase 4-5 Workflows (Spec 5c) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create 18 workflow directories (68 files) for Phase 4 Implementation and Phase 5 Deployment.

**Architecture:** Same 4-file structure as Spec 5b. Output artifacts go to `docs/implementation-artifacts/`. Two special modes: run-all-reviews uses parallel-waves, retro uses ensemble.

**Tech Stack:** YAML, XML, Markdown, Vitest

---

### Task 1: Test File

- [ ] **Step 1: Create `tests/workflows-p4p5.test.js`**

```javascript
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
```

- [ ] **Step 2: Commit**

```bash
git add tests/workflows-p4p5.test.js
git commit -m "test(workflows): add structural test file for Phase 4-5 workflows (Spec 5c)"
```

---

### Task 2: Phase 4 — Implementation Workflows (14 workflows)

Create 14 directories in `_symphony/lifecycle/workflows/4-implementation/`.

Read the spec at `docs/superpowers/specs/2026-04-12-symphony-phase-4-5-workflows-design.md` §2 for all details.

- [ ] **Step 1: Create all 14 implementation workflows**

Each directory gets: workflow.yaml, instructions.xml, checklist.md, and template.md (except validate-story, check-dod, review-gate, sprint-status, correct-course which have NO template.md).

Key special cases:
- **run-all-reviews**: execution.mode: parallel-waves. instructions.xml has 7 DAG steps: steps 1-6 parallel (code-rev, qa-test, sec-rev, test-auto, test-rev, perf-rev), step 7 synthesis with inputs from all 6. Use id/inputs/outputs attributes.
- **retro**: execution.mode: ensemble. ensemble_participants: [scrum-master, developer, reviewer, test-architect]. Turn policy: round-robin. Max turns: 12. instructions.xml uses topic/synthesis blocks.
- **All outputs** go to `docs/implementation-artifacts/` paths.

Owners per spec: create-story→product-manager, validate-story→validator, sprint-plan→scrum-master, dev-story→developer, check-dod→validator, code-review→reviewer, qa-tests→test-architect, security-review→security-agent, run-all-reviews→validator, review-gate→validator, sprint-status→scrum-master, retro→scrum-master, change-request→product-manager, correct-course→scrum-master.

- [ ] **Step 2: Run tests**

Run: `npx vitest run tests/workflows-p4p5.test.js -t "4-implementation"`
Expected: All 14 implementation workflow tests PASS

- [ ] **Step 3: Commit**

```bash
git add _symphony/lifecycle/workflows/4-implementation/
git commit -m "feat(workflows): add 14 Phase 4 Implementation workflows — dev, review, sprint, retro (Spec 5c)"
```

---

### Task 3: Phase 5 — Deployment Workflows (4 workflows)

Create 4 directories in `_symphony/lifecycle/workflows/5-deployment/`.

Read spec §3 for details.

- [ ] **Step 1: Create all 4 deployment workflows**

- `release-plan/` — owner: devops-agent, 5 steps, template: Version, Changelog, Migration Notes
- `rollback-plan/` — owner: devops-agent, requires release-plan, 4 steps, template: Triggers, Steps, Verification
- `deploy-checklist/` — owner: devops-agent, requires release + rollback plans, 5 steps, template: Environment, Secrets, Migrations, Smoke Tests
- `post-deploy/` — owner: devops-agent, requires deploy-checklist, 5 steps, template: Health Checks, Monitoring, Alerts, Results. Gates: terminal: true

All have template.md. All output to `docs/implementation-artifacts/`.

- [ ] **Step 2: Run full suite**

Run: `npx vitest run`
Expected: ALL tests pass, 0 failures

- [ ] **Step 3: Commit**

```bash
git add _symphony/lifecycle/workflows/5-deployment/
git commit -m "feat(workflows): add 4 Phase 5 Deployment workflows — release, rollback, deploy, post-deploy (Spec 5c)"
```
