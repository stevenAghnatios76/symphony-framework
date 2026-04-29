# Cypress — E2E Browser Testing Patterns

**Principle:** Write E2E tests that run in the browser alongside your app, use custom commands for reusable actions, intercept network requests for deterministic tests, and leverage component testing for isolated UI verification.

## Pattern Examples

### 1. Custom Commands for Reusable Actions
Define domain-specific commands to keep tests readable:
```typescript
// cypress/support/commands.ts
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.session([email, password], () => {
    cy.visit('/login');
    cy.get('[data-testid="email"]').type(email);
    cy.get('[data-testid="password"]').type(password);
    cy.get('[data-testid="submit"]').click();
    cy.url().should('include', '/dashboard');
  });
});

// cypress/e2e/dashboard.cy.ts
describe('Dashboard', () => {
  beforeEach(() => {
    cy.login('admin@test.com', 'secret');
  });
  it('displays welcome message', () => {
    cy.visit('/dashboard');
    cy.get('h1').should('contain', 'Welcome, Admin');
  });
});
```

### 2. Network Stubbing with cy.intercept
Control API responses for deterministic, fast tests:
```typescript
it('displays products from API', () => {
  cy.intercept('GET', '/api/products', {
    statusCode: 200,
    body: [
      { id: 1, name: 'Widget', price: 29.99 },
      { id: 2, name: 'Gadget', price: 49.99 },
    ],
  }).as('getProducts');

  cy.visit('/products');
  cy.wait('@getProducts');

  cy.get('[data-testid="product-card"]').should('have.length', 2);
  cy.contains('Widget').should('be.visible');
});

it('shows error state on API failure', () => {
  cy.intercept('GET', '/api/products', { statusCode: 500 }).as('getProducts');
  cy.visit('/products');
  cy.wait('@getProducts');
  cy.get('[data-testid="error-message"]').should('contain', 'Failed to load');
});
```

### 3. Component Testing for Isolated UI
Test individual components without the full app:
```typescript
// cypress/component/Button.cy.tsx
import { Button } from '../../src/components/Button';

describe('Button', () => {
  it('renders with label and handles click', () => {
    const onClick = cy.stub().as('clickHandler');
    cy.mount(<Button label="Save" onClick={onClick} />);

    cy.get('button').should('have.text', 'Save');
    cy.get('button').click();
    cy.get('@clickHandler').should('have.been.calledOnce');
  });

  it('shows loading spinner when pending', () => {
    cy.mount(<Button label="Save" loading={true} />);
    cy.get('[data-testid="spinner"]').should('be.visible');
    cy.get('button').should('be.disabled');
  });
});
```

## Anti-Patterns
- **cy.wait with fixed time** — `cy.wait(5000)` is slow and flaky. Use `cy.wait('@alias')` for network or assertion-based waiting.
- **Chaining without assertions** — Cypress retries assertions, not commands. Place `.should()` at the end to leverage auto-retry.
- **Testing third-party UI** — do not test that a date picker library works. Test that your code uses it correctly.
- **No session caching** — logging in via UI before every test is slow. Use `cy.session()` to cache authentication state.

## Integration Points
- **CI:** `cypress run --record --key <key>` for Cypress Cloud dashboard with parallelization
- **GitHub Actions:** `cypress-io/github-action` handles install, caching, and browser setup
- **Component testing:** `cypress open --component` for interactive development; `cypress run --component` in CI
- **Reporters:** `mochawesome` for HTML reports; `cypress-multi-reporters` for combined JUnit + HTML output
