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
