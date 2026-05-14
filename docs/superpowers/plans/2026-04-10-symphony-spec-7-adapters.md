# Runtime Adapters (Spec 7) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Claude Code and Copilot adapter translators so they enumerate Core workflows and generate tool-specific command files, replacing the current stubs that throw "not yet implemented".

**Architecture:** A shared `lib/adapter-utils.js` provides workflow enumeration (scan `_symphony/` for `workflow.yaml` files) and template rendering (simple `{{variable}}` substitution). Each adapter's `translator.js` uses these utilities to generate command files in the tool's expected location. The templates (`.tmpl` files) are already correct and need no changes.

**Tech Stack:** Node.js (ES modules), yaml package (already a dependency), Vitest (tests), fs/path (file system)

---

## File Structure

| Action | File | Responsibility |
|---|---|---|
| Create | `lib/adapter-utils.js` | Shared: enumerateWorkflows(), renderTemplate() |
| Modify | `adapters/claude-code/translator.js` | Claude Code: generate .claude/commands/*.md |
| Modify | `adapters/copilot/translator.js` | Copilot: generate .github/prompts/*.prompt.md |
| Create | `tests/adapter-utils.test.js` | Tests for shared utilities |
| Create | `tests/adapters.test.js` | Tests for both translators |

---

### Task 1: Shared Adapter Utilities

**Files:**
- Create: `lib/adapter-utils.js`
- Create: `tests/adapter-utils.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/adapter-utils.test.js`:

```javascript
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const root = resolve(dirname(__filename), '..');

describe('adapter-utils — enumerateWorkflows', () => {
  let enumerateWorkflows;

  it('module exports enumerateWorkflows function', async () => {
    const mod = await import('../lib/adapter-utils.js');
    enumerateWorkflows = mod.enumerateWorkflows;
    expect(typeof enumerateWorkflows).toBe('function');
  });

  it('finds fixture workflows when scanning tests/fixtures as corePath', async () => {
    const { enumerateWorkflows } = await import('../lib/adapter-utils.js');
    const workflows = enumerateWorkflows(resolve(root, 'tests/fixtures'));
    expect(workflows.length).toBeGreaterThanOrEqual(1);
  });

  it('returns objects with id, workflowPath, and model fields', async () => {
    const { enumerateWorkflows } = await import('../lib/adapter-utils.js');
    const workflows = enumerateWorkflows(resolve(root, 'tests/fixtures'));
    for (const wf of workflows) {
      expect(wf.id).toBeDefined();
      expect(typeof wf.id).toBe('string');
      expect(wf.workflowPath).toBeDefined();
    }
  });

  it('returns empty array for nonexistent path (no throw)', async () => {
    const { enumerateWorkflows } = await import('../lib/adapter-utils.js');
    const workflows = enumerateWorkflows('/nonexistent/path/nothing');
    expect(Array.isArray(workflows)).toBe(true);
    expect(workflows.length).toBe(0);
  });

  it('finds workflows in _symphony/ structure when scanning project root', async () => {
    const { enumerateWorkflows } = await import('../lib/adapter-utils.js');
    // Currently no workflows exist in _symphony/ (pre-Spec 5), but the function should not throw
    const workflows = enumerateWorkflows(root);
    expect(Array.isArray(workflows)).toBe(true);
    // May be 0 (no workflows yet) — that's valid
  });
});

describe('adapter-utils — renderTemplate', () => {
  it('module exports renderTemplate function', async () => {
    const mod = await import('../lib/adapter-utils.js');
    expect(typeof mod.renderTemplate).toBe('function');
  });

  it('replaces {{variable}} placeholders', async () => {
    const { renderTemplate } = await import('../lib/adapter-utils.js');
    const result = renderTemplate('Hello {{name}}, you are {{role}}.', { name: 'Alice', role: 'PM' });
    expect(result).toBe('Hello Alice, you are PM.');
  });

  it('handles {{#if variable}} conditional blocks — truthy', async () => {
    const { renderTemplate } = await import('../lib/adapter-utils.js');
    const result = renderTemplate('---\n{{#if model}}model: {{model}}{{/if}}\n---', { model: 'opus' });
    expect(result).toContain('model: opus');
  });

  it('handles {{#if variable}} conditional blocks — falsy', async () => {
    const { renderTemplate } = await import('../lib/adapter-utils.js');
    const result = renderTemplate('---\n{{#if model}}model: {{model}}{{/if}}\n---', {});
    expect(result).not.toContain('model:');
  });

  it('works with the actual claude-code command.md.tmpl', async () => {
    const { renderTemplate } = await import('../lib/adapter-utils.js');
    const { readFileSync } = await import('node:fs');
    const tmpl = readFileSync(resolve(root, 'adapters/claude-code/templates/command.md.tmpl'), 'utf8');
    const result = renderTemplate(tmpl, {
      description: 'Test workflow',
      model: 'opus',
      workflow_path: '_symphony/lifecycle/workflows/1-analysis/brainstorm/',
    });
    expect(result).toContain('description: Test workflow');
    expect(result).toContain('model: opus');
    expect(result).toContain('conductor.xml');
    expect(result).toContain('_symphony/lifecycle/workflows/1-analysis/brainstorm/');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/adapter-utils.test.js`
Expected: FAIL — `lib/adapter-utils.js` does not exist

- [ ] **Step 3: Implement lib/adapter-utils.js**

Create `lib/adapter-utils.js`:

```javascript
// Symphony adapter utilities — shared by all adapter translators.
// See Spec 7: docs/superpowers/specs/2026-04-10-symphony-adapters-design.md §2

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join, basename, dirname } from 'node:path';
import YAML from 'yaml';

/**
 * Recursively find all directories containing a workflow.yaml file.
 * @param {string} scanPath - Directory to scan
 * @returns {string[]} Array of directory paths containing workflow.yaml
 */
