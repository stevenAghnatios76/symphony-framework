# Spec 7d — Final Gap Closure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan.

**Goal:** Close all 6 remaining heatmap gaps — mobile agents, environment presets, workspace isolation, vault/knowledge graph, CLI layer, internationalization.

**Spec:** `docs/superpowers/specs/2026-04-29-symphony-final-gaps-design.md`

---

## Wave 1: Content (4 parallel worktree agents)

### Task 1: Mobile agents + environment presets

**Files to create (5):**

Mobile agents (2) — `_symphony/dev/agents/`:
- `designer-mobile.md` — Mobile UI/UX designer
- `mobile-tester.md` — Mobile QA specialist

Environment presets (3) — `_symphony/_config/presets/`:
- `solo.yaml`
- `team.yaml`
- `enterprise.yaml`

### Task 2: Workspace isolation + vault

**Files to create (5):**

Workspace isolation (2):
- `_symphony/core/protocols/workspace-isolation.xml`
- `_symphony/dev/knowledge/patterns/workspace-isolation.md`

Vault / knowledge graph (3) — `_symphony/core/vault/`:
- `schema.yaml`
- `codebase-index.yaml`
- `query-patterns.md`

### Task 3: CLI layer + i18n knowledge

**Files to create (3):**

CLI tools (2) — `_symphony/core/cli/`:
- `command-registry.yaml`
- `sdk-interface.yaml`

i18n knowledge (1):
- `_symphony/dev/knowledge/patterns/internationalization.md`

### Task 4: i18n workflow

**Files to create (4):**

`_symphony/lifecycle/workflows/anytime/i18n-setup/`:
- `workflow.yaml`
- `instructions.xml`
- `template.md`
- `checklist.md`

## Wave 2: Tests + Config (1 agent)

### Task 5: Test files + structure updates + manifest bump

**Files to create/modify (7):**
- Create: `tests/agents-mobile.test.js`
- Create: `tests/presets.test.js`
- Create: `tests/vault.test.js`
- Create: `tests/cli-registry.test.js`
- Modify: `tests/workflows-anytime.test.js`
- Modify: `tests/structure.test.js`
- Modify: `_symphony/_config/manifest.yaml`
