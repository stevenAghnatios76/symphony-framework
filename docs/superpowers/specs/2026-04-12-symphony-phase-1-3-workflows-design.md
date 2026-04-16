# Symphony Phase 1-3 Workflows — Design Spec (Spec 5b)

> **Spec:** 5b of 8 (Phase 1-3 Workflows)
> **Status:** Draft — awaiting user review
> **Date:** 2026-04-12
> **Depends on:** Spec 1 (Architecture §6.2), Spec 2a-2b (Engine + Protocols), Spec 3 (Conductor), Spec 5a (Agents)
> **Scope:** 21 workflow directories (4 files each) for Phase 1 Analysis, Phase 2 Planning, and Phase 3 Solutioning. Does NOT cover Phase 4-5 workflows (Spec 5c), anytime workflows (Spec 5d), or dev/creative/testing modules (Spec 6).

---

## 1. Overview

Each workflow is a directory under `_symphony/lifecycle/workflows/{phase}/` containing exactly 4 files per architecture spec §6.2:

- `workflow.yaml` — config: inputs, outputs, gates, execution mode, owner agent
- `instructions.xml` — step-by-step execution (3-8 steps, max 150 lines)
- `checklist.md` — pre-start and post-complete gate conditions
- `template.md` — output document template (optional for edit/validation workflows)

Output artifacts go to `docs/planning-artifacts/` for Phases 1-3.

---

## 2. Common Patterns

### 2.1 workflow.yaml schema (all workflows)

```yaml
id: <workflow-id>
owner: <agent-id from Spec 5a>
model: opus
description: <one-line description>

execution:
  mode: sequential          # or ensemble or parallel-waves
  wave_eligible: false
  max_wave_siblings: 0
  ensemble_participants: [] # only for ensemble mode
  ensemble_turn_policy: null
  max_turns: null

inputs:
  required: []              # upstream artifacts that must exist
  optional: []

outputs:
  primary: docs/planning-artifacts/<file>.md
  traceable_to: []          # upstream artifact ids for traceability

gates:
  pre_start: []             # conditions checked before workflow begins
  post_complete: []         # conditions checked before workflow is marked done

disciplines:
  self_critique: true
  anti_rationalization: true
  trust_levels: true
```

### 2.2 instructions.xml pattern

```xml
<?xml version="1.0" encoding="UTF-8"?>
<instructions workflow="<id>">
  <steps>
    <step n="1" title="Load context">
      <action>Read upstream artifacts from inputs.</action>
    </step>
    <step n="2" title="Core work">
      <action>Perform the workflow's main activity.</action>
      <ask>Clarify with user if needed.</ask>
    </step>
    <step n="3" title="Produce output">
      <template-output file="docs/planning-artifacts/<output>.md">
        Apply the template from template.md, filling all sections.
      </template-output>
    </step>
  </steps>
</instructions>
```

### 2.3 checklist.md pattern

```markdown
# <workflow-id> Checklist
## Pre-start
- [ ] <required artifact> exists
## Post-complete
- [ ] Output has all required sections
- [ ] Self-critique confidence >= 0.85
```

---

## 3. Phase 1: Analysis (6 workflows)

### 3.1 brainstorm

- **Owner:** product-manager
- **Mode:** ensemble
- **Participants:** product-manager, architect, research-analyst
- **Turn policy:** round-robin
- **Max turns:** 12
- **Inputs:** none (can start from scratch)
- **Output:** `docs/planning-artifacts/brainstorm-transcript.md`
- **Pre-start gates:** none
- **Post-complete gates:** transcript has at least 3 turns
- **Steps:** Setup (define topic) → Ensemble turn loop → Synthesis (extract key decisions)
- **Note:** This is the first ensemble-mode workflow. Instructions.xml uses `<topic>` and `<synthesis>` blocks instead of numbered steps.

### 3.2 market-research

- **Owner:** research-analyst
- **Mode:** sequential
- **Inputs:** optional: product-brief
- **Output:** `docs/planning-artifacts/market-research.md`
- **Pre-start gates:** none (can run before brief exists)
- **Post-complete gates:** output has Market Overview, Competitors, Opportunities, Risks sections
- **Steps:** (1) Define research scope with user (2) Analyze market landscape (3) Identify competitors (4) Map opportunities and risks (5) Produce report

### 3.3 domain-research