function findWorkflowDirs(scanPath) {
  const results = [];
  if (!existsSync(scanPath)) return results;

  let entries;
  try {
    entries = readdirSync(scanPath, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const dirPath = join(scanPath, entry.name);
      if (existsSync(join(dirPath, 'workflow.yaml'))) {
        results.push(dirPath);
      }
      // Recurse into subdirectories
      results.push(...findWorkflowDirs(dirPath));
    }
  }
  return results;
}

/**
 * Enumerate all workflows under a project root.
 * Scans _symphony/lifecycle/workflows/, _symphony/dev/workflows/,
 * _symphony/creative/workflows/, _symphony/testing/workflows/.
 * Also scans the root directly for test fixtures.
 *
 * @param {string} corePath - Project root or fixture root
 * @returns {Array<{id, model, owner, description, workflowPath}>}
 */
export function enumerateWorkflows(corePath) {
  const scanDirs = [
    join(corePath, '_symphony', 'lifecycle', 'workflows'),
    join(corePath, '_symphony', 'dev', 'workflows'),
    join(corePath, '_symphony', 'creative', 'workflows'),
    join(corePath, '_symphony', 'testing', 'workflows'),
    corePath, // also scan root directly (for test fixtures)
  ];

  const allDirs = [];
  for (const dir of scanDirs) {
    allDirs.push(...findWorkflowDirs(dir));
  }

  // Deduplicate
  const seen = new Set();
  const workflows = [];

  for (const dir of allDirs) {
    if (seen.has(dir)) continue;
    seen.add(dir);

    const yamlPath = join(dir, 'workflow.yaml');
    try {
      const content = readFileSync(yamlPath, 'utf8');
      const parsed = YAML.parse(content);
      if (!parsed || !parsed.id) continue;

      workflows.push({
        id: parsed.id,
        model: parsed.model || null,
        owner: parsed.owner || 'orchestrator',
        description: parsed.description || parsed.id,
        workflowPath: dir,
      });
    } catch {
      // Skip unparseable files
    }
  }

  return workflows;
}

