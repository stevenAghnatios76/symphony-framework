# Symphony Anytime Workflows — Design Spec (Spec 5d)

> **Spec:** 5d of 8 (Anytime Workflows)
> **Date:** 2026-04-12
> **Scope:** 8 workflow directories for cross-phase anytime commands including party mode and stakeholders.

---

## 1. Workflows

All live under `_symphony/lifecycle/workflows/anytime/`. Output to `docs/planning-artifacts/` or `docs/implementation-artifacts/` depending on context.

### 1.1 quick-spec
- **Owner:** product-manager | **Mode:** sequential
- **Inputs:** none | **Output:** `docs/planning-artifacts/quick-spec.md`
- **Steps:** (1) Gather scope from user (2) Write lightweight spec (3) Produce quick-spec
- **Template sections:** Goal, Scope, Acceptance Criteria, Estimated Effort

### 1.2 quick-dev
- **Owner:** developer | **Mode:** sequential
- **Inputs:** required: quick-spec | **Output:** implementation code
- **Steps:** (1) Load quick-spec (2) Plan approach (3) Write tests (4) Implement (5) Commit
- **Template sections:** Changes Made, Tests Added, Files Modified

### 1.3 party
- **Owner:** product-manager | **Mode:** ensemble
- **Participants:** product-manager, architect, developer, reviewer
- **Turn policy:** user-picks | **Max turns:** 20
- **Inputs:** none | **Output:** `docs/planning-artifacts/party-transcript.md`
- **Steps:** Setup → Topic (user-defined) → Synthesis (decisions + action items)
- **Note:** Party mode — multi-agent roundtable on any topic. User picks who speaks next.

### 1.4 create-stakeholder
- **Owner:** product-manager | **Mode:** sequential
- **Inputs:** none | **Output:** `_symphony/lifecycle/agents/stakeholders/{name}.md`
- **Steps:** (1) Gather stakeholder info from user (2) Define role, perspective, expertise, biases (3) Write persona file (4) Available for party mode and ensemble discussions
- **Template sections:** Name, Role, Perspective, Expertise, Biases, Communication Style

### 1.5 memory-hygiene
- **Owner:** validator | **Mode:** sequential
- **Inputs:** none (scans _symphony/_memory/) | **Output:** hygiene report (inline)
- **Steps:** (1) Invoke memory-hygiene protocol (2) Present findings (3) Apply user-selected actions
- **No template.md** — report is inline from the protocol

### 1.6 document-project
- **Owner:** tech-writer | **Mode:** sequential
- **Inputs:** optional: all planning + implementation artifacts
- **Output:** `docs/project-documentation.md`
- **Steps:** (1) Scan all artifacts (2) Generate overview (3) Document architecture (4) Document APIs (5) Document deployment (6) Produce documentation
- **Template sections:** Project Overview, Architecture, API Reference, Deployment Guide, Configuration

### 1.7 performance-review
- **Owner:** performance-agent | **Mode:** sequential
- **Inputs:** optional: architecture, implementation
- **Output:** `docs/implementation-artifacts/performance-review.md`
- **Steps:** (1) Profile current state (2) Identify bottlenecks (3) Recommend optimizations (4) Produce report
- **Template sections:** Current Metrics, Bottlenecks, Recommendations, Priority

### 1.8 tech-debt-review
- **Owner:** developer | **Mode:** sequential
- **Inputs:** optional: architecture, implementation
- **Output:** `docs/implementation-artifacts/tech-debt-review.md`
- **Steps:** (1) Scan codebase (2) Identify debt items (3) Classify severity (4) Recommend paydown order (5) Produce report
- **Template sections:** Debt Items, Severity, Impact, Recommended Order, Estimated Effort

---

## 2. Testing

**File:** `tests/workflows-anytime.test.js` — same pattern. Party has ensemble mode, create-stakeholder outputs to agents/stakeholders/, memory-hygiene has no template.

---

## 3. Files

8 workflows. 1 has no template (memory-hygiene). = 8 × 4 - 1 = 31 workflow files + 1 test = **32 files**