- **Owner:** research-analyst
- **Mode:** sequential
- **Inputs:** optional: product-brief, market-research
- **Output:** `docs/planning-artifacts/domain-research.md`
- **Pre-start gates:** none
- **Post-complete gates:** output has Domain Model, Terminology, Standards, Regulations sections
- **Steps:** (1) Define domain scope (2) Research domain concepts and terminology (3) Identify standards and regulations (4) Document domain model (5) Produce report

### 3.4 tech-research

- **Owner:** research-analyst
- **Mode:** sequential
- **Inputs:** optional: product-brief, domain-research
- **Output:** `docs/planning-artifacts/tech-research.md`
- **Pre-start gates:** none
- **Post-complete gates:** output has Technology Options, Evaluation Criteria, Recommendation sections
- **Steps:** (1) Define evaluation criteria from requirements (2) Research technology options (3) Evaluate against criteria (4) Recommend with trade-offs (5) Produce report

### 3.5 advanced-elicitation

- **Owner:** research-analyst
- **Mode:** sequential
- **Inputs:** required: product-brief; optional: market-research, domain-research, tech-research
- **Output:** `docs/planning-artifacts/elicitation-report.md`
- **Pre-start gates:** product-brief exists
- **Post-complete gates:** output has Stakeholder Needs, Assumptions, Constraints, Dependencies sections
- **Steps:** (1) Load product brief and research artifacts (2) Identify gaps and ambiguities (3) Structured questioning with user (4) Document findings (5) Produce report

### 3.6 product-brief

- **Owner:** product-manager
- **Mode:** sequential
- **Inputs:** optional: brainstorm transcript, market-research, domain-research, tech-research, elicitation-report
- **Output:** `docs/planning-artifacts/product-brief.md`
- **Pre-start gates:** none (can synthesize from user conversation alone)
- **Post-complete gates:** output has Vision, Goals, Target Users, Key Features, Success Metrics, Constraints sections; self-critique >= 0.85
- **Steps:** (1) Gather context from user and available research (2) Define vision and goals (3) Identify target users (4) List key features with priorities (5) Define success metrics (6) Document constraints (7) Produce brief

---

## 4. Phase 2: Planning (5 workflows)

### 4.1 create-prd

- **Owner:** product-manager
- **Mode:** sequential
- **Inputs:** required: product-brief
- **Output:** `docs/planning-artifacts/prd.md`
- **Traceable to:** product-brief
- **Pre-start gates:** product-brief exists and is approved
- **Post-complete gates:** PRD has all required sections (Requirements, Acceptance Criteria, In Scope, Out of Scope, NFRs); each requirement has a unique ID (FR-001, NFR-001)
- **Steps:** (1) Load product brief (2) Discover functional requirements through user collaboration (3) Define NFRs (4) Write acceptance criteria per requirement (5) Define scope boundaries (In/Out) (6) Produce PRD

### 4.2 validate-prd

- **Owner:** validator
- **Mode:** sequential
- **Inputs:** required: prd, product-brief
- **Output:** validation report (inline, not a separate file)
- **Pre-start gates:** prd.md exists
- **Post-complete gates:** on_pass: all checks pass → next: create-ux. on_fail: issues found → next: edit-prd
- **Steps:** (1) Load PRD and product brief (2) Check completeness: all sections present (3) Check traceability: every requirement traces to brief (4) Check testability: every acceptance criterion is testable (5) Report: PASS with summary or FAIL with specific issues

### 4.3 edit-prd

- **Owner:** product-manager
- **Mode:** sequential
- **Inputs:** required: prd, validation feedback
- **Output:** updated `docs/planning-artifacts/prd.md`
- **Pre-start gates:** prd.md exists
- **Post-complete gates:** all validation issues addressed
- **Steps:** (1) Load PRD and validation feedback (2) Address each issue (3) Update PRD sections (4) Persist updated PRD

### 4.4 create-ux

- **Owner:** ux-designer
- **Mode:** sequential
- **Inputs:** required: prd; optional: product-brief
- **Output:** `docs/planning-artifacts/ux-spec.md`
- **Traceable to:** prd
- **Pre-start gates:** prd.md exists
- **Post-complete gates:** output has User Flows, Wireframes, Interaction Patterns, Responsive Behavior sections
- **Steps:** (1) Load PRD (2) Map user flows from requirements (3) Design wireframes per flow (4) Define interaction patterns (5) Document responsive/accessibility notes (6) Produce UX spec

