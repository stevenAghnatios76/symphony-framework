# SAST & DAST — Static and Dynamic Application Security Testing

**Principle:** Combine static analysis for early detection with dynamic analysis for runtime validation; neither alone is sufficient.

## Pattern Examples

### 1. Custom SAST Rules with Semgrep
Write project-specific rules to catch patterns your team has seen before:
```yaml
# .semgrep/rules/no-raw-sql.yml
rules:
  - id: no-raw-sql-strings
    pattern: |
      db.query($SQL, ...)
    message: "Use parameterized queries. Raw SQL strings risk injection."
    languages: [python]
    severity: ERROR
    fix: "db.query(text($SQL), params)"
    metadata:
      cwe: ["CWE-89"]
      confidence: HIGH
```

### 2. DAST Baseline Scanning with OWASP ZAP
Run automated baseline scans against a deployed staging environment on every build:
```yaml
# CI job — ZAP baseline scan
- name: DAST baseline scan
  run: |
    docker run --rm -v $(pwd):/zap/wrk owasp/zap2docker-stable \
      zap-baseline.py \
      -t https://staging.example.com \
      -c zap-baseline.conf \
      -J zap-report.json \
      -l WARN
    # Parse and fail on high alerts
    HIGH_COUNT=$(jq '[.site[].alerts[] | select(.riskcode >= 3)] | length' zap-report.json)
    [ "$HIGH_COUNT" -eq 0 ] || exit 1
```

### 3. False Positive Management
Track and suppress verified false positives so they don't block pipelines:
```yaml
# semgrep — inline suppression with reason
data = db.query(
    text("SELECT * FROM users WHERE id = :id"),  # nosemgrep: no-raw-sql-strings — uses parameterized text()
    {"id": user_id}
)

# CodeQL — query filter file (codeql-config.yml)
query-filters:
  - exclude:
      id: py/sql-injection
      tags: ["tested/false-positive"]
```

## Anti-Patterns
- **SAST only, no DAST** — static analysis misses runtime config issues, auth flaws, and header problems.
- **DAST only, no SAST** — dynamic scans miss dead code paths and logic bugs that are not yet reachable.
- **Ignoring all findings** — alert fatigue leads to real issues being overlooked. Triage and categorize every finding.
- **Running DAST against production** — active scanning can corrupt data. Always target staging or ephemeral environments.
- **No custom rules** — default rulesets miss project-specific patterns. Add rules for your known vulnerability classes.

## Integration Points
- **CI Pipeline:** SAST (Semgrep/CodeQL) runs on PR diff; DAST (ZAP) runs post-deploy to staging
- **Gate Enforcer:** Blocks promotion from staging to production on unresolved high-severity findings
- **Test Architect Agent:** Generates SAST rules from historical vulnerability reports
- **Reporting Protocol:** Unified dashboard merging SAST + DAST findings by CWE category
