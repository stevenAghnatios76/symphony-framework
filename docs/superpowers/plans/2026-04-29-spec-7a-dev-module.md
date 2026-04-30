# Spec 7a: Dev Module — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fill Symphony's dev module with 1 base-dev template, 1 mobile-dev agent, 11 shared skills, 19 knowledge fragments, and 3 test files — closing the biggest content gap vs Gaia.

**Architecture:** Three waves of parallel worktree agents. Wave 1 creates all skills and knowledge files (4 parallel agents). Wave 2 creates the dev agents (2 parallel agents). Wave 3 writes tests, updates structure.test.js, and bumps the manifest (1 agent). Each wave's output is independently mergeable.

**Tech Stack:** Vitest for tests. Markdown + XML for agents/skills/knowledge. YAML for config.

**Spec:** `docs/superpowers/specs/2026-04-29-symphony-dev-module-design.md`

---

## Wave 1 — Skills & Knowledge (4 parallel agents)

---

### Task 1: Skills Batch A (6 skills)

**Files:**
- Create: `_symphony/dev/skills/git-workflow.md`
- Create: `_symphony/dev/skills/api-design.md`
- Create: `_symphony/dev/skills/database-design.md`
- Create: `_symphony/dev/skills/docker-workflow.md`
- Create: `_symphony/dev/skills/testing-patterns.md`
- Create: `_symphony/dev/skills/code-review-standards.md`

- [ ] **Step 1: Create git-workflow.md**

```markdown
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
```

- [ ] **Step 2: Create api-design.md**

```markdown
# API Design

<!-- SECTION: rest-conventions -->
## REST Conventions

**Resource naming:** Plural nouns, lowercase with hyphens, max 3 levels of nesting.
- Good: `GET /api/v1/users/{id}/orders`
- Bad: `GET /api/v1/getUser`, `GET /api/v1/users/{id}/orders/{oid}/items/{iid}/details`

**HTTP methods:**
| Method | Purpose | Idempotent | Safe |
|--------|---------|------------|------|
| GET | Read resource(s) | Yes | Yes |
| POST | Create resource | No | No |
| PUT | Full replace | Yes | No |
| PATCH | Partial update | No | No |
| DELETE | Remove resource | Yes | No |

**Status codes:**
- 200 OK, 201 Created, 204 No Content
- 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found
- 409 Conflict, 422 Unprocessable Entity, 429 Too Many Requests
- 500 Internal Server Error

**Pagination:** Offset (`?page=1&per_page=20`) or cursor (`?cursor=abc&limit=20`).
- Response includes: `total`, `page`, `per_page`, `next_cursor` (if cursor-based)

<!-- SECTION: graphql -->
## GraphQL Design

**Schema:** Descriptive type names, input types for mutations, enums for fixed value sets.

**Mutations return payload types** with optional `errors` field:
```graphql
type CreateUserPayload {
  user: User
  errors: [UserError!]
}
```

**Resolvers:** Keep thin — delegate to service layer. Use DataLoader for N+1 prevention.

**Subscriptions:** Only for real-time needs (chat, notifications). Use polling for infrequent data.

<!-- SECTION: openapi -->
## OpenAPI Specification

**Spec-first development:** Write the OpenAPI spec before implementing. Generate server stubs and client SDKs from the spec.

**Best practices:**
- Every endpoint needs `operationId`, `summary`, and `tags`
- Use `$ref` for shared schemas in `components/schemas/`
- Include request/response examples
- Document all error responses
- Version: openapi 3.0.3 or 3.1.0

<!-- SECTION: versioning -->
## API Versioning

**URL versioning (recommended):** `/api/v1/users`, `/api/v2/users`

**Breaking changes:** Field removal/rename, type change, required field addition, auth mechanism change, error format change.

**Deprecation policy:**
1. Announce with 6-month sunset timeline
2. Add `Sunset` and `Deprecation` headers to responses
3. Log usage of deprecated endpoints
4. Remove after sunset date

<!-- SECTION: error-standards -->
## Error Standards (RFC 7807)

**Problem Details response:**
```json
{
  "type": "https://api.example.com/errors/validation",
  "title": "Validation Error",
  "status": 422,
  "detail": "The 'email' field must be a valid email address",
  "instance": "/api/v1/users",
  "trace_id": "abc-123",
  "errors": [
    { "field": "email", "code": "INVALID_FORMAT", "detail": "Must be valid email" }
  ]
}
```

**Rules:**
- Never expose stack traces in responses
- Log full error details server-side
- Include `trace_id` for correlation
- Use machine-readable error codes (INVALID_FORMAT, NOT_FOUND, RATE_LIMITED)
```

- [ ] **Step 3: Create database-design.md**

```markdown
# Database Design

<!-- SECTION: schema-design -->
## Schema Design

**Naming conventions:**
- Tables: plural, snake_case (`user_accounts`, `order_items`)
- Columns: singular, snake_case (`created_at`, `is_active`)
- Primary keys: `id` (auto-increment or UUID)
- Foreign keys: `{referenced_table_singular}_id` (`user_id`, `order_id`)
- Indexes: `idx_{table}_{columns}` (`idx_users_email`)
- Constraints: `{type}_{table}_{columns}` (`uq_users_email`, `fk_orders_user_id`)

**Required columns for all tables:**
- `id` — primary key
- `created_at` — timestamp, set on insert
- `updated_at` — timestamp, set on insert and update

**Soft deletes:** Add `deleted_at` timestamp column. Filter `WHERE deleted_at IS NULL` by default. Use hard deletes only for GDPR compliance.

**Data types:** Use the most specific type. `boolean` not `int`, `decimal` not `float` for money, `timestamptz` not `timestamp`.

<!-- SECTION: migrations -->
## Migrations

**Rules:**
- One migration per schema change
- Migrations are append-only — never edit a deployed migration
- Every migration must be reversible (include down/rollback)
- Test migrations against production-size data before deploying
- Name format: `{timestamp}_{description}.sql` or framework equivalent

**Safe operations:** Add column (nullable), add index (concurrent), add table, add constraint (validate later).

**Dangerous operations:** Remove column, rename column, change column type, add NOT NULL without default. These require multi-step migrations with backfill.

<!-- SECTION: indexing -->
## Indexing

**When to index:**
- Foreign key columns (always)
- Columns in WHERE clauses (frequently queried)
- Columns in ORDER BY (for sorted queries)
- Columns in JOIN conditions
- Unique constraints (automatic)

**When NOT to index:**
- Small tables (< 1000 rows)
- Write-heavy columns rarely queried
- Low-cardinality columns (boolean, status with 3 values)

**Composite indexes:** Column order matters — put highest-cardinality column first. The index on `(user_id, created_at)` supports queries on `user_id` alone but NOT `created_at` alone.

**Monitor:** Use `EXPLAIN ANALYZE` to verify index usage. Drop unused indexes — they slow writes.

<!-- SECTION: orm-patterns -->
## ORM Patterns

**Repository pattern:** Wrap ORM queries behind a repository interface. Business logic never calls ORM directly.

**N+1 prevention:** Use eager loading (`include`, `prefetch_related`, `JOIN FETCH`) for known associations. Use DataLoader pattern for GraphQL resolvers.

**Transactions:** Wrap multi-table writes in transactions. Keep transactions short — no external API calls inside transactions.

**Query optimization:**
- Select only needed columns (`select` / `only`)
- Paginate all list queries
- Use database-level aggregations, not application-level loops
- Cache expensive queries with TTL
```

- [ ] **Step 4: Create docker-workflow.md**

```markdown
# Docker Workflow

<!-- SECTION: multi-stage-builds -->
## Multi-Stage Builds

**Pattern:** Separate build dependencies from runtime:
```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --production=false
COPY . .
RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
USER node
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

**Rules:**
- Use specific version tags (`node:20-alpine`, not `node:latest`)
- Copy package files before source (layer caching)
- Run as non-root user (`USER node`)
- Use `.dockerignore` to exclude `node_modules`, `.git`, `.env`
- Set `HEALTHCHECK` for production images

