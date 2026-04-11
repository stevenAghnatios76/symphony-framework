# Conductor (Spec 3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the conductor.xml stub with a runtime behavioral directive that parses user goals, detects project phase, routes to workflows with confidence scoring, and learns from corrections — Symphony's signature feature #1.

**Architecture:** The Conductor is an XML behavioral directive (~130 lines) the AI reads and follows. It uses advisory keyword patterns + AI judgment for intent parsing, evaluates 9 phase detection rules in order, computes a 3-component confidence score, and writes routing decisions to a sidecar. A companion lifecycle-sequence.yaml (~200 lines) maps workflow-to-workflow transitions for next-step suggestions.

**Tech Stack:** XML (behavioral directives), YAML (lifecycle sequence config), Vitest + fast-xml-parser + yaml (tests)

---

## File Structure

| Action | File | Responsibility |
|---|---|---|
| Modify | `_symphony/core/engine/conductor.xml` | Smart orchestrator: goal parsing, phase detection, routing, confidence, dispatch |
| Create | `_symphony/_config/lifecycle-sequence.yaml` | Workflow sequencing: next-step suggestions, on_pass/on_fail branching |
| Create | `tests/conductor.test.js` | Structural + content tests for conductor and lifecycle sequence |

---

### Task 1: Conductor Test File + Runtime XML

**Files:**
- Create: `tests/conductor.test.js`
- Modify: `_symphony/core/engine/conductor.xml`

- [ ] **Step 1: Write the failing test**

