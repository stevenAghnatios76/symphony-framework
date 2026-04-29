# BDD Gherkin — Behavior-Driven Specification

**Principle:** Write tests as human-readable scenarios using Given/When/Then to create a shared language between business stakeholders and developers, making specifications executable.

## Pattern Examples

### 1. Scenario with Step Definitions
A `.feature` file describes behavior; step definitions wire it to code:
```gherkin
Feature: Shopping Cart
  Scenario: Apply discount code
    Given a cart with items totaling $100
    When the user applies code "SAVE20"
    Then the cart total should be $80
    And the discount line should show "$20 off"
```
```typescript
// steps/cart.steps.ts
Given('a cart with items totaling ${int}', (total: number) => {
  cart = new Cart();
  cart.addItem({ name: 'Widget', price: total });
});
When('the user applies code {string}', (code: string) => {
  cart.applyDiscount(code);
});
Then('the cart total should be ${int}', (expected: number) => {
  expect(cart.total).toBe(expected);
});
```

### 2. Scenario Outlines for Data-Driven Tests
Run the same scenario with multiple inputs using an Examples table:
```gherkin
Scenario Outline: Login validation
  Given the user enters "<email>" and "<password>"
  When they submit the login form
  Then they should see "<result>"

  Examples:
    | email           | password | result          |
    | valid@test.com  | correct  | Dashboard       |
    | valid@test.com  | wrong    | Invalid password|
    | invalid         | any      | Invalid email   |
```

### 3. Background for Shared Setup
Extract repeated Given steps into a Background block:
```gherkin
Feature: Order Management
  Background:
    Given a logged-in admin user
    And at least one pending order exists

  Scenario: Approve an order
    When the admin approves the first pending order
    Then the order status should be "approved"

  Scenario: Reject an order
    When the admin rejects the first pending order
    Then the order status should be "rejected"
```

## Anti-Patterns
- **Imperative scenarios** — writing "click button X, fill field Y" instead of declarative intent. Use business language, not UI steps.
- **Too many scenarios** — BDD is for key behaviors, not exhaustive edge cases. Use unit tests for boundary values.
- **Untethered features** — `.feature` files that nobody reads or updates become stale documentation. Review them in sprint planning.
- **Step definition explosion** — overly specific steps that cannot be reused. Write parameterized, composable steps.

## Integration Points
- **Cucumber:** JS/TS runner with `@cucumber/cucumber`; Python with `behave`; Java with `cucumber-jvm`
- **CI pipeline:** Run BDD suite as acceptance gate before deployment
- **Living documentation:** Generate HTML reports from `.feature` files with cucumber-html-reporter
- **Collaboration:** Product owners review `.feature` files in PRs to validate behavior before code is written
