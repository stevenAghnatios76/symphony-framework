# OWASP Testing — Top 10 Vulnerability Patterns

**Principle:** Test every input boundary against the OWASP Top 10; assume all user-controlled data is hostile until proven safe.

## Pattern Examples

### 1. Injection Testing with Payloads
Craft parameterized payloads targeting SQL, NoSQL, LDAP, and OS command injection points:
```python
# SQLi detection — parameterized payload list
payloads = ["' OR '1'='1", "'; DROP TABLE users;--", "1 UNION SELECT null,username,password FROM users"]

for payload in payloads:
    resp = client.post("/login", json={"username": payload, "password": "test"})
    assert resp.status_code != 200, f"Injection succeeded with: {payload}"
    assert "error" not in resp.text.lower(), "Verbose error exposes internals"
```

### 2. XSS Detection with DOM Analysis
Test reflected, stored, and DOM-based XSS by injecting scripts and inspecting rendered output:
```javascript
// Stored XSS — submit payload, then verify output is escaped
const xssPayloads = [
  '<script>alert(1)</script>',
  '<img src=x onerror=alert(1)>',
  '"><svg onload=alert(1)>',
];

for (const payload of xssPayloads) {
  await api.post('/comments', { body: payload });
  const html = await page.content();
  expect(html).not.toContain(payload);        // must be escaped
  expect(html).toContain('&lt;script&gt;');    // verify encoding
}
```

### 3. CSRF Token Validation
Verify that state-changing requests reject missing or tampered CSRF tokens:
```python
# Missing token — expect rejection
resp = client.post("/transfer", json={"to": "attacker", "amount": 1000},
                   headers={"Cookie": session_cookie})
assert resp.status_code == 403

# Tampered token — expect rejection
resp = client.post("/transfer", json={"to": "attacker", "amount": 1000},
                   headers={"Cookie": session_cookie, "X-CSRF-Token": "forged"})
assert resp.status_code == 403
```

## Anti-Patterns
- **Testing only happy paths** — real attackers send malformed input. Always include negative payloads.
- **Hard-coded single payload** — vulnerabilities vary by context. Use payload lists covering multiple bypass techniques.
- **Ignoring response content** — a 200 OK with an error message may still leak info. Inspect body, headers, and timing.
- **Skipping authentication endpoints** — login, password reset, and signup are high-value targets.
- **Manual-only testing** — automate regression payloads in CI so fixes are never silently reverted.

## Integration Points
- **CI Pipeline:** Run OWASP ZAP baseline scan on every PR against a staging environment
- **Test Architect Agent:** Auto-generates injection payloads from API schema (OpenAPI/GraphQL introspection)
- **Reporting Protocol:** Findings map to CWE IDs for traceability and CVSS scoring
- **Security Gate:** Block deployment when critical or high severity findings remain unresolved
