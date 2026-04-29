# Flutter — State Management

**Principle:** Choose state management complexity proportional to app complexity. Riverpod for most apps, BLoC for large teams with strict patterns, simple setState for widget-local state.

## Pattern Examples

### 1. Riverpod Providers
```dart
// Define providers
final userRepositoryProvider = Provider((ref) => UserRepository(ref.read(httpClientProvider)));
final usersProvider = FutureProvider.autoDispose((ref) async {
  final repo = ref.read(userRepositoryProvider);
  return repo.getAll();
});

// Consume in widget
class UserListPage extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final usersAsync = ref.watch(usersProvider);
    return usersAsync.when(
      data: (users) => ListView(children: users.map((u) => UserTile(user: u)).toList()),
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (err, stack) => Center(child: Text('Error: $err')),
    );
  }
}
```

### 2. BLoC Pattern
```dart
class UserBloc extends Bloc<UserEvent, UserState> {
  final UserRepository _repo;
  UserBloc(this._repo) : super(UserInitial()) {
    on<LoadUsers>((event, emit) async {
      emit(UserLoading());
      try {
        final users = await _repo.getAll();
        emit(UserLoaded(users));
      } catch (e) {
        emit(UserError(e.toString()));
      }
    });
  }
}
// Usage: BlocBuilder<UserBloc, UserState>(builder: (context, state) => ...)
```

### 3. State Restoration
```dart
class CounterPage extends StatefulWidget {
  @override
  State<CounterPage> createState() => _CounterPageState();
}
class _CounterPageState extends State<CounterPage> with RestorationMixin {
  final RestorableInt _counter = RestorableInt(0);
  @override String get restorationId => 'counter_page';
  @override void restoreState(RestorationBucket? oldBucket, bool initialRestore) {
    registerForRestoration(_counter, 'counter');
  }
  void _increment() => setState(() => _counter.value++);
}
```

## Anti-Patterns
- **Global mutable singletons** — use scoped providers with proper lifecycle management
- **BLoC for simple screens** — setState or ValueNotifier is fine for widget-local state
- **Mixing state approaches** — pick one primary pattern per app, don't mix Riverpod and BLoC
- **Not disposing controllers** — use `autoDispose` (Riverpod) or `close()` (BLoC) to prevent leaks

## Integration Points
- **Navigation:** State-driven routing with go_router + Riverpod
- **Persistence:** Hydrate state from SharedPreferences or Hive on startup
- **Testing:** `ProviderContainer` (Riverpod) or `BlocTest` (BLoC) for isolated state tests
