# Test Pyramid — Layered Testing Strategy

**Principle:** Structure tests in a pyramid shape — many fast unit tests at the base, fewer integration tests in the middle, and minimal E2E tests at the top — to maximize feedback speed and minimize maintenance cost.

## Pattern Examples

### 1. Unit Tests (70% — Base Layer)
Fast, isolated, no external dependencies. Test one function or class at a time:
```typescript
// Pure logic — no network, no DB, no filesystem
describe('calculateDiscount', () => {
  it('applies 10% for orders over $100', () => {
    expect(calculateDiscount({ total: 150 })).toBe(15);
  });
  it('returns 0 for orders under $100', () => {
    expect(calculateDiscount({ total: 50 })).toBe(0);
  });
});
```
Target: < 5ms per test. Run on every save.

### 2. Integration Tests (20% — Middle Layer)
Verify that components work together — real DB, real HTTP, real queues:
```typescript
describe('UserService + Database', () => {
  it('creates and retrieves a user', async () => {
    const user = await userService.create({ name: 'Ada', email: 'ada@test.com' });
    const found = await userService.findById(user.id);
    expect(found.email).toBe('ada@test.com');
  });
});
```
Target: < 2s per test. Run in CI on every push.

### 3. E2E Tests (10% — Top Layer)
Validate critical user journeys through the full stack:
```typescript
test('checkout flow', async ({ page }) => {
  await page.goto('/products');
  await page.click('[data-testid="add-to-cart"]');
  await page.click('[data-testid="checkout"]');
  await page.fill('#email', 'user@test.com');
  await page.click('[data-testid="pay"]');
  await expect(page.locator('.confirmation')).toBeVisible();
});
```
Target: < 30s per test. Run nightly or pre-deploy.

## Anti-Patterns
- **Ice cream cone** — more E2E than unit tests inverts the pyramid, creating slow, flaky suites.
- **Testing implementation** — unit tests that mock every dependency become brittle refactoring traps. Test behavior, not wiring.
- **No integration layer** — jumping from unit to E2E leaves gaps where modules fail to connect.
- **Duplicate coverage** — testing the same logic at every layer wastes execution time. Push each assertion to the lowest viable layer.
- **Skipping the base** — writing E2E first feels productive but masks design problems that unit tests would surface early.

## Integration Points
- **CI pipeline:** Unit tests gate PR merge; integration tests run on push; E2E tests run pre-deploy
- **Coverage tools:** Istanbul/c8 for JS, coverage.py for Python — track per-layer coverage separately
- **Test runners:** Vitest/Jest for unit, Testcontainers for integration, Playwright/Cypress for E2E
- **Monitoring:** Track test execution time per layer to detect pyramid inversion over time
