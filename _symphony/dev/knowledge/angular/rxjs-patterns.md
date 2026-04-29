# Angular — RxJS Patterns

**Principle:** Think in streams. Use operators to transform, not subscribe-and-set. Handle errors at the stream level. Prevent memory leaks.

## Pattern Examples

### 1. Flattening Operators (Choose Correctly)
```typescript
// switchMap: cancel previous (search/typeahead)
searchTerm$.pipe(
  debounceTime(300),
  distinctUntilChanged(),
  switchMap(term => this.searchService.search(term))
);
// mergeMap: parallel (fire-and-forget notifications)
notification$.pipe(mergeMap(n => this.notificationService.send(n)));
// concatMap: sequential (ordered queue processing)
queue$.pipe(concatMap(item => this.processService.handle(item)));
// exhaustMap: ignore while busy (form submit)
submitClick$.pipe(exhaustMap(() => this.formService.submit(this.form.value)));
```

### 2. Error Recovery
```typescript
this.http.get<User[]>('/api/users').pipe(
  retry({ count: 3, delay: (error, retryCount) => timer(retryCount * 1000) }),
  catchError(error => {
    console.error('Failed after retries:', error);
    return of([] as User[]); // fallback value
  })
);
```

### 3. Combining Streams
```typescript
// Wait for all, emit latest of each
combineLatest([user$, permissions$, settings$]).pipe(
  map(([user, permissions, settings]) => ({ user, permissions, settings }))
);
// Wait for all, emit once
forkJoin({ user: getUser(id), orders: getOrders(id) });
```

## Anti-Patterns
- **Nested subscribes** — use flattening operators (switchMap, mergeMap, concatMap)
- **Not unsubscribing** — use `takeUntilDestroyed()`, `async` pipe, or `toSignal()`
- **Using `subscribe()` to set component properties** — pipe to template with `async` or `toSignal()`
- **catchError without returning observable** — must return `Observable` or rethrow with `throwError`
- **tap() for side effects that modify state** — tap is for logging/debugging, not state mutation

## Integration Points
- **Angular Signals:** Bridge with `toSignal()` (Observable → Signal) and `toObservable()` (Signal → Observable)
- **Testing:** `TestScheduler` for marble testing, `fakeAsync`/`tick` for time-based operators
- **HTTP:** HttpClient returns Observables — pipe directly, don't subscribe-and-set
