# pytest — Python Testing Patterns

**Principle:** Use fixtures for reusable setup, parametrize for data-driven tests, markers for test organization, and conftest.py for shared configuration — let pytest's plugin ecosystem handle the rest.

## Pattern Examples

### 1. Fixtures with Scope and Dependency Injection
Define reusable test resources that pytest injects automatically:
```python
# conftest.py
import pytest
from app.db import create_engine, Session

@pytest.fixture(scope="session")
def db_engine():
    engine = create_engine("sqlite:///:memory:")
    yield engine
    engine.dispose()

@pytest.fixture(scope="function")
def db_session(db_engine):
    session = Session(bind=db_engine)
    yield session
    session.rollback()
    session.close()

# test_users.py — session is injected automatically
def test_create_user(db_session):
    user = User(name="Ada", email="ada@test.com")
    db_session.add(user)
    db_session.flush()
    assert user.id is not None
```

### 2. Parametrize for Data-Driven Tests
Run the same test logic with multiple inputs:
```python
import pytest

@pytest.mark.parametrize("input_str, expected", [
    ("hello world", "hello-world"),
    ("  extra  spaces  ", "extra-spaces"),
    ("UPPER CASE", "upper-case"),
    ("special!@#chars", "specialchars"),
])
def test_slugify(input_str, expected):
    assert slugify(input_str) == expected

# Combine multiple parameter sets
@pytest.mark.parametrize("role", ["admin", "editor"])
@pytest.mark.parametrize("method", ["GET", "POST"])
def test_endpoint_access(client, role, method):
    resp = client.generic(method, "/api/data", headers=auth_header(role))
    assert resp.status_code == 200
```

### 3. Markers and Custom Plugins
Organize tests with markers and extend pytest with hooks:
```python
# pyproject.toml
[tool.pytest.ini_options]
markers = [
    "slow: marks tests that take > 5s",
    "integration: requires external services",
]

# Usage in tests
@pytest.mark.slow
@pytest.mark.integration
def test_full_etl_pipeline(db_session, s3_bucket):
    result = run_pipeline(source=s3_bucket, target=db_session)
    assert result.rows_processed > 0

# Run selectively
# pytest -m "not slow"         — skip slow tests
# pytest -m "integration"      — run only integration tests
```

## Anti-Patterns
- **Fixture spaghetti** — deeply nested fixtures that depend on 5+ other fixtures become impossible to debug. Keep fixture chains shallow.
- **Session-scoped mutable state** — sharing mutable fixtures across tests causes order-dependent failures. Use function scope for mutable data.
- **No conftest hierarchy** — dumping all fixtures in one root conftest.py. Use per-directory conftest files for locality.
- **Bare asserts without messages** — `assert x == y` gives poor failure output. Use pytest's rich comparisons or add `assert x == y, f"got {x}"`.

## Integration Points
- **Plugins:** `pytest-cov` for coverage, `pytest-xdist` for parallel execution, `pytest-mock` for mocker fixture
- **CI:** `pytest --junitxml=report.xml` for CI-compatible output; `--tb=short` for concise tracebacks
- **pyproject.toml:** Centralize all pytest config under `[tool.pytest.ini_options]`
- **IDE:** PyCharm and VS Code detect pytest automatically; use `--pdb` for interactive debugging on failure
