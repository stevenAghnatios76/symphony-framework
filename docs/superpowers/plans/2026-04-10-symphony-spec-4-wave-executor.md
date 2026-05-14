# Wave Executor (Spec 4) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the wave-executor.xml stub with a runtime behavioral directive that builds step DAGs, dispatches parallel subagent waves with integration gates, and handles failure recovery — Symphony's signature feature #2, completing the engine (5/5 runtime).

**Architecture:** The Wave Executor is an XML behavioral directive (~120 lines) the AI reads and follows. Steps in parallel-waves workflows declare `inputs`/`outputs` attributes to form a DAG. The executor topologically sorts steps, groups them into waves of ≤4, dispatches each as a parallel subagent, and runs integration gates at wave boundaries. A test fixture (`wave-hello`) provides a minimal 3-step DAG for structural testing.

**Tech Stack:** XML (behavioral directives), YAML (workflow config), Vitest + fast-xml-parser + yaml (tests)

---

## File Structure

| Action | File | Responsibility |
|---|---|---|
| Modify | `_symphony/core/engine/wave-executor.xml` | DAG-based parallel dispatch with integration gates |
| Modify | `_symphony/core/engine/workflow-engine.xml:31,111-113` | Remove parallel-waves HALT, reference wave-executor |
| Create | `tests/fixtures/wave-hello/workflow.yaml` | Minimal parallel-waves workflow config |
| Create | `tests/fixtures/wave-hello/instructions.xml` | 3-step DAG: 2 independent + 1 dependent |
| Create | `tests/fixtures/wave-hello/checklist.md` | Empty checklist for fixture |
| Create | `tests/wave-executor.test.js` | Structural + fixture tests |

---

### Task 1: Wave-Hello Fixture + Test File

**Files:**
- Create: `tests/fixtures/wave-hello/workflow.yaml`
- Create: `tests/fixtures/wave-hello/instructions.xml`
- Create: `tests/fixtures/wave-hello/checklist.md`
- Create: `tests/wave-executor.test.js`

- [ ] **Step 1: Create wave-hello workflow.yaml**

Create `tests/fixtures/wave-hello/workflow.yaml`:

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

- [ ] **Step 2: Create wave-hello instructions.xml**

Create `tests/fixtures/wave-hello/instructions.xml`:

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

- [ ] **Step 3: Create wave-hello checklist.md**

Create `tests/fixtures/wave-hello/checklist.md`:

```markdown
# wave-hello checklist
## Pre-start
- (none)
## Post-complete
- (none)
```

- [ ] **Step 4: Write the test file**

Create `tests/wave-executor.test.js`:

