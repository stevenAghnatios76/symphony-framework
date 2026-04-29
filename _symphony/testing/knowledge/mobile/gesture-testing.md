# Gesture Testing — Touch and Interaction Validation

**Principle:** Test gestures as first-class interactions; every swipe, pinch, and long-press is a user contract that must work across devices and accessibility modes.

## Pattern Examples

### 1. Swipe, Pinch, and Long-Press Simulation
Use platform-specific APIs to programmatically trigger gesture sequences:
```javascript
// Appium W3C Actions — swipe, pinch, long-press
const { driver } = require('appium');

// Swipe left to delete
await driver.performActions([{
  type: 'pointer', id: 'finger1',
  parameters: { pointerType: 'touch' },
  actions: [
    { type: 'pointerMove', x: 300, y: 400, duration: 0 },
    { type: 'pointerDown', button: 0 },
    { type: 'pointerMove', x: 50, y: 400, duration: 300 },
    { type: 'pointerUp', button: 0 },
  ],
}]);
expect(await deleteButton.isDisplayed()).toBe(true);

// Long-press to open context menu
await driver.performActions([{
  type: 'pointer', id: 'finger1',
  parameters: { pointerType: 'touch' },
  actions: [
    { type: 'pointerMove', x: 200, y: 300, duration: 0 },
    { type: 'pointerDown', button: 0 },
    { type: 'pause', duration: 1500 },
    { type: 'pointerUp', button: 0 },
  ],
}]);
expect(await contextMenu.isDisplayed()).toBe(true);
```

### 2. Gesture Recorder for Complex Sequences
Record real gestures and replay them for consistent regression testing:
```python
# Record a gesture path, then replay in tests
recorded_gesture = {
    "name": "draw_checkmark",
    "points": [
        {"x": 100, "y": 300, "t": 0},
        {"x": 150, "y": 400, "t": 100},
        {"x": 300, "y": 150, "t": 250},
    ],
}

def replay_gesture(driver, gesture):
    actions = ActionChains(driver)
    for i, point in enumerate(gesture["points"]):
        if i == 0:
            actions.pointer_move(point["x"], point["y"])
            actions.pointer_down()
        else:
            actions.pointer_move(point["x"], point["y"],
                                 duration=point["t"] - gesture["points"][i-1]["t"])
    actions.pointer_up()
    actions.perform()
```

### 3. Accessibility Gesture Testing
Verify that assistive technology gestures trigger the same actions:
```swift
// XCTest — VoiceOver gesture simulation (iOS)
let app = XCUIApplication()
app.launchArguments += ["-UIAccessibilityEnabled", "YES"]

// Double-tap to activate (VoiceOver equivalent of single tap)
let button = app.buttons["Submit"]
button.doubleTap()
XCTAssertTrue(app.staticTexts["Success"].waitForExistence(timeout: 5))

// Three-finger swipe for custom rotor actions
app.swipeLeft(velocity: .fast)  // navigate to next element
XCTAssertTrue(app.buttons["Next"].isSelected)
```

## Anti-Patterns
- **Hard-coded coordinates** — screen sizes vary. Use element-relative coordinates or accessibility identifiers.
- **No gesture timeout testing** — users pause mid-gesture. Test interrupted and slow gestures.
- **Skipping multi-touch** — pinch-to-zoom and two-finger rotate require multi-pointer action chains.
- **Ignoring accessibility gestures** — VoiceOver and TalkBack users rely on different gesture mappings.
- **Platform-specific tests only** — abstract gesture helpers to share logic between iOS and Android suites.

## Integration Points
- **Test Architect Agent:** Generates gesture test stubs from UI component specifications
- **Device Farm:** Replays recorded gestures across the device matrix for hardware-specific validation
- **Accessibility Protocol:** Gesture tests cross-referenced with WCAG 2.1 pointer gesture requirements
- **CI Pipeline:** Gesture regression suite runs on every PR targeting UI-layer changes