<!-- SECTION: compose -->
## Docker Compose

**Development compose:** Mount source code, enable hot reload, expose debug ports.

**Production compose:** Use built images, set resource limits, configure restart policies.

**Service dependencies:** Use `depends_on` with `condition: service_healthy` (not just `service_started`).

**Networking:** Use named networks for service isolation. Never expose database ports to host in production.

<!-- SECTION: security-scanning -->
## Security Scanning

**Image scanning:** Run `docker scout cves` or `trivy image` in CI before pushing.

**Base image hygiene:**
- Use minimal base images (alpine, distroless, slim)
- Update base images monthly
- Pin exact versions in FROM
- Never install unnecessary packages

**Secret management:**
- Never COPY `.env` files into images
- Use build-time secrets with `--mount=type=secret` (BuildKit)
- Use runtime secrets via environment variables or mounted volumes
- Rotate secrets without rebuilding images
```

- [ ] **Step 5: Create testing-patterns.md**

```markdown
# Testing Patterns

<!-- SECTION: tdd-cycle -->
## TDD Cycle

**Red-Green-Refactor:**
1. **Red:** Write a failing test that describes desired behavior
2. **Green:** Write the minimum code to make the test pass
3. **Refactor:** Improve structure while keeping tests green

**Rules:**
- Never write production code without a failing test
- Write only enough test to fail (one assertion)
- Write only enough code to pass
- Refactor only when all tests are green
- Commit after each green-refactor cycle

**Test pyramid:** 70% unit (fast, cheap, many), 20% integration (moderate), 10% E2E (slow, expensive, few).

**When to use TDD:** New features with clear acceptance criteria, bug fixes (write the failing test first), complex business logic, API contracts.

**When not to use TDD:** Exploratory prototyping, pure UI layout, generated/scaffolded code.

<!-- SECTION: unit-testing -->
## Unit Testing

**Arrange-Act-Assert (AAA):**
```javascript
it('should calculate total with tax', () => {
  // Arrange
  const cart = new Cart([{ price: 100, qty: 2 }]);
  // Act
  const total = cart.totalWithTax(0.1);
  // Assert
  expect(total).toBe(220);
});
```

**Naming:** `should_[expected behavior]_when_[condition]`

**Organization:** One test file per source file. `describe` blocks for grouping. Single behavior per test. No logic in tests (no if/for/while).

**Edge cases:** Empty inputs, boundary values, null/undefined, error conditions, concurrent access.

**Independence:** No execution order dependency. Each test sets up and tears down its own state. No shared mutable state. Use `beforeEach` for setup, `afterEach` for cleanup.

<!-- SECTION: integration-testing -->
## Integration Testing

**What to test:** Database queries, HTTP endpoints, message queues, external service integrations, authentication flows.

**Database tests:**
- Use test containers or separate test database
- Truncate tables between tests (not drop/recreate)
- Seed only what the specific test needs
- Never test against shared/staging environments

**API tests:** Use supertest (Node.js), httpx (Python), or equivalent:
```javascript
it('creates a user', async () => {
  const res = await request(app)
    .post('/api/users')
    .send({ name: 'Alice', email: 'alice@test.com' })
    .expect(201);
  expect(res.body.name).toBe('Alice');
});
```

**Isolation:** Each test starts with a known state. Shared test infrastructure (test DB, mock server) is OK; shared test data is not.

<!-- SECTION: test-doubles -->
## Test Doubles

**5 types:**
| Type | Purpose | Verifies |
|------|---------|----------|
| Stub | Returns canned responses | State |
| Mock | Verifies interactions were called | Behavior |
| Spy | Wraps real implementation, records calls | Both |
| Fake | Simplified working implementation | State |
| Dummy | Fills a required parameter, never used | Nothing |

**Guidelines:**
- Prefer stubs over mocks (test behavior, not implementation)
- Don't mock what you don't own (wrap external libs first)
- Max 3 mocks per test (more = design smell)
- Use fakes for repositories and external services
- Reset all doubles in `beforeEach`
```

- [ ] **Step 6: Create code-review-standards.md**

```markdown
# Code Review Standards

<!-- SECTION: review-checklist -->
## Review Checklist

**Correctness:**
- Does the code do what the story/ticket asks?
- Are edge cases handled?
- Are error paths covered?
- Is the logic correct for boundary values?

**Tests:**
- Are there tests for new behavior?
- Do tests cover happy path AND error paths?
- Are tests readable and maintainable?
- Would you know what broke if a test failed?

**Security:**
- No hardcoded secrets, API keys, or passwords
- Input validation on all user-supplied data
- No SQL injection vectors (parameterized queries)
- No XSS vectors (output encoding)
- Authentication/authorization checked on all endpoints

**Performance:**
- No N+1 queries
- No unbounded list queries (missing pagination)
- No blocking calls in hot paths
- Large data sets handled with streaming/batching

**Readability:**
- Clear variable and function names
- Functions do one thing
- No deep nesting (max 3 levels)
- No magic numbers or strings

<!-- SECTION: solid-principles -->
## SOLID Principles

**S — Single Responsibility:** A class/module has one reason to change.
**O — Open/Closed:** Open for extension, closed for modification. Use interfaces.
**L — Liskov Substitution:** Subtypes must be substitutable for their base types.
**I — Interface Segregation:** Many specific interfaces over one general-purpose interface.
**D — Dependency Inversion:** Depend on abstractions, not concretions.

**In practice:** If a function takes 5+ parameters, it's probably doing too much. If a file is over 300 lines, consider splitting. If a change to module A requires changes to modules B and C, coupling is too tight.

<!-- SECTION: complexity-metrics -->
## Complexity Metrics

**Cyclomatic complexity:** Count decision points (if, else, case, &&, ||, ?:). Target: ≤10 per function, ≤5 for critical paths.

**Cognitive complexity:** How hard is the code to understand? Nested conditions, breaks in linear flow, and recursion add cognitive load. Target: ≤15 per function.

**Function length:** ≤30 lines (excluding blank lines and comments). If longer, extract.

**Parameter count:** ≤4 parameters. If more, use an options/config object.

**Nesting depth:** ≤3 levels. Use early returns (guard clauses) to flatten.
```

- [ ] **Step 7: Verify all 6 files exist and are under 300 lines**

Run: `wc -l _symphony/dev/skills/git-workflow.md _symphony/dev/skills/api-design.md _symphony/dev/skills/database-design.md _symphony/dev/skills/docker-workflow.md _symphony/dev/skills/testing-patterns.md _symphony/dev/skills/code-review-standards.md`

Expected: All files under 300 lines.

- [ ] **Step 8: Commit**

```bash
git add _symphony/dev/skills/git-workflow.md _symphony/dev/skills/api-design.md _symphony/dev/skills/database-design.md _symphony/dev/skills/docker-workflow.md _symphony/dev/skills/testing-patterns.md _symphony/dev/skills/code-review-standards.md
git commit -m "feat(dev): add skills batch A — git, api, database, docker, testing, code-review (Spec 7a)"
```

---

### Task 2: Skills Batch B (5 skills)

**Files:**
- Create: `_symphony/dev/skills/documentation-standards.md`
- Create: `_symphony/dev/skills/security-basics.md`
- Create: `_symphony/dev/skills/figma-integration.md`
- Create: `_symphony/dev/skills/edge-cases.md`
- Create: `_symphony/dev/skills/validation-patterns.md`

- [ ] **Step 1: Create documentation-standards.md**

```markdown
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
```

- [ ] **Step 2: Create security-basics.md**

```markdown
# Security Basics

<!-- SECTION: owasp-top-10 -->
## OWASP Top 10

