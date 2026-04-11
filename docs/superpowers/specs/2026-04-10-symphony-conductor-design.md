# Symphony Conductor — Design Spec (Spec 3)

> **Spec:** 3 of 8 (Conductor)
> **Status:** Draft — awaiting user review
> **Date:** 2026-04-10
> **Depends on:** Spec 1 (Architecture §8.1), Spec 2a (Workflow Engine), Spec 2b (Protocols)
> **Scope:** Concrete runtime XML for the Conductor (smart orchestrator) and the lifecycle-sequence.yaml configuration. Does NOT cover the Wave Executor (Spec 4), agents (Spec 5), or workflow content (Spec 5).

---

## 1. Overview

The Conductor is Symphony's signature feature #1 — the smart orchestrator that is the entry point for every `/symphony*` command. The user describes a goal in natural language; the Conductor figures out the phase, picks the right workflow, and dispatches it.

This spec provides:
- **conductor.xml** — runtime XML behavioral directives with 8-step flow
- **lifecycle-sequence.yaml** — workflow sequencing with next-step suggestions, branching, and alternatives

The Conductor uses advisory pattern-matching hints combined with AI judgment for intent parsing. It does not use rigid regex or formal grammars.

---

## 2. Conductor Runtime

**File:** `_symphony/core/engine/conductor.xml`

### 2.1 Responsibilities

1. **Goal parsing** — extract intent verb, target noun, and scope hint from natural-language input using advisory keyword patterns
2. **Phase detection** — evaluate 9 rules in order against current project artifact state
3. **Complexity classification** — classify task as simple/medium/complex based on scope and artifact count
4. **Routing decision** — match intent + phase to a workflow id
5. **Confidence scoring** — 3-component score: intent match + project state clarity + prior routing memory
6. **Confidence gating** — if score ≥ 0.80, auto-dispatch; if < 0.80, present top-2 options to user
7. **Dispatch** — hand off to workflow-engine (sequential/ensemble) or wave-executor (parallel-waves)
8. **Routing memory** — write every decision to `_memory/conductor-sidecar/routing-log.yaml`, learn from user corrections

### 2.2 Advisory Pattern Hints

The Conductor uses keyword patterns as guidance for intent extraction. These are advisory — the AI applies its own judgment for ambiguous or novel goals.

| Pattern Keywords | Intent | Routes To |
|---|---|---|
| fix, debug, error, trace, stack, broken, crash | diagnose | diagnose-then-fix path (bypass phase detection) |
| onboard, scan, analyze, discover, explore | overture | Overture workflow (existing codebase entry) |
| small, quick, hotfix, tweak, minor, patch | quick | quick-spec → quick-dev (fast path) |
| create, build, write, design, draft, new | create | Phase-appropriate create workflow |
| edit, update, revise, modify, change | edit | Phase-appropriate edit workflow |
| review, check, validate, verify, audit | review | Phase-appropriate review workflow |
| plan, sprint, schedule, prioritize | plan | Sprint planning or phase planning |
| deploy, release, ship, publish, launch | deploy | Phase 5 deployment workflows |
| brainstorm, ideate, explore ideas, discuss | brainstorm | Brainstorm workflow (ensemble mode) |
| status, progress, where, what's next | status | Sprint/epic status or phase summary |

### 2.3 Phase Detection Rules

Evaluated in order. First match wins.

```
Rule 1: Intent matches "diagnose" pattern (fix/debug/error/trace/stack)
         → diagnose-then-fix path. Skip phase detection.

Rule 2: Intent matches "overture" pattern (onboard/scan/analyze/discover)
         → Overture workflow. Entry mode: existing codebase.

Rule 3: Project has source code AND no Symphony planning artifacts exist
         (no docs/planning-artifacts/, no docs/implementation-artifacts/)
         → Overture path (auto-detected). Most first invocations in existing repos.

Rule 4: Intent matches "quick" pattern AND approved architecture exists
         (docs/planning-artifacts/architecture.md or equivalent)
         → Quick path: quick-spec → quick-dev.

Rule 5: No product-brief exists (no docs/planning-artifacts/product-brief.md)
         → Phase 1 (Analysis). Greenfield entry.

Rule 6: Product-brief exists but no PRD
         (no docs/planning-artifacts/prd.md)
         → Phase 2 (Planning).

Rule 7: PRD exists but no architecture
         (no docs/planning-artifacts/architecture.md)
         → Phase 3 (Solutioning).

Rule 8: Architecture exists AND sprint is active
         (docs/implementation-artifacts/sprint-status.md exists with status: active)
         → Phase 4 (Implementation).

Rule 9: All stories have status "done" AND no release shipped
         (docs/implementation-artifacts/release-plan.md does not exist or has status: pending)
         → Phase 5 (Deployment).

Fallback: Cannot determine phase from artifacts.
          → Present all 5 phases to user. Ask which to enter.
```

**Overture auto-detection note (Rule 3):** This prevents users from being dumped into Phase 1 for existing codebases. If the user actually wants greenfield-in-an-existing-repo, they can override at the confidence gate.

### 2.4 Complexity Classification

After phase detection, classify the task:

| Complexity | Signals | Effect |
|---|---|---|
| **Simple** | Single file, well-known pattern, "quick" keywords, small scope | Suggest quick path if architecture exists. Minimal research. |
| **Medium** | Multiple files, moderate scope, some unknowns | Standard workflow. Default research depth. |
| **Complex** | Multiple systems, unfamiliar domain, security-critical, high integration risk, "full" keywords | Full workflow with extended research. Consider parallel-waves if available. |

