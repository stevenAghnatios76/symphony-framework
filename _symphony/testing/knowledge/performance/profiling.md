# Profiling — CPU, Memory, and I/O Analysis

**Principle:** Measure before optimizing — flame graphs and heap snapshots reveal where time and memory actually go, replacing guesswork with evidence.

## Pattern Examples

### 1. Flame Graphs for CPU Hot Paths
Capture a CPU profile and visualize as a flame graph to find the slowest call stacks:
```bash
# Node.js: generate a CPU profile
node --cpu-prof --cpu-prof-dir=./profiles app.js
# Convert to flame graph
npx speedscope profiles/CPU.*.cpuprofile
```
```python
# Python: use py-spy for low-overhead sampling
# py-spy record -o profile.svg -- python app.py
# Opens as an interactive flame graph in the browser
```

### 2. Heap Snapshots for Memory Leaks
Take snapshots at intervals and compare retained object counts:
```typescript
// In Node.js, trigger via inspector protocol
import v8 from 'v8';
import fs from 'fs';

function takeHeapSnapshot(label: string) {
  const filename = `heap-${label}-${Date.now()}.heapsnapshot`;
  const stream = v8.writeHeapSnapshot(filename);
  console.log(`Heap snapshot written to ${stream}`);
}

// Take before and after a suspected leak, compare in Chrome DevTools
takeHeapSnapshot('before');
await runLeakyOperation();
takeHeapSnapshot('after');
```

### 3. Async Profiling for I/O Bottlenecks
Trace event-loop delays and async operations to find I/O stalls:
```javascript
import { monitorEventLoopDelay } from 'perf_hooks';

const h = monitorEventLoopDelay({ resolution: 20 });
h.enable();

setTimeout(() => {
  console.log(`Event loop p99: ${(h.percentile(99) / 1e6).toFixed(1)}ms`);
  console.log(`Max delay: ${(h.max / 1e6).toFixed(1)}ms`);
  h.disable();
}, 10_000);
```

## Anti-Patterns
- **Profiling in debug mode** — debug builds disable optimizations. Profile release/production builds only.
- **Optimizing without profiling** — premature optimization wastes effort on non-bottlenecks. Always measure first.
- **Single-sample profiling** — one run may not be representative. Aggregate multiple samples under realistic load.
- **Ignoring GC pressure** — frequent garbage collection pauses look like CPU work. Check GC logs separately.
- **Profiling only happy paths** — error handling, retries, and timeouts often dominate real-world performance.

## Integration Points
- **Chrome DevTools:** Analyze `.cpuprofile` and `.heapsnapshot` files from Node.js
- **py-spy / perf:** Low-overhead profiling for Python and Linux systems
- **Async Profiler:** JVM profiling with flame graph output for Java/Kotlin
- **Load Testing:** Profile under load-test traffic for realistic bottleneck identification
