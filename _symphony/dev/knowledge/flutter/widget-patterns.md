# Flutter — Widget Patterns

**Principle:** Composition over inheritance. Small, focused widgets compose into complex UIs. Use keys for identity, builders for lazy construction, and slivers for scroll performance.

## Pattern Examples

### 1. Composition with Typed Children
```dart
class AppCard extends StatelessWidget {
  final String title;
  final Widget? subtitle;
  final Widget child;
  final VoidCallback? onTap;

  const AppCard({super.key, required this.title, this.subtitle, required this.child, this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(title, style: Theme.of(context).textTheme.titleMedium),
            if (subtitle != null) subtitle!,
            const SizedBox(height: 8),
            child,
          ]),
        ),
      ),
    );
  }
}
```

### 2. Builder Pattern for Lazy Construction
```dart
ListView.builder(
  itemCount: items.length,
  itemBuilder: (context, index) {
    final item = items[index];
    return ListTile(
      key: ValueKey(item.id),
      title: Text(item.name),
      subtitle: Text(item.description),
      onTap: () => onItemTap(item),
    );
  },
);
```

### 3. Slivers for Custom Scroll Layouts
```dart
CustomScrollView(
  slivers: [
    SliverAppBar(floating: true, title: Text('Items'), expandedHeight: 200,
      flexibleSpace: FlexibleSpaceBar(background: Image.network(url, fit: BoxFit.cover))),
    SliverPadding(
      padding: const EdgeInsets.all(16),
      sliver: SliverGrid.count(
        crossAxisCount: 2, mainAxisSpacing: 8, crossAxisSpacing: 8,
        children: items.map((item) => ItemCard(item: item)).toList(),
      ),
    ),
  ],
);
```

## Anti-Patterns
- **Deep widget nesting** — extract sub-widgets into named classes or methods
- **Inheritance for UI reuse** — use composition (pass widgets as parameters)
- **Missing keys in lists** — use `ValueKey` with stable IDs for correct rebuilds
- **Building all list items eagerly** — use `ListView.builder` for large lists
- **Ignoring `const` constructors** — mark widgets `const` to skip unnecessary rebuilds

## Integration Points
- **Theming:** `Theme.of(context)` for consistent styling, `ThemeExtension` for custom tokens
- **Responsive:** `LayoutBuilder`, `MediaQuery`, `Expanded`/`Flexible` for adaptive layouts
- **Testing:** `testWidgets`, `find.byType`, `tester.tap`, `tester.pumpAndSettle`
