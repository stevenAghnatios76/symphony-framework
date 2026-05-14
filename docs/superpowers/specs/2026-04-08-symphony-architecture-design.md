# Symphony — Architecture Design Spec

> **Spec:** 1 of 8 (Architecture)
> **Status:** Draft — awaiting user review
> **Date:** 2026-04-08
> **Scope:** Defines the identity, layered architecture, directory layout, engine contract, agent/workflow file shape, adapter model, and signature feature contracts for the Symphony framework. Does NOT define concrete implementations of the engine, orchestrator, lifecycle agents, or adapters — those are covered in dedicated follow-up specs.

---

## 1. Identity

**Name:** Symphony

**One-sentence description:** Symphony is an AI agent framework that lets you describe a goal and dispatches a coordinated team of specialist agents in parallel to deliver it.

**Tagline:** *Orchestrate your code.*

**Philosophy:** A conductor coordinates many instruments playing simultaneously to produce one coherent work. Symphony applies that metaphor to AI-assisted software development: a smart orchestrator reads your goal, picks the right agents and workflows, and dispatches them in parallel waves with integration gates between waves. The user provides a goal; Symphony provides a team.

**The two things Symphony must be known for:**

1. **Smart orchestration** — the user describes what they want; Symphony figures out the phase, the workflow, and the agents. No command memorization.
2. **Parallel execution** — agents run concurrently in waves with integration gates between waves, producing multi-step outputs faster than any sequential framework can.