Classification is advisory — the Conductor suggests, the user confirms (via the confidence gate if score < 0.80).

### 2.5 Confidence Scoring

Three components, summing to 0.0–1.0:

| Component | Range | Assessment |
|---|---|---|
| **Intent match** | 0.0–0.4 | Exact pattern match = 0.35–0.40. Semantic match, no pattern = 0.20–0.30. Ambiguous/vague = 0.05–0.15. |
| **Project state clarity** | 0.0–0.3 | Single phase match from rules = 0.25–0.30. Two possible phases = 0.15–0.20. Messy/contradictory state = 0.05–0.10. |
| **Prior routing memory** | 0.0–0.3 | Exact prior goal with no user correction = 0.25–0.30. Similar prior = 0.15–0.20. No prior history = 0.10 (neutral). |

**Confidence gate behavior:**

- Score ≥ 0.80: auto-dispatch. Report: "Routing to /symphony-{workflow} (confidence: {score})"
- Score < 0.80: present top-2 candidates. Report: "I'm considering two options: (1) /symphony-{wf1} ({score1}) — {reason}, (2) /symphony-{wf2} ({score2}) — {reason}. Which one, or tell me more?"
- User can always override by naming a specific workflow.

### 2.6 Dispatch

After routing decision (auto or user-confirmed):

1. Read the selected workflow's `workflow.yaml` to get `execution.mode`
2. If `sequential` or `ensemble`: invoke workflow-engine with `workflow_path`, `interaction_mode`, `checkpoint_path`
3. If `parallel-waves`: invoke wave-executor (Spec 4 — currently HALTs with "not yet implemented")
4. If workflow not found: report error, suggest alternatives

### 2.7 Routing Memory

After every dispatch, append to `_symphony/_memory/conductor-sidecar/routing-log.yaml`:

```yaml
- timestamp: "<ISO 8601>"
  user_goal: "<raw goal text>"
  parsed_intent:
    verb: "<intent verb>"
    noun: "<target noun>"
    scope: "<scope hint or null>"
  detected_phase: "<phase id>"
  complexity: "<simple|medium|complex>"
  selected_workflow: "<workflow id>"
  confidence: <float>
  confidence_breakdown:
    intent_match: <float>
    project_state_clarity: <float>
    prior_routing_memory: <float>
  auto_dispatched: <boolean>
  user_correction: <string or null>
```

On next invocation, the Conductor scans routing_history for similar prior goals (semantic similarity on user_goal field) to compute the prior_routing_memory component. User corrections are the learning signal — they indicate the Conductor made a wrong choice and should route differently for similar goals in the future.

### 2.8 Next-Step Suggestions

After a workflow completes, the Conductor reads `lifecycle-sequence.yaml` to suggest what the user should do next. This replaces manual "what command do I run next?" guesswork.

### 2.9 Mandates

- The Conductor never executes workflow steps itself. It routes and dispatches.
- Phase detection rules are evaluated in the exact order listed. First match wins.
- The Conductor's sidecar is privileged — it persists across sessions and accumulates routing intelligence.
- YOLO interaction mode is passed through to the workflow engine, not consumed by the Conductor.
- The Conductor presents routing decisions transparently. No silent routing.

---

## 3. Lifecycle Sequence Configuration

**File:** `_symphony/_config/lifecycle-sequence.yaml`

A YAML configuration that maps each workflow to its next-step suggestions. The Conductor reads this after workflow completion.

### 3.1 Entry format

```yaml
<workflow-id>:
  phase: <phase-id>
  command: /symphony-<workflow-id>
  next:
    primary: <workflow-id>           # default next step
    alternatives:                     # optional alternatives
      - workflow: <workflow-id>
        context: "<when to choose this instead>"
    on_pass: <workflow-id>           # for validation workflows
    on_fail: <workflow-id>           # for validation workflows
    standalone: true                 # for anytime workflows (no next step)
    terminal: true                   # for lifecycle-ending workflows
```

### 3.2 Complete sequence

```yaml
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

---

## 4. Testing Strategy

### 4.1 Conductor tests (`tests/conductor.test.js`)
- File exists and parses as valid XML
- `<status>` is `runtime`
- Has `<mandates>` block
- Has `<flow>` with ≥8 step elements
- Contains all 9 phase detection rules (keywords: "no product-brief", "no PRD", "no architecture", "sprint active", "all stories done")
- Contains confidence threshold 0.80
- Contains advisory pattern hints (at least: fix/debug, create/build, deploy/release)
- References routing memory sidecar path
- Contains complexity classification (simple/medium/complex)

### 4.2 Lifecycle sequence tests
- File exists and parses as valid YAML
- Has entries for key workflows: brainstorm, create-prd, create-arch, dev-story, release-plan
- Each entry has `phase` and `next` fields
- Validate-prd has `on_pass` and `on_fail` entries
- post-deploy has `terminal: true`

---

## 5. Files Summary

| Action | File | Lines |
|---|---|---|
| Modify | `_symphony/core/engine/conductor.xml` | ~130 |
| Create | `_symphony/_config/lifecycle-sequence.yaml` | ~200 |
| Create | `tests/conductor.test.js` | ~60 |

**Total: ~390 lines across 3 files**

---

## 6. Out of Scope

- Wave Executor runtime (Spec 4)
- Agent persona files (Spec 5)
- Workflow content files (Spec 5)
- Adapter implementations (Spec 7)
- The actual Overture workflow content (Spec 5 — this spec only defines how the Conductor routes to it)
