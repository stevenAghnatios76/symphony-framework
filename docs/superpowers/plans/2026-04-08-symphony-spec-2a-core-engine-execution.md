# Symphony Spec 2a — Core Engine Execution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Symphony engine stubs shipped in v0.0.1 with the Spec 2a Execution runtime: workflow-engine.xml, task-runner.xml, three engine-internal sub-protocols, a structural test harness, and three fixture workflows. Ship as v0.0.2-alpha.1.

**Architecture:** The engine is XML instructions the host AI loads and follows. No Node.js orchestrator. Kernel A (inline, JIT-evict skills) drives sequential, ensemble, and task runner execution. Kernel B (subagent dispatch wrapper) is reserved for Spec 4. Eight named `<invoke protocol="..."/>` extension points wire to protocol stubs that Specs 2b and 2c will replace without touching the engine XML.

**Tech Stack:** XML 1.0 (engine runtime), YAML (config, fixtures), Markdown (docs, agent personas, templates), Node.js 20+ with vitest and fast-xml-parser (structural tests), git.

**Reference documents:**
- Spec 2a design: `/Users/stevenagh76/Documents/symphony-framework/docs/superpowers/specs/2026-04-08-symphony-core-engine-execution-design.md`
- Architecture spec: `/Users/stevenagh76/Documents/symphony-framework/docs/superpowers/specs/2026-04-08-symphony-architecture-design.md`

**Default repo location:** `/Users/stevenagh76/Documents/symphony-framework/`

---

## File Structure

Files this plan creates, replaces, or modifies, organized by responsibility.

### Engine runtime files (5 total)
- Replace: `_symphony/core/engine/workflow-engine.xml` — the main Kernel A engine
- Replace: `_symphony/core/engine/task-runner.xml` — simpler task runner kernel
- Create: `_symphony/core/engine/protocols/preflight-check.xml` — validates inputs/vars/paths before step execution
- Create: `_symphony/core/engine/protocols/variable-resolution.xml` — resolves `{project-root}`, `{date}`, etc. from global.yaml
- Create: `_symphony/core/engine/protocols/planning-gate.xml` — structured plan presenter for interaction mode `planning`

### Test harness (1 new test file + 1 devDependency)
- Modify: `package.json` — add `fast-xml-parser` devDep and bump version
- Create: `tests/engine.test.js` — parse validity, contract-marker assertions, fixture schema/walk tests

### Test fixtures (11 files across 3 fixtures + a shared agents/ dir)
- Create: `tests/fixtures/sequential-hello/workflow.yaml`
- Create: `tests/fixtures/sequential-hello/instructions.xml`
- Create: `tests/fixtures/sequential-hello/checklist.md`
- Create: `tests/fixtures/sequential-hello/template.md`
- Create: `tests/fixtures/ensemble-hello/workflow.yaml`
- Create: `tests/fixtures/ensemble-hello/instructions.xml`
- Create: `tests/fixtures/ensemble-hello/checklist.md`
- Create: `tests/fixtures/agents/alpha.md`
- Create: `tests/fixtures/agents/beta.md`
- Create: `tests/fixtures/task-hello/task.xml`

### Version + manifest
- Modify: `package.json` — version `0.0.1` → `0.0.2-alpha.1`
- Modify: `_symphony/_config/manifest.yaml` — core module version `0.0.1` → `0.0.2-alpha.1`

---

## Tasks

### Task 1: Install XML parser and scaffold `tests/engine.test.js` with parse-validity tests

**Files:**
- Modify: `package.json` (add `fast-xml-parser` to devDependencies)
- Create: `tests/engine.test.js`

- [ ] **Step 1: Verify working tree is clean**

Run: `cd /Users/stevenagh76/Documents/symphony-framework && git status`

Expected: `On branch main` ... `nothing to commit, working tree clean` (modulo any uncommitted work that belongs to another task).

- [ ] **Step 2: Add `fast-xml-parser` and `yaml` as devDependencies and install**

Both parsers are needed by `tests/engine.test.js` — `fast-xml-parser` for XML parse validity and structural checks, `yaml` for fixture `workflow.yaml` parsing in later tasks. Installing both upfront keeps the test file's top-level imports valid from Task 1 onward.

Run:
```bash
cd /Users/stevenagh76/Documents/symphony-framework && npm install --save-dev fast-xml-parser@^4.3.0 yaml@^2.3.0
```

Expected: both packages install into `node_modules/`. `package.json` gains both entries under `devDependencies`. `package-lock.json` updates.

- [ ] **Step 3: Create `tests/engine.test.js` with parse-validity assertions**

Write `/Users/stevenagh76/Documents/symphony-framework/tests/engine.test.js` with this EXACT content. Note the `yaml` import is declared at the top of the file even though it is not used until Task 8 — ES module imports must be at the top, and declaring it once here keeps the file valid through every subsequent task append.

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

const parser = new XMLParser({
  ignoreAttributes: false,
  allowBooleanAttributes: true,
  preserveOrder: true,
});

const parseXml = (relPath) => {
  const text = readText(relPath);
  return parser.parse(text);
};

describe('Symphony engine XML — parse validity', () => {
  const engineFiles = [
    '_symphony/core/engine/workflow-engine.xml',
    '_symphony/core/engine/task-runner.xml',
    '_symphony/core/engine/protocols/preflight-check.xml',
    '_symphony/core/engine/protocols/variable-resolution.xml',
    '_symphony/core/engine/protocols/planning-gate.xml',
  ];

  for (const file of engineFiles) {
    it(`${file} exists and parses as well-formed XML`, () => {
      expect(existsSync(resolve(root, file))).toBe(true);
      expect(() => parseXml(file)).not.toThrow();
    });
  }
});
```

- [ ] **Step 4: Run the tests and observe the expected state**

Run: `cd /Users/stevenagh76/Documents/symphony-framework && npm test 2>&1 | tail -20`

Expected: The existing 50 tests from the foundation still pass. The 5 new engine.test.js parse-validity assertions run:
- `workflow-engine.xml` → **passes** (foundation stub exists and is valid XML)
- `task-runner.xml` → **passes** (foundation stub exists and is valid XML)
- `preflight-check.xml` → **fails** (file does not exist yet; `existsSync` returns false)
- `variable-resolution.xml` → **fails** (file does not exist yet)
- `planning-gate.xml` → **fails** (file does not exist yet)

Three of the five new tests are expected to fail. That is the TDD "red" state for Tasks 2-4.

- [ ] **Step 5: Commit**

Run:
```bash
cd /Users/stevenagh76/Documents/symphony-framework && git add package.json package-lock.json tests/engine.test.js && git commit -m "test(engine): scaffold engine.test.js with parse-validity assertions (3 failing)"
```

Expected: Commit created with three staged files. No Claude co-author trailer.

---

### Task 2: Create `variable-resolution.xml`

**Files:**
- Create: `_symphony/core/engine/protocols/variable-resolution.xml`

- [ ] **Step 1: Write the file**

Write `/Users/stevenagh76/Documents/symphony-framework/_symphony/core/engine/protocols/variable-resolution.xml` with this EXACT content:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!--
  Symphony Engine-Internal Protocol: variable-resolution
  Owned by Spec 2a. Engine-internal — not a cross-cutting protocol.
  See docs/superpowers/specs/2026-04-08-symphony-core-engine-execution-design.md section 5.1 step 2
-->
<protocol name="variable-resolution" version="0.0.2-alpha.1">
  <objective>
    Resolve template variables in workflow.yaml against _symphony/_config/global.yaml
    before the workflow engine proceeds to preflight-check.
  </objective>

  <mandates>
    <mandate>Two-level resolution only: workflow.yaml references resolve against global.yaml. No module-level inheritance chain.</mandate>
    <mandate>No pre-resolved cache at v0.0.2-alpha.1. All resolution is runtime.</mandate>
    <mandate>If any variable cannot be resolved, HALT with status halted_unresolved_variable. Do not guess or use defaults.</mandate>
    <mandate>Variable names use curly-brace syntax: {project-root}, {project-path}, {memory-path}, {checkpoint-path}, {installed-path}, {date}.</mandate>
  </mandates>

  <supported-variables>
    <variable name="project-root">The absolute filesystem path of the Symphony-installed project root. Read from {project-root}/_symphony/_config/global.yaml field project_root. If the field is missing, use the directory containing _symphony/.</variable>
    <variable name="project-path">Where application source code lives. Read global.yaml field project_path. If the value is "." or the field is missing, set project-path = project-root. Otherwise project-path = project-root/project_path.</variable>
    <variable name="memory-path">Absolute path to the Symphony memory root. Default: project-root/_symphony/_memory. Override via global.yaml field memory_path.</variable>
    <variable name="checkpoint-path">Absolute path to the checkpoint directory. Default: memory-path/checkpoints. Override via global.yaml field checkpoint_path.</variable>
    <variable name="installed-path">Absolute path of the current workflow directory (the directory containing workflow.yaml).</variable>
    <variable name="date">Current ISO-8601 date (YYYY-MM-DD) at workflow start.</variable>
  </supported-variables>

  <flow>
    <step n="1" title="Read global config">
      <action>Read {project-root}/_symphony/_config/global.yaml</action>
      <action>Extract: project_root, project_path, memory_path, checkpoint_path</action>
    </step>
    <step n="2" title="Resolve core variables">
      <action>Set project-root to the detected filesystem path</action>
      <action>Set project-path per the rule above</action>
      <action>Set memory-path per the rule above</action>
      <action>Set checkpoint-path per the rule above</action>
      <action>Set installed-path to the directory containing the current workflow.yaml</action>
      <action>Set date to the current ISO-8601 date</action>
    </step>
    <step n="3" title="Substitute in workflow.yaml">
      <action>Walk workflow.yaml string values and substitute every {var} occurrence with its resolved value</action>
      <action>Report any unresolved {var} reference</action>
    </step>
    <step n="4" title="HALT if unresolved">
      <action>If any substitution left an unresolved {var}, HALT with status halted_unresolved_variable and the list of unresolved variable names</action>
    </step>
    <step n="5" title="Return resolved config">
      <action>Return the substituted workflow.yaml to the calling engine</action>
    </step>
  </flow>
</protocol>
```

