# Spec 7a — Dev Module Design

> Status: Draft | Date: 2026-04-29 | Depends on: Spec 5a (lifecycle agents), Spec 6a (creative module pattern)

## 1. Purpose

Fill Symphony's largest content gap: the dev module. Gaia has 7 language-specific devs + base template + 11 skills + 19 knowledge fragments. Symphony has an existing `developer` lifecycle agent with zero skills or knowledge backing it.

This spec adds:
- 1 abstract base-dev template (story execution protocol, TDD, file tracking)
- 1 new mobile-dev agent (mobile is a distinct paradigm)
- 11 shared developer skills (JIT loaded)
- 19 language-specific knowledge fragments (JIT loaded by detected stack)
- 3 new test files + structure.test.js updates

The existing `developer` lifecycle agent gets enhanced with skill references and stack-detection logic. No new lifecycle agents are created — the universal developer handles all non-mobile stacks.

## 2. Agent Architecture

### 2.1 Base Dev Template

**File:** `_symphony/dev/agents/_base-dev.md`
**Type:** Abstract — never instantiated directly
**Max lines:** 180

Defines shared behavior inherited by all dev agents (the existing lifecycle `developer` and the new `mobile-dev`):

- **Story Execution Protocol:** 8-step TDD cycle (RED → GREEN → REFACTOR → checkpoint → commit → test → review → update status)
- **File Tracking:** Maintain file change list with sha256 checksums and ISO 8601 timestamps
- **Checkpoint Architecture:** YAML checkpoints at `_symphony/_memory/checkpoints/{story-key}.yaml` with files_touched metadata
- **Skill JIT Loading:** Load skill sections on-demand from `_symphony/dev/skills/`, drop after use
- **Stack Detection:** Check project root for markers (package.json, angular.json, pubspec.yaml, pyproject.toml, go.mod) → load matching knowledge tier
- **Conventional Commits:** type(scope): description format
- **Quality Gates:** Pre-start (story ready-for-dev, dependencies resolved), post-complete (tests passing, DoD checked, files tracked, commit created)
- **Findings Protocol:** Out-of-scope discoveries logged in Findings table, not fixed inline

**Format:** YAML frontmatter + XML body. No `<memory-sidecar>` (abstract). No `<disciplines>` (concrete agents define their own).

### 2.2 Mobile Dev Agent

**File:** `_symphony/dev/agents/mobile-dev.md`
**Persona:** Talia — Mobile specialist
**Max lines:** 120
**Model:** opus

**Stack focus:** React Native, Expo, Flutter, Kotlin (Android), Swift (iOS)

**Why separate:** Mobile development involves simulators/emulators, platform channels, app lifecycle (foreground/background/killed), code signing, app store deployment, touch gestures, and platform-specific UI guidelines (HIG, Material 3). These concerns don't apply to web/backend work.

**Knowledge tier:** core + flutter/ (loads typescript/ts-conventions.md + typescript/react-patterns.md for React Native projects)

**Skills:** git-workflow, testing-patterns, code-review-standards, security-basics, edge-cases, figma-integration

**Memory sidecar:** `_symphony/_memory/mobile-dev-sidecar/`

**Disciplines:**
- `<self-critique threshold="0.85"/>`
- `<anti-rationalization>` with 3 excuse-rebuttal pairs:
  1. "The simulator is close enough" → "Test on real devices for performance, gestures, and push notifications"
  2. "Platform-specific code can wait" → "Platform differences caught late cause double rework"
  3. "We can handle permissions later" → "Permission flows affect navigation architecture — design upfront"

**Workflows owned:** dev-story (shared with developer), code-review (shared)

### 2.3 Existing Developer Enhancement

**File:** `_symphony/lifecycle/agents/developer.md` (existing — modify)

Add to the existing developer agent:
- `<base-dev ref="_symphony/dev/agents/_base-dev.md"/>` — inherit shared protocol
- `<skills-registry>` — list of available skills with JIT loading directive
- `<knowledge-detection>` — stack detection rules mapping project markers to knowledge tiers

No persona change. The developer agent remains the universal dev for all non-mobile stacks.

## 3. Skills

11 shared skills stored at `_symphony/dev/skills/`. Plain markdown with `<!-- SECTION: name -->` comments for JIT sectioned loading. Each skill stays under 300 lines.

### 3.1 Skill Inventory

