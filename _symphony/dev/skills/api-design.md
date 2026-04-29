# API Design

<!-- SECTION: rest-conventions -->
## REST Conventions

**Resource naming:** Plural nouns, lowercase with hyphens, max 3 levels of nesting.
- Good: `GET /api/v1/users/{id}/orders`
- Bad: `GET /api/v1/getUser`, `GET /api/v1/users/{id}/orders/{oid}/items/{iid}/details`

**HTTP methods:**
| Method | Purpose | Idempotent | Safe |
|--------|---------|------------|------|
| GET | Read resource(s) | Yes | Yes |
| POST | Create resource | No | No |
| PUT | Full replace | Yes | No |
| PATCH | Partial update | No | No |
| DELETE | Remove resource | Yes | No |

**Status codes:**
- 200 OK, 201 Created, 204 No Content
- 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found
- 409 Conflict, 422 Unprocessable Entity, 429 Too Many Requests
- 500 Internal Server Error

**Pagination:** Offset (`?page=1&per_page=20`) or cursor (`?cursor=abc&limit=20`).
- Response includes: `total`, `page`, `per_page`, `next_cursor` (if cursor-based)

<!-- SECTION: graphql -->
## GraphQL Design

**Schema:** Descriptive type names, input types for mutations, enums for fixed value sets.

**Mutations return payload types** with optional `errors` field:
```graphql
type CreateUserPayload {
  user: User
  errors: [UserError!]
}
```

**Resolvers:** Keep thin — delegate to service layer. Use DataLoader for N+1 prevention.

**Subscriptions:** Only for real-time needs (chat, notifications). Use polling for infrequent data.

<!-- SECTION: openapi -->
## OpenAPI Specification

**Spec-first development:** Write the OpenAPI spec before implementing. Generate server stubs and client SDKs from the spec.

**Best practices:**
- Every endpoint needs `operationId`, `summary`, and `tags`
- Use `$ref` for shared schemas in `components/schemas/`
- Include request/response examples
- Document all error responses
- Version: openapi 3.0.3 or 3.1.0

<!-- SECTION: versioning -->
## API Versioning

**URL versioning (recommended):** `/api/v1/users`, `/api/v2/users`

**Breaking changes:** Field removal/rename, type change, required field addition, auth mechanism change, error format change.

**Deprecation policy:**
1. Announce with 6-month sunset timeline
2. Add `Sunset` and `Deprecation` headers to responses
3. Log usage of deprecated endpoints
4. Remove after sunset date

<!-- SECTION: error-standards -->
## Error Standards (RFC 7807)

**Problem Details response:**
```json
{
  "type": "https://api.example.com/errors/validation",
  "title": "Validation Error",
  "status": 422,
  "detail": "The 'email' field must be a valid email address",
  "instance": "/api/v1/users",
  "trace_id": "abc-123",
  "errors": [
    { "field": "email", "code": "INVALID_FORMAT", "detail": "Must be valid email" }
  ]
}
```

**Rules:**
- Never expose stack traces in responses
- Log full error details server-side
- Include `trace_id` for correlation
- Use machine-readable error codes (INVALID_FORMAT, NOT_FOUND, RATE_LIMITED)
