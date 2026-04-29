# Push Notification Testing — Cross-Platform Delivery Validation

**Principle:** Test notifications in every app state and delivery path; a notification that works in the foreground but fails when the app is killed is a missed alert.

## Pattern Examples

### 1. FCM and APNs Test Tooling
Send test notifications programmatically and verify delivery end-to-end:
```python
# FCM — send test notification via Admin SDK
import firebase_admin
from firebase_admin import messaging

firebase_admin.initialize_app()

message = messaging.Message(
    notification=messaging.Notification(
        title="Order Shipped",
        body="Your order #1234 is on its way.",
    ),
    data={"order_id": "1234", "deeplink": "/orders/1234"},
    token=device_fcm_token,
)
response = messaging.send(message)
assert response is not None, "FCM send failed"

# APNs — send via apns2 library
from apns2.client import APNsClient
from apns2.payload import Payload

payload = Payload(alert="Order Shipped", badge=1, sound="default",
                  custom={"deeplink": "/orders/1234"})
client = APNsClient(team_key, bundle_id="com.example.app", use_sandbox=True)
client.send_notification(device_apns_token, payload, topic="com.example.app")
```

### 2. Foreground, Background, and Killed State Handling
Test all three app states since notification handling differs in each:
```javascript
// Appium — validate notification in each app state

// Foreground: app shows in-app banner
await driver.execute('mobile:sendNotification', { title: 'Test', body: 'Foreground' });
expect(await inAppBanner.isDisplayed()).toBe(true);

// Background: notification appears in system tray
await driver.terminateApp('com.example.app');
await driver.execute('mobile:sendNotification', { title: 'Test', body: 'Background' });
await driver.openNotifications();
const notification = await driver.$('~Test');
expect(await notification.isDisplayed()).toBe(true);
await notification.click();
expect(await homePage.isLoaded()).toBe(true);  // app resumes

// Killed: cold start from notification tap
await driver.removeApp('com.example.app');
await driver.installApp('/path/to/app');
// Send notification, tap from tray, verify deep link lands correctly
```

### 3. Deep Link Validation from Notifications
Verify that tapping a notification routes the user to the correct screen:
```kotlin
// Android instrumented test — verify deep link routing
@Test
fun notification_deepLink_opensOrderDetail() {
    val intent = Intent(Intent.ACTION_VIEW,
        Uri.parse("myapp://orders/1234"))
    val scenario = ActivityScenario.launch<MainActivity>(intent)

    onView(withId(R.id.order_id_text))
        .check(matches(withText("Order #1234")))

    onView(withId(R.id.order_status))
        .check(matches(isDisplayed()))
}
```

## Anti-Patterns
- **Testing foreground only** — most users receive notifications while the app is backgrounded or killed. Test all states.
- **No payload validation** — verify the data payload, not just the notification title. Deep links and custom data matter.
- **Ignoring platform differences** — FCM and APNs handle silent notifications, badges, and sounds differently.
- **Manual notification testing** — automate send-and-verify cycles in CI to catch regressions.
- **Skipping permission denial flow** — test the UX when a user has declined notification permissions.

## Integration Points
- **CI Pipeline:** Automated notification tests run against staging push service on every release build
- **Test Architect Agent:** Generates notification test cases from deep link routing configuration
- **Device Farm:** Validates notification delivery across OS versions (Android 12+ changed notification behavior)
- **Reporting Protocol:** Tracks delivery success rate, tap-through rate, and deep link resolution accuracy
