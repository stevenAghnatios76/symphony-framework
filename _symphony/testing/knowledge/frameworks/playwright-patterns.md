# Playwright — E2E Browser Testing Patterns

**Principle:** Use auto-waiting and web-first assertions to write resilient tests, page object models to encapsulate UI structure, and parallel execution with trace viewer to debug failures efficiently.

## Pattern Examples

### 1. Page Object Model for Maintainable Tests
Encapsulate page structure in reusable classes:
```typescript
// pages/login.page.ts
export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/login');
  }
  async login(email: string, password: string) {
    await this.page.fill('[data-testid="email"]', email);
    await this.page.fill('[data-testid="password"]', password);
    await this.page.click('[data-testid="submit"]');
  }
  get errorMessage() {
    return this.page.locator('[data-testid="error"]');
  }
}

// tests/login.spec.ts
test('shows error for invalid credentials', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('user@test.com', 'wrong');
  await expect(loginPage.errorMessage).toHaveText('Invalid credentials');
});
```

### 2. Auto-Waiting and Web-First Assertions
Playwright waits for elements automatically — no explicit sleeps or waits:
```typescript
test('dashboard loads after login', async ({ page }) => {
  await page.goto('/login');
  await page.fill('#email', 'admin@test.com');
  await page.fill('#password', 'secret');
  await page.click('button[type="submit"]');

  // Auto-waits for navigation, element visibility, and text content
  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('h1')).toHaveText('Welcome, Admin');
  await expect(page.locator('.stats-card')).toHaveCount(4);
});
```

### 3. Parallel Execution and Trace Debugging
Run tests in parallel across browsers and capture traces for failures:
```typescript
// playwright.config.ts
export default defineConfig({
  workers: process.env.CI ? 4 : undefined,
  retries: process.env.CI ? 2 : 0,
  use: {
    trace: 'on-first-retry',  // capture trace only on failure retry
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'mobile', use: { ...devices['iPhone 14'] } },
  ],
});
// Debug: npx playwright show-trace trace.zip
```

## Anti-Patterns
- **Explicit sleeps** — `page.waitForTimeout(3000)` is flaky and slow. Use auto-waiting locators and web-first assertions.
- **CSS selectors for dynamic content** — prefer `data-testid` attributes or `getByRole`/`getByText` for resilient selectors.
- **Shared state between tests** — tests that depend on another test's side effects break in parallel. Each test sets up its own state.
- **No trace on failure** — debugging E2E without traces means re-running locally. Always capture traces in CI.

## Integration Points
- **CI:** `npx playwright test --reporter=html` for visual reports; upload trace artifacts on failure
- **GitHub Actions:** `playwright-github-action` installs browsers with caching
- **Visual regression:** `toHaveScreenshot()` for pixel-level comparison with configurable thresholds
- **API mocking:** `page.route()` intercepts network requests for isolated frontend testing
