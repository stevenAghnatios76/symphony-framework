# TypeScript — Conventions

**Principle:** Enable strict mode, use the type system expressively, organize with barrel exports and path aliases, treat types as documentation.

## Pattern Examples

### 1. Strict Mode and Utility Types
Enable `"strict": true` in tsconfig.json. Derive types from a source of truth:
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}
type CreateUserInput = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;
type UserSummary = Pick<User, 'id' | 'name'>;
type PartialUpdate = Partial<Omit<User, 'id'>>;
```

### 2. Discriminated Unions for State Machines
```typescript
type AsyncState<T, E = Error> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: E };
```
The compiler forces handling all variants in switch/if chains.

### 3. Barrel Exports and Path Aliases
```typescript
// src/features/users/index.ts
export { UserService } from './user.service';
export type { User, CreateUserInput } from './user.types';
```
Configure paths in tsconfig: `"@/features/*": ["src/features/*"]`.

## Anti-Patterns
- **`any` type** — defeats type safety. Use `unknown` and narrow with type guards.
- **Type assertions (`as`)** — skip type checking. Use type guards or overloads.
- **Enums for simple unions** — prefer `type Status = 'active' | 'inactive'` over `enum Status`.
- **Deep relative imports** — use path aliases (`@/features/users` not `../../../features/users`).
- **No strict mode** — allows implicit any, missing null checks, and unchecked indexing.

## Integration Points
- **React:** Typed props (`FC<Props>`), typed hooks (`useState<T>`), typed context
- **Next.js:** Typed route handlers, page props, metadata, middleware
- **Express:** Typed request/response (`Request<Params, ResBody, ReqBody, Query>`)
- **ESLint:** `@typescript-eslint/recommended` + `strict` configs
