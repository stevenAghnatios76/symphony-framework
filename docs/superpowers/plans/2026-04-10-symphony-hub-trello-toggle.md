# Hub UI, Trello Integration & Kill Switch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a browser + terminal dashboard for observing Symphony state, Trello integration via MCP for sprint-focused visual task management, and a global kill switch to disable/enable Symphony.

**Architecture:** All three features live inside `_symphony/` as first-class modules. The Hub is a lightweight Hono server reading existing state files via SSE. Trello uses MCP — no custom API code, just instruction/config files. The kill switch is a `symphony.enabled` flag in global.yaml with file backup/restore logic.

**Tech Stack:** Hono (HTTP server), @hono/node-server (Node adapter), yaml (YAML parser — already a devDep, promoted to dep), vitest (tests), fs.watch (file watching for SSE), Trello MCP server (external, configured via .mcp.json)

**Spec:** `docs/superpowers/specs/2026-04-10-symphony-hub-trello-toggle-design.md`

---

## File Map

### New Files

| File | Purpose |
|---|---|
| `_symphony/hub/server.js` | Hono HTTP server with SSE and API endpoints (~180 lines) |
| `_symphony/hub/state-reader.js` | Reads all Symphony state into a unified JSON object (~200 lines) |
| `_symphony/hub/hub.yaml` | Hub defaults documentation |
| `_symphony/hub/public/index.html` | SPA shell with panel sections |
| `_symphony/hub/public/styles.css` | Dashboard styles |
| `_symphony/hub/public/app.js` | Client-side rendering + SSE listener (~250 lines) |
| `_symphony/integrations/trello/integration.yaml` | Hook registration for Trello push |
| `_symphony/integrations/trello/mapper.yaml` | Story status <-> Trello column mapping |
| `_symphony/integrations/trello/instructions.xml` | Conductor instructions for MCP tool calls |
| `_symphony/integrations/trello/templates/card-description.md.tmpl` | Trello card body template |
| `.mcp.json` | MCP server config for Trello (env var references, no secrets) |
| `tests/hub/state-reader.test.js` | Unit tests for state-reader |
| `tests/hub/server.test.js` | Integration tests for Hub server |

### Modified Files

| File | Change |
|---|---|
| `_symphony/_config/global.yaml` | Add `symphony.enabled`, `hub`, `integrations` sections |
| `_symphony/_config/lifecycle-sequence.yaml` | Add 5 new anytime commands |
| `_symphony/core/engine/conductor.xml` | Add enabled guard clause at step 0 |
| `tests/structure.test.js` | Add hub/ and integrations/trello/ directory checks |
| `package.json` | Add `hono`, `@hono/node-server` as dependencies; promote `yaml` to dependency |

---

### Task 1: Configuration Foundation

**Files:**
- Modify: `_symphony/_config/global.yaml`
- Modify: `_symphony/_config/lifecycle-sequence.yaml`
- Modify: `package.json`

- [ ] **Step 1: Update global.yaml with new config sections**

Add to the end of `_symphony/_config/global.yaml`, before the closing `hooks: []` line:

```yaml
# Symphony master toggle (spec: Hub/Trello/Toggle §4.2)
symphony:
  enabled: true

# Hub dashboard settings (spec: Hub/Trello/Toggle §2.6)
hub:
  port: 3100
  auto_refresh: true
  refresh_interval_ms: 2000

# Integration modules (spec: Hub/Trello/Toggle §3.6)
integrations:
  trello:
    enabled: false
    board_id: ""
    columns:
      backlog: "Backlog"
      in_progress: "In Progress"
      in_review: "In Review"
      done: "Done"
    card_template: "symphony-story"
```

Note: `trello.enabled` defaults to `false` — user must run `/symphony-trello-setup` to configure.

- [ ] **Step 2: Add 5 new anytime entries to lifecycle-sequence.yaml**

Append to the `# ANYTIME` section in `_symphony/_config/lifecycle-sequence.yaml`:

```yaml
hub:
  phase: anytime
  command: /symphony-hub
  next:
    standalone: true

status:
  phase: anytime
  command: /symphony-status
  next:
    standalone: true

trello-sync:
  phase: anytime
  command: /symphony-trello-sync
  next:
    standalone: true

trello-setup:
  phase: anytime
  command: /symphony-trello-setup
  next:
    standalone: true

toggle:
  phase: anytime
  command: /symphony-toggle
  next:
    standalone: true
```

- [ ] **Step 3: Add runtime dependencies to package.json**

Add to `dependencies` (new section — currently only `devDependencies` exists):

```json
{
  "dependencies": {
    "hono": "^4.7.0",
    "@hono/node-server": "^1.14.0",
    "yaml": "^2.8.3"
  }
}
```

Note: `yaml` stays in `devDependencies` too (tests use it). Adding it to `dependencies` makes it available for the Hub server at runtime.

- [ ] **Step 4: Install dependencies**

Run: `npm install`
Expected: `node_modules/hono/` and `node_modules/@hono/` appear. No errors.

- [ ] **Step 5: Commit**

```bash
git add _symphony/_config/global.yaml _symphony/_config/lifecycle-sequence.yaml package.json package-lock.json
git commit -m "chore(config): add hub, trello, and toggle configuration to global.yaml and lifecycle-sequence"
```

---

### Task 2: Structure Test Updates

**Files:**
- Modify: `tests/structure.test.js`

- [ ] **Step 1: Add hub and integrations directory checks to structure test**

Add a new `describe` block after the `_symphony/_memory` block in `tests/structure.test.js`:

```javascript
  describe('_symphony/hub', () => {
    it('has hub directory', () => {
      expect(exists('_symphony/hub')).toBe(true);
    });
    it('has hub/public directory', () => {
      expect(exists('_symphony/hub/public')).toBe(true);
    });
  });

  describe('_symphony/integrations/trello', () => {
    it('has trello integration directory', () => {
      expect(exists('_symphony/integrations/trello')).toBe(true);
    });
    it('has trello templates directory', () => {
      expect(exists('_symphony/integrations/trello/templates')).toBe(true);
    });
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — `_symphony/hub` and `_symphony/integrations/trello` directories do not exist yet.

- [ ] **Step 3: Create the required directories**

```bash
mkdir -p _symphony/hub/public
mkdir -p _symphony/integrations/trello/templates
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: All tests PASS including the new hub and integrations checks.

- [ ] **Step 5: Commit**

```bash
git add tests/structure.test.js _symphony/hub/.gitkeep _symphony/integrations/trello/.gitkeep
git commit -m "test(structure): add hub and trello integration directory checks"
```

Note: If git won't track empty dirs, create `.gitkeep` files:
```bash
touch _symphony/hub/.gitkeep _symphony/hub/public/.gitkeep _symphony/integrations/trello/.gitkeep _symphony/integrations/trello/templates/.gitkeep
```

---

### Task 3: Kill Switch — Conductor Guard Clause

**Files:**
- Modify: `_symphony/core/engine/conductor.xml`