### 4.5 review-a11y

- **Owner:** test-architect
- **Mode:** sequential
- **Inputs:** required: ux-spec
- **Output:** `docs/planning-artifacts/a11y-review.md`
- **Pre-start gates:** ux-spec.md exists
- **Post-complete gates:** output has WCAG Compliance, Issues Found, Recommendations sections
- **Steps:** (1) Load UX spec (2) Evaluate against WCAG 2.1 AA criteria (3) Identify accessibility issues (4) Recommend fixes (5) Produce review report

---

## 5. Phase 3: Solutioning (10 workflows)

### 5.1 create-arch

- **Owner:** architect
- **Mode:** sequential
- **Inputs:** required: prd; optional: ux-spec, tech-research
- **Output:** `docs/planning-artifacts/architecture.md`
- **Traceable to:** prd
- **Pre-start gates:** prd.md exists
- **Post-complete gates:** output has System Overview, Component Design, API Contracts, Data Model, Technology Stack, ADRs sections
- **Steps:** (1) Load PRD and available artifacts (2) Design system overview (3) Define components and boundaries (4) Design API contracts (5) Design data model (6) Select technology stack with rationale (7) Document architecture decision records (8) Produce architecture doc

### 5.2 edit-arch

- **Owner:** architect
- **Mode:** sequential
- **Inputs:** required: architecture.md, change context
- **Output:** updated `docs/planning-artifacts/architecture.md`
- **Pre-start gates:** architecture.md exists
- **Post-complete gates:** changes are consistent with PRD, ADRs updated
- **Steps:** (1) Load architecture and change context (2) Identify affected components (3) Apply changes (4) Update ADRs (5) Persist updated architecture

### 5.3 test-design

- **Owner:** test-architect
- **Mode:** sequential
- **Inputs:** required: architecture; optional: prd
- **Output:** `docs/planning-artifacts/test-plan.md`
- **Traceable to:** architecture
- **Pre-start gates:** architecture.md exists
- **Post-complete gates:** output has Strategy, Test Pyramid, Coverage Goals, Framework Selection, CI Integration sections
- **Steps:** (1) Load architecture (2) Define test strategy and pyramid (3) Set coverage goals per component (4) Select test framework (5) Plan CI integration (6) Produce test plan

### 5.4 create-epics

- **Owner:** product-manager
- **Mode:** sequential
- **Inputs:** required: architecture, prd
- **Output:** `docs/planning-artifacts/epics.md`
- **Traceable to:** architecture, prd
- **Pre-start gates:** architecture.md exists
- **Post-complete gates:** each epic has title, description, acceptance criteria, traces to architecture component
- **Steps:** (1) Load architecture and PRD (2) Decompose architecture into epics (3) Write acceptance criteria per epic (4) Map traceability (epic → architecture component → PRD requirement) (5) Produce epics doc

### 5.5 atdd

- **Owner:** test-architect
- **Mode:** sequential
- **Inputs:** required: epics; optional: test-plan
- **Output:** `docs/planning-artifacts/acceptance-tests.md`
- **Traceable to:** epics
- **Pre-start gates:** epics.md exists
- **Post-complete gates:** each epic has at least one acceptance test scenario
- **Steps:** (1) Load epics (2) For each epic, write acceptance test scenarios in Given/When/Then format (3) Map tests to epics (4) Produce acceptance tests doc

### 5.6 threat-model

- **Owner:** security-agent
- **Mode:** sequential
- **Inputs:** required: architecture
- **Output:** `docs/planning-artifacts/threat-model.md`
- **Traceable to:** architecture
- **Pre-start gates:** architecture.md exists
- **Post-complete gates:** output has Attack Surface, STRIDE Analysis, Mitigations, Residual Risks sections
- **Steps:** (1) Load architecture (2) Identify attack surfaces (3) Apply STRIDE per component (4) Propose mitigations (5) Document residual risks (6) Produce threat model

### 5.7 infra-design

- **Owner:** devops-agent
- **Mode:** sequential
- **Inputs:** required: architecture; optional: threat-model
- **Output:** `docs/planning-artifacts/infra-design.md`
- **Traceable to:** architecture
- **Pre-start gates:** architecture.md exists
- **Post-complete gates:** output has Hosting, CI/CD, Scaling, Monitoring, Cost Estimate sections
- **Steps:** (1) Load architecture and threat model (2) Design hosting and deployment (3) Design CI/CD pipeline (4) Plan scaling and autoscaling (5) Design monitoring and alerting (6) Estimate costs (7) Produce infra design

