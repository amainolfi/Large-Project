# MacroVanta mobile client

Flutter mobile client for the same Express JSON API used by the React web app.
JWTs are kept in platform secure storage. The client includes verification-first
registration, password recovery, AI food logging, macro/micronutrient tracking,
history, goals, and persistent light/dark mode.

The API origin is centralized in `lib/config/api_config.dart`. For the course
demonstration, install and run the release build on a physical phone; do not use
an emulator.

```powershell
C:\src\flutter\bin\flutter.bat pub get
C:\src\flutter\bin\flutter.bat analyze
C:\src\flutter\bin\flutter.bat test
```
