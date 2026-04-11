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
