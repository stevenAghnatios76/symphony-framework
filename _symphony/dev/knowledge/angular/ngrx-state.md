# Angular — NgRx State Management

**Principle:** Single source of truth. State is read-only. Changes via pure reducers. Side effects in Effects. Select with memoized selectors.

## Pattern Examples

### 1. Feature Store Setup
```typescript
// users.state.ts
export interface UsersState { users: User[]; loading: boolean; error: string | null; }
const initialState: UsersState = { users: [], loading: false, error: null };

export const usersFeature = createFeature({
  name: 'users',
  reducer: createReducer(
    initialState,
    on(UsersActions.load, (state) => ({ ...state, loading: true, error: null })),
    on(UsersActions.loadSuccess, (state, { users }) => ({ ...state, users, loading: false })),
    on(UsersActions.loadFailure, (state, { error }) => ({ ...state, error, loading: false })),
  ),
});
```

### 2. Effects for Side Effects
```typescript
export const loadUsers = createEffect(
  (actions$ = inject(Actions), userService = inject(UserService)) =>
    actions$.pipe(
      ofType(UsersActions.load),
      switchMap(() => userService.getAll().pipe(
        map(users => UsersActions.loadSuccess({ users })),
        catchError(error => of(UsersActions.loadFailure({ error: error.message }))),
      )),
    ),
  { functional: true }
);
```

### 3. Selectors with Composition
```typescript
export const { selectUsers, selectLoading, selectError } = usersFeature;
export const selectActiveUsers = createSelector(selectUsers, users => users.filter(u => u.isActive));
export const selectUserCount = createSelector(selectUsers, users => users.length);
```

## Anti-Patterns
- **Storing derived data** — use selectors to compute derived values
- **Effects that dispatch multiple actions** — use single action with reducer handling
- **Direct store mutation** — always return new state objects
- **Over-using NgRx** — local component state (signals) is fine for UI-only state
- **Entity management without EntityAdapter** — use `@ngrx/entity` for CRUD collections

## Integration Points
- **DevTools:** `@ngrx/store-devtools` for time-travel debugging
- **Router:** `@ngrx/router-store` for router state in store
- **Entity:** `@ngrx/entity` for normalized collections with CRUD helpers