1. **Injection** — Use parameterized queries. Never concatenate user input into SQL/commands.
2. **Broken Authentication** — Use established auth libraries. Enforce MFA. Rate-limit login attempts.
3. **Sensitive Data Exposure** — Encrypt at rest and in transit. Don't log PII. Mask in responses.
4. **XML External Entities** — Disable DTD processing. Use JSON over XML.
5. **Broken Access Control** — Check authorization on every request. Default deny.
6. **Security Misconfiguration** — No default passwords. Disable debug in production. Keep dependencies updated.
7. **XSS** — Encode output. Use Content-Security-Policy headers. Sanitize rich text.
8. **Insecure Deserialization** — Don't deserialize untrusted data. Use allowlists for types.
9. **Using Components with Known Vulns** — Run `npm audit` / `pip audit` / `govulncheck` in CI.
10. **Insufficient Logging** — Log auth failures, access denials, input validation failures. Include trace IDs.

<!-- SECTION: input-validation -->
## Input Validation

**Validate at system boundaries:** API endpoints, form submissions, file uploads, webhook receivers.

**Rules:**
- Validate type, length, range, format, and allowed characters
- Use schema validation (Zod, Pydantic, JSON Schema) — not manual checks
- Reject invalid input early with clear error messages
- Never trust client-side validation alone
- Sanitize before storage, encode before display

**File uploads:** Validate MIME type (not just extension), enforce size limits, scan for malware, store outside web root, generate new filenames.

<!-- SECTION: secrets-management -->
## Secrets Management

**Never commit secrets.** Use `.env` files (gitignored) for local dev. Use vault/secret manager for production.

**Detection:**
- Pre-commit hooks with `gitleaks` or `detect-secrets`
- CI pipeline secret scanning
- Regular rotation schedule

**If a secret is committed:** Rotate immediately. Rewriting git history is not sufficient — the secret was exposed the moment it was pushed.

**Environment variables:** Prefix with `APP_` or `{PROJECT}_`. Validate required env vars at startup with fail-fast.

<!-- SECTION: cors-csrf -->
## CORS & CSRF

**CORS:** Configure allowed origins explicitly. Never use `*` with credentials. Set `Access-Control-Allow-Methods` to only what's needed.

**CSRF:** Use anti-CSRF tokens for state-changing requests. Set `SameSite=Strict` or `SameSite=Lax` on cookies. Verify `Origin` header on mutations.

**Headers to set:**
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Content-Security-Policy: default-src 'self'`
- `Referrer-Policy: strict-origin-when-cross-origin`
```

- [ ] **Step 3: Create figma-integration.md**

```markdown
# Figma Integration

<!-- SECTION: design-token-extraction -->
## Design Token Extraction (W3C DTCG)

**Format:** W3C Design Token Community Group standard (JSON):
```json
{
  "color": {
    "primary": { "$value": "#d97757", "$type": "color" },
    "surface": { "$value": "#1a1a1e", "$type": "color" }
  },
  "spacing": {
    "sm": { "$value": "8px", "$type": "dimension" },
    "md": { "$value": "16px", "$type": "dimension" }
  }
}
```

**Extraction workflow:**
1. Export tokens from Figma via plugin (Tokens Studio, Figma Variables API)
2. Transform to W3C DTCG format
3. Generate platform-specific output (CSS custom properties, Tailwind config, Swift/Kotlin constants)
4. Commit generated files — they're source of truth for code

**Token categories:** Color, typography (fontFamily, fontSize, lineHeight, fontWeight), spacing, borderRadius, shadow, opacity, motion (duration, easing).

<!-- SECTION: component-specs -->
## Component Specs

**From Figma frame to code:**
1. Identify component variants (default, hover, active, disabled, error)
2. Extract dimensions (width, height, padding, gap)
3. Map typography tokens (font, size, weight, line-height, letter-spacing)
4. Note responsive breakpoints if annotated
5. Check accessibility annotations (contrast ratios, focus indicators, touch targets)

**Handoff checklist:**
- [ ] All states documented (rest, hover, focus, active, disabled, error, loading)
- [ ] Spacing uses token values, not arbitrary pixels
- [ ] Typography maps to design system scale
- [ ] Colors reference token names, not hex values
- [ ] Interaction patterns described (click, hover, keyboard, screen reader)

<!-- SECTION: asset-export -->
## Asset Export

**Icons:** Export as SVG. Optimize with SVGO. Use sprite sheets or icon components.

**Images:** Export at 1x, 2x, 3x for responsive. Use WebP/AVIF with fallbacks. Lazy-load below-fold images.

**Illustrations:** Export as SVG for scalability. Use CSS for color theming. Keep file size under 50KB per illustration.
```

- [ ] **Step 4: Create edge-cases.md**

```markdown
# Edge Cases

<!-- SECTION: boundary-analysis -->
## Boundary Analysis

**Numeric boundaries:**
- Zero, negative, max int, min int, NaN, Infinity
- Off-by-one: array length, loop bounds, pagination
- Floating point: 0.1 + 0.2 !== 0.3, use epsilon comparison or integers for money

**String boundaries:**
- Empty string vs null vs undefined
- Whitespace-only strings
- Unicode (emoji, RTL text, combining characters)
- Maximum length (database column limits, URL limits)
- Special characters: `<`, `>`, `'`, `"`, `\`, `&`, null bytes

**Collection boundaries:**
- Empty collection, single element, maximum size
- Duplicate entries
- Unsorted vs sorted assumptions
- Concurrent modification during iteration

<!-- SECTION: error-analysis -->
## Error Path Analysis

**For every operation, ask:**
1. What if the input is missing or malformed?
2. What if the dependency (DB, API, file system) is unavailable?
3. What if the operation times out?
4. What if the operation partially succeeds?
5. What if the operation is called twice (idempotency)?

**Partial failure patterns:**
- Transaction rollback for atomic operations
- Saga pattern for distributed operations
- Idempotency keys for retry-safe endpoints
- Dead letter queues for failed async processing

<!-- SECTION: timing-analysis -->
## Timing & Concurrency

**Race conditions:**
- Two users editing the same resource → optimistic locking (version column)
- Two requests creating the same unique resource → database unique constraint (not application check)
- Read-then-write without locking → lost updates

**Ordering:**
- Events arriving out of order → sequence numbers or event timestamps
- Async operations completing in unexpected order → state machines
- Clock skew between services → use logical clocks or accept bounded inconsistency

**Timeouts:**
- Every external call needs a timeout
- Cascading timeouts: inner < outer (upstream API 5s, your endpoint 10s, client 30s)
- Circuit breakers for repeated failures

<!-- SECTION: integration-edge-cases -->
## Integration Edge Cases

**API integration:** Rate limiting (implement backoff), pagination (handle zero results, handle final page), version changes (graceful degradation), network partitions (retry with idempotency).

**Database:** Connection pool exhaustion, long-running queries blocking others, deadlocks (consistent lock ordering), migration rollback on failure.

**File system:** Disk full, permission denied, file locked by another process, path too long, symlink loops.
```

- [ ] **Step 5: Create validation-patterns.md**

```markdown
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
```

- [ ] **Step 6: Verify all 5 files exist and are under 300 lines**

Run: `wc -l _symphony/dev/skills/documentation-standards.md _symphony/dev/skills/security-basics.md _symphony/dev/skills/figma-integration.md _symphony/dev/skills/edge-cases.md _symphony/dev/skills/validation-patterns.md`

Expected: All files under 300 lines.

- [ ] **Step 7: Commit**

```bash
git add _symphony/dev/skills/documentation-standards.md _symphony/dev/skills/security-basics.md _symphony/dev/skills/figma-integration.md _symphony/dev/skills/edge-cases.md _symphony/dev/skills/validation-patterns.md
git commit -m "feat(dev): add skills batch B — docs, security, figma, edge-cases, validation (Spec 7a)"
```

---

### Task 3: Knowledge Batch A — TypeScript + Angular (8 fragments)

**Files:**
- Create: `_symphony/dev/knowledge/typescript/ts-conventions.md`
- Create: `_symphony/dev/knowledge/typescript/react-patterns.md`
- Create: `_symphony/dev/knowledge/typescript/nextjs-patterns.md`
- Create: `_symphony/dev/knowledge/typescript/express-patterns.md`
- Create: `_symphony/dev/knowledge/angular/angular-conventions.md`
- Create: `_symphony/dev/knowledge/angular/angular-patterns.md`
- Create: `_symphony/dev/knowledge/angular/ngrx-state.md`
- Create: `_symphony/dev/knowledge/angular/rxjs-patterns.md`

- [ ] **Step 1: Create typescript/ts-conventions.md**

```markdown
# TypeScript — Conventions

