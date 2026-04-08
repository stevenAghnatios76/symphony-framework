# Symphony Core Engine — Execution (Spec 2a)

**Status:** Design approved, awaiting implementation plan
**Date:** 2026-04-08
**Depends on:** Spec 1 — Architecture Design (2026-04-08)
**Blocks:** Spec 2b (Quality), Spec 2c (Persistence), Spec 3 (Conductor), Spec 4 (Wave Executor), Spec 5 (Lifecycle)

---

## 1. Purpose

Spec 2a defines the **concrete runtime implementation** of Symphony's workflow engine in its Execution dimension: the workflow engine's step execution loops, interaction-mode pacing, and task runner. It replaces the engine stubs shipped in the v0.0.1 foundation with the real runtime instructions the host AI will follow to execute Symphony workflows end-to-end.

### 1.1 Scope decomposition

The Core Engine work from architecture spec §9.2 is decomposed into three sibling sub-specs. Spec 2a is the first.

| Sub-spec | Scope | Status |
|---|---|---|
| **2a — Execution** (this document) | Workflow engine, interaction modes, task runner, extension-point call convention | Design approved |
| **2b — Quality** | Gate enforcer, self-critique, trust-levels, anti-rationalization, diagnose-then-fix, review-gate-check (with adaptive gate substitutions) | Not started |
| **2c — Persistence** | Checkpoint/resume, memory system, memory-hygiene, artifact-enrichment-hook, status-sync | Not started |

2b and 2c may proceed in parallel with each other once 2a is complete. Spec 3 (Conductor) and Spec 4 (Wave Executor) depend on 2a's extension-point contracts and may proceed once 2a is complete.

### 1.2 In scope

- Runtime definition of the workflow engine for `sequential` and `ensemble` execution modes
- Runtime definition of the task runner for standalone tasks
- Interaction-mode pacing: `normal`, `YOLO`, `planning`
- Engine-internal sub-protocols: preflight-check, variable-resolution, planning-gate
- The dispatch call convention reserved for the wave executor (parallel-waves mode)
- Named extension points as structured protocol invocations
- Error taxonomy, HALT semantics, and the diagnose-then-fix dispatch contract
- Resume semantics for halts and mid-step context loss
- Schema extensions to `workflow.yaml` required by the engine
- Structural + fixture-based test strategy for verifying the engine XML

### 1.3 Out of scope

| Out of scope | Belongs to |
|---|---|
| Implementation of any cross-cutting protocol's behavior | Specs 2b, 2c |
| Checkpoint file schema, sha256 verification algorithm, archival layout | Spec 2c |
| Debugger agent persona, methodology, diagnosis format | Spec 2b |
| Intent parser, routing logic, confidence scoring, conductor-sidecar schema | Spec 3 |
| Wave executor DAG format, conflict detection, integration gate implementation | Spec 4 |
| Any lifecycle agents, lifecycle workflows, or phase-specific content | Spec 5 |
| Adapter translator implementation | Spec 7 |
| `npx symphony-framework init`, release polish, npm publishing | Spec 8 |

---

## 2. Architecture

### 2.1 Substrate

The Symphony engine is **XML instructions the host AI loads into its context and follows**. There is no Node.js process and no separate runtime daemon. The host AI — Claude Code or GitHub Copilot or any future adapted tool — is the interpreter. Determinism for load-bearing operations (atomic writes, sha256 verification, gate-state persistence, checkpoint writes) comes from the host AI using its shell tools against on-disk contracts the engine defines.

Consequences of the substrate choice:

- Spec 2a ships XML files, not JavaScript. The `bin/symphony-cli.js` CLI from the foundation is unrelated — it's for installer operations and version reporting, not runtime execution.
- Spec 2a cannot enforce control-flow invariants through language-level mechanisms. It enforces them through clarity of instruction, structural markers the host AI recognizes, and tests that verify the markers are present and well-formed.
- Every host AI activation that runs a workflow or task loads the relevant engine XML directly — there is no indirection layer.

### 2.2 Two kernels, one mental model

Symphony's execution has two composition kernels. Both are defined in `workflow-engine.xml`.

**Kernel A — Inline kernel** (the default)

One host AI context. The engine adopts a persona (or no persona, for engine-neutral workflows), reads files, executes steps in numerical order, loads skills just-in-time per step, evicts skills before the next step, checkpoints after each step, and invokes named protocols at declared boundaries. The 40K token context budget is kept safe because skills churn — the persona and the accumulated progress stay, but the working set for any given step does not.

Kernel A is used by:
- **`sequential`** — unit of work is a `<step>`. Owner persona loaded once at workflow start and adopted for the whole workflow. Skills load and evict per step. Mirrors the proven inline execution model.
- **`ensemble`** — unit of work is a `<step>` that represents one participant turn. Participant persona is hot-swapped per turn (JIT load, execute turn, evict, load next). The shared transcript accumulates in context across all turns. Each turn begins with explicit re-priming to minimize persona bleed.
- **Task runner** — unit of work is a `<step>`. Simpler than workflow execution: no variable-resolution chain, no pre-start/post-complete gates, checkpointing is optional.

**Kernel B — Dispatch wrapper** (used when independence is the point)

A Kernel A that, instead of executing a step inline, dispatches that step to a fresh subagent. The subagent runs its own Kernel A with the step's narrow context and returns a result. Kernel B is Kernel A plus a composition rule, not a second engine.

Kernel B is used by:
- **`parallel-waves`** — Spec 4 territory. Spec 2a's only obligation is to define the dispatch call convention (§5.4) so Spec 4 can build on a stable contract.

### 2.3 State lives on disk, not in the host AI's context

The engine holds as little state as possible in the live host AI context. Load-bearing state is persisted to disk at every step/turn boundary so the engine can always recover from context loss.

| State location | Purpose | Owner |
|---|---|---|
| The current checkpoint file at `_symphony/_memory/checkpoints/{workflow-id}-{run-id}.yaml` | Single source of truth for current-run state: workflow id, run id, execution mode, interaction mode, owner agent, current step index, ensemble turn pointer, files touched + sha256, status. Rewritten after every completed step. | Schema owned by Spec 2c; required fields declared in this spec (§4.1) |
| Workflow outputs at paths declared in `workflow.yaml` `outputs.primary` | Canonical workflow outputs that downstream workflows consume as inputs | Spec 2a's engine writes them; Spec 5 workflows define them |
| Archived checkpoints at `_symphony/_memory/checkpoints/completed/` | Completed workflow history | Spec 2c |