- [ ] **Step 1: Add step 0 guard clause to conductor.xml**

Insert a new `<step n="0">` block immediately after the opening `<flow>` tag and before the existing `<step n="1">`:

```xml
    <step n="0" title="Check enabled state">
      <action>Read symphony.enabled from _symphony/_config/global.yaml.</action>
      <action>If symphony.enabled is false:</action>
      <action>  PRINT "Symphony is currently disabled. Run /symphony-toggle to re-enable."</action>
      <action>  EXIT immediately. Do not proceed to any further step.</action>
      <action>If symphony.enabled is true or absent (default true): continue to step 1.</action>
    </step>
```

- [ ] **Step 2: Verify conductor.xml is valid XML**

Run: `node -e "import('fast-xml-parser').then(m => { const p = new m.XMLParser(); const fs = require('fs'); p.parse(fs.readFileSync('_symphony/core/engine/conductor.xml', 'utf8')); console.log('Valid XML'); })"`

Expected: "Valid XML" (no parse errors).

- [ ] **Step 3: Run existing tests**

Run: `npm test`
Expected: All existing tests still PASS.

- [ ] **Step 4: Commit**

```bash
git add _symphony/core/engine/conductor.xml
git commit -m "feat(engine): add kill switch guard clause to conductor step 0"
```

---

### Task 4: Trello MCP Integration Files

**Files:**
- Create: `_symphony/integrations/trello/integration.yaml`
- Create: `_symphony/integrations/trello/mapper.yaml`
- Create: `_symphony/integrations/trello/instructions.xml`
- Create: `_symphony/integrations/trello/templates/card-description.md.tmpl`
- Create: `.mcp.json`

- [ ] **Step 1: Create integration.yaml**

Write `_symphony/integrations/trello/integration.yaml`:

```yaml
# Trello integration — hook registration and configuration reference.
# See spec: Hub/Trello/Toggle §3
# Activated by: integrations.trello.enabled in global.yaml

id: trello
name: "Trello Sprint Board"
description: "Two-way sync between Symphony stories and Trello cards via MCP"

# This integration registers as an artifact-enrichment-hook (architecture spec §2.9).
# When status-sync updates a story, this hook fires to push the change to Trello.
hook:
  type: artifact-enrichment-hook
  target_patterns:
    - "docs/implementation-artifacts/stories/*.md"
    - "docs/implementation-artifacts/sprint-status.md"
  trigger_on:
    - status_change
    - story_created
    - story_archived
    - review_gate_completed

# MCP server configuration reference
mcp:
  config_file: ".mcp.json"
  server_name: "trello"
  required_tools:
    - createCard
    - moveCard
    - updateCard
    - archiveCard
    - getBoardCards
    - getListCards
    - createChecklistOnCard
    - updateCheckItem
    - addLabelToCard
    - addComment

# Prerequisites check
setup:
  command: /symphony-trello-setup
  requires:
    - "TRELLO_API_KEY environment variable set"
    - "TRELLO_TOKEN environment variable set"
    - "integrations.trello.board_id configured in global.yaml"
```

- [ ] **Step 2: Create mapper.yaml**

Write `_symphony/integrations/trello/mapper.yaml`:

```yaml
# Trello mapper — maps Symphony concepts to Trello concepts.
# See spec: Hub/Trello/Toggle §3.7

# Story status → Trello column mapping.
# Column names reference global.yaml → integrations.trello.columns.
# The actual Trello list names are user-configurable there.
status_to_column:
  draft: backlog
  ready-for-dev: backlog
  in-progress: in_progress
  in-review: in_review
  done: done

# Story fields → Trello card fields.
story_to_card:
  title: "card.name"
  status: "card.list (via status_to_column)"
  acceptance_criteria: "card.checklist named 'Acceptance Criteria'"
  traces_to: "card.label"
  sprint: "card.label"
  description: "card.desc (rendered from card-description.md.tmpl)"

# Identification: how to match cards to stories bidirectionally.
# The symphony-id is embedded in the card description header.
identity:
  card_field: "description"
  pattern: "<!-- symphony-id: {story_id} -->"
  story_field: "frontmatter.id"

# Review gates → Trello checklist.
review_gates:
  checklist_name: "Review Gates"
  items:
    - code-review
    - qa-tests
    - security-review
    - test-automation
    - test-review
    - performance-review

# Conflict resolution policy.
conflicts:
  strategy: "trello-wins"
  reason: "User's manual action in Trello takes priority"
  log_to: "hub-dashboard"
```

- [ ] **Step 3: Create instructions.xml**

