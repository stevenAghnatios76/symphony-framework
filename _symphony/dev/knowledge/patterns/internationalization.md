# Internationalization (i18n)

**Principle:** Extract all user-facing strings into locale resource bundles from the start, use ICU message format for pluralization and gender, and validate locale completeness in CI.

## Pattern Examples

### ICU Message Format
Handle plurals and gender without string concatenation:
```
{count, plural,
  =0 {No items}
  one {# item}
  other {# items}
}
```
Works across libraries: react-intl, flutter_localizations, go-i18n.

### React with react-intl
```tsx
import { FormattedMessage } from 'react-intl';
<FormattedMessage id="cart.items" defaultMessage="{count, plural, one {# item} other {# items}}" values={{ count }} />
```

### Flutter Localization
```dart
// l10n/app_en.arb
{ "cartItems": "{count, plural, =0{No items} one{1 item} other{{count} items}}" }
// Usage: AppLocalizations.of(context)!.cartItems(count)
```

### RTL Layout Support
Use logical properties instead of physical directions:
```css
/* Instead of margin-left, use: */
margin-inline-start: 16px;
/* Instead of text-align: left, use: */
text-align: start;
```

## Anti-Patterns

- Concatenating translated strings — word order differs across languages; use parameterized messages
- Hardcoding locale to en-US — detect from user preferences, fall back gracefully
- Translating after development — extraction is 10x harder retroactively
- Assuming LTR layout — Arabic, Hebrew, and Urdu are RTL; test mirrored layouts
- Using string length for UI sizing — German text averages 30% longer than English

## Integration Points

- **react-intl** — React i18n with ICU message format
- **flutter_localizations** — Flutter's built-in ARB-based localization
- **go-i18n** — Go struct-based message catalogs
- **FormatJS CLI** — Extract and compile ICU messages for JavaScript
- **CI locale validation** — Fail build if any locale file has missing keys
