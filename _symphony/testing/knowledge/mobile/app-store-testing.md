# App Store Testing — iOS App Store and Google Play Compliance

**Principle:** Test against store review guidelines before submission; automated compliance checks prevent costly rejection cycles.

## Pattern Examples

### 1. Review Guideline Checklist Automation
Encode platform review rules as automated assertions run before each submission:
```python
# iOS App Store — pre-submission compliance checks
def test_ios_compliance(app_bundle):
    info = app_bundle.info_plist

    # Required privacy descriptions
    for key in ["NSCameraUsageDescription", "NSLocationWhenInUseUsageDescription"]:
        if app_bundle.uses_permission(key):
            assert info.get(key), f"Missing privacy string for {key}"

    # No private API usage
    symbols = app_bundle.linked_symbols()
    private_apis = [s for s in symbols if s.startswith("_")]
    assert len(private_apis) == 0, f"Private APIs detected: {private_apis[:5]}"

    # Minimum deployment target
    assert info["MinimumOSVersion"] >= "15.0", "Must support iOS 15+"
```

### 2. Metadata Validation
Verify store listing metadata meets character limits and content policies:
```yaml
# metadata-validation.yml — automated store metadata checks
ios:
  app_name: { max_chars: 30, required: true }
  subtitle: { max_chars: 30, required: true }
  description: { max_chars: 4000, required: true, min_chars: 300 }
  keywords: { max_chars: 100, separator: "," }
  screenshots:
    iphone_6_5: { min: 3, max: 10, resolution: "1284x2778" }
    ipad_12_9: { min: 3, max: 10, resolution: "2048x2732" }

android:
  title: { max_chars: 30, required: true }
  short_description: { max_chars: 80, required: true }
  full_description: { max_chars: 4000, required: true }
  feature_graphic: { resolution: "1024x500", required: true }
```

### 3. Beta Distribution and Staged Rollout
Validate builds in beta channels before full submission:
```bash
# iOS — upload to TestFlight
xcrun altool --upload-app -f MyApp.ipa \
  -t ios --apiKey $API_KEY --apiIssuer $ISSUER_ID

# Android — promote from internal to open testing
gcloud firebase appdistribution releases distribute \
  --app $FIREBASE_APP_ID \
  --release-notes "RC 2.1.0 — bug fixes" \
  --groups "qa-team,beta-testers"

# Staged rollout — 10% then monitor crash rate before expanding
gcloud app versions update v2-1-0 --traffic-split=0.1
```

## Anti-Patterns
- **Submitting without pre-checks** — store rejections take days. Automate compliance checks locally.
- **Ignoring metadata limits** — truncated titles and descriptions reduce discoverability and trigger rejections.
- **Skipping beta channels** — TestFlight and internal tracks catch crashes before real users see them.
- **Manual screenshot capture** — screenshots drift from actual UI. Automate with Fastlane snapshot or Maestro.
- **No staged rollout** — full releases without gradual rollout risk widespread crashes.

## Integration Points
- **CI Pipeline:** Compliance checks run as a gate before any store upload step
- **Creative Module:** Screenshot automation shares localized assets with the creative workflow
- **Gate Enforcer:** Blocks store submission until beta crash rate is below threshold
- **Reporting Protocol:** Tracks submission history, rejection reasons, and time-to-approval metrics
