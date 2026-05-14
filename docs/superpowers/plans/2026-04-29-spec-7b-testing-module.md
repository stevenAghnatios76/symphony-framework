# Spec 7b — Testing Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Build the complete testing module — 12 workflows, 30 knowledge fragments, 5 adapters, 1 base template, and enhanced test-architect agent.

**Architecture:** Follows the same pattern as Spec 7a (dev module). Knowledge fragments use the dev knowledge format. Workflows use the lifecycle workflow 4-file format. Adapters introduce a new format for test execution bridges.

**Spec:** `docs/superpowers/specs/2026-04-29-symphony-testing-module-design.md`

---

## Wave 1: Knowledge + Adapters + Workflows (7 parallel worktree agents)

### Task 1: Knowledge — strategies/ (6) + frameworks/ (6)

**Files to create (12):**
- `_symphony/testing/knowledge/strategies/test-pyramid.md`
- `_symphony/testing/knowledge/strategies/risk-based-testing.md`
- `_symphony/testing/knowledge/strategies/bdd-gherkin.md`
- `_symphony/testing/knowledge/strategies/contract-testing.md`
- `_symphony/testing/knowledge/strategies/mutation-testing.md`
- `_symphony/testing/knowledge/strategies/regression-strategy.md`
- `_symphony/testing/knowledge/frameworks/vitest-jest.md`
- `_symphony/testing/knowledge/frameworks/pytest-patterns.md`
- `_symphony/testing/knowledge/frameworks/flutter-testing.md`
- `_symphony/testing/knowledge/frameworks/go-testing.md`
- `_symphony/testing/knowledge/frameworks/playwright-patterns.md`
- `_symphony/testing/knowledge/frameworks/cypress-patterns.md`

**Format:** Each file follows the dev knowledge pattern (see `_symphony/dev/knowledge/typescript/ts-conventions.md`). Under 150 lines. Must have: H1 title, `**Principle:**` line, `## Pattern Examples` (3 patterns with code blocks), `## Anti-Patterns`, `## Integration Points`.

### Task 2: Knowledge — patterns/ (6) + performance/ (4)

**Files to create (10):**
- `_symphony/testing/knowledge/patterns/test-doubles.md`
- `_symphony/testing/knowledge/patterns/fixture-management.md`
- `_symphony/testing/knowledge/patterns/data-builders.md`
- `_symphony/testing/knowledge/patterns/snapshot-testing.md`
- `_symphony/testing/knowledge/patterns/property-based.md`
- `_symphony/testing/knowledge/patterns/visual-regression.md`
- `_symphony/testing/knowledge/performance/load-testing.md`
- `_symphony/testing/knowledge/performance/profiling.md`
- `_symphony/testing/knowledge/performance/benchmarking.md`
- `_symphony/testing/knowledge/performance/lighthouse.md`

**Format:** Same as Task 1.

### Task 3: Knowledge — security/ (4) + mobile/ (4)

**Files to create (8):**
- `_symphony/testing/knowledge/security/owasp-testing.md`
- `_symphony/testing/knowledge/security/dependency-scanning.md`
- `_symphony/testing/knowledge/security/sast-dast.md`
- `_symphony/testing/knowledge/security/pen-testing.md`
- `_symphony/testing/knowledge/mobile/device-testing.md`
- `_symphony/testing/knowledge/mobile/app-store-testing.md`
- `_symphony/testing/knowledge/mobile/gesture-testing.md`
- `_symphony/testing/knowledge/mobile/push-notification-testing.md`

**Format:** Same as Task 1.

### Task 4: Test Execution Adapters (5)

**Files to create (5):**
- `_symphony/testing/adapters/vitest-adapter.md`
- `_symphony/testing/adapters/pytest-adapter.md`
- `_symphony/testing/adapters/go-test-adapter.md`
- `_symphony/testing/adapters/flutter-test-adapter.md`
- `_symphony/testing/adapters/xctest-adapter.md`

**Format:** Under 150 lines. Must have: H1 title with "Test Execution Adapter", `## Discovery`, `## Execution`, `## Result Parsing`, `## CI Integration`, `## Common Issues`. See spec section 5.2 for full format.

### Task 5: Workflows batch 1 — gap-analysis, performance-testing, mobile-testing, ci-setup

**Files to create (16):** 4 workflows × 4 files each (workflow.yaml, instructions.xml, template.md, checklist.md)

**Location:** `_symphony/testing/workflows/{workflow-id}/`

**Format:** Follows the lifecycle workflow pattern. See `_symphony/lifecycle/workflows/3-solutioning/test-design/` for reference. All workflows are `owner: test-architect`, `mode: sequential`.

### Task 6: Workflows batch 2 — test-review, fill-test-gaps, edit-test-plan, nfr-assessment

**Files to create (16):** Same format as Task 5.

### Task 7: Workflows batch 3 — test-automation, test-execution, security-testing, teach-me-testing

**Files to create (16):** Same format as Task 5.

## Wave 2: Agents (1 agent)

### Task 8: Base test template + test-architect enhancement

**Files:**
- Create: `_symphony/testing/agents/_base-test.md` (~65 lines)
- Modify: `_symphony/lifecycle/agents/test-architect.md` (add base-test ref, knowledge-registry, adapter-detection, 2 more workflows)

**_base-test.md format:** YAML frontmatter (id: _base-test, type: abstract, max_lines: 180) + XML body with: `<test-strategy-protocol>` (6-step: ANALYZE → DESIGN → WRITE → EXECUTE → REPORT → ITERATE), `<coverage-tracking>`, `<adapter-selection>`, `<knowledge-loading>`, `<quality-gates>` (pre-start + post-complete), `<risk-assessment>`.

**test-architect.md changes:** Add `<base-test ref="_symphony/testing/agents/_base-test.md"/>`, `<knowledge-registry>` (6 categories: strategies, frameworks, patterns, performance, security, mobile), `<adapter-detection>` (5 stack markers), add security-testing and teach-me-testing to `<workflows-owned>`.

## Wave 3: Tests + Config (1 agent)

### Task 9: Test files + structure updates + manifest bump

**Files:**
- Create: `tests/workflows-testing.test.js` (~90 lines)
- Create: `tests/knowledge-testing.test.js` (~80 lines)
- Create: `tests/adapters-testing.test.js` (~60 lines)
- Modify: `tests/structure.test.js` (add testing module section)
- Modify: `_symphony/_config/manifest.yaml` (bump testing to 0.0.2-alpha.1)

**Test patterns:** Follow `tests/skills.test.js` and `tests/knowledge.test.js` patterns. Vitest with describe/it/expect. Data-driven with arrays of expected items.