Create `tests/conductor.test.js`:

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/conductor.test.js`
Expected: FAIL on "has status runtime" (current file has `<status>stub</status>`)

- [ ] **Step 3: Replace conductor.xml stub with runtime content**

Replace the entire contents of `_symphony/core/engine/conductor.xml` with:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!--
  Symphony Conductor — smart orchestrator (Signature Feature #1)
  See architecture spec §8.1
  See Spec 3: docs/superpowers/specs/2026-04-10-symphony-conductor-design.md
-->
<conductor version="0.0.2-alpha.1">
  <status>runtime</status>
  <spec-reference>docs/superpowers/specs/2026-04-10-symphony-conductor-design.md</spec-reference>

  <mandates>
    <mandate>The Conductor never executes workflow steps itself. It routes and dispatches.</mandate>
    <mandate>Phase detection rules are evaluated in the exact order listed. First match wins.</mandate>
    <mandate>The Conductor's sidecar is privileged — it persists across sessions and accumulates routing intelligence.</mandate>
    <mandate>YOLO interaction mode is passed through to the workflow engine, not consumed by the Conductor.</mandate>
    <mandate>The Conductor presents routing decisions transparently. No silent routing.</mandate>
    <mandate>User can always override by naming a specific workflow.</mandate>
  </mandates>

  <advisory-patterns description="Keyword hints for intent extraction. Advisory — AI applies judgment for ambiguous cases.">
    <pattern intent="diagnose" keywords="fix, debug, error, trace, stack, broken, crash" routes-to="diagnose-then-fix path"/>
    <pattern intent="overture" keywords="onboard, scan, analyze, discover, explore" routes-to="Overture workflow"/>
    <pattern intent="quick" keywords="small, quick, hotfix, tweak, minor, patch" routes-to="quick-spec then quick-dev"/>
    <pattern intent="create" keywords="create, build, write, design, draft, new" routes-to="phase-appropriate create workflow"/>
    <pattern intent="edit" keywords="edit, update, revise, modify, change" routes-to="phase-appropriate edit workflow"/>
    <pattern intent="review" keywords="review, check, validate, verify, audit" routes-to="phase-appropriate review workflow"/>
    <pattern intent="plan" keywords="plan, sprint, schedule, prioritize" routes-to="sprint or phase planning"/>
    <pattern intent="deploy" keywords="deploy, release, ship, publish, launch" routes-to="Phase 5 deployment workflows"/>
    <pattern intent="brainstorm" keywords="brainstorm, ideate, explore ideas, discuss" routes-to="brainstorm workflow (ensemble)"/>
    <pattern intent="status" keywords="status, progress, where, what's next" routes-to="sprint/epic status or phase summary"/>
  </advisory-patterns>

  <flow>
    <step n="1" title="Receive user goal">
      <action>Receive the user's natural-language goal from the /symphony command invocation.</action>
      <action>If the user named a specific workflow (e.g., "/symphony-dev-story"), skip to step 6 with that workflow. Confidence = 1.0 (user-explicit).</action>
    </step>

    <step n="2" title="Parse intent">
      <action>Extract from the user's goal: intent verb, target noun, scope hint.</action>
      <action>Use the advisory-patterns above as guidance. Match the goal's language against pattern keywords.</action>
      <action>If multiple patterns match, prefer the more specific one. If ambiguous, note both candidates for the confidence gate.</action>
      <action>Record: parsed_intent = {verb, noun, scope}.</action>
    </step>

    <step n="3" title="Detect phase">
      <action>Evaluate the following 9 rules in order. First match wins.</action>

      <rule n="1" trigger="Intent matches diagnose pattern (fix/debug/error/trace/stack)">
        Route to diagnose-then-fix path. Skip remaining rules. This bypasses phase detection.
      </rule>

      <rule n="2" trigger="Intent matches overture pattern (onboard/scan/analyze/discover)">
        Route to Overture workflow. Entry mode: existing codebase.
      </rule>

      <rule n="3" trigger="Source code exists at project_path AND no Symphony planning artifacts exist (no docs/planning-artifacts/, no docs/implementation-artifacts/)">
        Route to Overture path (auto-detected). This prevents users with existing codebases from being dumped into Phase 1. User can override at confidence gate.
      </rule>

      <rule n="4" trigger="Intent matches quick pattern AND approved architecture exists (docs/planning-artifacts/architecture.md)">
        Route to quick path: quick-spec followed by quick-dev.
      </rule>

      <rule n="5" trigger="No product-brief exists (no docs/planning-artifacts/product-brief.md)">
        Detected phase: 1-analysis. Greenfield entry.
      </rule>

      <rule n="6" trigger="Product-brief exists but no PRD (no docs/planning-artifacts/prd.md)">
        Detected phase: 2-planning.
      </rule>

      <rule n="7" trigger="PRD exists but no architecture (no docs/planning-artifacts/architecture.md)">
        Detected phase: 3-solutioning.
      </rule>

      <rule n="8" trigger="Architecture exists AND sprint is active (docs/implementation-artifacts/sprint-status.md exists with status: active)">
        Detected phase: 4-implementation.
      </rule>

      <rule n="9" trigger="All stories have status done AND no release shipped (no docs/implementation-artifacts/release-plan.md or status: pending)">
        Detected phase: 5-deployment.
      </rule>

      <rule n="fallback" trigger="Cannot determine phase from artifacts">
        Present all 5 phases to the user. Ask which to enter. Wait for response.
      </rule>
    </step>

    <step n="4" title="Classify complexity">
      <action>Based on the parsed intent, scope hint, and artifact count, classify the task:</action>
      <action>simple — single file, well-known pattern, quick keywords, small scope. Suggest quick path if architecture exists.</action>
      <action>medium — multiple files, moderate scope, some unknowns. Standard workflow.</action>
      <action>complex — multiple systems, unfamiliar domain, security-critical, high integration risk. Full workflow, consider parallel-waves.</action>
      <action>Classification is advisory — it informs routing but the user confirms via confidence gate.</action>
    </step>

    <step n="5" title="Select workflow">
      <action>Based on parsed intent + detected phase + complexity, select the most appropriate workflow id.</action>
      <action>Consult _symphony/_config/lifecycle-sequence.yaml to validate the workflow exists and belongs to the detected phase.</action>
      <action>If the intent clearly maps to a workflow (e.g., "create the PRD" + phase 2 = create-prd): select it.</action>
      <action>If ambiguous: identify top-2 candidate workflows with reasons for each.</action>
    </step>

    <step n="6" title="Score confidence">
      <action>Compute 3-component confidence score (0.0–1.0):</action>

      <component name="intent_match" range="0.0-0.4">
        Exact advisory pattern match = 0.35–0.40.
        Semantic match but no exact pattern = 0.20–0.30.
        Ambiguous or vague goal = 0.05–0.15.
      </component>

      <component name="project_state_clarity" range="0.0-0.3">
        Single phase detection rule matched cleanly = 0.25–0.30.
        Two possible phases from artifact state = 0.15–0.20.
        Messy or contradictory artifact state = 0.05–0.10.
      </component>

      <component name="prior_routing_memory" range="0.0-0.3">
        Scan _symphony/_memory/conductor-sidecar/routing-log.yaml for similar prior goals.
        Exact prior goal with no user correction = 0.25–0.30.
        Similar prior goal = 0.15–0.20.
        No prior history = 0.10 (neutral — do not penalize first use).
      </component>

      <action>Sum the three components. Record as confidence score.</action>
    </step>

    <step n="7" title="Confidence gate">
      <action>Read the auto-dispatch threshold from global.yaml: conductor.auto_dispatch_confidence (default 0.80).</action>

      <branch if="confidence >= threshold">
        <action>Auto-dispatch. Report to user: "Routing to /symphony-{workflow} (confidence: {score})"</action>
      </branch>

      <branch if="confidence &lt; threshold">
        <action>Present top-2 candidate workflows to user with scores and reasoning.</action>
        <action>Format: "I'm considering two options: (1) /symphony-{wf1} ({score1}) — {reason1}. (2) /symphony-{wf2} ({score2}) — {reason2}. Which one, or tell me more?"</action>
        <action>Wait for user response. Accept: a number (1 or 2), a specific workflow name, or additional context to re-evaluate.</action>
        <action>If user provides more context: re-run from step 2 with the enriched goal.</action>
      </branch>

      <branch if="user explicitly names a workflow at any point">
        <action>Use the user's explicit choice. Set confidence = 1.0 (user-explicit). Skip to step 8.</action>
      </branch>
    </step>

    <step n="8" title="Dispatch">
      <action>Read the selected workflow's workflow.yaml to determine execution.mode.</action>

      <branch if="execution.mode == 'sequential' or execution.mode == 'ensemble'">
        <action>Invoke the workflow engine with: workflow_path = _symphony/lifecycle/workflows/{phase}/{workflow-id}/, interaction_mode (from user or default 'normal'), checkpoint_path = _symphony/_memory/checkpoints/{run-id}.yaml</action>
      </branch>

      <branch if="execution.mode == 'parallel-waves'">
        <action>Invoke the wave executor. (Currently HALTs with "parallel-waves not yet implemented; Spec 4 required.")</action>
      </branch>

      <branch if="workflow directory not found">
        <action>Report: "Workflow {workflow-id} is defined in the lifecycle sequence but its content has not been created yet (Spec 5). Available workflows: {list of directories that exist}."</action>
      </branch>
    </step>

    <step n="9" title="Write routing memory">
      <action>Append to _symphony/_memory/conductor-sidecar/routing-log.yaml:</action>
      <action>Record: timestamp, user_goal, parsed_intent (verb/noun/scope), detected_phase, complexity, selected_workflow, confidence, confidence_breakdown (intent_match/project_state_clarity/prior_routing_memory), auto_dispatched, user_correction (null if no override, the override value if user corrected).</action>
    </step>

    <step n="10" title="Post-workflow next-step suggestion">
      <action>After the dispatched workflow completes, read _symphony/_config/lifecycle-sequence.yaml.</action>
      <action>Look up the completed workflow's entry. Read its next field.</action>
      <action>If next.primary exists: suggest it. "Next recommended step: /symphony-{primary}."</action>
      <action>If next.alternatives exist: list them. "Alternatives: /symphony-{alt} — {context}."</action>
      <action>If next.on_pass/on_fail exist: suggest based on the workflow's outcome.</action>
      <action>If next.terminal is true: report "Lifecycle complete."</action>
      <action>If next.standalone is true: report "No specific next step. You can continue with any command."</action>
    </step>
  </flow>

  <memory-sidecar path="_symphony/_memory/conductor-sidecar/"/>
</conductor>
```