**Principle:** Enable strict mode, use the type system expressively, organize with barrel exports and path aliases, treat types as documentation.

## Pattern Examples

### 1. Strict Mode and Utility Types
Enable `"strict": true` in tsconfig.json. Derive types from a source of truth:
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}
type CreateUserInput = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;
type UserSummary = Pick<User, 'id' | 'name'>;
type PartialUpdate = Partial<Omit<User, 'id'>>;
```

### 2. Discriminated Unions for State Machines
```typescript
type AsyncState<T, E = Error> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: E };
```
The compiler forces handling all variants in switch/if chains.

### 3. Barrel Exports and Path Aliases
```typescript
// src/features/users/index.ts
export { UserService } from './user.service';
export type { User, CreateUserInput } from './user.types';
```
Configure paths in tsconfig: `"@/features/*": ["src/features/*"]`.

## Anti-Patterns
- **`any` type** — defeats type safety. Use `unknown` and narrow with type guards.
- **Type assertions (`as`)** — skip type checking. Use type guards or overloads.
- **Enums for simple unions** — prefer `type Status = 'active' | 'inactive'` over `enum Status`.
- **Deep relative imports** — use path aliases (`@/features/users` not `../../../features/users`).
- **No strict mode** — allows implicit any, missing null checks, and unchecked indexing.

## Integration Points
- **React:** Typed props (`FC<Props>`), typed hooks (`useState<T>`), typed context
- **Next.js:** Typed route handlers, page props, metadata, middleware
- **Express:** Typed request/response (`Request<Params, ResBody, ReqBody, Query>`)
- **ESLint:** `@typescript-eslint/recommended` + `strict` configs
```

- [ ] **Step 2: Create typescript/react-patterns.md**

```markdown
# TypeScript — React Patterns

**Principle:** Components are functions that take typed props and return JSX. Prefer composition over inheritance. Server components by default, client only when interactive.

## Pattern Examples

### 1. Typed Props and Children
```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function Button({ variant, size = 'md', disabled = false, onClick, children }: ButtonProps) {
  return <button className={`btn-${variant} btn-${size}`} disabled={disabled} onClick={onClick}>{children}</button>;
}
```

### 2. Custom Hooks with Generics
```typescript
function useFetch<T>(url: string): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({ status: 'idle' });
  useEffect(() => {
    setState({ status: 'loading' });
    fetch(url).then(r => r.json()).then(data => setState({ status: 'success', data }))
      .catch(error => setState({ status: 'error', error }));
  }, [url]);
  return state;
}
```

### 3. Context with Type Safety
```typescript
interface AuthContext { user: User | null; login: (creds: Credentials) => Promise<void>; logout: () => void; }
const AuthCtx = createContext<AuthContext | null>(null);
function useAuth(): AuthContext {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be within AuthProvider');
  return ctx;
}
```

## Anti-Patterns
- **Prop drilling** — use context or composition (render props, children) for deep data
- **useEffect for derived state** — use `useMemo` or compute inline
- **Mutating state directly** — always return new references
- **Giant components** — extract custom hooks for logic, child components for UI sections
- **Index as key** — use stable unique IDs for list rendering

## Integration Points
- **React 19:** Server Components (default), `use()` hook, Actions
- **State management:** Zustand (simple), Jotai (atomic), TanStack Query (server state)
- **Testing:** React Testing Library, `render` + `screen` + `userEvent`
```

- [ ] **Step 3: Create typescript/nextjs-patterns.md**

```markdown
# TypeScript — Next.js Patterns

**Principle:** Use the framework's conventions. Server-first rendering. File-based routing. Edge-ready middleware.

## Pattern Examples

### 1. App Router with Typed Params
```typescript
// app/users/[id]/page.tsx
interface PageProps { params: Promise<{ id: string }> }
export default async function UserPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getUser(id);
  if (!user) notFound();
  return <UserProfile user={user} />;
}
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const user = await getUser(id);
  return { title: user?.name ?? 'User' };
}
```

### 2. Route Handlers
```typescript
// app/api/users/route.ts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') ?? '1');
  const users = await listUsers({ page, perPage: 20 });
  return NextResponse.json(users);
}
export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = CreateUserSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ errors: parsed.error.flatten() }, { status: 422 });
  const user = await createUser(parsed.data);
  return NextResponse.json(user, { status: 201 });
}
```

### 3. Middleware
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('session');
  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return NextResponse.next();
}
export const config = { matcher: ['/dashboard/:path*', '/api/:path*'] };
```

## Anti-Patterns
- **Client components for static content** — server components are default, use `'use client'` only for interactivity
- **Fetching in useEffect** — use server components or route handlers
- **Not using loading.tsx/error.tsx** — built-in Suspense boundaries are free
- **Hardcoded revalidation** — use `revalidateTag`/`revalidatePath` for on-demand ISR

## Integration Points
- **Rendering:** SSR (dynamic), SSG (static), ISR (revalidate), streaming (Suspense)
- **Data:** Server Actions, Route Handlers, direct DB access in server components
- **Auth:** NextAuth.js / Auth.js, middleware-based protection
```

- [ ] **Step 4: Create typescript/express-patterns.md**

```markdown
# TypeScript — Express Patterns

**Principle:** Type your middleware chain. Validate at the boundary. Keep route handlers thin — delegate to services.

## Pattern Examples

### 1. Typed Request/Response
```typescript
interface CreateUserBody { name: string; email: string; }
interface UserResponse { id: string; name: string; email: string; }

router.post<{}, UserResponse, CreateUserBody>(
  '/users',
  validateBody(CreateUserSchema),
  async (req, res) => {
    const user = await userService.create(req.body);
    res.status(201).json(user);
  }
);
```

### 2. Error Handling Middleware
```typescript
class AppError extends Error {
  constructor(public statusCode: number, message: string, public code: string) { super(message); }
}
const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ type: err.code, title: err.message, status: err.statusCode });
    return;
  }
  console.error(err);
  res.status(500).json({ type: 'INTERNAL_ERROR', title: 'Internal Server Error', status: 500 });
};
app.use(errorHandler);
```

### 3. Validation Middleware with Zod
```typescript
import { ZodSchema } from 'zod';
function validateBody<T>(schema: ZodSchema<T>): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) { res.status(422).json({ errors: result.error.flatten() }); return; }
    req.body = result.data;
    next();
  };
}
```

## Anti-Patterns
- **Business logic in route handlers** — extract to service layer
- **No error middleware** — unhandled errors crash the process
- **Trusting req.body without validation** — always validate with schema
- **Synchronous file I/O in handlers** — use `fs/promises`, never `fs.readFileSync` in request paths
- **No request timeout** — set `server.timeout` and per-route timeouts

## Integration Points
- **Auth:** Passport.js, express-jwt, or custom middleware
- **Logging:** Pino or Winston with request correlation IDs
- **Testing:** Supertest for HTTP assertions, dependency injection for services
```

- [ ] **Step 5: Create angular/angular-conventions.md**

```markdown
# Angular — Conventions

**Principle:** Follow the Angular Style Guide. Use standalone components. Leverage signals for reactivity. CLI generates consistent structure.

## Pattern Examples

