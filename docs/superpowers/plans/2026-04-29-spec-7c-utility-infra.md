# Spec 7c — Utility & Infrastructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan.

**Goal:** Build utility agents, stakeholder personas, 9 missing anytime workflows, and adapter registry entries.

**Spec:** `docs/superpowers/specs/2026-04-29-symphony-utility-infra-design.md`

---

## Wave 1: Content (4 parallel worktree agents)

### Task 1: Utility agents + stakeholder personas + adapter registries

**Files to create (11):**

Utility agents (3) — `_symphony/utility/agents/`:
- `critic.md` — Adversarial thinker, owns adversarial-review + discuss workflows
- `code-simplifier.md` — Refactoring specialist, shared ownership of tech-debt-review
- `browser-tester.md` — UI testing specialist, Playwright/Cypress/axe-core expertise

**Format:** YAML frontmatter (id, name, role, model: opus, max_lines: 200) + XML body. Follow `_symphony/dev/agents/mobile-dev.md` as reference. Must have: `<agent>`, `<persona>` (identity, expertise, operating-mode), `<knowledge-sources>` (trusted/verify/untrusted), `<disciplines>` (self-critique 0.85 + anti-rationalization with 3 pairs), `<workflows-owned>`, `<memory-sidecar>`.

Stakeholder personas (6) — `_symphony/lifecycle/agents/stakeholders/`:
- `_persona-template.md` — Abstract schema definition (~40 lines)
- `cto.md`, `product-owner.md`, `end-user.md`, `security-officer.md`, `qa-lead.md`

**Persona format:** YAML frontmatter (id, name, role, type: stakeholder-persona) + XML `<persona>` with: `<background>`, `<priorities>`, `<concerns>`, `<review-lens>`, `<communication-style>`. Each under 60 lines.

Adapter registries (2) — `_symphony/core/adapter-registry/`:
- `gemini-cli.yaml` — Follow `claude-code.yaml` format
- `cursor.yaml` — Follow `claude-code.yaml` format

### Task 2: Anytime workflows batch 1 — spike, explore-codebase, discuss

**Files to create (12):** 3 workflows × 4 files each

**Location:** `_symphony/lifecycle/workflows/anytime/{workflow-id}/`

**Reference:** `_symphony/lifecycle/workflows/3-solutioning/test-design/` for format.

Workflow details:
- **spike** — owner: architect, inputs: [question], output: docs/planning-artifacts/spike-{topic}.md. Steps: define question and timebox, research approaches, prototype if needed, document findings, make go/no-go recommendation.
- **explore-codebase** — owner: developer, inputs: [codebase], output: docs/planning-artifacts/codebase-report-{project}.md. Steps: scan directory structure, identify patterns and conventions, map dependencies, assess code quality metrics, generate intelligence report.
- **discuss** — owner: critic, inputs: [artifact], output: docs/planning-artifacts/discussion-{topic}.md. Steps: identify ambiguities and gray areas, list unstated assumptions, surface conflicting requirements, propose resolution options, document decisions.

### Task 3: Anytime workflows batch 2 — adversarial-review, hub, status

**Files to create (12):** 3 workflows × 4 files each

- **adversarial-review** — owner: critic, inputs: [artifact], output: docs/planning-artifacts/adversarial-review-{artifact}.md. Steps: identify claims and assumptions, stress-test each claim, find logical weaknesses, assess risk of failure modes, produce critique report with severity ratings.
- **hub** — owner: conductor, inputs: [], output: (launches hub server). Steps: check hub configuration, verify port availability, start local server, display dashboard URL, confirm access.
- **status** — owner: scrum-master, inputs: [], output: docs/planning-artifacts/status-{date}.md. Steps: scan workflow states, collect progress from each phase, identify blockers and risks, summarize overall health, produce status report.

### Task 4: Anytime workflows batch 3 — trello-sync, trello-setup, toggle

**Files to create (12):** 3 workflows × 4 files each

- **trello-sync** — owner: scrum-master, inputs: [trello-board], output: docs/planning-artifacts/trello-sync-{date}.md. Steps: connect to Trello API, map Symphony workflows to Trello cards, sync status bidirectionally, report conflicts, log sync results.
- **trello-setup** — owner: scrum-master, inputs: [project-name], output: docs/planning-artifacts/trello-setup-{project}.md. Steps: create Trello board, create lists matching Symphony phases, create label scheme, add board members, document board URL.
- **toggle** — owner: conductor, inputs: [feature-name], output: (updates config). Steps: read current feature flags from global.yaml, display current state, toggle specified feature, validate config, confirm change.

## Wave 2: Tests + Config (1 agent)

### Task 5: Test files + structure updates + manifest bump

**Files to create/modify:**
- Create: `tests/agents-utility.test.js`
- Create: `tests/stakeholders.test.js`
- Create: `tests/workflows-anytime.test.js`
- Modify: `tests/structure.test.js`
- Modify: `_symphony/_config/manifest.yaml`

**Test patterns:** Follow `tests/agents-dev.test.js` for agent tests, `tests/workflows-testing.test.js` for workflow tests. Data-driven with arrays.
