const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();

/**
 * Cloud Function to send push notifications when emergency contacts haven't checked in for 2+ days
 * This runs automatically every 24 hours via a scheduled trigger
 */
exports.sendInactivityNotifications = functions.pubsub
  .schedule('every 5 minutes')
  .timeZone('UTC')
  .onRun(async (context) => {
    console.log('Starting inactivity notification check...');
    
    try {
      const usersRef = db.collection('users');
      
      // Get all users who have an emergency contact set
      const usersSnapshot = await usersRef
        .where('emergencyContactUserId', '!=', null)
        .get();

      if (usersSnapshot.empty) {
        console.log('No users with emergency contacts found.');
        return null;
      }

      const now = admin.firestore.Timestamp.now();
      const twoDaysInMillis = 2 * 24 * 60 * 60 * 1000;
      const twoDaysAgo = admin.firestore.Timestamp.fromMillis(
        now.toMillis() - twoDaysInMillis
      );

      const notificationPromises = [];
      let notificationsSent = 0;

      // Check each user's emergency contact
      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        const userId = userDoc.id;
        const emergencyContactId = userData.emergencyContactUserId;
        const expoPushToken = userData.expoPushToken;

        // Skip if user doesn't have a push token
        if (!expoPushToken) {
          console.log(`User ${userId} has no push token, skipping...`);
          continue;
        }

        if (!emergencyContactId) {
          continue;
        }

        try {
          // Get emergency contact's last attendance
          const emergencyContactRef = usersRef.doc(emergencyContactId);
          const emergencyContactDoc = await emergencyContactRef.get();

          if (!emergencyContactDoc.exists) {
            console.log(`Emergency contact ${emergencyContactId} not found for user ${userId}`);
            continue;
          }

          const emergencyContactData = emergencyContactDoc.data();
          const lastAttendance = emergencyContactData.lastAttendance;

          // Check if emergency contact hasn't checked in for 2+ days
          if (!lastAttendance) {
            console.log(`Emergency contact ${emergencyContactId} has no attendance record`);
            // Consider as inactive if never checked in
            const contactName = emergencyContactData.userName || 'Emergency Contact';
            
            const notificationPromise = sendExpoPushNotification(
              expoPushToken,
              'Emergency Contact Alert',
              `${contactName} hasn't checked in yet!`,
              {
                type: 'emergency_contact_inactive',
                contactId: emergencyContactId,
                days: 'unknown',
              }
            );
            notificationPromises.push(notificationPromise);
            notificationsSent++;
            continue;
          }

          // Check if last attendance is older than 2 days
          if (lastAttendance.toMillis() < twoDaysAgo.toMillis()) {
            const daysInactive = Math.floor(
              (now.toMillis() - lastAttendance.toMillis()) / (24 * 60 * 60 * 1000)
            );

            const contactName = emergencyContactData.userName || 'Emergency Contact';

            console.log(
              `Sending notification to user ${userId}: ` +
              `${contactName} hasn't checked in for ${daysInactive} days`
            );

            // Send push notification via Expo API
            const notificationPromise = sendExpoPushNotification(
              expoPushToken,
              'Emergency Contact Alert',
              `${contactName} hasn't checked in for ${daysInactive} days!`,
              {
                type: 'emergency_contact_inactive',
                contactId: emergencyContactId,
                days: daysInactive.toString(),
                contactName: contactName,
              }
            );

            notificationPromises.push(notificationPromise);
            notificationsSent++;
          }
        } catch (error) {
          console.error(`Error processing user ${userId}:`, error);
          // Continue with next user even if one fails
        }
      }

      // Wait for all notifications to be sent
      await Promise.all(notificationPromises);

      console.log(`✅ Successfully sent ${notificationsSent} inactivity notifications`);
      return null;
    } catch (error) {
      console.error('❌ Error in sendInactivityNotifications:', error);
      return null;
    }
  });

/**
 * Helper function to send push notification via Expo Push API
 */
async function sendExpoPushNotification(token, title, body, data = {}) {
  try {
    const message = {
      to: token,
      sound: 'default',
      title: title,
      body: body,
      data: data,
      priority: 'high',
      badge: 1,
    };

    const response = await axios.post(
      'https://exp.host/--/api/v2/push/send',
      message,
      {
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Push notification sent successfully:', response.data);
    return response.data;
  } catch (error) {
    const errorMessage = error.response && error.response.data ? error.response.data : error.message;
    console.error('Error sending push notification:', errorMessage);
    throw error;
  }
}

/**
 * Manual trigger function for testing (can be called via HTTP)
 * Usage: POST /sendTestInactivityNotification
 */
exports.sendTestInactivityNotification = functions.https.onRequest(async (req, res) => {
  console.log('Manual test trigger received');
  
  try {
    // Run the same logic as the scheduled function
    const usersRef = db.collection('users');
    const usersSnapshot = await usersRef
      .where('emergencyContactUserId', '!=', null)
      .get();

    if (usersSnapshot.empty) {
      return res.json({
        success: true,
        message: 'No users with emergency contacts found.',
        notificationsSent: 0,
      });
    }

    const now = admin.firestore.Timestamp.now();
    const twoDaysInMillis = 2 * 24 * 60 * 60 * 1000;
    const twoDaysAgo = admin.firestore.Timestamp.fromMillis(
      now.toMillis() - twoDaysInMillis
    );

    const notificationPromises = [];
    let notificationsSent = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const emergencyContactId = userData.emergencyContactUserId;
      const expoPushToken = userData.expoPushToken;

      if (!expoPushToken || !emergencyContactId) continue;

      try {
        const emergencyContactRef = usersRef.doc(emergencyContactId);
        const emergencyContactDoc = await emergencyContactRef.get();

        if (!emergencyContactDoc.exists) continue;

        const emergencyContactData = emergencyContactDoc.data();
        const lastAttendance = emergencyContactData.lastAttendance;

        if (!lastAttendance || lastAttendance.toMillis() < twoDaysAgo.toMillis()) {
          const daysInactive = lastAttendance 
            ? Math.floor((now.toMillis() - lastAttendance.toMillis()) / (24 * 60 * 60 * 1000))
            : 999;
          const contactName = emergencyContactData.userName || 'Emergency Contact';

          const notificationPromise = sendExpoPushNotification(
            expoPushToken,
            'Emergency Contact Alert',
            `${contactName} hasn't checked in for ${daysInactive} days!`,
            {
              type: 'emergency_contact_inactive',
              contactId: emergencyContactId,
              days: daysInactive.toString(),
            }
          );

          notificationPromises.push(notificationPromise);
          notificationsSent++;
        }
      } catch (error) {
        console.error(`Error processing user ${userDoc.id}:`, error);
      }
    }

    await Promise.all(notificationPromises);
    
    res.json({
      success: true,
      message: `Test notification check completed. Sent ${notificationsSent} notifications.`,
      notificationsSent,
    });
  } catch (error) {
    console.error('Error in test trigger:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Function to send a test notification to a specific user
 * Usage: POST /sendTestNotification with body: { userId: "user_id" }
 */
exports.sendTestNotification = functions.https.onRequest(async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({
      success: false,
      error: 'userId is required',
    });
  }

  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const userData = userDoc.data();
    const expoPushToken = userData.expoPushToken;

    if (!expoPushToken) {
      return res.status(400).json({
        success: false,
        error: 'User has no push token',
      });
    }

    await sendExpoPushNotification(
      expoPushToken,
      'Test Notification',
      'This is a test notification from Stayin\' Alive!',
      {
        type: 'test',
      }
    );

    res.json({
      success: true,
      message: 'Test notification sent successfully',
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});
