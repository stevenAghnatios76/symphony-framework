# TypeScript — Express Patterns

**Principle:** Type your middleware chain. Validate at the boundary. Keep route handlers thin — delegate to services.

## Pattern Examples

### 1. Typed Request/Response
```typescript
interface CreateUserBody { name: string; email: string; }
interface UserResponse { id: string; name: string; email: string; }

router.post<{}, UserResponse, CreateUserBody>(
  '/users',
  validateBody(CreateUserSchema),
  async (req, res) => {
    const user = await userService.create(req.body);
    res.status(201).json(user);
  }
);
```

### 2. Error Handling Middleware
```typescript
class AppError extends Error {
  constructor(public statusCode: number, message: string, public code: string) { super(message); }
}
const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ type: err.code, title: err.message, status: err.statusCode });
    return;
  }
  console.error(err);
  res.status(500).json({ type: 'INTERNAL_ERROR', title: 'Internal Server Error', status: 500 });
};
app.use(errorHandler);
```

### 3. Validation Middleware with Zod
```typescript
import { ZodSchema } from 'zod';
function validateBody<T>(schema: ZodSchema<T>): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) { res.status(422).json({ errors: result.error.flatten() }); return; }
    req.body = result.data;
    next();
  };
}
```

## Anti-Patterns
- **Business logic in route handlers** — extract to service layer
- **No error middleware** — unhandled errors crash the process
- **Trusting req.body without validation** — always validate with schema
- **Synchronous file I/O in handlers** — use `fs/promises`, never `fs.readFileSync` in request paths
- **No request timeout** — set `server.timeout` and per-route timeouts

## Integration Points
- **Auth:** Passport.js, express-jwt, or custom middleware
- **Logging:** Pino or Winston with request correlation IDs
- **Testing:** Supertest for HTTP assertions, dependency injection for services