### 1. Standalone Components
```typescript
@Component({
  selector: 'app-user-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="user-card">
      <h3>{{ user().name }}</h3>
      <a [routerLink]="['/users', user().id]">View Profile</a>
    </div>
  `,
})
export class UserCardComponent {
  user = input.required<User>();
}
```

### 2. Signals for State
```typescript
@Component({ ... })
export class CounterComponent {
  count = signal(0);
  doubled = computed(() => this.count() * 2);

  increment() { this.count.update(c => c + 1); }
}
```

### 3. Inject Function
```typescript
@Component({ ... })
export class UserListComponent {
  private userService = inject(UserService);
  users = toSignal(this.userService.getAll());
}
```

## Anti-Patterns
- **NgModules for new components** — use standalone components (Angular 17+)
- **Manual subscriptions without cleanup** — use `takeUntilDestroyed()` or `toSignal()`
- **Logic in templates** — extract to computed signals or pipes
- **God services** — one service per domain concern
- **Direct DOM manipulation** — use Renderer2 or template bindings

## Integration Points
- **CLI:** `ng generate component/service/pipe --standalone`
- **Testing:** TestBed + ComponentFixture, spectator for ergonomic tests
- **Build:** Esbuild (default in Angular 17+), zoneless change detection
```

- [ ] **Step 6: Create angular/angular-patterns.md**

```markdown
# Angular — Patterns

**Principle:** Reactive first. Declarative templates. Dependency injection for composition. Lazy-load routes for performance.

## Pattern Examples

### 1. Reactive Forms with Validation
```typescript
@Component({ ... })
export class UserFormComponent {
  private fb = inject(NonNullableFormBuilder);
  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    role: ['user' as 'user' | 'admin'],
  });

  onSubmit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const value = this.form.getRawValue();
    // value is fully typed: { name: string; email: string; role: 'user' | 'admin' }
  }
}
```

### 2. Route Guards (Functional)
```typescript
export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isAuthenticated() ? true : router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
// Usage: { path: 'dashboard', canActivate: [authGuard], component: DashboardComponent }
```

### 3. HTTP Interceptors (Functional)
```typescript
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).getToken();
  if (token) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
  return next(req);
};
// provideHttpClient(withInterceptors([authInterceptor]))
```

## Anti-Patterns
- **Class-based guards/interceptors** — use functional (Angular 16+)
- **Subscribing in components to set properties** — use `async` pipe or `toSignal()`
- **Barrel exports that import entire modules** — tree-shaking can't help
- **Deeply nested route configs** — flatten with `loadChildren` for lazy loading

## Integration Points
- **State:** NgRx (complex), NGXS (simpler), or signal-based stores
- **HTTP:** HttpClient with typed responses, interceptors for auth/logging/retry
- **Testing:** HttpClientTestingModule, RouterTestingModule, fakeAsync/tick for timers
```

- [ ] **Step 7: Create angular/ngrx-state.md**

```markdown
# Angular — NgRx State Management

**Principle:** Single source of truth. State is read-only. Changes via pure reducers. Side effects in Effects. Select with memoized selectors.

## Pattern Examples

### 1. Feature Store Setup
```typescript
// users.state.ts
export interface UsersState { users: User[]; loading: boolean; error: string | null; }
const initialState: UsersState = { users: [], loading: false, error: null };

export const usersFeature = createFeature({
  name: 'users',
  reducer: createReducer(
    initialState,
    on(UsersActions.load, (state) => ({ ...state, loading: true, error: null })),
    on(UsersActions.loadSuccess, (state, { users }) => ({ ...state, users, loading: false })),
    on(UsersActions.loadFailure, (state, { error }) => ({ ...state, error, loading: false })),
  ),
});
```

### 2. Effects for Side Effects
```typescript
export const loadUsers = createEffect(
  (actions$ = inject(Actions), userService = inject(UserService)) =>
    actions$.pipe(
      ofType(UsersActions.load),
      switchMap(() => userService.getAll().pipe(
        map(users => UsersActions.loadSuccess({ users })),
        catchError(error => of(UsersActions.loadFailure({ error: error.message }))),
      )),
    ),
  { functional: true }
);
```

### 3. Selectors with Composition
```typescript
export const { selectUsers, selectLoading, selectError } = usersFeature;
export const selectActiveUsers = createSelector(selectUsers, users => users.filter(u => u.isActive));
export const selectUserCount = createSelector(selectUsers, users => users.length);
```

## Anti-Patterns
- **Storing derived data** — use selectors to compute derived values
- **Effects that dispatch multiple actions** — use single action with reducer handling
- **Direct store mutation** — always return new state objects
- **Over-using NgRx** — local component state (signals) is fine for UI-only state
- **Entity management without EntityAdapter** — use `@ngrx/entity` for CRUD collections

## Integration Points
- **DevTools:** `@ngrx/store-devtools` for time-travel debugging
- **Router:** `@ngrx/router-store` for router state in store
- **Entity:** `@ngrx/entity` for normalized collections with CRUD helpers
```

- [ ] **Step 8: Create angular/rxjs-patterns.md**

```markdown
# Angular — RxJS Patterns

**Principle:** Think in streams. Use operators to transform, not subscribe-and-set. Handle errors at the stream level. Prevent memory leaks.

## Pattern Examples

### 1. Flattening Operators (Choose Correctly)
```typescript
// switchMap: cancel previous (search/typeahead)
searchTerm$.pipe(
  debounceTime(300),
  distinctUntilChanged(),
  switchMap(term => this.searchService.search(term))
);
// mergeMap: parallel (fire-and-forget notifications)
notification$.pipe(mergeMap(n => this.notificationService.send(n)));
// concatMap: sequential (ordered queue processing)
queue$.pipe(concatMap(item => this.processService.handle(item)));
// exhaustMap: ignore while busy (form submit)
submitClick$.pipe(exhaustMap(() => this.formService.submit(this.form.value)));
```

### 2. Error Recovery
```typescript
this.http.get<User[]>('/api/users').pipe(
  retry({ count: 3, delay: (error, retryCount) => timer(retryCount * 1000) }),
  catchError(error => {
    console.error('Failed after retries:', error);
    return of([] as User[]); // fallback value
  })
);
```

### 3. Combining Streams
```typescript
// Wait for all, emit latest of each
combineLatest([user$, permissions$, settings$]).pipe(
  map(([user, permissions, settings]) => ({ user, permissions, settings }))
);
// Wait for all, emit once
forkJoin({ user: getUser(id), orders: getOrders(id) });
```

## Anti-Patterns
- **Nested subscribes** — use flattening operators (switchMap, mergeMap, concatMap)
- **Not unsubscribing** — use `takeUntilDestroyed()`, `async` pipe, or `toSignal()`
- **Using `subscribe()` to set component properties** — pipe to template with `async` or `toSignal()`
- **catchError without returning observable** — must return `Observable` or rethrow with `throwError`
- **tap() for side effects that modify state** — tap is for logging/debugging, not state mutation

## Integration Points
- **Angular Signals:** Bridge with `toSignal()` (Observable → Signal) and `toObservable()` (Signal → Observable)
- **Testing:** `TestScheduler` for marble testing, `fakeAsync`/`tick` for time-based operators
- **HTTP:** HttpClient returns Observables — pipe directly, don't subscribe-and-set
```

- [ ] **Step 9: Verify all 8 files exist and are under 150 lines**

Run: `find _symphony/dev/knowledge/typescript _symphony/dev/knowledge/angular -name '*.md' | xargs wc -l`

Expected: 8 files, each under 150 lines.

- [ ] **Step 10: Commit**

```bash
git add _symphony/dev/knowledge/typescript/ _symphony/dev/knowledge/angular/
git commit -m "feat(dev): add knowledge fragments — TypeScript (4) + Angular (4) (Spec 7a)"
```

---

### Task 4: Knowledge Batch B — Flutter + Python + Go (11 fragments)

