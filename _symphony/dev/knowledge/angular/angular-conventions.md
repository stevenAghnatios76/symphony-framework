# Angular — Conventions

**Principle:** Follow the Angular Style Guide. Use standalone components. Leverage signals for reactivity. CLI generates consistent structure.

## Pattern Examples

### 1. Standalone Components
```typescript
@Component({
  selector: 'app-user-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="user-card">
      <h3>{{ user().name }}</h3>
      <a [routerLink]="['/users', user().id]">View Profile</a>
    </div>
  `,
})
export class UserCardComponent {
  user = input.required<User>();
}
```

### 2. Signals for State
```typescript
@Component({ ... })
export class CounterComponent {
  count = signal(0);
  doubled = computed(() => this.count() * 2);

  increment() { this.count.update(c => c + 1); }
}
```

### 3. Inject Function
```typescript
@Component({ ... })
export class UserListComponent {
  private userService = inject(UserService);
  users = toSignal(this.userService.getAll());
}
```

## Anti-Patterns
- **NgModules for new components** — use standalone components (Angular 17+)
- **Manual subscriptions without cleanup** — use `takeUntilDestroyed()` or `toSignal()`
- **Logic in templates** — extract to computed signals or pipes
- **God services** — one service per domain concern
- **Direct DOM manipulation** — use Renderer2 or template bindings

## Integration Points
- **CLI:** `ng generate component/service/pipe --standalone`
- **Testing:** TestBed + ComponentFixture, spectator for ergonomic tests
- **Build:** Esbuild (default in Angular 17+), zoneless change detection
