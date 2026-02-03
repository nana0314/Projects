# 📱 Guide: Deploying to iOS App Store & Google Play Store

Since your app is built with **Next.js**, the easiest way to publish it as a native mobile app is using **Capacitor**. This allows you to wrap your existing website into a real mobile app.

---

## 🚀 Phase 1: Setup Capacitor (Do this first)

1.  **Install Capacitor in your project:**
    ```bash
    npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
    npx cap init
    ```
    *   *Name:* Smart Split
    *   *Package ID:* `com.smartsplit.app` (This must be unique!)

2.  **Build your Next.js app for export:**
    Update `next.config.js` to ensure static export (if needed) or point Capacitor to your web build. Usually, for simple wrapping:
    ```bash
    npm run build
    ```

3.  **Sync the code:**
    ```bash
    npx cap add android
    npx cap add ios
    npx cap sync
    ```

---

## 🤖 Phase 2: Android (Google Play Store)
*Prerequisite: Download and install [Android Studio](https://developer.android.com/studio) (Works on Windows & Mac).*

1.  **Open Android Studio:**
    ```bash
    npx cap open android
    ```
2.  **Test on Emulator:**
    *   Wait for gradle sync to finish.
    *   Click the "Run" (Play) button to test on a virtual phone.
3.  **Build Signed APK/Bundle:**
    *   Go to **Build > Generate Signed Bundle / APK**.
    *   Create a keystore (SAVE THIS PASSWORD SECURELY).
    *   Upload the `.aab` file to the [Google Play Console](https://play.google.com/console).
    *   *Note: Google charges a one-time $25 fee for a developer account.*

---

## 🍎 Phase 3: iOS (Apple App Store)
*Prerequisite: You MUST have a **Mac** with [Xcode](https://developer.apple.com/xcode/) installed. You cannot build iOS apps on Windows.*

1.  **Open Xcode:**
    ```bash
    npx cap open ios
    ```
2.  **Configure Signing:**
    *   Click on the "App" icon on the left.
    *   Go to **Signing & Capabilities**.
    *   Select your Apple Developer Team.
3.  **Test on Simulator:**
    *   Select an iPhone (e.g., iPhone 15) and click Run.
4.  **Archive & Upload:**
    *   Go to **Product > Archive**.
    *   Once finished, click "Distribute App" -> "App Store Connect".
    *   *Note: Apple charges $99/year for a developer account.*

---

## 🔄 Phase 4: Updating Your App

The beauty of this setup is **Live Updates**:
1.  For **UI/Code changes**: You often just deploy to Vercel. If your app is just a wrapper around the URL, it updates instantly!
2.  If you bundle the code inside the app (offline first), you run:
    ```bash
    npm run build
    npx cap sync
    ```
    Then re-submit to the stores only if you change native plugins or icons.

---

## 🛠 Useful Resources
*   [Capacitor Documentation](https://capacitorjs.com/docs)
*   [Next.js + Capacitor Guide](https://capacitorjs.com/solution/nextjs)
