# Spec 7b — Testing Module Design

> Status: Draft | Date: 2026-04-29 | Depends on: Spec 5a (lifecycle agents), Spec 7a (dev module pattern)

## 1. Purpose

Fill Symphony's second-largest content gap: the testing module. Gaia has 16 testing workflows + 30 testing knowledge fragments + 5 language-specific test execution adapters. Symphony currently has 1 test-architect lifecycle agent with 4 workflows and zero knowledge or adapter backing.

This spec adds:
- 1 abstract base-test template (test strategy protocol, coverage tracking, adapter selection)
- 12 new testing workflows (in `_symphony/testing/workflows/`)
- 30 testing knowledge fragments across 6 categories (JIT loaded)
- 5 test execution bridge adapters (language-specific test runners)
- 3 new test files + structure.test.js updates

The existing `test-architect` lifecycle agent gets enhanced with knowledge references, adapter detection, and base-test inheritance. No new lifecycle agents are created.

## 2. Agent Architecture

### 2.1 Base Test Template

**File:** `_symphony/testing/agents/_base-test.md`
**Type:** Abstract — never instantiated directly
**Max lines:** 180

Defines shared behavior inherited by the test-architect (and future testing agents):

- **Test Strategy Protocol:** 6-step cycle (ANALYZE → DESIGN → WRITE → EXECUTE → REPORT → ITERATE)
- **Coverage Tracking:** Maintain coverage metrics with targets per component
- **Adapter Selection:** Detect project stack → select matching test execution adapter from `_symphony/testing/adapters/`
- **Knowledge JIT Loading:** Load knowledge sections on-demand from `_symphony/testing/knowledge/`, drop after use
- **Quality Gates:** Pre-start (test plan exists or being created, stack detected), post-complete (coverage targets met, all tests passing, report generated)
- **Risk Assessment:** Prioritize testing by component risk (data loss, security, user-facing, integration boundaries)

**Format:** YAML frontmatter + XML body. No `<memory-sidecar>` (abstract). No `<disciplines>` (concrete agents define their own).

### 2.2 Existing Test-Architect Enhancement

**File:** `_symphony/lifecycle/agents/test-architect.md` (existing — modify)

Add to the existing test-architect agent:
- `<base-test ref="_symphony/testing/agents/_base-test.md"/>` — inherit shared protocol
- `<knowledge-registry>` — list of available testing knowledge categories with JIT loading directive
- `<adapter-detection>` — stack detection rules mapping project markers to test execution adapters
- Add `security-testing` and `teach-me-testing` to `<workflows-owned>`

No persona change. The test-architect remains the universal testing agent for all stacks.

## 3. Testing Workflows

12 new workflows stored at `_symphony/testing/workflows/`. Each workflow has 4 files: workflow.yaml (~33 lines), instructions.xml (~20 lines), template.md (~20 lines), checklist.md (~10 lines).

### 3.1 Workflow Inventory

| ID | Description | Mode | Inputs |
|----|-------------|------|--------|
| gap-analysis | Analyze test coverage gaps in existing codebase | sequential | codebase, test-plan |
| performance-testing | Design and execute performance/load tests | sequential | architecture, test-plan |
| mobile-testing | Mobile-specific test strategy (simulators, devices, gestures) | sequential | architecture |
| ci-setup | Configure CI pipeline for test execution and reporting | sequential | test-plan |
| test-review | Review test quality, coverage, and effectiveness | sequential | test-suite |
| fill-test-gaps | Write tests to fill identified coverage gaps | sequential | gap-analysis-report |
| edit-test-plan | Update/revise existing test plans based on new requirements | sequential | test-plan, change-request |
| nfr-assessment | Non-functional requirements testing (perf, reliability, scalability) | sequential | architecture, nfr-requirements |
| test-automation | Design test automation framework and strategy | sequential | test-plan, architecture |
| test-execution | Execute test suites and generate structured reports | sequential | test-suite |
| security-testing | Security vulnerability testing (OWASP, dependency scanning) | sequential | architecture, codebase |
| teach-me-testing | Educational workflow teaching testing concepts interactively | sequential | topic |

### 3.2 Workflow Format

Each workflow follows the established 4-file pattern:

**workflow.yaml** (~33 lines):
```yaml
id: {workflow-id}
owner: test-architect
model: opus
description: {description}

execution:
  mode: sequential
  wave_eligible: false
  max_wave_siblings: 0
  ensemble_participants: []
  ensemble_turn_policy: null
  max_turns: null

inputs:
  required: [{inputs}]
  optional: [{optional-inputs}]

outputs:
  primary: docs/testing-artifacts/{output-file}
  traceable_to: [{traceability}]

gates:
  pre_start:
    - {precondition}
  post_complete:
    - {postcondition}

disciplines:
  self_critique: true
  anti_rationalization: true
  trust_levels: true
```