- [ ] **Step 2: Run the tests**

Run: `cd /Users/stevenagh76/Documents/symphony-framework && npm test 2>&1 | tail -15`

Expected: The `variable-resolution.xml` parse test flips from fail to pass. Two parse-validity failures remain (`preflight-check.xml`, `planning-gate.xml`).

- [ ] **Step 3: Commit**

Run:
```bash
cd /Users/stevenagh76/Documents/symphony-framework && git add _symphony/core/engine/protocols/variable-resolution.xml && git commit -m "feat(engine): add variable-resolution engine-internal protocol"
```

---

### Task 3: Create `preflight-check.xml`

**Files:**
- Create: `_symphony/core/engine/protocols/preflight-check.xml`

- [ ] **Step 1: Write the file**

Write `/Users/stevenagh76/Documents/symphony-framework/_symphony/core/engine/protocols/preflight-check.xml` with this EXACT content:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!--
  Symphony Engine-Internal Protocol: preflight-check
  Owned by Spec 2a. Engine-internal — not a cross-cutting protocol.
  See docs/superpowers/specs/2026-04-08-symphony-core-engine-execution-design.md section 5.1 step 4
-->
<protocol name="preflight-check" version="0.0.2-alpha.1">
  <objective>
    Validate all workflow inputs, declared files, and resolved variables
    before the workflow engine enters the step loop. Collect ALL failures
    and report them together — never stop at the first.
  </objective>

  <mandates>
    <mandate>Run ONLY after variable-resolution has completed successfully</mandate>
    <mandate>Collect all failures into a single report before halting</mandate>
    <mandate>On any failure: HALT with the appropriate status</mandate>
    <mandate>Never fabricate, guess, or default missing files</mandate>
  </mandates>

  <flow>
    <step n="1" title="Verify inputs.required files exist">
      <action>For each entry in workflow.yaml inputs.required: resolve its path (it is already resolved by variable-resolution) and verify the file exists on disk</action>
      <action>If a required input file is missing: record failure category "missing_required_input" with the input ID and expected path</action>
    </step>
    <step n="2" title="Verify inputs.optional files (non-failing)">
      <action>For each entry in workflow.yaml inputs.optional: check existence but do not fail if missing. Record which optional inputs are present for the engine's downstream logic.</action>
    </step>
    <step n="3" title="Verify checklist.md if declared">
      <action>If workflow.yaml declares a checklist file path, verify it exists</action>
      <action>If missing: record failure category "missing_checklist"</action>
    </step>
    <step n="4" title="Verify template.md if declared">
      <action>If workflow.yaml declares a template file path, verify it exists</action>
      <action>If missing: record failure category "missing_template"</action>
    </step>
    <step n="5" title="Verify all resolved variables are non-empty">
      <action>For every variable resolved in variable-resolution, verify its value is non-empty</action>
      <action>If empty: record failure category "empty_resolved_variable" with the variable name</action>
    </step>
    <step n="6" title="Verify gates.pre_start conditions are readable">
      <action>For each pre_start gate declared in workflow.yaml, verify the gate's check descriptor is readable (the gate-enforcer will actually run them later)</action>
      <action>If a gate's check field is missing or malformed: record failure category "malformed_pre_start_gate"</action>
    </step>
    <step n="7" title="Halt on failures or proceed">
      <action>If any failures were recorded in steps 1-6: HALT with status halted_missing_file (if any missing-file failure) or halted_unresolved_variable (if any empty-variable failure) or halted_preflight_gate_malformed (if any gate descriptor failure). Report ALL failures in the halt message, not just the first.</action>
      <action>If no failures: return success and proceed to step 7 of the workflow engine (pre-start gate enforcer)</action>
    </step>
  </flow>
</protocol>
```

- [ ] **Step 2: Run the tests**

Run: `cd /Users/stevenagh76/Documents/symphony-framework && npm test 2>&1 | tail -15`

Expected: The `preflight-check.xml` parse test flips from fail to pass. One parse-validity failure remains (`planning-gate.xml`).

- [ ] **Step 3: Commit**

Run:
```bash
cd /Users/stevenagh76/Documents/symphony-framework && git add _symphony/core/engine/protocols/preflight-check.xml && git commit -m "feat(engine): add preflight-check engine-internal protocol"
```

---

### Task 4: Create `planning-gate.xml`

**Files:**
- Create: `_symphony/core/engine/protocols/planning-gate.xml`

- [ ] **Step 1: Write the file**

Write `/Users/stevenagh76/Documents/symphony-framework/_symphony/core/engine/protocols/planning-gate.xml` with this EXACT content:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!--
  Symphony Engine-Internal Protocol: planning-gate
  Owned by Spec 2a. Engine-internal — not a cross-cutting protocol.
  Invoked only when interaction_mode is "planning".
  See docs/superpowers/specs/2026-04-08-symphony-core-engine-execution-design.md section 5.1 step 8
-->
<protocol name="planning-gate" version="0.0.2-alpha.1">
  <objective>
    Present a structured execution plan to the user before any workflow
    step runs. Collect user approval or abort. Return the runtime
    interaction mode (normal or YOLO) that the engine should use after
    approval.
  </objective>

  <mandates>
    <mandate>Invoked only when interaction_mode == "planning"</mandate>
    <mandate>Parse instructions.xml into a structured plan — do not execute any step</mandate>
    <mandate>Present the plan in fixed section order for predictability</mandate>
    <mandate>Wait for user selection: a (normal) | y (YOLO) | r (revise) | x (abort)</mandate>
    <mandate>Never auto-approve. The user must explicitly select a or y.</mandate>
  </mandates>

  <plan-sections>
    <section name="Context">High-level goal statement from the workflow's description, the owner agent, the declared inputs, and the expected outputs</section>
    <section name="Files to Modify">Every file path the plan will write to, extracted from step template-output declarations</section>
    <section name="Detailed Edits">One line per step: step number, title, what the step produces, which skills it JIT-loads</section>
    <section name="Implementation Order">The strict numerical step order as declared in instructions.xml</section>
    <section name="Verification">Which gates fire pre-start and post-complete, which cross-cutting disciplines are invoked</section>
  </plan-sections>

  <flow>
    <step n="1" title="Parse instructions for plan content">
      <action>Read the already-loaded instructions.xml content</action>
      <action>Extract each step's number, title, actions, template-output (if any), skill references</action>
      <action>Extract gate declarations from workflow.yaml</action>
      <action>Build the five Plan Sections listed above</action>
    </step>
    <step n="2" title="Present plan">
      <action>Render the plan sections to the user in fixed order: Context, Files to Modify, Detailed Edits, Implementation Order, Verification</action>
      <action>Omit any section that is empty (e.g., a workflow with no template-outputs has no Files to Modify)</action>
    </step>
    <step n="3" title="Collect user decision">
      <action>Display prompt: "[a] Approve (normal) | [y] Approve (YOLO) | [r] Revise plan | [x] Abort"</action>
      <action>Wait for user selection</action>
    </step>
    <step n="4" title="Handle decision">
      <action if="user selects [a]">Return runtime_mode = normal. Engine proceeds to step 9 of workflow flow.</action>
      <action if="user selects [y]">Return runtime_mode = YOLO. Engine proceeds to step 9 of workflow flow.</action>
      <action if="user selects [r]">Ask user for feedback on the plan. Regenerate plan incorporating feedback. Re-present via step 2.</action>
      <action if="user selects [x]">HALT the workflow with status halted_user_abort. Write checkpoint with abort reason.</action>
    </step>
  </flow>
</protocol>
```

