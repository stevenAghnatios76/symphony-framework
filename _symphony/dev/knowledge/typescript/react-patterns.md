# TypeScript — React Patterns

**Principle:** Components are functions that take typed props and return JSX. Prefer composition over inheritance. Server components by default, client only when interactive.

## Pattern Examples

### 1. Typed Props and Children
```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function Button({ variant, size = 'md', disabled = false, onClick, children }: ButtonProps) {
  return <button className={`btn-${variant} btn-${size}`} disabled={disabled} onClick={onClick}>{children}</button>;
}
```

### 2. Custom Hooks with Generics
```typescript
function useFetch<T>(url: string): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({ status: 'idle' });
  useEffect(() => {
    setState({ status: 'loading' });
    fetch(url).then(r => r.json()).then(data => setState({ status: 'success', data }))
      .catch(error => setState({ status: 'error', error }));
  }, [url]);
  return state;
}
```

### 3. Context with Type Safety
```typescript
interface AuthContext { user: User | null; login: (creds: Credentials) => Promise<void>; logout: () => void; }
const AuthCtx = createContext<AuthContext | null>(null);
function useAuth(): AuthContext {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be within AuthProvider');
  return ctx;
}
```

## Anti-Patterns
- **Prop drilling** — use context or composition (render props, children) for deep data
- **useEffect for derived state** — use `useMemo` or compute inline
- **Mutating state directly** — always return new references
- **Giant components** — extract custom hooks for logic, child components for UI sections
- **Index as key** — use stable unique IDs for list rendering

## Integration Points
- **React 19:** Server Components (default), `use()` hook, Actions
- **State management:** Zustand (simple), Jotai (atomic), TanStack Query (server state)
- **Testing:** React Testing Library, `render` + `screen` + `userEvent`