```javascript
import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { XMLParser } from 'fast-xml-parser';
import YAML from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const root = resolve(dirname(__filename), '..');
const readText = (p) => readFileSync(resolve(root, p), 'utf8');
const readYaml = (p) => YAML.parse(readText(p));
const parser = new XMLParser({ ignoreAttributes: false, allowBooleanAttributes: true, preserveOrder: true });

const wePath = '_symphony/core/engine/wave-executor.xml';

describe('Wave Executor runtime (Spec 4)', () => {
  it('exists and parses as well-formed XML', () => {
    expect(existsSync(resolve(root, wePath))).toBe(true);
    expect(() => parser.parse(readText(wePath))).not.toThrow();
  });

  it('has status runtime', () => {
    expect(readText(wePath)).toContain('<status>runtime</status>');
  });

  it('has mandates block', () => {
    expect(readText(wePath)).toContain('<mandates>');
  });

  it('has flow with at least 6 steps', () => {
    const text = readText(wePath);
    expect(text).toContain('<flow>');
    const stepMatches = text.match(/<step\s/g) || [];
    expect(stepMatches.length).toBeGreaterThanOrEqual(6);
  });

  it('references topological sort', () => {
    expect(readText(wePath)).toMatch(/topological.*sort|topo.*sort/i);
  });

  it('references integration gate', () => {
    expect(readText(wePath)).toMatch(/integration.gate|integration-gate/i);
  });

  it('contains max parallel limit', () => {
    expect(readText(wePath)).toMatch(/max.*4|≤\s*4|max_wave_siblings/i);
  });

  it('references diagnose-then-fix protocol', () => {
    expect(readText(wePath)).toMatch(/diagnose.then.fix/i);
  });

  it('references self-critique protocol', () => {
    expect(readText(wePath)).toMatch(/self.critique/i);
  });

  it('contains conflict detection logic', () => {
    expect(readText(wePath)).toMatch(/conflict.*detect|detect.*conflict/i);
  });
});

describe('Wave Executor — workflow-engine.xml integration', () => {
  it('workflow-engine.xml no longer contains "parallel-waves not yet implemented"', () => {
    const text = readText('_symphony/core/engine/workflow-engine.xml');
    expect(text).not.toContain('parallel-waves not yet implemented');
  });

  it('workflow-engine.xml references wave-executor in parallel-waves branch', () => {
    const text = readText('_symphony/core/engine/workflow-engine.xml');
    expect(text).toMatch(/wave.executor/i);
  });
});

describe('Wave Executor fixtures — wave-hello', () => {
  it('workflow.yaml has execution.mode parallel-waves', () => {
    const y = readYaml('tests/fixtures/wave-hello/workflow.yaml');
    expect(y.execution.mode).toBe('parallel-waves');
  });

  it('workflow.yaml has max_wave_siblings', () => {
    const y = readYaml('tests/fixtures/wave-hello/workflow.yaml');
    expect(y.execution.max_wave_siblings).toBeDefined();
    expect(y.execution.max_wave_siblings).toBeLessThanOrEqual(4);
  });

  it('instructions.xml has steps with inputs/outputs attributes for DAG', () => {
    const text = readText('tests/fixtures/wave-hello/instructions.xml');
    expect(() => parser.parse(text)).not.toThrow();
    expect(text).toContain('outputs=');
    expect(text).toContain('inputs=');
  });

  it('steps 1 and 2 have no inputs (Wave 1 candidates)', () => {
    const text = readText('tests/fixtures/wave-hello/instructions.xml');
    const step1Match = text.match(/<step[^>]*id="alpha-scan"[^>]*/);
    const step2Match = text.match(/<step[^>]*id="beta-scan"[^>]*/);
    expect(step1Match[0]).not.toContain('inputs=');
    expect(step2Match[0]).not.toContain('inputs=');
  });

  it('step 3 has inputs referencing outputs of steps 1 and 2', () => {
    const text = readText('tests/fixtures/wave-hello/instructions.xml');
    const step3Match = text.match(/<step[^>]*id="synthesis"[^>]*/);
    expect(step3Match[0]).toContain('inputs=');
    expect(step3Match[0]).toContain('alpha-output.md');
    expect(step3Match[0]).toContain('beta-output.md');
  });

  it('checklist.md exists', () => {
    expect(existsSync(resolve(root, 'tests/fixtures/wave-hello/checklist.md'))).toBe(true);
  });
});
```

- [ ] **Step 5: Run tests to verify they fail**

Run: `npx vitest run tests/wave-executor.test.js`
Expected: FAIL on "has status runtime" and "workflow-engine.xml no longer contains..." (wave-executor is still a stub, workflow-engine still has the HALT)

- [ ] **Step 6: Commit fixture + test file**

```bash
git add tests/fixtures/wave-hello/ tests/wave-executor.test.js
git commit -m "test(engine): add wave-hello fixture and wave-executor test file (Spec 4)"
```

---

### Task 2: Wave Executor Runtime XML

**Files:**
- Modify: `_symphony/core/engine/wave-executor.xml`

- [ ] **Step 1: Replace wave-executor.xml stub with runtime content**

