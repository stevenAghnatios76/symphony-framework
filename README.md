# Symphony

> Orchestrate your code.

Symphony is an AI agent framework that lets you describe a goal and dispatches a coordinated team of specialist agents in parallel to deliver it.

**Status:** v0.0.1 — repo foundation. Engine runtime, lifecycle agents, workflows, and adapters are under active development. See the architecture spec for the full vision.

## What makes Symphony different

- **Smart orchestration** — you describe what you want; Symphony picks the phase, the workflow, and the agents. No command memorization.
- **Parallel execution** — agents run concurrently in waves with integration gates between waves, producing multi-step outputs faster than any sequential framework can.
- **Dual-layer architecture** — a tool-agnostic Core runtime with thin adapters for Claude Code and GitHub Copilot. Future AI tools plug in through new adapters without touching Core.
- **Engine-enforced disciplines** — self-critique at confidence threshold, knowledge trust levels, anti-rationalization tables, and diagnose-then-fix failure recovery are baked into the engine, not opted into per agent.

## Architecture

See [`docs/superpowers/specs/2026-04-08-symphony-architecture-design.md`](docs/superpowers/specs/2026-04-08-symphony-architecture-design.md) for the full architecture spec.

## Project status

This repo currently contains:

- Directory scaffolding for the Core runtime (`_symphony/`)
- Stub engine component files (conductor, wave-executor, workflow-engine, gate-enforcer, task-runner)
- Stub protocol files (status-sync, review-gate-check, checkpoint-resume, memory-hygiene, artifact-enrichment-hook, self-critique, trust-levels, anti-rationalization, diagnose-then-fix)
- Stub adapter modules (claude-code, copilot) with placeholder translators
- A minimal CLI (`npx symphony-framework --version`)
- A structure-validation test suite

The runtime engine, lifecycle agents, workflows, and adapter translators land in follow-up plans.

## Running the tests

```bash
npm install
npm test
```

## License

AGPL-3.0. See [`LICENSE`](LICENSE).
