# Go Test Execution Adapter

**Runner:** `go test ./...`
**Report format:** JSON output with `-json` flag

## Discovery

Go discovers test files by naming convention within each package directory:

```
*_test.go      # any file ending in _test.go
```

Test functions must have the signature `func TestXxx(t *testing.T)`.
Benchmark functions use `func BenchmarkXxx(b *testing.B)`.

List discovered tests without running them:

```bash
go test ./... -list '.*' -run '^$'
```

List all test files in the project:

```bash
go test ./... -v -run '^$' -json | jq -r '.Package' | sort -u
```

## Execution

Run all tests with JSON output:

```bash
go test ./... -json > test-results.json 2>&1
```

Run a specific package:

```bash
go test ./internal/parser -json
```

Run a specific test by name pattern:

```bash
go test ./... -json -run "TestParseEmpty"
```

Run with race detector enabled:

```bash
go test ./... -json -race
```

Run with coverage:

```bash
go test ./... -json -coverprofile=coverage.out -covermode=atomic
go tool cover -func=coverage.out
```

Bypass test cache for reliable CI results:

```bash
go test ./... -json -count=1
```

Set a timeout for long-running tests:

```bash
go test ./... -json -timeout=5m
```

## Result Parsing

Go test JSON output emits one JSON object per line. Parse pass/fail/skip counts:

```bash
cat test-results.json | jq -s '
  [.[] | select(.Test != null and .Action == "pass")] | length as $passed |
  [.[] | select(.Test != null and .Action == "fail")] | length as $failed |
  [.[] | select(.Test != null and .Action == "skip")] | length as $skipped |
  {passed: $passed, failed: $failed, skipped: $skipped,
   total: ($passed + $failed + $skipped)}'
```

Extract failure details:

```bash
cat test-results.json | jq -s '
  [.[] | select(.Test != null and .Action == "fail")]
  | map({package: .Package, test: .Test, elapsed: .Elapsed})'
```

Capture failure output lines:

```bash
cat test-results.json | jq -s '
  group_by(.Test) | map(select(any(.Action == "fail")))
  | map({test: .[0].Test, output: [.[] | select(.Action == "output") | .Output] | join("")})'
```

## CI Integration

GitHub Actions workflow:

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version: '1.22'
          cache: true
      - run: go test ./... -json -race -count=1 -coverprofile=coverage.out > test-results.json 2>&1
      - run: go tool cover -func=coverage.out
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-results
          path: |
            test-results.json
            coverage.out
```

## Common Issues

- **Parallel test conflicts** — Tests calling `t.Parallel()` run concurrently. Shared resources (files, ports, databases) cause flaky failures. Use unique temp dirs via `t.TempDir()` and randomized ports.
- **Build tags filtering** — Use `//go:build integration` tags for slow tests and run separately with `go test ./... -tags=integration`. Default `go test` skips tagged files.
- **Test caching** — Go caches passing test results. Use `-count=1` in CI to disable caching and ensure tests actually run on each commit.
- **Module download failures** — Run `go mod download` as a separate step before `go test` in CI. Set `GOPROXY=https://proxy.golang.org,direct` for reliability.
- **Race detector overhead** — `-race` increases CPU and memory usage 5-10x. Run race-enabled tests as a separate CI job with higher resource limits.
