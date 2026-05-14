# Contributing to Symphony

Symphony welcomes contributions — new agents, workflows, knowledge fragments, adapters, and protocol improvements.

## Project Structure

```
_symphony/           Core framework (specs, not runtime code yet)
adapters/            Platform-specific translators
tests/               Vitest structural validation tests
docs/                Specs, plans, and guides
```

## Before You Start

1. Run `npm install`
2. Run `npm test` — all tests must pass before and after your changes
3. Read `CLAUDE.md` for project rules and constraints

## Adding an Agent

Create a Markdown file with YAML frontmatter and XML body:

```
_symphony/{module}/agents/{agent-name}.md
```

Required structure:
- **Frontmatter:** id, name, role, model, max_lines (≤ 200)
- **XML:** `<agent>` root with `<persona>`, `<knowledge-sources>`, `<disciplines>`, `<workflows-owned>`, `<memory-sidecar>`
- **Disciplines:** At least 2 excuse/rebuttal pairs in `<anti-rationalization>`

Add a corresponding entry in `tests/structure.test.js`.

## Adding a Workflow

Create a directory with 4 files:

```
_symphony/{module}/workflows/{phase}/{workflow-name}/
├── workflow.yaml      Execution mode, inputs, outputs, gates
├── instructions.xml   Step-by-step execution instructions
├── template.md        Output template with mustache placeholders
└── checklist.md       Pre/post completion checklist
```

Add the workflow to `tests/structure.test.js` and the relevant workflow test file.

## Adding a Knowledge Fragment

Create a Markdown file under the appropriate knowledge directory:

```
_symphony/dev/knowledge/{language}/{fragment-name}.md
_symphony/testing/knowledge/{category}/{fragment-name}.md
```

Required sections:
- H1 title with **Principle:** statement
- `## Pattern Examples` (3+ patterns with code)
- `## Anti-Patterns` (5+ anti-patterns with explanations)
- `## Integration Points` (tools and frameworks)

Max 150 lines. Add to the relevant knowledge test file.

## Adding an Adapter

Create a directory under `adapters/` and a registry entry under `_symphony/core/adapter-registry/`:

```
adapters/{adapter-id}/
├── adapter.yaml              Installer-side manifest
├── translator.js             Pure file generator (ES module)
└── templates/{name}.tmpl     Handlebars template

_symphony/core/adapter-registry/{adapter-id}.yaml   Core-side registry
```

The translator must export:
- `translate(corePath, userProjectPath, options)` — returns `{ commands_generated, entry_command }`
- `metadata` — `{ id, stub: false, specReference }`

Add tests in `tests/adapters.test.js` following the existing pattern.

**Golden rule:** Adapters are pure file generators. No business logic.

## Context Budget Limits

- Agent persona files: ≤ 200 lines
- Instruction step files: ≤ 150 lines
- Skill files: ≤ 300 lines
- Knowledge fragments: ≤ 150 lines
- Any `.md` file: ≤ 1000 lines (split if exceeded)

## Commit Convention

Use conventional commits: `feat:`, `fix:`, `test:`, `docs:`, `refactor:`

Include the spec reference when applicable: `feat(dev): add X agent (Spec 7d §2)`

## Running Tests

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run validate-structure   # Structure test only
```

All new files must have corresponding test assertions. The structure test prevents layout drift.
