# Git Workflow

<!-- SECTION: branching-strategy -->
## Branching Strategy

Trunk-based development: main is always deployable, feature branches live max 2-3 days.

**Branch naming:** `{type}/{ticket-key}-{short-description}`
- Types: `feature/`, `fix/`, `hotfix/`, `refactor/`, `chore/`, `test/`

**Rules:**
- Never commit directly to main
- Delete branches after merge
- Rebase before opening PR
- One branch per story

**Release branches:** `release/v{major}.{minor}.{patch}`, tagged as `v{major}.{minor}.{patch}`

<!-- SECTION: conventional-commits -->
## Conventional Commits

**Format:** `type(scope): description`

**Types (9):**
| Type | Use When |
|------|----------|
| feat | New feature or capability |
| fix | Bug fix |
| refactor | Code restructure, no behavior change |
| test | Adding or updating tests |
| docs | Documentation only |
| chore | Build, tooling, dependency updates |
| style | Formatting, whitespace, semicolons |
| perf | Performance improvement |
| ci | CI/CD pipeline changes |

**Scope:** Component or module name. Omit for broad changes.

**Breaking changes:** `feat(api)!: description` with `BREAKING CHANGE:` footer.

**Body:** Wrap at 72 characters. Explain *why*, not *what*. Reference issue IDs.

<!-- SECTION: pr-template -->
## Pull Request Template

```
## Summary
[1-2 sentences: what and why]

## Changes
- [ ] Change 1
- [ ] Change 2

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual verification done

## Checklist
- [ ] No console.log / print statements
- [ ] No hardcoded secrets
- [ ] Types updated (if applicable)
- [ ] Docs updated (if applicable)
```

**Review checklist:** Correctness, test coverage, security, performance, readability.

**Merge strategies:**
- Squash merge for feature branches (clean history)
- Merge commit for release branches (preserve context)
- Rebase for branch updates (linear history)

<!-- SECTION: conflict-resolution -->
## Conflict Resolution

**When to rebase:** Local feature branches (your work only).
**When to merge:** Shared branches (others may have based work on them).

**Resolution process:**
1. Identify conflicted files (`git status`)
2. Open each file, find `<<<<<<<` markers
3. Understand both sides before choosing
4. Resolve: keep one, combine both, or rewrite
5. Remove all conflict markers
6. Run full test suite
7. Stage resolved files and complete merge/rebase

**Prevention:** Rebase frequently, communicate on shared files, keep PRs small, use CODEOWNERS.
