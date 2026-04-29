# Vitest Test Execution Adapter

**Runner:** `npx vitest run`
**Report format:** JSON reporter (`--reporter=json`)

## Discovery

Vitest discovers test files matching these default glob patterns:

```
**/*.{test,spec}.{ts,js,tsx,jsx}
```

Override discovery in `vitest.config.ts`:

```ts
export default defineConfig({
  test: {
    include: ['src/**/*.{test,spec}.{ts,js,tsx,jsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git'],
  },
});
```

List discovered tests without running them:

```bash
npx vitest list --reporter=json
```

## Execution

Run all tests with JSON output:

```bash
npx vitest run --reporter=json --outputFile=test-results.json
```

Run a specific file or pattern:

```bash
npx vitest run src/utils/parse.test.ts --reporter=json
npx vitest run --reporter=json --testNamePattern="handles empty input"
```

Run with coverage:

```bash
npx vitest run --reporter=json --coverage --coverage.reporter=json
```

Force test isolation to avoid shared-state leaks:

```bash
npx vitest run --pool=forks --reporter=json
```

## Result Parsing

The JSON output contains a `testResults` array. Parse pass/fail/skip counts:

```bash
cat test-results.json | jq '{
  total: .numTotalTests,
  passed: .numPassedTests,
  failed: .numFailedTests,
  skipped: .numPendingTests,
  duration_ms: .testResults | map(.perfStats.end - .perfStats.start) | add
}'
```

Extract failure details:

```bash
cat test-results.json | jq '.testResults[].assertionResults[]
  | select(.status == "failed")
  | {name: .fullName, message: .failureMessages[0]}'
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
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npx vitest run --reporter=json --outputFile=test-results.json --coverage
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-results
          path: test-results.json
```

## Common Issues

- **ESM resolution failures** — Ensure `vitest.config.ts` sets `resolve.alias` for path aliases, or use `vite-tsconfig-paths` plugin. Set `"type": "module"` in `package.json` if using ESM imports.
- **jsdom vs happy-dom** — Set `environment: 'jsdom'` or `environment: 'happy-dom'` in config. happy-dom is faster but has fewer APIs. Use per-file overrides with `// @vitest-environment jsdom` comment.
- **Test isolation with shared state** — Use `--pool=forks` to run each test file in a separate process. Default `--pool=threads` shares memory between tests and can cause flaky failures.
- **Hanging tests** — Set `testTimeout` in config (default 5000ms). Use `--bail=1` to stop on first failure during CI.
- **TypeScript type errors in tests** — Vitest uses esbuild for transpilation and skips type checking. Run `tsc --noEmit` separately for type validation.
