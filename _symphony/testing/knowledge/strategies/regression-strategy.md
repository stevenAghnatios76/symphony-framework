# Regression Strategy — Efficient Change Verification

**Principle:** Run the right tests after every change — use test impact analysis to select relevant tests, manage flaky tests as first-class defects, and continuously prune the suite to keep feedback fast.

## Pattern Examples

### 1. Test Impact Analysis for Selective Execution
Map source files to tests that cover them, then run only affected tests:
```bash
# Generate coverage mapping (one-time, cached)
npx jest --coverage --coverageReporters=json
# Produces: coverage/coverage-final.json mapping files -> tests

# On a PR, select tests covering changed files
CHANGED=$(git diff --name-only origin/main...HEAD)
npx jest --findRelatedTests $CHANGED

# For Python with pytest-testmon
pytest --testmon  # only runs tests affected by code changes
```
This cuts CI time from 15 minutes to 2 minutes on typical PRs.

### 2. Flaky Test Quarantine
Isolate flaky tests instead of letting them erode trust in the suite:
```typescript
// Tag flaky tests with a marker and track them
describe.skip('FLAKY: payment webhook race condition', () => {
  // TODO(#1234): fix timing dependency on webhook callback
  it('processes webhook before timeout', async () => { /* ... */ });
});

// In CI config, run quarantined tests separately
// jest.config.ts
export default {
  projects: [
    { displayName: 'stable', testPathIgnorePatterns: ['flaky'] },
    { displayName: 'quarantine', testMatch: ['**/flaky/**'] },
  ],
};
```
Quarantined tests run but do not block the pipeline. Fix or delete within 2 sprints.

### 3. Test Suite Optimization
Remove redundant and slow tests periodically:
```bash
# Find slowest tests
npx jest --verbose 2>&1 | sort -t'(' -k2 -rn | head -20

# Find tests that never fail (candidates for removal or demotion)
# Parse CI history for tests with 100% pass rate over 6 months
gh run list --limit 100 --json conclusion | \
  jq '[.[] | select(.conclusion=="success")] | length'

# Merge overlapping integration tests
# Before: 3 tests each setting up a user + DB
# After: 1 parameterized test with shared setup
test.each([
  ['admin', 'can delete'],
  ['viewer', 'cannot delete'],
  ['editor', 'can edit'],
])('role %s %s resources', async (role, action) => { /* ... */ });
```

## Anti-Patterns
- **Run everything always** — full suite on every PR kills developer velocity. Use impact analysis to select.
- **Retry-and-ignore flaky tests** — auto-retrying hides real bugs and normalizes unreliable tests. Fix or quarantine instead.
- **Never pruning the suite** — test suites only grow. Schedule quarterly reviews to delete obsolete and redundant tests.
- **No test ownership** — unowned tests decay fastest. Assign test directories to teams via CODEOWNERS.

## Integration Points
- **CI caching:** Cache coverage maps and test-file dependency graphs between runs
- **pytest-testmon / Jest --changedSince:** Built-in change detection for selective test runs
- **Flaky dashboards:** Tools like BuildPulse or Datadog CI Visibility track flake rates over time
- **CODEOWNERS:** Map test directories to team owners for accountability on flaky and stale tests
