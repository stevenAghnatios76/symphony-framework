# Edge Cases

<!-- SECTION: boundary-analysis -->
## Boundary Analysis

**Numeric boundaries:**
- Zero, negative, max int, min int, NaN, Infinity
- Off-by-one: array length, loop bounds, pagination
- Floating point: 0.1 + 0.2 !== 0.3, use epsilon comparison or integers for money

**String boundaries:**
- Empty string vs null vs undefined
- Whitespace-only strings
- Unicode (emoji, RTL text, combining characters)
- Maximum length (database column limits, URL limits)
- Special characters: `<`, `>`, `'`, `"`, `\`, `&`, null bytes

**Collection boundaries:**
- Empty collection, single element, maximum size
- Duplicate entries
- Unsorted vs sorted assumptions
- Concurrent modification during iteration

<!-- SECTION: error-analysis -->
## Error Path Analysis

**For every operation, ask:**
1. What if the input is missing or malformed?
2. What if the dependency (DB, API, file system) is unavailable?
3. What if the operation times out?
4. What if the operation partially succeeds?
5. What if the operation is called twice (idempotency)?

**Partial failure patterns:**
- Transaction rollback for atomic operations
- Saga pattern for distributed operations
- Idempotency keys for retry-safe endpoints
- Dead letter queues for failed async processing

<!-- SECTION: timing-analysis -->
## Timing & Concurrency

**Race conditions:**
- Two users editing the same resource → optimistic locking (version column)
- Two requests creating the same unique resource → database unique constraint (not application check)
- Read-then-write without locking → lost updates

**Ordering:**
- Events arriving out of order → sequence numbers or event timestamps
- Async operations completing in unexpected order → state machines
- Clock skew between services → use logical clocks or accept bounded inconsistency

**Timeouts:**
- Every external call needs a timeout
- Cascading timeouts: inner < outer (upstream API 5s, your endpoint 10s, client 30s)
- Circuit breakers for repeated failures

<!-- SECTION: integration-edge-cases -->
## Integration Edge Cases

**API integration:** Rate limiting (implement backoff), pagination (handle zero results, handle final page), version changes (graceful degradation), network partitions (retry with idempotency).

**Database:** Connection pool exhaustion, long-running queries blocking others, deadlocks (consistent lock ordering), migration rollback on failure.

**File system:** Disk full, permission denied, file locked by another process, path too long, symlink loops.
