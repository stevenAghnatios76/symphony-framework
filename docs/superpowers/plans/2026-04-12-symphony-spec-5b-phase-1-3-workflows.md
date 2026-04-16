# Phase 1-3 Workflows (Spec 5b) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create 21 workflow directories (84 files) for Phase 1 Analysis, Phase 2 Planning, and Phase 3 Solutioning, giving Symphony its first real workflow content.

**Architecture:** Each workflow is a directory with 4 files: workflow.yaml (config), instructions.xml (steps), checklist.md (gates), template.md (output template). The spec at `docs/superpowers/specs/2026-04-12-symphony-phase-1-3-workflows-design.md` has complete details for every workflow — owner, mode, inputs, outputs, gates, steps, and template sections.

**Tech Stack:** YAML (config), XML (instructions), Markdown (checklists + templates), Vitest (tests)

---

## File Structure

All workflows live under `_symphony/lifecycle/workflows/`:
- `1-analysis/` — 6 workflows (brainstorm, market-research, domain-research, tech-research, advanced-elicitation, product-brief)
- `2-planning/` — 5 workflows (create-prd, validate-prd, edit-prd, create-ux, review-a11y)
- `3-solutioning/` — 10 workflows (create-arch, edit-arch, test-design, create-epics, atdd, threat-model, infra-design, trace, readiness-check, overture)
- `tests/workflows-p1p3.test.js` — structural tests

---

### Task 1: Test File

**Files:**
- Create: `tests/workflows-p1p3.test.js`

- [ ] **Step 1: Create the test file**

Create `tests/workflows-p1p3.test.js`:

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
```

- [ ] **Step 2: Commit test file**

```bash
git add tests/workflows-p1p3.test.js
git commit -m "test(workflows): add structural test file for Phase 1-3 workflows (Spec 5b)"
```

---

### Task 2: Phase 1 — Analysis Workflows (6 workflows)

**Files:** Create 24 files across 6 directories in `_symphony/lifecycle/workflows/1-analysis/`

Read the spec at `docs/superpowers/specs/2026-04-12-symphony-phase-1-3-workflows-design.md` §3 for complete details of each workflow.

- [ ] **Step 1: Create brainstorm workflow (ensemble mode)**

Create `_symphony/lifecycle/workflows/1-analysis/brainstorm/` with 4 files:

**workflow.yaml:**
```yaml
id: brainstorm
owner: product-manager
model: opus
description: Multi-agent brainstorming roundtable to explore the idea space

execution:
  mode: ensemble
  wave_eligible: false
  max_wave_siblings: 0
  ensemble_participants: [product-manager, architect, research-analyst]
  ensemble_turn_policy: round-robin
  max_turns: 12

inputs:
  required: []
  optional: []

outputs:
  primary: docs/planning-artifacts/brainstorm-transcript.md
  traceable_to: []

gates:
  pre_start: []
  post_complete:
    - Transcript has at least 3 participant contributions

disciplines:
  self_critique: true
  anti_rationalization: true
  trust_levels: true
```

**instructions.xml:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<instructions workflow="brainstorm">
  <setup>
    <action>If any research artifacts exist in docs/planning-artifacts/ (market-research.md, domain-research.md, tech-research.md), load them as context for the discussion.</action>
  </setup>

  <topic>
    Explore the user's idea from multiple perspectives. The Product Manager drives the conversation toward actionable requirements. The Architect evaluates technical feasibility and flags risks. The Research Analyst identifies unknowns and suggests areas for investigation. Goal: converge on a shared understanding of what to build, for whom, and why.
  </topic>

  <synthesis>
    <action>Extract from the transcript: (1) Key decisions made, (2) Open questions remaining, (3) Recommended next steps (typically market-research or product-brief).</action>
    <template-output file="docs/planning-artifacts/brainstorm-transcript.md">
      Apply the template from template.md. Include the full transcript followed by the synthesis section.
    </template-output>
  </synthesis>
</instructions>
```

**checklist.md:**
```markdown
# brainstorm Checklist
## Pre-start
- (none — brainstorm can start from scratch)
## Post-complete
- [ ] Transcript has at least 3 participant contributions
- [ ] Synthesis section has Key Decisions, Open Questions, Next Steps
```