**Files:**
- Create: `_symphony/dev/knowledge/flutter/dart-conventions.md`
- Create: `_symphony/dev/knowledge/flutter/widget-patterns.md`
- Create: `_symphony/dev/knowledge/flutter/state-management.md`
- Create: `_symphony/dev/knowledge/flutter/platform-channels.md`
- Create: `_symphony/dev/knowledge/python/python-conventions.md`
- Create: `_symphony/dev/knowledge/python/django-patterns.md`
- Create: `_symphony/dev/knowledge/python/fastapi-patterns.md`
- Create: `_symphony/dev/knowledge/python/data-pipelines.md`
- Create: `_symphony/dev/knowledge/go/go-conventions.md`
- Create: `_symphony/dev/knowledge/go/go-stdlib-patterns.md`
- Create: `_symphony/dev/knowledge/go/go-testing-patterns.md`

Each fragment follows the same format: H1 title, Principle, Pattern Examples (3), Anti-Patterns, Integration Points. Each under 150 lines. Due to the length of this plan, the exact content for each fragment is specified by its title and focus area in the spec. The agent implementing this task must write each fragment following the pattern established by the TypeScript and Angular fragments in Task 3.

**Fragment specifications:**

| File | Focus Areas |
|------|-------------|
| flutter/dart-conventions.md | Null safety, extensions, code generation (build_runner, freezed), linting rules |
| flutter/widget-patterns.md | Composition over inheritance, keys, builders, slivers, custom painters |
| flutter/state-management.md | Riverpod, BLoC, provider patterns, state restoration |
| flutter/platform-channels.md | Method channels, event channels, pigeon code gen, platform-specific code |
| python/python-conventions.md | PEP 8, type hints, protocols, src layout, tooling (ruff, mypy, pytest) |
| python/django-patterns.md | Models, views, serializers, signals, admin, migrations |
| python/fastapi-patterns.md | Dependency injection, Pydantic models, async routes, middleware, OpenAPI |
| python/data-pipelines.md | ETL patterns, pandas, async processing, error recovery, idempotency |
| go/go-conventions.md | Package layout, error handling (no exceptions), interfaces, naming, go vet |
| go/go-stdlib-patterns.md | net/http, context propagation, io.Reader/Writer, encoding/json, sync |
| go/go-testing-patterns.md | Table-driven tests, testify, httptest, benchmarks, test fixtures |

- [ ] **Step 1: Create all 4 Flutter knowledge fragments**

Follow the exact format from Task 3 (H1, Principle, 3 Pattern Examples with code blocks, Anti-Patterns list, Integration Points). Each file under 150 lines.

- [ ] **Step 2: Create all 4 Python knowledge fragments**

Same format. Python code examples using modern Python 3.12+ with type hints.

- [ ] **Step 3: Create all 3 Go knowledge fragments**

Same format. Go code examples following standard Go conventions.

- [ ] **Step 4: Verify all 11 files exist and are under 150 lines**

Run: `find _symphony/dev/knowledge/flutter _symphony/dev/knowledge/python _symphony/dev/knowledge/go -name '*.md' | xargs wc -l`

Expected: 11 files, each under 150 lines.

- [ ] **Step 5: Commit**

```bash
git add _symphony/dev/knowledge/flutter/ _symphony/dev/knowledge/python/ _symphony/dev/knowledge/go/
git commit -m "feat(dev): add knowledge fragments — Flutter (4) + Python (4) + Go (3) (Spec 7a)"
```

---

## Wave 2 — Agents (2 parallel agents)

---

### Task 5: Base Dev Template + Mobile Dev Agent

**Files:**
- Create: `_symphony/dev/agents/_base-dev.md`
- Create: `_symphony/dev/agents/mobile-dev.md`

- [ ] **Step 1: Create _base-dev.md**

```markdown
---
id: _base-dev
name: Base Developer
role: Developer (abstract)
model: opus
max_lines: 200
---

<base-dev id="_base-dev" type="abstract">
  <purpose>Abstract template inherited by all developer agents. Defines shared story execution protocol, TDD cycle, file tracking, and quality gates. Never instantiated directly.</purpose>

  <story-execution-protocol>
    <step n="1" title="Load story and verify pre-start gate">
      Read the story file. Verify status is ready-for-dev. Verify all depends_on stories are done. Load architecture doc and relevant knowledge fragments.
    </step>
    <step n="2" title="Detect stack and load knowledge">
      Check project root for stack markers (package.json, angular.json, pubspec.yaml, pyproject.toml, go.mod). Load matching knowledge tier from _symphony/dev/knowledge/{language}/. Load relevant skills from _symphony/dev/skills/.
    </step>
    <step n="3" title="Plan subtasks">
      Decompose the story into subtasks. Each subtask targets one file or one logical unit. Estimate: one subtask per acceptance criterion.
    </step>
    <step n="4" title="RED — Write failing test">
      For each subtask, write the test first. The test describes the expected behavior from the acceptance criteria. Run the test to confirm it fails.
    </step>
    <step n="5" title="GREEN — Write minimum passing code">
      Write only enough code to make the failing test pass. No extra features, no premature abstractions.
    </step>
    <step n="6" title="REFACTOR — Improve while green">
      Improve code structure, naming, and duplication while all tests remain green. Run tests after every change.
    </step>
    <step n="7" title="Checkpoint">
      Write checkpoint to _symphony/_memory/checkpoints/{story-key}.yaml with: workflow_id, step, files_touched (path + sha256), status.
    </step>
    <step n="8" title="Commit and update status">
      Stage changed files. Commit with conventional commit format: type(scope): description. Update story status. If all subtasks done, mark story as review.
    </step>
  </story-execution-protocol>

  <file-tracking>
    Maintain a file change list. For every file created, modified, or deleted, record: path, action (create/modify/delete), sha256 checksum, ISO 8601 timestamp. Include this list in the checkpoint and in the story file's Files Changed section.
  </file-tracking>

  <skill-loading>
    Skills are loaded JIT from _symphony/dev/skills/. Load only the sections needed for the current subtask. Drop loaded sections after the subtask completes to stay within context budget.
  </skill-loading>

  <quality-gates>
    <pre-start>
      - Story status is ready-for-dev
      - All depends_on stories are done
      - Architecture doc exists (for non-quick-dev workflows)
    </pre-start>
    <post-complete>
      - All subtasks completed
      - All tests passing
      - Files tracked with checksums
      - Conventional commit created
      - Story status updated to review
    </post-complete>
  </quality-gates>

  <findings-protocol>
    Out-of-scope discoveries are logged in a Findings table in the story file. Format: | Finding | Severity | Recommendation |. Findings are NOT fixed inline — they become backlog items. Only blocking findings (security vulnerabilities, data loss risks) halt the story.
  </findings-protocol>
</base-dev>
```

- [ ] **Step 2: Create mobile-dev.md**

