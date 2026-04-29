# Vitest & Jest — JavaScript/TypeScript Testing

**Principle:** Write fast, isolated unit tests with expressive assertions, leverage parameterized tests for input variations, and use mocking sparingly to test behavior rather than implementation.

## Pattern Examples

### 1. Parameterized Tests with test.each
Eliminate repetitive test cases by driving tests from data:
```typescript
// Vitest and Jest share the same API
describe('toSlug', () => {
  test.each([
    ['Hello World', 'hello-world'],
    ['  Extra  Spaces  ', 'extra-spaces'],
    ['Already-slug', 'already-slug'],
    ['Special!@#Chars', 'specialchars'],
  ])('converts "%s" to "%s"', (input, expected) => {
    expect(toSlug(input)).toBe(expected);
  });
});
```

### 2. Module Mocking and Dependency Injection
Mock external dependencies to isolate the unit under test:
```typescript
// Vitest
vi.mock('./email-client', () => ({
  sendEmail: vi.fn().mockResolvedValue({ messageId: 'abc-123' }),
}));

// Jest equivalent
jest.mock('./email-client', () => ({
  sendEmail: jest.fn().mockResolvedValue({ messageId: 'abc-123' }),
}));

test('notifyUser sends email and returns id', async () => {
  const result = await notifyUser('user@test.com', 'Welcome');
  expect(sendEmail).toHaveBeenCalledWith('user@test.com', 'Welcome');
  expect(result.messageId).toBe('abc-123');
});
```

### 3. Async Testing and Timers
Handle promises, timers, and async DOM updates:
```typescript
// Testing async functions
test('fetchUser resolves with user data', async () => {
  const user = await fetchUser('42');
  expect(user).toMatchObject({ id: '42', name: expect.any(String) });
});

// Fake timers for debounce/throttle
test('debounced search waits 300ms', () => {
  vi.useFakeTimers();
  const handler = vi.fn();
  const search = debounce(handler, 300);
  search('query');
  expect(handler).not.toHaveBeenCalled();
  vi.advanceTimersByTime(300);
  expect(handler).toHaveBeenCalledWith('query');
  vi.useRealTimers();
});
```

## Anti-Patterns
- **Snapshot overuse** — large snapshots break on every UI change and get blindly updated. Use targeted assertions instead.
- **Mocking what you own** — mock boundaries (HTTP, DB), not internal modules. Over-mocking makes tests pass while code is broken.
- **No cleanup** — leaking state between tests causes order-dependent failures. Use `beforeEach`/`afterEach` to reset.
- **Testing implementation** — asserting `fn.toHaveBeenCalledTimes(3)` couples tests to internals. Assert on outputs and side effects.
- **Ignoring async errors** — forgetting `await` on async assertions makes tests pass silently. Always `await expect(...)`.

## Integration Points
- **Vitest:** Native ESM, Vite-powered HMR for watch mode, built-in coverage with c8/istanbul
- **Jest:** Mature ecosystem, `ts-jest` for TypeScript, `@testing-library/*` for DOM assertions
- **CI:** `--coverage --reporter=json` for machine-readable output; `--bail` to fail fast on first error
- **IDE:** VS Code extensions (Vitest Runner, Jest Runner) for inline test execution and debugging