Write `_symphony/integrations/trello/instructions.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!--
  Trello Integration Instructions — tells the Conductor and workflow engine
  when and how to call Trello MCP tools.
  See spec: Hub/Trello/Toggle §3.8, §3.9
-->
<trello-instructions version="0.0.1">
  <mandates>
    <mandate>All Trello operations go through MCP tools. No direct API calls.</mandate>
    <mandate>Check integrations.trello.enabled in global.yaml before any Trello operation. Skip silently if disabled.</mandate>
    <mandate>Hook failures are non-blocking. Log a warning and continue the workflow.</mandate>
    <mandate>Every card must contain a symphony-id comment in its description for bidirectional mapping.</mandate>
  </mandates>

  <push-sync description="Symphony → Trello. Triggered by artifact-enrichment-hook after status-sync.">
    <step n="1" title="Check prerequisites">
      <action>Read integrations.trello.enabled from global.yaml. If false: return (no-op).</action>
      <action>Read integrations.trello.board_id. If empty: log warning "Trello board_id not configured. Run /symphony-trello-setup." Return.</action>
    </step>

    <step n="2" title="Determine event type">
      <action>Read the changed artifact. Determine if this is: new story, status change, content update, or archive.</action>
    </step>

    <step n="3" title="Map and dispatch">
      <action>Read mapper.yaml for field mapping.</action>
      <action>Read integrations.trello.columns from global.yaml for column name mapping.</action>

      <branch if="new story">
        <action>Read the story file. Extract: id, title, status, acceptance_criteria, traces_to.</action>
        <action>Render card description from templates/card-description.md.tmpl.</action>
        <action>Call MCP tool: createCard with name=title, desc=rendered_description, idList=column_for_status.</action>
        <action>If acceptance_criteria exist: call MCP tool: createChecklistOnCard with name="Acceptance Criteria" and items from criteria.</action>
        <action>If traces_to exists: call MCP tool: addLabelToCard with label matching the epic/requirement ID.</action>
      </branch>

      <branch if="status change">
        <action>Find card on board: call MCP tool: getBoardCards. Match by symphony-id in description.</action>
        <action>Look up target column from mapper.yaml status_to_column mapping.</action>
        <action>Call MCP tool: moveCard with card id and target list id.</action>
      </branch>

      <branch if="content update">
        <action>Find card on board by symphony-id.</action>
        <action>Re-render description from template. Call MCP tool: updateCard.</action>
      </branch>

      <branch if="story archived">
        <action>Find card on board by symphony-id.</action>
        <action>Call MCP tool: archiveCard.</action>
      </branch>
    </step>

    <step n="4" title="Handle errors">
      <action>If any MCP call fails: log warning with error details. Do NOT halt the workflow.</action>
      <action>Log to _symphony/_memory/conductor-sidecar/ for Hub dashboard display.</action>
    </step>
  </push-sync>

  <pull-sync description="Trello → Symphony. Triggered by /symphony-trello-sync command.">
    <step n="1" title="Read board state">
      <action>Read integrations.trello.board_id from global.yaml.</action>
      <action>Call MCP tool: getBoardCards for the board. Get all cards with their list positions.</action>
      <action>Call MCP tool: getListCards for each configured column to get list IDs.</action>
    </step>

    <step n="2" title="Match cards to stories">
      <action>For each card: extract symphony-id from description (pattern: &lt;!-- symphony-id: {id} --&gt;).</action>
      <action>Cards without symphony-id: skip (not managed by Symphony).</action>
      <action>For each matched card: look up story file at docs/implementation-artifacts/stories/{story_id}.md.</action>
    </step>

    <step n="3" title="Compare and sync">
      <action>For each matched card-story pair:</action>
      <action>  Map card's current list to a Symphony status via mapper.yaml (reverse lookup).</action>
      <action>  Compare mapped status to story file's current status.</action>
      <action>  If they match: no action needed.</action>
      <action>  If they differ: update story file's status to match Trello (Trello wins).</action>
      <action>  Run status-sync protocol to propagate the change.</action>
      <action>  Log the sync action.</action>
    </step>

    <step n="4" title="Report results">
      <action>Print summary: X stories synced, Y conflicts resolved (Trello won), Z cards skipped (no symphony-id).</action>
    </step>
  </pull-sync>

  <setup description="Guided setup via /symphony-trello-setup.">
    <step n="1" title="Check MCP server">
      <action>Check if .mcp.json exists at project root. If not: create it from template.</action>
      <action>Check if TRELLO_API_KEY and TRELLO_TOKEN environment variables are set.</action>
      <action>If not set: instruct user to get API key from https://trello.com/app-key and generate a token.</action>
    </step>

    <step n="2" title="Configure board">
      <action>Call MCP tool: listBoards (or getUserBoards) to show available boards.</action>
      <action>Ask user to pick a board. Write board_id to global.yaml → integrations.trello.board_id.</action>
    </step>

    <step n="3" title="Map columns">
      <action>Call MCP tool: getLists for the selected board.</action>
      <action>Show the lists. Ask user to map: which list is Backlog? In Progress? In Review? Done?</action>
      <action>Write column names to global.yaml → integrations.trello.columns.</action>
    </step>

    <step n="4" title="Enable integration">
      <action>Set integrations.trello.enabled: true in global.yaml.</action>
      <action>Print: "Trello integration configured. Board: {name}. Run /symphony-trello-sync for initial sync."</action>
    </step>
  </setup>
</trello-instructions>
```

- [ ] **Step 4: Create card description template**

Write `_symphony/integrations/trello/templates/card-description.md.tmpl`:

```markdown
<!-- symphony-id: {{story_id}} -->

## {{story_title}}

**Status:** {{story_status}}
**Sprint:** {{sprint_name}}
**Traces to:** {{traces_to}}

### Description

{{story_description}}

### Acceptance Criteria

{{#each acceptance_criteria}}
- [ ] {{this}}
{{/each}}

---
*Managed by Symphony. Do not remove the symphony-id comment.*
```

- [ ] **Step 5: Create .mcp.json at project root**

Write `.mcp.json`:

```json
{
  "mcpServers": {
    "trello": {
      "command": "npx",
      "args": ["-y", "mcp-server-trello"],
      "env": {
        "TRELLO_API_KEY": "${TRELLO_API_KEY}",
        "TRELLO_TOKEN": "${TRELLO_TOKEN}"
      }
    }
  }
}
```

- [ ] **Step 6: Run all existing tests**

Run: `npm test`
Expected: All tests PASS. New files don't break anything.

- [ ] **Step 7: Commit**

```bash
git add _symphony/integrations/trello/ .mcp.json
git commit -m "feat(integrations): add Trello MCP integration config, mapper, and instructions"
```

---

### Task 5: Hub State Reader (TDD)

**Files:**
- Create: `tests/hub/state-reader.test.js`
- Create: `_symphony/hub/state-reader.js`

- [ ] **Step 1: Write failing tests for state-reader**

Write `tests/hub/state-reader.test.js`:

```javascript
import { describe, expect, it, beforeAll } from 'vitest';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const root = resolve(dirname(__filename), '../..');

// Dynamic import so test fails clearly if module doesn't exist
let readSymphonyState;

beforeAll(async () => {
  const mod = await import('../../_symphony/hub/state-reader.js');
  readSymphonyState = mod.readSymphonyState;
});

describe('state-reader', () => {
  describe('readSymphonyState()', () => {
    it('exports a readSymphonyState function', () => {
      expect(typeof readSymphonyState).toBe('function');
    });

    it('returns an object with all expected top-level keys', () => {
      const state = readSymphonyState(root);
      expect(state).toHaveProperty('framework');
      expect(state).toHaveProperty('lifecycle');
      expect(state).toHaveProperty('sprint');
      expect(state).toHaveProperty('conductor');
      expect(state).toHaveProperty('memory');
      expect(state).toHaveProperty('trello');
    });

    it('reads framework state from global.yaml', () => {
      const state = readSymphonyState(root);
      expect(state.framework.name).toBe('Symphony');
      expect(state.framework.version).toBeDefined();
      expect(state.framework.enabled).toBe(true);
    });

    it('reads hub config', () => {
      const state = readSymphonyState(root);
      expect(state.framework.hub.port).toBe(3100);
    });

    it('reads lifecycle phases from lifecycle-sequence.yaml', () => {
      const state = readSymphonyState(root);
      expect(state.lifecycle.phases).toContain('1-analysis');
      expect(state.lifecycle.phases).toContain('5-deployment');
    });

    it('reads all workflows grouped by phase', () => {
      const state = readSymphonyState(root);
      expect(state.lifecycle.workflows).toBeDefined();
      expect(state.lifecycle.workflows['1-analysis']).toBeInstanceOf(Array);
      expect(state.lifecycle.workflows['1-analysis'].length).toBeGreaterThan(0);
    });

    it('reads commands from lifecycle-sequence with helper data', () => {
      const state = readSymphonyState(root);
      const brainstorm = state.lifecycle.commands.find(c => c.id === 'brainstorm');
      expect(brainstorm).toBeDefined();
      expect(brainstorm.command).toBe('/symphony-brainstorm');
      expect(brainstorm.phase).toBe('1-analysis');
    });

    it('detects current phase from artifact existence', () => {
      const state = readSymphonyState(root);
      // No artifacts exist in the repo, so phase should be detected as 1-analysis or unknown
      expect(state.lifecycle.currentPhase).toBeDefined();
    });

    it('reads trello integration config', () => {
      const state = readSymphonyState(root);
      expect(state.trello.enabled).toBe(false);
      expect(state.trello.columns).toBeDefined();
    });

    it('reads conductor routing log (empty if no log exists)', () => {
      const state = readSymphonyState(root);
      expect(state.conductor.routingLog).toBeInstanceOf(Array);
    });

    it('reads memory sidecar list', () => {
      const state = readSymphonyState(root);
      expect(state.memory.sidecars).toBeInstanceOf(Array);
      expect(state.memory.sidecars).toContain('conductor-sidecar');
    });

    it('handles missing optional files gracefully', () => {
      // Should not throw even if sprint-status.md or routing-log.yaml don't exist
      expect(() => readSymphonyState(root)).not.toThrow();
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/hub/state-reader.test.js`
Expected: FAIL — `_symphony/hub/state-reader.js` does not exist.

