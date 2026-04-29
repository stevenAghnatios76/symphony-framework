# Figma Integration

<!-- SECTION: design-token-extraction -->
## Design Token Extraction (W3C DTCG)

**Format:** W3C Design Token Community Group standard (JSON):
```json
{
  "color": {
    "primary": { "$value": "#d97757", "$type": "color" },
    "surface": { "$value": "#1a1a1e", "$type": "color" }
  },
  "spacing": {
    "sm": { "$value": "8px", "$type": "dimension" },
    "md": { "$value": "16px", "$type": "dimension" }
  }
}
```

**Extraction workflow:**
1. Export tokens from Figma via plugin (Tokens Studio, Figma Variables API)
2. Transform to W3C DTCG format
3. Generate platform-specific output (CSS custom properties, Tailwind config, Swift/Kotlin constants)
4. Commit generated files — they're source of truth for code

**Token categories:** Color, typography (fontFamily, fontSize, lineHeight, fontWeight), spacing, borderRadius, shadow, opacity, motion (duration, easing).

<!-- SECTION: component-specs -->
## Component Specs

**From Figma frame to code:**
1. Identify component variants (default, hover, active, disabled, error)
2. Extract dimensions (width, height, padding, gap)
3. Map typography tokens (font, size, weight, line-height, letter-spacing)
4. Note responsive breakpoints if annotated
5. Check accessibility annotations (contrast ratios, focus indicators, touch targets)

**Handoff checklist:**
- [ ] All states documented (rest, hover, focus, active, disabled, error, loading)
- [ ] Spacing uses token values, not arbitrary pixels
- [ ] Typography maps to design system scale
- [ ] Colors reference token names, not hex values
- [ ] Interaction patterns described (click, hover, keyboard, screen reader)

<!-- SECTION: asset-export -->
## Asset Export

**Icons:** Export as SVG. Optimize with SVGO. Use sprite sheets or icon components.

**Images:** Export at 1x, 2x, 3x for responsive. Use WebP/AVIF with fallbacks. Lazy-load below-fold images.

**Illustrations:** Export as SVG for scalability. Use CSS for color theming. Keep file size under 50KB per illustration.
