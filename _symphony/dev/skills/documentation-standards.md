# Documentation Standards

<!-- SECTION: readme-templates -->
## README Templates

**Every project README includes:**
1. **Title + one-line description** — what it does, not how
2. **Quick start** — clone → install → run in ≤5 commands
3. **Prerequisites** — runtime versions, environment variables, external services
4. **Architecture overview** — 3-5 sentence summary + diagram link if complex
5. **Development** — how to run tests, lint, build
6. **Deployment** — how to ship it
7. **Contributing** — PR process, coding standards link

**Anti-patterns:** No "TODO: add docs", no stale badges, no copy-pasted boilerplate from another project.

<!-- SECTION: adrs -->
## Architecture Decision Records (ADRs)

**Format:** `docs/adr/NNNN-{short-title}.md`
```
# NNNN: Short Title

**Status:** proposed | accepted | deprecated | superseded by NNNN
**Date:** YYYY-MM-DD
**Context:** What forces are at play?
**Decision:** What did we decide?
**Consequences:** What are the trade-offs?
```

**When to write an ADR:** Technology choice, major refactoring, API design decisions, infrastructure changes, anything you'd explain in a PR description more than once.

<!-- SECTION: inline-comments -->
## Inline Comments

**Default: write no comments.** Well-named code is self-documenting.

**When to comment:**
- Hidden constraints (rate limits, licensing, compliance)
- Non-obvious workarounds (with link to issue/bug)
- Performance-critical sections (why this approach, not the obvious one)
- Regex patterns (always explain what they match)

**Never comment:** What the code does (rename instead), TODO/FIXME without a ticket, obvious operations, change history (that's git).

<!-- SECTION: api-docs -->
## API Documentation

**Auto-generate from code** where possible (OpenAPI, JSDoc, Sphinx, godoc).

**Document:**
- Every public endpoint: method, path, parameters, request body, responses
- Authentication: how to obtain and use credentials
- Rate limits: per-endpoint or global
- Error codes: machine-readable codes with human descriptions
- Changelog: what changed, when, migration guide for breaking changes

**Keep docs next to code.** Docs in a separate repo drift. Docs in the same PR stay current.
