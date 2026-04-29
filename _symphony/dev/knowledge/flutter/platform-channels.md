# Flutter — Platform Channels

**Principle:** Platform channels bridge Dart to native code. Use method channels for request/response, event channels for streams, and Pigeon for type-safe generated bindings.

## Pattern Examples

### 1. Method Channel (Manual)
```dart
// Dart side
class BatteryService {
  static const _channel = MethodChannel('com.app/battery');

  Future<int> getBatteryLevel() async {
    final level = await _channel.invokeMethod<int>('getBatteryLevel');
    return level ?? -1;
  }
}

// Kotlin side (Android)
class BatteryPlugin : MethodCallHandler {
  override fun onMethodCall(call: MethodCall, result: Result) {
    if (call.method == "getBatteryLevel") {
      val level = getBatteryLevel()
      result.success(level)
    } else {
      result.notImplemented()
    }
  }
}
```

### 2. Event Channel for Streams
```dart
// Dart side
class SensorService {
  static const _channel = EventChannel('com.app/sensors');
  Stream<double> get accelerometer => _channel.receiveBroadcastStream()
      .map((event) => (event as Map)['x'] as double);
}

// Usage
SensorService().accelerometer.listen((x) => print('X acceleration: $x'));
```

### 3. Pigeon Type-Safe Bindings
```dart
// pigeons/battery.dart
@HostApi()
abstract class BatteryApi {
  int getBatteryLevel();
  bool isCharging();
}

@FlutterApi()
abstract class BatteryEventApi {
  void onBatteryLow(int level);
}
// Run: dart run pigeon --input pigeons/battery.dart
// Generates: Dart bindings + Kotlin/Swift implementations
```

## Anti-Patterns
- **String-based method names without constants** — define channel and method names as constants
- **No error handling on native side** — always wrap native code in try/catch, return `result.error()`
- **Heavy computation on platform channel** — channels run on main thread by default, use background isolates
- **Manual serialization** — use Pigeon for type-safe code generation instead of manual Map encoding

## Integration Points
- **Federated plugins:** Split into `platform_interface`, `android`, `ios`, and `app-facing` packages
- **Testing:** Mock `MethodChannel` with `TestDefaultBinaryMessengerBinding` for unit tests
- **FFI:** For performance-critical native code, use `dart:ffi` instead of platform channels
