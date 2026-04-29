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
