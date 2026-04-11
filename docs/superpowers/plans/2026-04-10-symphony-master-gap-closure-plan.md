# Symphony Master Gap-Closure Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close every gap in the Symphony Framework Comparison Heatmap, bringing Symphony from ~20% implemented to feature-complete by absorbing the best of Gaia (28 agents, 77 workflows), GSD (70 commands, 10-tool support), and Gem Team (15 agents, self-critique patterns).

**Architecture:** This is a meta-plan that decomposes into 7 sub-plans (matching Spec 2b–8). Each sub-plan is independently executable and produces working, testable software. Sub-plans follow the spec dependency chain: Spec 2b → Specs 3+4 → Spec 5 → Spec 6, with Spec 7 parallel after 2b, Spec 8 last.

**Current State (v0.0.2-alpha.1, ~20% built):**
- IMPLEMENTED: workflow-engine.xml (Kernel A), task-runner.xml, config, tests, CLI
- STUBS: conductor, wave-executor, gate-enforcer, all 9 protocols, both adapters
- EMPTY: 0 agents, 0 workflows, 0 memory content

**Reference Frameworks:**
- Gaia: `/Users/stevenagh76/Documents/solution-comapre/Gaia-framework/`
- GSD: `/Users/stevenagh76/Documents/solution-comapre/get-shit-done/`
- Gem Team: `/Users/stevenagh76/Documents/solution-comapre/gem-team-main/`

---

## Dependency Graph

```
Spec 1 (Architecture) .............. DONE
Spec 2a (Core Engine Execution) ... DONE (workflow-engine + task-runner)
    │
    ├──► Sub-Plan 1: Spec 2b (Core Engine Remaining)    ◄── START HERE
    │        │
    │        ├──► Sub-Plan 2: Spec 3 (Conductor)
    │        ├──► Sub-Plan 3: Spec 4 (Wave Executor)
    │        └──► Sub-Plan 4: Spec 5 (Lifecycle Agents & Workflows)
    │                 │
    │                 └──► Sub-Plan 5: Spec 6 (Dev / Creative / Testing)
    │
    ├──► Sub-Plan 6: Spec 7 (Adapters)  ◄── can run parallel after 2b
    │         │
    │         └──► Sub-Plan 7: Spec 8 (Release Polish)
    │
    └──► Dashboard Updates (after each sub-plan completes)
```

---

## Sub-Plan 1: Core Engine Remaining (Spec 2b)

**Priority:** CRITICAL — blocks everything else
**Estimated tasks:** 15–20
**Absorbs from:** Gem Team (confidence thresholds, debugger dispatch pattern)

### What to build

| Component | Status | What's needed |
|---|---|---|
| gate-enforcer.xml | STUB → RUNTIME | Pre-start and post-complete gate mechanism. HALT on failure. Read gate declarations from workflow.yaml. |
| 9 protocols | ALL STUBS → RUNTIME | Implement each: self-critique (confidence ≥0.85, retry+escalate), trust-levels (Trusted/Verify/Untrusted tagging), anti-rationalization (Excuse→Rebuttal table), diagnose-then-fix (debugger dispatch before retry), status-sync (atomic story/sprint updates), review-gate-check (6-gate with adaptive per §2.8), checkpoint-resume (SHA256 verification), memory-hygiene (stale detection), artifact-enrichment-hook (post-step hooks). |
| Memory system | EMPTY → POPULATED | Conductor sidecar schema, agent sidecar schema, checkpoint file format. |
| Interaction modes | NOT WIRED | Wire normal/YOLO/planning pacing into workflow-engine.xml. |

### Absorb from Gem Team
- **Confidence thresholds:** Gem uses 0.85 for agent self-critique and 0.7 for debugger confidence. Symphony spec already defines 0.85 — confirm alignment and absorb the 0.7 debugger threshold into diagnose-then-fix protocol.
- **Debugger dispatch pattern:** Gem's orchestrator dispatches gem-debugger with error_context, validates confidence, injects diagnosis. Mirror this in diagnose-then-fix protocol.
- **Max retry budgets:** Gem uses max 2 self-critique loops, max 3 retries per wave. Adopt same limits.

