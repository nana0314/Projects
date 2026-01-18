# Local Testing Guide for Cloud Functions

This guide will help you test Cloud Functions locally using Firebase Emulators.

## Quick Start

### Option A: Using Test Script (Recommended)

1. **Start emulators**:
   ```bash
   cd attendance-app
   firebase emulators:start --only functions,firestore
   ```

2. **Run the test script**:
   ```powershell
   # PowerShell (Windows)
   .\test-function.ps1
   ```
   
   OR
   
   ```bash
   # Bash (Mac/Linux)
   chmod +x test-function.sh
   ./test-function.sh
   ```

3. **View results**:
   - Open Emulator UI: http://localhost:4000
   - Check function logs in the Functions tab
   - Verify notifications in your app

The test script will:
- Prompt for a user ID to test
- Send a test notification to that user
- Trigger the inactivity check for all users

### Option B: Manual Testing

See sections below for manual testing with curl commands or Emulator UI.

## Prerequisites

1. **Install Firebase Emulator Suite**:
   ```bash
   npm install -g firebase-tools
   ```

2. **Install emulator dependencies** (if not already installed):
   ```bash
   firebase setup:emulators:firestore
   firebase setup:emulators:functions
   ```

## Starting Local Emulators

1. **Start all emulators**:
   ```bash
   cd attendance-app
   firebase emulators:start
   ```

   This will start:
   - Functions Emulator: http://localhost:5001
   - Firestore Emulator: http://localhost:8080
   - Emulator UI: http://localhost:4000

## Testing Scheduled Functions Locally

Since scheduled functions (cron jobs) don't run automatically in the emulator, you need to manually trigger them.

### Option 1: Using Test Script (Easiest) ⭐

See **Quick Start** section above. The `test-function.ps1` (or `.sh`) script handles everything automatically.

### Option 2: Manual HTTP Requests

The scheduled function logic is duplicated in `sendTestInactivityNotification` which can be called via HTTP:

**PowerShell:**
```powershell
# Test the inactivity check manually
Invoke-RestMethod -Uri "http://localhost:5001/attendance-37566/us-central1/sendTestInactivityNotification" -Method Post

# Test specific user
Invoke-RestMethod -Uri "http://localhost:5001/attendance-37566/us-central1/sendTestNotification" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"userId": "#1234"}'
```

**Bash/curl:**
```bash
# Test the inactivity check manually
curl -X POST http://localhost:5001/attendance-37566/us-central1/sendTestInactivityNotification

# Test specific user
curl -X POST http://localhost:5001/attendance-37566/us-central1/sendTestNotification \
  -H "Content-Type: application/json" \
  -d '{"userId": "#1234"}'
```

### Option 3: Manually Trigger via Emulator UI

1. Open Emulator UI: http://localhost:4000
2. Go to Functions tab
3. Click on `sendTestInactivityNotification` or `sendTestNotification`
4. Click "Call function" to trigger it
5. For `sendTestNotification`, provide JSON body: `{"userId": "#1234"}`

## Testing with Real Data

### 1. Import Real Firestore Data (Optional)

If you want to test with your real Firestore data:
```bash
# Export data from production
firebase firestore:export backup

# Import to emulator
firebase emulators:start --import=./backup
```

### 2. Create Test Data Manually

You can add test data directly in the Emulator UI:
- Go to http://localhost:4000
- Click on Firestore
- Create test user documents with:
  - `expoPushToken`: Your test Expo push token
  - `emergencyContactUserId`: ID of emergency contact
  - `lastAttendance`: Timestamp older than 2 days (for testing)

## Configuration

### Schedule Changed to 5 Minutes

The function schedule has been changed from `every 24 hours` to `every 5 minutes` for easier testing.

**Important**: Change this back to `every 24 hours` before deploying to production!

### Update Schedule

Edit `functions/index.js`:
```javascript
exports.sendInactivityNotifications = functions.pubsub
  .schedule('every 5 minutes')  // Change back to 'every 24 hours' for production
  .timeZone('UTC')
  .onRun(async (context) => {
```

## Troubleshooting

### Emulator won't start

1. **Port already in use**:
   - Change ports in `firebase.json`
   - Or kill process using the port

2. **Firestore rules error**:
   - Check `firestore.rules` file
   - Emulator uses these rules for local testing

### Functions not found

1. **Check emulator is running**: http://localhost:4000
2. **Verify function names** match
3. **Check logs** in emulator UI

### Push notifications not sending

1. **Verify Expo Push Token** is valid in Firestore
2. **Check console logs** for errors
3. **Test token** using Expo Push Tool: https://expo.dev/notifications

## Testing Workflow

1. **Start emulators**:
   ```bash
   firebase emulators:start
   ```

2. **Start your app** (in another terminal):
   ```bash
   cd attendance-app
   npm start
   ```

3. **Connect app to emulator** (update `firebase.ts`):
   ```typescript
   // For local testing, use emulator
   if (__DEV__) {
     connectFirestoreEmulator(db, 'localhost', 8080);
   }
   ```

4. **Trigger test**:
   ```bash
   curl -X POST http://localhost:5001/attendance-37566/us-central1/sendTestInactivityNotification
   ```

5. **Check results**:
   - Emulator UI: http://localhost:4000 (logs)
   - App console: Check for notifications
   - Device: Check if push notification received

## Next Steps

Once local testing works:
1. ✅ Verify push notifications work
2. ✅ Test with different inactivity periods
3. ✅ Change schedule back to `every 24 hours`
4. ✅ Upgrade Firebase plan
5. ✅ Deploy to production
