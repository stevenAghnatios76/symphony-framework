# Pytest Test Execution Adapter

**Runner:** `python -m pytest`
**Report format:** `pytest-json-report` plugin (`--json-report`)

## Discovery

Pytest discovers test files following these conventions:

```
test_*.py      # files prefixed with test_
*_test.py      # files suffixed with _test
```

Test functions must be prefixed with `test_`, and test classes prefixed with `Test`.

Override discovery in `pyproject.toml`:

```toml
[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = ["test_*.py", "*_test.py"]
python_classes = ["Test*"]
python_functions = ["test_*"]
```

List discovered tests without running them:

```bash
python -m pytest --collect-only -q
```

## Execution

Run all tests with JSON output:

```bash
pip install pytest-json-report
python -m pytest --json-report --json-report-file=test-results.json
```

Run a specific file, class, or test:

```bash
python -m pytest tests/test_parser.py --json-report
python -m pytest tests/test_parser.py::TestParser::test_empty_input --json-report
```

Run with keyword filtering:

```bash
python -m pytest -k "parse and not slow" --json-report
```

Run with coverage:

```bash
pip install pytest-cov
python -m pytest --json-report --json-report-file=test-results.json \
  --cov=src --cov-report=json:coverage.json
```

Run with verbose failure output:

```bash
python -m pytest --json-report --tb=short -v
```

## Result Parsing

The JSON report contains a `summary` object. Parse pass/fail/skip counts:

```bash
cat test-results.json | jq '{
  total: .summary.total,
  passed: .summary.passed,
  failed: (.summary.failed // 0),
  skipped: (.summary.deselected // 0) + (.summary.xfailed // 0),
  duration_s: .duration
}'
```

Extract failure details:

```bash
cat test-results.json | jq '.tests[]
  | select(.outcome == "failed")
  | {nodeid: .nodeid, message: .call.longrepr}'
```

## CI Integration

GitHub Actions workflow with tox:

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: ["3.11", "3.12", "3.13"]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: ${{ matrix.python-version }}
          cache: pip
      - run: pip install tox tox-gh-actions
      - run: tox
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-results-${{ matrix.python-version }}
          path: test-results.json
```

Matching `tox.ini` configuration:

```ini
[tox]
envlist = py{311,312,313}

[testenv]
deps = pytest, pytest-json-report, pytest-cov
commands = pytest --json-report --json-report-file=test-results.json --cov=src
```

## Common Issues

- **Fixture scope confusion** — `session`-scoped fixtures run once for the entire session, `function`-scoped (default) run per test. Mixing scopes (e.g., function-scoped fixture depending on session-scoped) raises `ScopeMismatch`. Use `@pytest.fixture(scope="module")` for expensive setup shared within a file.
- **Import path conflicts** — Add `__init__.py` to test directories or set `pythonpath` in `pyproject.toml`. Use `python -m pytest` instead of `pytest` to ensure the project root is on `sys.path`.
- **conftest.py discovery** — Pytest loads `conftest.py` from the rootdir and all subdirectories. Fixtures defined in a nested `conftest.py` are only available to tests in that directory and below.
- **Slow test isolation** — Use `pytest-xdist` for parallel execution: `python -m pytest -n auto`. Ensure tests do not share mutable state or temp files.
- **Plugin conflicts** — Pin plugin versions in `requirements-test.txt`. Use `python -m pytest --co -q` to verify collection works before full runs.
