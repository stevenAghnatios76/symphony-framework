# Spec 7d — Final Gap Closure Design

> Status: Draft | Date: 2026-04-29 | Depends on: Specs 7a-7c

## 1. Purpose

Close every remaining gap on the Symphony vs Gaia/GSD/Gem Team comparison heatmap — 1 medium-priority gap and 5 low-priority gaps — bringing Symphony to full feature parity.

## 2. Mobile Agents (Medium Priority)

We have `mobile-dev.md` but lack designer and tester counterparts from Gem Team.

### 2.1 Designer Mobile

**File:** `_symphony/dev/agents/designer-mobile.md`
**Persona:** Mobile UI/UX designer specializing in platform-native design systems
**Max lines:** 200 | **Model:** opus

**Expertise:** iOS Human Interface Guidelines, Android Material Design 3, responsive mobile layouts, gesture design, accessibility (VoiceOver/TalkBack), design tokens, Figma-to-code handoff, animation/motion design, dark mode, adaptive icons

**Anti-rationalization pairs:**
1. "We can use the same layout for both platforms" → "iOS and Android users have different mental models. Respect platform conventions or users will fight the interface."
2. "Accessibility can be added later" → "Retrofitting accessibility is 5x more expensive. Design for VoiceOver/TalkBack from day one."
3. "This animation looks cool" → "Motion must serve function. Every animation needs a purpose: orient, guide, or confirm. Decorative motion is noise."

**Workflows owned:** design-review (shared)
**Memory sidecar:** `_symphony/_memory/designer-mobile-sidecar/`

### 2.2 Mobile Tester

**File:** `_symphony/dev/agents/mobile-tester.md`
**Persona:** Mobile QA specialist who validates apps across devices, OS versions, and network conditions
**Max lines:** 200 | **Model:** opus

**Expertise:** Device matrix testing, OS version compatibility, network condition simulation (offline, 2G, 3G, LTE, Wi-Fi), gesture testing, push notification validation, app lifecycle testing (background/foreground/killed), memory profiling, battery usage analysis, app store compliance (Apple Review Guidelines, Google Play policies), crash reporting (Crashlytics, Sentry)

**Anti-rationalization pairs:**
1. "It works on the latest OS" → "30% of users are on older OS versions. Test the minimum supported version, not just the latest."
2. "Wi-Fi testing is sufficient" → "Mobile networks are lossy and latent. Test on cellular, airplane mode transitions, and tunnel scenarios."
3. "The emulator passed all tests" → "Emulators don't reproduce thermal throttling, real GPS, camera hardware, or haptic feedback. Ship after device testing."

**Workflows owned:** mobile-testing (shared with test-architect)
**Memory sidecar:** `_symphony/_memory/mobile-tester-sidecar/`

## 3. Environment Presets (Low Priority — from Gaia)

Pre-configured environment profiles for different team sizes. Stored in `_symphony/_config/presets/`.

### 3.1 Solo Preset

**File:** `_symphony/_config/presets/solo.yaml`
- Simplified workflow gates (fewer review steps)
- Single-developer conductor settings
- Memory hygiene on weekly cadence
- Hub auto-refresh disabled (saves resources)
- Trello integration disabled
- Ensemble mode defaults to self-review

### 3.2 Team Preset

**File:** `_symphony/_config/presets/team.yaml`
- Full gate enforcement (code review required)
- Multi-agent conductor routing
- Memory hygiene on daily cadence
- Hub auto-refresh enabled
- Trello integration enabled
- Ensemble mode with round-robin turn policy

### 3.3 Enterprise Preset

**File:** `_symphony/_config/presets/enterprise.yaml`
- Strict gate enforcement (security review + architecture review required)
- Compliance-aware conductor (audit trail mandatory)
- Memory hygiene on every commit
- Hub with authentication enabled
- Trello + Jira integration
- Mandatory stakeholder review on all PRDs
- Extended adapter support (all registered adapters active)

## 4. Workspace Isolation (Low Priority — from GSD)

Agent sandboxing protocol ensuring each agent operates in a bounded workspace.

### 4.1 Protocol

**File:** `_symphony/core/protocols/workspace-isolation.xml`
- Defines workspace boundary rules (file access, directory scope)
- Agent-to-workspace mapping (each agent gets its own working directory)
- Shared vs private artifact directories
- Cross-agent file access requires explicit handoff
- Workspace cleanup on workflow completion

### 4.2 Knowledge Fragment

**File:** `_symphony/dev/knowledge/patterns/workspace-isolation.md`
- Pattern examples: git worktree isolation, Docker container isolation, chroot sandboxing
- Anti-patterns: agents writing to shared directories without locks, orphaned workspace cleanup
- Integration points: checkpoint-resume protocol, memory-hygiene protocol

## 5. Vault / Knowledge Graph (Low Priority — from GSD)

Codebase intelligence system for persistent knowledge storage and retrieval. Extends the vault config already in global.yaml.

### 5.1 Schema

**File:** `_symphony/core/vault/schema.yaml`
- Node types: file, function, class, module, dependency, test, config
- Edge types: imports, calls, tests, depends-on, owns, implements
- Metadata: last-indexed timestamp, file hash, line range
- Query interface: by-node-type, by-edge-type, by-path-glob, by-dependency-chain

### 5.2 Indexing Rules

