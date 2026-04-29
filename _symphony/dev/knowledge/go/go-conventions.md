# Go — Conventions

**Principle:** Simplicity over cleverness. Small interfaces, explicit error handling, package-level organization, and standard tooling.

## Pattern Examples

### 1. Package Layout
```
project/
├── cmd/
│   └── server/
│       └── main.go          # Entry point
├── internal/
│   ├── user/
│   │   ├── handler.go       # HTTP handlers
│   │   ├── service.go       # Business logic
│   │   ├── repository.go    # Data access
│   │   └── model.go         # Types
│   └── middleware/
│       └── auth.go
├── pkg/                      # Public libraries (use sparingly)
├── go.mod
└── go.sum
```

### 2. Error Handling
```go
type NotFoundError struct {
    Resource string
    ID       string
}

func (e *NotFoundError) Error() string {
    return fmt.Sprintf("%s %s not found", e.Resource, e.ID)
}

func GetUser(ctx context.Context, id string) (*User, error) {
    user, err := repo.FindByID(ctx, id)
    if err != nil {
        return nil, fmt.Errorf("GetUser(%s): %w", id, err)
    }
    if user == nil {
        return nil, &NotFoundError{Resource: "user", ID: id}
    }
    return user, nil
}
```

### 3. Small Interfaces
```go
type Reader interface {
    Read(p []byte) (n int, err error)
}

type UserStore interface {
    GetUser(ctx context.Context, id string) (*User, error)
    ListUsers(ctx context.Context, limit int) ([]*User, error)
}

// Accept interfaces, return structs
func NewService(store UserStore, logger *slog.Logger) *Service {
    return &Service{store: store, logger: logger}
}
```

## Anti-Patterns
- **Panic for expected errors** — return errors, only panic for programmer bugs (impossible states)
- **Large interfaces** — keep interfaces ≤3 methods. Larger means tighter coupling.
- **Package `utils` or `helpers`** — name packages by what they provide, not how they're used
- **Ignoring errors** — never use `_ = someFunc()`. Handle or explicitly comment why it's safe.
- **init() for complex setup** — use explicit initialization in main, not hidden init functions

## Integration Points
- **Tooling:** `go vet`, `staticcheck`, `golangci-lint` in CI
- **Formatting:** `gofmt` or `goimports` — non-negotiable, run on save
- **Documentation:** `godoc` comments on exported types and functions
