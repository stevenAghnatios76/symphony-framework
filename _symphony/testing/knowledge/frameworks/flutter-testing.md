# Flutter Testing — Widget, Golden, and Integration Patterns

**Principle:** Test widgets in isolation with `testWidgets`, lock visual correctness with golden files, and validate full user flows with integration tests — use `pump` to control the rendering lifecycle explicitly.

## Pattern Examples

### 1. Widget Testing with pump and Finders
Render a widget and interact with it in an isolated test environment:
```dart
testWidgets('Counter increments when button tapped', (tester) async {
  await tester.pumpWidget(const MaterialApp(home: CounterPage()));

  // Verify initial state
  expect(find.text('0'), findsOneWidget);
  expect(find.text('1'), findsNothing);

  // Tap the increment button and rebuild
  await tester.tap(find.byIcon(Icons.add));
  await tester.pump(); // Trigger a single frame rebuild

  // Verify updated state
  expect(find.text('1'), findsOneWidget);
});
```
Use `pump()` for a single frame, `pumpAndSettle()` to wait for all animations.

### 2. Golden File Tests for Visual Regression
Capture a screenshot baseline and compare on future runs:
```dart
testWidgets('ProfileCard matches golden', (tester) async {
  await tester.pumpWidget(
    MaterialApp(
      home: Scaffold(
        body: ProfileCard(
          name: 'Ada Lovelace',
          role: 'Engineer',
          avatarUrl: 'https://example.com/ada.png',
        ),
      ),
    ),
  );
  await tester.pumpAndSettle();

  await expectLater(
    find.byType(ProfileCard),
    matchesGoldenFile('goldens/profile_card.png'),
  );
});
// Update goldens: flutter test --update-goldens
```

### 3. Integration Testing with patrol
Test full app flows on a real device or emulator:
```dart
// integration_test/checkout_test.dart
import 'package:patrol/patrol.dart';

void main() {
  patrolTest('complete checkout flow', ($) async {
    await $.pumpWidgetAndSettle(const MyApp());

    // Navigate to product
    await $(#productList).scrollTo(find.text('Widget Pro'));
    await $('Widget Pro').tap();
    await $('Add to Cart').tap();

    // Complete checkout
    await $(#cartIcon).tap();
    await $('Checkout').tap();
    await $(#emailField).enterText('user@test.com');
    await $('Pay Now').tap();

    expect($('Order Confirmed'), findsOneWidget);
  });
}
// Run: patrol test -t integration_test/checkout_test.dart
```

## Anti-Patterns
- **Missing pump calls** — forgetting `pump()` after state changes means the widget tree is stale. Always pump after interactions.
- **Golden test fragility** — goldens break on font rendering differences across platforms. Pin the test platform and font configuration.
- **Testing framework widgets** — testing `MaterialApp` or `Scaffold` behavior is Flutter's job. Test your custom widget logic only.
- **No widget keys** — relying on `find.text()` for everything is fragile. Use `Key` values for stable lookups in tests.

## Integration Points
- **flutter test:** Runs unit and widget tests headlessly; `--coverage` generates lcov output
- **patrol:** Modern integration test runner replacing `integration_test` package; supports native interactions
- **CI:** Use `flutter test --machine` for JSON output; cache `.dart_tool` for faster builds
- **Golden management:** Store goldens in version control; review diffs in PRs with image diff tools
