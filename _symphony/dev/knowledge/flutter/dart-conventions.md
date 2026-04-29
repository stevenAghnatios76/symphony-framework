# Dart — Conventions

**Principle:** Embrace sound null safety, use extensions for expressiveness, leverage code generation for boilerplate, and enforce consistency with strict linting.

## Pattern Examples

### 1. Sound Null Safety
```dart
// Non-nullable by default
String greeting = 'Hello';
String? nullableGreeting;

// Null-aware operators
final name = nullableGreeting ?? 'World';
final length = nullableGreeting?.length ?? 0;

// Late initialization for non-nullable fields set after construction
late final String configValue;

// Required named parameters
void createUser({required String name, required String email, int? age}) {}
```

### 2. Extension Methods
```dart
extension StringValidation on String {
  bool get isValidEmail => RegExp(r'^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(this);
  String get capitalized => isEmpty ? this : '${this[0].toUpperCase()}${substring(1)}';
}

extension DateFormatting on DateTime {
  String get iso8601Date => toIso8601String().split('T').first;
  bool get isToday {
    final now = DateTime.now();
    return year == now.year && month == now.month && day == now.day;
  }
}
```

### 3. Code Generation with Freezed
```dart
// user.dart
@freezed
class User with _$User {
  const factory User({
    required String id,
    required String name,
    required String email,
    @Default(false) bool isActive,
  }) = _User;

  factory User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);
}
// Run: dart run build_runner build --delete-conflicting-outputs
```

## Anti-Patterns
- **Ignoring null safety** — don't use `!` operator without checking. Prefer null-aware operators and pattern matching.
- **Dynamic typing** — avoid `dynamic`. Use `Object?` with type checks or generics.
- **Manual JSON serialization** — use `json_serializable` or `freezed` for type-safe serialization.
- **No linting** — use `flutter_lints` or `very_good_analysis` for consistent style enforcement.
- **Mutable data classes** — use `freezed` or `@immutable` annotation for value objects.

## Integration Points
- **Build Runner:** `dart run build_runner watch` for continuous code generation
- **Linting:** `analysis_options.yaml` with `flutter_lints` or custom rules
- **Testing:** `dart test` with `--coverage`, `mocktail` for mocking
