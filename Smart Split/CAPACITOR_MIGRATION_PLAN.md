
# Native App Migration Plan (Capacitor)

## Goal
Transform the existing Next.js PWA into a Native Mobile App (iOS & Android) using **Capacitor**.
**Approach**: Wrap the existing React code in a native container (Hybrid App).

## Phase 1: Core Integration

### 1. Install & Configure Capacitor
- Install `@capacitor/core`, `@capacitor/cli`, `@capacitor/android`, `@capacitor/ios`.
- Initialize Capacitor config (`capacitor.config.ts`).
- **Crucial**: Set `webDir: 'out'` (since we use Next.js static export).

### 2. Build Scripts
- Add `npm run build:mobile` script:
  ```bash
  npm run build && npx cap sync
  ```
- This ensures your native projects are always in sync with your latest React code.

### 3. Platform Detection Utility
- Create a helper to detect web vs native environment:
  ```typescript
  import { Capacitor } from '@capacitor/core';
  export const isNative = () => Capacitor.isNativePlatform();
  ```
- Use throughout the app to branch behavior (e.g., disable PWA prompts, switch auth methods, conditionally load analytics).

### 4. Code Adjustments for Native (Hide Web Elements)
- **Disable PWA Prompts**: Completely disable the "Install App" banner and PWA registration logic when running natively.
- **Hide Browser UI**: Ensure the app runs in full-screen mode (Capacitor does this by default, but verify settings).
- **Safe Area Support**:
  - Add `viewport-fit=cover` to the HTML meta viewport tag.
  - Configure `@capacitor/status-bar` plugin for proper status bar behavior on iOS.
  - Use `env(safe-area-inset-*)` CSS properties in `globals.css` (already partially in place — verify inside Capacitor's WebView as behavior differs from Safari PWA).
- **Disable Zoom**: Ensure `user-scalable=no` meta tag is strict to prevent accidental zooming.
- **Vercel Analytics**: Conditionally disable `@vercel/analytics` and `@vercel/speed-insights` when running natively — they only work on Vercel-hosted deployments. Consider replacing with Firebase Analytics for the native build.

---

## Phase 2: "Real App" Requirements (Often Overlooked)

### 5. App Icons & Splash Screens
*You cannot launch with the default Capacitor logo.*
- **Action**: Install `@capacitor/assets`.
- **Process**: Create a single `assets/logo.png` and `assets/splash.png`.
- **Command**: Run `npx capacitor-assets generate --iconBackgroundColor #ffffff --splashBackgroundColor #ffffff`.
- **Result**: Automatically generates all 40+ required icon sizes for iOS and Android.

### 6. Native Authentication (CRITICAL)
*Web popup auth (`signInWithPopup`) is unreliable inside Capacitor's iOS WebView — Apple blocks third-party cookies in WKWebView which breaks Google popup auth.*
- **Action**: Use `@capacitor-firebase/authentication` plugin for native sign-in flows.
- **Google Sign-In**: Uses native Google Sign-In SDK on each platform, then passes the credential to Firebase Auth.
- **Apple Sign-In** (required by Apple if you offer Google Sign-In):
  - Requires Apple Developer Account with "Sign In with Apple" capability enabled.
  - Configure Apple as auth provider in Firebase Console.
  - Add "Sign in with Apple" button side-by-side with Google on the login screen.
- **Fallback**: Keep the existing `signInWithPopup()` logic for the web version, use platform detection to switch.

### 7. Native Permissions (CRITICAL)
*Your app uses Camera and Push Notifications — both require explicit permission declarations.*
- **iOS (`Info.plist`)**:
  - `NSCameraUsageDescription` — "We need camera access to scan receipts and QR codes."
  - *(If push notifications)*: Request notification permission via `@capacitor/push-notifications`.
  - Upload APNs key to Firebase Console for FCM delivery on iOS.
- **Android (`AndroidManifest.xml`)**:
  - `<uses-permission android:name="android.permission.CAMERA" />`
  - `<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />` (required on Android 13+).
- **Impact**: App will crash instantly if you use these features without declaring them.

---

## Phase 3: Verification Guide

#### ✅ Android Verification (Windows/Mac)
1.  **Open**: `npx cap open android`
2.  **Run**: Click Green Play Button ▶ (Pixel Emulator).
3.  **Test Checklist**:
    - [ ] Sign in with Google — verify native auth flow works
    - [ ] Add expense — verify Firestore write
    - [ ] Load dashboard — verify Recharts renders in WebView
    - [ ] Navigate between all tabs — no blank screens
    - [ ] Keyboard pushes content up correctly (`android:windowSoftInputMode="adjustResize"`)
    - [ ] Rotate device — layout doesn't break

#### 🍎 iOS Verification (Mac Only)
1.  **Open**: `npx cap open ios`
2.  **Run**: Click Play Button ▶ (iPhone Simulator).
3.  **Test Checklist**:
    - [ ] Sign in with Google + Apple Sign-In — both work
    - [ ] Top/bottom safe areas (notch/home bar) are respected
    - [ ] Camera capture opens for receipt scanning
    - [ ] All pages load without blank screens
    - [ ] Scroll behavior is smooth (no rubber-banding issues)

---

## Phase 4: Store Readiness Checklist

### Mandatory Compliance
- [ ] **Apple Sign-In**: Required if you use Google Sign-In.
- [ ] **Account Deletion**: Button to delete data (GDPR/Apple requirement).
- [ ] **EULA/Block/Report**: Required because users share content (Group Names/Expenses).

### Best Practices
- [ ] **Deep Linking**: Setup `smartsplit://` scheme so shared links open the app.
- [ ] **Version Codes**:
    - iOS: `CFBundleVersion` (Build number, e.g., 1.0.0.1)
    - Android: `versionCode` (Integer, e.g., 10001)
    - *Tip*: Automate this using `capacitor-set-version` package.