| ID | File | Sections | Budget |
|----|------|----------|--------|
| git-workflow | git-workflow.md | Branching strategy, Conventional commits, PR template, Conflict resolution | ~160 |
| api-design | api-design.md | REST conventions, GraphQL, OpenAPI, Versioning, Error standards (RFC 7807) | ~230 |
| database-design | database-design.md | Schema design, Migrations, Indexing, ORM patterns | ~200 |
| docker-workflow | docker-workflow.md | Multi-stage builds, Compose, Security scanning | ~150 |
| testing-patterns | testing-patterns.md | TDD cycle, Unit testing (AAA), Integration testing, Test doubles | ~230 |
| code-review-standards | code-review-standards.md | Review checklist, SOLID principles, Complexity metrics | ~150 |
| documentation-standards | documentation-standards.md | README templates, ADRs, Inline comments, API docs | ~150 |
| security-basics | security-basics.md | OWASP Top 10, Input validation, Secrets management, CORS/CSRF | ~180 |
| figma-integration | figma-integration.md | Design token extraction (W3C DTCG), Component specs, Asset export | ~120 |
| edge-cases | edge-cases.md | Boundary, Error, Timing, Concurrency, Integration, Security analysis | ~150 |
| validation-patterns | validation-patterns.md | Claim extraction, Filesystem verification, Cross-reference checks | ~150 |

### 3.2 Skill Format

```markdown
# {Skill Name}

<!-- SECTION: section-name -->
## Section Title

Content here...

<!-- SECTION: next-section -->
## Next Section

More content...
```

Each skill has:
- H1 title matching skill name
- 2+ sections marked with `<!-- SECTION: id -->` comments
- Pattern examples with code blocks where applicable
- Anti-patterns list at section end where relevant

### 3.3 Skill Assignment

| Agent | Always Loaded | Loaded on Demand |
|-------|--------------|------------------|
| developer (lifecycle) | git-workflow, testing-patterns, code-review-standards, security-basics | api-design, database-design, docker-workflow, documentation-standards, figma-integration, edge-cases, validation-patterns |
| mobile-dev | git-workflow, testing-patterns, code-review-standards, security-basics | edge-cases, figma-integration |

"Always loaded" means the agent's `<skills-registry>` lists them as default. "On demand" means they're available but only loaded when the task requires them (e.g., database-design loaded when working on a migration story).

## 4. Knowledge Fragments

19 language-specific knowledge fragments stored at `_symphony/dev/knowledge/{language}/`. Each under 150 lines. Loaded JIT based on detected project stack.

### 4.1 Fragment Inventory

**TypeScript (4 fragments):**
| File | Focus |
|------|-------|
| typescript/ts-conventions.md | Strict mode, utility types, generics, discriminated unions, barrel exports, path aliases |
| typescript/react-patterns.md | Typed props, hooks, context, server components, composition |
| typescript/nextjs-patterns.md | Route handlers, page props, metadata, SSR/SSG/ISR, middleware |
| typescript/express-patterns.md | Typed middleware, error handling, validation, request/response types |

**Angular (4 fragments):**
| File | Focus |
|------|-------|
| angular/angular-conventions.md | Standalone components, signals, module structure, CLI conventions |
| angular/angular-patterns.md | Reactive forms, guards, interceptors, resolvers, lazy loading |
| angular/ngrx-state.md | Store setup, effects, selectors, entity adapter, dev tools |
| angular/rxjs-patterns.md | Operators (switchMap, mergeMap, combineLatest), error handling, memory leaks, unsubscribe |

**Flutter (4 fragments):**
| File | Focus |
|------|-------|
| flutter/dart-conventions.md | Null safety, extensions, code generation (build_runner, freezed), linting |
| flutter/widget-patterns.md | Composition over inheritance, keys, builders, slivers, custom painters |
| flutter/state-management.md | Riverpod, BLoC, provider patterns, state restoration |
| flutter/platform-channels.md | Method channels, event channels, pigeon code gen, platform-specific code |

**Python (4 fragments):**
| File | Focus |
|------|-------|
| python/python-conventions.md | PEP 8, type hints, protocols, project structure (src layout), tooling (ruff, mypy, pytest) |
| python/django-patterns.md | Models, views, serializers, signals, admin, migrations |
| python/fastapi-patterns.md | Dependency injection, Pydantic models, async routes, middleware, OpenAPI |
| python/data-pipelines.md | ETL patterns, pandas, async processing, error recovery, idempotency |

**Go (3 fragments):**
| File | Focus |
|------|-------|
| go/go-conventions.md | Package layout, error handling (no exceptions), interfaces, naming, go vet/lint |
| go/go-stdlib-patterns.md | net/http, context propagation, io.Reader/Writer, encoding/json, sync primitives |
| go/go-testing-patterns.md | Table-driven tests, testify, httptest, benchmarks, test fixtures |

### 4.2 Fragment Format

Each knowledge fragment follows this structure:

```markdown
# {Language} — {Topic}

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
{How this integrates with frameworks, CI, other tools}
```

### 4.3 Stack Detection

The developer agent detects the project's tech stack by checking for marker files at the project root:

