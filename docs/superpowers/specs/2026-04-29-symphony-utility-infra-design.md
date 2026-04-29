# Spec 7c — Utility & Infrastructure Module Design

> Status: Draft | Date: 2026-04-29 | Depends on: Spec 5a (lifecycle agents), Spec 7a (dev module), Spec 7b (testing module)

## 1. Purpose

Close the remaining feature gaps identified in the Symphony vs Gaia/GSD/Gem Team comparison:

- **Utility agents** (from Gem Team): critic, code-simplifier, browser-tester — standalone agents invocable from any workflow
- **Stakeholder personas** (from Gaia): Pre-defined personas for stakeholder role-play reviews
- **Discuss/gray area detection** (from GSD + Gem Team): Workflow for surfacing ambiguity
- **Spike/explore workflows** (from GSD): Bounded timeboxed exploration
- **Adversarial review triggers** (from Gaia): Devil's advocate review workflow
- **Missing anytime workflows**: 5 workflows defined in lifecycle-sequence.yaml but not yet implemented (hub, status, trello-sync, trello-setup, toggle)
- **Additional adapter registries** (from GSD): Gemini CLI and Cursor adapter manifests

This spec adds:
- 3 utility agents in new `_symphony/utility/agents/` directory
- 6 stakeholder persona files (1 abstract template + 5 concrete personas)
- 9 new anytime workflows (4 new concepts + 5 missing implementations)
- 2 adapter registry entries
- 3 new test files + structure.test.js updates

## 2. Utility Agents

New module directory: `_symphony/utility/agents/`

### 2.1 Critic Agent

**File:** `_symphony/utility/agents/critic.md`
**Persona:** Adversarial thinker who finds weaknesses, challenges assumptions, and stress-tests ideas
**Max lines:** 200 | **Model:** opus

**Expertise:** Devil's advocate reasoning, assumption identification, risk analysis, logical fallacy detection, pre-mortem analysis, red team thinking

**Anti-rationalization pairs:**
1. "The team already agreed on this" → "Consensus doesn't mean correctness. Challenge the reasoning, not the people."
2. "We don't have time for this review" → "Finding a critical flaw now costs less than fixing it in production."
3. "This edge case is unlikely" → "Unlikely events in production happen daily at scale."

**Workflows owned:** adversarial-review, discuss
**Knowledge sources trusted:** Architecture doc, PRD, test plan
**Memory sidecar:** `_symphony/_memory/critic-sidecar/`

### 2.2 Code Simplifier Agent

**File:** `_symphony/utility/agents/code-simplifier.md`
**Persona:** Refactoring specialist who reduces complexity while preserving behavior
**Max lines:** 200 | **Model:** opus

**Expertise:** Code smell detection, refactoring patterns (Fowler), complexity metrics (cyclomatic, cognitive), dead code elimination, dependency analysis, naming improvement

**Anti-rationalization pairs:**
1. "This abstraction might be useful later" → "YAGNI. Remove it. Add it when there's a real use case."
2. "The refactoring is too risky" → "If it's too risky to refactor, it's too risky to leave. Add tests first, then refactor."
3. "This code works, don't touch it" → "Working code that nobody can understand is a liability, not an asset."

**Workflows owned:** tech-debt-review (shared with existing agents)
**Memory sidecar:** `_symphony/_memory/code-simplifier-sidecar/`

### 2.3 Browser Tester Agent

**File:** `_symphony/utility/agents/browser-tester.md`
**Persona:** UI testing specialist who validates web applications through browser interaction
**Max lines:** 200 | **Model:** opus

**Expertise:** E2E browser testing, visual regression, accessibility auditing (axe-core), responsive testing, performance profiling (Lighthouse), cross-browser compatibility

**Anti-rationalization pairs:**
1. "Manual testing is faster" → "Manual testing is faster once. Automated tests run thousands of times."
2. "The UI is too dynamic to test" → "Dynamic UIs need MORE automated testing, not less. Use data-testid attributes."
3. "We'll add visual tests later" → "Visual regressions caught in PR review are 10x cheaper than those found by users."

**Workflows owned:** (invocable from any workflow as utility)
**Memory sidecar:** `_symphony/_memory/browser-tester-sidecar/`

## 3. Stakeholder Personas

Fill the empty `_symphony/lifecycle/agents/stakeholders/` directory with pre-defined personas that agents can role-play during stakeholder review workflows.

### 3.1 Persona Template

**File:** `_symphony/lifecycle/agents/stakeholders/_persona-template.md`
**Type:** Abstract template — not a persona itself
**Max lines:** 60

Defines the schema all personas follow:
```markdown
---
id: {persona-id}
name: {Full Name}
role: {Role Title}
type: stakeholder-persona
---

<persona id="{id}" role="{role}">
  <background>{Professional background and responsibilities}</background>
  <priorities>{What they care most about — ordered list}</priorities>
  <concerns>{What worries them — risk perspective}</concerns>
  <review-lens>{How they evaluate work — specific questions they ask}</review-lens>
  <communication-style>{How they prefer to receive information}</communication-style>
</persona>
```

### 3.2 Pre-defined Personas

| File | Role | Review Lens |
|------|------|-------------|
| `cto.md` | Chief Technology Officer | Scalability, tech debt, architecture fitness, build-vs-buy |
| `product-owner.md` | Product Owner | Business value, user impact, delivery timeline, scope creep |
| `end-user.md` | End User Representative | Usability, intuitiveness, error messages, accessibility |
| `security-officer.md` | Security Officer | OWASP compliance, data protection, audit trail, access control |
| `qa-lead.md` | QA Lead | Test coverage, quality gates, regression risk, release readiness |

