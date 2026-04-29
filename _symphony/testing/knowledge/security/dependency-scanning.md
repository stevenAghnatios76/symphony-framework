# Dependency Scanning — Vulnerability Detection in Supply Chain

**Principle:** Every third-party dependency is a trust boundary; scan continuously, gate on severity, and automate remediation.

## Pattern Examples

### 1. CI Gate on Critical Vulnerabilities
Block merges when critical or high vulnerabilities are found in dependencies:
```yaml
# GitHub Actions — npm audit gate
- name: Audit dependencies
  run: |
    npm audit --audit-level=high --json > audit-report.json
    if [ $? -ne 0 ]; then
      echo "::error::High/critical vulnerabilities found"
      cat audit-report.json | jq '.vulnerabilities | to_entries[] | select(.value.severity == "critical" or .value.severity == "high") | .key'
      exit 1
    fi
```

### 2. Allowlisting Known Issues
Suppress accepted risks with expiring allowlist entries so they are revisited:
```json
// .snyk policy file — allowlist with expiry
{
  "ignore": {
    "SNYK-JS-LODASH-1018905": {
      "reason": "Not exploitable — function unused in our code path",
      "expires": "2026-06-01T00:00:00.000Z",
      "created": "2026-04-29T00:00:00.000Z"
    }
  }
}
```

### 3. Automated PR Creation for Fixes
Configure bots to open PRs that bump vulnerable dependencies with passing tests:
```yaml
# Dependabot config — .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "daily"
    open-pull-requests-limit: 10
    labels: ["security", "dependencies"]
    reviewers: ["security-team"]
```

## Anti-Patterns
- **Scanning only at release** — vulnerabilities land between releases. Scan on every PR and on a daily schedule.
- **Ignoring transitive dependencies** — most CVEs live in indirect deps. Use lock-file aware scanners (`npm audit`, `pip-audit`).
- **Permanent allowlists** — accepted risks become forgotten risks. Always set an expiry date and review cadence.
- **Single scanner reliance** — different tools have different advisory databases. Layer Snyk + npm audit or Safety + pip-audit.
- **Blocking on informational findings** — gate only on high/critical. Low/medium go to a tracking ticket.

## Integration Points
- **CI Pipeline:** Run `snyk test` or `npm audit` as a required check before merge
- **Conductor Workflow:** Security scan step inserted automatically in the build wave
- **Memory Protocol:** Track allowlisted CVEs and their expiry dates in project memory
- **PR Agent:** Auto-generates dependency update PRs with changelog summaries
