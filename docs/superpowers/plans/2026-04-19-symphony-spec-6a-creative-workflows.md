# Creative Module — Workflows (Spec 6a, Part B) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 7 creative workflows under `_symphony/creative/workflows/`, plus structure test updates, manifest version bump, and dashboard refresh.

**Architecture:** Each workflow is a 4-file directory (workflow.yaml, instructions.xml, checklist.md, template.md) following the pattern shipped in Specs 5b-5d. Ensemble workflows use `ensemble` mode with participants and turn policy. Sequential workflows use `sequential` mode with linear steps. One new test file validates structural compliance. `structure.test.js` gains assertions for the new inventory.

**Tech Stack:** YAML (workflow configs), XML (instructions), Markdown (checklists, templates), Vitest (tests)

**Prerequisite:** Part A (`2026-04-19-symphony-spec-6a-creative-agents.md`) must be complete — 6 creative agent files must exist.

---

## File Structure

| Action | File | Responsibility |
|---|---|---|
| Create | `tests/workflows-creative.test.js` | Structural tests for 7 workflows |
| Create | `_symphony/creative/workflows/design-thinking/*` | Ensemble: 5-stage DT flow (4 files) |
| Create | `_symphony/creative/workflows/innovation-strategy/*` | Ensemble: JTBD + Blue Ocean (4 files) |
| Create | `_symphony/creative/workflows/problem-solving/*` | Ensemble: root cause + TRIZ (4 files) |
| Create | `_symphony/creative/workflows/creative-sprint/*` | Ensemble: all 6 creative agents (4 files) |
| Create | `_symphony/creative/workflows/storytelling/*` | Sequential: narrative craft (4 files) |
| Create | `_symphony/creative/workflows/slide-deck/*` | Sequential: slide presentation (4 files) |
| Create | `_symphony/creative/workflows/pitch-deck/*` | Sequential: investor pitch (4 files) |
| Modify | `tests/structure.test.js` | Add creative inventory assertions |
| Modify | `_symphony/_config/manifest.yaml` | Bump creative module version |
| Modify | `Symphony_Framework_Comparison.html` | Reflect 21 agents, 54 workflows |
| Modify | `Symphony_Lifecycle_Activity_Diagram.html` | Add creative module |

---

### Task 1: Creative Workflow Test File

**Files:**
- Create: `tests/workflows-creative.test.js`

- [ ] **Step 1: Write the test file**

Create `tests/workflows-creative.test.js`:

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
const exists = (p) => existsSync(resolve(root, p));
const readYaml = (p) => YAML.parse(readText(p));
const parser = new XMLParser({ ignoreAttributes: false, allowBooleanAttributes: true, preserveOrder: true });

const workflows = [
  { id: 'design-thinking', mode: 'ensemble', turnPolicy: 'round-robin', maxTurns: 20 },
  { id: 'innovation-strategy', mode: 'ensemble', turnPolicy: 'user-picks', maxTurns: 18 },
  { id: 'problem-solving', mode: 'ensemble', turnPolicy: 'round-robin', maxTurns: 16 },
  { id: 'creative-sprint', mode: 'ensemble', turnPolicy: 'user-picks', maxTurns: 20 },
  { id: 'storytelling', mode: 'sequential' },
  { id: 'slide-deck', mode: 'sequential' },
  { id: 'pitch-deck', mode: 'sequential' },
];

for (const wf of workflows) {
  const base = `_symphony/creative/workflows/${wf.id}`;

  describe(`Creative Workflow: ${wf.id} (Spec 6a)`, () => {
    it('workflow.yaml exists and parses', () => {
      expect(exists(`${base}/workflow.yaml`)).toBe(true);
      expect(() => readYaml(`${base}/workflow.yaml`)).not.toThrow();
    });

    it(`workflow.yaml has id="${wf.id}"`, () => {
      expect(readYaml(`${base}/workflow.yaml`).id).toBe(wf.id);
    });

    it('workflow.yaml has owner, model, description', () => {
      const y = readYaml(`${base}/workflow.yaml`);
      expect(y.owner).toBeDefined();
      expect(y.model).toBe('opus');
      expect(y.description).toBeDefined();
    });

    it('workflow.yaml has execution.mode, inputs, outputs, gates, disciplines', () => {
      const y = readYaml(`${base}/workflow.yaml`);
      expect(y.execution.mode).toBe(wf.mode);
      expect(y.inputs).toBeDefined();
      expect(y.outputs).toBeDefined();
      expect(y.gates).toBeDefined();
      expect(y.disciplines).toBeDefined();
    });

    it('instructions.xml exists and parses', () => {
      expect(exists(`${base}/instructions.xml`)).toBe(true);
      expect(() => parser.parse(readText(`${base}/instructions.xml`))).not.toThrow();
    });

    if (wf.mode === 'ensemble') {
      it('instructions.xml has topic block', () => {
        expect(readText(`${base}/instructions.xml`)).toContain('<topic>');
      });

      it('workflow.yaml has ensemble_participants with >= 2 members', () => {
        const y = readYaml(`${base}/workflow.yaml`);
        expect(Array.isArray(y.execution.ensemble_participants)).toBe(true);
        expect(y.execution.ensemble_participants.length).toBeGreaterThanOrEqual(2);
      });

      it(`workflow.yaml has ensemble_turn_policy="${wf.turnPolicy}"`, () => {
        const y = readYaml(`${base}/workflow.yaml`);
        expect(y.execution.ensemble_turn_policy).toBe(wf.turnPolicy);
      });

      it(`workflow.yaml has max_turns=${wf.maxTurns}`, () => {
        const y = readYaml(`${base}/workflow.yaml`);
        expect(y.execution.max_turns).toBe(wf.maxTurns);
      });
    } else {
      it('instructions.xml has at least 1 step element', () => {
        const text = readText(`${base}/instructions.xml`);
        const steps = text.match(/<step\s/g) || [];
        expect(steps.length).toBeGreaterThanOrEqual(1);
      });
    }

    it('checklist.md exists with >= 3 checkbox items', () => {
      expect(exists(`${base}/checklist.md`)).toBe(true);
      const checks = readText(`${base}/checklist.md`).match(/- \[ \]/g) || [];
      expect(checks.length).toBeGreaterThanOrEqual(3);
    });

    it('template.md exists', () => {
      expect(exists(`${base}/template.md`)).toBe(true);
    });
  });
}