**template.md:**
```markdown
# Brainstorm Transcript

**Date:** {{date}}
**Participants:** {{participants}}
**Topic:** {{topic}}

---

## Discussion

{{transcript}}

---

## Synthesis

### Key Decisions
{{decisions}}

### Open Questions
{{open_questions}}

### Recommended Next Steps
{{next_steps}}
```

- [ ] **Step 2: Create the remaining 5 analysis workflows**

For each of these 5 workflows, create the directory with 4 files following the SAME pattern as brainstorm above. Use the spec §3.2-3.6 for the specific content (owner, inputs, outputs, gates, steps, template sections):

- `market-research/` — owner: research-analyst, sequential, 5 steps, template sections: Market Overview, Competitors, Opportunities, Risks
- `domain-research/` — owner: research-analyst, sequential, 5 steps, template sections: Domain Model, Terminology, Standards, Regulations
- `tech-research/` — owner: research-analyst, sequential, 5 steps, template sections: Technology Options, Evaluation Criteria, Recommendation
- `advanced-elicitation/` — owner: research-analyst, sequential, requires product-brief, 5 steps, template sections: Stakeholder Needs, Assumptions, Constraints, Dependencies
- `product-brief/` — owner: product-manager, sequential, 7 steps, template sections: Vision, Goals, Target Users, Key Features, Success Metrics, Constraints

Each workflow.yaml must have: id, owner, model: opus, execution.mode: sequential, inputs, outputs (primary: docs/planning-artifacts/{name}.md), gates, disciplines (all true).

Each instructions.xml must have: numbered `<step>` elements matching the step count in the spec, final step has `<template-output>`.

Each checklist.md must have: Pre-start (required inputs exist) and Post-complete (output has required sections) sections.

Each template.md must have: title, date placeholder, and the section headings listed in the spec.

- [ ] **Step 3: Run Phase 1 tests**

Run: `npx vitest run tests/workflows-p1p3.test.js -t "1-analysis"`
Expected: All 6 analysis workflow tests PASS

- [ ] **Step 4: Commit**

```bash
git add _symphony/lifecycle/workflows/1-analysis/
git commit -m "feat(workflows): add 6 Phase 1 Analysis workflows — brainstorm, research, product-brief (Spec 5b)"
```

---

### Task 3: Phase 2 — Planning Workflows (5 workflows)

**Files:** Create 20 files across 5 directories in `_symphony/lifecycle/workflows/2-planning/`

Read spec §4 for complete details.

- [ ] **Step 1: Create all 5 planning workflows**

For each workflow, create the directory with 4 files (or 3 if no template):

- `create-prd/` — owner: product-manager, requires product-brief, outputs prd.md traceable to product-brief, 6 steps, template sections: Requirements (FR-xxx), NFRs (NFR-xxx), Acceptance Criteria, In Scope, Out of Scope
- `validate-prd/` — owner: validator, requires prd + product-brief, NO template.md (inline report), 5 steps (check completeness, traceability, testability), gates: on_pass/on_fail
- `edit-prd/` — owner: product-manager, requires prd + validation feedback, NO template.md (edits existing), 4 steps
- `create-ux/` — owner: ux-designer, requires prd, outputs ux-spec.md traceable to prd, 6 steps, template sections: User Flows, Wireframes, Interaction Patterns, Responsive Behavior
- `review-a11y/` — owner: test-architect, requires ux-spec, outputs a11y-review.md, 5 steps, template sections: WCAG Compliance, Issues Found, Recommendations

validate-prd and edit-prd do NOT get template.md files. All others do.

Each workflow.yaml: id, owner, model: opus, execution.mode: sequential, inputs (required/optional per spec), outputs (primary path, traceable_to), gates, disciplines.

Each instructions.xml: numbered steps per spec, template-output in final step.

Each checklist.md: pre-start (inputs exist) and post-complete (output has sections, self-critique >= 0.85).

- [ ] **Step 2: Run Phase 2 tests**

