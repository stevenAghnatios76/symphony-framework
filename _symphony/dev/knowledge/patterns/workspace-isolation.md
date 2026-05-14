# Workspace Isolation

**Principle:** Bound each agent's file access to a scoped workspace, enforce explicit handoffs for cross-agent artifacts, and clean up orphaned state on schedule.

## Pattern Examples

### Git Worktree Isolation
Spawn a fresh worktree per agent so file edits never collide:
```bash
git worktree add .worktrees/agent-dev-story feature-branch
```
Agent works in `.worktrees/agent-dev-story/`, merges back on completion.

### Container-Scoped Workspace
Bind-mount only the directories an agent needs:
```yaml
volumes:
  - ./src:/workspace/src:rw
  - ./docs/planning-artifacts:/workspace/docs:ro
```
Read-only mounts for shared artifacts prevent accidental writes.

### Handoff via Checkpoint
Producer writes to its private dir, records in checkpoint YAML:
```yaml
handoffs:
  - artifact: src/auth/login.ts
    target_agent: reviewer
    sha256: a1b2c3...
```
Consumer verifies hash before reading.

## Anti-Patterns

- Writing to shared directories without locks — causes race conditions when parallel agents run
- Skipping workspace cleanup — orphaned worktrees accumulate disk and confuse future runs
- Implicit file sharing — agent A assumes agent B wrote a file without checking the handoff manifest
- Using a single workspace for all agents — defeats isolation, merges become conflict-prone
- Hardcoding workspace paths — breaks when agents run in different environments

## Integration Points

- **checkpoint-resume protocol** — workspace state included in snapshots
- **memory-hygiene protocol** — orphan cleanup on configured cadence
- **gate-enforcer** — post-complete gate verifies artifact accounting
- **wave-executor** — parallel agents each get isolated workspaces
