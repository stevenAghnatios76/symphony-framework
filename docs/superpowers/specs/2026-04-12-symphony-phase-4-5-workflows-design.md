# Symphony Phase 4-5 Workflows — Design Spec (Spec 5c)

> **Spec:** 5c of 8 (Phase 4-5 Workflows)
> **Date:** 2026-04-12
> **Depends on:** Specs 1-4, 5a (Agents), 5b (Phase 1-3 Workflows)
> **Scope:** 18 workflow directories for Phase 4 Implementation (14) and Phase 5 Deployment (4).

---

## 1. Overview

Same 4-file structure as Spec 5b. Output artifacts go to `docs/implementation-artifacts/` for Phase 4-5.

---

## 2. Phase 4: Implementation (14 workflows)

### 2.1 create-story
- **Owner:** product-manager | **Mode:** sequential
- **Inputs:** required: epics
- **Output:** `docs/implementation-artifacts/stories/{story-id}.md`
- **Steps:** (1) Load epics (2) Select epic to decompose (3) Write story with acceptance criteria (4) Set traces_to (5) Produce story file

### 2.2 validate-story
- **Owner:** validator | **Mode:** sequential
- **Inputs:** required: story file, epics
- **Output:** validation report (inline)
- **Gates:** on_pass → sprint-plan, on_fail → create-story
- **Steps:** (1) Load story and parent epic (2) Check completeness (3) Check traces_to (4) Check acceptance criteria testability (5) Report PASS/FAIL
- **No template.md**

### 2.3 sprint-plan
- **Owner:** scrum-master | **Mode:** sequential
- **Inputs:** required: validated stories
- **Output:** `docs/implementation-artifacts/sprint-status.md`
- **Steps:** (1) Load ready stories (2) Estimate and prioritize (3) Select sprint scope (4) Set sprint goals (5) Produce sprint-status

### 2.4 dev-story
- **Owner:** developer | **Mode:** sequential
- **Inputs:** required: story file, architecture
- **Output:** implementation code + tests
- **Steps:** (1) Load story and architecture (2) Plan implementation approach (3) Write failing tests (4) Implement code (5) Run tests (6) Self-review (7) Commit

### 2.5 check-dod
- **Owner:** validator | **Mode:** sequential
- **Inputs:** required: story file, implementation
- **Output:** DoD report (inline)
- **Gates:** on_pass → run-all-reviews, on_fail → dev-story
- **Steps:** (1) Load story acceptance criteria (2) Verify each criterion (3) Check tests exist and pass (4) Check code committed (5) Report PASS/FAIL
- **No template.md**

### 2.6 code-review
- **Owner:** reviewer | **Mode:** sequential
- **Inputs:** required: story implementation
- **Output:** `docs/implementation-artifacts/reviews/{story-id}-code-review.md`
- **Steps:** (1) Load changed files (2) Review correctness (3) Review patterns (4) Review edge cases (5) Produce review report

### 2.7 qa-tests
- **Owner:** test-architect | **Mode:** sequential
- **Inputs:** required: story implementation
- **Output:** `docs/implementation-artifacts/reviews/{story-id}-qa-tests.md`
- **Steps:** (1) Load story and tests (2) Assess coverage (3) Generate additional tests if needed (4) Run test suite (5) Produce QA report

### 2.8 security-review
- **Owner:** security-agent | **Mode:** sequential
- **Inputs:** required: story implementation
- **Output:** `docs/implementation-artifacts/reviews/{story-id}-security-review.md`
- **Steps:** (1) Load changed files (2) OWASP top 10 check (3) Dependency scan (4) Secrets check (5) Produce security report

### 2.9 run-all-reviews
- **Owner:** validator | **Mode:** parallel-waves
- **Inputs:** required: story implementation
- **Output:** `docs/implementation-artifacts/reviews/{story-id}-review-summary.md`
- **Steps (DAG):**
  - Step 1 `id="code-rev"` outputs="code-review-result" — Run code review
  - Step 2 `id="qa-test"` outputs="qa-test-result" — Run QA tests
  - Step 3 `id="sec-rev"` outputs="security-result" — Run security review
  - Step 4 `id="test-auto"` outputs="test-auto-result" — Check test automation coverage
  - Step 5 `id="test-rev"` outputs="test-review-result" — Review test quality
  - Step 6 `id="perf-rev"` outputs="perf-result" — Performance review
  - Step 7 `id="summary"` inputs="code-review-result, qa-test-result, security-result, test-auto-result, test-review-result, perf-result" outputs="review-summary" — Aggregate all 6 gate results
  
  Wave 1: Steps 1-6 (all parallel). Wave 2: Step 7 (synthesis).

