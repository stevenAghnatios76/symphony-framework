# Lighthouse CI — Web Performance Auditing

**Principle:** Set performance budgets as code, enforce them in CI, and track Core Web Vitals trends over time — regressions caught at PR time cost 10x less to fix.

## Pattern Examples

### 1. Performance Budgets in CI Configuration
Define pass/fail thresholds for Lighthouse categories:
```javascript
// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000/', 'http://localhost:3000/products'],
      numberOfRuns: 3,
      startServerCommand: 'npm run start',
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 1500 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
```

### 2. CI Pipeline Integration
Run Lighthouse CI on every pull request and block merge on failures:
```yaml
# .github/workflows/lighthouse.yml
lighthouse:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - run: npm ci && npm run build
    - name: Lighthouse CI
      uses: treosh/lighthouse-ci-action@v11
      with:
        configPath: './lighthouserc.js'
        uploadArtifacts: true
        temporaryPublicStorage: true
```

### 3. Core Web Vitals Threshold Enforcement
Assert specific CWV metrics to align with Google ranking signals:
```javascript
// In lighthouserc.js assertions
assertions: {
  'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],   // LCP
  'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],     // CLS
  'total-blocking-time': ['error', { maxNumericValue: 200 }],         // TBT (proxy for INP)
  'interactive': ['warn', { maxNumericValue: 3500 }],                 // TTI
}
```

## Anti-Patterns
- **Single-run audits** — Lighthouse scores vary between runs. Always run 3-5 times and use median.
- **Ignoring accessibility scores** — performance budgets without a11y budgets ship fast but exclusionary products.
- **Testing only the homepage** — critical user journeys (checkout, search results) often have worse performance. Audit all key routes.
- **No historical tracking** — a single green check means nothing without trend data. Use Lighthouse CI Server or similar for history.
- **Testing on fast hardware only** — throttle CPU and network to simulate real user conditions.

## Integration Points
- **Lighthouse CI:** CLI and GitHub Action for automated auditing with assertion support
- **PageSpeed Insights API:** On-demand field and lab data for production URLs
- **Web Vitals library:** Real User Monitoring (RUM) for field data alongside lab data
- **Bundler plugins:** `webpack-bundle-analyzer`, `source-map-explorer` to diagnose large bundles