Symphony does **not** use a separate session-state file. Every field that might have lived in a session state file (interaction mode, owner agent, current step index, ensemble turn pointer) is written to the current checkpoint after each step. A single file, rewritten atomically, is simpler than two synchronized files with overlapping content.

### 2.4 Named extension points

Spec 2a declares eight `<invoke protocol="..."/>` call sites in the engine XML. Each is a call convention: the engine emits the invocation at a defined position in the execution flow, and a protocol file responds. Seven of the eight call sites extend to protocols owned by Specs 2b and 2c (stub today, real behavior later). One site (preflight-check) is engine-internal and owned by Spec 2a permanently.

| # | Invocation tag | Called at | Implementer |
|---:|---|---|---|
| 1 | `<invoke protocol="preflight-check" phase="before-workflow-start"/>` | Before the first step of a workflow | Spec 2a (engine-internal) |
| 2 | `<invoke protocol="gate-enforcer" phase="pre-start"/>` | Before the first step, after preflight | Spec 2b |
| 3 | `<invoke protocol="trust-levels" on="before-step-execute"/>` | Before each step's `<action>` execution | Spec 2b |
| 4 | `<invoke protocol="anti-rationalization" on="before-persist"/>` | Before persisting a `<template-output>`, only when the step has drafted a skip/defer/simplify decision | Spec 2b |
| 5 | `<invoke protocol="self-critique" on="before-persist"/>` | Before persisting a `<template-output>` | Spec 2b |
| 6 | `<invoke protocol="artifact-enrichment-hook" on="after-output-persist"/>` | After a `<template-output>` is written to disk | Spec 2c |
| 7 | `<invoke protocol="checkpoint-resume" on="after-step-complete"/>` | After each completed step, before advancing | Spec 2c |
| 8 | `<invoke protocol="gate-enforcer" phase="post-complete"/>` | After the final step, before archiving the checkpoint | Spec 2b |

Plus `diagnose-then-fix`, which is not an invocation point but a trigger: when a step action fails, the engine dispatches the diagnose-then-fix loop (§6.3). The loop's behavior is defined by Spec 2b.

**At v0.0.x**, when the engine's XML contains an `<invoke protocol="..."/>` tag and a host AI reaches it, the referenced protocol stub logs a single line and returns success. This is intentional: Spec 2a can ship a fully structurally valid engine before Specs 2b and 2c land. The engine XML itself does not change when the stubs are replaced with real protocol behavior.

### 2.5 Normative rules Spec 2a introduces

These rules are load-bearing. Any downstream spec must respect them.

- **R-2a-1** — The engine's execution is strictly serial within a single Kernel A. No `<for-each>`, `<repeat>`, or `<parallel>` tags inside a single step file. Parallelism is an execution-mode concern (parallel-waves) handled by Kernel B, not a step-level construct.
- **R-2a-2** — Persona adoption is separated from engine control. When the engine adopts a workflow's owner persona (or an ensemble participant's persona), it adopts voice, style, expertise, and rules, but the engine — not the persona — controls step execution. The persona's own activation menu, greeting, or internal routing is never executed.
- **R-2a-3** — The engine writes its current state (in the checkpoint) after every completed step or turn, before advancing. A step is not considered complete until its checkpoint write succeeds.
- **R-2a-4** — JIT loading applies to skills and knowledge fragments; both are evicted from context before the next step loads its own. Persona files are not churned between steps in a sequential workflow (they are churned per turn in ensemble mode).
- **R-2a-5** — All load-bearing failures write a checkpoint with HALT status before exiting. There is no silent failure path. Every HALT is recoverable via `/symphony-resume`.
- **R-2a-6** — YOLO interaction mode never bypasses quality gates, self-critique escalations, or HALTs. YOLO changes only the pacing of user interaction at `<template-output>` and `<ask>` boundaries.
- **R-2a-7** — Kernel A workflows may dispatch a subagent from within an individual `<action>` step when the step's work benefits from fresh context (adversarial review, specialized validators, deep research tasks). The default remains inline; per-action subagent dispatch is an explicit opt-in via a structured action tag (§5.2).

---

## 3. Components

Spec 2a ships or replaces five files. Every file has one clear responsibility and stays within reasonable size for the context budget.

### 3.1 File inventory

| File | Status | Est. lines | Responsibility |
|---|---|---:|---|
| `_symphony/core/engine/workflow-engine.xml` | Replace stub | ~350 | The main Kernel A engine. Owns sequential + ensemble execution loops, interaction-mode pacing (normal/YOLO/planning), checkpoint and hook boundary calls, extension-point invocations. Entry point for every workflow dispatched by the Conductor. |
| `_symphony/core/engine/task-runner.xml` | Replace stub | ~90 | The Kernel A variant for standalone tasks. No workflow lifecycle, no variable resolution, no post-complete gate, optional checkpointing. Used for reviews, audits, utilities. |
| `_symphony/core/engine/protocols/preflight-check.xml` | New | ~50 | Engine-internal sub-protocol. Invoked by the main engine before step execution begins. Validates: declared required inputs exist, variables resolve, checklist.md exists if declared, template.md exists if declared, pre-start gate checks are readable. HALTs on any failure with all failures reported (not just the first). |
| `_symphony/core/engine/protocols/variable-resolution.xml` | New | ~70 | Engine-internal sub-protocol. Resolves `{project-root}`, `{project-path}`, `{memory-path}`, `{checkpoint-path}`, `{installed-path}`, `{date}` by reading `_symphony/_config/global.yaml`. Two-level resolution only: workflow.yaml → global.yaml. No module-level inheritance chain. No pre-resolved cache. |
| `_symphony/core/engine/protocols/planning-gate.xml` | New | ~100 | Engine-internal sub-protocol. Invoked when interaction mode is `planning`. Loads declared inputs, parses instructions into a structured plan (Context / Files to Modify / Detailed Edits / Implementation Order / Verification sections), presents it, waits for approval (`[a] normal / [y] YOLO / [r] revise / [x] abort`), then hands control back to the main engine with the selected runtime mode. |

### 3.2 Directory layout

The Spec 2a additions introduce one new directory (`_symphony/core/engine/protocols/`) and modify two existing stub files.

