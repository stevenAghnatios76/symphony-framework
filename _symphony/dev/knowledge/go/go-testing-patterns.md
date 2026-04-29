# Go — Testing Patterns

**Principle:** Table-driven tests are the default. Tests live next to code. Use testify for assertions, httptest for HTTP, and benchmarks for performance claims.

## Pattern Examples

### 1. Table-Driven Tests
```go
func TestParseAmount(t *testing.T) {
    tests := []struct {
        name    string
        input   string
        want    int64
        wantErr bool
    }{
        {"valid dollars", "$10.50", 1050, false},
        {"valid no cents", "$10", 1000, false},
        {"zero", "$0.00", 0, false},
        {"negative", "-$5.00", -500, false},
        {"invalid format", "ten dollars", 0, true},
        {"empty string", "", 0, true},
    }
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            got, err := ParseAmount(tt.input)
            if tt.wantErr {
                require.Error(t, err)
                return
            }
            require.NoError(t, err)
            assert.Equal(t, tt.want, got)
        })
    }
}
```

### 2. HTTP Handler Tests
```go
func TestGetUser(t *testing.T) {
    store := &mockUserStore{
        users: map[string]*User{"1": {ID: "1", Name: "Alice"}},
    }
    handler := NewHandler(store)
    req := httptest.NewRequest("GET", "/users/1", nil)
    req.SetPathValue("id", "1")
    rec := httptest.NewRecorder()

    handler.GetUser(rec, req)

    assert.Equal(t, http.StatusOK, rec.Code)
    var user User
    require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &user))
    assert.Equal(t, "Alice", user.Name)
}
```

### 3. Benchmarks
```go
func BenchmarkParseAmount(b *testing.B) {
    inputs := []string{"$10.50", "$1000.00", "$0.01"}
    for b.Loop() {
        for _, input := range inputs {
            _, _ = ParseAmount(input)
        }
    }
}
// Run: go test -bench=. -benchmem ./...
```

## Anti-Patterns
- **Not using t.Run for subtests** — makes failures hard to identify and prevents parallel subtests
- **Test setup in TestMain when BeforeEach suffices** — use `t.Cleanup()` for per-test teardown
- **Asserting on error strings** — use `errors.Is()` or `errors.As()` for typed error checking
- **No benchmarks for performance claims** — if you say "this is fast," prove it with `BenchmarkX`

## Integration Points
- **CI:** `go test -race -cover ./...` for race detection and coverage in CI
- **Testify:** `assert` (non-fatal) + `require` (fatal) for readable assertions
- **Test fixtures:** `testdata/` directory (ignored by Go build), `os.ReadFile` in tests
