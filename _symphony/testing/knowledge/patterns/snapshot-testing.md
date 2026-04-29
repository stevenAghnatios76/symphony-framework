# Snapshot Testing — Golden Files and Inline Snapshots

**Principle:** Snapshots catch unintended output changes cheaply, but they must stay small, readable, and intentionally updated — never blindly accepted.

## Pattern Examples

### 1. Inline Snapshots for Small Outputs
Inline snapshots live next to the assertion so reviewers see expected output in the test file:
```typescript
it('formats an address', () => {
  const result = formatAddress({ street: '123 Main', city: 'Springfield', zip: '62704' });
  expect(result).toMatchInlineSnapshot(`
    "123 Main
    Springfield, 62704"
  `);
});
```

### 2. Custom Serializers for Determinism
Strip volatile fields (timestamps, IDs) before snapshotting to avoid false failures:
```typescript
expect.addSnapshotSerializer({
  test: (val) => val && typeof val === 'object' && 'createdAt' in val,
  serialize: (val, config, indent, depth, refs, printer) => {
    const { createdAt, id, ...stable } = val;
    return printer({ ...stable, id: '[ID]', createdAt: '[TIMESTAMP]' },
      config, indent, depth, refs);
  },
});

it('serializes user profile', () => {
  expect(getUserProfile('123')).toMatchSnapshot();
});
```

### 3. Golden File Testing for Large Outputs
Store expected output in a separate file for compiler output, API responses, or generated code:
```go
func TestCodeGen(t *testing.T) {
    got := generateClient(schema)
    golden := filepath.Join("testdata", t.Name()+".golden")
    if *update {
        os.WriteFile(golden, []byte(got), 0644)
    }
    want, _ := os.ReadFile(golden)
    if diff := cmp.Diff(string(want), got); diff != "" {
        t.Errorf("mismatch (-want +got):\n%s", diff)
    }
}
```

## Anti-Patterns
- **Blindly updating snapshots** — `--update` without reviewing diffs masks regressions. Always inspect changes.
- **Huge snapshots** — a 500-line snapshot is unreadable. Break into focused assertions or multiple smaller snapshots.
- **Snapshotting implementation details** — snapshot observable output (HTML, JSON), not internal data structures.
- **Non-deterministic snapshots** — random IDs, timestamps, or ordering cause flaky tests. Stabilize before snapshotting.

## Integration Points
- **Jest / Vitest:** Built-in `toMatchSnapshot()` and `toMatchInlineSnapshot()` support
- **Go:** Manual golden file pattern with `-update` flag convention
- **Visual Regression:** Pairs with visual-regression fragment for image-based snapshots
- **CI:** Fail the build if snapshot files have uncommitted changes after test run
