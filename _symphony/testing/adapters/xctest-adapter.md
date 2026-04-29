# XCTest Test Execution Adapter

**Runner:** `xcodebuild test`
**Report format:** xcresult bundle, parsed with `xcrun xcresulttool`

## Discovery

XCTest discovers tests through Xcode test targets:

- Test classes inherit from `XCTestCase`
- Test methods are prefixed with `test` and take no arguments
- Test files live in the test target's source directory (e.g., `MyAppTests/`)
- UI tests live in a separate target (e.g., `MyAppUITests/`)

List discovered tests for a scheme:

```bash
xcodebuild test-without-building -scheme MyApp \
  -destination 'platform=iOS Simulator,name=iPhone 16' \
  -enumerate-tests -json
```

List test plans and their configurations:

```bash
xcodebuild test -scheme MyApp -showTestPlans
```

## Execution

Run all tests and produce an xcresult bundle:

```bash
xcodebuild test \
  -scheme MyApp \
  -destination 'platform=iOS Simulator,name=iPhone 16,OS=18.0' \
  -resultBundlePath TestResults.xcresult
```

Run a specific test class or method:

```bash
xcodebuild test \
  -scheme MyApp \
  -destination 'platform=iOS Simulator,name=iPhone 16,OS=18.0' \
  -only-testing:MyAppTests/ParserTests/testEmptyInput \
  -resultBundlePath TestResults.xcresult
```

Run tests using a test plan:

```bash
xcodebuild test \
  -scheme MyApp \
  -testPlan CITestPlan \
  -destination 'platform=iOS Simulator,name=iPhone 16,OS=18.0' \
  -resultBundlePath TestResults.xcresult
```

Run with parallel testing:

```bash
xcodebuild test \
  -scheme MyApp \
  -destination 'platform=iOS Simulator,name=iPhone 16,OS=18.0' \
  -parallel-testing-enabled YES \
  -resultBundlePath TestResults.xcresult
```

## Result Parsing

Parse the xcresult bundle using `xcrun xcresulttool`:

```bash
xcrun xcresulttool get --path TestResults.xcresult --format json
```

Extract test summary counts:

```bash
xcrun xcresulttool get --path TestResults.xcresult --format json \
  | jq '.actions._values[0].actionResult.testsRef' \
  | xargs -I{} xcrun xcresulttool get --path TestResults.xcresult --format json --id {} \
  | jq '{
      passed: [.. | select(.testStatus?._value == "Success")] | length,
      failed: [.. | select(.testStatus?._value == "Failure")] | length,
      skipped: [.. | select(.testStatus?._value == "Skipped")] | length
    }'
```

Extract failure details with `xcrun xcresulttool`:

```bash
xcrun xcresulttool get --path TestResults.xcresult --format json \
  | jq '.. | select(.testStatus?._value == "Failure")
  | {name: .name._value, identifier: .identifier._value}'
```

## CI Integration

GitHub Actions workflow:

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: macos-15
    steps:
      - uses: actions/checkout@v4
      - uses: maxim-lobanov/setup-xcode@v1
        with:
          xcode-version: '16.0'
      - name: Boot simulator
        run: |
          xcrun simctl boot "iPhone 16" || true
          xcrun simctl bootstatus "iPhone 16" -b
      - name: Run tests
        run: |
          xcodebuild test \
            -scheme MyApp \
            -destination 'platform=iOS Simulator,name=iPhone 16,OS=18.0' \
            -resultBundlePath TestResults.xcresult \
            -parallel-testing-enabled YES \
            | xcpretty
      - name: Parse results
        if: always()
        run: |
          xcrun xcresulttool get --path TestResults.xcresult --format json > results.json
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-results
          path: |
            TestResults.xcresult
            results.json
```

## Common Issues

- **Simulator boot time** — Pre-boot the simulator in a separate CI step before running tests. Use `xcrun simctl bootstatus "iPhone 16" -b` to wait until ready. Reuse simulators across jobs when possible.
- **Code signing in CI** — Disable signing for test builds: add `CODE_SIGN_IDENTITY=""` and `CODE_SIGNING_ALLOWED=NO` to the `xcodebuild` command. Use `COMPILER_INDEX_STORE_ENABLE=NO` to speed up builds.
- **Test plan configuration** — Create a dedicated CI test plan that disables UI tests and flaky tests. Reference it with `-testPlan CITestPlan`. Test plans live as `.xctestplan` files in the project.
- **Flaky parallel tests** — Parallel testing uses cloned simulators. Tests sharing state via `UserDefaults`, keychain, or file system will conflict. Use `XCTestCase.setUp()` to reset state.
- **xcresult bundle size** — Bundles with attachments (screenshots, diagnostics) can be large. Use `xcrun xcresulttool merge` to combine bundles and `xcrun xcresulttool export` to extract specific attachments.
