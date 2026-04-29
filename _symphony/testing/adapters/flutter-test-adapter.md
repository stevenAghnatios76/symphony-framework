# Flutter Test Execution Adapter

**Runner:** `flutter test`
**Report format:** Machine-readable with `--machine` flag

## Discovery

Flutter discovers test files in the `test/` directory:

```
test/**_test.dart     # unit and widget tests
integration_test/     # integration tests (separate runner)
```

Test functions use `test()` or `testWidgets()` within `group()` blocks.
Files must import `package:flutter_test/flutter_test.dart`.

List discovered test files:

```bash
find test -name '*_test.dart' -type f
```

## Execution

Run all tests with machine-readable output:

```bash
flutter test --machine > test-results.json
```

Run a specific test file:

```bash
flutter test test/widgets/home_screen_test.dart --machine
```

Run tests matching a name pattern:

```bash
flutter test --machine --name="renders loading state"
```

Run with coverage:

```bash
flutter test --machine --coverage --coverage-path=coverage/lcov.info
```

Generate HTML coverage report:

```bash
flutter test --coverage
genhtml coverage/lcov.info -o coverage/html
```

Run integration tests:

```bash
flutter test integration_test/app_test.dart --machine
```

Run integration tests on a specific device:

```bash
flutter test integration_test/ -d chrome --machine
```

## Result Parsing

The `--machine` flag outputs newline-delimited JSON events. Parse pass/fail/skip counts:

```bash
cat test-results.json | jq -s '
  [.[] | select(.type == "testDone" and .result == "success")] | length as $passed |
  [.[] | select(.type == "testDone" and .result == "failure")] | length as $failed |
  [.[] | select(.type == "testDone" and .skipped == true)] | length as $skipped |
  {passed: $passed, failed: $failed, skipped: $skipped,
   total: ($passed + $failed + $skipped)}'
```

Extract failure details:

```bash
cat test-results.json | jq -s '
  [.[] | select(.type == "error")]
  | map({testID: .testID, error: .error, stackTrace: .stackTrace})'
```

Map test IDs to test names:

```bash
cat test-results.json | jq -s '
  ([.[] | select(.type == "testStart")] | map({(.test.id | tostring): .test.name}) | add) as $names |
  [.[] | select(.type == "testDone" and .result == "failure")]
  | map({name: $names[.testID | tostring], testID: .testID})'
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
      - uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.24.0'
          channel: stable
          cache: true
      - run: flutter pub get
      - run: flutter test --machine --coverage > test-results.json
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-results
          path: |
            test-results.json
            coverage/lcov.info
```

Integration test CI job:

```yaml
  integration-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.24.0'
          channel: stable
      - run: flutter pub get
      - run: |
          chromedriver --port=4444 &
          flutter test integration_test/ -d chrome --machine > integration-results.json
```

## Common Issues

- **Golden file updates** — Golden image tests fail when expected images change. Run `flutter test --update-goldens` to regenerate baselines. Commit golden files to version control. Goldens are platform-sensitive; generate on the same OS as CI.
- **Platform-specific tests** — Use `skip` parameter for platform-dependent tests: `testWidgets('...', skip: !kIsWeb, (tester) async { ... })`. Run separate CI jobs per platform.
- **Integration test driver** — Integration tests need a running app instance. Use `IntegrationTestWidgetsFlutterBinding.ensureInitialized()` at the top of each integration test file.
- **Pub dependency conflicts** — Run `flutter pub get` before testing. Use `dependency_overrides` in `pubspec.yaml` sparingly and only during migration.
- **Slow widget tests** — Use `pumpAndSettle()` with a timeout: `await tester.pumpAndSettle(timeout: Duration(seconds: 10))`. Avoid infinite animations that prevent settling.
