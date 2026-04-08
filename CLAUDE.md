# Symphony Framework

> Version: 0.0.1 (repo foundation — engine runtime not yet implemented)

This project is the Symphony framework — an AI agent framework for Claude Code and GitHub Copilot that orchestrates software product development through a smart conductor, parallel wave execution, and a 5-phase lifecycle.

## Status

This repo is at v0.0.1: the repo foundation. Directory scaffolding, stub engine files, and a minimal CLI are in place. The runtime engine, lifecycle agents, workflows, and adapter translators are under active development in follow-up plans.

## Architecture reference

The canonical architecture spec lives at:
`docs/superpowers/specs/2026-04-08-symphony-architecture-design.md`

All follow-up work must respect the principles and contracts defined there.

## How to Start (when the runtime exists)

The primary entry point will be `/symphony` — this activates the Conductor who routes you to the right agent or workflow. Until the runtime is implemented, `/symphony*` commands are not yet wired up.

## Framework Location

```
_symphony/                    # Framework root (Core runtime)
├── _config/                  # global.yaml, manifest.yaml
├── core/                     # Engine, protocols, adapter registry
│   ├── engine/               # conductor, wave-executor, workflow-engine, gate-enforcer, task-runner
│   ├── protocols/            # cross-cutting behaviors (9 protocols)
│   └── adapter-registry/     # adapter manifests Core is aware of
├── lifecycle/                # 5-phase product lifecycle (empty at v0.0.1)
├── dev/                      # Developer agents + skills (empty at v0.0.1)
├── creative/                 # Creative agents + workflows (empty at v0.0.1)
├── testing/                  # Test architect + workflows (empty at v0.0.1)
└── _memory/                  # Persistent memory + checkpoints (empty at v0.0.1)
```

Adapter source code lives at `adapters/` outside `_symphony/` — adapters run at install time only.

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