Replace the entire contents of `_symphony/core/engine/wave-executor.xml` with:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!--
  Symphony Wave Executor — parallel dispatcher with integration gates (Signature Feature #2)
  See architecture spec §8.2
  See Spec 4: docs/superpowers/specs/2026-04-10-symphony-wave-executor-design.md
-->
<wave-executor version="0.0.2-alpha.1">
  <status>runtime</status>
  <spec-reference>docs/superpowers/specs/2026-04-10-symphony-wave-executor-design.md</spec-reference>

  <mandates>
    <mandate>Subagents within a wave have independent context windows. No shared state during wave execution.</mandate>
    <mandate>Wave N+1 cannot start until Wave N's integration gate passes.</mandate>
    <mandate>Retry applies only to the faulted step, never the whole wave.</mandate>
    <mandate>Max 4 parallel subagents per wave. Workflows may set a lower limit via max_wave_siblings in workflow.yaml.</mandate>
    <mandate>The wave executor invokes the same protocols as the workflow engine: trust-levels, anti-rationalization, self-critique, artifact-enrichment-hook, checkpoint-resume.</mandate>
    <mandate>YOLO interaction mode auto-passes integration gates but does NOT skip self-critique or conflict detection.</mandate>
    <mandate>Second consecutive retry failure escalates to the user.</mandate>
  </mandates>

  <flow>
    <step n="1" title="Receive workflow">
      <action>Receive workflow_path, interaction_mode, and checkpoint_path from the Conductor or workflow engine.</action>
      <action>Read workflow.yaml from workflow_path. Confirm execution.mode is "parallel-waves".</action>
      <action>Read max_wave_siblings from workflow.yaml (default 4 if absent).</action>
    </step>

    <step n="2" title="Load step DAG">
      <action>Read instructions.xml from workflow_path.</action>
      <action>Parse all step elements. For each step, extract: id, inputs (comma-separated artifact names), outputs (comma-separated artifact names), actions.</action>
      <action>Build a dependency graph: for each step, its inputs are matched against other steps' outputs. A step depends on every step whose output appears in its inputs list.</action>
      <action>If a step has no inputs attribute or it is empty: the step has no dependencies (root node).</action>
    </step>

    <step n="3" title="Topological sort">
      <action>Topologically sort all steps by their dependency edges.</action>
      <action>If a cycle is detected (step A depends on B which depends on A): HALT with "Circular dependency detected between steps {ids}. Cannot build wave schedule."</action>
      <action>Assign each step a rank (depth in the topo sort). Steps at rank 0 have no dependencies.</action>
    </step>

    <step n="4" title="Build waves">
      <action>Group steps by their topological rank. All steps at rank 0 form the first wave group, rank 1 the second, etc.</action>
      <action>For each rank group: if more than max_wave_siblings steps, split into sub-waves of max_wave_siblings each.</action>
      <action>Intra-wave conflict detection: if two steps in the same wave declare the same output file or share a conflicts_with annotation, split them into sub-phases. Sub-phase A1 runs the independent steps in parallel. Sub-phase A2 runs the conflicting steps after A1 completes.</action>
      <action>Result: an ordered list of waves. Each wave contains 1 to max_wave_siblings steps that can run concurrently.</action>
      <action>Report the wave schedule: "Wave plan: Wave 1 [{step_ids}], Wave 2 [{step_ids}], ..."</action>
    </step>

    <step n="5" title="Pre-start gate">
      <action>Invoke gate-enforcer with phase="pre-start" using the workflow's gate declarations.</action>
      <action>On failure: HALT with status halted_gate_failure.</action>
    </step>

    <step n="6" title="Execute wave loop">
      <for-each item="wave" in="wave schedule">
        <action title="Dispatch subagents">
          For each step in this wave, dispatch a parallel subagent:
          - Fresh context window per subagent (no shared state with other subagents in this wave)
          - Provide: step instructions from instructions.xml, input artifacts from prior waves (files listed in the step's inputs), owner persona from workflow.yaml
          - Each subagent executes its step's actions and writes output to the declared output path
          - Invoke trust-levels protocol before step execution
          - Invoke anti-rationalization and self-critique protocols before persisting output
          - Invoke artifact-enrichment-hook after persisting output
        </action>

        <action title="Wait for wave completion">
          Wait for ALL subagents in this wave to complete (success or failure).
          Collect results: for each step, its status (complete or faulted) and output artifacts.
        </action>

        <action title="Handle faulted steps">
          If any step in this wave faulted:
          - Invoke the diagnose-then-fix protocol for each faulted step
          - Diagnose: root-cause analysis with confidence threshold (0.7 from global.yaml)
          - If confidence below 0.7: escalate directly to user, HALT
          - If confidence sufficient: hand diagnosis to original agent, retry only the faulted step
          - After retry: if still fails, HALT with halted_retry_exhausted, escalate to user
          - Max 2 total attempts per step (original + 1 diagnosed retry)
          - Successful steps from the wave are NOT re-run
        </action>

        <action title="Integration gate">
          After all steps in this wave are complete (including any retries):
          1. Aggregate outputs: collect all output files produced by subagents in this wave
          2. Conflict detection: check if two subagents wrote to the same file path. If so: HALT with "Integration conflict: steps {id1} and {id2} both wrote to {path}."
          3. Consistency check: cross-reference outputs for contradictory decisions. Flag if two steps made incompatible choices.
          4. Self-critique: invoke the self-critique protocol on the aggregated wave output. Confidence must meet threshold (default 0.85).
          5. If all checks pass: merge outputs into the shared artifact set. Proceed to next wave.
          6. If any check fails: HALT with status halted_integration_gate and details.
        </action>

        <action title="Write checkpoint">
          Invoke checkpoint-resume protocol. Record: wave number, steps completed, files_touched with SHA256 hashes.
        </action>
      </for-each>
    </step>

    <step n="7" title="Post-complete gate">
      <action>All waves executed and integration gates passed.</action>
      <action>Invoke gate-enforcer with phase="post-complete".</action>
      <action>On failure: HALT with status halted_gate_failure.</action>
    </step>

    <step n="8" title="Report complete">
      <action>Report workflow complete with: total waves executed, total steps, files_touched, any retries that occurred.</action>
      <action>Archive checkpoint to _symphony/_memory/checkpoints/completed/.</action>
      <action>Return control to the Conductor for next-step suggestions.</action>
    </step>
  </flow>
</wave-executor>
```

- [ ] **Step 2: Run wave executor tests**

Run: `npx vitest run tests/wave-executor.test.js -t "Wave Executor runtime"`
Expected: All 10 tests PASS

- [ ] **Step 3: Commit**

```bash
git add _symphony/core/engine/wave-executor.xml
git commit -m "feat(engine): implement wave-executor runtime with DAG dispatch, integration gates, conflict detection (Spec 4)"
```

---

### Task 3: Workflow Engine Update

**Files:**
- Modify: `_symphony/core/engine/workflow-engine.xml:31,111-113`

- [ ] **Step 1: Update the execution-modes declaration (line 31)**

Find this text in `_symphony/core/engine/workflow-engine.xml`:

```xml
    <mode name="parallel-waves" kernel="B">RESERVED FOR SPEC 4. At v0.0.2-alpha.1, HALT with "parallel-waves not yet implemented; Spec 4 required." See spec section 5.4 for the Kernel B dispatch call convention that Spec 4 must build on.</mode>
```

Replace with:

```xml
    <mode name="parallel-waves" kernel="B">DAG-based parallel dispatch. Handled by the Wave Executor (_symphony/core/engine/wave-executor.xml). The workflow engine hands off to the wave executor for the entire step loop.</mode>
```

- [ ] **Step 2: Update the parallel-waves branch in step 9 (lines 111-113)**

Find this text:

```xml
      <branch if="execution_mode == 'parallel-waves'">
        HALT with message "parallel-waves not yet implemented; Spec 4 is required. The Kernel B dispatch call convention is defined in docs/superpowers/specs/2026-04-08-symphony-core-engine-execution-design.md section 5.4. When Spec 4 lands, it will wrap this engine as Kernel B."
      </branch>
```

Replace with:

```xml
      <branch if="execution_mode == 'parallel-waves'">
        Dispatch to the Wave Executor: load _symphony/core/engine/wave-executor.xml and hand off workflow_path, interaction_mode, and checkpoint_path. The Wave Executor manages its own step loop, wave dispatch, and integration gates. Return to step 10 (post-complete gate) when the Wave Executor reports complete.
      </branch>
```

- [ ] **Step 3: Run the integration tests**

Run: `npx vitest run tests/wave-executor.test.js -t "workflow-engine.xml"`
Expected: Both integration tests PASS ("no longer contains 'parallel-waves not yet implemented'" and "references wave-executor")

- [ ] **Step 4: Run the existing engine tests to confirm no regressions**

Run: `npx vitest run tests/engine.test.js`
Expected: All existing engine tests PASS. Note: the test at line 69 checks for "parallel-waves" and "Spec 4" — verify it still passes since we kept those terms in the new text.

- [ ] **Step 5: Run full test suite**

Run: `npx vitest run`
Expected: 8 test files, ALL tests pass, 0 failures

- [ ] **Step 6: Commit**

```bash
git add _symphony/core/engine/workflow-engine.xml
git commit -m "feat(engine): wire parallel-waves to wave-executor, remove Spec 4 HALT reservation (Spec 4)"
```

---

## Self-Review

**Spec coverage:**
- §2.1 Responsibilities → Task 2 (8-step flow covers all 8) ✓
- §2.2 DAG format → Task 1 fixture instructions.xml with inputs/outputs ✓
- §2.3 Wave building → Task 2 step 4 (topo sort, grouping, sub-phases) ✓
- §2.4 Subagent dispatch → Task 2 step 6 "Dispatch subagents" ✓
- §2.5 Integration gate → Task 2 step 6 "Integration gate" (aggregate, conflicts, consistency, self-critique) ✓
- §2.6 Failure recovery → Task 2 step 6 "Handle faulted steps" (diagnose-then-fix, max 2 attempts) ✓
- §2.7 Mandates → Task 2 mandates block (7 mandates) ✓
- §3 Workflow engine update → Task 3 (both locations updated) ✓
- §4 Test fixture → Task 1 (wave-hello with 3 steps) ✓
- §5 Tests → Task 1 (wave-executor.test.js with structural + fixture + integration tests) ✓

**Placeholder scan:** No TBD, TODO, or vague instructions.

**Type consistency:** Step attributes `inputs`/`outputs` match between fixture instructions.xml, wave-executor.xml DAG loading step, and test assertions. `max_wave_siblings` consistent across workflow.yaml fixture, wave-executor mandates, and step 4.