```markdown
---
id: mobile-dev
name: Mobile Developer
role: Mobile Developer
model: opus
max_lines: 200
---

<agent id="mobile-dev" role="Mobile Developer">
  <persona>
    <identity>Implements mobile features across React Native, Expo, Flutter, Kotlin, and Swift. Navigates platform-specific constraints — simulators, app lifecycle, code signing, push notifications, and platform UI guidelines. Tests on real devices, not just simulators.</identity>
    <expertise>
      - React Native and Expo (managed and bare workflows)
      - Flutter and Dart (widget composition, platform channels)
      - Kotlin (Android Jetpack Compose, coroutines)
      - Swift (SwiftUI, Combine, async/await)
      - Mobile navigation patterns (stack, tab, drawer, modal)
      - App lifecycle management (foreground, background, killed states)
      - Platform-specific UI (iOS HIG, Android Material Design 3)
      - Code signing and app store deployment
      - Push notifications (APNs, FCM)
      - Mobile performance (launch time, memory, battery)
    </expertise>
    <operating-mode>Activated for mobile stories. Inherits story execution protocol from _base-dev.md. Detects mobile framework from project markers (pubspec.yaml for Flutter, react-native in package.json for RN). Loads matching knowledge tier. Yields to Reviewer for code review.</operating-mode>
  </persona>

  <base-dev ref="_symphony/dev/agents/_base-dev.md"/>

  <knowledge-sources>
    <trusted>
      <source>Story file (docs/implementation-artifacts/stories/)</source>
      <source>Architecture doc (docs/planning-artifacts/architecture.md)</source>
      <source>CLAUDE.md project rules</source>
      <source>Knowledge fragments: flutter/, typescript/ts-conventions.md, typescript/react-patterns.md</source>
    </trusted>
    <verify>
      <source>Platform documentation (Apple Developer, Android Developer)</source>
      <source>Codebase patterns and conventions</source>
      <source>Third-party library documentation</source>
    </verify>
    <untrusted>
      <source>Simulator-only test results (must verify on device)</source>
      <source>Platform-specific error logs without reproduction</source>
      <source>AI-generated mobile code suggestions</source>
    </untrusted>
  </knowledge-sources>

  <skills-registry>
    <default>git-workflow, testing-patterns, code-review-standards, security-basics</default>
    <on-demand>edge-cases, figma-integration</on-demand>
  </skills-registry>

  <disciplines>
    <self-critique threshold="0.85"/>
    <anti-rationalization>
      <excuse>The simulator is close enough to a real device</excuse>
      <rebuttal>Test on real devices for performance, gestures, and push notifications. Simulators hide memory pressure, thermal throttling, and network variability.</rebuttal>
      <excuse>Platform-specific code can wait until later</excuse>
      <rebuttal>Platform differences caught late cause double rework. Address platform branching at architecture time, not as an afterthought.</rebuttal>
      <excuse>We can handle permissions later</excuse>
      <rebuttal>Permission flows affect navigation architecture and user experience. Design the permission request flow upfront.</rebuttal>
    </anti-rationalization>
  </disciplines>

  <workflows-owned>
    <workflow>dev-story</workflow>
    <workflow>quick-dev</workflow>
  </workflows-owned>

  <memory-sidecar path="_symphony/_memory/mobile-dev-sidecar/"/>
</agent>
```

- [ ] **Step 3: Verify both files exist and are under 200 lines**

Run: `wc -l _symphony/dev/agents/_base-dev.md _symphony/dev/agents/mobile-dev.md`

Expected: Both under 200 lines.

- [ ] **Step 4: Commit**

```bash
git add _symphony/dev/agents/_base-dev.md _symphony/dev/agents/mobile-dev.md
git commit -m "feat(dev): add _base-dev template and mobile-dev agent (Spec 7a)"
```

---

### Task 6: Enhance Existing Developer Agent

**Files:**
- Modify: `_symphony/lifecycle/agents/developer.md`

- [ ] **Step 1: Add base-dev reference, skills-registry, and knowledge-detection to developer.md**

Add after the closing `</disciplines>` tag and before `<workflows-owned>`:

```xml
  <base-dev ref="_symphony/dev/agents/_base-dev.md"/>

  <skills-registry>
    <default>git-workflow, testing-patterns, code-review-standards, security-basics</default>
    <on-demand>api-design, database-design, docker-workflow, documentation-standards, figma-integration, edge-cases, validation-patterns</on-demand>
  </skills-registry>

  <knowledge-detection>
    <stack marker="angular.json" tier="typescript,angular"/>
    <stack marker="next.config.mjs" tier="typescript"/>
    <stack marker="next.config.ts" tier="typescript"/>
    <stack marker="package.json" tier="typescript"/>
    <stack marker="pubspec.yaml" tier="flutter"/>
    <stack marker="pyproject.toml" tier="python"/>
    <stack marker="setup.py" tier="python"/>
    <stack marker="requirements.txt" tier="python"/>
    <stack marker="go.mod" tier="go"/>
  </knowledge-detection>
```

- [ ] **Step 2: Verify the file is still under 200 lines**

Run: `wc -l _symphony/lifecycle/agents/developer.md`

Expected: Under 200 lines.

- [ ] **Step 3: Commit**

```bash
git add _symphony/lifecycle/agents/developer.md
git commit -m "feat(dev): enhance developer agent with skills-registry and knowledge-detection (Spec 7a)"
```

---

## Wave 3 — Tests + Config (1 agent)

---

### Task 7: Test Files + Structure Updates + Manifest Bump

**Files:**
- Create: `tests/agents-dev.test.js`
- Create: `tests/skills.test.js`
- Create: `tests/knowledge.test.js`
- Modify: `tests/structure.test.js`
- Modify: `_symphony/_config/manifest.yaml`

- [ ] **Step 1: Create tests/agents-dev.test.js**

```javascript
import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const root = resolve(dirname(__filename), '..');
const readText = (p) => readFileSync(resolve(root, p), 'utf8');

describe('Dev Agent: _base-dev (Spec 7a)', () => {
  const path = '_symphony/dev/agents/_base-dev.md';

  it('exists', () => {
    expect(existsSync(resolve(root, path))).toBe(true);
  });

  it('is under 200 lines', () => {
    const lines = readText(path).split('\n').length;
    expect(lines).toBeLessThanOrEqual(200);
  });

  it('has YAML frontmatter with id and type abstract', () => {
    const text = readText(path);
    expect(text).toMatch(/^---\n/);
    expect(text).toContain('id: _base-dev');
  });

  it('has story-execution-protocol', () => {
    expect(readText(path)).toContain('<story-execution-protocol>');
  });

  it('has file-tracking section', () => {
    expect(readText(path)).toContain('<file-tracking>');
  });

  it('has quality-gates with pre-start and post-complete', () => {
    const text = readText(path);
    expect(text).toContain('<quality-gates>');
    expect(text).toContain('<pre-start>');
    expect(text).toContain('<post-complete>');
  });

  it('has findings-protocol', () => {
    expect(readText(path)).toContain('<findings-protocol>');
  });

  it('has skill-loading section', () => {
    expect(readText(path)).toContain('<skill-loading>');
  });
});

describe('Dev Agent: mobile-dev (Spec 7a)', () => {
  const path = '_symphony/dev/agents/mobile-dev.md';

  it('exists', () => {
    expect(existsSync(resolve(root, path))).toBe(true);
  });

  it('is under 200 lines', () => {
    const lines = readText(path).split('\n').length;
    expect(lines).toBeLessThanOrEqual(200);
  });

  it('has YAML frontmatter with id, name, role, model, max_lines', () => {
    const text = readText(path);
    expect(text).toMatch(/^---\n/);
    expect(text).toContain('id: mobile-dev');
    expect(text).toContain('model: opus');
    expect(text).toContain('max_lines: 200');
  });

  it('contains <agent id="mobile-dev"', () => {
    expect(readText(path)).toContain('<agent id="mobile-dev"');
  });

  it('has <persona> with identity, expertise, operating-mode', () => {
    const text = readText(path);
    expect(text).toContain('<persona>');
    expect(text).toContain('<identity>');
    expect(text).toContain('<expertise>');
    expect(text).toContain('<operating-mode>');
  });

  it('has <knowledge-sources> with all 3 trust levels', () => {
    const text = readText(path);
    expect(text).toContain('<knowledge-sources>');
    expect(text).toContain('<trusted>');
    expect(text).toContain('<verify>');
    expect(text).toContain('<untrusted>');
  });

  it('has <disciplines> with self-critique and anti-rationalization', () => {
    const text = readText(path);
    expect(text).toContain('<disciplines>');
    expect(text).toContain('<self-critique');
    expect(text).toContain('<anti-rationalization>');
  });

  it('has at least 2 excuse-rebuttal pairs', () => {
    const excuses = readText(path).match(/<excuse>/g) || [];
    expect(excuses.length).toBeGreaterThanOrEqual(2);
  });

  it('has <workflows-owned> with at least one workflow', () => {
    const text = readText(path);
    expect(text).toContain('<workflows-owned>');
    const workflows = text.match(/<workflow>/g) || [];
    expect(workflows.length).toBeGreaterThanOrEqual(1);
  });

  it('has <memory-sidecar>', () => {
    expect(readText(path)).toContain('<memory-sidecar');
  });

  it('has <base-dev ref=', () => {
    expect(readText(path)).toContain('<base-dev ref=');
  });

  it('has <skills-registry>', () => {
    expect(readText(path)).toContain('<skills-registry>');
  });

  it('does NOT contain activation menus or greeting', () => {
    const text = readText(path);
    expect(text).not.toMatch(/<activation/i);
    expect(text).not.toMatch(/<menu/i);
    expect(text).not.toMatch(/greet.*user/i);
  });
});

describe('Existing developer agent enhancement (Spec 7a)', () => {
  const path = '_symphony/lifecycle/agents/developer.md';

  it('has <base-dev ref= reference', () => {
    expect(readText(path)).toContain('<base-dev ref=');
  });

  it('has <skills-registry>', () => {
    expect(readText(path)).toContain('<skills-registry>');
  });

  it('has <knowledge-detection>', () => {
    expect(readText(path)).toContain('<knowledge-detection>');
  });

  it('is still under 200 lines', () => {
    const lines = readText(path).split('\n').length;
    expect(lines).toBeLessThanOrEqual(200);
  });
});
```

