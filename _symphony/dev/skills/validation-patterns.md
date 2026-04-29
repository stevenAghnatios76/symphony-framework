# Validation Patterns

<!-- SECTION: claim-extraction -->
## Claim Extraction

**Every assertion in a document is a claim.** Before trusting a claim, classify it:

| Claim Type | Example | Verification |
|-----------|---------|-------------|
| Structural | "The UserService class handles authentication" | Grep for class, read implementation |
| Behavioral | "Rate limiting rejects after 100 requests" | Find the config or test that proves it |
| Quantitative | "Response time is under 200ms" | Find benchmark or monitoring evidence |
| Dependency | "Requires PostgreSQL 15+" | Check docker-compose, CI config, package deps |
| Negative | "No PII is stored in logs" | Grep log statements, check log config |

**Process:**
1. Extract claims from the artifact (PRD, architecture doc, story)
2. Classify each claim
3. Verify against codebase (grep, read, test)
4. Flag unverifiable claims for manual review

<!-- SECTION: filesystem-verification -->
## Filesystem Verification

**Verify files exist before referencing them:**
- Config files mentioned in docs → `existsSync` or `stat`
- Import paths in architecture diagrams → resolve and check
- Test files mentioned in stories → verify they exist and contain relevant tests

**Verify file contents match claims:**
- "Uses Express middleware" → grep for `app.use(` or `router.use(`
- "Configured for PostgreSQL" → check connection string in config
- "Has 80% test coverage" → run coverage tool and compare

**Detect drift:**
- File renamed but references not updated
- Config changed but docs still show old values
- Test deleted but still mentioned in CI config

<!-- SECTION: cross-reference -->
## Cross-Reference Checks

**Architecture ↔ Code:** Do the modules described in the architecture doc match the actual directory structure? Are the interfaces described actually implemented?

**PRD ↔ Tests:** Does every acceptance criterion have at least one test? Do test names map to requirement IDs?

**Stories ↔ Code:** Do the files listed in the story's "files changed" section actually exist and contain relevant changes?

**Dependencies ↔ Lock file:** Does `package.json` match `package-lock.json`? Any phantom dependencies (used but not declared)?