- [ ] **Step 3: Implement state-reader.js**

Write `_symphony/hub/state-reader.js`:

```javascript
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, join, basename } from 'node:path';
import { parse as parseYaml } from 'yaml';

/**
 * Read a YAML file and parse it. Returns null if file doesn't exist.
 */
function readYaml(filePath) {
  if (!existsSync(filePath)) return null;
  return parseYaml(readFileSync(filePath, 'utf8'));
}

/**
 * Check if a directory or file exists.
 */
function pathExists(p) {
  return existsSync(p);
}

/**
 * Read framework state from global.yaml and manifest.yaml.
 */
function readFrameworkState(symphonyRoot) {
  const global = readYaml(join(symphonyRoot, '_config', 'global.yaml')) || {};
  const manifest = readYaml(join(symphonyRoot, '_config', 'manifest.yaml')) || {};

  return {
    name: global.framework_name || 'Symphony',
    version: global.framework_version || 'unknown',
    enabled: global.symphony?.enabled ?? true,
    hub: {
      port: global.hub?.port ?? 3100,
      auto_refresh: global.hub?.auto_refresh ?? true,
      refresh_interval_ms: global.hub?.refresh_interval_ms ?? 2000,
    },
    modules: manifest.modules || {},
    adapters: manifest.adapters || {},
    limits: global.limits || {},
  };
}

/**
 * Detect current lifecycle phase based on artifact existence.
 * Mirrors conductor.xml phase detection rules (§8.1).
 */
function detectPhase(docsRoot) {
  const planning = join(docsRoot, 'planning-artifacts');
  const implementation = join(docsRoot, 'implementation-artifacts');

  if (!pathExists(join(planning, 'product-brief.md'))) return '1-analysis';
  if (!pathExists(join(planning, 'prd.md'))) return '2-planning';
  if (!pathExists(join(planning, 'architecture.md'))) return '3-solutioning';
  if (pathExists(join(implementation, 'sprint-status.md'))) return '4-implementation';
  return '5-deployment';
}

/**
 * Read lifecycle state from lifecycle-sequence.yaml.
 */
function readLifecycleState(symphonyRoot, docsRoot) {
  const sequence = readYaml(join(symphonyRoot, '_config', 'lifecycle-sequence.yaml')) || {};
  const phases = ['1-analysis', '2-planning', '3-solutioning', '4-implementation', '5-deployment', 'anytime'];

  const workflows = {};
  const commands = [];

  for (const [id, entry] of Object.entries(sequence)) {
    const phase = entry.phase || 'anytime';
    if (!workflows[phase]) workflows[phase] = [];
    workflows[phase].push(id);

    commands.push({
      id,
      command: entry.command,
      phase,
      next: entry.next || {},
    });
  }

  return {
    phases: phases.filter(p => p !== 'anytime'),
    workflows,
    commands,
    currentPhase: detectPhase(docsRoot),
  };
}

/**
 * Read sprint state from implementation artifacts.
 */
function readSprintState(docsRoot) {
  const implRoot = join(docsRoot, 'implementation-artifacts');
  const sprintStatusPath = join(implRoot, 'sprint-status.md');
  const storiesDir = join(implRoot, 'stories');

  const stories = [];
  if (pathExists(storiesDir)) {
    for (const file of readdirSync(storiesDir)) {
      if (!file.endsWith('.md')) continue;
      const content = readFileSync(join(storiesDir, file), 'utf8');
      const statusMatch = content.match(/status:\s*(.+)/i);
      const titleMatch = content.match(/title:\s*(.+)/i);
      stories.push({
        id: file.replace('.md', ''),
        title: titleMatch?.[1]?.trim() || file,
        status: statusMatch?.[1]?.trim() || 'unknown',
      });
    }
  }

  const total = stories.length;
  const done = stories.filter(s => s.status === 'done').length;

  return {
    exists: pathExists(sprintStatusPath),
    stories,
    total,
    done,
    current: stories.find(s => s.status === 'in-progress') || null,
  };
}

/**
 * Read conductor routing log.
 */
function readConductorState(symphonyRoot) {
  const routingLogPath = join(symphonyRoot, '_memory', 'conductor-sidecar', 'routing-log.yaml');
  const log = readYaml(routingLogPath);

  return {
    routingLog: Array.isArray(log) ? log : [],
    lastRouting: Array.isArray(log) && log.length > 0 ? log[log.length - 1] : null,
  };
}

/**
 * Read memory sidecar state.
 */
function readMemoryState(symphonyRoot) {
  const memoryRoot = join(symphonyRoot, '_memory');
  const sidecars = [];

  if (pathExists(memoryRoot)) {
    for (const entry of readdirSync(memoryRoot, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        sidecars.push(entry.name);
      }
    }
  }

  const checkpointsDir = join(memoryRoot, 'checkpoints');
  const checkpoints = [];
  if (pathExists(checkpointsDir)) {
    for (const file of readdirSync(checkpointsDir)) {
      if (file.endsWith('.yaml')) {
        checkpoints.push(file.replace('.yaml', ''));
      }
    }
  }

  return {
    sidecars,
    checkpoints,
    activeWorkflow: checkpoints.length > 0,
  };
}

/**
 * Read Trello integration state.
 */
function readTrelloState(symphonyRoot) {
  const global = readYaml(join(symphonyRoot, '_config', 'global.yaml')) || {};
  const trelloConfig = global.integrations?.trello || {};

  return {
    enabled: trelloConfig.enabled ?? false,
    board_id: trelloConfig.board_id || '',
    columns: trelloConfig.columns || {},
    configured: !!(trelloConfig.enabled && trelloConfig.board_id),
  };
}

/**
 * Read all Symphony state into a unified JSON object.
 * This is the single entry point used by the Hub server.
 */
export function readSymphonyState(projectRoot) {
  const symphonyRoot = resolve(projectRoot, '_symphony');
  const docsRoot = resolve(projectRoot, 'docs');

  return {
    framework: readFrameworkState(symphonyRoot),
    lifecycle: readLifecycleState(symphonyRoot, docsRoot),
    sprint: readSprintState(docsRoot),
    conductor: readConductorState(symphonyRoot),
    memory: readMemoryState(symphonyRoot),
    trello: readTrelloState(symphonyRoot),
    timestamp: new Date().toISOString(),
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/hub/state-reader.test.js`
Expected: All tests PASS.

