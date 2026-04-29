# Penetration Testing — Methodology and Reporting

**Principle:** Simulate real adversary behavior in controlled phases; document every finding with reproducible steps, impact, and remediation guidance.

## Pattern Examples

### 1. Reconnaissance and Enumeration
Systematically map the attack surface before attempting exploitation:
```bash
# Subdomain enumeration
subfinder -d example.com -o subdomains.txt

# Port scanning and service detection
nmap -sV -sC -oA scan-results -p- staging.example.com

# Directory and API endpoint discovery
ffuf -u https://staging.example.com/FUZZ \
     -w /usr/share/wordlists/dirb/common.txt \
     -mc 200,301,403 -o endpoints.json
```

### 2. Exploitation with Controlled Scope
Test confirmed vulnerabilities with explicit rules of engagement and scope limits:
```python
# Automated auth bypass check — scoped to staging only
import requests

STAGING_ONLY = "https://staging.example.com"
endpoints = ["/api/admin/users", "/api/admin/config", "/api/internal/metrics"]

for endpoint in endpoints:
    # Test without auth token
    resp = requests.get(f"{STAGING_ONLY}{endpoint}")
    if resp.status_code == 200:
        print(f"[CRITICAL] Unauthenticated access: {endpoint}")

    # Test with low-privilege token
    resp = requests.get(f"{STAGING_ONLY}{endpoint}",
                        headers={"Authorization": f"Bearer {viewer_token}"})
    if resp.status_code == 200:
        print(f"[HIGH] Privilege escalation: {endpoint}")
```

### 3. Report Template with CVSS Scoring
Structure findings for consistent communication with development teams:
```markdown
## Finding: Unauthenticated Admin API Access
- **CVSS 3.1 Score:** 9.8 (Critical) — AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H
- **CWE:** CWE-306 (Missing Authentication for Critical Function)
- **Affected Endpoint:** POST /api/admin/users
- **Steps to Reproduce:**
  1. Send POST to /api/admin/users without Authorization header
  2. Observe 200 OK with user creation confirmation
- **Impact:** Attacker can create admin accounts without authentication
- **Remediation:** Add authentication middleware to all /api/admin/* routes
- **Evidence:** [Screenshot / HTTP request-response log attached]
```

## Anti-Patterns
- **No rules of engagement** — pen testing without written scope leads to legal and operational risk.
- **Skipping reconnaissance** — jumping to exploitation misses attack surface. Enumerate first.
- **Testing production without approval** — active exploitation can cause outages. Use staging or isolated environments.
- **Findings without reproduction steps** — developers cannot fix what they cannot reproduce. Always include exact steps.
- **One-time pen test** — threats evolve. Schedule quarterly or after major releases.

## Integration Points
- **Security Gate:** Pen test sign-off required before major version releases
- **Test Architect Agent:** Converts pen test findings into automated regression tests
- **Memory Protocol:** Stores historical pen test results for trend analysis across releases
- **Reporting Protocol:** Findings exported as SARIF or JSON for integration with issue trackers
