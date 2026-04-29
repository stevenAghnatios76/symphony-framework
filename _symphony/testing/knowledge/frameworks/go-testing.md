# Go Testing — Table-Driven and Standard Library Patterns

**Principle:** Use table-driven tests for comprehensive input coverage, the standard `testing` package for most needs, `httptest` for HTTP handlers, and benchmarks with `testing.B` to catch performance regressions.

## Pattern Examples

### 1. Table-Driven Tests
Define test cases as data, loop through them, and use subtests for isolation:
```go
func TestParseSize(t *testing.T) {
    tests := []struct {
        name    string
        input   string
        want    int64
        wantErr bool
    }{
        {name: "bytes", input: "100B", want: 100},
        {name: "kilobytes", input: "2KB", want: 2048},
        {name: "megabytes", input: "1MB", want: 1048576},
        {name: "invalid", input: "abc", wantErr: true},
        {name: "empty", input: "", wantErr: true},
    }
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            got, err := ParseSize(tt.input)
            if (err != nil) != tt.wantErr {
                t.Fatalf("ParseSize(%q) error = %v, wantErr %v", tt.input, err, tt.wantErr)
            }
            if got != tt.want {
                t.Errorf("ParseSize(%q) = %d, want %d", tt.input, got, tt.want)
            }
        })
    }
}
```

### 2. HTTP Handler Testing with httptest
Test HTTP handlers without starting a real server:
```go
func TestHealthHandler(t *testing.T) {
    req := httptest.NewRequest(http.MethodGet, "/health", nil)
    w := httptest.NewRecorder()

    HealthHandler(w, req)

    resp := w.Result()
    if resp.StatusCode != http.StatusOK {
        t.Errorf("status = %d, want %d", resp.StatusCode, http.StatusOK)
    }
    body, _ := io.ReadAll(resp.Body)
    if string(body) != `{"status":"ok"}` {
        t.Errorf("body = %s, want %s", body, `{"status":"ok"}`)
    }
}
```

### 3. Benchmark Tests with testing.B
Measure performance and detect regressions:
```go
func BenchmarkJSONMarshal(b *testing.B) {
    data := User{ID: "1", Name: "Ada", Email: "ada@example.com"}
    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        json.Marshal(data)
    }
}
// Run: go test -bench=. -benchmem
// Output: BenchmarkJSONMarshal-8  5000000  234 ns/op  128 B/op  2 allocs/op
```
Use `b.ReportAllocs()` and `-benchmem` to track allocation regressions.

## Anti-Patterns
- **Skipping subtests** — running all table cases in one function makes failures hard to locate. Always use `t.Run(name, ...)`.
- **Using testify for everything** — the standard library covers most needs. Add `testify` only when `require`/`assert` matchers add real clarity.
- **Global test state** — package-level variables shared across tests create flaky, order-dependent failures. Use `t.TempDir()` and local state.
- **No parallel tests** — forgetting `t.Parallel()` on independent tests wastes CI time. Add it to table-driven subtests by default.

## Integration Points
- **go test:** Built-in runner with `-race` for race detection, `-cover` for coverage, `-count=1` to disable caching
- **testify:** `assert` for soft failures, `require` for hard stops, `mock` for interface mocking
- **CI:** `go test ./... -coverprofile=cover.out && go tool cover -func=cover.out` for coverage reporting
- **golangci-lint:** Static analysis catches common test mistakes like unchecked errors and unused variables
