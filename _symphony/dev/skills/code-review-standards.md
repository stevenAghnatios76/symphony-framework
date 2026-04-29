# Code Review Standards

<!-- SECTION: review-checklist -->
## Review Checklist

**Correctness:**
- Does the code do what the story/ticket asks?
- Are edge cases handled?
- Are error paths covered?
- Is the logic correct for boundary values?

**Tests:**
- Are there tests for new behavior?
- Do tests cover happy path AND error paths?
- Are tests readable and maintainable?
- Would you know what broke if a test failed?

**Security:**
- No hardcoded secrets, API keys, or passwords
- Input validation on all user-supplied data
- No SQL injection vectors (parameterized queries)
- No XSS vectors (output encoding)
- Authentication/authorization checked on all endpoints

**Performance:**
- No N+1 queries
- No unbounded list queries (missing pagination)
- No blocking calls in hot paths
- Large data sets handled with streaming/batching

**Readability:**
- Clear variable and function names
- Functions do one thing
- No deep nesting (max 3 levels)
- No magic numbers or strings

<!-- SECTION: solid-principles -->
## SOLID Principles

**S — Single Responsibility:** A class/module has one reason to change.
**O — Open/Closed:** Open for extension, closed for modification. Use interfaces.
**L — Liskov Substitution:** Subtypes must be substitutable for their base types.
**I — Interface Segregation:** Many specific interfaces over one general-purpose interface.
**D — Dependency Inversion:** Depend on abstractions, not concretions.

**In practice:** If a function takes 5+ parameters, it's probably doing too much. If a file is over 300 lines, consider splitting. If a change to module A requires changes to modules B and C, coupling is too tight.

<!-- SECTION: complexity-metrics -->
## Complexity Metrics

**Cyclomatic complexity:** Count decision points (if, else, case, &&, ||, ?:). Target: ≤10 per function, ≤5 for critical paths.

**Cognitive complexity:** How hard is the code to understand? Nested conditions, breaks in linear flow, and recursion add cognitive load. Target: ≤15 per function.

**Function length:** ≤30 lines (excluding blank lines and comments). If longer, extract.

**Parameter count:** ≤4 parameters. If more, use an options/config object.

**Nesting depth:** ≤3 levels. Use early returns (guard clauses) to flatten.
