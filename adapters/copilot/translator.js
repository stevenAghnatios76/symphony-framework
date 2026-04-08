// Symphony GitHub Copilot adapter — translator
// See architecture spec §7.3.
//
// Contract: same as claude-code adapter, but emits .prompt.md files to
// .github/prompts/ and the config file to .github/copilot-instructions.md.
//
// Status: stub — real implementation lands in Spec 7 Runtime Adapters plan.

export async function translate(corePath, userProjectPath, options = {}) {
  throw new Error(
    'Symphony copilot translator: not yet implemented. ' +
    'See docs/superpowers/specs/2026-04-08-symphony-architecture-design.md §7.3 ' +
    'for the contract. Real implementation in Spec 7 Runtime Adapters plan.'
  );
}

export const metadata = {
  id: 'copilot',
  stub: true,
  specReference: 'docs/superpowers/specs/2026-04-08-symphony-architecture-design.md#73-translator-contract-pseudocode',
};