**instructions.xml** (~20 lines): Sequential steps with `<action>` elements.

**template.md** (~20 lines): Mustache-style template for the output artifact.

**checklist.md** (~10 lines): Pre-start and post-complete gate checklist.

## 4. Testing Knowledge Fragments

30 testing knowledge fragments stored at `_symphony/testing/knowledge/{category}/`. Each under 150 lines. Loaded JIT based on workflow context and detected stack.

### 4.1 Fragment Inventory

**strategies/ (6 fragments):**
| File | Focus |
|------|-------|
| test-pyramid.md | Test pyramid layers, ratios, when to use each level |
| risk-based-testing.md | Risk-driven test prioritization, critical path identification |
| bdd-gherkin.md | BDD with Gherkin syntax, scenario patterns, step definitions |
| contract-testing.md | API contract testing with Pact, consumer-driven contracts |
| mutation-testing.md | Mutation testing for test quality assessment (Stryker, mutmut) |
| regression-strategy.md | Regression test selection, test suite optimization |

**frameworks/ (6 fragments):**
| File | Focus |
|------|-------|
| vitest-jest.md | JavaScript/TypeScript testing with Vitest and Jest |
| pytest-patterns.md | Python testing with pytest fixtures, parametrize, markers |
| flutter-testing.md | Flutter widget testing, golden tests, integration tests |
| go-testing.md | Go testing, table-driven tests, testify, httptest |
| playwright-patterns.md | E2E browser testing with Playwright, page objects, fixtures |
| cypress-patterns.md | E2E browser testing with Cypress, commands, intercepts |

**patterns/ (6 fragments):**
| File | Focus |
|------|-------|
| test-doubles.md | Mocks, stubs, spies, fakes — when to use each |
| fixture-management.md | Test data management, factories, setup/teardown |
| data-builders.md | Builder pattern for test data, object mothers |
| snapshot-testing.md | Snapshot and golden file testing strategies |
| property-based.md | Property-based/generative testing (fast-check, Hypothesis) |
| visual-regression.md | Visual regression testing (Percy, Chromatic, BackstopJS) |

**performance/ (4 fragments):**
| File | Focus |
|------|-------|
| load-testing.md | Load and stress testing with k6, Artillery, Locust |
| profiling.md | Application profiling (CPU, memory, I/O) |
| benchmarking.md | Micro-benchmarking patterns and pitfalls |
| lighthouse.md | Web performance auditing with Lighthouse CI |

**security/ (4 fragments):**
| File | Focus |
|------|-------|
| owasp-testing.md | OWASP Testing Guide patterns, top 10 test cases |
| dependency-scanning.md | Dependency vulnerability scanning (Snyk, npm audit, Safety) |
| sast-dast.md | Static and dynamic application security testing |
| pen-testing.md | Penetration testing basics and methodology |

**mobile/ (4 fragments):**
| File | Focus |
|------|-------|
| device-testing.md | Real device vs simulator testing, device farms |
| app-store-testing.md | App store compliance testing, review guidelines |
| gesture-testing.md | Touch and gesture interaction testing |
| push-notification-testing.md | Push notification testing across platforms |

### 4.2 Fragment Format

Each knowledge fragment follows the same structure as dev knowledge (Spec 7a):

```markdown
# {Topic} — {Subtitle}

**Principle:** One-sentence guiding philosophy.

## Pattern Examples

### 1. {Pattern Name}
{Description + code block}

### 2. {Pattern Name}
{Description + code block}

### 3. {Pattern Name}
{Description + code block}

## Anti-Patterns
- **{name}** — {why it's bad} → {what to do instead}

## Integration Points
{How this integrates with CI, frameworks, other testing tools}
```

## 5. Test Execution Bridge

5 language-specific test execution adapters stored at `_symphony/testing/adapters/`. Each under 150 lines. These define how to discover, run, and parse test results for each language ecosystem.

### 5.1 Adapter Inventory

| File | Stack | Test Runner | Report Format |
|------|-------|-------------|---------------|
| vitest-adapter.md | JavaScript/TypeScript | Vitest, Jest | JSON reporter |
| pytest-adapter.md | Python | pytest | pytest-json-report |
| go-test-adapter.md | Go | go test | JSON output (-json flag) |
| flutter-test-adapter.md | Flutter/Dart | flutter test | machine-readable output |
| xctest-adapter.md | iOS/Swift | XCTest, xcodebuild | xcresult bundle |

### 5.2 Adapter Format

```markdown
# {Stack} Test Execution Adapter

**Runner:** {test runner command}
**Report format:** {output format}

## Discovery
{How to find test files — glob patterns, conventions}

## Execution
{Commands to run tests with structured output}

## Result Parsing
{How to parse pass/fail/skip counts and failure details}

## CI Integration
{How to integrate into CI pipelines}

## Common Issues
- **{issue}** — {solution}
```

