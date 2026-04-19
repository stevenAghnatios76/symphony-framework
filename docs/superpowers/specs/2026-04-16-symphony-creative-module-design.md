# Symphony Creative Module Design (Spec 6a)

> **Sub-plan:** 5 of the Symphony Master Gap-Closure Plan — `Dev / Creative / Testing Modules (Spec 6)`, first slice.
> **Spec siblings to follow:** 6b Testing Module, 6c Dev Module.
> **Depends on:** Spec 5a (lifecycle agents), Spec 5b/5c/5d (workflows). Both shipped.
> **Absorbs from:** Gaia-framework (`_gaia/creative/`) — 6 creative agents + 7 workflows.

## Purpose

Close the Creative gap identified in the Framework Comparison Heatmap. Symphony ships 15 lifecycle agents and 47 lifecycle/anytime workflows at v0.0.2-alpha but has zero creative-focused personas or workflows. Creative work (ideation, design thinking, storytelling, pitching) is currently done by general-purpose lifecycle agents (product-manager, ux-designer), which dilutes both their identities and the quality of creative output.

This spec adds a dedicated Creative module under `_symphony/creative/` with six creative-discipline agents and seven creative workflows, following the Symphony-Native approach (approach B) that re-authors Gaia's creative wisdom in Symphony's voice and 4-file workflow structure.

## Non-goals

- No changes to the engine, protocols, Conductor, Wave Executor, adapters, or any existing lifecycle content
- No new execution modes (reuses shipped `ensemble` and `sequential` modes)
- No knowledge fragments (deferred to Spec 6c Dev module)
- No dev-facing skills (deferred to Spec 6c)
- No testing workflows (deferred to Spec 6b)
- Dashboards refresh happens in the 6a implementation plan after code lands — not part of this spec

## Architecture

### File layout

```
_symphony/creative/
├── agents/
│   ├── brainstorming-coach.md
│   ├── design-thinking-coach.md
│   ├── innovation-strategist.md
│   ├── presentation-designer.md
│   ├── problem-solver.md
│   └── storyteller.md
└── workflows/
    ├── creative-sprint/      # ensemble, all 6 creative agents
    ├── design-thinking/      # ensemble
    ├── innovation-strategy/  # ensemble
    ├── pitch-deck/           # sequential
    ├── problem-solving/      # ensemble
    ├── slide-deck/           # sequential
    └── storytelling/         # sequential

tests/
├── agents-creative.test.js
└── workflows-creative.test.js

docs/superpowers/
├── specs/2026-04-16-symphony-creative-module-design.md   # this doc
└── plans/2026-04-16-symphony-spec-6a-creative-module.md   # follow-up
```

Each workflow directory uses the shipped 4-file pattern: `workflow.yaml` + `instructions.xml` + `checklist.md` + `template.md`.

### Module integration

Creative module integrates with the running engine with zero engine changes:

- Conductor routes `/symphony-<workflow-id>` commands to creative workflows via adapter-generated slash commands. Adapter translators already enumerate `_symphony/creative/workflows/` on `symphony-framework update`.
- `_symphony/_config/manifest.yaml` inventory grows by 6 agents + 7 workflows. Structure tests assert these counts.
- `lifecycle-sequence.yaml` treats creative workflows as standalone (no phase transitions). Conductor can still suggest them as anytime companions when user intent matches.
- Party mode (`/symphony-party`) remains unchanged. `creative-sprint` is a separate, creative-focused ensemble with all 6 creative agents participating.
- Cross-module invocation is permitted: existing lifecycle workflows (e.g., Phase 1 `brainstorm`) may list creative agents as optional participants in future follow-ups; not required for 6a.

## Agents

All 6 agents use Symphony's role-based ID convention (no persona names), model `opus`, `max_lines: 200`, and the `<persona>` / `<knowledge-sources>` / `<disciplines>` / `<workflows-owned>` / `<memory-sidecar>` structure from Spec 5a.

### `brainstorming-coach`

**Role:** Facilitates divergent ideation.

**Expertise:** SCAMPER, 6 Thinking Hats, mind-mapping, crazy-8s, worst-possible-idea, forced connections, random-word stimulus, reverse brainstorming.

**Operating mode:** Joins ensembles as a divergence engine; does not own a workflow. Goal is to maximize idea volume in divergence turns and surface dormant options before convergence.

**Anti-rationalization samples:**
- "More ideas = better" → "Quantity matters in divergence; convergence needs criteria. Apply explicit filters before declaring done."
- "We already know the answer" → "Confirmation bias is the enemy of creative work. Generate 3 alternative framings before committing."

### `design-thinking-coach`

**Role:** Runs the Stanford 5-stage design thinking flow — empathize → define → ideate → prototype → test.

**Expertise:** user-interview synthesis, point-of-view (POV) statements, how-might-we (HMW) reframing, storyboarding, lo-fi prototyping, assumption mapping.