**File:** `_symphony/core/vault/codebase-index.yaml`
- File type markers and discovery patterns
- Indexing frequency rules (on-change, on-commit, scheduled)
- Ignore patterns (.git, node_modules, build artifacts)
- Language-specific parsers (AST extraction rules)
- Index storage location: `_symphony/_memory/vault-index/`

### 5.3 Query Patterns

**File:** `_symphony/core/vault/query-patterns.md`
- Common queries: "what depends on X", "what tests cover Y", "what changed since Z"
- Pattern examples with expected output format
- Anti-patterns: over-indexing, stale index reliance
- Integration with explore-codebase workflow

## 6. CLI Tools Layer / SDK (Low Priority — from GSD)

Command registry and SDK interface for Symphony's CLI surface.

### 6.1 Command Registry

**File:** `_symphony/core/cli/command-registry.yaml`
- Maps all Symphony slash commands to their workflow or action
- Command categories: lifecycle, dev, creative, testing, utility, admin
- Each entry: id, command, description, workflow-ref, args-schema, available-in (adapters)
- Covers all 75+ workflows as invocable commands

### 6.2 SDK Interface

**File:** `_symphony/core/cli/sdk-interface.yaml`
- Defines the programmatic API surface for Symphony
- Methods: start-workflow, get-status, list-agents, dispatch-agent, query-vault, get-checkpoint
- Event hooks: on-workflow-start, on-step-complete, on-gate-check, on-workflow-end
- Extension points: custom-agent-registration, custom-workflow-registration, plugin-loader

## 7. Internationalization (Low Priority — from GSD)

i18n support as a knowledge fragment plus a setup workflow.

### 7.1 Knowledge Fragment

**File:** `_symphony/dev/knowledge/patterns/internationalization.md`
- Pattern examples: ICU message format, pluralization rules, RTL layout support
- Framework-specific: react-intl, flutter_localizations, go i18n packages
- Anti-patterns: concatenating translated strings, hardcoded locale assumptions
- Integration points: design-review workflow, accessibility testing

### 7.2 i18n Setup Workflow

**Location:** `_symphony/lifecycle/workflows/anytime/i18n-setup/`
4 files: workflow.yaml, instructions.xml, template.md, checklist.md

- Owner: developer
- Inputs: [project-path, target-locales]
- Output: docs/planning-artifacts/i18n-setup-{project}.md
- Steps: audit existing string literals, select i18n library, configure locale files, extract strings to resource bundles, set up CI locale validation

## 8. Test Strategy

### 8.1 New Test Files

**`tests/agents-mobile.test.js`** — Validates:
- Both mobile agents exist with correct XML structure
- Each has: frontmatter, persona, knowledge-sources, disciplines, anti-rationalization (3 pairs each), memory-sidecar
- ~18 tests

**`tests/presets.test.js`** — Validates:
- All 3 preset files exist and parse as YAML
- Each has required sections (gates, conductor, memory_hygiene, hub)
- Values are appropriate for the preset tier
- ~20 tests

**`tests/vault.test.js`** — Validates:
- schema.yaml exists with node_types, edge_types, query_interface
- codebase-index.yaml exists with file_patterns, ignore_patterns
- query-patterns.md exists with pattern examples and anti-patterns
- ~15 tests

**`tests/cli-registry.test.js`** — Validates:
- command-registry.yaml exists with commands array
- Each command has id, command, description, workflow_ref
- sdk-interface.yaml exists with methods, events, extensions
- ~20 tests

### 8.2 Existing Test Updates

- `tests/workflows-anytime.test.js` — Add i18n-setup entry
- `tests/structure.test.js` — Add assertions for all new directories and files
- `_symphony/_config/manifest.yaml` — Bump dev and core versions

### 8.3 Expected Test Count

Current: 1577 tests across 26 test files.
New: ~80 tests across 4 new test files + ~15 new assertions in existing files.
Target: ~1670 tests across 30 test files.

## 9. Implementation Plan

22 new files + 3 modified files organized into 2 waves:

### Wave 1: Content (4 parallel agents)

| Agent | Files | Count |
|-------|-------|-------|
| Agent-A: Mobile agents + presets | 2 agents + 3 presets | 5 |
| Agent-B: Workspace isolation + vault | 1 protocol + 1 knowledge + 3 vault files | 5 |
| Agent-C: CLI layer + i18n knowledge | 2 CLI files + 1 knowledge | 3 |
| Agent-D: i18n workflow | 4 workflow files | 4 |

### Wave 2: Tests + Config (1 agent)

| Agent | Files | Count |
|-------|-------|-------|
| Agent-E: Tests + config | 4 test files + 3 modified files | 7 |

**Total: 5 agent dispatches across 2 waves. 22 new files + 3 modified files.**

## 10. Acceptance Criteria

- [ ] `npm test` passes with all new tests (target ~1670 total)
- [ ] Both mobile agents exist with standard agent structure
- [ ] 3 environment presets exist with tier-appropriate values
- [ ] Workspace isolation protocol and knowledge fragment exist
- [ ] Vault schema, indexing rules, and query patterns exist
- [ ] CLI command registry and SDK interface exist
- [ ] i18n knowledge fragment and workflow exist
- [ ] All heatmap cells flip to green
- [ ] manifest.yaml versions bumped