Run: `npx vitest run tests/workflows-p1p3.test.js -t "2-planning"`
Expected: All 5 planning workflow tests PASS

- [ ] **Step 3: Commit**

```bash
git add _symphony/lifecycle/workflows/2-planning/
git commit -m "feat(workflows): add 5 Phase 2 Planning workflows — PRD, UX, accessibility (Spec 5b)"
```

---

### Task 4: Phase 3 — Solutioning Workflows (10 workflows)

**Files:** Create 40 files across 10 directories in `_symphony/lifecycle/workflows/3-solutioning/`

Read spec §5 for complete details.

- [ ] **Step 1: Create all 10 solutioning workflows**

For each workflow, create the directory with 4 files (or 3 if no template):

- `create-arch/` — owner: architect, requires prd, outputs architecture.md, 8 steps, template sections: System Overview, Component Design, API Contracts, Data Model, Technology Stack, ADRs
- `edit-arch/` — owner: architect, requires architecture.md, NO template.md, 5 steps
- `test-design/` — owner: test-architect, requires architecture, outputs test-plan.md, 6 steps, template sections: Strategy, Test Pyramid, Coverage Goals, Framework Selection, CI Integration
- `create-epics/` — owner: product-manager, requires architecture + prd, outputs epics.md, 5 steps, template sections: Epic list with title, description, acceptance criteria, traceability
- `atdd/` — owner: test-architect, requires epics, outputs acceptance-tests.md, 4 steps, template sections: Given/When/Then scenarios per epic
- `threat-model/` — owner: security-agent, requires architecture, outputs threat-model.md, 6 steps, template sections: Attack Surface, STRIDE Analysis, Mitigations, Residual Risks
- `infra-design/` — owner: devops-agent, requires architecture, outputs infra-design.md, 7 steps, template sections: Hosting, CI/CD, Scaling, Monitoring, Cost Estimate
- `trace/` — owner: test-architect, requires prd + architecture + epics, outputs traceability-matrix.md, 5 steps, template: requirement-to-epic-to-test matrix
- `readiness-check/` — owner: validator, requires all planning artifacts, outputs readiness-report.md, 6 steps, gates: on_pass (all ready) / on_fail (gaps found)
- `overture/` — owner: validator, mode: parallel-waves, requires source code, outputs overture-report.md, 6 DAG steps (4 parallel in Wave 1, 1 in Wave 2, 1 synthesis in Wave 3), instructions.xml uses `inputs`/`outputs` attributes on steps

edit-arch does NOT get template.md. All others do.

IMPORTANT for overture: execution.mode must be `parallel-waves`. instructions.xml steps must have `id`, `inputs`, and `outputs` attributes for DAG building (same pattern as the wave-hello fixture).

- [ ] **Step 2: Run Phase 3 tests**

Run: `npx vitest run tests/workflows-p1p3.test.js -t "3-solutioning"`
Expected: All 10 solutioning workflow tests PASS

- [ ] **Step 3: Run full test suite**

Run: `npx vitest run`
Expected: ALL tests pass across all files, 0 failures

- [ ] **Step 4: Commit**

```bash
git add _symphony/lifecycle/workflows/3-solutioning/
git commit -m "feat(workflows): add 10 Phase 3 Solutioning workflows — architecture, security, infra, overture (Spec 5b)"
```

---

## Self-Review

**Spec coverage:**
- §3.1-3.6 Phase 1 (6 workflows) → Task 2 ✓
- §4.1-4.5 Phase 2 (5 workflows) → Task 3 ✓
- §5.1-5.10 Phase 3 (10 workflows) → Task 4 ✓
- §6 Testing → Task 1 ✓
- Ensemble mode (brainstorm) → Task 2 step 1 ✓
- Parallel-waves mode (overture) → Task 4 step 1 ✓
- Validation workflows with on_pass/on_fail → Task 3 (validate-prd), Task 4 (readiness-check) ✓

**Placeholder scan:** No TBD/TODO. Each task references the spec for content details.

**Type consistency:** Workflow IDs match lifecycle-sequence.yaml, agent IDs match Spec 5a roster, output paths consistently use `docs/planning-artifacts/`.
