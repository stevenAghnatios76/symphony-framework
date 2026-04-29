# Angular — Patterns

**Principle:** Reactive first. Declarative templates. Dependency injection for composition. Lazy-load routes for performance.

## Pattern Examples

### 1. Reactive Forms with Validation
```typescript
@Component({ ... })
export class UserFormComponent {
  private fb = inject(NonNullableFormBuilder);
  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    role: ['user' as 'user' | 'admin'],
  });

  onSubmit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const value = this.form.getRawValue();
    // value is fully typed: { name: string; email: string; role: 'user' | 'admin' }
  }
}
```

### 2. Route Guards (Functional)
```typescript
export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isAuthenticated() ? true : router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
// Usage: { path: 'dashboard', canActivate: [authGuard], component: DashboardComponent }
```

### 3. HTTP Interceptors (Functional)
```typescript
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).getToken();
  if (token) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
  return next(req);
};
// provideHttpClient(withInterceptors([authInterceptor]))
```

## Anti-Patterns
- **Class-based guards/interceptors** — use functional (Angular 16+)
- **Subscribing in components to set properties** — use `async` pipe or `toSignal()`
- **Barrel exports that import entire modules** — tree-shaking can't help
- **Deeply nested route configs** — flatten with `loadChildren` for lazy loading

## Integration Points
- **State:** NgRx (complex), NGXS (simpler), or signal-based stores
- **HTTP:** HttpClient with typed responses, interceptors for auth/logging/retry
- **Testing:** HttpClientTestingModule, RouterTestingModule, fakeAsync/tick for timers