- [ ] **Step 4: Run test to verify conductor tests pass**

Run: `npx vitest run tests/conductor.test.js -t "Conductor runtime"`
Expected: All conductor tests PASS

- [ ] **Step 5: Commit**

```bash
git add _symphony/core/engine/conductor.xml tests/conductor.test.js
git commit -m "feat(engine): implement conductor runtime with goal parsing, phase detection, confidence scoring (Spec 3)"
```

---

### Task 2: Lifecycle Sequence Configuration

**Files:**
- Create: `_symphony/_config/lifecycle-sequence.yaml`

- [ ] **Step 1: Create lifecycle-sequence.yaml**

Create `_symphony/_config/lifecycle-sequence.yaml`:

```yaml
# Symphony Lifecycle Sequence — workflow-to-workflow transition map
# Consulted by the Conductor (step 10) after workflow completion.
# See Spec 3: docs/superpowers/specs/2026-04-10-symphony-conductor-design.md §3

# ═══════════════════════════════════════
# PHASE 1: ANALYSIS
# ═══════════════════════════════════════

brainstorm:
  phase: 1-analysis
  command: /symphony-brainstorm
  next:
    primary: market-research
    alternatives:
      - workflow: domain-research
        context: "If domain-specific research is needed first"
      - workflow: tech-research
        context: "If technology evaluation is needed first"

market-research:
  phase: 1-analysis
  command: /symphony-market-research
  next:
    primary: domain-research
    alternatives:
      - workflow: product-brief
        context: "If all research is complete"

domain-research:
  phase: 1-analysis
  command: /symphony-domain-research
  next:
    primary: tech-research
    alternatives:
      - workflow: product-brief
        context: "If all research is complete"

tech-research:
  phase: 1-analysis
  command: /symphony-tech-research
  next:
    primary: advanced-elicitation
    alternatives:
      - workflow: product-brief
        context: "If skipping advanced elicitation"

advanced-elicitation:
  phase: 1-analysis
  command: /symphony-advanced-elicitation
  next:
    primary: product-brief

product-brief:
  phase: 1-analysis
  command: /symphony-product-brief
  next:
    primary: create-prd

# ═══════════════════════════════════════
# PHASE 2: PLANNING
# ═══════════════════════════════════════

create-prd:
  phase: 2-planning
  command: /symphony-create-prd
  next:
    primary: validate-prd

validate-prd:
  phase: 2-planning
  command: /symphony-validate-prd
  next:
    on_pass: create-ux
    on_fail: edit-prd

edit-prd:
  phase: 2-planning
  command: /symphony-edit-prd
  next:
    primary: validate-prd

create-ux:
  phase: 2-planning
  command: /symphony-create-ux
  next:
    primary: review-a11y
    alternatives:
      - workflow: create-arch
        context: "If accessibility review will be done later"

review-a11y:
  phase: 2-planning
  command: /symphony-review-a11y
  next:
    primary: create-arch

# ═══════════════════════════════════════
# PHASE 3: SOLUTIONING
# ═══════════════════════════════════════

create-arch:
  phase: 3-solutioning
  command: /symphony-create-arch
  next:
    primary: test-design
    alternatives:
      - workflow: threat-model
        context: "If threat modeling should come first"

edit-arch:
  phase: 3-solutioning
  command: /symphony-edit-arch
  next:
    primary: readiness-check

test-design:
  phase: 3-solutioning
  command: /symphony-test-design
  next:
    primary: create-epics

create-epics:
  phase: 3-solutioning
  command: /symphony-create-epics
  next:
    primary: atdd
    alternatives:
      - workflow: threat-model
        context: "If threat modeling not yet done"

atdd:
  phase: 3-solutioning
  command: /symphony-atdd
  next:
    primary: threat-model
    alternatives:
      - workflow: trace
        context: "If threat model and infra design already done"

threat-model:
  phase: 3-solutioning
  command: /symphony-threat-model
  next:
    primary: infra-design

infra-design:
  phase: 3-solutioning
  command: /symphony-infra-design
  next:
    primary: trace

trace:
  phase: 3-solutioning
  command: /symphony-trace
  next:
    primary: readiness-check

readiness-check:
  phase: 3-solutioning
  command: /symphony-readiness-check
  next:
    primary: create-story

# ═══════════════════════════════════════
# PHASE 4: IMPLEMENTATION
# ═══════════════════════════════════════

create-story:
  phase: 4-implementation
  command: /symphony-create-story
  next:
    primary: validate-story

validate-story:
  phase: 4-implementation
  command: /symphony-validate-story
  next:
    on_pass: sprint-plan
    on_fail: create-story
    alternatives:
      - workflow: create-story
        context: "To create more stories before sprint planning"

sprint-plan:
  phase: 4-implementation
  command: /symphony-sprint-plan
  next:
    primary: dev-story

dev-story:
  phase: 4-implementation
  command: /symphony-dev-story
  next:
    primary: check-dod
    alternatives:
      - workflow: run-all-reviews
        context: "If DoD was already verified"

check-dod:
  phase: 4-implementation
  command: /symphony-check-dod
  next:
    on_pass: run-all-reviews
    on_fail: dev-story

code-review:
  phase: 4-implementation
  command: /symphony-code-review
  next:
    primary: run-all-reviews
    alternatives:
      - workflow: dev-story
        context: "If review found issues requiring code changes"

qa-tests:
  phase: 4-implementation
  command: /symphony-qa-tests
  next:
    primary: run-all-reviews

security-review:
  phase: 4-implementation
  command: /symphony-security-review
  next:
    primary: run-all-reviews

run-all-reviews:
  phase: 4-implementation
  command: /symphony-run-all-reviews
  next:
    primary: review-gate

review-gate:
  phase: 4-implementation
  command: /symphony-review-gate
  next:
    on_pass: sprint-status
    on_fail: dev-story

sprint-status:
  phase: 4-implementation
  command: /symphony-sprint-status
  next:
    context_dependent: true
    note: "If stories remain: dev-story. If all done: retro."

retro:
  phase: 4-implementation
  command: /symphony-retro
  next:
    primary: sprint-plan
    alternatives:
      - workflow: release-plan
        context: "If all epics complete, ready for deployment"

change-request:
  phase: 4-implementation
  command: /symphony-change-request
  next:
    primary: correct-course
    alternatives:
      - workflow: edit-arch
        context: "If architecture changes needed"

correct-course:
  phase: 4-implementation
  command: /symphony-correct-course
  next:
    primary: sprint-status

# ═══════════════════════════════════════
# PHASE 5: DEPLOYMENT
# ═══════════════════════════════════════

release-plan:
  phase: 5-deployment
  command: /symphony-release-plan
  next:
    primary: rollback-plan

rollback-plan:
  phase: 5-deployment
  command: /symphony-rollback-plan
  next:
    primary: deploy-checklist

deploy-checklist:
  phase: 5-deployment
  command: /symphony-deploy-checklist
  next:
    primary: post-deploy

post-deploy:
  phase: 5-deployment
  command: /symphony-post-deploy
  next:
    terminal: true
    note: "Lifecycle complete. Start new cycle with /symphony-retro."

# ═══════════════════════════════════════
# OVERTURE (brownfield entry)
# ═══════════════════════════════════════

overture:
  phase: 3-solutioning
  command: /symphony-overture
  next:
    primary: create-arch
    alternatives:
      - workflow: test-design
        context: "If architecture was generated by Overture scan"

# ═══════════════════════════════════════
# ANYTIME (no lifecycle position)
# ═══════════════════════════════════════

quick-spec:
  phase: anytime
  command: /symphony-quick-spec
  next:
    primary: quick-dev

quick-dev:
  phase: anytime
  command: /symphony-quick-dev
  next:
    primary: code-review

memory-hygiene:
  phase: anytime
  command: /symphony-memory-hygiene
  next:
    standalone: true

document-project:
  phase: anytime
  command: /symphony-document-project
  next:
    standalone: true

performance-review:
  phase: anytime
  command: /symphony-performance-review
  next:
    standalone: true

tech-debt-review:
  phase: anytime
  command: /symphony-tech-debt-review
  next:
    standalone: true

party:
  phase: anytime
  command: /symphony-party
  next:
    standalone: true

create-stakeholder:
  phase: anytime
  command: /symphony-create-stakeholder
  next:
    standalone: true
```

