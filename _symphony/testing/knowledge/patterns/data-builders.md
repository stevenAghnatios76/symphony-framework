# Data Builders — Fluent Object Construction for Tests

**Principle:** Build complex test objects with sensible defaults and explicit overrides so tests document exactly which fields matter for the scenario.

## Pattern Examples

### 1. Fluent Builder with Defaults
A builder class with chained methods produces valid objects while letting tests override only relevant fields:
```typescript
class OrderBuilder {
  private order: Order = {
    id: randomUUID(),
    customer: 'default-customer',
    items: [{ sku: 'ITEM-1', qty: 1, price: 10_00 }],
    status: 'pending',
    createdAt: new Date('2025-01-01'),
  };

  withCustomer(name: string) { this.order.customer = name; return this; }
  withStatus(s: OrderStatus) { this.order.status = s; return this; }
  withItems(items: LineItem[]) { this.order.items = items; return this; }
  build(): Order { return { ...this.order }; }
}

const order = new OrderBuilder().withStatus('shipped').build();
```

### 2. Default Override via Spread
For simpler objects, a plain function with partial overrides is enough:
```python
def make_invoice(**overrides):
    defaults = {
        "id": str(uuid4()),
        "amount_cents": 5000,
        "currency": "USD",
        "status": "draft",
        "due_date": date.today() + timedelta(days=30),
    }
    return Invoice(**(defaults | overrides))

invoice = make_invoice(status="paid", amount_cents=12000)
```

### 3. Nested Builders for Complex Graphs
Compose builders when objects contain deep relationships:
```typescript
const team = new TeamBuilder()
  .withMember(new UserBuilder().withRole('lead').build())
  .withMember(new UserBuilder().withRole('dev').build())
  .withProject(new ProjectBuilder().withStatus('active').build())
  .build();
```

## Anti-Patterns
- **God builder** — a single builder for every entity. Keep one builder per aggregate root.
- **Randomizing everything** — random data hides what matters. Default to deterministic values; randomize only IDs.
- **No validation in build()** — let the builder call the domain constructor so invalid combinations fail fast.
- **Exposing internals** — builders should produce domain objects, not raw database rows.

## Integration Points
- **Fixture Management:** Builders are the creation strategy; fixtures handle lifecycle and cleanup
- **Property-Based Testing:** Builders can serve as generators when combined with random overrides
- **TypeScript:** Generic builders (`Builder<T>`) enforce compile-time field coverage
- **Test Architect agent:** Recommends builder vs factory based on object complexity
