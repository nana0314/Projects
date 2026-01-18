# Still Alive

This is a React Native app built with Expo that allows users to check in daily to confirm they're safe. If a user misses check-in for 2 consecutive days, it notifies their emergency contact.

## Features

- **Daily Check-in**: Simple button to mark your daily check-in and confirm you're safe.
- **Emergency Contact**: Set up an emergency contact to be notified if you miss check-ins.
- **Inactivity Alert**: Background task checks for inactivity (2 days) and triggers notifications to your emergency contact.
- **Friends List**: Add friends and track their check-in status.

## Setup and Installation

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Run the App**:
    - For iOS (requires Mac): `npm run ios`
    - For Android: `npm run android`
    - Start Expo Go server: `npm start`

## Publishing to App Stores

This project is configured with EAS (Expo Application Services) in mind, which is the standard way to build and submit Expo apps.

### Prerequisites

1.  Create an account at [expo.dev](https://expo.dev).
2.  Install EAS CLI:
    ```bash
    npm install -g eas-cli
    ```
3.  Login to EAS:
    ```bash
    eas login
    ```

### Configuration

1.  **Configure Project**:
    Run the following to generate `eas.json`:
    ```bash
    eas build:configure
    ```

2.  **Update `app.json`**:
    Ensure the `ios.bundleIdentifier` and `android.package` are unique and correct for your app.

### Building for Stores

**Android (Play Store):**
1.  Build an AAB (Android App Bundle):
    ```bash
    eas build --platform android
    ```
2.  Once the build completes, download the `.aab` file from the provided link.
3.  Upload this file to the Google Play Console.

**iOS (App Store):**
1.  You need a paid Apple Developer Account ($99/year).
2.  Build for iOS:
    ```bash
    eas build --platform ios
    ```
3.  EAS can handle the submission process automatically if you configure your Apple credentials.

## Important Note on "Email Sending"

In a purely client-side app like this (without a dedicated backend server), "sending an email" automatically in the background is restricted by mobile operating systems for security and spam reasons.

- **Current Implementation**: The app detects inactivity in the background and logs the event / shows a local notification.
- **Production Solution**: To reliably send emails when the user is *not* opening the app, you need a small backend service (Node.js/Python/Firebase Cloud Functions).
    1.  The app "checks in" by hitting an API endpoint.
    2.  The server stores the last check-in date in a database.
    3.  A daily cron job on the server checks for users who haven't checked in for > 2 days and sends the emails via a service like SendGrid or AWS SES.
