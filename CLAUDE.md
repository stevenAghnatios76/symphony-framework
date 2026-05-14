# Symphony Framework

> Version: 0.1.0 (specification release)

Symphony is an AI agent framework that orchestrates software product development through a smart conductor, parallel wave execution, and a 5-phase lifecycle. It is **not a standalone CLI tool** — it runs inside AI coding platforms (Claude Code, GitHub Copilot, Codex) as the orchestration layer. Adapters translate Symphony specs into each platform's native format.

## Status

The framework has complete specifications: 33 agents, 75 workflows, 20 protocols, and 16 design specs — all structurally validated by 1,577 tests. The runtime engine is not yet implemented; current work is finalizing the v0.1.0 specification release.

## Key Principle: Symphony Has No Standalone CLI

Symphony does NOT ship a CLI binary. Users interact with it through their AI coding tool of choice:
- **Claude Code** — via slash commands and CLAUDE.md integration
- **GitHub Copilot** — via workspace agents and chat participants
- **Codex** — via AGENTS.md integration

The `bin/symphony-cli.js` exists only for adapter installation/validation tooling, not for end-user interaction.

## Architecture Reference

The canonical architecture spec lives at:
`docs/superpowers/specs/2026-04-08-symphony-architecture-design.md`

All follow-up work must respect the principles and contracts defined there.

## Framework Location

```
_symphony/                    # Framework root (Core runtime)
├── _config/                  # global.yaml, manifest.yaml, lifecycle-sequence.yaml
├── core/                     # Engine, protocols, adapter registry
│   ├── engine/               # conductor, wave-executor, workflow-engine, gate-enforcer, task-runner
│   ├── protocols/            # cross-cutting behaviors (20 protocols)
│   └── adapter-registry/     # adapter manifests (claude-code, copilot, cursor, gemini-cli)
├── lifecycle/                # 5-phase product lifecycle (15 agents, 39 workflows)
├── dev/                      # Developer agents + skills + knowledge (2 agents, 12 skills, 20 knowledge fragments)
├── creative/                 # Creative agents + workflows (6 agents, 6 workflows)
├── testing/                  # Test architect + workflows (1 agent, 30 knowledge fragments)
├── utility/                  # Utility agents (3 agents)
└── _memory/                  # Persistent memory + checkpoints (schemas defined)
```

Adapter source code lives at `adapters/` outside `_symphony/` — adapters are pure file generators that run at install time only.

## Context Budget Discipline

- 40K tokens max per agent activation
- Agent persona files ≤ 200 lines
- Instruction step files ≤ 150 lines
- Skill files ≤ 300 lines
- Any `.md` file ≤ 1000 lines (split if exceeded)
- JIT loading for skills and knowledge fragments — never pre-load

## Do Not

- Modify `_symphony/core/engine/` or `_symphony/core/protocols/` stubs outside a dedicated implementation plan
- Add business logic to adapter translators (§7 golden rule: adapters are pure file generators)
- Rename files or directories without updating the architecture spec and the structure-validation test
- Skip running `npm test` before committing — the structure test prevents layout drift