### Files to create/modify
- Modify: `_symphony/core/engine/gate-enforcer.xml` (stub → runtime)
- Modify: `_symphony/core/protocols/self-critique.xml` (stub → runtime)
- Modify: `_symphony/core/protocols/trust-levels.xml` (stub → runtime)
- Modify: `_symphony/core/protocols/anti-rationalization.xml` (stub → runtime)
- Modify: `_symphony/core/protocols/diagnose-then-fix.xml` (stub → runtime)
- Modify: `_symphony/core/protocols/status-sync.xml` (stub → runtime)
- Modify: `_symphony/core/protocols/review-gate-check.xml` (stub → runtime)
- Modify: `_symphony/core/protocols/checkpoint-resume.xml` (stub → runtime)
- Modify: `_symphony/core/protocols/memory-hygiene.xml` (stub → runtime)
- Modify: `_symphony/core/protocols/artifact-enrichment-hook.xml` (stub → runtime)
- Modify: `_symphony/core/engine/workflow-engine.xml` (wire interaction modes)
- Create: `_symphony/_memory/conductor-sidecar/schema.md`
- Create: `_symphony/_memory/sidecar-schema.md` (generic agent sidecar format)
- Create: `tests/engine/gate-enforcer.test.js`
- Create: `tests/engine/protocols.test.js`
- Modify: `tests/engine/engine.test.js` (add gate + protocol fixture tests)

### Spec needed first
- [ ] Write `docs/superpowers/specs/2026-04-10-symphony-core-engine-remaining-design.md`
- [ ] Get user approval on spec before implementation

---

## Sub-Plan 2: Conductor (Spec 3)