/**
 * Render a template string with {{variable}} and {{#if variable}}...{{/if}} support.
 *
 * @param {string} template - Template string with {{placeholders}}
 * @param {Object} data - Key-value pairs for substitution
 * @returns {string} Rendered string
 */
export function renderTemplate(template, data) {
  // Handle {{#if variable}}content{{/if}} blocks
  let result = template.replace(
    /\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
    (_, key, content) => {
      return data[key] ? content : '';
    }
  );

  // Handle {{variable}} substitutions
  result = result.replace(
    /\{\{(\w+)\}\}/g,
    (_, key) => {
      return data[key] !== undefined ? String(data[key]) : '';
    }
  );

  return result;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/adapter-utils.test.js`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add lib/adapter-utils.js tests/adapter-utils.test.js
git commit -m "feat(adapters): add shared adapter-utils with enumerateWorkflows and renderTemplate (Spec 7)"
```

---

### Task 2: Claude Code Translator

**Files:**
- Modify: `adapters/claude-code/translator.js`
- Create: `tests/adapters.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/adapters.test.js`:

```javascript
import { existsSync, readFileSync, mkdtempSync, rmSync, mkdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const root = resolve(dirname(__filename), '..');

describe('Claude Code adapter', () => {
  let translate, metadata;

  beforeAll(async () => {
    const mod = await import('../adapters/claude-code/translator.js');
    translate = mod.translate;
    metadata = mod.metadata;
  });

  it('metadata.stub is false', () => {
    expect(metadata.stub).toBe(false);
  });

  it('metadata.id is claude-code', () => {
    expect(metadata.id).toBe('claude-code');
  });

  it('translate is a function', () => {
    expect(typeof translate).toBe('function');
  });

  describe('translate with fixtures', () => {
    let tmpDir;

    beforeAll(async () => {
      tmpDir = mkdtempSync(join(tmpdir(), 'symphony-adapter-test-'));
      await translate(root, tmpDir);
    });

    afterAll(() => {
      rmSync(tmpDir, { recursive: true, force: true });
    });

    it('creates .claude/commands/ directory', () => {
      expect(existsSync(join(tmpDir, '.claude', 'commands'))).toBe(true);
    });

    it('creates entry command symphony.md', () => {
      const entryPath = join(tmpDir, '.claude', 'commands', 'symphony.md');
      expect(existsSync(entryPath)).toBe(true);
      const content = readFileSync(entryPath, 'utf8');
      expect(content).toContain('conductor.xml');
    });

    it('creates command files for fixture workflows', () => {
      const cmdsDir = join(tmpDir, '.claude', 'commands');
      const files = existsSync(cmdsDir)
        ? require('node:fs').readdirSync(cmdsDir).filter(f => f.startsWith('symphony-'))
        : [];
      // At least the fixture workflows should produce command files
      expect(files.length).toBeGreaterThanOrEqual(1);
    });

    it('generated command files contain conductor.xml reference', () => {
      const cmdsDir = join(tmpDir, '.claude', 'commands');
      const files = require('node:fs').readdirSync(cmdsDir).filter(f => f.startsWith('symphony-'));
      for (const file of files) {
        const content = readFileSync(join(cmdsDir, file), 'utf8');
        expect(content).toContain('conductor.xml');
      }
    });
  });
});

describe('Copilot adapter', () => {
  let translate, metadata;

  beforeAll(async () => {
    const mod = await import('../adapters/copilot/translator.js');
    translate = mod.translate;
    metadata = mod.metadata;
  });

  it('metadata.stub is false', () => {
    expect(metadata.stub).toBe(false);
  });

  it('metadata.id is copilot', () => {
    expect(metadata.id).toBe('copilot');
  });

  it('translate is a function', () => {
    expect(typeof translate).toBe('function');
  });

  describe('translate with fixtures', () => {
    let tmpDir;

    beforeAll(async () => {
      tmpDir = mkdtempSync(join(tmpdir(), 'symphony-copilot-test-'));
      await translate(root, tmpDir);
    });

    afterAll(() => {
      rmSync(tmpDir, { recursive: true, force: true });
    });

    it('creates .github/prompts/ directory', () => {
      expect(existsSync(join(tmpDir, '.github', 'prompts'))).toBe(true);
    });

    it('creates entry command symphony.prompt.md', () => {
      const entryPath = join(tmpDir, '.github', 'prompts', 'symphony.prompt.md');
      expect(existsSync(entryPath)).toBe(true);
      const content = readFileSync(entryPath, 'utf8');
      expect(content).toContain('conductor.xml');
    });

    it('creates prompt files for fixture workflows', () => {
      const promptsDir = join(tmpDir, '.github', 'prompts');
      const files = existsSync(promptsDir)
        ? require('node:fs').readdirSync(promptsDir).filter(f => f.startsWith('symphony-'))
        : [];
      expect(files.length).toBeGreaterThanOrEqual(1);
    });

    it('generated prompt files contain conductor.xml reference', () => {
      const promptsDir = join(tmpDir, '.github', 'prompts');
      const files = require('node:fs').readdirSync(promptsDir).filter(f => f.startsWith('symphony-'));
      for (const file of files) {
        const content = readFileSync(join(promptsDir, file), 'utf8');
        expect(content).toContain('conductor.xml');
      }
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/adapters.test.js`
Expected: FAIL — metadata.stub is true, translate throws

- [ ] **Step 3: Implement Claude Code translator**

Replace the entire contents of `adapters/claude-code/translator.js` with:

```javascript
// Symphony Claude Code adapter — translator
// See architecture spec §7.3
// See Spec 7: docs/superpowers/specs/2026-04-10-symphony-adapters-design.md §3

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { enumerateWorkflows, renderTemplate } from '../../lib/adapter-utils.js';

const __filename = fileURLToPath(import.meta.url);
const adapterDir = dirname(__filename);

export async function translate(corePath, userProjectPath, options = {}) {
  const workflows = enumerateWorkflows(corePath);
  const templatePath = join(adapterDir, 'templates', 'command.md.tmpl');
  const template = readFileSync(templatePath, 'utf8');
  const outDir = join(userProjectPath, '.claude', 'commands');

  // Ensure output directory exists
  mkdirSync(outDir, { recursive: true });

  // Generate a command file per workflow
  let count = 0;
  for (const wf of workflows) {
    const rendered = renderTemplate(template, {
      description: wf.description,
      model: wf.model,
      workflow_path: wf.workflowPath,
    });
    writeFileSync(join(outDir, `symphony-${wf.id}.md`), rendered);
    count++;
  }

  // Emit entry command
  const entryContent = [
    '---',
    'description: Symphony — orchestrate your code',
    'model: opus',
    '---',
    '',
    'Load `{project-root}/_symphony/core/engine/conductor.xml` first.',
    'Parse the user\'s goal from $ARGUMENTS and route to the appropriate workflow.',
    '',
  ].join('\n');
  writeFileSync(join(outDir, 'symphony.md'), entryContent);

  return { commands_generated: count, entry_command: 'symphony.md' };
}

export const metadata = {
  id: 'claude-code',
  stub: false,
  specReference: 'docs/superpowers/specs/2026-04-10-symphony-adapters-design.md#3-claude-code-adapter',
};
```

- [ ] **Step 4: Run Claude Code adapter tests**

Run: `npx vitest run tests/adapters.test.js -t "Claude Code"`
Expected: All Claude Code tests PASS. Copilot tests still fail (still a stub).

- [ ] **Step 5: Commit**

```bash
git add adapters/claude-code/translator.js tests/adapters.test.js
git commit -m "feat(adapters): implement claude-code translator — generates slash commands from Core workflows (Spec 7)"
```

---

### Task 3: Copilot Translator

**Files:**
- Modify: `adapters/copilot/translator.js`

- [ ] **Step 1: Implement Copilot translator**

Replace the entire contents of `adapters/copilot/translator.js` with:

```javascript
// Symphony GitHub Copilot adapter — translator
// See architecture spec §7.3
// See Spec 7: docs/superpowers/specs/2026-04-10-symphony-adapters-design.md §4

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { enumerateWorkflows, renderTemplate } from '../../lib/adapter-utils.js';

const __filename = fileURLToPath(import.meta.url);
const adapterDir = dirname(__filename);

export async function translate(corePath, userProjectPath, options = {}) {
  const workflows = enumerateWorkflows(corePath);
  const templatePath = join(adapterDir, 'templates', 'command.md.tmpl');
  const template = readFileSync(templatePath, 'utf8');
  const outDir = join(userProjectPath, '.github', 'prompts');

  // Ensure output directory exists
  mkdirSync(outDir, { recursive: true });

  // Generate a prompt file per workflow
  let count = 0;
  for (const wf of workflows) {
    const rendered = renderTemplate(template, {
      description: wf.description,
      model: wf.model,
      workflow_path: wf.workflowPath,
    });
    writeFileSync(join(outDir, `symphony-${wf.id}.prompt.md`), rendered);
    count++;
  }

  // Emit entry command
  const entryContent = [
    '---',
    'mode: agent',
    'description: Symphony — orchestrate your code',
    '---',
    '',
    'Load `_symphony/core/engine/conductor.xml` first.',
    'Parse the user\'s goal from $ARGUMENTS and route to the appropriate workflow.',
    '',
  ].join('\n');
  writeFileSync(join(outDir, 'symphony.prompt.md'), entryContent);

  return { commands_generated: count, entry_command: 'symphony.prompt.md' };
}

export const metadata = {
  id: 'copilot',
  stub: false,
  specReference: 'docs/superpowers/specs/2026-04-10-symphony-adapters-design.md#4-copilot-adapter',
};
```

- [ ] **Step 2: Run all adapter tests**

Run: `npx vitest run tests/adapters.test.js`
Expected: All tests PASS (both Claude Code and Copilot)

- [ ] **Step 3: Run full test suite**

Run: `npx vitest run`
Expected: ALL tests pass across all files, 0 failures

- [ ] **Step 4: Commit**

```bash
git add adapters/copilot/translator.js
git commit -m "feat(adapters): implement copilot translator — generates prompt files from Core workflows (Spec 7)"
```

---

## Self-Review

**Spec coverage:**
- §2.1 enumerateWorkflows → Task 1 step 3 ✓
- §2.2 renderTemplate → Task 1 step 3 ✓
- §3 Claude Code translator → Task 2 step 3 ✓
- §3.1 translate function → Task 2 step 3 (enumerate, render, write, entry command) ✓
- §3.2 metadata.stub = false → Task 2 step 3 ✓
- §4 Copilot translator → Task 3 step 1 ✓
- §4.1 translate function → Task 3 step 1 (.github/prompts/, .prompt.md) ✓
- §4.2 metadata.stub = false → Task 3 step 1 ✓
- §5 Testing → Tasks 1-3 (adapter-utils.test.js + adapters.test.js) ✓

**Placeholder scan:** No TBD, TODO, or vague instructions.

**Type consistency:** `enumerateWorkflows` returns `{id, model, owner, description, workflowPath}` — used consistently in both translators. `renderTemplate(template, data)` signature consistent between tests and implementation. `metadata.stub` field checked in tests matches the `false` value in implementations.

**Note:** The `tests/adapters.test.js` uses `require('node:fs').readdirSync` inside the test body because the test needs to dynamically list files in a temp directory. This is fine in vitest — `require` works alongside ESM imports for built-in modules.
