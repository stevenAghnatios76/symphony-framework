// Symphony Claude Code adapter — translator
// See architecture spec §7.3.
//
// Contract: translate(corePath, userProjectPath, options) => Promise<void>
// - Enumerate workflows in _symphony/lifecycle|dev|creative|testing
// - Render a slash-command file per workflow using templates/command.md.tmpl
// - Emit the files to userProjectPath/.claude/commands/
// - Also emit the top-level /symphony entry command
// - Write the CLAUDE.md guide at userProjectPath root
//
// Status: stub — real implementation lands in Spec 7 Runtime Adapters plan.

export async function translate(corePath, userProjectPath, options = {}) {
  throw new Error(
    'Symphony claude-code translator: not yet implemented. ' +
    'See docs/superpowers/specs/2026-04-08-symphony-architecture-design.md §7.3 ' +
    'for the contract. Real implementation in Spec 7 Runtime Adapters plan.'
  );
}

export const metadata = {
  id: 'claude-code',
  stub: true,
  specReference: 'docs/superpowers/specs/2026-04-08-symphony-architecture-design.md#73-translator-contract-pseudocode',
};
