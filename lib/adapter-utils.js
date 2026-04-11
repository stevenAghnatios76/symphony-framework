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
