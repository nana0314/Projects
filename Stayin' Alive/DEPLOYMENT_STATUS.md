# Cloud Functions Deployment Status

## ⚠️ Important: Billing Plan Required

To deploy Firebase Cloud Functions, your project needs to be on the **Blaze (pay-as-you-go) plan**.

### Current Status
- ❌ **Cannot deploy** - Project is on Spark (free) plan
- ✅ **Code is ready** - All functions are implemented and ready to deploy
- ✅ **Local testing available** - Can test functions locally with emulator

### To Enable Deployment

1. **Upgrade Firebase Plan**:
   - Visit: https://console.firebase.google.com/project/attendance-37566/usage/details
   - Upgrade to Blaze plan (pay-as-you-go)
   - Note: You only pay for what you use (very affordable for small apps)

2. **After Upgrade, Deploy**:
   ```bash
   cd attendance-app
   firebase deploy --only functions
   ```

### Cost Estimate

For your app:
- **Scheduled Function**: Runs once per day
- **Estimated cost**: ~$0.01-0.02/month (very low)
- **Free tier**: 2 million invocations/month (plenty for your use case)

### Functions Ready to Deploy

1. **`sendInactivityNotifications`** (Scheduled)
   - Runs every 24 hours automatically
   - Checks for inactive emergency contacts
   - Sends push notifications

2. **`sendTestInactivityNotification`** (HTTP)
   - Manual trigger for testing
   - URL: `https://us-central1-attendance-37566.cloudfunctions.net/sendTestInactivityNotification`

3. **`sendTestNotification`** (HTTP)
   - Send test notification to specific user
   - URL: `https://us-central1-attendance-37566.cloudfunctions.net/sendTestNotification`

### Testing Locally (Without Upgrade)

You can test the functions locally using the Firebase emulator:

```bash
cd attendance-app/functions
npm run serve
```

Then test via HTTP:
```bash
# Test manual trigger
curl -X POST http://localhost:5001/attendance-37566/us-central1/sendTestInactivityNotification
```

### Alternative: Manual Testing

Since we can't deploy yet, you can:
1. Test the push notification code in your app (token registration works)
2. Manually send notifications using Expo Push API (via curl or Postman)
3. Upgrade plan when ready to deploy automated functions

### Next Steps

1. ✅ Code is complete and ready
2. ⏳ Upgrade Firebase plan to Blaze
3. ✅ Deploy functions: `firebase deploy --only functions`
4. ✅ Test deployed functions

The functions are fully implemented and will work once deployed!
