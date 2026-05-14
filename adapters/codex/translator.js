// Symphony Codex adapter — translator
// See architecture spec §7.3

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { enumerateWorkflows, renderTemplate } from '../../lib/adapter-utils.js';

const __filename = fileURLToPath(import.meta.url);
const adapterDir = dirname(__filename);

export async function translate(corePath, userProjectPath, options = {}) {
  const workflows = enumerateWorkflows(corePath);
  const templatePath = join(adapterDir, 'templates', 'agents.md.tmpl');
  const template = readFileSync(templatePath, 'utf8');
  const outDir = join(userProjectPath, '.codex');

  mkdirSync(outDir, { recursive: true });

  let count = 0;
  for (const wf of workflows) {
    const rendered = renderTemplate(template, {
      description: wf.description,
      workflow_path: wf.workflowPath,
    });
    writeFileSync(join(outDir, `symphony-${wf.id}.md`), rendered);
    count++;
  }

  const entryContent = [
    '# Symphony Agent Instructions',
    '',
    'Load `_symphony/core/engine/conductor.xml` first.',
    'Parse the user\'s goal and route to the appropriate workflow.',
    '',
    'Available workflows are listed in `.codex/` as `symphony-*.md` files.',
    '',
  ].join('\n');
  writeFileSync(join(userProjectPath, 'AGENTS.md'), entryContent);

  return { commands_generated: count, entry_command: 'AGENTS.md' };
}

export const metadata = {
  id: 'codex',
  stub: false,
  specReference: 'docs/superpowers/specs/2026-04-10-symphony-adapters-design.md',
};