### 2.10 review-gate
- **Owner:** validator | **Mode:** sequential
- **Inputs:** required: review summary
- **Output:** gate decision (inline)
- **Gates:** on_pass → sprint-status, on_fail → dev-story
- **Steps:** (1) Load review summary (2) Check all 6 gates passed (3) Apply adaptive substitutions for infra stories per §2.8 (4) Report PASS/FAIL
- **No template.md**

### 2.11 sprint-status
- **Owner:** scrum-master | **Mode:** sequential
- **Inputs:** required: sprint-status.md, story files
- **Output:** updated `docs/implementation-artifacts/sprint-status.md`
- **Steps:** (1) Load sprint-status (2) Count stories by status (3) Identify blockers (4) Update burndown (5) Report status
- **No template.md** (updates existing)

### 2.12 retro
- **Owner:** scrum-master | **Mode:** ensemble
- **Participants:** scrum-master, developer, reviewer, test-architect
- **Turn policy:** round-robin | **Max turns:** 12
- **Output:** `docs/implementation-artifacts/retro-{sprint-id}.md`
- **Steps:** Setup → Topic (what went well, what didn't, improvements) → Synthesis (action items)

### 2.13 change-request
- **Owner:** product-manager | **Mode:** sequential
- **Inputs:** required: change description
- **Output:** `docs/implementation-artifacts/change-requests/{cr-id}.md`
- **Steps:** (1) Document change (2) Impact analysis (3) Scope assessment (4) Recommendation (5) Produce CR doc

### 2.14 correct-course
- **Owner:** scrum-master | **Mode:** sequential
- **Inputs:** required: sprint-status, change-request
- **Output:** updated `docs/implementation-artifacts/sprint-status.md`
- **Steps:** (1) Load sprint and CR (2) Reprioritize (3) Adjust scope (4) Update sprint-status
- **No template.md**

---

## 3. Phase 5: Deployment (4 workflows)

### 3.1 release-plan
- **Owner:** devops-agent | **Mode:** sequential
- **Inputs:** required: sprint-status (all done)
- **Output:** `docs/implementation-artifacts/release-plan.md`
- **Steps:** (1) Assess release scope (2) Version strategy (3) Changelog (4) Migration notes (5) Produce release plan

### 3.2 rollback-plan
- **Owner:** devops-agent | **Mode:** sequential
- **Inputs:** required: release-plan
- **Output:** `docs/implementation-artifacts/rollback-plan.md`
- **Steps:** (1) Identify rollback triggers (2) Define rollback steps (3) Verification commands (4) Produce rollback plan

### 3.3 deploy-checklist
- **Owner:** devops-agent | **Mode:** sequential
- **Inputs:** required: release-plan, rollback-plan
- **Output:** `docs/implementation-artifacts/deploy-checklist.md`
- **Steps:** (1) Environment readiness (2) Secrets verification (3) Database migrations (4) Smoke test plan (5) Produce checklist

### 3.4 post-deploy
- **Owner:** devops-agent | **Mode:** sequential
- **Inputs:** required: deploy-checklist
- **Output:** `docs/implementation-artifacts/post-deploy-report.md`
- **Gates:** terminal: true (lifecycle complete)
- **Steps:** (1) Health checks (2) Monitoring verification (3) Alert configuration (4) Smoke tests (5) Produce post-deploy report

---

## 4. Testing

**File:** `tests/workflows-p4p5.test.js` — same pattern as `tests/workflows-p1p3.test.js`

For each workflow: yaml parses, has required fields, xml parses, has steps (or topic for ensemble, inputs/outputs for parallel-waves), checklist exists, template exists (where applicable).

Specific checks: run-all-reviews has parallel-waves mode, retro has ensemble mode, validate-story/check-dod/review-gate have on_pass/on_fail gates.

---

## 5. Files

18 workflows. 5 have no template.md (validate-story, check-dod, review-gate, sprint-status, correct-course).
= 18 × 4 - 5 = 67 workflow files + 1 test = **68 files total**
