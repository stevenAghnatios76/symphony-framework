# Vault Query Patterns

**Principle:** Query the codebase knowledge graph for structural relationships — dependencies, coverage, and change impact — rather than grepping text.

## Pattern Examples

### Dependency Impact Query
Find everything that depends on a module before changing it:
```yaml
query: by-dependency-chain
root: "src/auth/session.ts"
direction: dependents
depth: 3
```
Returns: all files, functions, and tests that transitively depend on session.ts.

### Coverage Gap Query
Find functions with no test coverage:
```yaml
query: by-node-type
type: function
filter: "NOT EXISTS edge(tests, *, this)"
```
Returns: functions that have no inbound `tests` edge from any test node.

### Change Impact Query
Given a set of changed files, find affected tests:
```yaml
query: by-edge-type
edge: tests
direction: inbound
targets: ["src/api/routes.ts", "src/api/middleware.ts"]
```
Returns: all test nodes that cover the changed files.

## Anti-Patterns

- Over-indexing generated files — index source, not build output
- Querying a stale index — always check `last_indexed` before trusting results
- Using vault instead of reading the file — vault gives structure, not content; read the file for implementation details
- Indexing without ignore patterns — node_modules alone can produce millions of nodes
- Treating vault as the only truth — vault supplements, never replaces, reading code

## Integration Points

- **explore-codebase workflow** — uses vault queries to map architecture
- **test-architect** — uses coverage gap queries to prioritize test writing
- **developer agent** — uses dependency impact queries before refactoring
- **memory-hygiene protocol** — vault index is cleaned on the configured cadence
