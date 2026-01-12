# Firebase Setup Instructions

## Step 1: Enable Firestore Database

1. Go to https://console.firebase.google.com/project/attendance-37566/overview
2. Sign in with your Google account
3. In the left sidebar, click on **"Firestore Database"**
4. Click **"Create database"**
5. Select **"Start in test mode"** (for development)
6. Choose a location (select the one closest to you, e.g., `us-central1`)
7. Click **"Enable"**

## Step 2: Security Rules (For Development)

After creating the database, you'll see the Firestore Database page. Click on the **"Rules"** tab.

For development/testing, use these rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
  match /users/{userId} {
    allow read, write: if true;
  }
}
```

Click **"Publish"** to save the rules.

**⚠️ IMPORTANT:** These rules allow anyone to read/write. Only use for development. For production, you'll need proper security rules with authentication.

## Step 3: Verify Setup

Once Firestore is enabled, your app should be able to:
- Save and retrieve user data
- Store attendance records
- Save friends list
- Store user profile information

## Data Structure

Your data will be stored in Firestore under:
- Collection: `users`
- Document ID: User's ID key (e.g., "#1234")
- Document fields:
  - `userId`: User's ID key
  - `userName`: User's name
  - `userEmail`: User's email
  - `emergencyContact`: Emergency contact email
  - `lastAttendance`: Timestamp
  - `lastAttendanceDate`: ISO string
  - `friends`: Array of friend objects

## Testing

After enabling Firestore, try using the app:
1. Set your name in Settings
2. Mark attendance
3. Add friends
4. Check if data appears in Firebase Console → Firestore Database → Data tab