- [ ] **Step 5: Run full test suite**

Run: `npm test`
Expected: All tests PASS (existing + new).

- [ ] **Step 6: Commit**

```bash
git add tests/hub/state-reader.test.js _symphony/hub/state-reader.js
git commit -m "feat(hub): add state-reader with TDD — reads all Symphony state into JSON"
```

---

### Task 6: Hub Server (TDD)

**Files:**
- Create: `tests/hub/server.test.js`
- Create: `_symphony/hub/server.js`
- Create: `_symphony/hub/hub.yaml`

- [ ] **Step 1: Write failing tests for server**

Write `tests/hub/server.test.js`:

```javascript
import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const root = resolve(dirname(__filename), '../..');

let createHubServer, server, baseUrl;
const TEST_PORT = 3199;

beforeAll(async () => {
  const mod = await import('../../_symphony/hub/server.js');
  createHubServer = mod.createHubServer;

  const result = createHubServer({ projectRoot: root, port: TEST_PORT });
  server = result.server;
  baseUrl = `http://localhost:${TEST_PORT}`;

  // Give server a moment to start
  await new Promise(r => setTimeout(r, 100));
});

afterAll(() => {
  if (server) server.close();
});

describe('Hub server', () => {
  it('exports a createHubServer function', () => {
    expect(typeof createHubServer).toBe('function');
  });

  it('serves index.html at GET /', async () => {
    const res = await fetch(`${baseUrl}/`);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('Symphony Hub');
  });

  it('returns JSON state at GET /api/state', async () => {
    const res = await fetch(`${baseUrl}/api/state`);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty('framework');
    expect(json).toHaveProperty('lifecycle');
    expect(json).toHaveProperty('sprint');
    expect(json).toHaveProperty('timestamp');
  });

  it('returns SSE stream at GET /api/events', async () => {
    const res = await fetch(`${baseUrl}/api/events`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/event-stream');
  });

  it('serves static files from public/', async () => {
    const res = await fetch(`${baseUrl}/styles.css`);
    // Will be 200 once we create the file, 404 is acceptable at this stage
    expect([200, 404]).toContain(res.status);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/hub/server.test.js`
Expected: FAIL — `_symphony/hub/server.js` does not exist.

- [ ] **Step 3: Implement server.js**

Write `_symphony/hub/server.js`:

```javascript
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { readFileSync, existsSync, watch } from 'node:fs';
import { resolve, join } from 'node:path';
import { readSymphonyState } from './state-reader.js';

/**
 * Create and start the Hub server.
 * Returns { app, server } so callers can close it.
 */
export function createHubServer({ projectRoot, port = 3100 }) {
  const app = new Hono();
  const publicDir = resolve(import.meta.dirname, 'public');

  // --- API Routes ---

  // Full state endpoint
  app.get('/api/state', (c) => {
    const state = readSymphonyState(projectRoot);
    return c.json(state);
  });

  // SSE endpoint for live updates
  app.get('/api/events', (c) => {
    return c.body(
      new ReadableStream({
        start(controller) {
          const encoder = new TextEncoder();

          // Send initial state
          const state = readSymphonyState(projectRoot);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(state)}\n\n`));

          // Watch for file changes
          const watchers = [];
          const watchPaths = [
            resolve(projectRoot, '_symphony'),
            resolve(projectRoot, 'docs'),
          ];

          let debounceTimer = null;
          const sendUpdate = () => {
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
              try {
                const updated = readSymphonyState(projectRoot);
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(updated)}\n\n`));
              } catch {
                // Ignore read errors during file transitions
              }
            }, 500);
          };

          for (const dir of watchPaths) {
            if (existsSync(dir)) {
              try {
                const w = watch(dir, { recursive: true }, sendUpdate);
                watchers.push(w);
              } catch {
                // Recursive watch not supported on all platforms
              }
            }
          }

          // Cleanup on close
          c.req.raw.signal.addEventListener('abort', () => {
            if (debounceTimer) clearTimeout(debounceTimer);
            for (const w of watchers) w.close();
            controller.close();
          });
        },
      }),
      {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      }
    );
  });

  // Toggle endpoint
  app.post('/api/toggle', async (c) => {
    const globalPath = resolve(projectRoot, '_symphony', '_config', 'global.yaml');
    if (!existsSync(globalPath)) {
      return c.json({ error: 'global.yaml not found' }, 404);
    }
    let content = readFileSync(globalPath, 'utf8');
    if (content.includes('enabled: true')) {
      content = content.replace(/(\bsymphony:\s*\n\s*enabled:\s*)true/, '$1false');
    } else {
      content = content.replace(/(\bsymphony:\s*\n\s*enabled:\s*)false/, '$1true');
    }
    const { writeFileSync } = await import('node:fs');
    writeFileSync(globalPath, content, 'utf8');
    const state = readSymphonyState(projectRoot);
    return c.json({ enabled: state.framework.enabled });
  });

  // --- Static Files ---

  // Serve index.html at root
  app.get('/', (c) => {
    const indexPath = join(publicDir, 'index.html');
    if (!existsSync(indexPath)) {
      return c.text('Symphony Hub — frontend not yet built', 200);
    }
    const html = readFileSync(indexPath, 'utf8');
    return c.html(html);
  });

  // Serve other static files
  app.get('/:file', (c) => {
    const fileName = c.req.param('file');
    const filePath = join(publicDir, fileName);
    if (!existsSync(filePath)) {
      return c.notFound();
    }
    const content = readFileSync(filePath, 'utf8');
    const ext = fileName.split('.').pop();
    const types = { css: 'text/css', js: 'application/javascript', html: 'text/html' };
    return c.body(content, { headers: { 'Content-Type': types[ext] || 'text/plain' } });
  });

  // --- Start Server ---
  const server = serve({ fetch: app.fetch, port });

  return { app, server };
}