### 5.8 trace

- **Owner:** test-architect
- **Mode:** sequential
- **Inputs:** required: prd, architecture, epics; optional: acceptance-tests, threat-model
- **Output:** `docs/planning-artifacts/traceability-matrix.md`
- **Traceable to:** prd, architecture, epics
- **Pre-start gates:** prd.md, architecture.md, epics.md exist
- **Post-complete gates:** every requirement traces from brief → PRD → architecture → epic → test
- **Steps:** (1) Load all planning artifacts (2) Build requirement-to-epic mapping (3) Build epic-to-test mapping (4) Identify gaps (untraceable requirements) (5) Produce traceability matrix

### 5.9 readiness-check

- **Owner:** validator
- **Mode:** sequential
- **Inputs:** required: prd, architecture, epics, test-plan, traceability-matrix
- **Output:** `docs/planning-artifacts/readiness-report.md`
- **Pre-start gates:** all required inputs exist
- **Post-complete gates:** on_pass: all readiness criteria met → next: create-story (Phase 4). on_fail: gaps found → report issues
- **Steps:** (1) Load all planning artifacts (2) Verify completeness of each artifact (3) Verify traceability chain is unbroken (4) Check all security mitigations are documented (5) Check test coverage goals are achievable (6) Report: READY or NOT READY with specific gaps

### 5.10 overture

- **Owner:** validator
- **Mode:** parallel-waves
- **Inputs:** required: existing source code at project_path
- **Output:** `docs/planning-artifacts/overture-report.md`
- **Pre-start gates:** source code exists at project_path
- **Post-complete gates:** output has Architecture Map, API Catalog, Dependency Graph, NFR Baseline, Gap PRD sections
- **Steps (DAG for wave building):**
  - Step 1 `id="arch-scan"` outputs="architecture-map.md" — Scan codebase for architecture patterns, components, layers
  - Step 2 `id="api-scan"` outputs="api-catalog.md" — Catalog all APIs, endpoints, contracts
  - Step 3 `id="dep-scan"` outputs="dependency-graph.md" — Map dependencies, versions, licenses
  - Step 4 `id="ux-scan"` outputs="ux-flow-map.md" — Map existing UI flows and screens
  - Step 5 `id="nfr-scan"` inputs="architecture-map.md" outputs="nfr-baseline.md" — Assess NFR baselines (performance, security, a11y)
  - Step 6 `id="synthesis"` inputs="architecture-map.md, api-catalog.md, dependency-graph.md, ux-flow-map.md, nfr-baseline.md" outputs="overture-report.md" — Synthesize into gap-focused PRD

  Wave 1: Steps 1-4 (parallel, no dependencies)
  Wave 2: Step 5 (depends on step 1)
  Wave 3: Step 6 (depends on all)

---

## 6. Testing Strategy

**File:** `tests/workflows-p1p3.test.js`

For each of the 21 workflows:
- `workflow.yaml` exists and parses as valid YAML
- Has `id`, `owner`, `execution.mode`, `inputs`, `outputs`, `gates` fields
- `instructions.xml` exists and parses as valid XML
- Has at least 1 `<step>` element (or `<topic>` for ensemble)
- `checklist.md` exists
- `template.md` exists if the workflow produces a new artifact (not edit/validation workflows)

Workflow-specific checks:
- brainstorm: `execution.mode` is `ensemble`, has `ensemble_participants`
- overture: `execution.mode` is `parallel-waves`, instructions.xml has steps with `inputs`/`outputs` attributes
- validate-prd: gates have `on_pass`/`on_fail` or post_complete checks

---

## 7. Files Summary

21 workflows × 4 files = 84 files + 1 test file = **85 files total**

| Phase | Workflows | Files |
|---|---|---|
| 1-analysis | 6 | 24 |
| 2-planning | 5 | 20 |
| 3-solutioning | 10 | 40 |
| Test | 1 | 1 |

**Total: ~2500 lines across 85 files**

---

## 8. Out of Scope

- Phase 4-5 workflows (Spec 5c)
- Anytime workflows (Spec 5d)
- Dev/creative/testing module workflows (Spec 6)
- Document templates for `docs/planning-artifacts/` (the template.md files define the output shape; the actual artifact directories are created at runtime)