- [ ] **Step 2: Create tests/skills.test.js**

```javascript
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const root = resolve(dirname(__filename), '..');
const readText = (p) => readFileSync(resolve(root, p), 'utf8');

const skills = [
  'git-workflow',
  'api-design',
  'database-design',
  'docker-workflow',
  'testing-patterns',
  'code-review-standards',
  'documentation-standards',
  'security-basics',
  'figma-integration',
  'edge-cases',
  'validation-patterns',
];

describe('Dev Skills inventory (Spec 7a)', () => {
  it('has exactly 11 skill files', () => {
    const dir = resolve(root, '_symphony/dev/skills');
    const files = readdirSync(dir).filter(f => f.endsWith('.md'));
    expect(files.length).toBe(11);
  });
});

for (const skill of skills) {
  describe(`Skill: ${skill} (Spec 7a)`, () => {
    const path = `_symphony/dev/skills/${skill}.md`;

    it('exists', () => {
      expect(existsSync(resolve(root, path))).toBe(true);
    });

    it('is under 300 lines', () => {
      const lines = readText(path).split('\n').length;
      expect(lines).toBeLessThanOrEqual(300);
    });

    it('has H1 title', () => {
      expect(readText(path)).toMatch(/^# /m);
    });

    it('has at least 2 SECTION markers', () => {
      const sections = readText(path).match(/<!-- SECTION: /g) || [];
      expect(sections.length).toBeGreaterThanOrEqual(2);
    });

    it('has at least 2 H2 headings', () => {
      const headings = readText(path).match(/^## /gm) || [];
      expect(headings.length).toBeGreaterThanOrEqual(2);
    });
  });
}
```

- [ ] **Step 3: Create tests/knowledge.test.js**

```javascript
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const root = resolve(dirname(__filename), '..');
const readText = (p) => readFileSync(resolve(root, p), 'utf8');

const languages = [
  { dir: 'typescript', count: 4, fragments: ['ts-conventions', 'react-patterns', 'nextjs-patterns', 'express-patterns'] },
  { dir: 'angular', count: 4, fragments: ['angular-conventions', 'angular-patterns', 'ngrx-state', 'rxjs-patterns'] },
  { dir: 'flutter', count: 4, fragments: ['dart-conventions', 'widget-patterns', 'state-management', 'platform-channels'] },
  { dir: 'python', count: 4, fragments: ['python-conventions', 'django-patterns', 'fastapi-patterns', 'data-pipelines'] },
  { dir: 'go', count: 3, fragments: ['go-conventions', 'go-stdlib-patterns', 'go-testing-patterns'] },
];

describe('Knowledge fragment directories (Spec 7a)', () => {
  it('has 5 language directories', () => {
    const dir = resolve(root, '_symphony/dev/knowledge');
    const dirs = readdirSync(dir, { withFileTypes: true }).filter(d => d.isDirectory());
    expect(dirs.length).toBe(5);
  });

  it('has 19 total knowledge fragments', () => {
    let total = 0;
    for (const lang of languages) {
      const dir = resolve(root, `_symphony/dev/knowledge/${lang.dir}`);
      const files = readdirSync(dir).filter(f => f.endsWith('.md'));
      total += files.length;
    }
    expect(total).toBe(19);
  });
});

for (const lang of languages) {
  describe(`Knowledge: ${lang.dir}/ (Spec 7a)`, () => {
    it(`has ${lang.count} fragments`, () => {
      const dir = resolve(root, `_symphony/dev/knowledge/${lang.dir}`);
      const files = readdirSync(dir).filter(f => f.endsWith('.md'));
      expect(files.length).toBe(lang.count);
    });

    for (const fragment of lang.fragments) {
      const path = `_symphony/dev/knowledge/${lang.dir}/${fragment}.md`;

      describe(`Fragment: ${fragment}`, () => {
        it('exists', () => {
          expect(existsSync(resolve(root, path))).toBe(true);
        });

        it('is under 150 lines', () => {
          const lines = readText(path).split('\n').length;
          expect(lines).toBeLessThanOrEqual(150);
        });

        it('has H1 title', () => {
          expect(readText(path)).toMatch(/^# /m);
        });

        it('has Pattern Examples section', () => {
          expect(readText(path)).toContain('## Pattern Examples');
        });

        it('has Anti-Patterns section', () => {
          expect(readText(path)).toContain('## Anti-Patterns');
        });

        it('has Integration Points section', () => {
          expect(readText(path)).toContain('## Integration Points');
        });
      });
    }
  });
}
```

- [ ] **Step 4: Update tests/structure.test.js — add dev module assertions**

Add a new `describe` block after the existing `_symphony/creative` section (after line 152):

```javascript
  describe('_symphony/dev — agents, skills, knowledge (Spec 7a)', () => {
    it('has _base-dev.md', () => {
      expect(exists('_symphony/dev/agents/_base-dev.md')).toBe(true);
    });
    it('has mobile-dev.md', () => {
      expect(exists('_symphony/dev/agents/mobile-dev.md')).toBe(true);
    });

    const skills = [
      'git-workflow', 'api-design', 'database-design', 'docker-workflow',
      'testing-patterns', 'code-review-standards', 'documentation-standards',
      'security-basics', 'figma-integration', 'edge-cases', 'validation-patterns',
    ];
    for (const s of skills) {
      it(`has skill ${s}`, () => {
        expect(exists(`_symphony/dev/skills/${s}.md`)).toBe(true);
      });
    }

    const knowledgeDirs = ['typescript', 'angular', 'flutter', 'python', 'go'];
    for (const d of knowledgeDirs) {
      it(`has knowledge/${d} directory`, () => {
        expect(exists(`_symphony/dev/knowledge/${d}`)).toBe(true);
      });
    }
  });
```

- [ ] **Step 5: Bump manifest.yaml dev version**

Change in `_symphony/_config/manifest.yaml`:

```yaml
  dev:
    version: "0.0.2-alpha.1"
    description: "Developer agents, skills, knowledge fragments"
```

- [ ] **Step 6: Run full test suite**

Run: `npm test`

Expected: All tests pass. New test count should be approximately 1030 (870 existing + ~160 new).

- [ ] **Step 7: Commit**

```bash
git add tests/agents-dev.test.js tests/skills.test.js tests/knowledge.test.js tests/structure.test.js _symphony/_config/manifest.yaml
git commit -m "test(dev): add dev module tests, update structure assertions, bump to 0.0.2-alpha.1 (Spec 7a)"
```

---

## Post-Implementation

- [ ] **Final verification: Run `npm test` and confirm all tests pass**
- [ ] **Update comparison dashboard if desired**
- [ ] **Proceed to Spec 7b (Testing Module) or Spec 7c (Utility Agents)**