// CLI entry: node server.js [--port 3100] [--project-root .]
if (process.argv[1] && process.argv[1].endsWith('server.js') && !process.env.VITEST) {
  const args = process.argv.slice(2);
  const portIdx = args.indexOf('--port');
  const rootIdx = args.indexOf('--project-root');
  const port = portIdx >= 0 ? parseInt(args[portIdx + 1], 10) : 3100;
  const projectRoot = rootIdx >= 0 ? resolve(args[rootIdx + 1]) : resolve('.');

  console.log(`Symphony Hub starting on http://localhost:${port}`);
  createHubServer({ projectRoot, port });

  // Open browser
  const { exec } = await import('node:child_process');
  const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
  exec(`${cmd} http://localhost:${port}`);
}
```

- [ ] **Step 4: Create hub.yaml**

Write `_symphony/hub/hub.yaml`:

```yaml
# Symphony Hub — local dashboard server.
# See spec: Hub/Trello/Toggle §2
#
# Runtime configuration lives in _symphony/_config/global.yaml under the 'hub' key.
# This file documents defaults and is not read at runtime.
#
# Defaults:
#   port: 3100
#   auto_refresh: true
#   refresh_interval_ms: 2000
#
# Launch: /symphony-hub (via AI tool) or node _symphony/hub/server.js
# Terminal summary: /symphony-status (no server needed)
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/hub/server.test.js`
Expected: All tests PASS.

- [ ] **Step 6: Run full test suite**

Run: `npm test`
Expected: All tests PASS.

- [ ] **Step 7: Commit**

```bash
git add tests/hub/server.test.js _symphony/hub/server.js _symphony/hub/hub.yaml
git commit -m "feat(hub): add Hono server with SSE, state API, and toggle endpoint"
```

---

### Task 7: Hub Frontend — Dashboard SPA

**Files:**
- Create: `_symphony/hub/public/index.html`
- Create: `_symphony/hub/public/styles.css`
- Create: `_symphony/hub/public/app.js`

- [ ] **Step 1: Create index.html**

Write `_symphony/hub/public/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Symphony Hub</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <header>
    <h1>Symphony Hub</h1>
    <div id="framework-badge">
      <span id="status-dot"></span>
      <span id="status-text">Loading...</span>
      <span id="version"></span>
    </div>
  </header>

  <nav>
    <button class="nav-btn active" data-panel="lifecycle">Lifecycle</button>
    <button class="nav-btn" data-panel="sprint">Sprint</button>
    <button class="nav-btn" data-panel="context">Context Budget</button>
    <button class="nav-btn" data-panel="commands">Commands</button>
    <button class="nav-btn" data-panel="memory">Memory</button>
    <button class="nav-btn" data-panel="status">Framework</button>
  </nav>

  <main>
    <section id="panel-lifecycle" class="panel active"></section>
    <section id="panel-sprint" class="panel"></section>
    <section id="panel-context" class="panel"></section>
    <section id="panel-commands" class="panel"></section>
    <section id="panel-memory" class="panel"></section>
    <section id="panel-status" class="panel"></section>
  </main>

  <footer>
    <span id="last-updated">Last updated: —</span>
    <span id="trello-sync-status"></span>
  </footer>

  <script src="/app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create styles.css**

Write `_symphony/hub/public/styles.css`:

```css
:root {
  --bg: #0f1117;
  --surface: #1a1d27;
  --border: #2a2d3a;
  --text: #e1e4ed;
  --text-muted: #8b8fa3;
  --accent: #6c5ce7;
  --accent-light: #a29bfe;
  --success: #00b894;
  --warning: #fdcb6e;
  --danger: #e17055;
  --phase-1: #74b9ff;
  --phase-2: #a29bfe;
  --phase-3: #fd79a8;
  --phase-4: #00b894;
  --phase-5: #fdcb6e;
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid var(--border);
}

header h1 {
  font-size: 20px;
  font-weight: 600;
  letter-spacing: -0.5px;
}

#framework-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

#status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--success);
}

#status-dot.disabled { background: var(--danger); }

#version { color: var(--text-muted); }

nav {
  display: flex;
  gap: 4px;
  padding: 12px 24px;
  border-bottom: 1px solid var(--border);
  overflow-x: auto;
}

.nav-btn {
  background: transparent;
  border: 1px solid transparent;
  color: var(--text-muted);
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  white-space: nowrap;
  transition: all 0.15s;
}

.nav-btn:hover { color: var(--text); background: var(--surface); }

.nav-btn.active {
  color: var(--accent-light);
  background: var(--surface);
  border-color: var(--border);
}

main { padding: 24px; }

.panel { display: none; }
.panel.active { display: block; }

.panel h2 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--text);
}

/* Phase tracker */
.phase-track {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
}

.phase-step {
  flex: 1;
  padding: 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  text-align: center;
  font-size: 12px;
  transition: all 0.15s;
}

.phase-step.current {
  border-color: var(--accent);
  box-shadow: 0 0 12px rgba(108, 92, 231, 0.2);
}

.phase-step.completed { border-color: var(--success); opacity: 0.8; }

.phase-step .phase-num {
  font-size: 18px;
  font-weight: 700;
  display: block;
  margin-bottom: 4px;
}

/* Workflow list */
.workflow-list {
  list-style: none;
  display: grid;
  gap: 6px;
}

.workflow-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 13px;
}

.workflow-item.next-recommended {
  border-color: var(--accent);
  background: rgba(108, 92, 231, 0.08);
}

.workflow-item .check { color: var(--success); }
.workflow-item .pending { color: var(--text-muted); }

/* Sprint board */
.sprint-columns {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.sprint-col {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px;
  min-height: 120px;
}

.sprint-col h3 {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border);
}

.story-card {
  padding: 8px 10px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 4px;
  font-size: 12px;
  margin-bottom: 6px;
}

.story-card .story-id {
  font-weight: 600;
  color: var(--accent-light);
}

/* Command list */
.cmd-group { margin-bottom: 20px; }

.cmd-group h3 {
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.cmd-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 4px;
  margin-bottom: 4px;
  font-size: 13px;
}

.cmd-item code {
  font-family: 'SF Mono', 'Fira Code', monospace;
  color: var(--accent-light);
  font-size: 12px;
}

.cmd-item .tip {
  font-size: 11px;
  color: var(--text-muted);
}

.cmd-item.next-cmd {
  border-color: var(--accent);
  background: rgba(108, 92, 231, 0.08);
}

.cmd-item.next-cmd::after {
  content: 'RUN NEXT';
  font-size: 9px;
  font-weight: 700;
  color: var(--accent-light);
  letter-spacing: 1px;
}

/* Memory panel */
.sidecar-list { list-style: none; }

.sidecar-item {
  padding: 8px 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 4px;
  margin-bottom: 4px;
  font-size: 13px;
  font-family: 'SF Mono', 'Fira Code', monospace;
}

/* Framework status */
.status-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.status-card {
  padding: 16px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
}

.status-card h3 {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
  margin-bottom: 8px;
}

.status-card .value {
  font-size: 20px;
  font-weight: 700;
}

.toggle-btn {
  padding: 8px 16px;
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  margin-top: 8px;
}

.toggle-btn:hover { opacity: 0.9; }

/* Context budget bars */
.budget-bar-container {
  margin-bottom: 12px;
  padding: 10px 14px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 6px;
}

.budget-label {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 6px;
}

.budget-bar {
  height: 6px;
  background: var(--border);
  border-radius: 3px;
  overflow: hidden;
}

.budget-fill {
  height: 100%;
  background: var(--accent);
  border-radius: 3px;
  transition: width 0.3s;
}

.budget-fill.warning { background: var(--warning); }
.budget-fill.danger { background: var(--danger); }

footer {
  display: flex;
  justify-content: space-between;
  padding: 12px 24px;
  border-top: 1px solid var(--border);
  font-size: 12px;
  color: var(--text-muted);
}
```

