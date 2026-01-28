# Firebase Authentication Setup for Smart Split

## Issue: Google Sign-in Not Working on Hosted URL

If Google sign-in is not working on your deployed URL (`https://smart-split-9acc2.web.app`), follow these steps:

### Step 1: Add Authorized Domains

1. Go to Firebase Console:
   https://console.firebase.google.com/project/smart-split-9acc2/authentication/settings

2. Scroll down to **"Authorized domains"** section

3. Make sure these domains are listed:
   - `smart-split-9acc2.web.app` (Firebase Hosting default domain)
   - `smart-split-9acc2.firebaseapp.com` (Firebase Hosting alternate domain)
   - `localhost` (for local development)
   - Your custom domain (if you have one)

4. If any are missing, click **"Add domain"** and add them

### Step 2: Verify Google OAuth Configuration

1. In the same Firebase Console page, go to **"Sign-in method"** tab

2. Click on **"Google"** provider

3. Make sure:
   - **Enable** toggle is ON
   - **Project support email** is set
   - **Project public-facing name** is set

4. Click **"Save"** if you made any changes

### Step 3: Check Google Cloud Console OAuth Settings

1. Go to Google Cloud Console:
   https://console.cloud.google.com/apis/credentials?project=smart-split-9acc2

2. Find the OAuth 2.0 Client ID that Firebase created (should have name like "Web client (auto created by Google Service)")

3. Click to edit it

4. In **"Authorized JavaScript origins"**, make sure you have:
   - `https://smart-split-9acc2.web.app`
   - `https://smart-split-9acc2.firebaseapp.com`
   - `http://localhost:3000` (for local dev)

5. In **"Authorized redirect URIs"**, make sure you have:
   - `https://smart-split-9acc2.firebaseapp.com/__/auth/handler`
   - `http://localhost:3000/__/auth/handler` (for local dev)

6. Click **"Save"**

### Step 4: Verify Firebase Config

Make sure your `.env.local` file has the correct configuration (already done):
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyACll2F4L7V6DZygH_vbYGpJ3MfOQrTHk0
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=smart-split-9acc2.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=smart-split-9acc2
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=smart-split-9acc2.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=172611349581
NEXT_PUBLIC_FIREBASE_APP_ID=1:172611349581:web:ba8ddb7cde4b93120a4004
```

### Step 5: Test and Deploy

After making the changes above:

1. Wait a few minutes for changes to propagate
2. Test the sign-in on your hosted URL: https://smart-split-9acc2.web.app
3. Check browser console for any errors
4. If still not working, try:
   - Clearing browser cache
   - Using incognito/private mode
   - Checking browser popup blockers

### Common Error Messages

- **"auth/unauthorized-domain"**: Domain not in authorized domains list → Add to Step 1
- **"auth/popup-blocked"**: Browser blocked the popup → Allow popups for the site
- **"auth/popup-closed-by-user"**: User closed the popup → Try again
- **"auth/network-request-failed"**: Network issue → Check internet connection

### Still Not Working?

1. Check browser console for detailed error messages
2. Verify that Google Sign-in method is enabled in Firebase Console
3. Make sure you're using the correct Firebase project (smart-split-9acc2)
4. Try using `signInWithRedirect` instead of `signInWithPopup` (may need code changes)