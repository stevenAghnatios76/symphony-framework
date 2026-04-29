# Go — Standard Library Patterns

**Principle:** The standard library is Go's greatest strength. Prefer stdlib over third-party packages. Use context for cancellation, io interfaces for composition, and net/http for servers.

## Pattern Examples

### 1. HTTP Server with Middleware
```go
func main() {
    mux := http.NewServeMux()
    mux.HandleFunc("GET /users/{id}", getUser)
    mux.HandleFunc("POST /users", createUser)

    handler := logging(recovery(mux))
    srv := &http.Server{Addr: ":8080", Handler: handler, ReadTimeout: 5 * time.Second, WriteTimeout: 10 * time.Second}
    log.Fatal(srv.ListenAndServe())
}

func logging(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()
        next.ServeHTTP(w, r)
        slog.Info("request", "method", r.Method, "path", r.URL.Path, "duration", time.Since(start))
    })
}
```

### 2. Context Propagation
```go
func getUser(w http.ResponseWriter, r *http.Request) {
    ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
    defer cancel()

    id := r.PathValue("id")
    user, err := userService.GetByID(ctx, id)
    if err != nil {
        if errors.Is(err, context.DeadlineExceeded) {
            http.Error(w, "request timeout", http.StatusGatewayTimeout)
            return
        }
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    json.NewEncoder(w).Encode(user)
}
```

### 3. io.Reader/Writer Composition
```go
func processFile(r io.Reader, w io.Writer) error {
    // Wrap reader with buffering and decoding
    br := bufio.NewReader(r)
    decoder := json.NewDecoder(br)

    // Wrap writer with buffering and encoding
    bw := bufio.NewWriter(w)
    defer bw.Flush()
    encoder := json.NewEncoder(bw)

    for decoder.More() {
        var record Record
        if err := decoder.Decode(&record); err != nil {
            return fmt.Errorf("decode: %w", err)
        }
        record.ProcessedAt = time.Now()
        if err := encoder.Encode(record); err != nil {
            return fmt.Errorf("encode: %w", err)
        }
    }
    return nil
}
```

## Anti-Patterns
- **Third-party HTTP routers for simple APIs** — Go 1.22+ `ServeMux` supports method+path patterns natively
- **Ignoring context cancellation** — always pass and check `ctx` in long operations
- **`ioutil` package** — deprecated since Go 1.16. Use `io` and `os` equivalents.
- **Manual JSON field mapping** — use struct tags (`json:"fieldName"`) consistently

## Integration Points
- **Structured logging:** `slog` (stdlib since Go 1.21) with JSON or text handler
- **Sync primitives:** `sync.Mutex`, `sync.WaitGroup`, `sync.Once`, channels for concurrency
- **Encoding:** `encoding/json`, `encoding/xml`, `encoding/csv` — all use io interfaces