**Priority:** HIGH — enables smart routing (Symphony's signature feature #1)
**Estimated tasks:** 12–15
**Depends on:** Sub-Plan 1
**Absorbs from:** Gem Team (gray area detection, complexity classification), Gaia (lifecycle-sequence branching)

### What to build

| Component | What's needed |
|---|---|
| conductor.xml | STUB → RUNTIME. Goal parsing, phase detection (§8.1 rules), routing decision, confidence scoring (≥0.80 auto-dispatch), routing memory sidecar. |
| Intent parser | Regex-based or LLM-based classifier for intent verb + target noun + scope hint. |
| Phase detection | Evaluate rules in order per §8.1. Cross-reference project artifact state. |
| Confidence scoring | 3-component score: intent match (0–0.4), project state clarity (0–0.3), prior routing memory (0–0.3). |
| User confirmation UI | Top-2 routing candidates when confidence < 0.80. |

### Absorb from Gem Team
- **Gray area detection:** Before routing, detect ambiguities (APIs, visual features, business logic, data format). Generate context-aware multiple-choice questions. Add as a Conductor sub-step before routing.
- **Complexity classification:** Auto-classify tasks as simple/medium/complex to decide research depth and execution parallelism. Feed into routing decision.

### Absorb from Gaia
- **Lifecycle-sequence branching:** Implement `lifecycle-sequence.yaml` equivalent with on_pass/on_fail routing, primary/alternatives, standalone workflows. Conductor consults this for next-step suggestions after workflow completion.

### Files to create/modify
- Modify: `_symphony/core/engine/conductor.xml` (stub → runtime)
- Create: `_symphony/_config/lifecycle-sequence.yaml`
- Create: `_symphony/_memory/conductor-sidecar/routing-log.md` (schema)
- Create: `tests/engine/conductor.test.js`

### Spec needed first
- [ ] Write `docs/superpowers/specs/2026-04-10-symphony-conductor-design.md`

---

## Sub-Plan 3: Wave Executor (Spec 4)

**Priority:** HIGH — enables parallel execution (Symphony's signature feature #2)
**Estimated tasks:** 12–15
**Depends on:** Sub-Plan 1
**Absorbs from:** Gem Team (wave execution pattern with conflict detection)

### What to build

| Component | What's needed |
|---|---|
| wave-executor.xml | STUB → RUNTIME. DAG building from step dependencies, topological sort, wave grouping (≤4 per wave), parallel subagent dispatch, integration gates at wave boundaries. |
| DAG format | On-disk format for step dependency declarations in instructions.xml. |
| Conflict detection | Two steps writing same file, contradictory decisions. |
| Integration gate | Aggregate outputs, run self-critique on aggregated, HALT on conflict. |
| Failure recovery | Faulted step → debugger dispatch → diagnosis → retry (max 2). |

### Absorb from Gem Team
- **Wave execution:** Gem's orchestrator already does waves with up to 4 concurrent subagents, intra-wave dependencies, and integration checks. Port the pattern: prepare wave → delegate tasks → integration check → synthesize results.
- **Conflict detection:** Gem checks `conflicts_with` for tasks sharing file targets. Adopt same mechanism.
- **Sub-phase splitting:** Gem splits waves into sub-phases (A1 independent, A2 dependent). Adopt for intra-wave dependency handling.

### Files to create/modify
- Modify: `_symphony/core/engine/wave-executor.xml` (stub → runtime)
- Create: `tests/engine/wave-executor.test.js`
- Create: `tests/fixtures/wave-hello/` (test fixture for parallel-waves mode)

### Spec needed first
- [ ] Write `docs/superpowers/specs/2026-04-10-symphony-wave-executor-design.md`

---

## Sub-Plan 4: Lifecycle Agents & Workflows (Spec 5)

**Priority:** CRITICAL — this is where the 0-agents, 0-workflows gap gets closed
**Estimated tasks:** 40–60 (largest sub-plan, may sub-decompose by phase)
**Depends on:** Sub-Plans 1, 2, 3
**Absorbs from:** Gaia (28 agents as reference, 77 workflow patterns, party mode, stakeholders), Gem Team (agent persona structure)

### What to build

**Agents (~15 personas):**

| Agent | Role | Absorb From |
|---|---|---|
| Conductor (Maestro) | Smart orchestrator | Gaia: Orchestrator, Gem: gem-orchestrator |
| Product Manager | PRD, briefs, epics, stories | Gaia: Derek (PM) |
| Architect | System architecture | Gaia: Theo (Architect) |
| Research Analyst | Market/domain/tech research | Gaia: Elena (Analyst) |
| UX Designer | UX specs, wireframes | Gaia: Christy (UX Designer) |
| Developer | Code implementation | Gaia: Cleo/Lena/Hugo/etc (tech-specific devs) |
| Test Architect | Test strategy, ATDD, QA | Gaia: Sable (Test Architect) + Vera (QA) |
| Security Agent | Threat model, security review | Gaia: Zara (Security) |
| DevOps Agent | Infra, CI/CD, deployment | Gaia: Soren (DevOps) |
| Reviewer | Code review, quality | Gem: gem-reviewer, gem-critic |
| Scrum Master | Sprint planning, status | Gaia: Nate (SM) |
| Tech Writer | Documentation | Gaia: Iris (Tech Writer) |
| Performance Agent | Perf analysis, optimization | Gaia: Juno (Performance) |
| Validator | Artifact validation, gates | Gaia: Val (Validator) |
| Debugger | Root-cause analysis | Gem: gem-debugger |

**Workflows per phase (from lifecycle diagram):**

| Phase | Count | Key workflows |
|---|---|---|
| 1-analysis | 6 | brainstorm (ensemble), market-research, domain-research, tech-research, advanced-elicitation, product-brief |
| 2-planning | 5 | create-prd, validate-prd, edit-prd, create-ux, review-a11y |
| 3-solutioning | 9+1 | create-arch, edit-arch, test-design, create-epics, atdd, threat-model, infra-design, trace, readiness-check + Overture |
| 4-implementation | 14 | create-story, validate-story, sprint-plan, dev-story, check-dod, code-review, qa-tests, security-review, run-all-reviews (waves), review-gate, sprint-status, retro (ensemble), change-request, correct-course |
| 5-deployment | 4 | release-plan, rollback-plan, deploy-checklist, post-deploy |
| Anytime | 8 | quick-spec, quick-dev, memory-hygiene, document-project, performance-review, tech-debt-review, party (ensemble), create-stakeholder |

**Total: ~15 agents + ~47 workflows**

### Absorb from Gaia
- **Agent personas:** Use Gaia's named personas as inspiration (Elena, Derek, Theo, etc.) but create fresh Symphony personas with distinct names, voices, and the Symphony-specific disciplines (<self-critique>, <anti-rationalization>, <knowledge-sources> with trust levels).
- **Workflow structure:** Each Gaia workflow has instructions.xml + checklist.md + template.md. Symphony uses the same 4-file structure (workflow.yaml + instructions.xml + checklist.md + template.md). Port the step logic, adapt to Symphony's engine mandates.
- **Party Mode:** Port /gaia-party as /symphony-party using ensemble execution mode with turn policies. Gaia's party mode is sequential discussion; Symphony's ensemble mode is a structural upgrade.
- **Stakeholder personas:** Port /gaia-create-stakeholder. Create stakeholder persona files that can be loaded as ensemble participants.
- **Lifecycle sequence:** Port lifecycle-sequence.yaml branching logic (on_pass/on_fail, primary/alternatives) for Conductor next-step suggestions.

### Absorb from Gem Team
- **Discuss phase:** Before routing to a workflow, Conductor can optionally run a discuss phase that detects gray areas and generates multiple-choice questions. Port Gem's gray area detection logic.
- **PRD.yaml format:** Offer as alternative PRD template with structured IN SCOPE / OUT OF SCOPE / NEEDS CLARIFICATION sections.

### Files to create
- Create: `_symphony/lifecycle/agents/*.md` (15 agent persona files)
- Create: `_symphony/lifecycle/workflows/1-analysis/brainstorm/` (4 files each, x6 workflows)
- Create: `_symphony/lifecycle/workflows/2-planning/create-prd/` (x5 workflows)
- Create: `_symphony/lifecycle/workflows/3-solutioning/create-arch/` (x10 workflows)
- Create: `_symphony/lifecycle/workflows/4-implementation/dev-story/` (x14 workflows)
- Create: `_symphony/lifecycle/workflows/5-deployment/release-plan/` (x4 workflows)
- Create: `_symphony/lifecycle/workflows/anytime/party/` (x8 workflows)
- Create: `_symphony/lifecycle/templates/*.md` (document templates)
- Create: `_symphony/_config/lifecycle-sequence.yaml` (if not created in Sub-Plan 2)
- Create: `tests/lifecycle/agents.test.js`
- Create: `tests/lifecycle/workflows.test.js`

### Spec needed first
- [ ] Write `docs/superpowers/specs/2026-04-10-symphony-lifecycle-agents-workflows-design.md`
- [ ] May sub-decompose into Spec 5a (agents) + Spec 5b (Phase 1–3 workflows) + Spec 5c (Phase 4–5 workflows) + Spec 5d (Anytime workflows)

---

## Sub-Plan 5: Dev, Creative, and Testing Modules (Spec 6)

**Priority:** HIGH — closes the creative and testing gaps where Gaia leads
**Estimated tasks:** 25–35
**Depends on:** Sub-Plan 4
**Absorbs from:** Gaia (7 creative workflows, 15 testing workflows, creative agents, test architect), Gem Team (browser/mobile testers)

### What to build

**Dev Module:**

| Component | What's needed |
|---|---|
| Developer agents | Tech-specific variants (TypeScript, Python, Go, Java, Flutter, etc.) using _base-dev inheritance pattern from Gaia |
| Skills | testing-patterns, code-review-standards, refactoring-patterns |
| Knowledge | Per-language knowledge fragments (JIT-loaded) |

**Creative Module (absorb from Gaia):**

| Workflow | Mode | Absorb from Gaia |
|---|---|---|
| /symphony-design-thinking | ensemble | /gaia-design-thinking (Lyra - Design Thinking Expert) |
| /symphony-innovation | ensemble | /gaia-innovation (Orion - Innovation Strategist) |
| /symphony-problem-solving | ensemble | /gaia-problem-solving (Nova - Problem-Solving Expert) |
| /symphony-storytelling | sequential | /gaia-storytelling (Elara - Master Storyteller) |
| /symphony-slide-deck | sequential | /gaia-slide-deck (Vermeer - Presentation Designer) |
| /symphony-pitch-deck | sequential | /gaia-pitch-deck (Vermeer) |
| /symphony-creative-sprint | ensemble | /gaia-creative-sprint (multi-agent) |

**Creative Agents:**
- Brainstorming Coach (from Gaia: Rex)
- Design Thinking Coach (from Gaia: Lyra)
- Innovation Strategist (from Gaia: Orion)
- Storyteller (from Gaia: Elara)
- Presentation Designer (from Gaia: Vermeer)
- Problem Solver (from Gaia: Nova)

**Testing Module (absorb from Gaia + Gem):**

| Workflow | Absorb From |
|---|---|
| /symphony-test-design | Gaia: /gaia-test-design |
| /symphony-test-framework | Gaia: /gaia-test-framework |
| /symphony-test-automation | Gaia: /gaia-test-automate |
| /symphony-test-review | Gaia: /gaia-test-review |
| /symphony-test-gap-analysis | Gaia: /gaia-test-gap-analysis |
| /symphony-a11y-testing | Gaia: /gaia-a11y-testing |
| /symphony-perf-testing | Gaia: /gaia-perf-testing |
| /symphony-mobile-testing | Gaia: /gaia-mobile-testing + Gem: gem-mobile-tester |
| /symphony-browser-testing | Gem: gem-browser-tester |
| /symphony-ci-setup | Gaia: /gaia-ci-setup |
| /symphony-ci-edit | Gaia: /gaia-ci-edit |
| /symphony-nfr | Gaia: /gaia-nfr |
| /symphony-teach-testing | Gaia: /gaia-teach-testing |

### Files to create
- Create: `_symphony/dev/agents/*.md` (tech-specific developer agents)
- Create: `_symphony/dev/skills/*.md` (shared dev skills)
- Create: `_symphony/dev/knowledge/**/*.md` (per-language knowledge fragments)
- Create: `_symphony/creative/agents/*.md` (6 creative agents)
- Create: `_symphony/creative/workflows/*/` (7 creative workflows)
- Create: `_symphony/testing/agents/test-architect.md`
- Create: `_symphony/testing/workflows/*/` (13 testing workflows)
- Create: `tests/modules/dev.test.js`
- Create: `tests/modules/creative.test.js`
- Create: `tests/modules/testing.test.js`

### Spec needed first
- [ ] Write `docs/superpowers/specs/2026-04-10-symphony-dev-creative-testing-design.md`

---

## Sub-Plan 6: Runtime Adapters (Spec 7)

**Priority:** MEDIUM — can run parallel with Sub-Plans 2–5 after Sub-Plan 1
**Estimated tasks:** 10–15
**Depends on:** Sub-Plan 1
**Absorbs from:** GSD (multi-tool adapter patterns for 10+ tools)

### What to build

| Component | What's needed |
|---|---|
| Claude Code adapter | translator.js → real implementation. Generate .claude/commands/symphony-*.md from workflow inventory. |
| Copilot adapter | translator.js → real implementation. Generate .github/prompts/symphony-*.prompt.md. |
| Future adapter stubs | Gemini CLI, Cursor, Codex adapter manifests (from GSD's multi-tool architecture). |
| Install-time pipeline | `npx symphony-framework init .` generates all command files from Core workflows. |
| Update pipeline | `npx symphony-framework update` regenerates when workflows change. |

### Absorb from GSD
- **Multi-tool patterns:** GSD supports Claude Code, Gemini CLI, OpenCode, Kilo, Codex, Copilot, Trae, Cline, Augment. Study their `bin/gsd-tools.cjs` and installer to understand how they generate per-tool command files. Symphony's adapter model is architecturally cleaner (pure file generators), but GSD has the breadth.
- **Runtime abstraction:** GSD's `ARCHITECTURE.md` §Runtime Abstraction shows how they detect which AI tool is running and adapt. Consider for Symphony's adapter detection.

### Files to modify/create
- Modify: `adapters/claude-code/translator.js` (stub → implementation)
- Modify: `adapters/copilot/translator.js` (stub → implementation)
- Create: `adapters/gemini-cli/` (adapter.yaml + translator.js + templates/)
- Create: `adapters/cursor/` (adapter.yaml + translator.js + templates/)
- Modify: `lib/installer.js` or `bin/symphony-cli.js` (install/update pipeline)
- Create: `tests/adapters/claude-code.test.js`
- Create: `tests/adapters/copilot.test.js`

### Spec needed first
- [ ] Write `docs/superpowers/specs/2026-04-10-symphony-adapters-design.md`

---

## Sub-Plan 7: Release Polish & Integrations (Spec 8)

**Priority:** LOW — lands last
**Estimated tasks:** 10–15
**Depends on:** Sub-Plans 4, 5, 6
**Absorbs from:** GSD (workspace isolation, internationalization), Gaia (branding quality)

### What to build

| Component | What's needed |
|---|---|
| Installer UX | Interactive `npx symphony-framework init` with prompts for adapter selection, vault toggle, project type. |
| Obsidian integration | `_symphony/integrations/obsidian/` — hook.js, tag taxonomy, wikilink injection, MOC generation, Dataview queries. |
| Workspace isolation | Port GSD's /gsd-new-workspace concept — isolated worktrees with independent Symphony state. |
| README | Comprehensive README.md with usage, architecture overview, getting started. |
| Branding | Logo, color palette (Anthropic warm tones), visual identity. |
| npm publish | Package.json polish, npm publish pipeline, version automation. |
| Lifecycle diagram update | Update Symphony_Lifecycle_Activity_Diagram.html and Symphony_Framework_Comparison.html to reflect all implemented features. |

### Spec needed first
- [ ] Write `docs/superpowers/specs/2026-04-10-symphony-release-polish-design.md`

---

## Execution Order & Timeline

| Order | Sub-Plan | Spec | Blocks | Can Parallel With |
|---|---|---|---|---|
| 1 | Core Engine Remaining (2b) | Need to write | Everything | Nothing — start here |
| 2a | Conductor (3) | Need to write | 4, 5 | 3 (Wave Executor), 6 (Adapters) |
| 2b | Wave Executor (4) | Need to write | 4, 5 | 2 (Conductor), 6 (Adapters) |
| 2c | Adapters (7) | Need to write | 7 | 2 (Conductor), 3 (Wave Executor) |
| 3 | Lifecycle Agents & Workflows (5) | Need to write | 5 | 6 (Adapters) |
| 4 | Dev/Creative/Testing (6) | Need to write | 7 | 6 (Adapters) |
| 5 | Release Polish (8) | Need to write | — | Nothing — lands last |

**Total estimated tasks across all sub-plans: ~130–175**

---

## How to Execute

For each sub-plan:

1. **Write the spec** — brainstorm → design → spec doc → user approval
2. **Write the detailed implementation plan** — one plan per sub-plan with full code blocks, exact file paths, TDD steps
3. **Execute via subagent-driven-development** — one fresh agent per task, review between tasks
4. **Update dashboards** — refresh both HTML files after each sub-plan completes
5. **Run tests** — `npm test` must pass after every sub-plan

**Recommended first action:** Write the Spec 2b design doc (Core Engine Remaining) since it blocks everything else.

---

## Heatmap Gap → Sub-Plan Mapping

| Heatmap Gap | Priority | Closed By |
|---|---|---|
| Lifecycle agents (implemented) | ! HIGH | Sub-Plan 4 |
| Lifecycle workflows (implemented) | ! HIGH | Sub-Plan 4 |
| Creative workflows | M MED | Sub-Plan 5 |
| Testing depth | M MED | Sub-Plan 5 |
| Multi-tool support | M MED | Sub-Plan 6 |
| Lifecycle sequence branching | M MED | Sub-Plan 2 |
| Gray area detection | M MED | Sub-Plan 2 |
| Workspace isolation | L LOW | Sub-Plan 7 |
| Vault integration | L LOW | Sub-Plan 7 |
| Fresh context per agent | L LOW | Sub-Plan 3 (wave executor gives fresh context per subagent) |
