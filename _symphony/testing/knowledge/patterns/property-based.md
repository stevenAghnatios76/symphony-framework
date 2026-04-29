# Property-Based Testing — Generative Invariant Verification

**Principle:** Define properties that must always hold, then let the framework generate thousands of inputs to find the edge cases you would never write by hand.

## Pattern Examples

### 1. Invariant Properties
Assert a universal truth regardless of input:
```typescript
import fc from 'fast-check';

test('sort produces a list of the same length', () => {
  fc.assert(
    fc.property(fc.array(fc.integer()), (arr) => {
      expect(sortArray(arr)).toHaveLength(arr.length);
    })
  );
});

test('sort output is ordered', () => {
  fc.assert(
    fc.property(fc.array(fc.integer()), (arr) => {
      const sorted = sortArray(arr);
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i]).toBeGreaterThanOrEqual(sorted[i - 1]);
      }
    })
  );
});
```

### 2. Roundtrip (Encode/Decode) Properties
Serialization followed by deserialization must return the original value:
```python
from hypothesis import given
import hypothesis.strategies as st

@given(st.dictionaries(st.text(min_size=1), st.integers()))
def test_json_roundtrip(data):
    assert json.loads(json.dumps(data)) == data
```

### 3. Model-Based Testing
Compare your implementation against a simple reference model:
```typescript
test('custom cache matches Map behavior', () => {
  fc.assert(
    fc.property(
      fc.array(fc.tuple(fc.string(), fc.integer()), { maxLength: 50 }),
      (ops) => {
        const cache = new LRUCache(100);
        const model = new Map();
        for (const [key, val] of ops) {
          cache.set(key, val);
          model.set(key, val);
        }
        for (const [key] of ops) {
          expect(cache.get(key)).toBe(model.get(key));
        }
      }
    )
  );
});
```

## Anti-Patterns
- **Reimplementing the function in the test** — test properties (length preserved, ordering), not the algorithm itself.
- **Too-narrow generators** — constraining inputs to only "nice" values defeats the purpose. Start broad, shrink on failure.
- **Ignoring shrunk counter-examples** — the minimized failing case is the most valuable debugging signal. Investigate it.
- **Low iteration count** — running 10 iterations provides false confidence. Default to 100+ in CI.

## Integration Points
- **fast-check:** JS/TS property-based testing; integrates with Jest, Vitest, Mocha
- **Hypothesis:** Python property-based testing; integrates with pytest
- **Go:** `testing/quick` in stdlib or `gopter` for richer generators
- **Data Builders:** Builder factories can serve as custom generators for domain types