**Operating mode:** Owns `design-thinking` workflow. Enforces stage completion and forbids advancing without outputs per stage.

### `innovation-strategist`

**Role:** Business-facing creative strategy — what to build and why.

**Expertise:** Jobs-to-be-Done, Blue Ocean Strategy canvases, horizon scanning, S-curve trends, disruption taxonomy, adjacent-market analysis.

**Operating mode:** Owns `innovation-strategy` workflow. Participates in creative-sprint.

### `problem-solver`

**Role:** Structured problem decomposition.

**Expertise:** 5 Whys, fishbone (Ishikawa), first-principles decomposition, MECE framework, decision matrices, TRIZ contradiction resolution.

**Operating mode:** Owns `problem-solving` workflow. Participates in design-thinking (at the "define" stage) and creative-sprint.

### `storyteller`

**Role:** Narrative architecture.

**Expertise:** Hero's Journey, 3-act structure, narrative arc, character motivation, conflict escalation, resolution design, show-don't-tell.

**Operating mode:** Owns `storytelling` workflow. Consults on `pitch-deck` via artifact reference (pitch-deck reads the story artifact if present).

### `presentation-designer`

**Role:** Executive-ready message hierarchy and slide structure.

**Expertise:** message hierarchy, slide-level message clarity, visual rhythm, data visualization principles, title-slide discipline, pyramid principle, appendix discipline.

**Operating mode:** Owns `slide-deck` and `pitch-deck` workflows. Does not participate in ensembles (sequential-only).

**Anti-rationalization sample:**
- "More detail is safer" → "Every slide is an editorial choice. If it doesn't advance the message, cut it."

## Workflows

All 7 workflows follow the shipped 4-file pattern and Symphony's gate + disciplines conventions.

### Ensemble workflows (4)

| Workflow | Owner | Participants | Turn Policy | Max Turns |
|---|---|---|---|---|
| `design-thinking` | design-thinking-coach | brainstorming-coach, problem-solver, storyteller | round-robin | 20 |
| `innovation-strategy` | innovation-strategist | brainstorming-coach, product-manager, research-analyst | user-picks | 18 |
| `problem-solving` | problem-solver | brainstorming-coach, design-thinking-coach, architect | round-robin | 16 |
| `creative-sprint` | brainstorming-coach | design-thinking-coach, innovation-strategist, problem-solver, storyteller, presentation-designer | user-picks | 20 |

### Sequential workflows (3)

| Workflow | Owner | Primary Output |
|---|---|---|
| `storytelling` | storyteller | `docs/creative-artifacts/story-<topic>.md` |
| `slide-deck` | presentation-designer | `docs/creative-artifacts/slide-deck-<topic>.md` |
| `pitch-deck` | presentation-designer | `docs/creative-artifacts/pitch-deck-<topic>.md` |

### workflow.yaml pattern (ensemble example)

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

### workflow.yaml pattern (sequential example)

```yaml
id: storytelling
owner: storyteller
model: opus
description: Craft a narrative with arc, character, conflict, resolution

execution:
  mode: sequential
  wave_eligible: false
  max_wave_siblings: 0

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

### instructions.xml shape

All workflows use `<workflow>` root with `<step>` blocks. Each `<step>` contains `<action>`, `<emit>`, and optional `<gate-check>`. Ensemble workflows add a `<turns>` element describing round structure per stage. Sequential workflows use linear `<step>` sequence through the template sections.

### checklist.md

Each workflow ships a self-verification checklist (3-6 yes/no items) the owner runs before emitting the artifact. Example for `storytelling`:

```markdown
- [ ] Arc is present: setup, inciting incident, climax, resolution
- [ ] Main character has a named motivation
- [ ] At least one obstacle is specified and overcome
- [ ] Resolution connects back to the setup
- [ ] Story fits the stated audience and tone
```

### template.md

Per-workflow artifact scaffold with placeholders matching step outputs. Example structure for `design-thinking/template.md`:

```markdown
# Design Thinking — <topic>

## 1. Empathize
- Observations:
- User quotes:
- Emotional insights:

## 2. Define
- Point-of-view statement:
- How-might-we questions:

## 3. Ideate
- Idea pool (≥ 8):
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

## Data flow

**Ensemble workflow flow:**
1. Conductor routes `/symphony-<id>` to workflow-engine
2. Engine reads `workflow.yaml`, enforces `pre_start` gates
3. Engine iterates `<step>` blocks; for each ensemble step, it applies the `ensemble_turn_policy` (round-robin or user-picks) until `max_turns` or step completion
4. Each agent turn reads the current artifact state and emits an incremental contribution
5. Engine runs `self-critique` on each contribution (threshold 0.85) and `trust-levels` tagging on sources
6. Engine enforces `post_complete` gates before marking the workflow done
7. Final artifact written to `outputs.primary` path

