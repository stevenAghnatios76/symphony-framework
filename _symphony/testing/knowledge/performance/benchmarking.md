# Benchmarking — Micro-Benchmark Patterns and Pitfalls

**Principle:** Benchmarks must be statistically rigorous and run in controlled conditions — a single fast run proves nothing without variance analysis and warmup.

## Pattern Examples

### 1. Statistical Significance with Warmup
Run enough iterations after warmup to get stable numbers with confidence intervals:
```javascript
import Benchmark from 'benchmark';

const suite = new Benchmark.Suite();
suite
  .add('Array.map', () => {
    [1, 2, 3, 4, 5].map(x => x * 2);
  })
  .add('for loop', () => {
    const arr = [1, 2, 3, 4, 5], out = [];
    for (let i = 0; i < arr.length; i++) out.push(arr[i] * 2);
  })
  .on('cycle', (e) => console.log(String(e.target)))
  .on('complete', function () {
    console.log('Fastest: ' + this.filter('fastest').map('name'));
  })
  .run({ async: true });
// benchmark.js handles warmup, statistical sampling, and margin of error
```

### 2. Go Table-Driven Benchmarks
Use `testing.B` with sub-benchmarks to compare across input sizes:
```go
func BenchmarkSort(b *testing.B) {
    sizes := []int{100, 1000, 10000}
    for _, n := range sizes {
        b.Run(fmt.Sprintf("size=%d", n), func(b *testing.B) {
            data := generateSlice(n)
            b.ResetTimer()
            for i := 0; i < b.N; i++ {
                sort.Ints(append([]int{}, data...))
            }
        })
    }
}
// Run: go test -bench=. -benchmem -count=5
```

### 3. Preventing Dead Code Elimination
Ensure the compiler cannot optimize away the code under test:
```go
var result int // package-level to prevent elimination

func BenchmarkFib(b *testing.B) {
    var r int
    for i := 0; i < b.N; i++ {
        r = fib(20)
    }
    result = r // assign to package var so compiler keeps the call
}
```

## Anti-Patterns
- **Single-run benchmarks** — one measurement is noise. Run multiple iterations and report mean with standard deviation.
- **No warmup** — JIT compilation, caches, and branch predictors need warmup. Discard initial runs.
- **Benchmarking in CI without dedicated resources** — shared CI runners introduce variance. Use dedicated hardware or track relative changes only.
- **Comparing across languages naively** — runtime semantics differ. Benchmark to optimize within a stack, not to pick a language.
- **Ignoring allocations** — throughput looks good but GC pressure kills latency. Always report allocation counts alongside timing.

## Integration Points
- **benchmark.js:** Statistically rigorous JS micro-benchmarks with automatic iteration tuning
- **Go testing.B:** Built-in benchmark support with `-benchmem` for allocation tracking
- **pytest-benchmark:** Python benchmarking with histogram output and comparison across runs
- **CI:** Store benchmark results as artifacts; compare against baseline in PR comments
