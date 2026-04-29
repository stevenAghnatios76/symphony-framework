# Risk-Based Testing — Prioritized Test Investment

**Principle:** Allocate testing effort proportional to business risk — test critical paths deeply, low-risk paths lightly, and skip testing what cannot meaningfully fail.

## Pattern Examples

### 1. Risk Matrix for Test Prioritization
Score each feature by likelihood of failure and business impact, then map to test depth:
```markdown
| Feature           | Likelihood | Impact | Risk Score | Test Level     |
|-------------------|-----------|--------|------------|----------------|
| Payment checkout  | Medium    | High   | Critical   | Unit+Int+E2E   |
| User registration | Low       | High   | High       | Unit+Int       |
| Profile avatar    | Low       | Low    | Low        | Unit only      |
| Admin CSV export  | Medium    | Low    | Medium     | Unit+Int       |
```
Risk Score = Likelihood x Impact. Critical items get full pyramid coverage.

### 2. Critical Path Identification
Map user journeys to revenue impact and test the happy path plus top failure modes:
```typescript
// Critical path: signup -> onboarding -> first purchase
describe('critical path: first purchase', () => {
  test('new user completes signup', async () => { /* ... */ });
  test('onboarding sets preferences', async () => { /* ... */ });
  test('first purchase succeeds with valid card', async () => { /* ... */ });
  test('first purchase fails gracefully with declined card', async () => { /* ... */ });
});
// Non-critical: theme preference — unit test only
```

### 3. Change-Risk Analysis for Regression Scope
Focus regression effort on areas affected by recent changes:
```bash
# Identify changed modules and their dependents
git diff --name-only main..HEAD | \
  xargs dependency-cruiser --output-type text | \
  sort -u > affected-modules.txt

# Run only tests covering affected modules
npx jest --findRelatedTests $(cat affected-modules.txt)
```
This avoids running the full suite for every change.

## Anti-Patterns
- **Uniform coverage targets** — 80% coverage everywhere ignores that payment code matters more than admin tooltips.
- **Testing only happy paths** — critical features need failure mode coverage (timeouts, bad input, partial failures).
- **Risk assessment once** — risk profiles change as code evolves. Reassess quarterly or after incidents.
- **Ignoring near-misses** — production incidents reveal real risk. Feed post-mortems back into test priorities.

## Integration Points
- **Incident tracking:** Link post-mortem findings to new test cases for the affected risk area
- **Coverage dashboards:** Segment coverage by risk tier — critical modules should have 90%+, low-risk can be 50%
- **CI configuration:** Run critical-path E2E tests on every deploy, full suite nightly
- **Sprint planning:** Include risk-based test tasks when modifying high-risk modules
