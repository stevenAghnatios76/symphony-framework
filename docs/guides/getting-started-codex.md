# Getting Started with Symphony + OpenAI Codex

## Prerequisites

- [Codex CLI](https://github.com/openai/codex) installed
- Node.js >= 20.0.0

## Installation

1. Clone or install Symphony into your project:

```bash
npm install symphony-framework
```

2. Run the adapter translator to generate Codex instructions:

```bash
node node_modules/symphony-framework/adapters/codex/translator.js
```

This creates `AGENTS.md` in your project root and `.codex/symphony-*.md` workflow files.

## Usage

Codex reads `AGENTS.md` automatically when you start a session. The file instructs Codex to load the Symphony Conductor, which routes your requests to the appropriate workflow.

```bash
codex "brainstorm a task management app"
codex "create a PRD for the authentication system"
codex "implement the login story"
```

Describe your goal naturally. The Conductor analyzes your intent and activates the right agents.

## How It Works

1. Codex reads `AGENTS.md` at session start
2. `AGENTS.md` loads the Conductor (`_symphony/core/engine/conductor.xml`)
3. The Conductor detects your lifecycle phase and selects the right workflow
4. The workflow activates specialist agents with enforced disciplines
5. Agents produce artifacts following templates and checklists

## Configuration

Symphony reads from `_symphony/_config/global.yaml`. Workflow reference files are in `.codex/`.

## Features

- **Sandboxed execution** — Codex runs in a sandbox; Symphony workflows respect these boundaries
- **Natural language routing** — No slash commands needed; describe your goal and the Conductor routes
- **Self-critique enforcement** — All agents apply confidence thresholds and anti-rationalization checks
