# Getting Started with Symphony + Claude Code

## Prerequisites

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) installed
- Node.js >= 20.0.0

## Installation

1. Clone or install Symphony into your project:

```bash
npm install symphony-framework
```

2. Run the adapter translator to generate Claude Code commands:

```bash
node node_modules/symphony-framework/adapters/claude-code/translator.js
```

This creates `.claude/commands/symphony-*.md` files in your project.

## Usage

Once installed, Symphony commands are available as Claude Code slash commands:

```
/symphony          — Route to the right workflow (main entry point)
/symphony-brainstorm    — Multi-agent brainstorming
/symphony-create-prd    — Create product requirements
/symphony-dev-story     — Implement a user story
/symphony-quick-dev     — Fast-track simple features
/symphony-spike         — Time-boxed investigation
```

Type `/symphony` followed by your goal. The Conductor analyzes your intent and routes to the appropriate workflow.

## How It Works

1. You invoke a `/symphony-*` command in Claude Code
2. The command loads the Conductor (`_symphony/core/engine/conductor.xml`)
3. The Conductor detects your lifecycle phase and selects the right workflow
4. The workflow activates specialist agents with enforced disciplines
5. Agents produce artifacts following templates and checklists

## Configuration

Symphony reads from `_symphony/_config/global.yaml`. Environment presets are available at `_symphony/_config/presets/`:

- `solo.yaml` — Simplified gates for individual developers
- `team.yaml` — Full gate enforcement for teams
- `enterprise.yaml` — Strict compliance for regulated environments

## Features

- **Model selection per command** — Each workflow specifies its preferred model (opus, sonnet)
- **Agent memory** — Persistent sidecars track context across sessions
- **Slash commands** — Full command surface available via `/symphony-*`
