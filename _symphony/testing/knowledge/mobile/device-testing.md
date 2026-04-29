# Device Testing — Real Devices, Simulators, and Cloud Farms

**Principle:** Test on real devices for production confidence, simulators for speed, and cloud farms for coverage across the device matrix.

## Pattern Examples

### 1. Device Matrix Selection
Define a coverage matrix based on market analytics and risk tiers:
```yaml
# device-matrix.yml — tiered device strategy
tier_1_must_pass:  # top 70% of user sessions
  - { os: iOS, version: "17", device: "iPhone 15" }
  - { os: iOS, version: "16", device: "iPhone 13" }
  - { os: Android, version: "14", device: "Pixel 8" }
  - { os: Android, version: "13", device: "Samsung Galaxy S23" }

tier_2_should_pass:  # next 20%
  - { os: iOS, version: "15", device: "iPhone 11" }
  - { os: Android, version: "12", device: "Samsung Galaxy A54" }

tier_3_best_effort:  # remaining 10%, low-end devices
  - { os: Android, version: "11", device: "Redmi Note 10" }
```

### 2. Parallel Execution on Cloud Device Farm
Distribute tests across real devices using BrowserStack or AWS Device Farm:
```yaml
# BrowserStack App Automate — parallel config
capabilities:
  - name: "Login Flow - iOS"
    platformName: iOS
    platformVersion: "17"
    deviceName: "iPhone 15"
    app: "bs://app-upload-hash"
    autoAcceptAlerts: true

  - name: "Login Flow - Android"
    platformName: Android
    platformVersion: "14"
    deviceName: "Google Pixel 8"
    app: "bs://app-upload-hash"

parallel: 4   # run 4 devices simultaneously
```

### 3. Network Condition Simulation
Test under degraded network to catch timeout and retry issues:
```javascript
// Appium — simulate network throttling
await driver.setNetworkConditions({
  offline: false,
  latency: 300,        // 300ms latency
  downloadThroughput: 500 * 1024,  // 500 KB/s (3G)
  uploadThroughput: 200 * 1024,
});
await loginPage.submit();
expect(await loginPage.getSpinner()).toBeVisible();
expect(await homePage.isLoaded({ timeout: 15000 })).toBe(true);
```

## Anti-Patterns
- **Simulator only** — simulators miss hardware-specific bugs (camera, GPS, Bluetooth, battery). Use real devices for final validation.
- **Testing on latest OS only** — most crashes happen on older OS versions and low-end hardware. Cover at least N-2 versions.
- **Sequential device runs** — serial execution wastes time. Parallelize across a cloud farm.
- **Ignoring network variability** — apps crash on slow/flaky connections. Always test 3G and offline scenarios.
- **Static device list** — review and update the device matrix quarterly based on analytics data.

## Integration Points
- **CI Pipeline:** Cloud farm tests triggered on release branches; simulator tests on every PR
- **Test Architect Agent:** Auto-generates device matrix from analytics data and market share reports
- **Wave Executor:** Parallelizes device farm runs across the matrix in a single CI wave
- **Reporting Protocol:** Aggregates pass/fail by device tier for release sign-off dashboards