- [ ] **Step 2: Run lifecycle sequence tests**

Run: `npx vitest run tests/conductor.test.js -t "Lifecycle sequence"`
Expected: All 6 lifecycle sequence tests PASS

- [ ] **Step 3: Run full test suite**

Run: `npx vitest run`
Expected: ALL tests pass (structure, engine, cli, gate-enforcer, protocols, memory-schemas, conductor)

- [ ] **Step 4: Commit**

```bash
git add _symphony/_config/lifecycle-sequence.yaml
git commit -m "feat(config): add lifecycle-sequence.yaml with workflow transitions and next-step suggestions (Spec 3)"
```

---

### Task 3: Full Suite Verification

**Files:** None — verification only

- [ ] **Step 1: Run full test suite**

Run: `npx vitest run`
Expected: 7 test files, all tests pass, 0 failures

- [ ] **Step 2: Verify git log shows clean Spec 3 commits**

Run: `git log --oneline -5`
Expected: Two Spec 3 commits on top

---

## Self-Review

**Spec coverage:**
- §2.1 Responsibilities → Task 1 step 3 (all 8 in the flow) ✓
- §2.2 Advisory patterns → Task 1 step 3 `<advisory-patterns>` block ✓
- §2.3 Phase detection → Task 1 step 3, step n="3" with 9 rules ✓
- §2.4 Complexity classification → Task 1 step 3, step n="4" ✓
- §2.5 Confidence scoring → Task 1 step 3, step n="6" with 3 components ✓
- §2.6 Dispatch → Task 1 step 3, step n="8" ✓
- §2.7 Routing memory → Task 1 step 3, step n="9" ✓
- §2.8 Next-step suggestions → Task 1 step 3, step n="10" ✓
- §2.9 Mandates → Task 1 step 3 `<mandates>` block ✓
- §3 Lifecycle sequence → Task 2 (complete YAML) ✓

**Placeholder scan:** No TBD, TODO, or vague instructions found.

**Type consistency:** workflow ids in lifecycle-sequence.yaml match the workflow ids referenced in conductor.xml advisory patterns and phase detection rules. Confidence field names (intent_match, project_state_clarity, prior_routing_memory) are consistent between the conductor flow and test assertions.