### 5.3 Stack Detection for Adapters

The test-architect detects the project's test stack using the same markers as the developer agent:

| Marker File | Adapter |
|-------------|---------|
| `package.json` | vitest-adapter (default JS/TS) |
| `pyproject.toml` or `setup.py` or `requirements.txt` | pytest-adapter |
| `go.mod` | go-test-adapter |
| `pubspec.yaml` | flutter-test-adapter |
| `*.xcodeproj` or `Package.swift` | xctest-adapter |

## 6. Test Strategy

### 6.1 New Test Files

**`tests/workflows-testing.test.js`** — Validates:
- All 12 new workflow directories exist in `_symphony/testing/workflows/`
- Each has 4 files: workflow.yaml, instructions.xml, template.md, checklist.md
- Each workflow.yaml has required fields: id, owner, model, execution, inputs, outputs, gates, disciplines
- Each instructions.xml has `<instructions>` root with `<steps>`
- Each checklist.md has Pre-start and Post-complete sections

**`tests/knowledge-testing.test.js`** — Validates:
- All 30 knowledge fragments exist in correct `_symphony/testing/knowledge/{category}/` directories
- 6 category directories exist: strategies/, frameworks/, patterns/, performance/, security/, mobile/
- Each fragment is under 150 lines
- Each fragment has: H1 title, `## Pattern Examples`, `## Anti-Patterns`, `## Integration Points`

**`tests/adapters-testing.test.js`** — Validates:
- All 5 adapter files exist in `_symphony/testing/adapters/`
- Each adapter is under 150 lines
- Each adapter has: H1 title, `## Discovery`, `## Execution`, `## Result Parsing`

### 6.2 Structure Test Updates

`tests/structure.test.js` gets new assertions:
- `_symphony/testing/agents/_base-test.md` exists
- `_symphony/testing/workflows/` contains 12 workflow directories
- `_symphony/testing/knowledge/` contains 6 category directories
- `_symphony/testing/adapters/` contains 5 adapter files
- Total testing knowledge fragment count: 30

### 6.3 Expected Test Count Impact

Current: 1090 tests across 21 test files.
New: ~200 tests across 3 new test files + ~15 new assertions in structure.test.js.
Target: ~1305 tests across 24 test files.

## 7. Config Updates

### 7.1 manifest.yaml

```yaml
testing:
  version: "0.0.2-alpha.1"  # bumped from 0.0.1
  description: "Test architect, testing workflows, knowledge, adapters"
```

## 8. Implementation Swarm Plan

51 new files + 2 modified files organized into 3 waves:

### Wave 1: Knowledge + Adapters + Workflows (7 parallel agents)

| Agent | Files | Count |
|-------|-------|-------|
| Swarm-A: Knowledge batch 1 | strategies/ (6) + frameworks/ (6) | 12 |
| Swarm-B: Knowledge batch 2 | patterns/ (6) + performance/ (4) | 10 |
| Swarm-C: Knowledge batch 3 | security/ (4) + mobile/ (4) | 8 |
| Swarm-D: Adapters | 5 test execution adapters | 5 |
| Swarm-E: Workflows batch 1 | gap-analysis, performance-testing, mobile-testing, ci-setup (4×4 files) | 16 |
| Swarm-F: Workflows batch 2 | test-review, fill-test-gaps, edit-test-plan, nfr-assessment (4×4 files) | 16 |
| Swarm-G: Workflows batch 3 | test-automation, test-execution, security-testing, teach-me-testing (4×4 files) | 16 |

### Wave 2: Agents (1 agent)

| Agent | Files | Count |
|-------|-------|-------|
| Swarm-H: Base test + test-architect enhancement | _base-test.md (new), test-architect.md (modify) | 2 |

### Wave 3: Tests + Config (1 agent)

| Agent | Files | Count |
|-------|-------|-------|
| Swarm-I: Tests + config | workflows-testing.test.js, knowledge-testing.test.js, adapters-testing.test.js, structure.test.js updates, manifest.yaml bump | 5 |

**Total: 9 agent dispatches across 3 waves. 51 new files + 2 modified files.**

## 9. Acceptance Criteria

- [ ] `npm test` passes with all new tests (target ~1305 total)
- [ ] All 12 workflows exist with 4 files each, workflow.yaml has required fields
- [ ] All 30 knowledge fragments exist, under 150 lines each, with required sections
- [ ] All 5 adapters exist, under 150 lines each, with required sections
- [ ] _base-test.md defines test strategy protocol
- [ ] Existing test-architect.md references base-test and has knowledge-registry
- [ ] manifest.yaml shows testing module at 0.0.2-alpha.1
- [ ] No file exceeds CLAUDE.md line limits (200 agent, 150 knowledge/adapter)
