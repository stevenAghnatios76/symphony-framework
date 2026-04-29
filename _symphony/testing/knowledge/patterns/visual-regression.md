# Visual Regression — Screenshot Diff Testing

**Principle:** Catch unintended visual changes by comparing screenshots against approved baselines, but keep thresholds tight and scope small to avoid noise.

## Pattern Examples

### 1. Component-Level Screenshots
Capture individual components in isolation via Storybook to minimize blast radius:
```javascript
// Button.stories.js
export const AllVariants = () => (
  <div>
    <Button variant="primary">Primary</Button>
    <Button variant="secondary">Secondary</Button>
    <Button variant="danger" disabled>Disabled</Button>
  </div>
);

// chromatic or percy config
// Each story becomes a snapshot automatically
```

### 2. Responsive Breakpoint Captures
Test key breakpoints to catch layout shifts across viewport sizes:
```javascript
// backstop.config.js
module.exports = {
  scenarios: [{
    label: 'Homepage',
    url: 'http://localhost:3000',
    selectors: ['document'],
  }],
  viewports: [
    { label: 'mobile',  width: 375,  height: 812 },
    { label: 'tablet',  width: 768,  height: 1024 },
    { label: 'desktop', width: 1440, height: 900 },
  ],
  engine: 'playwright',
  misMatchThreshold: 0.1,
};
```

### 3. Diff Threshold Tuning with Playwright
Use pixel-level comparison with explicit tolerance for anti-aliasing differences:
```typescript
import { test, expect } from '@playwright/test';

test('dashboard renders correctly', async ({ page }) => {
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveScreenshot('dashboard.png', {
    maxDiffPixelRatio: 0.01,
    animations: 'disabled',
  });
});
```

## Anti-Patterns
- **Full-page screenshots for everything** — tiny unrelated changes cause failures. Scope to specific components or regions.
- **Zero threshold** — sub-pixel rendering varies across OS and GPU. Allow a small pixel tolerance (0.05-0.1%).
- **Approving without inspection** — blindly updating baselines hides real regressions. Review every diff.
- **Testing dynamic content** — animated elements, timestamps, and ads cause flakes. Freeze animations and mock volatile data.
- **Too many viewport sizes** — diminishing returns past 3-4 breakpoints. Focus on actual analytics-driven sizes.

## Integration Points
- **Chromatic:** Automated visual testing for Storybook components with PR review UI
- **Percy (BrowserStack):** Cross-browser visual snapshots with approval workflow
- **Playwright:** Built-in `toHaveScreenshot()` for E2E visual assertions
- **CI:** Run visual tests on PR branches; block merge on unapproved diffs
