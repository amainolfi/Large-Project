# MacroVanta mobile client

Flutter mobile client for the same Express JSON API used by the React web app.
JWTs are kept in platform secure storage. The client includes verification-first
registration, password recovery, AI food logging, server-backed USDA food
search, manual logging, macro/micronutrient tracking, water, sleep, cardio,
history, goals, account deletion, and persistent light/dark mode.

The API origin is centralized in `lib/config/api_config.dart`. For the course
demonstration, it points to the deployed HTTPS domain. Install and run a release
build on a physical phone; do not present from an emulator.

```powershell
C:\src\flutter\bin\flutter.bat pub get
C:\src\flutter\bin\flutter.bat analyze
C:\src\flutter\bin\flutter.bat test
C:\src\flutter\bin\flutter.bat build apk --release
```

The Android APK is written to `build/app/outputs/flutter-apk/app-release.apk`.
The current release configuration is suitable for direct physical-device
testing; configure a private release keystore before publishing to Google Play.

iOS signing and a device build require macOS with Xcode and CocoaPods. Open
`ios/Runner.xcworkspace`, select the team, retain bundle identifier
`com.cop4331.macrovanta`, and run the Release configuration on a physical
iPhone. The app uses HTTPS, so it does not require an App Transport Security
exception.