- [ ] **Step 2: Run the tests**

Run: `cd /Users/stevenagh76/Documents/symphony-framework && npm test 2>&1 | tail -15`

Expected: All 5 parse-validity tests now pass. Total test count: 55 passing (50 foundation + 5 parse validity). Zero failures.

- [ ] **Step 3: Commit**

Run:
```bash
cd /Users/stevenagh76/Documents/symphony-framework && git add _symphony/core/engine/protocols/planning-gate.xml && git commit -m "feat(engine): add planning-gate engine-internal protocol"
```

---

### Task 5: Replace `task-runner.xml` stub with Spec 2a content

**Files:**
- Replace: `_symphony/core/engine/task-runner.xml`

- [ ] **Step 1: Replace the entire file**

Write `/Users/stevenagh76/Documents/symphony-framework/_symphony/core/engine/task-runner.xml` with this EXACT content, overwriting the foundation stub:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!--
  Symphony Task Runner — standalone task execution (Kernel A simplified)
  See docs/superpowers/specs/2026-04-08-symphony-core-engine-execution-design.md section 5.5
-->
<task-runner version="0.0.2-alpha.1">
  <status>runtime</status>
  <spec-reference>docs/superpowers/specs/2026-04-08-symphony-core-engine-execution-design.md</spec-reference>

  <objective>
    Execute standalone tasks: reviews, audits, utilities. Simpler than
    the workflow engine — no workflow lifecycle, no variable resolution
    chain, no pre-start or post-complete gates by default, no automatic
    checkpointing. Tasks can opt in to self-critique or trust-levels by
    declaring invoke tags in their own flow.
  </objective>

  <mandates>
    <mandate>You are now the Symphony Task Runner. Follow these instructions EXACTLY.</mandate>
    <mandate>Execute steps in strict numerical order. NEVER skip or reorder.</mandate>
    <mandate>Enforce all critical mandates from the task config.</mandate>
    <mandate>Report ALL findings — do not stop at the first error.</mandate>
    <mandate>Stay within 40K tokens per activation.</mandate>
  </mandates>

  <inputs>
    <input name="task_config" required="true">Absolute path to the task XML file to execute</input>
  </inputs>

  <flow>
    <step n="1" title="Load task config">
      <action>Read the task XML file at task_config</action>
      <action>Parse: task id, name, objective</action>
      <action>Extract critical mandates from llm critical blocks</action>
      <action>Count total steps in the task's flow section</action>
    </step>

    <step n="2" title="Validate task structure">
      <action>Verify the task XML has objective, flow, output elements</action>
      <action>Verify each flow step has a title and at least one action</action>
      <action if="validation fails">Report structural issues and still attempt execution (task runner is more permissive than workflow engine)</action>
    </step>

    <step n="3" title="Execute task flow">
      <action>Process each step from the task flow section in strict numerical order</action>
      <action>For each step: read the title and all actions</action>
      <action>Execute each action using available tools</action>
      <action>Collect results and findings continuously — never wait until the end to reveal issues</action>
      <action>Summarize step results before moving to the next step</action>
      <action if="a step contains invoke protocol tags">Invoke the referenced protocol (task runner honors opt-in protocol invocations but does not inject its own)</action>
    </step>

    <step n="4" title="Generate output">
      <action>Read the output format specification from the task config</action>
      <action>Compile all step results into the specified format</action>
      <action if="output location is specified">Save to that location via atomic write</action>
      <action if="no output location">Present the final output to the user</action>
    </step>
  </flow>

  <what-task-runner-does-not-do>
    <item>No variable resolution — tasks do not own a workflow.yaml</item>
    <item>No owner persona adoption — tasks run engine-neutral</item>
    <item>No pre-start or post-complete gates by default</item>
    <item>No automatic checkpointing by default</item>
    <item>No interaction-mode pacing — tasks are short and single-shot</item>
    <item>No diagnose-then-fix loop injection — tasks handle their own errors</item>
  </what-task-runner-does-not-do>

  <supported-tags>
    <structural>step action ask check</structural>
    <persistence>output template-output</persistence>
    <invocation>invoke (for opt-in protocol calls like self-critique or trust-levels)</invocation>
  </supported-tags>
</task-runner>
```

- [ ] **Step 2: Run the tests**

Run: `cd /Users/stevenagh76/Documents/symphony-framework && npm test 2>&1 | tail -15`

Expected: All 55 tests still pass. The parse-validity test for `task-runner.xml` still passes (the new content is valid XML).

- [ ] **Step 3: Commit**

Run:
```bash
cd /Users/stevenagh76/Documents/symphony-framework && git add _symphony/core/engine/task-runner.xml && git commit -m "feat(engine): replace task-runner.xml stub with Spec 2a runtime content"
```

---

### Task 6: Add contract-marker tests to `tests/engine.test.js`

**Files:**
- Modify: `tests/engine.test.js`

TDD step: add the contract-marker assertions BEFORE replacing the workflow-engine.xml stub. The new tests will fail against the stub content; Task 7 replaces the stub and flips them to green.

- [ ] **Step 1: Append contract-marker test blocks to `tests/engine.test.js`**

Append to `/Users/stevenagh76/Documents/symphony-framework/tests/engine.test.js` the following content, placed AFTER the closing `});` of the existing `describe('Symphony engine XML — parse validity', ...)` block:

```javascript

const engineText = () => readText('_symphony/core/engine/workflow-engine.xml');

