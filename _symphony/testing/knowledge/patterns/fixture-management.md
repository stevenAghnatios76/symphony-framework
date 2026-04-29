# Fixture Management — Test Data Setup and Teardown

**Principle:** Every test must create its own world and clean up after itself — shared mutable fixtures are the root of flaky suites.

## Pattern Examples

### 1. Factory Functions for Test Isolation
Each test builds exactly the data it needs via focused factory helpers:
```typescript
function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: randomUUID(),
    name: 'Test User',
    email: `user-${randomUUID()}@test.com`,
    role: 'member',
    ...overrides,
  };
}

it('promotes user to admin', () => {
  const user = buildUser({ role: 'member' });
  const result = promote(user);
  expect(result.role).toBe('admin');
});
```

### 2. Database Seeding with Transaction Rollback
Wrap each test in a transaction that rolls back, avoiding residual data:
```python
@pytest.fixture(autouse=True)
def db_session(db_engine):
    connection = db_engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()
```

### 3. Shared Read-Only Fixtures
For expensive setup (large reference datasets), load once and share immutably:
```typescript
let catalog: ProductCatalog;
beforeAll(async () => {
  catalog = await loadFixture('reference-catalog.json');
  Object.freeze(catalog);
});

it('finds products by category', () => {
  const results = searchCatalog(catalog, { category: 'electronics' });
  expect(results.length).toBeGreaterThan(0);
});
```

## Anti-Patterns
- **Global mutable fixtures** — one test mutates shared state and breaks downstream tests. Isolate per test.
- **Implicit ordering** — tests that depend on execution order are fragile. Each test must be self-contained.
- **Missing cleanup** — leftover files, DB rows, or environment variables poison later tests. Always teardown.
- **Over-seeding** — inserting 1000 rows when the test needs 2 slows the suite and obscures intent.
- **Fixture files as source of truth** — JSON fixtures drift from schemas. Prefer factory functions that compile against types.

## Integration Points
- **Jest:** `beforeEach` / `afterEach` for per-test setup; `beforeAll` for shared immutable data
- **pytest:** Fixture scoping (`function`, `module`, `session`) controls lifecycle
- **Data Builders:** Pairs with the data-builders knowledge fragment for complex object construction
- **CI pipelines:** Seed scripts run in isolated ephemeral databases per pipeline run
