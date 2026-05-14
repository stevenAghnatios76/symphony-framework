# Symphony

> Orchestrate your code.

Symphony is an AI agent framework that dispatches a coordinated team of specialist agents to deliver software products. Describe your goal — Symphony picks the phase, the workflow, and the agents.

It runs inside your AI coding tool of choice. No standalone CLI. No new binary. Just your existing workflow, supercharged.

## Supported Platforms

| Platform | Config File | Commands |
|----------|------------|----------|
| **Claude Code** | `CLAUDE.md` | `.claude/commands/symphony-*.md` |
| **GitHub Copilot** | `.github/copilot-instructions.md` | `.github/prompts/symphony-*.prompt.md` |
| **OpenAI Codex** | `AGENTS.md` | `.codex/symphony-*.md` |

## What Makes Symphony Different

**Smart orchestration** — You describe what you want; the Conductor picks the lifecycle phase, workflow, and agents. No command memorization.

**Parallel execution** — Agents run concurrently in waves with integration gates between waves, producing multi-step outputs faster than any sequential framework.

**Dual-layer architecture** — A tool-agnostic Core runtime with thin adapters for each platform. Future AI tools plug in through new adapters without touching Core.

**Engine-enforced disciplines** — Self-critique thresholds, knowledge trust levels, anti-rationalization tables, and diagnose-then-fix recovery are baked into the engine, not opted into per agent.

## Framework at a Glance

| | Count |
|---|---|
| Agents | 35 |
| Workflows | 76 |
| Protocols | 21 |
| Knowledge Fragments | 51 |
| Skills | 12 |
| Adapters | 3 (Claude Code, Copilot, Codex) |
| Tests | 1700+ |

## The 5-Phase Lifecycle

```
Analysis → Planning → Solutioning → Implementation → Deployment
```

Each phase has dedicated workflows and agents. The Conductor routes you to the right phase based on your goal. Anytime workflows (quick-spec, quick-dev, spike, explore-codebase, etc.) are available in any phase.

## Architecture

```
_symphony/
├── _config/          Global config, manifest, presets
├── core/             Engine specs, protocols, vault, CLI registry
├── lifecycle/        5-phase workflows + agents
├── dev/              Developer agents, skills, knowledge
├── creative/         Creative agents + workflows
├── testing/          Test agents, workflows, knowledge
├── utility/          Cross-cutting utility agents
└── _memory/          Checkpoints + sidecars

adapters/
├── claude-code/      Claude Code adapter
├── copilot/          GitHub Copilot adapter
└── codex/            OpenAI Codex adapter
```

See [`docs/superpowers/specs/2026-04-08-symphony-architecture-design.md`](docs/superpowers/specs/2026-04-08-symphony-architecture-design.md) for the full architecture spec.

## Getting Started

- [Getting Started with Claude Code](docs/guides/getting-started-claude-code.md)
- [Getting Started with GitHub Copilot](docs/guides/getting-started-copilot.md)
- [Getting Started with OpenAI Codex](docs/guides/getting-started-codex.md)

## Status

**v0.1.0 — Specification complete.** All agents, workflows, protocols, and knowledge fragments are fully specified. The runtime engine that executes these specifications is planned for v0.2.0.

What's included in v0.1.0:
- Complete agent persona definitions with expertise, knowledge trust boundaries, and anti-rationalization pairs
- Full workflow specifications (YAML metadata + XML instructions + Markdown templates)
- 21 protocols covering cross-cutting concerns (self-critique, checkpoints, memory hygiene, workspace isolation, etc.)
- 3 working adapter translators that generate platform-native command files
- 1700+ structural validation tests
- Vault knowledge graph schema for codebase intelligence
- Environment presets for solo, team, and enterprise configurations

## Running the Tests

```bash
npm install
npm test
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to add agents, workflows, adapters, and knowledge fragments.

## License

AGPL-3.0. See [`LICENSE`](LICENSE).