**Non-goals for Symphony (what it deliberately isn't):**

- It is not a collapsed single-file-per-agent framework. Agents, workflows, instructions, and checklists remain separate files because separation of concerns is a feature, not a bug.
- It is not a tool-specific product. Symphony Core runs tool-agnostic; individual AI tools (Claude Code, GitHub Copilot, and future tools) are integrated through thin adapters.
- It is not a prompt library. Every agent has a persona, persistent memory, and enforced disciplines. It is a framework, not a prompt collection.
- It does not relax quality gates for speed. Parallelism is achieved through wave dispatch, not through skipping checks.

---

## 2. Architectural Principles

These principles are load-bearing. Any implementation decision in any follow-up spec must respect them.

### 2.1 Dual-layer architecture

Symphony has exactly two layers:

- **Core** — tool-agnostic runtime. Engine, agents, workflows, protocols, memory, gates, traceability. Lives in `_symphony/`.
- **Adapters** — tool-specific translators. Each adapter converts Core into a command surface for one AI tool. Lives in `adapters/{adapter-id}/` in the repo; adapters run at install time and emit files into the user project.

The dependency arrow is strictly one-way: **adapters depend on Core; Core never depends on an adapter.** Core is unaware of which adapters exist except through the adapter registry (a list of YAML manifests).

### 2.2 Adapters are thin translators

An adapter's only job is to translate a Symphony workflow into a tool-specific command surface (slash commands, prompt files, etc.). Adapters contain zero business logic. If a behavior needs to change, it changes in Core, and both command surfaces pick it up on the next `symphony update`. If we ever find ourselves writing business logic in an adapter, we have broken the architecture and must refactor back into Core.

### 2.3 Disciplines enforced by the engine, not by agents

The four cross-cutting disciplines — self-critique, trust levels, anti-rationalization, diagnose-then-fix — are invoked by the engine, not opted into by individual agents. Every agent gets them for free. Writing a new agent cannot accidentally skip a discipline; the engine enforces them on every step.

### 2.4 Quality gates HALT, they don't warn

All quality gates are enforced, not advisory. A failed gate stops the workflow. Pre-start gates run before the workflow begins; post-complete gates run before it is marked done. No workflow can be marked complete with failing tests or unmet prerequisites.

### 2.5 Full traceability, brief to code

Every artifact declares what it traces to. The traceability chain is: product-brief → PRD → architecture → epics → stories → code → tests. Any code change can be walked backwards through this chain to the original product requirement.

For codebases that predate Symphony, the chain is rooted in Overture-generated artifacts (see §2.7). The Overture produces discovery documents (architecture map, API catalog, dependency graph, NFR baseline) that serve as the origin of the traceability chain for pre-existing code. This keeps traceability intact even when Symphony did not author the original code.

### 2.6 Context budget discipline

- 40K tokens max per agent activation
- Agent persona files ≤ 200 lines
- Instruction step files ≤ 150 lines
- Skill files ≤ 300 lines
- Any `.md` artifact ≤ 1000 lines (split with index + section files when exceeded)
- JIT loading for skills and knowledge fragments — never pre-load

### 2.7 Two entry modes: Greenfield and Overture

Symphony supports exactly two ways of beginning work on a project:

- **Greenfield** — starting a new project from scratch. The user enters at Phase 1 (Analysis), builds a product brief, and progresses through the lifecycle. All artifacts are authored inside Symphony.
- **Overture** — onboarding an existing codebase. The user runs the Overture workflow, which scans the code in parallel waves, generates discovery documentation (architecture map, API catalog, UX flow map, dependency graph, NFR baseline), produces a gap-focused PRD comparing "what exists" to "what the user wants to change," and emits artifacts that feed directly into Phase 3 (Solutioning). The user continues normal lifecycle workflows from Phase 3 onward.

The Conductor detects which mode applies by inspecting project state at first invocation (see §8.1 phase detection rules). Both modes produce the same artifact shapes downstream — only the origin of the traceability chain differs.

**Why this is a principle, not just a workflow:** Overture is a second entry point with distinct traceability semantics. Treating it as a principle forces every follow-up spec to consider both entry modes rather than assuming greenfield is the only starting state.

### 2.8 Adaptive quality gates by story type

The six-gate review process is not one-size-fits-all. Symphony inspects each story's traceability target to choose the appropriate gate criteria:

- **Application stories** (traces to functional requirements: FR-###, NFR-###) — standard gates: code review, QA tests, security review, test automation, test review, performance review.
- **Infrastructure stories** (traces to infra/operational/security requirements: IR-###, OR-###, SR-###) — adapted gates:

| Standard Gate | Infrastructure Equivalent | Change |
|---|---|---|
| Code Review | IaC Code Review | Same workflow, IaC expertise expected |
| QA Tests | Policy-as-Code Validation | `checkov`/`tfsec`/OPA pass replaces unit/integration tests |
| Security Review | Security Review | Unchanged — critical for infrastructure |
| Test Automation | Plan Validation + Drift Checks | `terraform plan` assertions replace automated test coverage |
| Test Review | Policy Review | OPA/Rego coverage replaces test quality review |
| Performance Review | Cost Review + Scaling Validation | Cost analysis and autoscaling validation replace load testing |

**Detection mechanism:** The `review-gate-check` protocol (§5.2) reads each story's `traces_to` field and checks the requirement-ID prefix. Each story is evaluated independently — a platform project with mixed application and infrastructure stories gets per-story gate selection based on the story's own requirement prefix. Code review and security review stay unchanged for all story types.

**Why this is a principle:** gate adaptation is a cross-cutting rule, not a per-workflow setting. Every workflow that participates in the review process must respect it. Treating it as a principle prevents follow-up specs from silently assuming "the six gates always mean unit tests."

### 2.9 Extensible post-step hooks

Symphony's engine supports **post-step hooks** — small, non-blocking functions that run after a workflow step completes to enrich or export the step's output. Hooks enable optional integrations (vault tools, knowledge graphs, observability tools) without touching Core workflow logic.

**Rules:**
1. Hooks are opt-in per installation, configured in `_symphony/_config/global.yaml`.
2. Hook failures MUST NOT halt a workflow. A failing hook logs a warning and the workflow continues.
3. Hooks have read/write access to the step's output artifacts but MUST NOT modify step inputs or intermediate state.
4. Hooks run AFTER the step's template-output has been persisted. They modify the artifact on disk; they do not change what the engine thinks the step produced.
5. Multiple hooks can be registered; they run sequentially in declared order.

**Why this is a principle:** keeping Core free of vault- or integration-specific code is load-bearing for the dual-layer architecture. Any third-party integration that wants to enrich artifacts must use this hook mechanism — no exceptions, no direct Core edits.

---

## 3. Top-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AI Tool (user-facing)                    │
│   Claude Code  │  GitHub Copilot  │  (future: Cursor, ...)  │
└────────┬────────────────┬──────────────────┬────────────────┘
         │                │                  │
┌────────▼────────┐ ┌─────▼─────┐   ┌────────▼──────────┐
│  claude-code    │ │  copilot  │   │  future adapter   │
│    adapter      │ │  adapter  │   │                   │
│                 │ │           │   │                   │
│ /symphony-*     │ │ .github/  │   │ (tool-specific    │
│ slash commands  │ │ prompts/  │   │  command shells)  │
└────────┬────────┘ └─────┬─────┘   └────────┬──────────┘
         │                │                  │
         └────────────────┼──────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                      SYMPHONY CORE                          │
│                     (tool-agnostic)                         │
│                                                             │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│   │ CONDUCTOR   │  │ WAVE        │  │ LIFECYCLE   │         │
│   │ (smart      │  │ EXECUTOR    │  │ (5 phases + │         │
│   │  orch.)     │  │ (parallel)  │  │  gates)     │         │
│   └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                             │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│   │ AGENTS      │  │ WORKFLOWS   │  │ MEMORY      │         │
│   │ (personas + │  │ (multi-file │  │ (sidecars + │         │
│   │  trust lvl) │  │  structure) │  │  checkpts)  │         │
│   └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                             │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│   │ GATES       │  │ TRACEABILITY│  │ DISCIPLINES │         │
│   │ (HALT,      │  │ (brief→code │  │ (self-crit, │         │
│   │  enforced)  │  │  matrix)    │  │  anti-rat.) │         │
│   └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

The diagram is normative. Any follow-up spec must fit components into one of the boxes above (or propose a new box and justify it).

---

## 4. Directory Layout

### 4.1 Symphony repo (the source of truth)

```
symphony-framework/
├── README.md
├── LICENSE
├── CLAUDE.md                          # top-level guide for Claude Code
├── package.json                       # npm: symphony-framework
├── bin/symphony-cli.js                # npx entry point
├── symphony-install.sh                # shell installer alternative
├── lib/                               # installer internals, runtime helpers
│
├── _symphony/                         # THE CORE (installed into user projects as-is)
│   ├── _config/
│   │   ├── global.yaml                # project settings — single source of truth
│   │   └── manifest.yaml              # module versions
│   │
│   ├── core/
│   │   ├── engine/
│   │   │   ├── conductor.xml          # smart orchestrator — entry point for all commands
│   │   │   ├── wave-executor.xml      # parallel dispatcher with integration gates
│   │   │   ├── workflow-engine.xml    # sequential step execution
│   │   │   ├── gate-enforcer.xml      # HALT-gate mechanism
│   │   │   └── task-runner.xml        # standalone task execution
│   │   │
│   │   ├── protocols/                 # cross-cutting behaviors
│   │   │   ├── status-sync.xml
│   │   │   ├── review-gate-check.xml
│   │   │   ├── self-critique.xml
│   │   │   ├── trust-levels.xml
│   │   │   ├── anti-rationalization.xml
│   │   │   ├── diagnose-then-fix.xml
│   │   │   └── checkpoint-resume.xml
│   │   │
│   │   └── adapter-registry/          # adapter manifests Core is aware of
│   │       ├── claude-code.yaml
│   │       └── copilot.yaml
│   │
│   ├── lifecycle/                     # 5-phase product lifecycle
│   │   ├── agents/                    # lifecycle persona files
│   │   ├── workflows/
│   │   │   ├── 1-analysis/
│   │   │   ├── 2-planning/
│   │   │   ├── 3-solutioning/
│   │   │   ├── 4-implementation/
│   │   │   └── 5-deployment/
│   │   └── templates/                 # document templates
│   │
│   ├── dev/                           # developer agents + shared skills
│   │   ├── agents/
│   │   ├── skills/
│   │   └── knowledge/
│   │
│   ├── creative/                      # creative agents + workflows
│   │   ├── agents/
│   │   └── workflows/
│   │
│   ├── testing/                       # test architect + testing workflows
│   │   ├── agents/
│   │   └── workflows/
│   │
│   ├── integrations/                  # optional integration modules (§11)
│   │   └── obsidian/                  # installed only if --with-vault obsidian
│   │       ├── integration.yaml       # hook registration
│   │       ├── hook.js                # artifact-enrichment-hook implementation
│   │       └── templates/             # MOC templates, frontmatter templates
│   │
│   └── _memory/                       # populated at install
│       ├── checkpoints/               # sha256-verified workflow snapshots
│       ├── conductor-sidecar/         # Conductor routing memory
│       └── <agent-id>-sidecar/        # one per agent
│
├── adapters/                          # ADAPTER CODE (installer-side, NOT installed)
│   ├── claude-code/
│   │   ├── adapter.yaml               # manifest
│   │   ├── translator.js              # workflow → slash command generator
│   │   └── templates/
│   │       └── command.md.tmpl
│   └── copilot/
│       ├── adapter.yaml
│       ├── translator.js              # workflow → prompt file generator
│       └── templates/
│           └── prompt.md.tmpl
│
├── docs/                              # framework docs (for contributors)
├── scripts/                           # build, test, release scripts
└── tests/                             # framework self-tests
```

### 4.2 Installed user project

After `npx symphony-framework init .`, a user project looks like this:

```
user-project/
├── _symphony/                         # Core copied in
├── .claude/
│   └── commands/                      # Generated by claude-code adapter at install
│       ├── symphony.md
│       ├── symphony-dev-story.md
│       └── ... (~50 commands)
├── .github/
│   └── prompts/                       # Generated by copilot adapter at install
│       ├── symphony.prompt.md
│       ├── symphony-dev-story.prompt.md
│       └── ...
├── CLAUDE.md                          # Symphony guide at project root
├── docs/
│   ├── planning-artifacts/            # PRDs, UX, architecture, epics
│   ├── implementation-artifacts/      # stories, sprint status, changelogs
│   ├── test-artifacts/                # test plans, traceability
│   └── creative-artifacts/            # ideation, innovation outputs
└── src/                               # user's actual project code (project_path)
```

### 4.3 Key structural decisions

1. **Adapter translator code is NOT installed into user projects.** Translators run once at install time to generate command files, then exit. The Core only carries the `adapter-registry/` manifests so it knows which adapters exist.

2. **Both adapters emit output at install time, not runtime.** Re-run `symphony update` to regenerate when workflows change. Runtime stays simple.

3. **The Conductor is the engine's centerpiece.** `conductor.xml` is the first file loaded by any `/symphony*` command. The Conductor reads the user goal, detects phase, picks a workflow, and hands off to `wave-executor.xml` (parallel) or `workflow-engine.xml` (sequential).

4. **`_symphony/_memory/` is persistent across sessions.** Agent sidecars accumulate decisions over time. The Conductor's sidecar is privileged — it stores routing memory and improves phase detection over sessions.

---

## 5. Core Engine Components

### 5.1 Engine components (`_symphony/core/engine/`)

| Component | File | Responsibility |
|---|---|---|
| **Conductor** | `conductor.xml` | Parses user goal, detects phase, routes to workflow or direct agent. Entry point for all `/symphony*` commands. Signature feature #1. |
| **Wave Executor** | `wave-executor.xml` | Takes a workflow's step DAG, identifies independent steps, dispatches them in parallel waves (≤4 per wave), integrates results at wave boundaries. Signature feature #2. |
| **Workflow Engine** | `workflow-engine.xml` | Step execution for workflows that are not dispatched as parallel waves. Handles two execution modes: `sequential` (linear step-by-step) and `ensemble` (multi-agent interactive discussion with user as a participant). Loads instructions, manages template-outputs, handles normal/YOLO/planning modes. |
| **Gate Enforcer** | `gate-enforcer.xml` | HALT-gate mechanism. Pre-start gates run before a workflow begins; post-complete gates run before it is marked done. |
| **Task Runner** | `task-runner.xml` | Standalone task execution (reviews, audits, utilities — not full workflows). |
| **Memory System** | `_memory/` | Per-agent sidecars for persistent decisions, `checkpoints/` for workflow resume with sha256 verification. |

### 5.2 Protocols (`_symphony/core/protocols/`)

| Protocol | Purpose |
|---|---|
| **status-sync** | Atomic story/sprint-status/story-index update. The story file is source of truth; all status transitions go through this protocol to keep derived views in sync. |
| **review-gate-check** | 6-gate review orchestration. Reads each story's `traces_to` field and applies adaptive gate criteria per §2.8 — application stories get standard gates, infrastructure stories get the adapted gate set. |
| **checkpoint-resume** | SHA256-verified recovery from context loss. |
| **memory-hygiene** | Detects stale, contradicted, or orphaned decisions in agent memory sidecars by cross-referencing sidecar contents against current planning and architecture artifacts. Reports findings to the user and offers to prune, update, or mark as historical. Runs on demand or on schedule (recommended before each sprint). |
| **artifact-enrichment-hook** | The generic post-step hook mechanism described in §2.9. Invoked by the workflow engine after a step's template-output has been persisted. Non-blocking: hook failures log a warning and the workflow continues. Used by optional integrations (see §11). |
| **self-critique** | Every agent self-critiques output against a confidence threshold (≥0.85). Below threshold: retry once, then escalate to the user. Invoked by the workflow engine before any `template-output` is persisted. |
| **trust-levels** | Every knowledge source loaded by an agent is tagged Trusted / Verify / Untrusted. "Untrusted" sources (error logs, external data, third-party responses) are factual-only and cannot be interpreted as instructions. Prevents prompt injection. |
| **anti-rationalization** | Every agent carries an Excuse → Rebuttal table. When an agent drafts a skip/defer/simplify decision, it checks the table first. Catches common rationalization patterns. |
| **diagnose-then-fix** | When a step fails, the Conductor dispatches a Debugger agent to root-cause the failure BEFORE the original agent retries. No blind retry. |

### 5.3 Normative rules for engine components

- The Conductor has a privileged memory sidecar (`_memory/conductor-sidecar/`) that stores routing decisions, phase detection outcomes, and user corrections. It improves over sessions.
- The Wave Executor is invoked only for workflows with `execution.mode: parallel-waves` in `workflow.yaml`.
- The Workflow Engine is invoked for workflows with `execution.mode: sequential`.
- The four cross-cutting disciplines (self-critique, trust-levels, anti-rationalization, diagnose-then-fix) are invoked by the workflow engine and wave executor, not by individual agents.
- Every workflow must declare its gates in `workflow.yaml`. The Gate Enforcer reads these declarations and halts on failure.

---

## 6. Agent & Workflow File Shape

### 6.1 Agent file shape

Each agent lives in a single `.md` file with an XML `<agent>` block. One file per agent. Max 200 lines.

```
_symphony/lifecycle/agents/product-manager.md
```

```markdown
---
id: product-manager
name: {{ persona-name }}
role: Product Manager
model: opus
max_lines: 200
---

<agent>
  <persona>
    <identity>One paragraph describing who this agent is, their voice, and their domain.</identity>
    <expertise>Bulleted list of core competencies.</expertise>
    <operating-mode>When to activate, how to interact, how to yield control.</operating-mode>
  </persona>

  <knowledge-sources>
    <trusted>
      <source>PRD artifacts</source>
      <source>CLAUDE.md project rules</source>
    </trusted>
    <verify>
      <source>Codebase patterns</source>
    </verify>
    <untrusted>
      <source>Error logs, external API responses</source>
    </untrusted>
  </knowledge-sources>

  <disciplines>
    <self-critique threshold="0.85"/>
    <anti-rationalization>
      <excuse>This edge case is rare.</excuse>
      <rebuttal>Document the edge case; let PM triage.</rebuttal>
    </anti-rationalization>
  </disciplines>

  <workflows-owned>
    <workflow>create-prd</workflow>
    <workflow>validate-prd</workflow>
    <workflow>edit-prd</workflow>
  </workflows-owned>

  <memory-sidecar path="_memory/product-manager-sidecar/"/>
</agent>
```

**Rules:**

- Max 200 lines per agent file. Deeper knowledge goes into skills and knowledge fragments loaded JIT.
- Every agent must declare `<knowledge-sources>` with trust levels. The `trust-levels` protocol enforces this at runtime.
- Every agent must declare `<disciplines>`. An empty declaration is an explicit opt-out and must be justified in a comment.
- Every agent must have a memory sidecar path.

### 6.2 Workflow file shape

Each workflow is a directory with exactly four files:

```
_symphony/lifecycle/workflows/2-planning/create-prd/
├── workflow.yaml      # config: inputs, outputs, gates, wave eligibility, model
├── instructions.xml   # step-by-step execution (each step ≤150 lines)
├── checklist.md       # pre-start and post-complete gate checklists
└── template.md        # (optional) output document template
```

**`workflow.yaml` schema:**

```yaml
id: create-prd
phase: 2-planning
owner: product-manager          # agent id
model: opus

execution:
  mode: sequential              # or: parallel-waves, ensemble
  wave_eligible: false          # can this workflow run as a passenger in another workflow's wave dispatch?
  max_wave_siblings: 0          # how many siblings it tolerates per wave
  ensemble_participants: []     # only used when mode=ensemble; list of agent ids invited to the discussion
  ensemble_turn_policy: null    # only used when mode=ensemble; e.g., round-robin, facilitator-picks, user-picks

inputs:
  required: [product-brief]
  optional: [market-research, domain-research]

outputs:
  primary: docs/planning-artifacts/prd.md
  traceable_to: [product-brief]

gates:
  pre_start:
    - product-brief exists and is approved
  post_complete:
    - prd has all required sections
    - self-critique confidence >= 0.85
    - trust-levels audit passed

disciplines:
  self_critique: true
  anti_rationalization: true
  trust_levels: true
  # diagnose_then_fix is NOT a per-workflow opt-in. It is a failure-recovery
  # protocol that always triggers on step failure and cannot be disabled.
```

**Key fields:**

- `execution.mode` — one of `sequential`, `parallel-waves`, or `ensemble`. The Conductor picks the executor based on this value (see §6.4 Execution modes).
- `execution.wave_eligible` — if true, this workflow can run as a passenger inside another workflow's wave dispatch. The Wave Executor uses this to build cross-workflow DAGs.
- `execution.ensemble_participants` — list of agent ids invited to an ensemble discussion. Only meaningful when `mode: ensemble`.
- `execution.ensemble_turn_policy` — how turns are allocated in an ensemble discussion. Only meaningful when `mode: ensemble`.
- `disciplines` — which cross-cutting disciplines this workflow opts into. Only the three per-step disciplines (`self_critique`, `anti_rationalization`, `trust_levels`) are opt-in. The fourth cross-cutting discipline, `diagnose_then_fix`, is not opt-in — it is a failure-recovery protocol that triggers automatically on any step failure and cannot be disabled. Default for the three opt-in disciplines is all enabled. Explicit opt-outs must be documented in the workflow's README.
- `outputs.traceable_to` — explicit traceability arrows the traceability matrix generator walks.

### 6.3 Skills and knowledge fragments

- **Skills** live in `_symphony/dev/skills/` and `_symphony/creative/skills/`. Max 300 lines per file. Use sectioned loading when only a subset of a skill is needed for a step.
- **Knowledge fragments** live in `_symphony/{module}/knowledge/{category}/`. JIT-loaded by step files when referenced.
- Neither skills nor knowledge fragments are pre-loaded. The workflow engine loads them on demand and releases them after the step completes.

### 6.4 Execution modes

Symphony supports exactly three execution modes. Every workflow declares one of them in `workflow.yaml`.

| Mode | Engine | Description | Typical use |
|---|---|---|---|
| **`sequential`** | Workflow Engine | Linear step-by-step execution. Each step runs to completion before the next begins. Single owner agent. User confirms at each `template-output` unless in YOLO mode. | Classic workflows: create-prd, create-architecture, dev-story, deploy-checklist. |
| **`parallel-waves`** | Wave Executor | DAG-based execution. Independent steps dispatched as parallel waves of ≤4 subagents, with integration gates between waves. | Overture onboarding, run-all-reviews, multi-agent creative sprints — anywhere independent work can proceed in parallel. |
| **`ensemble`** | Workflow Engine | Multi-agent interactive discussion. A curated set of agents (the "ensemble") take turns contributing to a shared conversation while the user actively participates. No predefined step sequence — the discussion flows under a turn policy. | Brainstorming, triage meetings, architecture debates, design critiques, roundtable reviews — any scenario where the value comes from dialogue between multiple perspectives. |

**Ensemble mode mechanics:**

1. The workflow declares `ensemble_participants` — a list of agent ids invited to the discussion.
2. The Conductor loads each participant's persona into a shared context.
3. The workflow engine runs a turn loop: select next speaker per `ensemble_turn_policy`, invoke that agent, add its contribution to the shared transcript, pause for user input, repeat.
4. Turn policies include `round-robin` (each participant speaks once per round), `facilitator-picks` (a designated facilitator agent picks the next speaker), and `user-picks` (the user chooses who speaks next).
5. The discussion terminates when the user calls it, when a facilitator declares consensus, or when the workflow's stopping criterion in `checklist.md` is met.
6. The transcript is saved as the workflow's output. The user can convert decisions from the transcript into follow-up artifacts (stories, action items, decisions logs).
7. Self-critique, trust-levels, and anti-rationalization disciplines still apply per agent turn. Diagnose-then-fix does not apply (there are no failing steps to diagnose in a discussion).

**Why ensemble mode is architecturally significant:** it is the only execution mode where the user is an active participant inside the execution loop, not just a confirmation gate at checkpoints. This is a structurally different execution pattern from `sequential` (user at checkpoints) and `parallel-waves` (user outside the loop entirely), so it must be a first-class mode rather than a workflow-level convention on top of `sequential`.

### 6.5 Interaction modes (orthogonal to execution modes)

Execution mode (§6.4) controls HOW steps are dispatched. **Interaction mode** controls HOW the user participates at runtime. They are orthogonal: any execution mode can run under any interaction mode, and interaction mode is chosen at invocation time, not declared in `workflow.yaml`.

| Interaction mode | Behavior |
|---|---|
| **`normal`** | Default. The workflow engine pauses at every `<template-output>` checkpoint for user confirmation before persisting. User can review, edit, reject, or approve. Safest mode. |
| **`YOLO`** | Auto-proceed. The workflow engine writes template-outputs immediately without pausing. User retains the ability to switch back with "switch to normal mode" at any time. Intended for experienced users who want speed. Quality gates still HALT on failure — YOLO does not bypass gates. |
| **`planning`** | Plan-first. Before ANY steps execute, the workflow engine presents a structured execution plan (list of steps, expected outputs, gates that will fire, agents that will activate, estimated complexity). User approves, edits, or rejects the plan. After approval, the user chooses whether runtime executes in `normal` or `YOLO`. |

**Rules:**

1. The default interaction mode is `normal` unless the user explicitly specifies otherwise at invocation time.
2. Interaction mode is set per invocation, not per workflow. The same workflow can run normally for one user and YOLO for another.
3. YOLO mode NEVER bypasses quality gates. Gates always HALT on failure regardless of interaction mode.
4. YOLO mode NEVER bypasses self-critique. An agent's self-critique still runs and still escalates to the user when confidence < threshold.
5. Planning mode is recommended for workflows whose scope the user is uncertain about. The planner's output becomes a reviewable artifact even if the user cancels before runtime begins.
6. Interaction mode can be switched mid-workflow: the user says "switch to normal mode" or "switch to YOLO" and the engine respects the change at the next step boundary.

**How this composes with execution modes:**

| | normal | YOLO | planning |
|---|---|---|---|
| **sequential** | Pause at each step's template-output | Auto-persist each step's template-output | Show plan, approve, then sequential |
| **parallel-waves** | Pause at each wave's integration gate | Auto-integrate each wave | Show plan (DAG + wave breakdown), approve, then parallel-waves |
| **ensemble** | Each participant turn awaits user input | Participants auto-advance turns; user jumps in when desired | Show participant list + turn policy, approve, then ensemble |

**Why this is in the architecture spec:** interaction mode is load-bearing for safety. A user needs to know, from the architecture, that YOLO mode will never skip a quality gate or a self-critique escalation. Formalizing the modes here prevents follow-up specs from weakening the contract.

---

## 7. Adapter Model

### 7.1 Adapter contract

Every adapter must provide three things:

```
adapters/{adapter-id}/
├── adapter.yaml           # manifest declaring identity, outputs, capabilities
├── translator.js          # the only code that runs; emits commands/prompts
└── templates/
    └── command.md.tmpl    # one template per command type
```

### 7.2 Example adapter manifests

**`adapters/claude-code/adapter.yaml`:**

```yaml
id: claude-code
target_tool: "Claude Code"
target_tool_url: "https://docs.anthropic.com/en/docs/claude-code"
output_paths:
  commands: ".claude/commands/"
  config: "CLAUDE.md"
command_file_extension: ".md"
command_naming_pattern: "symphony{-action}"
supports:
  model_frontmatter: true
  slash_commands: true
  agent_memory: true
  model_selection_per_command: true
capabilities_declared:
  - sequential_workflows
  - parallel_waves
  - gate_enforcement
  - self_critique
```

**`adapters/copilot/adapter.yaml`:**

```yaml
id: copilot
target_tool: "GitHub Copilot"
target_tool_url: "https://github.com/features/copilot"
output_paths:
  commands: ".github/prompts/"
  config: ".github/copilot-instructions.md"
command_file_extension: ".prompt.md"
command_naming_pattern: "symphony{-action}"
supports:
  model_frontmatter: false
  slash_commands: true
  agent_memory: true
  model_selection_per_command: false
capabilities_declared:
  - sequential_workflows
  - parallel_waves
  - gate_enforcement
  - self_critique
```

### 7.3 Translator contract (pseudocode)

```javascript
// adapters/{adapter-id}/translator.js
export async function translate(corePath, userProjectPath, options) {
  const manifest = readYaml(`${corePath}/core/adapter-registry/${id}.yaml`);
  const workflows = enumerateWorkflows(corePath);

  for (const wf of workflows) {
    const rendered = renderTemplate('command.tmpl', {
      name: `symphony-${wf.id}`,
      model: manifest.supports.model_frontmatter ? wf.model : null,
      workflow_path: `_symphony/${wf.path}`,
      conductor_path: `_symphony/core/engine/conductor.xml`,
    });
    writeFile(
      path.join(userProjectPath, manifest.output_paths.commands,
                `symphony-${wf.id}${manifest.command_file_extension}`),
      rendered
    );
  }

  emitEntryCommand(userProjectPath, manifest);
  writeConfigFile(userProjectPath, manifest);
}
```

### 7.4 Example emitted commands

**Claude Code — `.claude/commands/symphony-dev-story.md`:**

```markdown
---
description: Implement a user story end-to-end
model: opus
---

Load `{project-root}/_symphony/core/engine/conductor.xml` first.
Then process workflow: `_symphony/lifecycle/workflows/4-implementation/dev-story/`.
Execute in normal mode unless the user has switched to YOLO.
```

**Copilot — `.github/prompts/symphony-dev-story.prompt.md`:**

```markdown
---
mode: agent
description: Implement a user story end-to-end
---

Load `_symphony/core/engine/conductor.xml` first.
Then process workflow: `_symphony/lifecycle/workflows/4-implementation/dev-story/`.
Execute in normal mode unless the user has switched to YOLO.
```

Both files point at the same Core workflow. The adapter only translates the shell around it.

### 7.5 The golden rule

**An adapter is not allowed to contain workflow logic, agent logic, or discipline logic.** Any feature that needs to change behavior goes into Core. Adapters are pure file generators. If a feature appears in an adapter that could not also appear in Core, the feature is in the wrong place and must be refactored.

### 7.6 Adding a future adapter

1. Create `adapters/{id}/` with `adapter.yaml`, `translator.js`, `templates/command.md.tmpl`.
2. Register it in `_symphony/core/adapter-registry/{id}.yaml`.
3. User re-runs `npx symphony-framework install --adapter {id}`.
4. The new tool gets the full Symphony experience with zero Core changes.

This is the payoff of the dual-layer architecture: every new AI tool becomes an afternoon of adapter work, not a framework refactor.

---

## 8. Signature Features (Contract Level)

The two features that define Symphony's identity. This section defines the **contracts and mechanics** only. Full implementation specs come in Spec 3 (Conductor) and Spec 4 (Wave Executor).

### 8.1 The Conductor

Entry point for every `/symphony*` command. The user never has to memorize workflow names.

**Responsibilities:**

1. **Goal parsing** — extract intent verb, target noun, and scope hint from natural-language input.
2. **Phase detection** — cross-reference the user's goal with current project state (what artifacts exist).
3. **Routing decision** — pick a workflow, a direct agent, or the fast path. Assign a confidence score.
4. **Confidence gating** — if confidence < 0.80, present top-2 routing options to the user. If ≥ 0.80, dispatch automatically.
5. **Routing memory** — write every routing decision to `_memory/conductor-sidecar/`. Learn from user corrections.

**Phase detection rules (evaluated in order):**

```
IF user says "fix X" or "debug Y" or an error/trace is pasted
  → diagnose-then-fix path

ELIF user asks to "onboard", "scan", "analyze", or "discover" an existing codebase
  → Overture path (entry mode: existing codebase)

ELIF project has source code AND no Symphony planning artifacts exist
  → Overture path (detected automatically — user is almost certainly onboarding)

ELIF goal scope is "small" AND project has an approved architecture
  → fast path (quick-spec + quick-dev)

ELIF no product-brief exists
  → Phase 1 (Analysis) [greenfield entry]

ELIF product-brief exists but no PRD
  → Phase 2 (Planning)

ELIF PRD exists but no architecture
  → Phase 3 (Solutioning)

ELIF architecture exists and sprint is active
  → Phase 4 (Implementation)

ELIF all stories done, release not shipped
  → Phase 5 (Deployment)

ELSE
  → present user with all phases, ask which
```

**Note on Overture detection:** The second Overture rule (source code exists, no Symphony artifacts) is a structural detection that fires on most first invocations in existing repos. It prevents users from being dumped into Phase 1 and wasting time authoring a product brief for a project that already has thousands of lines of code. If the user actually wanted greenfield-in-an-existing-repo for some reason, they can override the Conductor's routing choice at the confidence gate.

**Confidence score components:**

- How well the goal matched the intent parser (0–0.4)
- How clean the project state was for phase detection (0–0.3)
- Whether a similar prior goal in sidecar memory had a correct routing outcome (0–0.3)

Sum ≥ 0.80 triggers automatic dispatch. Sum < 0.80 triggers user confirmation with the top-2 routing candidates.

**This spec defines:** the contract, phase detection rules (normative), confidence gating behavior, memory sidecar presence.

**Spec 3 (Conductor) will define:** the exact intent parser grammar, scoring function weights, sidecar schema, user-confirmation UI.

### 8.2 The Wave Executor

Invoked only for workflows tagged `execution.mode: parallel-waves`.

**Wave building:**

1. Load the workflow's step DAG from `instructions.xml`.
2. Each step declares its inputs (upstream step outputs) and outputs.
3. The Wave Executor topologically sorts steps.
4. For each rank in the topo sort, group steps with ≤4 parallel siblings per wave.
5. Result: an ordered list of waves; each wave is a set of ≤4 steps that can run concurrently.

**Wave execution:**

1. Dispatch each step in the wave as a parallel subagent (one per step).
2. Each subagent operates in its own context window; subagents do NOT share state during wave execution.
3. Wait for ALL subagents in the wave to finish.
4. At the wave boundary, run an **integration gate**:
   - Aggregate outputs from all steps.
   - Detect conflicts (two steps wrote to the same file, contradictory decisions, etc.).
   - Run self-critique on the aggregated output.
   - HALT if any check fails.
5. If the integration gate passes, proceed to the next wave.

**Failure recovery (diagnose-then-fix loop):**

1. A failing subagent causes the Wave Executor to mark its step `faulted` and capture the error.
2. The Conductor dispatches a Debugger agent with the error context.
3. The Debugger performs root-cause analysis — it does NOT fix anything.
4. The Debugger's diagnosis is handed to the original agent (or a replacement) for the fix.
5. After the fix, the wave retries ONLY the faulted step.
6. If the retry fails a second time, the Wave Executor escalates to the user.

**Why ≤4 parallel:** integration gates get exponentially more complex as parallelism grows. Four is a sweet spot for cognitive load at the integration boundary. Individual workflows may tune this in `workflow.yaml` via `max_wave_siblings`.

**This spec defines:** the contract, wave-building rules (normative), integration gate behavior, failure recovery path.

**Spec 4 (Wave Executor) will define:** the concrete DAG data format, conflict detection algorithms, integration gate implementation, parallel dispatch mechanism.

### 8.3 Conductor and Wave Executor interaction

```
user goal
  │
  ▼
┌───────────────┐
│  CONDUCTOR    │  parses goal, detects phase, picks workflow
└───────┬───────┘
        │  workflow selected
        ▼
  ┌─────────────────────────────┐
  │ workflow.yaml                │
  │ execution.mode: ?            │
  └────────┬────────────────────┘
           │
    ┌──────┼──────────────┐
    │      │              │
    ▼      ▼              ▼
 sequential  ensemble   parallel-waves
    │         │             │
    └────┬────┘             │
         ▼                  ▼
   WORKFLOW ENGINE       WAVE EXECUTOR
   (step loop /          (DAG dispatch,
    turn loop)            integration gates)
         │                  │
         └────────┬─────────┘
                  ▼
         outputs, checkpoints, memory updates
```

Parallel-waves workflows never touch the Workflow Engine. Sequential and ensemble workflows never touch the Wave Executor. The Workflow Engine handles two modes with the same underlying step-dispatch machinery: `sequential` (single-agent step loop) and `ensemble` (multi-agent turn loop). The Conductor is the only component that knows all three modes exist.

---

## 9. Scope of This Spec

### 9.1 In scope

- Framework identity: name, philosophy, non-goals
- Load-bearing architectural principles
- Top-level architecture diagram (dual-layer)
- Directory layout for both the Symphony repo and installed user projects
- Engine components list and responsibilities
- Protocol list and responsibilities
- Agent file shape (one-file-per-agent with `<agent>` XML block)
- Workflow file shape (four-file directory structure)
- `workflow.yaml` schema
- Adapter contract, manifest format, translator contract, golden rule
- Conductor contract and phase detection rules
- Wave Executor contract and wave-building rules
- How Conductor and Wave Executor interact

### 9.2 Out of scope (covered in follow-up specs)

- **Spec 2 — Core Engine:** concrete runtime implementation of the workflow engine (including the `ensemble` turn loop), gate enforcer, checkpoint/resume, memory system, interaction-mode pacing (normal/YOLO/planning), `memory-hygiene` protocol, `artifact-enrichment-hook` protocol, `review-gate-check` protocol with adaptive gate substitutions per §2.8.
- **Spec 3 — Conductor:** exact intent parser grammar, scoring function, sidecar schema, user-confirmation UI.
- **Spec 4 — Wave Executor:** concrete DAG format, conflict detection, integration gate implementation, parallel dispatch mechanism.
- **Spec 5 — Lifecycle Agents and Workflows:** the concrete 5-phase set of agents and workflows, including persona names, the full workflow list, templates, and gates. May be sub-decomposed per phase. Must include:
  - At least one `ensemble` workflow (multi-agent roundtable discussion for brainstorming/triage/design-debate scenarios).
  - The Overture workflow (existing-codebase onboarding, `parallel-waves` execution). Produces: architecture map, API catalog, UX flow map, dependency graph, NFR baseline, gap-focused PRD.
  - A `memory-hygiene` workflow (user-runnable, invokes the `memory-hygiene` protocol, reports findings, offers prune/update/archive actions).
  - The `run-all-reviews` orchestrator workflow that runs all six review-gate checks sequentially or in parallel waves, respecting §2.8 adaptive gate substitutions.
- **Spec 6 — Dev, Creative, and Testing Modules:** developer agents, creative agents, test architect, and their associated workflows. Creative module should lean heavily on `ensemble` workflows for brainstorming and design-thinking sessions.
- **Spec 7 — Runtime Adapters:** concrete implementations of the claude-code and copilot adapters, including templates and the install-time translator pipeline.
- **Spec 8 — Release Polish and Integrations:** `npx symphony-framework` installer (including `--with-vault obsidian` flag), the Obsidian vault integration module per §11.2 (tag taxonomy, wikilink injection rules, MOC structure, Dataview query library), README, version automation, npm publish pipeline, branding assets.

### 9.3 Dependencies between follow-up specs

```
Spec 1 (Architecture — this spec)
    │
    ├──► Spec 2 (Core Engine)
    │        │
    │        ├──► Spec 3 (Conductor)
    │        ├──► Spec 4 (Wave Executor)
    │        └──► Spec 5 (Lifecycle)
    │                 │
    │                 └──► Spec 6 (Dev / Creative / Testing)
    │
    └──► Spec 7 (Adapters)
              │
              └──► Spec 8 (Release Polish)
```

Spec 2 must land before Specs 3 and 4. Specs 5 and 6 depend on Specs 2–4. Spec 7 can proceed in parallel with Specs 3–6 once Spec 2 is done. Spec 8 lands last.

---

## 10. Open Questions for Implementation Specs

Items deliberately left open for the follow-up specs to decide:

1. **Persona names for lifecycle agents.** This spec does not name any agents. Spec 5 proposes a fresh name set.
2. **Exact list of workflows per phase.** The five-phase structure is fixed; the concrete workflow inventory is for Spec 5.
3. **Intent parser implementation.** Spec 3 will decide whether to use a regex-based parser, an LLM-based classifier, or a hybrid.
4. **DAG data format.** Spec 4 will propose the on-disk format for step dependency declarations in `instructions.xml`.
5. **Confidence score tuning.** The 0.80 threshold is a starting point; Spec 3 will validate it against dogfood usage.
6. **Ensemble turn policies.** `round-robin`, `facilitator-picks`, and `user-picks` are the three starting policies. Spec 5 will decide whether additional policies are needed (e.g., `confidence-weighted`, `devil's-advocate`, `hot-seat`).
7. **Overture scan depth.** Spec 5 will decide how deep the Overture scans: whether to fully parse every file, use AST-based analysis, or lean on LLM-driven summarization per directory. Tradeoff is thoroughness vs. time/token cost.
8. **Overture re-run semantics.** Spec 5 will decide what happens when Overture is re-run on a project that already has onboarding artifacts: overwrite, merge, or diff. Users will likely want to re-run after major refactors.
9. **Memory hygiene detection heuristics.** Spec 2 (engine) and Spec 5 (workflow) will decide exactly what counts as "stale" or "contradicted": e.g., a decision that references a deleted file, a decision that conflicts with the current architecture document, a decision older than N sprints. Starting heuristics: reference-not-found, contradiction-with-latest-architecture, orphaned-by-scope-change.
10. **Vault tag taxonomy.** §11 commits Obsidian as the first integration; Spec 8 will propose the tag namespace, alias conventions, and MOC file structure.
11. **Installer UX.** Spec 8 will design the interactive prompts and options.
12. **Branding.** Logo, color palette, and visual identity land in Spec 8.

---

## 11. Optional Integrations

Symphony ships with an extension point for optional integrations via the `artifact-enrichment-hook` protocol (§5.2) and the post-step hook principle (§2.9). This section commits the first integration at the architecture level and describes the shape any future integration must take.

### 11.1 The integration contract

Every optional integration must:

1. **Register a hook** with the engine via `_symphony/_config/global.yaml`. Registration includes: hook id, type (`post-step-artifact`), target artifact patterns (e.g., all `.md` files in `docs/`), and configuration block.
2. **Implement the hook function** as a standalone script or declarative ruleset. The function receives: the artifact path, the artifact content, the step metadata, and a read-only view of the engine config.
3. **Return a non-blocking result.** On success: the function modifies the artifact in place and returns `ok`. On failure: the function logs a warning, leaves the artifact unchanged, and returns `failed`. The engine logs the failure and proceeds.
4. **Never modify step inputs or intermediate state.** Hooks only touch persisted artifact outputs.
5. **Be disabled by default.** Users opt in per-installation through `global.yaml`.

### 11.2 Committed integration: Obsidian vault

Symphony commits to shipping an Obsidian vault integration as the first optional integration. Obsidian is a local-first knowledge graph tool that reads markdown files and renders them as an interconnected vault.

**What the integration provides (when enabled):**

- **Frontmatter enrichment** — every artifact written to `docs/` gets `tags`, `aliases`, and `cssclass` fields added to its YAML frontmatter via the post-step hook. Tag namespace is configurable.
- **Wikilink injection** — related artifacts (PRD ↔ architecture ↔ epics ↔ stories ↔ reviews) get `[[wikilink]]` cross-references inserted based on traceability declarations in `workflow.yaml`.
- **Tag taxonomy** — a structured tag hierarchy for filtering artifacts by type, phase, status, priority, risk, agent, and sprint.
- **Maps of Content (MOC)** — auto-generated index pages in `docs/_vault-moc/` that provide navigation and dashboards. One MOC per artifact directory, plus a master index.
- **Dataview queries** — pre-built Dataview blocks in the MOC files for sprint status, review gate progress, and risk overview. Requires the Obsidian Dataview plugin at the user's end.

**Enable/disable:**

The integration is **disabled by default**. Users enable it during install (`npx symphony-framework init --with-vault obsidian`) or after install by setting `vault.enabled: true` in `global.yaml` and running the vault initializer workflow.

**Configuration:**

```yaml
# _symphony/_config/global.yaml
vault:
  enabled: false                   # master toggle
  integration: obsidian            # which integration to activate
  vault_root: "{output_folder}"    # where the vault lives (default: docs/)
  wikilinks: true                  # inject [[wikilinks]] between artifacts
  tags: true                       # add tags to frontmatter
  moc_dir: "_vault-moc"            # MOC directory name
  dataview_queries: true           # include Dataview blocks in MOC files
  tag_prefix: "symphony"           # namespace prefix for all tags (e.g., symphony/type/story)
```

**Architectural constraints:**

1. The Obsidian integration runs entirely through the `artifact-enrichment-hook` protocol. It has no direct access to Core.
2. The integration is distributed as an adjunct module, not as part of `_symphony/core/`. It lives in `_symphony/integrations/obsidian/` when installed.
3. Symphony workflows MUST produce valid markdown artifacts whether the integration is enabled or disabled. Core does not depend on the integration; the integration depends on Core.
4. The hook is non-blocking (§2.9). If Obsidian enrichment fails for any reason, the workflow completes anyway and logs the failure.

### 11.3 Future integrations

The hook mechanism is deliberately generic so that future integrations can plug in without Core changes. Candidate future integrations (not committed, listed for shape):

- **Other local vault tools** — Logseq, Roam Research, Foam — each would ship its own hook module that uses the same `artifact-enrichment-hook` protocol with tool-specific frontmatter conventions.
- **Knowledge graph exporters** — emit artifacts as RDF, Neo4j, or similar for external analysis.
- **Observability integrations** — push artifact metadata to a metrics or logging backend for cross-project analytics.
- **Chat/notification integrations** — post step completions to Slack, Discord, or email.

Any future integration follows the same three-rule contract (§11.1) and lives in `_symphony/integrations/{id}/`. Symphony Core is never modified to add an integration.