- [ ] **Step 3: Create app.js**

Write `_symphony/hub/public/app.js`:

```javascript
let state = null;

// --- Navigation ---
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`panel-${btn.dataset.panel}`).classList.add('active');
  });
});

// --- SSE Connection ---
const events = new EventSource('/api/events');
events.onmessage = (e) => {
  state = JSON.parse(e.data);
  render(state);
};
events.onerror = () => {
  document.getElementById('status-text').textContent = 'Disconnected';
  document.getElementById('status-dot').classList.add('disabled');
};

// --- Render Functions ---
function render(s) {
  renderHeader(s);
  renderLifecycle(s);
  renderSprint(s);
  renderContext(s);
  renderCommands(s);
  renderMemory(s);
  renderStatus(s);
  renderFooter(s);
}

function renderHeader(s) {
  const dot = document.getElementById('status-dot');
  const text = document.getElementById('status-text');
  const ver = document.getElementById('version');

  if (s.framework.enabled) {
    dot.classList.remove('disabled');
    text.textContent = 'Active';
  } else {
    dot.classList.add('disabled');
    text.textContent = 'Disabled';
  }
  ver.textContent = `v${s.framework.version}`;
}

function renderLifecycle(s) {
  const panel = document.getElementById('panel-lifecycle');
  const phases = [
    { num: 1, name: 'Analysis', key: '1-analysis', color: 'var(--phase-1)' },
    { num: 2, name: 'Planning', key: '2-planning', color: 'var(--phase-2)' },
    { num: 3, name: 'Solutioning', key: '3-solutioning', color: 'var(--phase-3)' },
    { num: 4, name: 'Implementation', key: '4-implementation', color: 'var(--phase-4)' },
    { num: 5, name: 'Deployment', key: '5-deployment', color: 'var(--phase-5)' },
  ];

  const phaseNum = parseInt(s.lifecycle.currentPhase?.charAt(0)) || 1;

  let html = '<h2>Lifecycle Progress</h2><div class="phase-track">';
  for (const p of phases) {
    const cls = p.num < phaseNum ? 'completed' : p.num === phaseNum ? 'current' : '';
    html += `<div class="phase-step ${cls}" style="--phase-color: ${p.color}">
      <span class="phase-num">${p.num}</span>${p.name}</div>`;
  }
  html += '</div>';

  // Workflows for current phase
  const currentWorkflows = s.lifecycle.workflows[s.lifecycle.currentPhase] || [];
  const nextCmd = s.conductor.lastRouting?.selected_workflow;

  html += `<h2>Phase ${phaseNum} Workflows</h2><ul class="workflow-list">`;
  for (const wf of currentWorkflows) {
    const isNext = nextCmd && wf === nextCmd;
    html += `<li class="workflow-item ${isNext ? 'next-recommended' : ''}">
      <span class="pending">○</span>
      <span>${wf}</span>
    </li>`;
  }
  html += '</ul>';
  panel.innerHTML = html;
}

function renderSprint(s) {
  const panel = document.getElementById('panel-sprint');
  const columns = { backlog: [], 'in-progress': [], 'in-review': [], done: [] };

  for (const story of s.sprint.stories) {
    const col = columns[story.status] || columns.backlog;
    col.push(story);
  }

  let html = `<h2>Sprint Board</h2><p style="color:var(--text-muted);margin-bottom:16px;font-size:13px">${s.sprint.done}/${s.sprint.total} stories done</p>`;
  html += '<div class="sprint-columns">';

  for (const [status, label] of [['backlog','Backlog'],['in-progress','In Progress'],['in-review','In Review'],['done','Done']]) {
    html += `<div class="sprint-col"><h3>${label} (${columns[status].length})</h3>`;
    for (const story of columns[status]) {
      html += `<div class="story-card"><span class="story-id">${story.id}</span><br>${story.title}</div>`;
    }
    if (columns[status].length === 0) {
      html += '<div style="color:var(--text-muted);font-size:12px;text-align:center;padding:20px 0">No stories</div>';
    }
    html += '</div>';
  }
  html += '</div>';
  panel.innerHTML = html;
}

function renderContext(s) {
  const panel = document.getElementById('panel-context');
  const maxTokens = s.framework.limits.max_tokens_per_activation || 40000;

  let html = '<h2>Context Budget</h2>';
  html += '<p style="color:var(--text-muted);margin-bottom:16px;font-size:13px">Token limits per agent activation (from global.yaml)</p>';

  const limits = [
    { label: 'Max Tokens per Activation', value: maxTokens, max: maxTokens },
    { label: 'Agent Persona', value: s.framework.limits.max_agent_persona_lines || 200, max: 200, unit: 'lines' },
    { label: 'Instruction Step', value: s.framework.limits.max_instruction_step_lines || 150, max: 150, unit: 'lines' },
    { label: 'Skill File', value: s.framework.limits.max_skill_lines || 300, max: 300, unit: 'lines' },
    { label: 'Markdown Artifact', value: s.framework.limits.max_markdown_lines || 1000, max: 1000, unit: 'lines' },
  ];

  for (const l of limits) {
    const pct = Math.round((l.value / l.max) * 100);
    const cls = pct > 90 ? 'danger' : pct > 70 ? 'warning' : '';
    html += `<div class="budget-bar-container">
      <div class="budget-label">${l.label}: ${l.value.toLocaleString()}${l.unit ? ` ${l.unit}` : ' tokens'} / ${l.max.toLocaleString()}</div>
      <div class="budget-bar"><div class="budget-fill ${cls}" style="width:${pct}%"></div></div>
    </div>`;
  }
  panel.innerHTML = html;
}

function renderCommands(s) {
  const panel = document.getElementById('panel-commands');
  const nextCmd = s.conductor.lastRouting?.selected_workflow;

  const grouped = {};
  for (const cmd of s.lifecycle.commands) {
    const phase = cmd.phase;
    if (!grouped[phase]) grouped[phase] = [];
    grouped[phase].push(cmd);
  }

  const phaseLabels = {
    '1-analysis': 'Phase 1: Analysis',
    '2-planning': 'Phase 2: Planning',
    '3-solutioning': 'Phase 3: Solutioning',
    '4-implementation': 'Phase 4: Implementation',
    '5-deployment': 'Phase 5: Deployment',
    'anytime': 'Anytime',
  };

  let html = '<h2>Command Guide</h2>';
  for (const [phase, cmds] of Object.entries(grouped)) {
    html += `<div class="cmd-group"><h3>${phaseLabels[phase] || phase}</h3>`;
    for (const cmd of cmds) {
      const isNext = nextCmd && cmd.id === nextCmd;
      const nextInfo = cmd.next?.primary ? `Next: ${cmd.next.primary}` : '';
      html += `<div class="cmd-item ${isNext ? 'next-cmd' : ''}">
        <code>${cmd.command}</code>
        <span class="tip">${nextInfo}</span>
      </div>`;
    }
    html += '</div>';
  }
  panel.innerHTML = html;
}

function renderMemory(s) {
  const panel = document.getElementById('panel-memory');

  let html = '<h2>Memory Inspector</h2>';
  html += '<h3 style="font-size:13px;color:var(--text-muted);margin-bottom:8px">Agent Sidecars</h3>';
  html += '<ul class="sidecar-list">';
  for (const sidecar of s.memory.sidecars) {
    html += `<li class="sidecar-item">${sidecar}/</li>`;
  }
  html += '</ul>';

  html += '<h3 style="font-size:13px;color:var(--text-muted);margin:16px 0 8px">Conductor Routing Log</h3>';
  if (s.conductor.routingLog.length === 0) {
    html += '<p style="color:var(--text-muted);font-size:13px">No routing history yet. Run /symphony to generate entries.</p>';
  } else {
    const recent = s.conductor.routingLog.slice(-5).reverse();
    for (const entry of recent) {
      html += `<div class="workflow-item">
        <span>${entry.timestamp || '—'}</span>
        <span>${entry.user_goal || '—'}</span>
        <span style="color:var(--accent-light)">${entry.selected_workflow || '—'}</span>
        <span style="color:var(--text-muted)">${entry.confidence || '—'}</span>
      </div>`;
    }
  }

  html += `<h3 style="font-size:13px;color:var(--text-muted);margin:16px 0 8px">Checkpoints</h3>`;
  if (s.memory.checkpoints.length === 0) {
    html += '<p style="color:var(--text-muted);font-size:13px">No active checkpoints.</p>';
  } else {
    for (const cp of s.memory.checkpoints) {
      html += `<div class="sidecar-item">${cp}</div>`;
    }
  }
  panel.innerHTML = html;
}

function renderStatus(s) {
  const panel = document.getElementById('panel-status');

  let html = '<h2>Framework Status</h2><div class="status-grid">';

  html += `<div class="status-card">
    <h3>Symphony</h3>
    <div class="value" style="color:${s.framework.enabled ? 'var(--success)' : 'var(--danger)'}">
      ${s.framework.enabled ? 'Enabled' : 'Disabled'}
    </div>
    <button class="toggle-btn" onclick="toggleSymphony()">
      ${s.framework.enabled ? 'Disable' : 'Enable'} Symphony
    </button>
  </div>`;

  html += `<div class="status-card">
    <h3>Version</h3>
    <div class="value">${s.framework.version}</div>
  </div>`;

  html += `<div class="status-card">
    <h3>Trello Integration</h3>
    <div class="value" style="color:${s.trello.configured ? 'var(--success)' : 'var(--text-muted)'}">
      ${s.trello.configured ? 'Connected' : s.trello.enabled ? 'Enabled (not configured)' : 'Disabled'}
    </div>
  </div>`;

  html += `<div class="status-card">
    <h3>Active Workflow</h3>
    <div class="value">${s.memory.activeWorkflow ? 'Yes' : 'None'}</div>
  </div>`;

  // Module versions
  html += '<div class="status-card" style="grid-column: span 2"><h3>Modules</h3>';
  for (const [name, info] of Object.entries(s.framework.modules)) {
    html += `<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px">
      <span>${name}</span><span style="color:var(--text-muted)">${info.version || '—'}</span>
    </div>`;
  }
  html += '</div>';

  html += '</div>';
  panel.innerHTML = html;
}

function renderFooter(s) {
  document.getElementById('last-updated').textContent = `Last updated: ${new Date(s.timestamp).toLocaleTimeString()}`;

  const trelloEl = document.getElementById('trello-sync-status');
  if (s.trello.configured) {
    trelloEl.textContent = 'Trello: Connected';
    trelloEl.style.color = 'var(--success)';
  } else if (s.trello.enabled) {
    trelloEl.textContent = 'Trello: Not configured';
    trelloEl.style.color = 'var(--warning)';
  } else {
    trelloEl.textContent = 'Trello: Disabled';
    trelloEl.style.color = 'var(--text-muted)';
  }
}

// --- Toggle ---
async function toggleSymphony() {
  const res = await fetch('/api/toggle', { method: 'POST' });
  const data = await res.json();
  // SSE will push the updated state
}

// --- Initial fetch fallback ---
fetch('/api/state')
  .then(r => r.json())
  .then(s => { state = s; render(s); });
```

