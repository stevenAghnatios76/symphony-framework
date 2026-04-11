# Symphony Wave Executor — Design Spec (Spec 4)

> **Spec:** 4 of 8 (Wave Executor)
> **Status:** Draft — awaiting user review
> **Date:** 2026-04-10
> **Depends on:** Spec 1 (Architecture §8.2), Spec 2a (Workflow Engine), Spec 2b (Protocols)
> **Scope:** Concrete runtime XML for the Wave Executor (parallel dispatcher). Does NOT cover agents (Spec 5), workflow content (Spec 5), or adapters (Spec 7).

---

## 1. Overview

The Wave Executor is Symphony's signature feature #2 — DAG-based parallel execution with integration gates. It is invoked only for workflows with `execution.mode: parallel-waves` in their `workflow.yaml`.

This spec provides:
- **wave-executor.xml** — runtime XML behavioral directives with 8-step flow
- **wave-hello fixture** — minimal test workflow for structural testing
- **workflow-engine.xml update** — remove the parallel-waves HALT, reference wave-executor

---

## 2. Wave Executor Runtime

**File:** `_symphony/core/engine/wave-executor.xml`

### 2.1 Responsibilities

1. **DAG loading** — read step dependencies from instructions.xml (each step declares `inputs` and `outputs` attributes)
2. **Topological sort** — order steps by dependency chain
3. **Wave building** — group independent steps at each topo rank into waves of ≤4 subagents
4. **Intra-wave conflict handling** — steps sharing file targets run serially within their wave (sub-phases)
5. **Parallel dispatch** — dispatch each step in a wave as an independent subagent with fresh context
6. **Integration gate** — at each wave boundary: aggregate, detect conflicts, consistency check, self-critique
7. **Failure recovery** — faulted step → diagnose-then-fix → retry only that step (max 2 attempts)
8. **Completion** — all waves done, run post-complete gate via gate-enforcer

### 2.2 DAG Format in instructions.xml

Steps in parallel-waves workflows declare dependencies via `inputs` and `outputs` attributes:

```xml
<steps>
  <step n="1" id="arch-scan" outputs="architecture-map.md">
    <action>Scan codebase architecture...</action>
  </step>
  <step n="2" id="api-scan" outputs="api-catalog.md">
    <action>Catalog all APIs...</action>
  </step>
  <step n="3" id="synthesis" inputs="architecture-map.md, api-catalog.md" outputs="gap-prd.md">
    <action>Synthesize findings into gap-focused PRD...</action>
  </step>
</steps>
```

- Steps with no `inputs` attribute (or empty) have no dependencies → eligible for Wave 1
- A step's `inputs` are matched against other steps' `outputs` to build the dependency graph
- The `outputs` attribute declares what the step produces (artifact file names)

### 2.3 Wave Building Rules

1. Topologically sort all steps by their input/output dependencies
2. For each rank in the topo sort, collect all steps at that rank
3. If more than 4 steps at the same rank: split into sub-waves of ≤4
4. **Intra-wave conflict detection:** if two steps in the same wave declare the same output file or share a `conflicts_with` annotation, split them into sub-phases:
   - Sub-phase A1: independent steps (run in parallel)
   - Sub-phase A2: conflicting steps (run after A1 completes)
5. Result: an ordered list of waves, each containing 1–4 steps that can run concurrently

### 2.4 Subagent Dispatch Model