describe('Symphony engine XML — contract markers on workflow-engine.xml', () => {
  describe('extension point invocations (all eight)', () => {
    const markers = [
      '<invoke protocol="preflight-check" phase="before-workflow-start"/>',
      '<invoke protocol="gate-enforcer" phase="pre-start"/>',
      '<invoke protocol="gate-enforcer" phase="post-complete"/>',
      '<invoke protocol="trust-levels" on="before-step-execute"/>',
      '<invoke protocol="anti-rationalization" on="before-persist"/>',
      '<invoke protocol="self-critique" on="before-persist"/>',
      '<invoke protocol="checkpoint-resume" on="after-step-complete"/>',
      '<invoke protocol="artifact-enrichment-hook" on="after-output-persist"/>',
    ];
    for (const marker of markers) {
      it(`contains ${marker}`, () => {
        expect(engineText()).toContain(marker);
      });
    }
  });

  describe('execution mode branches', () => {
    it('has a sequential mode branch marker', () => {
      expect(engineText()).toMatch(/execution_mode\s*==\s*['"]sequential['"]|<mode name="sequential"/);
    });
    it('has an ensemble mode branch marker', () => {
      expect(engineText()).toMatch(/execution_mode\s*==\s*['"]ensemble['"]|<mode name="ensemble"/);
    });
    it('has a parallel-waves reservation with a Spec 4 handoff note', () => {
      const text = engineText();
      expect(text).toContain('parallel-waves');
      expect(text).toContain('Spec 4');
    });
  });

  describe('interaction modes', () => {
    it('has a normal mode description', () => {
      expect(engineText()).toMatch(/<mode name="normal">|interaction_mode\s*==\s*['"]normal['"]/);
    });
    it('has a YOLO mode description that mentions gates/self-critique cannot be bypassed', () => {
      const text = engineText();
      expect(text).toContain('YOLO');
      expect(text).toMatch(/never bypass|NEVER bypass|does not bypass/i);
    });
    it('has a planning mode description that invokes planning-gate', () => {
      const text = engineText();
      expect(text).toContain('planning');
      expect(text).toContain('planning-gate');
    });
  });

  describe('HALT directives', () => {
    const haltStatuses = [
      'halted_unresolved_variable',
      'halted_gate_failure',
      'halted_retry_exhausted',
    ];
    for (const status of haltStatuses) {
      it(`declares HALT status "${status}"`, () => {
        expect(engineText()).toContain(status);
      });
    }
  });
});
```

- [ ] **Step 2: Run the tests and confirm the new assertions fail**

Run: `cd /Users/stevenagh76/Documents/symphony-framework && npm test 2>&1 | tail -30`

Expected: The 55 passing tests still pass. The new contract-marker tests fail because the current `workflow-engine.xml` is still the foundation stub which does not contain any of the markers. Expected failure count: ~17 new failures (8 extension point markers + 3 execution mode markers + 3 interaction mode markers + 3 HALT directive markers).

- [ ] **Step 3: Commit the failing tests**

Run:
```bash
cd /Users/stevenagh76/Documents/symphony-framework && git add tests/engine.test.js && git commit -m "test(engine): add contract-marker assertions for workflow-engine.xml (failing)"
```

---

### Task 7: Replace `workflow-engine.xml` stub with Spec 2a runtime content

**Files:**
- Replace: `_symphony/core/engine/workflow-engine.xml`

This is the largest task. The new engine XML implements the Kernel A inline control flow for sequential + ensemble execution, interaction-mode pacing, extension-point invocations, HALT semantics, and the diagnose-then-fix dispatch contract. It also reserves the parallel-waves call convention for Spec 4.

- [ ] **Step 1: Replace the entire file**

Write `/Users/stevenagh76/Documents/symphony-framework/_symphony/core/engine/workflow-engine.xml` with this EXACT content, overwriting the foundation stub:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!--
  Symphony Workflow Engine — Kernel A (inline) + Kernel B (dispatch reservation)
  Replaces the v0.0.1 foundation stub with the Spec 2a runtime.
  See docs/superpowers/specs/2026-04-08-symphony-core-engine-execution-design.md
-->
<workflow-engine version="0.0.2-alpha.1">
  <status>runtime</status>
  <spec-reference>docs/superpowers/specs/2026-04-08-symphony-core-engine-execution-design.md</spec-reference>

  <mandates>
    <mandate>You are the Symphony Workflow Engine. Follow these instructions EXACTLY.</mandate>
    <mandate>Execute steps in strict numerical order. NEVER skip or reorder.</mandate>
    <mandate>Write a checkpoint after every completed step or turn, before advancing.</mandate>
    <mandate>Quality gates HALT on failure. YOLO never bypasses quality gates, self-critique escalations, or HALTs.</mandate>
    <mandate>JIT-load skills per step. Evict before the next step loads its own.</mandate>
    <mandate>The persona file tells you HOW to speak. The engine tells you WHAT to do. You control step execution, not the persona's activation menu.</mandate>
    <mandate>Stay within 40K tokens per activation via JIT skill eviction.</mandate>
    <mandate>Every load-bearing failure writes a checkpoint with HALT status before exiting. No silent failures.</mandate>
  </mandates>

  <inputs>
    <input name="workflow_path" required="true">Absolute path to the workflow directory (containing workflow.yaml)</input>
    <input name="interaction_mode" required="false">One of normal|YOLO|planning. Overrides workflow.yaml default if set.</input>
    <input name="checkpoint_path" required="true">Absolute path to the run's checkpoint file</input>
  </inputs>

  <execution-modes>
    <mode name="sequential" kernel="A">Single owner agent, linear step execution, JIT skill eviction between steps</mode>
    <mode name="ensemble" kernel="A">Multi-participant turn loop with persona hot-swap and eviction between turns</mode>
    <mode name="parallel-waves" kernel="B">RESERVED FOR SPEC 4. At v0.0.2-alpha.1, HALT with "parallel-waves not yet implemented; Spec 4 required." See spec section 5.4 for the Kernel B dispatch call convention that Spec 4 must build on.</mode>
  </execution-modes>

  <interaction-modes>
    <mode name="normal">
      Default. Pause at every template-output (show diff, wait for [c]/[y]/[e]) and every ask tag.
      Never auto-advance past an ask. When in doubt about whether to pause, PAUSE.
    </mode>
    <mode name="YOLO">
      Auto-persist template-outputs without pausing. Auto-answer ask tags from context only when the answer is unambiguous; otherwise still pause.
      YOLO never bypasses quality gates. YOLO never bypasses self-critique escalations. YOLO never bypasses HALTs.
      User can say "switch to normal mode" at any time to return to normal pacing.
    </mode>
    <mode name="planning">
      Before any step executes, invoke the planning-gate protocol. The planning-gate presents a structured plan and waits for user approval.
      After approval, switch to normal or YOLO per user selection, then proceed to step 9.
    </mode>
  </interaction-modes>

  <flow>
    <step n="1" title="Entry from Conductor">
      <action>Receive workflow_path, optional interaction_mode, checkpoint_path from the calling Conductor (or from /symphony-resume)</action>
    </step>

    <step n="2" title="Load workflow.yaml and resolve variables">
      <action>Read {workflow_path}/workflow.yaml</action>
      <invoke protocol="variable-resolution"/>
      <on-failure>HALT with status halted_unresolved_variable</on-failure>
    </step>

    <step n="3" title="Load instructions.xml">
      <action>Read {workflow_path}/instructions.xml in full — never use offset/limit</action>
      <action>Count total steps N (for sequential workflows) or note that instructions contains only topic/setup/synthesis blocks (for ensemble workflows)</action>
    </step>

    <step n="4" title="Preflight check">
      <invoke protocol="preflight-check" phase="before-workflow-start"/>
      <on-failure>HALT with status halted_missing_file or halted_unresolved_variable per the failure category reported by preflight-check</on-failure>
    </step>

    <step n="5" title="Adopt owner persona">
      <action if="workflow.yaml owner is 'orchestrator' or owner is absent">Skip persona adoption. Run engine-neutral.</action>
      <action if="owner is a real agent id">Read _symphony/lifecycle/agents/{owner}.md</action>
      <action if="owner is a real agent id">Adopt the persona's voice, style, expertise, and rules for the workflow duration</action>
      <action if="owner is a real agent id">Do NOT execute the persona's own activation menu, greeting, or internal routing. The engine controls step execution, not the persona.</action>
    </step>

    <step n="6" title="Initialize or resume checkpoint">
      <action>Check if checkpoint_path exists</action>
      <branch if="checkpoint exists and status is one of halted_unresolved_variable, halted_missing_file, halted_gate_failure, halted_retry_exhausted, halted_user_abort, or faulted">
        Enter resume semantics: read current_step_index, interaction_mode, owner_agent, ensemble_turn_pointer, files_touched, status, halt_reason. Invoke checkpoint-resume protocol to validate files_touched sha256. Present the halt context to the user. Resume at current_step_index + 1 (for complete steps) or re-run current_step_index (for faulted / halted mid-step).
      </branch>
      <branch if="checkpoint exists and status is complete">
        Archive the prior checkpoint and fall through to new-run initialization.
      </branch>
      <branch if="checkpoint does not exist or fell through">
        Write the initial checkpoint atomically with: workflow_id, run_id, execution_mode, interaction_mode, owner_agent, current_step_index=0, status="in_progress", started_at=now, files_touched=[]
      </branch>
    </step>

    <step n="7" title="Pre-start gate">
      <invoke protocol="gate-enforcer" phase="pre-start"/>
      <on-failure>HALT with status halted_gate_failure and the gate name</on-failure>
    </step>

    <step n="8" title="Interaction mode branch">
      <branch if="interaction_mode == 'planning'">
        <invoke protocol="planning-gate"/>
        <action>On user approval [a]: set runtime_mode = normal, continue to step 9</action>
        <action>On user approval [y]: set runtime_mode = YOLO, continue to step 9</action>
        <action>On user abort [x]: HALT with status halted_user_abort</action>
      </branch>
      <branch if="interaction_mode == 'normal' or interaction_mode == 'YOLO'">
        Continue directly to step 9
      </branch>
    </step>

    <step n="9" title="Execution mode dispatch">
      <branch if="execution_mode == 'sequential'">Execute the sequential step loop (step-9-sequential below)</branch>
      <branch if="execution_mode == 'ensemble'">Execute the ensemble turn loop (step-9-ensemble below)</branch>
      <branch if="execution_mode == 'parallel-waves'">
        HALT with message "parallel-waves not yet implemented; Spec 4 is required. The Kernel B dispatch call convention is defined in docs/superpowers/specs/2026-04-08-symphony-core-engine-execution-design.md section 5.4. When Spec 4 lands, it will wrap this engine as Kernel B."
      </branch>
    </step>

    <step-block id="step-9-sequential" title="Sequential step loop">
      <for-each from="i = 1" to="N">
        <invoke protocol="trust-levels" on="before-step-execute"/>
        <action>JIT-load all skills and knowledge fragments referenced in step i</action>
        <action>Execute step i's actions in order: process action, ask, check, template-output, and invoke tags as they appear</action>
        <action>In normal mode: pause at every ask tag and wait for user response</action>
        <action>In YOLO mode: answer ask tags from context only when the answer is unambiguous; otherwise still pause</action>
        <action if="step i contains an action type='subagent-dispatch' tag">
          Dispatch a subagent per the structured subagent-dispatch payload. Wait for return. Present summary.
          In normal mode, wait for user [c]ontinue before proceeding.
        </action>
        <invoke protocol="anti-rationalization" on="before-persist"/>
        <invoke protocol="self-critique" on="before-persist"/>
        <action>Persist template-output to the declared file path via atomic write</action>
        <action if="interaction_mode == 'normal'">Show diff, wait for [c]/[y]/[e]. On [y] switch runtime to YOLO for the remainder of the workflow.</action>
        <action if="interaction_mode == 'YOLO'">Auto-proceed without pausing</action>
        <invoke protocol="artifact-enrichment-hook" on="after-output-persist"/>
        <invoke protocol="checkpoint-resume" on="after-step-complete"/>
        <action>Drop step i's skills and knowledge fragments from context. Persona stays; skills churn. This is the 40K budget enforcement mechanism.</action>
        <action>Update the checkpoint: current_step_index = i, append files_touched with sha256</action>
      </for-each>
    </step-block>

    <step-block id="step-9-ensemble" title="Ensemble turn loop">
      <action>Read ensemble_participants, ensemble_turn_policy, and max_turns from workflow.yaml</action>
      <action>Process any setup block from instructions.xml (load reference documents into the transcript)</action>
      <action>Seed the shared transcript with the topic block from instructions.xml</action>
      <action>Set turn_count = 0, terminated = false</action>
      <while condition="turn_count &lt; max_turns and not terminated">
        <action>Select next participant per ensemble_turn_policy (round-robin | facilitator-picks | user-picks)</action>
        <action>JIT-load _symphony/lifecycle/agents/{participant}.md (or tests/fixtures/agents/{participant}.md for fixture workflows)</action>
        <action if="participant persona file is missing">Log a warning, skip this turn, increment turn_count, continue the loop. Do NOT HALT.</action>
        <action>Re-prime: "You are now {participant_name}. Your persona file is below. The shared transcript is below. Ignore any voice carried over from prior turns. Produce exactly one contribution as {participant_name} and stop."</action>
        <invoke protocol="trust-levels" on="before-step-execute"/>
        <action>Generate one contribution speaking as the participant</action>
        <invoke protocol="anti-rationalization" on="before-persist"/>
        <invoke protocol="self-critique" on="before-persist"/>
        <action>Append the contribution to the shared transcript in-context</action>
        <action>Persist the transcript snapshot to workflow outputs.primary path via atomic write</action>
        <invoke protocol="artifact-enrichment-hook" on="after-output-persist"/>
        <invoke protocol="checkpoint-resume" on="after-step-complete"/>
        <action>EVICT the prior participant's persona from context. This is load-bearing — it mitigates persona bleed and parallels skill eviction in sequential mode.</action>
        <action>Increment turn_count. Update checkpoint: ensemble_turn_pointer, files_touched with sha256.</action>
        <action>Check termination: user calls it | facilitator declares consensus | checklist.md stopping criterion met | turn_count == max_turns → set terminated = true</action>
        <action if="interaction_mode == 'normal' and not terminated">Show latest contribution, wait for user input before next turn</action>
        <action if="interaction_mode == 'YOLO' and not terminated">Auto-advance to next turn (user can interrupt at any time by saying "switch to normal mode")</action>
      </while>
      <action>Process any synthesis block from instructions.xml (extract decisions into a structured section of the output file)</action>
    </step-block>

    <step n="10" title="Post-complete gate">
      <invoke protocol="gate-enforcer" phase="post-complete"/>
      <on-failure>HALT with status halted_gate_failure and the gate name</on-failure>
    </step>

    <step n="11" title="Archive checkpoint">
      <action>Move the checkpoint from _symphony/_memory/checkpoints/ to _symphony/_memory/checkpoints/completed/</action>
    </step>

    <step n="12" title="Report complete">
      <action>Report workflow complete with a summary of outputs, files_touched, and any lifecycle next-step suggestions</action>
    </step>
  </flow>

  <error-handling>
    <category name="missing_file">
      <source>Preflight or step action references a file that does not exist</source>
      <response>Report the missing path and expected source. Ask the user to provide the file or cancel. Wait for response. Retry the step after provision.</response>
    </category>
    <category name="unresolved_variable">
      <source>variable-resolution cannot resolve a curly-brace reference</source>
      <response>HALT immediately with status halted_unresolved_variable. Report the variable name and expected source. Do not guess or use defaults.</response>
    </category>
    <category name="quality_gate_failure">
      <source>gate-enforcer returns FAIL at pre-start or post-complete</source>
      <response>HALT immediately with status halted_gate_failure. Report which gate (pre-start or post-complete), which check, what was evaluated, why it failed. YOLO does not bypass this.</response>
    </category>
    <category name="self_critique_below_threshold">
      <source>self-critique protocol returns confidence below the configured threshold</source>
      <response>Retry the step ONCE (the agent re-drafts). If still below threshold, escalate to the user with the confidence score and a summary of what felt wrong. User approves, rejects, or revises. Write checkpoint only after resolution.</response>
    </category>
    <category name="step_action_runtime_failure">
      <source>An action fails (shell non-zero exit, API error, assertion failure)</source>
      <response>Trigger the diagnose-then-fix loop.</response>
    </category>
  </error-handling>

  <diagnose-then-fix>
    <trigger>step action runtime failure</trigger>
    <instructions>
      <step n="1">Mark the step faulted in the current checkpoint with the error capture</step>
      <step n="2">Dispatch a Debugger subagent with: error text, step file, prior step outputs, workflow.yaml, any relevant logs</step>
      <step n="3">The Debugger performs root-cause analysis ONLY. It does NOT fix anything. It returns a diagnosis: what broke, why, suggested fix target.</step>
      <step n="4">Hand the diagnosis back to the step's owner (or a replacement) as additional context</step>
      <step n="5">Retry ONLY the faulted step — not prior steps, not the whole workflow, not the whole wave</step>
      <step n="6">On retry success: advance normally</step>
      <step n="7">On retry failure: HALT with status halted_retry_exhausted. Write both error captures and the Debugger's diagnosis into the checkpoint.</step>
    </instructions>
    <rule>Never blind-retry. Blind retry wastes context and usually reproduces the same failure.</rule>
    <rule>Escalate to the user after ONE retry. Parallelism does not change this threshold.</rule>
    <rule>The Debugger agent's persona, methodology, and diagnosis format are defined by Spec 2b's diagnose-then-fix protocol. Spec 2a defines only this dispatch contract.</rule>
  </diagnose-then-fix>

  <halt-semantics>
    <rule>Write the current checkpoint with status set to the appropriate halted_* value and halt_reason populated</rule>
    <rule>Flush current-run state into the checkpoint: interaction_mode, owner_agent, current_step_index, ensemble_turn_pointer</rule>
    <rule>Report the HALT reason clearly to the user: what failed, where, what the user can do</rule>
    <rule>Do NOT advance current_step_index. Do NOT run post-complete gates. Do NOT archive the checkpoint.</rule>
    <rule>Exit the engine. The user regains control.</rule>
    <rule>HALT is a control-flow directive, not an exception. There is no stack to unwind — the engine is instructions, not code.</rule>
  </halt-semantics>

  <halt-directives>
    <halt status="halted_unresolved_variable">Variable could not be resolved from global.yaml</halt>
    <halt status="halted_missing_file">Required file declared in workflow.yaml does not exist</halt>
    <halt status="halted_gate_failure">Pre-start or post-complete gate returned FAIL</halt>
    <halt status="halted_retry_exhausted">Diagnose-then-fix loop retry failed</halt>
    <halt status="halted_user_abort">User selected abort at the planning gate or during execution</halt>
  </halt-directives>

  <resume-semantics>
    <rule>On invocation with a checkpoint_path that exists and has a halted_* or faulted status, enter resume mode</rule>
    <rule>Invoke checkpoint-resume protocol to validate files_touched sha256 against on-disk content</rule>
    <rule>If any file changed out-of-band: warn the user, offer Proceed / Start fresh / Review</rule>
    <rule>Re-adopt owner persona per step 5 (unless owner is orchestrator)</rule>
    <rule>Show the halt context to the user and confirm the underlying issue is resolved before retrying the failed step or gate</rule>
    <rule>On status == complete: archive the prior checkpoint and start a fresh run</rule>
  </resume-semantics>

  <supported-tags>
    <structural>workflow-engine flow step step-block action ask check branch while for-each</structural>
    <invocation>invoke</invocation>
    <persistence>template-output</persistence>
    <control>goto anchor on-failure</control>
    <delegation>invoke-workflow invoke-task subagent-dispatch (as action type)</delegation>
    <deferred>parallel (not supported in Spec 2a; parallel-waves execution mode is Spec 4's Kernel B)</deferred>
  </supported-tags>

  <normative-rules>
    <rule id="R-2a-1">Execution inside a single Kernel A is strictly serial. No step-level parallelism constructs.</rule>
    <rule id="R-2a-2">Persona adoption provides voice, style, expertise, rules. The engine controls execution.</rule>
    <rule id="R-2a-3">The engine writes its current state to the checkpoint after every completed step or turn, before advancing.</rule>
    <rule id="R-2a-4">JIT loading applies to skills and knowledge fragments, evicted before the next step loads its own.</rule>
    <rule id="R-2a-5">All load-bearing failures write a checkpoint with HALT status before exiting.</rule>
    <rule id="R-2a-6">YOLO never bypasses quality gates, self-critique escalations, or HALTs.</rule>
    <rule id="R-2a-7">Kernel A workflows may dispatch subagents from individual action steps via action type='subagent-dispatch'. Default remains inline.</rule>
    <rule id="R-2a-8">Variable resolution is two-level only: workflow.yaml → global.yaml.</rule>
    <rule id="R-2a-9">Workflows communicate through their outputs.primary file paths. No separate handoff protocol.</rule>
    <rule id="R-2a-10">Ensemble workflows must declare execution.max_turns (default 50). The engine enforces this cap as a termination criterion.</rule>
    <rule id="R-2a-11">When owner is 'orchestrator' or absent, the engine runs engine-neutral and skips persona adoption.</rule>
    <rule id="R-2a-12">The engine retries a faulted step at most once via diagnose-then-fix. A second failure escalates to the user.</rule>
  </normative-rules>
</workflow-engine>
```

- [ ] **Step 2: Run the tests and confirm all pass**

Run: `cd /Users/stevenagh76/Documents/symphony-framework && npm test 2>&1 | tail -30`

Expected: All previously-failing contract-marker tests flip to green. Total passing: 55 + ~17 = 72 tests (exact count depends on how the parameterized `for...of` loops expand under vitest; the 17 estimate covers 8 extension markers + 3 execution branches + 3 interaction modes + 3 HALT directives). Zero failures.

- [ ] **Step 3: Commit**

Run:
```bash
cd /Users/stevenagh76/Documents/symphony-framework && git add _symphony/core/engine/workflow-engine.xml && git commit -m "feat(engine): replace workflow-engine.xml stub with Spec 2a runtime content"
```

---

### Task 8: Create `sequential-hello` fixture and its tests

**Files:**
- Create: `tests/fixtures/sequential-hello/workflow.yaml`
- Create: `tests/fixtures/sequential-hello/instructions.xml`
- Create: `tests/fixtures/sequential-hello/checklist.md`
- Create: `tests/fixtures/sequential-hello/template.md`
- Modify: `tests/engine.test.js` (append a new describe block)

- [ ] **Step 1: Write `workflow.yaml`**

Write `/Users/stevenagh76/Documents/symphony-framework/tests/fixtures/sequential-hello/workflow.yaml` with this EXACT content:

```yaml
id: sequential-hello
phase: anytime
owner: orchestrator
model: opus

execution:
  mode: sequential
  wave_eligible: false
  max_wave_siblings: 0

inputs:
  required: []
  optional: []

outputs:
  primary: tests/fixtures/sequential-hello/hello-output.md

gates:
  pre_start:
    - fixture-sequential-hello-ready
  post_complete:
    - fixture-sequential-hello-complete
```

- [ ] **Step 2: Write `instructions.xml`**

Write `/Users/stevenagh76/Documents/symphony-framework/tests/fixtures/sequential-hello/instructions.xml` with this EXACT content:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<workflow name="sequential-hello">
  <step n="1" title="Greet">
    <action>Produce a single greeting line declaring the workflow name and the current date</action>
    <template-output file="tests/fixtures/sequential-hello/hello-output.md">
      A one-line greeting of the form: "Hello from sequential-hello at {date}."
    </template-output>
  </step>
</workflow>
```

- [ ] **Step 3: Write `checklist.md`**

Write `/Users/stevenagh76/Documents/symphony-framework/tests/fixtures/sequential-hello/checklist.md` with this EXACT content:

```markdown
# sequential-hello fixture checklist

## Pre-start gates
- [ ] The fixture directory exists and is readable.
- [ ] workflow.yaml parses as valid YAML.

## Post-complete gates
- [ ] hello-output.md was written to the declared path.
- [ ] The output file is non-empty and contains the workflow name.
```

- [ ] **Step 4: Write `template.md`**

Write `/Users/stevenagh76/Documents/symphony-framework/tests/fixtures/sequential-hello/template.md` with this EXACT content:

```markdown
Hello from sequential-hello at {date}.
```

- [ ] **Step 5: Append the sequential-hello test block to `tests/engine.test.js`**

Append to `/Users/stevenagh76/Documents/symphony-framework/tests/engine.test.js` the following content, placed AFTER the last existing `});` in the file. Note: `readText`, `readYaml`, `parser`, `root`, and `existsSync` are already in scope from Task 1's top-of-file imports and helpers.

```javascript

// --- Fixture tests ---------------------------------------------------------

describe('Symphony engine fixtures — sequential-hello', () => {
  it('workflow.yaml has all required fields', () => {
    const y = readYaml('tests/fixtures/sequential-hello/workflow.yaml');
    expect(y.id).toBe('sequential-hello');
    expect(y.owner).toBe('orchestrator');
    expect(y.execution.mode).toBe('sequential');
    expect(y.inputs).toBeDefined();
    expect(Array.isArray(y.inputs.required)).toBe(true);
    expect(y.outputs.primary).toBe('tests/fixtures/sequential-hello/hello-output.md');
    expect(Array.isArray(y.gates.pre_start)).toBe(true);
    expect(Array.isArray(y.gates.post_complete)).toBe(true);
  });

  it('instructions.xml parses and contains exactly one step with a template-output', () => {
    const text = readText('tests/fixtures/sequential-hello/instructions.xml');
    expect(() => parser.parse(text)).not.toThrow();
    const stepMatches = text.match(/<step\s/g) || [];
    expect(stepMatches.length).toBe(1);
    expect(text).toContain('<template-output file="tests/fixtures/sequential-hello/hello-output.md">');
    expect(text).toContain('<action>');
  });

  it('checklist.md and template.md exist', () => {
    expect(existsSync(resolve(root, 'tests/fixtures/sequential-hello/checklist.md'))).toBe(true);
    expect(existsSync(resolve(root, 'tests/fixtures/sequential-hello/template.md'))).toBe(true);
  });
});
```

- [ ] **Step 6: Run the tests**

Run: `cd /Users/stevenagh76/Documents/symphony-framework && npm test 2>&1 | tail -20`

Expected: All 72 prior tests still pass, plus 3 new sequential-hello fixture tests. Total: 75 passing, 0 failures.

- [ ] **Step 7: Commit**

Run:
```bash
cd /Users/stevenagh76/Documents/symphony-framework && git add tests/fixtures/sequential-hello tests/engine.test.js && git commit -m "test(engine): add sequential-hello fixture and its fixture tests"
```

---

### Task 9: Create `ensemble-hello` fixture with two participant agents

**Files:**
- Create: `tests/fixtures/agents/alpha.md`
- Create: `tests/fixtures/agents/beta.md`
- Create: `tests/fixtures/ensemble-hello/workflow.yaml`
- Create: `tests/fixtures/ensemble-hello/instructions.xml`
- Create: `tests/fixtures/ensemble-hello/checklist.md`
- Modify: `tests/engine.test.js`

- [ ] **Step 1: Write `alpha.md`**

Write `/Users/stevenagh76/Documents/symphony-framework/tests/fixtures/agents/alpha.md` with this EXACT content:

```markdown
---
id: alpha
name: Alpha
role: Fixture Participant A
model: haiku
max_lines: 50
---

<agent>
  <persona>
    <identity>Alpha is a terse, direct test-fixture participant used only in the ensemble-hello structural test. Alpha always answers in a single short sentence.</identity>
    <expertise>Fixture testing. Structural assertions.</expertise>
    <operating-mode>Speaks exactly once per turn. Never elaborates.</operating-mode>
  </persona>
  <knowledge-sources>
    <trusted>
      <source>The ensemble-hello topic block</source>
    </trusted>
  </knowledge-sources>
  <disciplines>
    <self-critique threshold="0.85"/>
  </disciplines>
  <memory-sidecar path="tests/fixtures/agents/alpha-sidecar/"/>
</agent>
```

- [ ] **Step 2: Write `beta.md`**

Write `/Users/stevenagh76/Documents/symphony-framework/tests/fixtures/agents/beta.md` with this EXACT content:

```markdown
---
id: beta
name: Beta
role: Fixture Participant B
model: haiku
max_lines: 50
---

<agent>
  <persona>
    <identity>Beta is a slightly more verbose test-fixture participant used only in the ensemble-hello structural test. Beta always answers in two short sentences.</identity>
    <expertise>Fixture testing. Structural assertions.</expertise>
    <operating-mode>Speaks exactly once per turn. Two sentences, no more, no less.</operating-mode>
  </persona>
  <knowledge-sources>
    <trusted>
      <source>The ensemble-hello topic block</source>
    </trusted>
  </knowledge-sources>
  <disciplines>
    <self-critique threshold="0.85"/>
  </disciplines>
  <memory-sidecar path="tests/fixtures/agents/beta-sidecar/"/>
</agent>
```

- [ ] **Step 3: Write `workflow.yaml`**

Write `/Users/stevenagh76/Documents/symphony-framework/tests/fixtures/ensemble-hello/workflow.yaml` with this EXACT content:

```yaml
id: ensemble-hello
phase: anytime
owner: orchestrator
model: opus

execution:
  mode: ensemble
  wave_eligible: false
  max_wave_siblings: 0
  ensemble_participants:
    - alpha
    - beta
  ensemble_turn_policy: round-robin
  max_turns: 4

inputs:
  required: []
  optional: []

outputs:
  primary: tests/fixtures/ensemble-hello/transcript.md

gates:
  pre_start:
    - fixture-ensemble-hello-ready
  post_complete:
    - fixture-ensemble-hello-terminated
```

- [ ] **Step 4: Write `instructions.xml`**

Write `/Users/stevenagh76/Documents/symphony-framework/tests/fixtures/ensemble-hello/instructions.xml` with this EXACT content:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<workflow name="ensemble-hello">
  <topic>
    The ensemble participants introduce themselves in one short turn each. Alpha speaks first, Beta speaks second. After two rounds total (four turns), the ensemble terminates.
  </topic>
</workflow>
```

- [ ] **Step 5: Write `checklist.md`**

Write `/Users/stevenagh76/Documents/symphony-framework/tests/fixtures/ensemble-hello/checklist.md` with this EXACT content:

```markdown
# ensemble-hello fixture checklist

## Pre-start gates
- [ ] Both participant persona files exist under tests/fixtures/agents/.
- [ ] workflow.yaml declares ensemble_participants and max_turns.

## Post-complete gates
- [ ] transcript.md was written.
- [ ] The transcript contains at least one contribution from each named participant.
- [ ] The loop terminated at or before max_turns.

## Stopping criterion
- Terminate after four total turns (two full round-robin rounds).
```

- [ ] **Step 6: Append the ensemble-hello test block to `tests/engine.test.js`**

Append to `/Users/stevenagh76/Documents/symphony-framework/tests/engine.test.js` the following content, placed AFTER the sequential-hello describe block:

```javascript

describe('Symphony engine fixtures — ensemble-hello', () => {
  it('workflow.yaml has all required fields including max_turns', () => {
    const y = readYaml('tests/fixtures/ensemble-hello/workflow.yaml');
    expect(y.id).toBe('ensemble-hello');
    expect(y.execution.mode).toBe('ensemble');
    expect(Array.isArray(y.execution.ensemble_participants)).toBe(true);
    expect(y.execution.ensemble_participants).toEqual(['alpha', 'beta']);
    expect(y.execution.ensemble_turn_policy).toBe('round-robin');
    expect(typeof y.execution.max_turns).toBe('number');
    expect(y.execution.max_turns).toBeGreaterThan(0);
  });

  it('instructions.xml parses and contains a non-empty topic block with no step control flow', () => {
    const text = readText('tests/fixtures/ensemble-hello/instructions.xml');
    expect(() => parser.parse(text)).not.toThrow();
    expect(text).toMatch(/<topic>[\s\S]+<\/topic>/);
    const stepMatches = text.match(/<step\s/g) || [];
    expect(stepMatches.length).toBe(0);
  });

  it('every ensemble participant has a persona file under tests/fixtures/agents/', () => {
    const y = readYaml('tests/fixtures/ensemble-hello/workflow.yaml');
    for (const participant of y.execution.ensemble_participants) {
      const personaPath = `tests/fixtures/agents/${participant}.md`;
      expect(existsSync(resolve(root, personaPath))).toBe(true);
    }
  });

  it('checklist.md exists', () => {
    expect(existsSync(resolve(root, 'tests/fixtures/ensemble-hello/checklist.md'))).toBe(true);
  });
});
```

- [ ] **Step 7: Run the tests**

Run: `cd /Users/stevenagh76/Documents/symphony-framework && npm test 2>&1 | tail -20`

Expected: All 75 prior tests still pass, plus 4 new ensemble-hello fixture tests. Total: 79 passing, 0 failures.

- [ ] **Step 8: Commit**

Run:
```bash
cd /Users/stevenagh76/Documents/symphony-framework && git add tests/fixtures/agents tests/fixtures/ensemble-hello tests/engine.test.js && git commit -m "test(engine): add ensemble-hello fixture with alpha/beta participant agents"
```

---

### Task 10: Create `task-hello` fixture and its test

**Files:**
- Create: `tests/fixtures/task-hello/task.xml`
- Modify: `tests/engine.test.js`

- [ ] **Step 1: Write `task.xml`**

Write `/Users/stevenagh76/Documents/symphony-framework/tests/fixtures/task-hello/task.xml` with this EXACT content:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<task id="task-hello" name="Fixture Task Hello" internal="true">
  <objective>
    Minimal standalone task used to verify the task-runner.xml structural tests.
    Produces a one-line greeting output.
  </objective>

  <llm critical="true">
    <mandate>You are executing a fixture task. Do exactly what the flow says, nothing more.</mandate>
    <mandate>Report all findings. Do not stop at the first error.</mandate>
  </llm>

  <flow>
    <step n="1" title="Generate greeting">
      <action>Produce a single greeting string of the form: "Hello from task-hello."</action>
    </step>
  </flow>

  <output>
    <format>plain-text</format>
    <description>A single greeting string.</description>
  </output>
</task>
```

- [ ] **Step 2: Append the task-hello test block to `tests/engine.test.js`**

Append to `/Users/stevenagh76/Documents/symphony-framework/tests/engine.test.js` the following content, placed AFTER the ensemble-hello describe block:

```javascript

describe('Symphony engine fixtures — task-hello', () => {
  it('task.xml exists, parses, and has the required shape', () => {
    const text = readText('tests/fixtures/task-hello/task.xml');
    expect(() => parser.parse(text)).not.toThrow();
    expect(text).toContain('<task id="task-hello"');
    expect(text).toContain('<objective>');
    expect(text).toContain('<flow>');
    const stepMatches = text.match(/<step\s/g) || [];
    expect(stepMatches.length).toBeGreaterThanOrEqual(1);
    expect(text).toContain('<output>');
  });

  it('task.xml contains no invoke protocol tags (task runner does not auto-invoke)', () => {
    const text = readText('tests/fixtures/task-hello/task.xml');
    expect(text).not.toContain('<invoke protocol=');
  });
});
```

- [ ] **Step 3: Run the tests**

Run: `cd /Users/stevenagh76/Documents/symphony-framework && npm test 2>&1 | tail -20`

Expected: All 79 prior tests still pass, plus 2 new task-hello fixture tests. Total: 81 passing, 0 failures.

- [ ] **Step 4: Commit**

Run:
```bash
cd /Users/stevenagh76/Documents/symphony-framework && git add tests/fixtures/task-hello tests/engine.test.js && git commit -m "test(engine): add task-hello fixture and task runner structural test"
```

---

### Task 11: Version bump and module manifest update

**Files:**
- Modify: `package.json` (version field)
- Modify: `_symphony/_config/manifest.yaml` (core module version)

- [ ] **Step 1: Bump `package.json` version**

Edit `/Users/stevenagh76/Documents/symphony-framework/package.json`. Change the line:

```json
  "version": "0.0.1",
```

to:

```json
  "version": "0.0.2-alpha.1",
```

All other fields remain unchanged.

- [ ] **Step 2: Bump the core module version in `_symphony/_config/manifest.yaml`**

Edit `/Users/stevenagh76/Documents/symphony-framework/_symphony/_config/manifest.yaml`. Change the `core` module block from:

```yaml
  core:
    version: "0.0.1"
    description: "Engine, protocols, adapter registry, memory"
```

to:

```yaml
  core:
    version: "0.0.2-alpha.1"
    description: "Engine, protocols, adapter registry, memory"
```

All other module and adapter versions remain unchanged.

- [ ] **Step 3: Run the full test suite**

Run: `cd /Users/stevenagh76/Documents/symphony-framework && npm test 2>&1 | tail -30`

Expected: All 81 tests pass. The CLI test (`cli.test.js`) asserts the CLI prints `symphony-framework 0.0.1`. Since we bumped the version, **the CLI test will now fail** — expected output `symphony-framework 0.0.1` but actual `symphony-framework 0.0.2-alpha.1`.

This is expected. Continue to Step 4.

- [ ] **Step 4: Update the CLI test to match the new version**

Edit `/Users/stevenagh76/Documents/symphony-framework/tests/cli.test.js`. Change the line:

```javascript
    expect(out).toBe('symphony-framework 0.0.1');
```

to:

```javascript
    expect(out).toBe('symphony-framework 0.0.2-alpha.1');
```

All other test content remains unchanged.

- [ ] **Step 5: Re-run the tests**

Run: `cd /Users/stevenagh76/Documents/symphony-framework && npm test 2>&1 | tail -20`

Expected: All 81 tests pass. Zero failures.

- [ ] **Step 6: Verify CLI reports the new version manually**

Run: `cd /Users/stevenagh76/Documents/symphony-framework && node bin/symphony-cli.js --version`

Expected: `symphony-framework 0.0.2-alpha.1`

- [ ] **Step 7: Commit**

Run:
```bash
cd /Users/stevenagh76/Documents/symphony-framework && git add package.json package-lock.json _symphony/_config/manifest.yaml tests/cli.test.js && git commit -m "chore: bump version to 0.0.2-alpha.1 for Spec 2a release"
```

---

### Task 12: Final verification, manual checklist, and `v0.0.2-alpha.1` tag

**Files:**
- No new files.

- [ ] **Step 1: Run the full test suite one last time**

Run: `cd /Users/stevenagh76/Documents/symphony-framework && npm test 2>&1 | tail -30`

Expected: Output ends with `Test Files 3 passed (3)` and `Tests 81 passed (81)` or similar. Zero failures.

- [ ] **Step 2: Verify the engine file inventory**

Run:
```bash
cd /Users/stevenagh76/Documents/symphony-framework && ls -l _symphony/core/engine/ _symphony/core/engine/protocols/
```

Expected: `_symphony/core/engine/` contains `conductor.xml`, `gate-enforcer.xml`, `task-runner.xml`, `wave-executor.xml`, `workflow-engine.xml`, plus the `protocols/` directory. `_symphony/core/engine/protocols/` contains `preflight-check.xml`, `variable-resolution.xml`, `planning-gate.xml`.

- [ ] **Step 3: Verify fixture inventory**

Run:
```bash
cd /Users/stevenagh76/Documents/symphony-framework && find tests/fixtures -type f | sort
```

Expected: 11 files listed:
```
tests/fixtures/agents/alpha.md
tests/fixtures/agents/beta.md
tests/fixtures/ensemble-hello/checklist.md
tests/fixtures/ensemble-hello/instructions.xml
tests/fixtures/ensemble-hello/workflow.yaml
tests/fixtures/sequential-hello/checklist.md
tests/fixtures/sequential-hello/instructions.xml
tests/fixtures/sequential-hello/template.md
tests/fixtures/sequential-hello/workflow.yaml
tests/fixtures/task-hello/task.xml
```

Note: `tests/fixtures/sequential-hello/hello-output.md` will NOT exist yet — it is produced at runtime by manual verification in Step 5.

- [ ] **Step 4: Check git log for clean history**

Run: `cd /Users/stevenagh76/Documents/symphony-framework && git log --oneline | head -15`

Expected: Approximately 12 commits added for Spec 2a on top of the foundation commits. Each commit has a conventional-commit message (`feat:`, `test:`, `chore:`, `docs:`). None have Claude co-author trailers.

- [ ] **Step 5: Manual verification checklist (must be completed by the implementer, not automated)**

These three runs require a host AI (Claude Code or Copilot) to actually follow the engine XML. Per spec section 7.4, automated host-AI tests are out of scope for Spec 2a.

**5a. sequential-hello walkthrough:**

In a Claude Code session at `/Users/stevenagh76/Documents/symphony-framework/`, manually instruct the host AI to:
1. Load `_symphony/core/engine/workflow-engine.xml` as context
2. Process the fixture workflow at `tests/fixtures/sequential-hello/`
3. Execute in normal mode

Expected outcome: the host AI follows the engine XML, produces `tests/fixtures/sequential-hello/hello-output.md` containing a one-line greeting per the template. Record the run outcome (pass/fail) in your notes.

**5b. ensemble-hello walkthrough:**

In a Claude Code session, manually instruct the host AI to:
1. Load `_symphony/core/engine/workflow-engine.xml` as context
2. Process the fixture workflow at `tests/fixtures/ensemble-hello/`
3. Execute in YOLO mode (to exercise auto-advancing turns)

Expected outcome: the host AI runs the turn loop for 4 turns (round-robin over alpha, beta, alpha, beta), produces `tests/fixtures/ensemble-hello/transcript.md` with visibly distinct voices between alpha (one sentence) and beta (two sentences). Record pass/fail.

**5c. task-hello walkthrough:**

In a Claude Code session, manually instruct the host AI to:
1. Load `_symphony/core/engine/task-runner.xml` as context
2. Process the task at `tests/fixtures/task-hello/task.xml`

Expected outcome: the host AI reads the task's single step and produces the greeting string `Hello from task-hello.` Record pass/fail.

If any of the three manual walkthroughs fails, revise the relevant engine XML or fixture and re-run until all three pass. The implementer is responsible for driving this iteration — structural tests cannot catch host-AI compliance issues.

- [ ] **Step 6: Clean up any manual-run artifacts**

If the manual walkthroughs produced output files at `tests/fixtures/sequential-hello/hello-output.md` or `tests/fixtures/ensemble-hello/transcript.md`, delete them before tagging (they are runtime artifacts, not source-controlled fixtures):

```bash
cd /Users/stevenagh76/Documents/symphony-framework && \
rm -f tests/fixtures/sequential-hello/hello-output.md tests/fixtures/ensemble-hello/transcript.md && \
git status
```

Expected: `git status` reports a clean working tree.

- [ ] **Step 7: Tag `v0.0.2-alpha.1`**

Run:
```bash
cd /Users/stevenagh76/Documents/symphony-framework && git tag v0.0.2-alpha.1 && git tag --list
```

Expected: output lists both `v0.0.1-foundation` and `v0.0.2-alpha.1`.

- [ ] **Step 8: Final git log review**

Run: `cd /Users/stevenagh76/Documents/symphony-framework && git log --oneline -20`

Expected: clean history showing the foundation commits followed by the Spec 2a commits, with the `v0.0.2-alpha.1` tag on HEAD.

---

## Done

When all tasks complete, you should have:

- `_symphony/core/engine/workflow-engine.xml` replaced with the Spec 2a Kernel A runtime
- `_symphony/core/engine/task-runner.xml` replaced with the Spec 2a task runner
- Three new engine-internal protocols at `_symphony/core/engine/protocols/{preflight-check,variable-resolution,planning-gate}.xml`
- `tests/engine.test.js` asserting parse validity, all 8 extension-point markers, execution mode branches, interaction mode descriptions, HALT directives, and fixture schema/walks
- Three fixture workflows: sequential-hello (4 files), ensemble-hello (3 files + 2 participant agents), task-hello (1 file)
- `package.json` version bumped to `0.0.2-alpha.1` with `fast-xml-parser` and `yaml` devDependencies
- `_symphony/_config/manifest.yaml` core module version bumped to `0.0.2-alpha.1`
- `tests/cli.test.js` updated to match the new version string
- All 81 tests passing, zero failures
- `v0.0.2-alpha.1` git tag on HEAD
- Three manual walkthroughs (sequential-hello, ensemble-hello, task-hello) verified by the implementer

**Next steps after this plan:**

1. Brainstorm Spec 2b (Quality) — gate enforcer, self-critique, trust-levels, anti-rationalization, diagnose-then-fix, review-gate-check
2. Brainstorm Spec 2c (Persistence) — checkpoint-resume schema, memory sidecars, memory-hygiene, artifact-enrichment-hook, status-sync
3. Specs 2b and 2c may proceed in parallel once both are brainstormed
4. Spec 3 (Conductor) and Spec 4 (Wave Executor) unblock once Spec 2a is complete (which is now)