Each persona: ~40 lines, YAML frontmatter + XML body matching the template schema.

## 4. New Anytime Workflows

9 new workflows in `_symphony/lifecycle/workflows/anytime/`. Each has 4 files (workflow.yaml, instructions.xml, template.md, checklist.md).

### 4.1 New Concept Workflows

| ID | Owner | Description |
|----|-------|-------------|
| spike | architect | Timeboxed exploration of a technical question with documented findings and go/no-go recommendation |
| explore-codebase | developer | Analyze codebase structure, patterns, dependencies, and generate intelligence report |
| discuss | critic | Surface gray areas, ambiguities, and unresolved decisions in requirements or architecture |
| adversarial-review | critic | Devil's advocate review of any artifact — find weaknesses, challenge assumptions |

### 4.2 Missing Sequence Workflows

These 5 workflows are defined in `lifecycle-sequence.yaml` but lack filesystem implementation:

| ID | Owner | Description |
|----|-------|-------------|
| hub | conductor | Launch the Symphony Hub dashboard for project visibility |
| status | scrum-master | Generate current project status summary across all phases |
| trello-sync | scrum-master | Sync Symphony workflow state with Trello board |
| trello-setup | scrum-master | Initialize Trello board structure for Symphony project |
| toggle | conductor | Toggle Symphony feature flags and configuration |

## 5. Adapter Registry Entries

2 new adapter manifests in `_symphony/core/adapter-registry/`:

### 5.1 Gemini CLI

**File:** `_symphony/core/adapter-registry/gemini-cli.yaml`
Maps Symphony commands to Gemini CLI equivalents. Follows the same schema as `claude-code.yaml` and `copilot.yaml`.

### 5.2 Cursor

**File:** `_symphony/core/adapter-registry/cursor.yaml`
Maps Symphony commands to Cursor IDE agent equivalents.

## 6. Test Strategy

### 6.1 New Test Files

**`tests/agents-utility.test.js`** — Validates:
- All 3 utility agents exist with correct XML structure
- Each has: frontmatter (id, name, role, model: opus, max_lines), `<agent>`, `<persona>`, `<knowledge-sources>`, `<disciplines>`, `<memory-sidecar>`
- Each has at least 2 anti-rationalization excuse/rebuttal pairs

**`tests/stakeholders.test.js`** — Validates:
- `_persona-template.md` exists with schema definition
- All 5 concrete personas exist
- Each persona has: frontmatter (id, name, role, type: stakeholder-persona), `<persona>`, `<background>`, `<priorities>`, `<concerns>`, `<review-lens>`
- Each persona is under 60 lines

**`tests/workflows-anytime.test.js`** — Validates:
- All 9 new workflow directories exist in `_symphony/lifecycle/workflows/anytime/`
- Each has 4 files: workflow.yaml, instructions.xml, template.md, checklist.md
- Each workflow.yaml has required fields

### 6.2 Structure Test Updates

`tests/structure.test.js` gets new assertions:
- `_symphony/utility/agents/` contains 3 agent files
- `_symphony/lifecycle/agents/stakeholders/` contains 6 files (template + 5 personas)
- 9 new anytime workflow directories exist
- 2 new adapter registry files exist

### 6.3 Expected Test Count Impact

Current: 1418 tests across 24 test files.
New: ~150 tests across 3 new test files + ~20 new assertions in structure.test.js.
Target: ~1590 tests across 27 test files.

## 7. Config Updates

### 7.1 manifest.yaml

Add new module:
```yaml
utility:
  version: "0.0.2-alpha.1"
  description: "Utility agents — critic, code-simplifier, browser-tester"
```

Bump lifecycle (new workflows + stakeholders):
```yaml
lifecycle:
  version: "0.0.2-alpha.1"  # bumped from 0.0.1
```

## 8. Implementation Swarm Plan

50 new files + 3 modified files organized into 2 waves:

### Wave 1: Content (4 parallel agents)

| Agent | Files | Count |
|-------|-------|-------|
| Swarm-A: Utility agents + stakeholder personas | 3 agents + 6 personas + 2 adapter registries | 11 |
| Swarm-B: Anytime workflows batch 1 | spike, explore-codebase, discuss (3×4 files) | 12 |
| Swarm-C: Anytime workflows batch 2 | adversarial-review, hub, status (3×4 files) | 12 |
| Swarm-D: Anytime workflows batch 3 | trello-sync, trello-setup, toggle (3×4 files) | 12 |

### Wave 2: Tests + Config (1 agent)

| Agent | Files | Count |
|-------|-------|-------|
| Swarm-E: Tests + config | 3 test files + structure.test.js + manifest.yaml | 5 |

**Total: 5 agent dispatches across 2 waves. 50 new files + 3 modified files.**

## 9. Acceptance Criteria

- [ ] `npm test` passes with all new tests (target ~1590 total)
- [ ] All 3 utility agents exist with standard agent structure
- [ ] All 6 stakeholder files exist (template + 5 personas) under 60 lines each
- [ ] All 9 new anytime workflows exist with 4 files each
- [ ] 2 new adapter registry entries exist
- [ ] manifest.yaml shows utility at 0.0.2-alpha.1 and lifecycle bumped to 0.0.2-alpha.1
- [ ] No file exceeds CLAUDE.md line limits
