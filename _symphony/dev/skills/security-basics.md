# Security Basics

<!-- SECTION: owasp-top-10 -->
## OWASP Top 10

1. **Injection** — Use parameterized queries. Never concatenate user input into SQL/commands.
2. **Broken Authentication** — Use established auth libraries. Enforce MFA. Rate-limit login attempts.
3. **Sensitive Data Exposure** — Encrypt at rest and in transit. Don't log PII. Mask in responses.
4. **XML External Entities** — Disable DTD processing. Use JSON over XML.
5. **Broken Access Control** — Check authorization on every request. Default deny.
6. **Security Misconfiguration** — No default passwords. Disable debug in production. Keep dependencies updated.
7. **XSS** — Encode output. Use Content-Security-Policy headers. Sanitize rich text.
8. **Insecure Deserialization** — Don't deserialize untrusted data. Use allowlists for types.
9. **Using Components with Known Vulns** — Run `npm audit` / `pip audit` / `govulncheck` in CI.
10. **Insufficient Logging** — Log auth failures, access denials, input validation failures. Include trace IDs.

<!-- SECTION: input-validation -->
## Input Validation

**Validate at system boundaries:** API endpoints, form submissions, file uploads, webhook receivers.

**Rules:**
- Validate type, length, range, format, and allowed characters
- Use schema validation (Zod, Pydantic, JSON Schema) — not manual checks
- Reject invalid input early with clear error messages
- Never trust client-side validation alone
- Sanitize before storage, encode before display

**File uploads:** Validate MIME type (not just extension), enforce size limits, scan for malware, store outside web root, generate new filenames.

<!-- SECTION: secrets-management -->
## Secrets Management

**Never commit secrets.** Use `.env` files (gitignored) for local dev. Use vault/secret manager for production.

**Detection:**
- Pre-commit hooks with `gitleaks` or `detect-secrets`
- CI pipeline secret scanning
- Regular rotation schedule

**If a secret is committed:** Rotate immediately. Rewriting git history is not sufficient — the secret was exposed the moment it was pushed.

**Environment variables:** Prefix with `APP_` or `{PROJECT}_`. Validate required env vars at startup with fail-fast.

<!-- SECTION: cors-csrf -->
## CORS & CSRF

**CORS:** Configure allowed origins explicitly. Never use `*` with credentials. Set `Access-Control-Allow-Methods` to only what's needed.

**CSRF:** Use anti-CSRF tokens for state-changing requests. Set `SameSite=Strict` or `SameSite=Lax` on cookies. Verify `Origin` header on mutations.

**Headers to set:**
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Content-Security-Policy: default-src 'self'`
- `Referrer-Policy: strict-origin-when-cross-origin`