**Sequential workflow flow:**
1. Conductor routes `/symphony-<id>` to workflow-engine
2. Engine reads `workflow.yaml`, enforces `pre_start` gates
3. Engine runs `<step>` blocks linearly with the `owner` agent
4. Engine runs `self-critique` per step, enforces `post_complete` gates
5. Final artifact written to `outputs.primary` path

## Error handling

- **Gate failure** → engine HALTs per Spec 2b gate-enforcer behavior. No creative-specific error paths.
- **Ensemble max_turns reached without satisfying post_complete gates** → engine emits partial artifact and requests user input. Creative workflows set generous `max_turns` (16-20) to avoid premature cutoff.
- **Empty ensemble contribution** → engine skips to next participant per turn policy. Agent receives its own self-critique rebuttal if it attempts to pass without adding value.
- **Missing optional inputs** → sequential workflows prompt the user or proceed with sensible defaults; creative-sprint asks "what's the topic?" if none supplied.

## Testing

Two new structural test files. Both use vitest and follow the pattern established by `tests/agents.test.js`, `tests/workflows-p1p3.test.js`, etc.

### `tests/agents-creative.test.js`

Per-agent assertions (6 agents × ~9 checks = ~54 assertions):
- File exists at `_symphony/creative/agents/<id>.md`
- Frontmatter has `id`, `name`, `role`, `model: opus`, `max_lines: 200`
- XML parses; contains `<agent>`, `<persona>` (with `<identity>`, `<expertise>`, `<operating-mode>`), `<knowledge-sources>` (trusted/verify/untrusted each non-empty), `<disciplines>` with `<self-critique threshold="0.85">`, `<anti-rationalization>` with ≥ 1 excuse/rebuttal pair, `<workflows-owned>` (may be empty for brainstorming-coach), `<memory-sidecar>`
- File length ≤ 200 lines

### `tests/workflows-creative.test.js`

Per-workflow assertions (7 workflows × ~10 checks = ~70 assertions):
- All 4 files exist: `workflow.yaml`, `instructions.xml`, `checklist.md`, `template.md`
- `workflow.yaml` parses as YAML with required fields: `id`, `owner`, `model`, `description`, `execution.mode`, `inputs`, `outputs`, `gates`, `disciplines`
- `execution.mode` is `ensemble` or `sequential`
- If `ensemble`: `ensemble_participants` length ≥ 2, `ensemble_turn_policy` in `[round-robin, user-picks]`, `max_turns` is a positive integer
- If `sequential`: no `ensemble_participants` or list is empty
- `instructions.xml` is well-formed; contains ≥ 1 `<step>`
- `checklist.md` has ≥ 3 yes/no items (`- [ ]` or `- [x]`)
- `template.md` has sections mirroring the workflow's artifact scaffold (workflow-specific assertions)

### `tests/structure.test.js` additions

- Expected agent inventory grows by 6 files under `_symphony/creative/agents/`
- Expected workflow inventory grows by 7 directories under `_symphony/creative/workflows/`
- New test files `tests/agents-creative.test.js` and `tests/workflows-creative.test.js` are listed in the test-file manifest

### Test count projection

- Current: 714 passing
- Added by this spec: ~54 (agents) + ~70 (workflows) + ~3 (structure) ≈ 127
- Projected after 6a: ~841 passing (actual count set by the implementation plan)

## Context budget

Per `CLAUDE.md`:
- Agent persona files ≤ 200 lines — enforced by test + `max_lines` frontmatter
- Any `.md` ≤ 1000 lines — this spec ~350 lines, well under limit
- No knowledge fragments in 6a (deferred to 6c)

## Rollout

1. **Spec approved by user** (this step)
2. **Writing-plans skill** generates detailed implementation plan under `docs/superpowers/plans/2026-04-16-symphony-spec-6a-creative-module.md`
3. **TDD execution** via subagent-driven-development or in-session — one TDD cycle per agent, one per workflow
4. **Post-merge dashboard refresh** in the implementation plan — updates `Symphony_Framework_Comparison.html` and `Symphony_Lifecycle_Activity_Diagram.html` to reflect 21 agents / 54 workflows / new test count
5. **Sibling specs (6b, 6c)** brainstormed in follow-up sessions

## References

- Symphony Architecture Spec: `docs/superpowers/specs/2026-04-08-symphony-architecture-design.md`
- Lifecycle Agents Spec (sibling pattern): `docs/superpowers/specs/2026-04-12-symphony-lifecycle-agents-design.md`
- Master gap-closure plan: `docs/superpowers/plans/2026-04-10-symphony-master-gap-closure-plan.md` (Sub-Plan 5)
- Gaia Creative module (source of wisdom): `/Users/stevenagh76/Documents/solution-comapre/Gaia-framework/_gaia/creative/`
