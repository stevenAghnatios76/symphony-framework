# Load Testing — Stress and Capacity Verification

**Principle:** Validate system behavior under realistic and peak traffic before users do it for you — measure latency percentiles, not just averages.

## Pattern Examples

### 1. Ramp-Up Scenario with k6
Gradually increase virtual users to find the breaking point:
```javascript
// load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 50 },   // ramp up
    { duration: '5m', target: 50 },   // steady state
    { duration: '2m', target: 200 },  // spike
    { duration: '3m', target: 0 },    // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1500'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const res = http.get('https://api.example.com/products');
  check(res, { 'status 200': (r) => r.status === 200 });
  sleep(1);
}
```

### 2. Threshold Assertions in CI
Fail the pipeline if performance budgets are exceeded:
```yaml
# .github/workflows/load-test.yml
- name: Run load test
  run: k6 run --out json=results.json load-test.js
- name: Check thresholds
  run: |
    if grep -q '"thresholds":.*"failed":true' results.json; then
      echo "Performance thresholds breached"
      exit 1
    fi
```

### 3. Correlating with APM Data
Tag load test runs so APM tools can overlay test traffic with system metrics:
```javascript
export default function () {
  const params = {
    headers: { 'X-Load-Test-Run': __ENV.TEST_RUN_ID },
  };
  http.get('https://api.example.com/checkout', params);
}
// In Datadog/Grafana: filter by X-Load-Test-Run to see CPU, memory, DB during the test
```

## Anti-Patterns
- **Averaging latency** — p50 hides tail latency. Always report p95 and p99 percentiles.
- **Testing from one region** — single-origin tests miss CDN behavior and regional routing. Distribute load generators.
- **No baseline comparison** — a single run is meaningless. Compare against previous releases to detect regressions.
- **Testing in production without safeguards** — use feature flags and rate limits to avoid impacting real users.
- **Ignoring ramp-down** — abrupt test stops can mask connection leak or cleanup bugs. Always ramp down gracefully.

## Integration Points
- **k6:** JavaScript-based load testing with built-in threshold assertions
- **Artillery:** YAML-driven load tests with plugin ecosystem
- **Locust:** Python-based distributed load testing for complex user flows
- **Grafana/Datadog:** Visualize test results alongside infrastructure metrics
