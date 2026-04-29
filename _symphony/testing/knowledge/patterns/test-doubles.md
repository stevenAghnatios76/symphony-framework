# Test Doubles — Mocks, Stubs, Spies, and Fakes

**Principle:** Choose the simplest test double that verifies the behavior you care about — stubs for inputs, spies for interactions, fakes for complex collaborators.

## Pattern Examples

### 1. Manual Fakes for Complex Dependencies
Build a lightweight in-memory implementation when the real dependency is too heavy:
```typescript
class FakeUserRepository implements UserRepository {
  private users: Map<string, User> = new Map();

  async save(user: User): Promise<void> {
    this.users.set(user.id, { ...user });
  }
  async findById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }
}

it('creates a user', async () => {
  const repo = new FakeUserRepository();
  const service = new UserService(repo);
  await service.createUser({ name: 'Ada' });
  expect(await repo.findById('1')).toMatchObject({ name: 'Ada' });
});
```

### 2. Spy Assertions for Interaction Testing
Use spies to verify a collaborator was called with the right arguments:
```typescript
it('sends a welcome email after registration', async () => {
  const sendEmail = jest.fn().mockResolvedValue(undefined);
  const service = new RegistrationService({ sendEmail });
  await service.register({ email: 'ada@example.com' });
  expect(sendEmail).toHaveBeenCalledWith(
    expect.objectContaining({ to: 'ada@example.com', template: 'welcome' })
  );
});
```

### 3. Stubs for Deterministic Responses
Replace volatile or slow dependencies with predictable return values:
```python
def test_exchange_rate_conversion(mocker):
    mocker.patch('services.forex.get_rate', return_value=1.12)
    result = convert(100, 'USD', 'EUR')
    assert result == 112.0
```

## Anti-Patterns
- **Mocking what you don't own** — wrap third-party APIs in an adapter and mock the adapter instead.
- **Over-specifying interactions** — asserting exact call counts or argument order makes tests brittle. Assert on outcomes first.
- **Shared mutable mocks** — reusing a mock across tests leaks state. Create fresh doubles per test.
- **Mocking value objects** — never mock simple data structures; use real instances.
- **Verify-only tests** — a test that only checks mock interactions without asserting observable state proves nothing about correctness.

## Integration Points
- **Jest / Vitest:** `jest.fn()`, `vi.fn()`, `jest.spyOn()` for JS/TS doubles
- **pytest:** `mocker.patch`, `MagicMock`, `create_autospec` via pytest-mock
- **Go:** Interface-based fakes; `gomock` or hand-written stubs
- **Test Architect agent:** Recommends double type based on dependency complexity
