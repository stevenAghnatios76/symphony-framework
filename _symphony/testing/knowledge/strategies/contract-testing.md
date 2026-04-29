# Contract Testing — API Agreement Verification

**Principle:** Verify that API consumers and providers agree on request/response shapes independently, catching breaking changes before deployment without running full integration environments.

## Pattern Examples

### 1. Consumer-Driven Contract with Pact
The consumer defines expected interactions; the provider verifies them:
```typescript
// consumer.spec.ts — defines what the consumer expects
const provider = new PactV4({ consumer: 'OrderUI', provider: 'OrderAPI' });

provider.addInteraction({
  states: [{ description: 'an order with id 42 exists' }],
  uponReceiving: 'a request for order 42',
  withRequest: { method: 'GET', path: '/orders/42' },
  willRespondWith: {
    status: 200,
    body: { id: 42, status: like('shipped'), items: eachLike({ sku: 'ABC' }) },
  },
});

// This generates a pact JSON contract file
```

### 2. Provider Verification
The provider replays consumer contracts against its real API:
```typescript
// provider.spec.ts — verifies the provider honors the contract
const verifier = new Verifier({
  providerBaseUrl: 'http://localhost:3000',
  pactUrls: ['./pacts/orderui-orderapi.json'],
  stateHandlers: {
    'an order with id 42 exists': async () => {
      await seedDatabase({ id: 42, status: 'shipped', items: [{ sku: 'ABC' }] });
    },
  },
});
await verifier.verifyProvider();
```

### 3. Schema Contract with OpenAPI Validation
Validate responses against an OpenAPI spec without Pact:
```typescript
import { OpenAPIValidator } from 'express-openapi-validator';

test('GET /users matches OpenAPI schema', async () => {
  const res = await request(app).get('/users');
  const errors = validator.validateResponse('get', '/users', res.status, res.body);
  expect(errors).toHaveLength(0);
});
```
Use this as a lightweight alternative when Pact is too heavy.

## Anti-Patterns
- **Provider-only schemas** — defining contracts only on the provider side misses what consumers actually need. Let consumers drive.
- **Testing business logic in contracts** — contracts verify shape and types, not whether the order total is correct. Keep them structural.
- **Stale contracts** — contracts checked into a repo and never updated rot. Use a Pact Broker for versioned, automated sharing.
- **Skipping state setup** — provider tests that skip `stateHandlers` produce false failures or false passes.

## Integration Points
- **Pact Broker:** Central registry for contracts with webhook-triggered provider verification
- **CI pipeline:** Consumer publishes contract on PR merge; provider verifies before its own deploy
- **can-i-deploy:** Pact CLI tool that checks whether a version is safe to deploy based on verification results
- **OpenAPI:** Use as contract source for REST APIs; tools like Prism mock servers from specs