For each step in a wave:
1. Spawn a fresh subagent with an independent context window
2. Provide the subagent with: step instructions from instructions.xml, input artifacts from prior waves (the files declared in the step's `inputs`), the owner persona from workflow.yaml
3. Subagents do NOT share state during execution — no cross-talk within a wave
4. Each subagent writes its output to the path declared in the step's `outputs`
5. The wave executor waits for ALL subagents in the wave to complete before proceeding

### 2.5 Integration Gate

Runs at every wave boundary (after all subagents in a wave finish):

1. **Aggregate outputs** — collect all output files produced by subagents in this wave
2. **Conflict detection** — check if two subagents wrote to the same file path. If so: HALT with conflict report listing both step ids and their outputs
3. **Consistency check** — cross-reference outputs for contradictory decisions. Flag if two steps made incompatible choices (e.g., different technology selections, conflicting interface definitions)
4. **Self-critique** — invoke the self-critique protocol on the aggregated wave output. Confidence must meet the threshold (default 0.85)
5. If all checks pass: merge outputs into the shared artifact set, proceed to next wave
6. If any check fails: HALT with status `halted_integration_gate` and details of which check failed

### 2.6 Failure Recovery

Per-step, not per-wave:

1. If a subagent fails during wave execution: mark that step `faulted`. Other steps in the wave continue normally.
2. After the wave completes, collect results from all successful steps.
3. Invoke the diagnose-then-fix protocol for the faulted step:
   - Debugger (or self-diagnose if no debugger persona) produces root-cause analysis
   - Validate diagnosis confidence ≥ 0.7 (from global.yaml). Below threshold → escalate directly to user.
   - Hand diagnosis to original agent for the fix
   - Retry only the faulted step
4. After retry: re-run the integration gate on the full wave output (successful steps + retry output)
5. Max 2 total attempts per step. After that: HALT with `halted_retry_exhausted`, escalate to user.
6. If multiple steps faulted in the same wave: diagnose and retry each independently, then re-run integration gate once all retries complete.

### 2.7 Mandates

- Subagents within a wave have independent context windows. No shared state.
- Wave N+1 cannot start until Wave N's integration gate passes.
- Retry applies only to the faulted step, never the whole wave.
- Max 4 parallel subagents per wave. Workflows may set a lower limit via `max_wave_siblings` in workflow.yaml.
- The wave executor invokes the same protocols as the workflow engine: trust-levels (before step), anti-rationalization and self-critique (before persist), artifact-enrichment-hook (after persist), checkpoint-resume (after step complete).
- YOLO interaction mode auto-passes integration gates but does NOT skip self-critique or conflict detection.

---

## 3. Workflow Engine Update

**File:** `_symphony/core/engine/workflow-engine.xml`

Remove the HALT message in step 9's parallel-waves branch and replace with a reference to the wave executor:

**Current (line ~111-113):**
```xml
<branch if="execution_mode == 'parallel-waves'">
  HALT with message "parallel-waves not yet implemented; Spec 4 is required..."
</branch>
```

**New:**
```xml
<branch if="execution_mode == 'parallel-waves'">
  Dispatch to the Wave Executor: load _symphony/core/engine/wave-executor.xml and hand off workflow_path, interaction_mode, and checkpoint_path. The Wave Executor manages its own step loop, wave dispatch, and integration gates. Return to step 10 (post-complete gate) when the Wave Executor reports complete.
</branch>
```

---

## 4. Wave-Hello Test Fixture

**Directory:** `tests/fixtures/wave-hello/`

A minimal parallel-waves workflow with 3 steps: 2 independent (Wave 1) and 1 dependent (Wave 2).

### 4.1 workflow.yaml

```yaml
id: wave-hello
owner: orchestrator
model: sonnet
execution:
  mode: parallel-waves
  max_wave_siblings: 4
inputs:
  required: []
  optional: []
outputs:
  primary: tests/fixtures/wave-hello/synthesis-output.md
gates:
  pre_start: []
  post_complete: []
disciplines:
  self_critique: true
  anti_rationalization: true
  trust_levels: true
```

### 4.2 instructions.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<instructions workflow="wave-hello">
  <steps>
    <step n="1" id="alpha-scan" outputs="alpha-output.md">
      <action>Produce a short alpha analysis paragraph.</action>
      <template-output file="tests/fixtures/wave-hello/alpha-output.md">
        Alpha scan complete.
      </template-output>
    </step>
    <step n="2" id="beta-scan" outputs="beta-output.md">
      <action>Produce a short beta analysis paragraph.</action>
      <template-output file="tests/fixtures/wave-hello/beta-output.md">
        Beta scan complete.
      </template-output>
    </step>
    <step n="3" id="synthesis" inputs="alpha-output.md, beta-output.md" outputs="synthesis-output.md">
      <action>Combine alpha and beta findings into a synthesis.</action>
      <template-output file="tests/fixtures/wave-hello/synthesis-output.md">
        Synthesis of alpha and beta findings.
      </template-output>
    </step>
  </steps>
</instructions>
```

### 4.3 checklist.md

```markdown
# wave-hello checklist
## Pre-start
- (none)
## Post-complete
- (none)
```

---

## 5. Testing Strategy

### 5.1 Wave executor tests (`tests/wave-executor.test.js`)
- File exists and parses as valid XML
- `<status>` is `runtime`
- Has `<mandates>` block
- Has `<flow>` with ≥6 step elements
- Contains "topological sort" or "topo" reference
- Contains "integration gate" or "integration-gate"
- Contains max parallel limit ("max 4" or "≤4" or "max_wave_siblings")
- References diagnose-then-fix protocol
- References self-critique protocol
- Contains conflict detection logic

### 5.2 Wave-hello fixture tests
- workflow.yaml exists, parses, has `execution.mode: parallel-waves`
- instructions.xml exists, parses, has steps with `inputs`/`outputs` attributes
- Steps 1 and 2 have no `inputs` (Wave 1 candidates)
- Step 3 has `inputs` referencing outputs of steps 1 and 2 (Wave 2)
- checklist.md exists

### 5.3 Workflow engine update test
- workflow-engine.xml no longer contains "parallel-waves not yet implemented"
- workflow-engine.xml contains "wave-executor" reference in the parallel-waves branch

---

## 6. Files Summary

| Action | File | Lines |
|---|---|---|
| Modify | `_symphony/core/engine/wave-executor.xml` | ~120 |
| Modify | `_symphony/core/engine/workflow-engine.xml` | ~3 lines changed |
| Create | `tests/fixtures/wave-hello/workflow.yaml` | ~20 |
| Create | `tests/fixtures/wave-hello/instructions.xml` | ~25 |
| Create | `tests/fixtures/wave-hello/checklist.md` | ~5 |
| Create | `tests/wave-executor.test.js` | ~55 |

**Total: ~225 lines across 6 files**

---

## 7. Out of Scope

- Agent persona files (Spec 5)
- Actual parallel-waves workflows like Overture or run-all-reviews (Spec 5)
- Adapter implementations (Spec 7)
- The concrete subagent dispatch mechanism (at the meta-prompting level, "dispatch a subagent" means the AI spawns a fresh agent via its tool — the XML instructs the AI to do this, it does not implement a process manager)