describe('Creative workflow-specific checks', () => {
  it('design-thinking is owned by design-thinking-coach', () => {
    const y = readYaml('_symphony/creative/workflows/design-thinking/workflow.yaml');
    expect(y.owner).toBe('design-thinking-coach');
  });

  it('design-thinking participants include brainstorming-coach, problem-solver, storyteller', () => {
    const y = readYaml('_symphony/creative/workflows/design-thinking/workflow.yaml');
    expect(y.execution.ensemble_participants).toContain('brainstorming-coach');
    expect(y.execution.ensemble_participants).toContain('problem-solver');
    expect(y.execution.ensemble_participants).toContain('storyteller');
  });

  it('innovation-strategy is owned by innovation-strategist', () => {
    const y = readYaml('_symphony/creative/workflows/innovation-strategy/workflow.yaml');
    expect(y.owner).toBe('innovation-strategist');
  });

  it('problem-solving is owned by problem-solver', () => {
    const y = readYaml('_symphony/creative/workflows/problem-solving/workflow.yaml');
    expect(y.owner).toBe('problem-solver');
  });

  it('creative-sprint is owned by brainstorming-coach', () => {
    const y = readYaml('_symphony/creative/workflows/creative-sprint/workflow.yaml');
    expect(y.owner).toBe('brainstorming-coach');
  });

  it('creative-sprint has all 6 creative agents as participants', () => {
    const y = readYaml('_symphony/creative/workflows/creative-sprint/workflow.yaml');
    const p = y.execution.ensemble_participants;
    expect(p).toContain('brainstorming-coach');
    expect(p).toContain('design-thinking-coach');
    expect(p).toContain('innovation-strategist');
    expect(p).toContain('problem-solver');
    expect(p).toContain('storyteller');
    expect(p).toContain('presentation-designer');
  });

  it('storytelling is owned by storyteller', () => {
    const y = readYaml('_symphony/creative/workflows/storytelling/workflow.yaml');
    expect(y.owner).toBe('storyteller');
  });

  it('slide-deck is owned by presentation-designer', () => {
    const y = readYaml('_symphony/creative/workflows/slide-deck/workflow.yaml');
    expect(y.owner).toBe('presentation-designer');
  });

  it('pitch-deck is owned by presentation-designer', () => {
    const y = readYaml('_symphony/creative/workflows/pitch-deck/workflow.yaml');
    expect(y.owner).toBe('presentation-designer');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/workflows-creative.test.js`
Expected: FAIL — all 7 workflow directories don't exist yet.

- [ ] **Step 3: Commit**

```bash
git add tests/workflows-creative.test.js
git commit -m "test(workflows): add structural test file for creative workflows (Spec 6a)"
```

---

### Task 2: design-thinking Workflow (Ensemble)

**Files:**
- Create: `_symphony/creative/workflows/design-thinking/workflow.yaml`
- Create: `_symphony/creative/workflows/design-thinking/instructions.xml`
- Create: `_symphony/creative/workflows/design-thinking/checklist.md`
- Create: `_symphony/creative/workflows/design-thinking/template.md`

- [ ] **Step 1: Create workflow.yaml**

```yaml
id: design-thinking
owner: design-thinking-coach
model: opus
description: Five-stage Stanford design thinking — empathize, define, ideate, prototype, test

execution:
  mode: ensemble
  wave_eligible: false
  max_wave_siblings: 0
  ensemble_participants: [design-thinking-coach, brainstorming-coach, problem-solver, storyteller]
  ensemble_turn_policy: round-robin
  max_turns: 20

inputs:
  required: []
  optional: [problem-statement, user-research]

outputs:
  primary: docs/creative-artifacts/design-thinking-<topic>.md
  traceable_to: []

gates:
  pre_start: []
  post_complete:
    - All 5 stages addressed with contributions
    - At least 3 prototypes proposed
    - Test plan defined

disciplines:
  self_critique: true
  anti_rationalization: true
  trust_levels: true
```

- [ ] **Step 2: Create instructions.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<instructions workflow="design-thinking">
  <setup>
    <action>If problem-statement or user-research artifacts exist, load them as context for the session.</action>
  </setup>

  <topic>
    Guide the group through the five design thinking stages. The Design Thinking Coach enforces phase progression and empathy grounding. The Brainstorming Coach maximizes idea volume during the ideate stage. The Problem Solver applies structured decomposition during the define stage. The Storyteller helps frame user insights as narratives during empathize and prototype stages.

    Stage progression: empathize (observations, user quotes, emotional insights) → define (POV statement, HMW questions) → ideate (idea pool of 8+, select 3-5) → prototype (at least 3 prototypes proposed) → test (test plan, validation criteria, next steps).
  </topic>

  <synthesis>
    <action>Compile contributions from all stages into the design thinking artifact. Ensure each stage has substantive output. Verify test plan ties back to the POV statement.</action>
    <template-output file="docs/creative-artifacts/design-thinking-{topic}.md">
      Apply the template from template.md. Fill all 5 stage sections with session outputs.
    </template-output>
  </synthesis>
</instructions>
```

- [ ] **Step 3: Create checklist.md**

```markdown
# design-thinking Checklist

## Pre-start
- (none — can start from a blank problem space)

## Post-complete
- [ ] Empathize stage has observations, user quotes, and emotional insights
- [ ] Define stage has a POV statement and at least 2 HMW questions
- [ ] Ideate stage has an idea pool of 8+ and 3-5 selected ideas
- [ ] Prototype stage has at least 3 prototypes proposed
- [ ] Test stage has a test plan with validation criteria
- [ ] Resolution ties back to empathy findings
```

- [ ] **Step 4: Create template.md**

```markdown
# Design Thinking — <topic>

**Date:** {{date}}
**Participants:** {{participants}}
**Problem Space:** {{problem_statement}}

---

## 1. Empathize
- Observations:
- User quotes:
- Emotional insights:

## 2. Define
- Point-of-view statement:
- How-might-we questions:

## 3. Ideate
- Idea pool (8+):
- Selected ideas (3-5):

## 4. Prototype
- Prototype 1:
- Prototype 2:
- Prototype 3:

## 5. Test
- Test plan:
- Validation criteria:
- Next steps:
```

- [ ] **Step 5: Run test to verify design-thinking passes**

Run: `npx vitest run tests/workflows-creative.test.js -t "design-thinking"`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add _symphony/creative/workflows/design-thinking/
git commit -m "feat(creative): add design-thinking ensemble workflow (Spec 6a)"
```

---

### Task 3: innovation-strategy Workflow (Ensemble)

**Files:**
- Create: `_symphony/creative/workflows/innovation-strategy/workflow.yaml`
- Create: `_symphony/creative/workflows/innovation-strategy/instructions.xml`
- Create: `_symphony/creative/workflows/innovation-strategy/checklist.md`
- Create: `_symphony/creative/workflows/innovation-strategy/template.md`

- [ ] **Step 1: Create workflow.yaml**

```yaml
id: innovation-strategy
owner: innovation-strategist
model: opus
description: Strategic disruption analysis — Jobs-to-be-Done, Blue Ocean mapping, business model innovation

execution:
  mode: ensemble
  wave_eligible: false
  max_wave_siblings: 0
  ensemble_participants: [innovation-strategist, brainstorming-coach, product-manager, research-analyst]
  ensemble_turn_policy: user-picks
  max_turns: 18

inputs:
  required: []
  optional: [market-research, product-brief, competitive-landscape]

outputs:
  primary: docs/creative-artifacts/innovation-strategy-<topic>.md
  traceable_to: []

gates:
  pre_start: []
  post_complete:
    - Jobs-to-be-Done analysis completed
    - Blue Ocean canvas populated
    - At least 2 innovation opportunities with business model implications

disciplines:
  self_critique: true
  anti_rationalization: true
  trust_levels: true
```

- [ ] **Step 2: Create instructions.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<instructions workflow="innovation-strategy">
  <setup>
    <action>If market-research, product-brief, or competitive-landscape artifacts exist, load them as context.</action>
  </setup>

  <topic>
    Architect strategic disruption opportunities through structured innovation analysis. The Innovation Strategist drives JTBD analysis and Blue Ocean mapping. The Brainstorming Coach generates divergent market opportunity ideas. The Product Manager grounds opportunities in user value. The Research Analyst identifies unknowns and validates market assumptions.

    Flow: current-state mapping → Jobs-to-be-Done analysis → Blue Ocean canvas (eliminate, reduce, raise, create) → innovation opportunity identification → business model implications → strategic recommendations.
  </topic>

  <synthesis>
    <action>Compile the innovation strategy artifact. Every innovation recommendation must map to business model impact. Rank opportunities by disruption potential and feasibility.</action>
    <template-output file="docs/creative-artifacts/innovation-strategy-{topic}.md">
      Apply the template from template.md. Fill all sections with session outputs.
    </template-output>
  </synthesis>
</instructions>
```

- [ ] **Step 3: Create checklist.md**

```markdown
# innovation-strategy Checklist

## Pre-start
- (none — can start from a market question)

## Post-complete
- [ ] Jobs-to-be-Done analysis has at least 3 identified jobs
- [ ] Blue Ocean canvas is populated (eliminate, reduce, raise, create)
- [ ] At least 2 innovation opportunities identified
- [ ] Each opportunity has business model implications mapped
- [ ] Strategic recommendations are ranked by disruption potential
```

- [ ] **Step 4: Create template.md**

```markdown
# Innovation Strategy — <topic>

**Date:** {{date}}
**Participants:** {{participants}}
**Market Focus:** {{market_focus}}

---

## Current State
- Industry landscape:
- Key players:
- Assumed constraints:

## Jobs-to-be-Done Analysis
- Job 1:
- Job 2:
- Job 3:
- Underserved jobs:

## Blue Ocean Canvas
| Factor | Eliminate | Reduce | Raise | Create |
|---|---|---|---|---|
| | | | | |

## Innovation Opportunities
### Opportunity 1
- Description:
- Disruption type:
- Business model implications:

### Opportunity 2
- Description:
- Disruption type:
- Business model implications:

## Strategic Recommendations
- Priority ranking:
- Next steps:
```

- [ ] **Step 5: Run test to verify innovation-strategy passes**

Run: `npx vitest run tests/workflows-creative.test.js -t "innovation-strategy"`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add _symphony/creative/workflows/innovation-strategy/
git commit -m "feat(creative): add innovation-strategy ensemble workflow (Spec 6a)"
```

---

### Task 4: problem-solving Workflow (Ensemble)

**Files:**
- Create: `_symphony/creative/workflows/problem-solving/workflow.yaml`
- Create: `_symphony/creative/workflows/problem-solving/instructions.xml`
- Create: `_symphony/creative/workflows/problem-solving/checklist.md`
- Create: `_symphony/creative/workflows/problem-solving/template.md`

- [ ] **Step 1: Create workflow.yaml**

```yaml
id: problem-solving
owner: problem-solver
model: opus
description: Structured problem decomposition — root cause analysis, TRIZ, systems thinking

execution:
  mode: ensemble
  wave_eligible: false
  max_wave_siblings: 0
  ensemble_participants: [problem-solver, brainstorming-coach, design-thinking-coach, architect]
  ensemble_turn_policy: round-robin
  max_turns: 16

inputs:
  required: []
  optional: [problem-statement, symptom-list, system-context]

outputs:
  primary: docs/creative-artifacts/problem-solving-<topic>.md
  traceable_to: []

gates:
  pre_start: []
  post_complete:
    - Root cause identified and distinguished from symptoms
    - At least 2 solution options evaluated
    - Selected solution resolves the core contradiction

disciplines:
  self_critique: true
  anti_rationalization: true
  trust_levels: true
```

- [ ] **Step 2: Create instructions.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<instructions workflow="problem-solving">
  <setup>
    <action>If problem-statement, symptom-list, or system-context artifacts exist, load them as context.</action>
  </setup>

  <topic>
    Crack the problem through systematic analysis. The Problem Solver drives root cause identification using 5 Whys, fishbone, and TRIZ. The Brainstorming Coach generates divergent solution ideas once root cause is established. The Design Thinking Coach contributes human-centered perspective on problem framing. The Architect evaluates technical feasibility of proposed solutions.

    Flow: problem framing → symptom vs. cause separation → 5 Whys deep dive → contradiction identification → solution generation → solution evaluation → recommendation.
  </topic>

  <synthesis>
    <action>Compile the problem-solving artifact. Root cause must be clearly distinguished from symptoms with evidence. Selected solution must resolve the core contradiction, not just patch symptoms.</action>
    <template-output file="docs/creative-artifacts/problem-solving-{topic}.md">
      Apply the template from template.md. Fill all sections with session outputs.
    </template-output>
  </synthesis>
</instructions>
```

- [ ] **Step 3: Create checklist.md**

```markdown
# problem-solving Checklist

## Pre-start
- (none — can start from a problem description)

## Post-complete
- [ ] Symptoms are listed separately from root cause
- [ ] 5 Whys analysis reaches at least 3 levels deep
- [ ] Root cause is stated with supporting evidence
- [ ] At least 2 solution options are evaluated
- [ ] Selected solution resolves the core contradiction
```

- [ ] **Step 4: Create template.md**

```markdown
# Problem Solving — <topic>

**Date:** {{date}}
**Participants:** {{participants}}
**Problem Statement:** {{problem_statement}}

---

## Problem Framing
- Observed symptoms:
- Assumed constraints:
- System context:

## Root Cause Analysis
### 5 Whys
1. Why?
2. Why?
3. Why?
4. Why?
5. Why?

### Fishbone Diagram
- People:
- Process:
- Technology:
- Environment:

## Contradiction
- Core contradiction:
- TRIZ inventive principles considered:

## Solution Options
### Option 1
- Description:
- Resolves contradiction:
- Feasibility:

### Option 2
- Description:
- Resolves contradiction:
- Feasibility:

## Recommendation
- Selected solution:
- Implementation steps:
- Validation criteria:
```

- [ ] **Step 5: Run test to verify problem-solving passes**

Run: `npx vitest run tests/workflows-creative.test.js -t "problem-solving"`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add _symphony/creative/workflows/problem-solving/
git commit -m "feat(creative): add problem-solving ensemble workflow (Spec 6a)"
```

---

### Task 5: creative-sprint Workflow (Ensemble)

**Files:**
- Create: `_symphony/creative/workflows/creative-sprint/workflow.yaml`
- Create: `_symphony/creative/workflows/creative-sprint/instructions.xml`
- Create: `_symphony/creative/workflows/creative-sprint/checklist.md`
- Create: `_symphony/creative/workflows/creative-sprint/template.md`

- [ ] **Step 1: Create workflow.yaml**

```yaml
id: creative-sprint
owner: brainstorming-coach
model: opus
description: Full creative team sprint — all 6 creative agents collaborate on a creative challenge

execution:
  mode: ensemble
  wave_eligible: false
  max_wave_siblings: 0
  ensemble_participants: [brainstorming-coach, design-thinking-coach, innovation-strategist, problem-solver, storyteller, presentation-designer]
  ensemble_turn_policy: user-picks
  max_turns: 20

inputs:
  required: []
  optional: [topic, problem-statement, existing-material]

outputs:
  primary: docs/creative-artifacts/creative-sprint-<topic>.md
  traceable_to: []

gates:
  pre_start: []
  post_complete:
    - At least 4 of 6 agents contributed substantively
    - Synthesis includes actionable next steps
    - Creative output is tangible (artifact, plan, or prototype spec)

disciplines:
  self_critique: true
  anti_rationalization: true
  trust_levels: true
```

- [ ] **Step 2: Create instructions.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<instructions workflow="creative-sprint">
  <setup>
    <action>If topic, problem-statement, or existing-material artifacts exist, load them as context. If none supplied, ask the user: "What is the creative challenge?"</action>
  </setup>

  <topic>
    A full-team creative sprint where all 6 creative agents collaborate on a creative challenge. The Brainstorming Coach facilitates and keeps energy high. The Design Thinking Coach contributes human-centered perspective. The Innovation Strategist maps ideas to business model impact. The Problem Solver applies structured decomposition when the group gets stuck. The Storyteller frames outputs as narratives. The Presentation Designer structures the final deliverable for clarity.

    The user picks which agent speaks next (user-picks turn policy). Goal: produce a tangible creative output — an artifact, action plan, or prototype specification.
  </topic>

  <synthesis>
    <action>Compile the creative sprint artifact. Include key contributions from each participating agent. Synthesis must include actionable next steps and identify which follow-up workflow (if any) should run next.</action>
    <template-output file="docs/creative-artifacts/creative-sprint-{topic}.md">
      Apply the template from template.md. Fill all sections with session outputs.
    </template-output>
  </synthesis>
</instructions>
```

- [ ] **Step 3: Create checklist.md**

```markdown
# creative-sprint Checklist

## Pre-start
- (none — brainstorming-coach will ask for the topic if not supplied)

## Post-complete
- [ ] At least 4 of 6 agents contributed substantively
- [ ] Divergent phase generated multiple ideas or perspectives
- [ ] Convergent phase synthesized into actionable output
- [ ] Synthesis includes clear next steps
- [ ] Creative output is tangible (not just discussion)
```

- [ ] **Step 4: Create template.md**

```markdown
# Creative Sprint — <topic>

**Date:** {{date}}
**Participants:** {{participants}}
**Creative Challenge:** {{challenge}}

---

## Contributions

### Divergent Phase
{{divergent_contributions}}

### Convergent Phase
{{convergent_contributions}}

## Key Insights
{{insights}}

## Creative Output
{{output}}

## Next Steps
- Recommended follow-up workflow:
- Action items:
```

- [ ] **Step 5: Run test to verify creative-sprint passes**

Run: `npx vitest run tests/workflows-creative.test.js -t "creative-sprint"`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add _symphony/creative/workflows/creative-sprint/
git commit -m "feat(creative): add creative-sprint ensemble workflow (Spec 6a)"
```

---

### Task 6: storytelling Workflow (Sequential)

**Files:**
- Create: `_symphony/creative/workflows/storytelling/workflow.yaml`
- Create: `_symphony/creative/workflows/storytelling/instructions.xml`
- Create: `_symphony/creative/workflows/storytelling/checklist.md`
- Create: `_symphony/creative/workflows/storytelling/template.md`

- [ ] **Step 1: Create workflow.yaml**

```yaml
id: storytelling
owner: storyteller
model: opus
description: Craft a narrative with arc, character, conflict, resolution

execution:
  mode: sequential
  wave_eligible: false
  max_wave_siblings: 0
  ensemble_participants: []
  ensemble_turn_policy: null
  max_turns: null

inputs:
  required: [topic]
  optional: [audience, tone, existing-material]

outputs:
  primary: docs/creative-artifacts/story-<topic>.md
  traceable_to: []

gates:
  pre_start:
    - Topic is stated clearly
  post_complete:
    - Story has identifiable arc (setup, conflict, resolution)
    - Character has stated motivation
    - Resolution ties to setup

disciplines:
  self_critique: true
  anti_rationalization: true
  trust_levels: true
```

- [ ] **Step 2: Create instructions.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<instructions workflow="storytelling">
  <steps>
    <step n="1" title="Discover the core message">
      <action>Ask the user what truth they want the audience to feel. Identify the transformation: what changes from beginning to end?</action>
      <action>If audience and tone are supplied, load them. Otherwise ask.</action>
    </step>
    <step n="2" title="Design the character">
      <action>Define the protagonist — who is the audience meant to identify with? What is their motivation? What do they want and what stands in their way?</action>
    </step>
    <step n="3" title="Build the arc">
      <action>Structure the narrative: setup (world before), inciting incident (what disrupts), rising action (obstacles), climax (moment of truth), resolution (new world).</action>
    </step>
    <step n="4" title="Add sensory detail">
      <action>Apply show-don't-tell. Replace abstractions with concrete, sensory details. Make the audience see, hear, and feel the story.</action>
    </step>
    <step n="5" title="Test the story">
      <action>Read the story back. Does the resolution tie to the setup? Does the character transform? Would the target audience care? Revise if needed.</action>
    </step>
    <step n="6" title="Produce the story artifact">
      <template-output file="docs/creative-artifacts/story-{topic}.md">
        Apply the template from template.md. Fill all sections with the crafted narrative.
      </template-output>
    </step>
  </steps>
</instructions>
```

- [ ] **Step 3: Create checklist.md**

```markdown
# storytelling Checklist

## Pre-start
- [ ] Topic is stated clearly

## Post-complete
- [ ] Arc is present: setup, inciting incident, climax, resolution
- [ ] Main character has a named motivation
- [ ] At least one obstacle is specified and overcome
- [ ] Resolution connects back to the setup
- [ ] Story fits the stated audience and tone
```

- [ ] **Step 4: Create template.md**

```markdown
# Story — <topic>

**Date:** {{date}}
**Audience:** {{audience}}
**Tone:** {{tone}}
**Core Message:** {{core_message}}

---

## Character
- Protagonist:
- Motivation:
- Stakes:

## Narrative Arc

### Setup
{{setup}}

### Inciting Incident
{{inciting_incident}}

### Rising Action
{{rising_action}}

### Climax
{{climax}}

### Resolution
{{resolution}}

## Transformation
- Before:
- After:
```

- [ ] **Step 5: Run test to verify storytelling passes**

Run: `npx vitest run tests/workflows-creative.test.js -t "storytelling"`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add _symphony/creative/workflows/storytelling/
git commit -m "feat(creative): add storytelling sequential workflow (Spec 6a)"
```

---

### Task 7: slide-deck Workflow (Sequential)

**Files:**
- Create: `_symphony/creative/workflows/slide-deck/workflow.yaml`
- Create: `_symphony/creative/workflows/slide-deck/instructions.xml`
- Create: `_symphony/creative/workflows/slide-deck/checklist.md`
- Create: `_symphony/creative/workflows/slide-deck/template.md`

- [ ] **Step 1: Create workflow.yaml**

```yaml
id: slide-deck
owner: presentation-designer
model: opus
description: Design a presentation with narrative arc, visual hierarchy, and slide-by-slide specifications

execution:
  mode: sequential
  wave_eligible: false
  max_wave_siblings: 0
  ensemble_participants: []
  ensemble_turn_policy: null
  max_turns: null

inputs:
  required: [topic]
  optional: [audience, content-brief, brand-guidelines]

outputs:
  primary: docs/creative-artifacts/slide-deck-<topic>.md
  traceable_to: []

gates:
  pre_start:
    - Topic is stated clearly
  post_complete:
    - Narrative arc established before slide design
    - Every slide has an assigned job (inform, persuade, transition)
    - One idea per slide rule followed

disciplines:
  self_critique: true
  anti_rationalization: true
  trust_levels: true
```

- [ ] **Step 2: Create instructions.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<instructions workflow="slide-deck">
  <steps>
    <step n="1" title="Define audience and purpose">
      <action>Identify who will see this deck and what decision or action it should drive. Load content-brief or brand-guidelines if available.</action>
    </step>
    <step n="2" title="Establish the narrative arc">
      <action>Design the story flow before any slides. What is the opening hook? What is the core message? What is the call to action? Story first, slides second.</action>
    </step>
    <step n="3" title="Design message hierarchy">
      <action>For each section of the arc, define the key message. Apply the pyramid principle — lead with the conclusion, support with evidence.</action>
    </step>
    <step n="4" title="Specify slides">
      <action>Design each slide: title, key message, content notes, visual direction, and job (inform, persuade, or transition). One idea per slide — no exceptions.</action>
    </step>
    <step n="5" title="Review and cut">
      <action>Review every slide. If it does not advance the narrative, move it to the appendix or cut it. White space is breathing room for ideas.</action>
    </step>
    <step n="6" title="Produce the slide deck artifact">
      <template-output file="docs/creative-artifacts/slide-deck-{topic}.md">
        Apply the template from template.md. Fill all sections with slide specifications.
      </template-output>
    </step>
  </steps>
</instructions>
```

- [ ] **Step 3: Create checklist.md**

```markdown
# slide-deck Checklist

## Pre-start
- [ ] Topic is stated clearly

## Post-complete
- [ ] Narrative arc is established before slide design
- [ ] Every slide has an assigned job: inform, persuade, or transition
- [ ] One idea per slide — no exceptions
- [ ] Opening has a hook; closing has a call to action
- [ ] Appendix contains cut material (if any)
```

- [ ] **Step 4: Create template.md**

```markdown
# Slide Deck — <topic>

**Date:** {{date}}
**Audience:** {{audience}}
**Purpose:** {{purpose}}
**Core Message:** {{core_message}}

---

## Narrative Arc
- Opening hook:
- Core argument:
- Call to action:

## Slides

### Slide 1: Title
- Job: inform
- Key message:
- Content notes:
- Visual direction:

### Slide 2: {{title}}
- Job: {{inform|persuade|transition}}
- Key message:
- Content notes:
- Visual direction:

<!-- Repeat for each slide -->

## Appendix
{{appendix_items}}
```

- [ ] **Step 5: Run test to verify slide-deck passes**

Run: `npx vitest run tests/workflows-creative.test.js -t "slide-deck"`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add _symphony/creative/workflows/slide-deck/
git commit -m "feat(creative): add slide-deck sequential workflow (Spec 6a)"
```

---

### Task 8: pitch-deck Workflow (Sequential)

**Files:**
- Create: `_symphony/creative/workflows/pitch-deck/workflow.yaml`
- Create: `_symphony/creative/workflows/pitch-deck/instructions.xml`
- Create: `_symphony/creative/workflows/pitch-deck/checklist.md`
- Create: `_symphony/creative/workflows/pitch-deck/template.md`

- [ ] **Step 1: Create workflow.yaml**

```yaml
id: pitch-deck
owner: presentation-designer
model: opus
description: Design an investor or partner pitch deck with standard structure and storytelling

execution:
  mode: sequential
  wave_eligible: false
  max_wave_siblings: 0
  ensemble_participants: []
  ensemble_turn_policy: null
  max_turns: null

inputs:
  required: [topic]
  optional: [audience, story-artifact, market-data, traction-data]

outputs:
  primary: docs/creative-artifacts/pitch-deck-<topic>.md
  traceable_to: []

gates:
  pre_start:
    - Topic is stated clearly
  post_complete:
    - All standard pitch sections addressed (problem, solution, market, traction, team, ask)
    - Narrative arc threads through the deck
    - Every slide has an assigned job

disciplines:
  self_critique: true
  anti_rationalization: true
  trust_levels: true
```

- [ ] **Step 2: Create instructions.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<instructions workflow="pitch-deck">
  <steps>
    <step n="1" title="Load context and story artifact">
      <action>If a story artifact exists (from the storytelling workflow), load it for narrative threading. Load market-data and traction-data if available.</action>
    </step>
    <step n="2" title="Define the pitch narrative">
      <action>Structure the pitch arc: problem (pain), solution (relief), market (opportunity), traction (proof), team (credibility), ask (next step). The story artifact informs the emotional thread if present.</action>
    </step>
    <step n="3" title="Design problem and solution slides">
      <action>The problem slide must make the audience feel the pain. The solution slide must deliver relief. One idea per slide.</action>
    </step>
    <step n="4" title="Design market and traction slides">
      <action>Market slide: TAM/SAM/SOM or equivalent sizing. Traction slide: metrics, milestones, proof points. Data visualization principles apply.</action>
    </step>
    <step n="5" title="Design team and ask slides">
      <action>Team slide: why this team wins. Ask slide: specific, concrete request with clear next step.</action>
    </step>
    <step n="6" title="Review and finalize">
      <action>Review every slide for job assignment. Cut anything that does not advance the pitch. Move supporting detail to appendix.</action>
    </step>
    <step n="7" title="Produce the pitch deck artifact">
      <template-output file="docs/creative-artifacts/pitch-deck-{topic}.md">
        Apply the template from template.md. Fill all sections with pitch deck specifications.
      </template-output>
    </step>
  </steps>
</instructions>
```

- [ ] **Step 3: Create checklist.md**

```markdown
# pitch-deck Checklist

## Pre-start
- [ ] Topic is stated clearly

## Post-complete
- [ ] Problem slide makes the audience feel the pain
- [ ] Solution slide delivers clear relief
- [ ] Market sizing is present (TAM/SAM/SOM or equivalent)
- [ ] Traction or proof points are included
- [ ] Ask is specific with a clear next step
- [ ] Narrative arc threads through the entire deck
```

- [ ] **Step 4: Create template.md**

```markdown
# Pitch Deck — <topic>

**Date:** {{date}}
**Audience:** {{audience}}
**Story Artifact:** {{story_ref_or_none}}

---

## Pitch Narrative Arc
- Emotional thread:
- Core thesis:

## Slides

### Slide 1: Title
- Job: inform
- Key message:
- Visual direction:

### Slide 2: Problem
- Job: persuade
- Pain point:
- Evidence:

### Slide 3: Solution
- Job: persuade
- Relief:
- Differentiator:

### Slide 4: Market
- Job: inform
- TAM/SAM/SOM:
- Key insight:

### Slide 5: Traction
- Job: persuade
- Metrics:
- Milestones:

### Slide 6: Team
- Job: inform
- Why this team:
- Key credentials:

### Slide 7: Ask
- Job: persuade
- Specific request:
- Next step:

## Appendix
{{appendix_items}}
```

- [ ] **Step 5: Run full creative workflow tests**

Run: `npx vitest run tests/workflows-creative.test.js`
Expected: All 7 workflows PASS (all assertions green).

- [ ] **Step 6: Commit**

```bash
git add _symphony/creative/workflows/pitch-deck/
git commit -m "feat(creative): add pitch-deck sequential workflow (Spec 6a)"
```

---

### Task 9: Update structure.test.js and Manifest

**Files:**
- Modify: `tests/structure.test.js`
- Modify: `_symphony/_config/manifest.yaml`

- [ ] **Step 1: Add creative inventory assertions to structure.test.js**

Add the following describe block inside the existing top-level `'Symphony repo structure'` describe, after the `'_symphony module directories'` block:

```javascript
  describe('_symphony/creative — agents and workflows (Spec 6a)', () => {
    const creativeAgents = [
      'brainstorming-coach',
      'design-thinking-coach',
      'innovation-strategist',
      'problem-solver',
      'storyteller',
      'presentation-designer',
    ];
    for (const a of creativeAgents) {
      it(`has creative agent ${a}`, () => {
        expect(exists(`_symphony/creative/agents/${a}.md`)).toBe(true);
      });
    }

    const creativeWorkflows = [
      'design-thinking',
      'innovation-strategy',
      'problem-solving',
      'creative-sprint',
      'storytelling',
      'slide-deck',
      'pitch-deck',
    ];
    for (const w of creativeWorkflows) {
      it(`has creative workflow ${w}`, () => {
        expect(exists(`_symphony/creative/workflows/${w}/workflow.yaml`)).toBe(true);
      });
    }
  });
```

- [ ] **Step 2: Bump the creative module version in manifest.yaml**

Change the creative module block in `_symphony/_config/manifest.yaml`:

```yaml
  creative:
    version: "0.0.2-alpha.1"
    description: "Creative agents and workflows"
```

- [ ] **Step 3: Run full test suite**

Run: `npx vitest run`
Expected: All tests PASS. Count should be approximately 714 (current) + ~66 (agents-creative from Part A) + ~82 (workflows-creative) + ~13 (structure) = ~875 total.

- [ ] **Step 4: Commit**

```bash
git add tests/structure.test.js _symphony/_config/manifest.yaml
git commit -m "test(structure): add creative inventory assertions; bump creative module to 0.0.2-alpha.1 (Spec 6a)"
```

---

### Task 10: Dashboard Refresh

**Files:**
- Modify: `Symphony_Framework_Comparison.html`
- Modify: `Symphony_Lifecycle_Activity_Diagram.html`

- [ ] **Step 1: Capture the final test count**

Run: `npx vitest run 2>&1 | tail -5`
Record the final passing test count — this number goes into the comparison dashboard.

- [ ] **Step 2: Update the comparison dashboard**

Open `Symphony_Framework_Comparison.html` and update the Symphony column:
- Agents: 15 → 21
- Workflows: 47 → 54
- Tests: replace previous count with the number captured in Step 1
- Creative module status: flip from empty/missing to shipped with 6 agents + 7 workflows

- [ ] **Step 3: Update the activity diagram**

Open `Symphony_Lifecycle_Activity_Diagram.html` and add a Creative module section reflecting:
- 6 creative agents: brainstorming-coach, design-thinking-coach, innovation-strategist, problem-solver, storyteller, presentation-designer
- 7 creative workflows (4 ensemble, 3 sequential) as listed in the structure test

- [ ] **Step 4: Verify dashboards render correctly**

Run: `open Symphony_Framework_Comparison.html` and `open Symphony_Lifecycle_Activity_Diagram.html`
Verify both render with updated numbers and creative module content.

- [ ] **Step 5: Commit**

```bash
git add Symphony_Framework_Comparison.html Symphony_Lifecycle_Activity_Diagram.html
git commit -m "docs(dashboards): reflect Spec 6a completion — 21 agents, 54 workflows, updated test count"
```

---

## Summary (Part B)

| Task | What | Files | Estimated Assertions |
|---|---|---|---|
| 1 | Workflow test file | `tests/workflows-creative.test.js` | 0 (test infra) |
| 2 | design-thinking | `_symphony/creative/workflows/design-thinking/*` | 12 |
| 3 | innovation-strategy | `_symphony/creative/workflows/innovation-strategy/*` | 12 |
| 4 | problem-solving | `_symphony/creative/workflows/problem-solving/*` | 12 |
| 5 | creative-sprint | `_symphony/creative/workflows/creative-sprint/*` | 12 |
| 6 | storytelling | `_symphony/creative/workflows/storytelling/*` | 10 |
| 7 | slide-deck | `_symphony/creative/workflows/slide-deck/*` | 10 |
| 8 | pitch-deck | `_symphony/creative/workflows/pitch-deck/*` | 10 |
| 9 | Structure + manifest | `tests/structure.test.js`, `manifest.yaml` | ~13 |
| 10 | Dashboards | 2 HTML files | 0 (visual) |

**Projected final test count:** 714 (current) + ~66 (Part A) + ~82 (Part B workflows) + ~13 (structure) = ~875 passing