| Marker File | Stack | Knowledge Tier |
|-------------|-------|---------------|
| `package.json` + `angular.json` | Angular | typescript/ + angular/ |
| `package.json` + `next.config.*` | Next.js | typescript/ + (nextjs-patterns) |
| `package.json` (default) | TypeScript/React | typescript/ |
| `pubspec.yaml` | Flutter/Dart | flutter/ |
| `pyproject.toml` or `setup.py` or `requirements.txt` | Python | python/ |
| `go.mod` | Go | go/ |
| `package.json` + `react-native` in deps | React Native | typescript/ + flutter/ (mobile patterns) |

Detection runs once at agent activation. If multiple markers exist, the agent loads all matching tiers (polyglot project support).

## 5. Test Strategy

### 5.1 New Test Files

**`tests/agents-dev.test.js`** — Validates:
- `_base-dev.md` exists and has story execution protocol sections
- `mobile-dev.md` has correct XML structure: frontmatter (id, name, role, model: opus, max_lines), `<agent>`, `<persona>`, `<knowledge-sources>` (trusted/verify/untrusted), `<disciplines>` (self-critique + anti-rationalization with 2+ pairs), `<workflows-owned>`, `<memory-sidecar>`
- Existing `developer.md` has `<skills-registry>` or `<base-dev>` reference

**`tests/skills.test.js`** — Validates:
- All 11 skill files exist in `_symphony/dev/skills/`
- Each skill is under 300 lines
- Each skill has H1 title
- Each skill has 2+ `<!-- SECTION: -->` markers

**`tests/knowledge.test.js`** — Validates:
- All 19 knowledge fragments exist in correct `_symphony/dev/knowledge/{lang}/` directories
- 5 language directories exist: typescript/, angular/, flutter/, python/, go/
- Each fragment is under 150 lines
- Each fragment has: H1 title, `## Pattern Examples`, `## Anti-Patterns`, `## Integration Points`

### 5.2 Structure Test Updates

`tests/structure.test.js` gets new assertions:
- `_symphony/dev/agents/_base-dev.md` exists
- `_symphony/dev/agents/mobile-dev.md` exists
- `_symphony/dev/skills/` contains 11 `.md` files
- `_symphony/dev/knowledge/` contains 5 subdirectories
- Total knowledge fragment count: 19

### 5.3 Expected Test Count Impact

Current: 870 tests across 18 test files.
New: ~150 tests across 3 new test files + ~10 new assertions in structure.test.js.
Target: ~1030 tests across 21 test files.

## 6. Config Updates

### 6.1 manifest.yaml

```yaml
dev:
  version: "0.0.2-alpha.1"  # bumped from 0.0.1
  description: "Developer agents, skills, knowledge fragments"
```

### 6.2 lifecycle-sequence.yaml

No changes needed. The existing `developer` agent is already wired to `dev-story`, `code-review`, and `quick-dev` workflows.

## 7. Implementation Swarm Plan

32 new files organized into 3 parallel waves:

### Wave 1: Skills + Knowledge (4 parallel agents)

| Agent | Files | Count |
|-------|-------|-------|
| Swarm-A: Skills batch 1 | git-workflow, api-design, database-design, docker-workflow, testing-patterns, code-review-standards | 6 |
| Swarm-B: Skills batch 2 | documentation-standards, security-basics, figma-integration, edge-cases, validation-patterns | 5 |
| Swarm-C: Knowledge batch 1 | typescript/ (4) + angular/ (4) | 8 |
| Swarm-D: Knowledge batch 2 | flutter/ (4) + python/ (4) + go/ (3) | 11 |

### Wave 2: Agents (2 parallel agents)

| Agent | Files | Count |
|-------|-------|-------|
| Swarm-E: Base + mobile | _base-dev.md, mobile-dev.md | 2 |
| Swarm-F: Developer enhancement | Modify existing developer.md (add skills-registry, knowledge-detection, base-dev ref) | 1 |

### Wave 3: Tests + Config (1 agent)

| Agent | Files | Count |
|-------|-------|-------|
| Swarm-G: Tests | agents-dev.test.js, skills.test.js, knowledge.test.js, structure.test.js updates, manifest.yaml bump | 5 |

**Total: 7 agent dispatches across 3 waves. 32 new files + 2 modified files.**

## 8. Acceptance Criteria

- [ ] `npm test` passes with all new tests (target ~1030 total)
- [ ] All 11 skills exist, under 300 lines each, with SECTION markers
- [ ] All 19 knowledge fragments exist, under 150 lines each, with required sections
- [ ] mobile-dev.md passes same structural validation as creative agents
- [ ] _base-dev.md defines story execution protocol
- [ ] Existing developer.md references base-dev and has skills-registry
- [ ] manifest.yaml shows dev module at 0.0.2-alpha.1
- [ ] No file exceeds CLAUDE.md line limits (200 agent, 300 skill, 150 knowledge)
