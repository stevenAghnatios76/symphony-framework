# Mutation Testing — Test Suite Quality Measurement

**Principle:** Introduce small faults (mutants) into production code and verify that tests detect them — surviving mutants reveal tests that pass without truly validating behavior.

## Pattern Examples

### 1. Stryker for JavaScript/TypeScript
Configure Stryker to mutate source files and run tests against each mutant:
```javascript
// stryker.config.mjs
export default {
  mutate: ['src/**/*.ts', '!src/**/*.spec.ts'],
  testRunner: 'vitest',
  reporters: ['html', 'clear-text', 'progress'],
  thresholds: { high: 80, low: 60, break: 50 },
  coverageAnalysis: 'perTest',
};
// Run: npx stryker run
// Output: Mutation score: 78% (234 killed, 66 survived, 300 total)
```

### 2. mutmut for Python
Run mutation testing against a pytest suite:
```bash
# Install and run
pip install mutmut
mutmut run --paths-to-mutate=src/ --tests-dir=tests/

# Inspect surviving mutants
mutmut results
# Survived mutants:
#   src/pricing.py:12 — replaced > with >=
#   src/pricing.py:25 — replaced + with -

# Show the specific mutation
mutmut show 1
# --- a/src/pricing.py  +++ b/src/pricing.py
# -    if total > 100:
# +    if total >= 100:
```
A survived `>` to `>=` mutant means no test covers the boundary at exactly 100.

### 3. Analyzing Surviving Mutants
Each survivor points to a missing assertion. Write targeted tests:
```typescript
// BEFORE: mutant "replaced > with >=" survived in discount.ts line 8
//   if (total > 100) { return total * 0.1; }

// FIX: add boundary test
it('returns 0 discount for exactly $100', () => {
  expect(calculateDiscount(100)).toBe(0);  // kills the >= mutant
});

it('applies discount for $100.01', () => {
  expect(calculateDiscount(100.01)).toBeCloseTo(10.001);
});
```

## Anti-Patterns
- **Running on entire codebase** — mutation testing is slow. Target high-risk modules first and expand gradually.
- **Chasing 100% mutation score** — some mutants are equivalent (same behavior). Accept 80%+ and triage survivors.
- **Ignoring survived mutants** — running mutation testing without acting on results is wasted compute. Fix or document each survivor.
- **No incremental mode** — re-mutating unchanged code wastes time. Use `--since` flags or cache previous results.

## Integration Points
- **CI pipeline:** Run mutation testing nightly or weekly on critical modules, not on every PR (too slow)
- **Stryker dashboard:** Publish mutation reports to stryker-mutator.io for team visibility
- **Coverage complement:** Use alongside line coverage — high coverage with low mutation score means weak assertions
- **Quality gates:** Set `thresholds.break` to fail the build if mutation score drops below a minimum
