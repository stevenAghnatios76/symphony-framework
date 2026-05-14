# Symphony Runtime Adapters — Design Spec (Spec 7)

> **Spec:** 7 of 8 (Runtime Adapters)
> **Status:** Draft — awaiting user review
> **Date:** 2026-04-10
> **Depends on:** Spec 1 (Architecture §7), Spec 2b (Protocols)
> **Scope:** Concrete implementations of the Claude Code and Copilot adapter translators, plus shared utility for workflow enumeration and template rendering. Does NOT cover CLI commands (Spec 8), Obsidian integration (Spec 8), or additional adapters beyond the initial two.

---

## 1. Overview

Symphony's dual-layer architecture separates Core (tool-agnostic) from Adapters (tool-specific). Each adapter is a pure file generator — it reads Core workflows and emits tool-specific command files at install time. This spec implements the two existing adapter translators (currently stubs that throw "not yet implemented") and extracts shared logic into a utility module.

**Golden rule (§7.5):** Adapters contain zero business logic. Pure file generators. If behavior changes, it changes in Core.

---

## 2. Shared Utility

**File:** `lib/adapter-utils.js`

### 2.1 enumerateWorkflows(corePath)

Scans the `_symphony/` directory tree for workflow directories (directories containing a `workflow.yaml` file).

**Scan paths:**
- `{corePath}/_symphony/lifecycle/workflows/` (recursive — workflows are nested under phase dirs)
- `{corePath}/_symphony/dev/workflows/` (if exists)
- `{corePath}/_symphony/creative/workflows/` (if exists)
- `{corePath}/_symphony/testing/workflows/` (if exists)

**Returns:** Array of workflow objects:
```javascript
{
  id: "create-prd",           // from workflow.yaml id field
  phase: "2-planning",        // parent directory name
  model: "opus",              // from workflow.yaml model field (may be absent)
  owner: "product-manager",   // from workflow.yaml owner field
  description: "...",         // from workflow.yaml description field (or id if absent)
  workflowPath: "_symphony/lifecycle/workflows/2-planning/create-prd/"
}
```

**Behavior:**
- Skips directories without `workflow.yaml`
- Reads YAML using the `yaml` package (already a devDependency)
- Returns empty array if no workflows found (valid — pre-Spec 5 state)
- Does NOT throw on missing directories — gracefully handles empty module dirs

### 2.2 renderTemplate(templatePath, data)

Reads a `.tmpl` file and replaces `{{variable}}` placeholders with values from `data`.

**Supported syntax:**
- `{{variable}}` — simple string substitution
- `{{#if variable}}content{{/if}}` — conditional block (include content only if variable is truthy)

**Implementation:** Simple regex-based. No handlebars dependency — the templates are trivial.

---

## 3. Claude Code Adapter

**File:** `adapters/claude-code/translator.js`

### 3.1 translate(corePath, userProjectPath, options)

1. Call `enumerateWorkflows(corePath)` to get all workflow objects
2. Read `adapters/claude-code/adapter.yaml` for output configuration
3. Ensure `{userProjectPath}/.claude/commands/` directory exists (create if not)
4. For each workflow:
   - Render `templates/command.md.tmpl` with `{description, model, workflow_path}`
   - Write to `{userProjectPath}/.claude/commands/symphony-{id}.md`
5. Emit the entry command `symphony.md`:
   ```markdown
   ---
   description: Symphony — orchestrate your code
   model: opus
   ---
   
   Load `{project-root}/_symphony/core/engine/conductor.xml` first.
   Parse the user's goal from $ARGUMENTS and route to the appropriate workflow.
   ```
6. Return: `{ commands_generated: count, entry_command: "symphony.md" }`

### 3.2 metadata

```javascript
export const metadata = {
  id: 'claude-code',
  stub: false,
  specReference: '...',
};
```

---

## 4. Copilot Adapter

**File:** `adapters/copilot/translator.js`

### 4.1 translate(corePath, userProjectPath, options)

Same flow as Claude Code adapter, with these differences:
- Output dir: `{userProjectPath}/.github/prompts/`
- File extension: `.prompt.md`
- Entry command: `symphony.prompt.md`
- Uses `templates/command.md.tmpl` from the copilot adapter dir (has `mode: agent` instead of `model`)

### 4.2 metadata

```javascript
export const metadata = {
  id: 'copilot',
  stub: false,
  specReference: '...',
};
```

---

## 5. Testing Strategy

### 5.1 adapter-utils tests (`tests/adapter-utils.test.js`)
- `enumerateWorkflows()` with `tests/fixtures/` as corePath finds the fixture workflows (sequential-hello, ensemble-hello, wave-hello)
- `enumerateWorkflows()` returns objects with `id`, `phase`, `workflowPath` fields
- `enumerateWorkflows()` with a nonexistent path returns empty array (no throw)
- `renderTemplate()` replaces `{{variable}}` placeholders
- `renderTemplate()` handles `{{#if}}` conditional blocks

### 5.2 adapter tests (`tests/adapters.test.js`)
- Claude Code `metadata.stub` is `false`
- Copilot `metadata.stub` is `false`
- Claude Code `translate()` with fixture path produces command files (test with a temp dir)
- Copilot `translate()` with fixture path produces prompt files (test with a temp dir)
- Both produce an entry command file (symphony.md / symphony.prompt.md)
- Generated command files contain `conductor.xml` reference

---

## 6. Files Summary

| Action | File | Lines |
|---|---|---|
| Create | `lib/adapter-utils.js` | ~60 |
| Modify | `adapters/claude-code/translator.js` | ~40 |
| Modify | `adapters/copilot/translator.js` | ~40 |
| Create | `tests/adapter-utils.test.js` | ~50 |
| Create | `tests/adapters.test.js` | ~60 |

**Total: ~250 lines across 5 files**

---

## 7. Out of Scope

- CLI commands (`init`, `update`, `validate`, `status`) — Spec 8
- Obsidian vault integration — Spec 8
- Additional adapters (Gemini CLI, Cursor, etc.) — deferred
- Config file generation (CLAUDE.md / copilot-instructions.md content) — Spec 8
- End-to-end installer pipeline — Spec 8