```
_symphony/core/engine/
├── conductor.xml                    # Unchanged stub (Spec 3 replaces)
├── wave-executor.xml                # Unchanged stub (Spec 4 replaces)
├── workflow-engine.xml              # ← REPLACED
├── gate-enforcer.xml                # Unchanged stub (Spec 2b replaces)
├── task-runner.xml                  # ← REPLACED
└── protocols/                       # ← NEW
    ├── preflight-check.xml          # ← NEW
    ├── variable-resolution.xml      # ← NEW
    └── planning-gate.xml            # ← NEW
```

`_symphony/core/protocols/` (the foundation's directory holding the 9 cross-cutting protocol stubs) is not touched by Spec 2a. Those stubs remain until Specs 2b and 2c replace them.

### 3.3 Why engine-internal protocols live under `engine/protocols/` and not `core/protocols/`

Two directories, two different roles.

- **`_symphony/core/protocols/`** holds **cross-cutting** protocols that the engine invokes as extension points. Their behavior is defined by specs that can evolve independently (2b, 2c). Agents consume them indirectly through the engine.
- **`_symphony/core/engine/protocols/`** holds **engine-internal** sub-procedures: preflight-check, variable-resolution, planning-gate. These are the engine's private helpers and are owned by Spec 2a permanently.

Keeping them in separate directories makes the architectural distinction visible in the file layout. An agent author or downstream spec looking at `_symphony/core/protocols/` sees only the extension points they can influence. Engine-internal helpers are hidden behind the engine boundary.

### 3.4 Side-effects on existing foundation files

Two small additive edits to files that already exist.

- `_symphony/core/engine/conductor.xml` — the stub is not modified, but Spec 2a documents the contract that the Conductor is expected to meet when it hands off to the workflow engine. The Conductor (Spec 3) must pass: workflow path, optional interaction mode override, and the checkpoint file path to write/read. The workflow engine's XML specifies these as its own expected inputs on the receiving side.
- `_symphony/.gitignore` — Spec 2a adds no new ignore patterns. The foundation's `.gitignore` already covers `_symphony/_memory/checkpoints/*` and `_symphony/_memory/*-sidecar/*`. Since Spec 2a does not introduce a session-state file, no new ignore rule is needed.

### 3.5 Size budget note

`workflow-engine.xml` at ~350 lines exceeds the arch-spec soft guideline of 300 lines for skill files. The engine XML is not a skill — it's the control-flow specification for Symphony itself, and sub-dividing it further would fragment the execution loop across multiple files and make the flow harder to read. Spec 2a accepts the ~350-line file size as an intentional exception. If the file grows past ~450 lines in future revisions, it should be re-decomposed.

---

## 4. Workflow.yaml schema extensions

Spec 2a adds two small schema extensions to the `workflow.yaml` shape defined in architecture spec §6.2. Both are motivated by needs that surface during engine implementation.

### 4.1 `execution.max_turns` (required when `execution.mode: ensemble`)

A hard cap on the number of turns an ensemble workflow will run before forcing termination. Prevents infinite turn loops caused by degenerate turn policies or participants that never signal consensus. Default: `50`. Workflows that need more can set a higher value explicitly.

```yaml
execution:
  mode: ensemble
  ensemble_participants: [alpha, beta]
  ensemble_turn_policy: round-robin
  max_turns: 50
```

The engine enforces this cap as a termination criterion in the ensemble turn loop (§5.2). When reached, the engine writes the final transcript, fires the post-complete gate, and exits normally with status `complete`. It is not a HALT.

### 4.2 `owner: orchestrator` (special value)

Symphony supports workflows that run engine-neutral — no owner persona is adopted. When `owner` is the literal string `orchestrator`, or when the field is absent entirely, the engine skips the persona-adoption step (§5.1 step 5) and executes the workflow in its own neutral voice.

Use cases: framework utility workflows, tests, fixtures, workflows that use a different agent per step through explicit `<invoke-workflow>` or subagent dispatch calls.

```yaml
id: memory-hygiene
phase: anytime
owner: orchestrator
execution:
  mode: sequential
```

This is a Symphony-originated schema addition required for Spec 2a fixtures and for any future engine-neutral workflows.

### 4.3 Schema additions NOT made

The following possible additions were considered and rejected. Documented here so future specs know the decision was deliberate.

| Proposed addition | Decision | Reason |
|---|---|---|
| `input_file_patterns` with `load_strategy` per input | **Rejected** | §6.2 already defines `inputs.required` / `inputs.optional`. The engine's preflight-check reads those existing fields. No new schema needed. |
| `on_error` declarative per-workflow error policy | **Rejected** | §2.4 establishes HALT as the default and philosophical stance. Per-workflow overrides weaken that principle. Adding them now is premature configurability. |
| `config_resolved` + `config_source` (pre-resolved config cache + inheritance chain) | **Rejected** | At v0.0.x with zero workflows, runtime variable resolution is not a measurable problem. Adding a cache and inheritance chain now is complexity without benefit. Two-level resolution (workflow.yaml → global.yaml) is sufficient. |
| `val_validate_output: true` (per-workflow automatic output validation with auto-fix loop) | **Rejected** | Symphony's `self-critique` protocol (Spec 2b) is the general mechanism at threshold 0.85 per arch spec §5.2. Per-workflow opt-in is premature configurability. |
| Handoff protocol writing `_memory/handoffs/{workflow}-{date}.yaml` | **Rejected** | Workflows communicate through their `outputs.primary` file paths as §6.2 specifies. Traceability via `traces_to` per §2.5. A parallel handoff mechanism would duplicate existing state. |

---

## 5. Data flow

Three flows to specify: sequential, ensemble, task runner. Parallel-waves receives only a call-convention stub — Spec 4 owns the rest.

### 5.1 Sequential workflow — end-to-end

The canonical flow. User runs a slash command, the Conductor (stub today; Spec 3 later) picks the workflow, and hands off to the engine.

```
1. Entry from Conductor
   │  Inputs: workflow_path,
   │          interaction_mode (optional override),
   │          checkpoint_path (for reading resume state, writing progress)
   ▼
2. Load workflow.yaml
   │  [invoke protocol="variable-resolution"]
   │    └─ read _symphony/_config/global.yaml, resolve {project-root},
   │       {project-path}, {memory-path}, {checkpoint-path},
   │       {installed-path}, {date}. No inheritance chain.
   ▼
3. Load instructions.xml (read in full — no offset/limit)
   │  count total steps N
   ▼
4. [invoke protocol="preflight-check" phase="before-workflow-start"]
   │  ├─ verify each entry in inputs.required resolves to an on-disk file
   │  ├─ verify checklist.md exists (if declared)
   │  ├─ verify template.md exists (if declared)
   │  ├─ verify all resolved variables are non-empty
   │  └─ HALT on any failure (report ALL failures, not just the first)
   ▼
5. Adopt owner persona
   │  ├─ if owner is "orchestrator" or missing → skip persona adoption
   │  │  and proceed engine-neutral
   │  ├─ else: read _symphony/lifecycle/agents/{owner}.md
   │  ├─ adopt voice/style/expertise/rules for the workflow duration
   │  └─ per R-2a-2: do NOT execute the persona's own activation menu
   ▼
6. Initialize or resume checkpoint
   │  ├─ if checkpoint_path exists and status is any of
   │  │    "halted_unresolved_variable", "halted_gate_failure",
   │  │    "halted_retry_exhausted", "halted_user_abort", or "faulted":
   │  │    enter §6.4 resume semantics
   │  ├─ if checkpoint_path exists and status is "complete":
   │  │    this is a new run — archive the prior checkpoint first,
   │  │    then fall through
   │  ├─ else: write initial checkpoint with workflow_id, run_id,
   │  │    execution_mode, interaction_mode, owner_agent,
   │  │    current_step_index=0, status="in_progress", started_at
   │  └─ atomic write
   ▼
7. [invoke protocol="gate-enforcer" phase="pre-start"]
   │  └─ HALT with status "halted_gate_failure" on any failure
   ▼
8. Interaction mode branch
   │  ├─ normal   → go to step 9
   │  ├─ YOLO     → go to step 9 (yolo flag set)
   │  └─ planning → [invoke protocol="planning-gate"]
   │                 ├─ parse instructions.xml into structured plan
   │                 ├─ present plan with sections:
   │                 │    Context, Files to Modify, Detailed Edits,
   │                 │    Implementation Order, Verification
   │                 ├─ wait for [a]/[y]/[r]/[x]
   │                 ├─ [a] → set mode normal    → step 9
   │                 ├─ [y] → set mode YOLO      → step 9
   │                 ├─ [r] → revise plan       → loop
   │                 └─ [x] → HALT with status "halted_user_abort"
   ▼
9. Step loop (for i in 1..N):
   │
   │  a. [invoke protocol="trust-levels" on="before-step-execute"]
   │     └─ validate knowledge-source trust tags for step i
   │
   │  b. JIT load skills and knowledge fragments referenced in step i
   │     └─ load only what step i uses
   │
   │  c. Execute step i actions
   │     ├─ follow <action>, <ask>, <check>, <template-output> tags
   │     ├─ normal mode: pause at every <ask>
   │     ├─ YOLO mode: answer <ask> from context if unambiguous,
   │     │  otherwise still pause
   │     ├─ subagents invoked for <invoke-workflow>, <invoke-task>,
   │     │  or <action type="subagent-dispatch"> (see §5.2)
   │     └─ on runtime failure: enter diagnose-then-fix (§6.3)
   │
   │  d. [invoke protocol="anti-rationalization" on="before-persist"]
   │     └─ triggers only if the step drafted a skip/defer/simplify
   │        decision; otherwise no-op
   │
   │  e. [invoke protocol="self-critique" on="before-persist"]
   │     └─ if below threshold: retry step once, then escalate (§6.1)
   │
   │  f. Persist <template-output> to declared file path (atomic write)
   │
   │  g. Interaction mode pacing
   │     ├─ normal → show diff, wait for [c]/[y]/[e]
   │     │           (on [y] → switch to YOLO for remainder of workflow)
   │     └─ YOLO   → auto-proceed
   │
   │  h. [invoke protocol="artifact-enrichment-hook" on="after-output-persist"]
   │     └─ non-blocking; hook failures log a warning and continue (§2.9)
   │
   │  i. [invoke protocol="checkpoint-resume" on="after-step-complete"]
   │     └─ write current checkpoint with step i complete,
   │        updated current_step_index, files_touched + sha256
   │
   │  j. Drop step i's skills and knowledge from context (JIT eviction)
   │     └─ persona stays; skills churn
   │
   │  k. Advance i → i+1
   ▼
10. [invoke protocol="gate-enforcer" phase="post-complete"]
    └─ HALT with status "halted_gate_failure" on any failure
    ▼
11. Archive checkpoint to _symphony/_memory/checkpoints/completed/
12. Report workflow complete
```

**Key normative details:**

- Steps 4, 7, 9a, 9d, 9e, 9h, 9i, and 10 are named extension points. At v0.0.x each hits a stub that logs-and-passes. When Specs 2b and 2c land, they replace stubs with real behavior; the engine XML does not change.
- The JIT-evict-before-next-step discipline (step 9j) is the mechanism that keeps the 40K context budget safe. Persona and accumulated progress stay; only skills churn.
- Checkpoint writes happen at every step boundary so resume is a pure "read the checkpoint, seek to `current_step_index + 1`" operation.

### 5.2 Inline subagent dispatch from within an action

Per R-2a-7, Kernel A workflows may dispatch a subagent from within an individual `<action>` step when the step's work benefits from fresh context. The engine recognizes a structured action tag for this.

```xml
<action type="subagent-dispatch">
  <with task="_symphony/core/tasks/adversarial-review.xml"/>
  <with target="{planning-artifacts}/prd.md"/>
  <with persona="_symphony/lifecycle/agents/adversarial-reviewer.md"/>
  <expect-output>adversarial-review-prd-{date}.md</expect-output>
</action>
```

The engine's behavior on reaching this tag:

1. Resolve the `with` children to concrete values.
2. Dispatch a subagent with the task file, target, and persona as context.
3. Wait for the subagent to return.
4. Verify the expected output file exists.
5. Present the subagent's summary to the user and (in normal mode) wait for confirmation before continuing.
6. Continue the step's remaining actions.

This is not a new execution mode; it is a step-level affordance within the Kernel A sequential loop. The main engine stays inline. The subagent is used only for the specific action that requested it.

### 5.3 Ensemble turn loop

Ensemble replaces step 9 in the sequential flow with a turn loop. Steps 1 through 8 and 10 through 12 are identical to the sequential flow. Ensemble runs entirely in Kernel A.

**What `instructions.xml` contains for an ensemble workflow.** Ensemble workflows have a minimal instructions file compared to sequential ones. The engine drives the turn loop; the workflow author does not write a per-step control flow. An ensemble `instructions.xml` contains three blocks, only the first of which is required:

- `<topic>` — required. Declares what the participants are discussing and seeds the transcript with the framing statement the first participant sees.
- `<setup>` — optional. Zero or more `<action>` tags that run once before the loop begins (for example: load a reference document into the transcript, resolve workflow inputs into the topic).
- `<synthesis>` — optional. Zero or more `<action>` tags that run once after the loop terminates (for example: extract decisions from the transcript into a structured decisions-log section of the output file).

Everything else — selecting participants, dispatching turns, evicting personas, appending to the transcript, checkpointing — is the engine's job. Each participant's persona file tells the engine how that participant speaks; the engine does not re-specify participant behavior in instructions.xml. The stopping criterion lives in `checklist.md` as for sequential workflows.

```
9'. Ensemble turn loop (while turn_count < max_turns and not terminated):
    │
    │  a. Select next participant per ensemble_turn_policy
    │     ├─ round-robin    → next in ensemble_participants list (wraps)
    │     ├─ facilitator    → designated facilitator agent decides
    │     └─ user-picks     → prompt the user
    │
    │  b. JIT load the selected participant's persona file
    │     └─ _symphony/lifecycle/agents/{participant}.md
    │        (fixtures load from tests/fixtures/agents/)
    │        If file missing: skip this turn, log warning, advance turn
    │        policy, do not HALT.
    │
    │  c. Re-prime host AI (hard persona boundary):
    │       "You are now {participant_name}. Your persona file is below.
    │        The shared transcript is below. Ignore any voice carried
    │        over from prior turns. Produce exactly one contribution
    │        as {participant_name} and stop."
    │
    │  d. [invoke protocol="trust-levels"] for this participant's sources
    │
    │  e. Generate one contribution (host AI speaks as the participant)
    │
    │  f. [invoke protocol="anti-rationalization" on="before-persist"]
    │     [invoke protocol="self-critique" on="before-persist"]
    │
    │  g. Append contribution to shared transcript (in-context)
    │
    │  h. Persist transcript snapshot to workflow output path (atomic)
    │
    │  i. [invoke protocol="artifact-enrichment-hook"] on transcript
    │
    │  j. [invoke protocol="checkpoint-resume"] with
    │     turn_count, ensemble_turn_pointer, transcript sha256
    │
    │  k. EVICT the prior participant's persona from context
    │     └─ load-bearing: mitigates persona bleed, parallels skill eviction
    │        in sequential mode
    │
    │  l. Check termination:
    │     ├─ user calls it                              → terminate, status complete
    │     ├─ facilitator declares consensus             → terminate, status complete
    │     ├─ checklist.md stopping criterion met        → terminate, status complete
    │     ├─ turn_count == max_turns                    → terminate, status complete
    │     └─ otherwise                                  → next turn (loop to 9'a)
    │
    │  m. Interaction mode pacing between turns
    │     ├─ normal → show latest contribution, wait for user input
    │     ├─ YOLO   → auto-advance (user can interrupt at any time)
    │     └─ planning was handled once, before the loop began
```

**Persona eviction at 9'k is load-bearing.** Without it, each subsequent turn's context still contains the prior participant's fully-loaded persona. The re-priming prompt at 9'c tells the host AI to ignore the prior voice, but the safest mechanism is actual removal. JIT-load and JIT-evict per turn is the same discipline used for skills in sequential mode, applied to personas in ensemble mode.

### 5.4 Parallel-waves call convention (reserved for Spec 4)

Spec 2a does not implement parallel-waves. It defines the dispatch contract that Spec 4's wave executor will use so that Spec 4 can build on a stable shape.

**Input to each subagent dispatched by Kernel B:**

```yaml
persona_file:   "_symphony/lifecycle/agents/{owner}.md"
step_file:      "_symphony/lifecycle/workflows/{phase}/{workflow}/instructions/{step-n}.xml"
wave_inputs:    { ... outputs of upstream waves, keyed by step id ... }
checkpoint_path: "_symphony/_memory/checkpoints/{workflow-id}-{run-id}.yaml"
                 # read-only from the subagent's perspective; only the
                 # wave executor writes checkpoints
```

**Behavior inside the subagent:** the subagent runs a Kernel A with `persona_file` adopted, executing `step_file` with `wave_inputs` treated as prior step outputs.

**Output from each subagent back to Kernel B:**

```yaml
step_id:         "..."                 # as declared in the step file
status:          "complete" | "faulted"
template_output: "...file path written..." | null
files_touched:   [ { path, sha256 } ]
error:           null
                 | { message, diagnostic_hint }
```

Spec 4 defines everything downstream of this contract: how the wave executor builds waves from a DAG, how it aggregates outputs at integration gates, how it detects conflicts, how it retries faulted steps via the diagnose-then-fix loop. Spec 2a does not touch any of that. But the input/output contract above is stable and Spec 4 can build against it without renegotiation.

### 5.5 Task runner flow

Simpler than workflow execution. No workflow lifecycle, no extension-point invocations by default, no checkpointing by default.

```
1. Load task XML (passed as 'task-config' input)
2. Read <objective> — defines success criteria
3. Load critical mandates from <llm critical> block
4. Process each step in <flow> in strict numerical order
   │
   │  a. Execute all <action>s in the step
   │  b. Summarize findings after each step
   │  c. Continue on non-fatal errors — report all findings,
   │     do not stop at first error
   ▼
5. Generate output per the task's <output> specification
6. Persist output (if output location specified) or present to user
7. Done
```

**What the task runner deliberately does NOT do:**

- No variable resolution (tasks do not own workflow.yaml)
- No owner persona adoption (tasks run engine-neutral)
- No pre-start or post-complete gates (tasks opt in per-task if they want gates)
- No automatic checkpointing (tasks opt in per-task if they want it)
- No interaction-mode pacing (tasks are short and single-shot)

Tasks can opt into self-critique or trust-levels by declaring `<invoke protocol="..."/>` tags in their own `<flow>`, but the engine does not inject these by default. Task runner is the simpler kernel for utilities, reviews, and audits where the full workflow lifecycle is overkill.

---

## 6. Error handling

Five failure categories. Each has a distinct response. Every HALT writes a checkpoint before exiting so recovery is always possible.

### 6.1 Failure taxonomy

| Category | Source | Response |
|---|---|---|
| **Missing file** | Preflight or a step `<action>` references a file that does not exist | Report the missing path and the expected source. Ask the user to provide the file or cancel. Wait for user response. Retry the step after the user provides the file. |
| **Unresolved variable** | Variable-resolution cannot resolve a `{var}` reference | HALT immediately. Do not guess or use defaults. Report the variable name and the expected source. Write checkpoint with status `halted_unresolved_variable`. |
| **Quality gate failure** | `<invoke protocol="gate-enforcer"/>` returns FAIL | HALT immediately. Report which gate (pre-start / post-complete), which check, why it failed. Write checkpoint with status `halted_gate_failure` and the gate name. YOLO does not bypass this. |
| **Self-critique below threshold** | `<invoke protocol="self-critique"/>` returns confidence < 0.85 | Retry the step once (the agent re-drafts). If still below threshold: escalate to the user with the confidence score and a summary. User approves, rejects, or revises. Write checkpoint only after resolution. |
| **Step action runtime failure** | An `<action>` fails (shell command non-zero exit, API 5xx, assertion failure, etc.) | Trigger the diagnose-then-fix loop (§6.3). |

No other category. Unknown errors surface as step action runtime failures and go through diagnose-then-fix.

### 6.2 HALT semantics

HALT means, in strict order:

1. Write the current checkpoint with `status: "halted_*"` and `halt_reason: "..."`.
2. Flush current-run state (interaction_mode, owner_agent, current_step_index, ensemble_turn_pointer) into that same checkpoint.
3. Report the HALT reason to the user clearly: what failed, where, and what the user can do.
4. Stop step execution. Do not advance `current_step_index`. Do not run post-complete gates. Do not archive the checkpoint.
5. Exit the engine. The user regains control.

The checkpoint remains at its non-archived location. `/symphony-resume {workflow-id}` finds it there.

**HALT is a control-flow directive, not an exception.** The engine is instructions, not code. There is no stack to unwind. HALT is a rule the host AI follows: write the file, print the message, stop executing further engine instructions.

### 6.3 The diagnose-then-fix loop

The only retry mechanism in Spec 2a. Triggered by step action runtime failure.

```
On step action failure:
  1. Mark step "faulted" in the checkpoint. Capture error and relevant context.
  2. Engine dispatches a Debugger subagent with:
       error text, step file, prior step outputs, workflow.yaml, relevant logs.
  3. Debugger performs root-cause analysis ONLY. Does NOT fix anything.
     Returns a diagnosis: what broke, why, suggested fix target.
  4. Engine hands the diagnosis back to the step's owner (or replacement)
     as additional context, then retries ONLY the faulted step.
     Not prior steps. Not the whole workflow.
  5. Retry succeeds → advance normally.
  6. Retry fails    → HALT with status "halted_retry_exhausted" and
                      the diagnosis plus both error captures in the checkpoint.
```

**Never blind-retry.** Blind retry wastes context and usually reproduces the same failure. Diagnose-then-fix is the engine's only retry path.

**One retry, then escalation.** Arch spec §8.2 mandates "second consecutive retry failure" escalation for the wave executor. Spec 2a uses the same threshold for sequential, ensemble, and task runner: one retry, then escalate to the user. Parallelism does not change the threshold.

**The Debugger agent is defined by Spec 2b**, not here. Spec 2a specifies only the dispatch contract (inputs above) and where in the engine control flow the dispatch happens.

### 6.4 Resume semantics

**Path 1 — User invokes `/symphony-resume {workflow-id}`** after a HALT or after context was dropped.

```
1. Find the checkpoint at _symphony/_memory/checkpoints/{workflow-id}-{run-id}.yaml
2. Read it. Extract: current_step_index, interaction_mode, owner_agent,
   ensemble_turn_pointer, files_touched, status, halt_reason.
3. [invoke protocol="checkpoint-resume" on="before-resume"]
   → Spec 2c validates each files_touched entry still matches its sha256 on disk.
   → If any file changed out-of-band: warn the user, offer Proceed / Start fresh / Review.
4. Re-adopt owner persona (standard workflow startup, unless owner is "orchestrator").
5. Branch on status:
     "halted_gate_failure"           → show halt_reason, ask user to confirm
                                       the underlying issue is resolved,
                                       re-run the failed gate
     "halted_unresolved_variable"    → show halt_reason, ask user to fix
                                       global.yaml or workflow.yaml,
                                       re-run variable resolution
     "halted_retry_exhausted"        → show diagnosis + errors, confirm user
                                       has addressed the issue, re-run the step
     "faulted"                       → same as halted_retry_exhausted
     "halted_user_abort"             → confirm user wants to continue,
                                       resume at current_step_index + 1
     "complete"                      → resume at current_step_index + 1
6. Continue normal execution.
```

**Path 2 — Context loss mid-step.** The step was in progress; no checkpoint was written for it yet (checkpoints write only after a step completes). Nothing on disk indicates "you were halfway through step 7".

Spec 2a's approach: on every workflow start, check for an existing non-archived checkpoint with the same `workflow_id`. If one is found:

- Read `current_step_index = N` (the last completed step).
- Ask the user: *"A prior run of {workflow} stopped at step {N}. Was the interruption mid-step or between steps?"*
- "Between" → resume at N+1.
- "Mid-step" → re-run step N. Workflow authors are expected to write idempotent steps for the happy path; if a step had observable side effects, the user sees them and decides whether to re-run.

This is imperfect but acceptable at v0.0.x. A stronger "in-progress checkpoint" written at step *start* (not just step end) is a Spec 2c refinement flagged for consideration — not required at this milestone.

### 6.5 Interaction mode and errors

YOLO mode never bypasses HALTs, gates, or self-critique escalations. This restates arch spec §6.5 as a normative runtime rule:

| Event | normal mode | YOLO mode |
|---|---|---|
| Missing file | Ask user, wait | Ask user, wait (YOLO cannot fabricate files) |
| Unresolved variable | HALT | HALT |
| Gate failure | HALT | HALT |
| Self-critique below threshold | Retry once, escalate on second miss | Same |
| Step action failure | Diagnose-then-fix, escalate after 1 retry | Same |

The only differences YOLO introduces are at `<template-output>` boundaries (auto-persist without pausing) and `<ask>` tags (auto-answer from context when unambiguous, otherwise still pause). Errors always surface to the user regardless of interaction mode.

### 6.6 What error handling defers to other specs

| Deferred to | What |
|---|---|
| Spec 2b `diagnose-then-fix` protocol | Debugger persona, root-cause methodology, diagnosis format |
| Spec 2b `gate-enforcer` | How individual gate checks evaluate |
| Spec 2b `self-critique` | How confidence is scored, what "re-draft" means mechanically |
| Spec 2c `checkpoint-resume` | Checkpoint file schema, sha256 algorithm, archival layout |
| Spec 2c `memory-hygiene` | Recovery from corrupted or contradicted memory sidecars |
| Spec 4 | Wave executor integration-gate failures, conflict detection, cross-wave recovery |
| Spec 7 | Adapter installation errors |

---

## 7. Testing

### 7.1 Strategy

**Structural + fixture-based.** Extend the existing vitest harness with parse-validity checks, contract-marker assertions, and tiny fixture workflows that tests walk statically. No live host AI calls. Real end-to-end integration testing is deferred to Spec 8 (release polish) where the cost and non-determinism of API-based integration tests make more sense to absorb.

### 7.2 Test file inventory

| File | Status | Purpose |
|---|---|---|
| `tests/engine.test.js` | New | Engine XML parse validity, contract-marker assertions, fixture static walks |
| `tests/fixtures/sequential-hello/workflow.yaml` | New | Minimal sequential fixture config |
| `tests/fixtures/sequential-hello/instructions.xml` | New | One-step instructions with `<template-output>` |
| `tests/fixtures/sequential-hello/checklist.md` | New | Trivial pre-start and post-complete checks |
| `tests/fixtures/sequential-hello/template.md` | New | Minimal output template |
| `tests/fixtures/ensemble-hello/workflow.yaml` | New | Ensemble fixture, 2 participants, round-robin, max_turns: 4 |
| `tests/fixtures/ensemble-hello/instructions.xml` | New | Turn-loop scaffold referencing the participants |
| `tests/fixtures/ensemble-hello/checklist.md` | New | Termination criterion |
| `tests/fixtures/agents/alpha.md` | New | Minimal test persona for ensemble participant |
| `tests/fixtures/agents/beta.md` | New | Minimal test persona for ensemble participant |
| `tests/fixtures/task-hello/task.xml` | New | Single-step standalone task fixture |

`tests/structure.test.js` and `tests/cli.test.js` from the foundation remain untouched.

### 7.3 Assertions in `tests/engine.test.js`

**A. Parse validity (5 assertions).** Every Spec 2a engine XML file parses as well-formed XML:

- `_symphony/core/engine/workflow-engine.xml`
- `_symphony/core/engine/task-runner.xml`
- `_symphony/core/engine/protocols/preflight-check.xml`
- `_symphony/core/engine/protocols/variable-resolution.xml`
- `_symphony/core/engine/protocols/planning-gate.xml`

Implementation: use an XML parser (e.g., `fast-xml-parser` or `xml2js` as a small devDependency). Assertion passes if the parser does not throw.

**B. Contract-marker assertions on `workflow-engine.xml`.** All of the following markers must be present:

*Extension-point invocations (all seven):*
- `<invoke protocol="preflight-check" phase="before-workflow-start"/>`
- `<invoke protocol="gate-enforcer" phase="pre-start"/>`
- `<invoke protocol="gate-enforcer" phase="post-complete"/>`
- `<invoke protocol="trust-levels" on="before-step-execute"/>`
- `<invoke protocol="anti-rationalization" on="before-persist"/>`
- `<invoke protocol="self-critique" on="before-persist"/>`
- `<invoke protocol="checkpoint-resume" on="after-step-complete"/>`
- `<invoke protocol="artifact-enrichment-hook" on="after-output-persist"/>`

*Execution mode branches (all three):*
- A `sequential` branch marker
- An `ensemble` branch marker
- A reserved `parallel-waves` marker with a Spec 4 handoff note

*Interaction mode handling (all three):*
- `normal` mode description
- `YOLO` mode description including the "never bypasses gates / self-critique" clause
- `planning` mode description that invokes `<invoke protocol="planning-gate"/>`

*HALT directives (at least one per failure category):*
- `halted_unresolved_variable`
- `halted_gate_failure`
- `halted_retry_exhausted`

Tests fail with a clear message naming the missing marker if any is absent.

**C. Fixture schema validity (3 assertions).** Each fixture loads and satisfies the §6.2 required fields plus Spec 2a's schema extensions:

- `sequential-hello/workflow.yaml` has: `id`, `owner`, `execution.mode: sequential`, `inputs.required`, `outputs.primary`, `gates.pre_start`, `gates.post_complete`
- `ensemble-hello/workflow.yaml` has: `id`, `execution.mode: ensemble`, `execution.ensemble_participants: [alpha, beta]`, `execution.ensemble_turn_policy: round-robin`, `execution.max_turns` present and numeric
- `task-hello/task.xml` has: `<task id="...">`, `<objective>`, `<flow>` with at least one `<step>`

**D. Fixture static walk (3 assertions).** Each fixture's instructions (or task) XML parses and its step structure is consistent:

- **sequential-hello** → exactly 1 step; step has at least one `<action>`; step declares a `<template-output>` whose `file=` attribute matches `outputs.primary` in `workflow.yaml`
- **ensemble-hello** → `instructions.xml` parses; contains a `<topic>` block with non-empty content; every name in `ensemble_participants` has a corresponding persona file under `tests/fixtures/agents/`; no step-level control-flow tags (`<step>`, `<action>` outside `<setup>`/`<synthesis>`) appear, because the engine drives the loop
- **task-hello** → steps execute in `<flow>` numerical order; no `<invoke protocol>` calls appear by default (task runner does not auto-invoke); exactly one output declaration

**E. Owner persona cross-check.** For every fixture whose `owner` is not `orchestrator`, the referenced persona file exists under `tests/fixtures/agents/`. Catches fixtures that drift.

### 7.4 What the tests deliberately do NOT do

- **No host AI calls.** No Claude API, no Copilot, no model invocations. Pure parse + structural + schema tests that run in under one second under vitest.
- **No execution simulation.** Spec 2a does not build a Node.js interpreter that pretends to be a host AI walking engine instructions.
- **No protocol behavior checks.** Protocols are stubs at v0.0.x; there is nothing real to verify inside them. Specs 2b and 2c will add tests for protocol behavior.
- **No Kernel B tests.** Parallel-waves is declared here but implemented in Spec 4. Spec 4 adds tests when it implements the wave executor.
- **No YOLO/planning mode runtime tests.** Observing the actual pacing requires a host AI. Structural tests verify the modes are declared and documented in the engine XML — that is what Spec 2a can check at build time.

### 7.5 Integration with the existing `npm test` run

```bash
cd symphony-framework
npm test
# Runs: structure.test.js (48 passing from foundation)
#       cli.test.js       ( 2 passing from foundation)
#       engine.test.js    (new — approximately 25 assertions)
# Target: approximately 75 passing, 0 failures
```

The Spec 2a implementation plan must include a Task that runs `npm test` after each engine file is committed, asserting the new assertions pass incrementally as the engine XML grows.

---

## 8. Normative rules summary

Load-bearing rules introduced by Spec 2a. Any downstream spec must respect them.

- **R-2a-1** — Execution inside a single Kernel A is strictly serial. No step-level parallelism constructs. Parallelism is an execution-mode concern handled by Kernel B.
- **R-2a-2** — Persona adoption provides voice, style, expertise, and rules. The engine controls execution. Persona activation menus are never run.
- **R-2a-3** — The engine writes its current state to the checkpoint after every completed step or turn, before advancing. A step is not complete until its checkpoint write succeeds.
- **R-2a-4** — JIT loading applies to skills and knowledge fragments, evicted before the next step. Persona files are not churned between steps in sequential mode; they are churned per turn in ensemble mode.
- **R-2a-5** — All load-bearing failures write a checkpoint with HALT status before exiting. No silent failure paths. Every HALT is recoverable via `/symphony-resume`.
- **R-2a-6** — YOLO never bypasses quality gates, self-critique escalations, or HALTs. YOLO changes only pacing at `<template-output>` and `<ask>` boundaries.
- **R-2a-7** — Kernel A workflows may dispatch subagents from individual `<action>` steps via the structured `<action type="subagent-dispatch">` tag. Default remains inline; per-action subagent dispatch is an explicit opt-in.
- **R-2a-8** — Variable resolution is two-level only: workflow.yaml → `_symphony/_config/global.yaml`. No module-level inheritance chain. No pre-resolved cache at v0.0.x.
- **R-2a-9** — Workflows communicate through their `outputs.primary` file paths as already defined in §6.2. Symphony has no separate handoff protocol or handoff sidecar files.
- **R-2a-10** — Ensemble workflows must declare `execution.max_turns` (default 50). The engine enforces this cap as a termination criterion.
- **R-2a-11** — When `owner` is `orchestrator` or absent, the engine runs engine-neutral and skips persona adoption.
- **R-2a-12** — The engine retries a faulted step at most once (via diagnose-then-fix). A second failure escalates to the user.

---

## 9. Open questions for the implementation plan

Items the implementation plan should resolve but that are not load-bearing for the design itself.

1. **XML parser choice for `tests/engine.test.js`.** `fast-xml-parser` vs `xml2js` vs native XMLParser. Pick the smallest devDependency that covers parse-validity and tag-search needs.
2. **The `<invoke protocol>` tag's exact XML schema.** Design specifies the attribute set (`protocol`, `phase`, `on`); implementation must pin the precise attribute names, required vs optional, and error behavior for unknown attributes.
3. **The structured plan format for planning mode's output artifact.** Design specifies the five sections (Context, Files to Modify, Detailed Edits, Implementation Order, Verification); implementation must pick markdown vs YAML vs XML for the plan's written form.
4. **Whether `planning-gate.xml` writes the plan to disk as a separate artifact** or only presents it in-context. Design says "presents it"; implementation may choose to persist for review even if not required.
5. **Subagent-dispatch action's exact child tag names.** Design shows `<with>` and `<expect-output>`; implementation must pin these and document which are required.

---

## 10. Dependency summary

**Spec 2a depends on:**

- Spec 1 (Architecture) — all of §2 principles, §5 engine component responsibilities, §6 workflow file shape, §8 signature features for the Conductor and Wave Executor contracts

**Spec 2a is depended on by:**

| Spec | What it receives from Spec 2a |
|---|---|
| Spec 2b (Quality) | Extension-point call convention, HALT semantics, the six named `<invoke protocol>` markers that its protocols respond to, the diagnose-then-fix dispatch contract |
| Spec 2c (Persistence) | The required checkpoint fields the engine writes after each step, the `<invoke protocol="checkpoint-resume">` and `<invoke protocol="artifact-enrichment-hook">` call points |
| Spec 3 (Conductor) | The workflow engine's entry contract: inputs (workflow path, optional interaction mode, checkpoint path) and expected side effects |
| Spec 4 (Wave Executor) | The Kernel B dispatch call convention (§5.4) for spawning parallel step subagents |
| Spec 5 (Lifecycle) | The `execution.mode` taxonomy, the `workflow.yaml` schema extensions (`max_turns`, `owner: orchestrator`), the inline subagent-dispatch action pattern |

**Spec 2a does NOT depend on:**

- Any of the cross-cutting protocol stubs (`_symphony/core/protocols/*.xml`). The engine invokes them at declared points, but at v0.0.x they are no-op stubs and the engine ships without them having any behavior.
- Any lifecycle agents or workflows.
- Any adapter translator implementations.
- The Conductor's intent parser or routing logic.

---

## 11. Done definition

Spec 2a is complete when:

1. All five files in §3.1 are written and committed to the Symphony framework repo.
2. `tests/engine.test.js` plus the three fixture directories are written and committed.
3. `npm test` in the Symphony framework repo reports zero failures.
4. A version bump to `0.0.2-alpha.1` is applied to `package.json` and `_symphony/_config/manifest.yaml` (core module version).
5. A walkthrough run of `sequential-hello` fixture by a host AI produces the expected `<template-output>` file. (Manual verification — not automated at v0.0.x per §7.4.)
6. A walkthrough run of `ensemble-hello` fixture by a host AI produces a transcript with two participant turns and visible persona distinction between alpha and beta. (Manual verification.)
7. A walkthrough run of `task-hello` fixture by a host AI produces the declared task output. (Manual verification.)

Items 5, 6, and 7 are manual because automated host-AI testing is out of scope per §7.4. The implementation plan must include a manual-verification checklist that the implementer completes before marking Spec 2a done.