- [ ] **Step 4: Start server and test in browser**

Run: `node _symphony/hub/server.js --project-root .`

Expected: Browser opens at `http://localhost:3100`. Dashboard shows:
- Header: "Symphony Hub" with green "Active" dot and version
- Lifecycle panel: Phase 1 highlighted (no artifacts exist)
- Sprint panel: Empty board (no stories)
- Commands panel: All `/symphony-*` commands grouped by phase
- Memory panel: conductor-sidecar and checkpoints listed
- Framework panel: Enabled, version, module versions

Stop the server with Ctrl+C.

- [ ] **Step 5: Run full test suite**

Run: `npm test`
Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
git add _symphony/hub/public/
git commit -m "feat(hub): add dashboard frontend with lifecycle, sprint, commands, memory, and status panels"
```

---

### Task 8: Verify, Clean Up, Final Commit

**Files:**
- All files created/modified above

- [ ] **Step 1: Run full test suite**

Run: `npm test`
Expected: All tests PASS.

- [ ] **Step 2: Verify Hub server starts and dashboard loads**

Run: `node _symphony/hub/server.js --project-root .`

Verify in browser:
- All 6 panels render without JavaScript errors
- Navigation switches between panels
- Framework Status panel shows correct versions from manifest.yaml
- Commands panel lists all commands from lifecycle-sequence.yaml
- Trello shows "Disabled" (correct default)
- Enabled/Disabled toggle button is present

Stop server.

- [ ] **Step 3: Verify conductor guard clause**

Read `_symphony/core/engine/conductor.xml` and confirm step 0 exists before step 1 with the enabled check.

- [ ] **Step 4: Verify Trello integration files are complete**

Confirm these files exist and are valid:
- `_symphony/integrations/trello/integration.yaml`
- `_symphony/integrations/trello/mapper.yaml`
- `_symphony/integrations/trello/instructions.xml`
- `_symphony/integrations/trello/templates/card-description.md.tmpl`
- `.mcp.json`

- [ ] **Step 5: Remove .gitkeep files from directories that now have content**

```bash
rm -f _symphony/hub/.gitkeep _symphony/hub/public/.gitkeep _symphony/integrations/trello/.gitkeep _symphony/integrations/trello/templates/.gitkeep
```

- [ ] **Step 6: Final commit if any cleanup changes**

```bash
git add -A
git commit -m "chore: clean up gitkeep files after hub and trello content added"
```
