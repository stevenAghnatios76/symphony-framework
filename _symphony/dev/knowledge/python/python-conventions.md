# Python — Conventions

**Principle:** Follow PEP 8, use type hints everywhere, leverage protocols for structural typing, organize with src layout, and automate with modern tooling.

## Pattern Examples

### 1. Type Hints and Protocols
```python
from typing import Protocol, TypeVar
from collections.abc import Sequence

class Repository(Protocol):
    def get(self, id: str) -> dict | None: ...
    def list(self, limit: int = 20) -> Sequence[dict]: ...

T = TypeVar('T')

def first_or_default(items: Sequence[T], default: T) -> T:
    return items[0] if items else default
```

### 2. Project Structure (src layout)
```
project/
├── src/
│   └── myapp/
│       ├── __init__.py
│       ├── models.py
│       ├── services.py
│       └── api/
│           ├── __init__.py
│           └── routes.py
├── tests/
│   ├── conftest.py
│   ├── test_models.py
│   └── test_services.py
├── pyproject.toml
└── README.md
```

### 3. Modern Tooling Configuration
```toml
# pyproject.toml
[tool.ruff]
target-version = "py312"
line-length = 99
select = ["E", "F", "I", "N", "UP", "B", "SIM", "RUF"]

[tool.mypy]
strict = true
warn_return_any = true
disallow_untyped_defs = true

[tool.pytest.ini_options]
testpaths = ["tests"]
addopts = "-v --tb=short --strict-markers"
```

## Anti-Patterns
- **No type hints** — always annotate function signatures and class attributes
- **Bare except clauses** — catch specific exceptions (`except ValueError:`, not `except:`)
- **Relative imports across packages** — use absolute imports from the package root
- **requirements.txt only** — use `pyproject.toml` as the single source of metadata and dependencies
- **Print debugging** — use `logging` module with structured output

## Integration Points
- **Linting:** `ruff check` (replaces flake8, isort, pyupgrade), `ruff format` (replaces black)
- **Type checking:** `mypy --strict` or `pyright` in CI
- **Testing:** `pytest` with `conftest.py` fixtures, `pytest-cov` for coverage
