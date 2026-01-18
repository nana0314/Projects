# Stayin' Alive

This is a React Native app built with Expo that allows users to check in daily to confirm they're safe. If a user misses check-in for 2 consecutive days, it notifies their emergency contact.

## Features

- **Daily Check-in**: Simple button to mark your daily check-in and confirm you're safe.
- **Emergency Contact**: Set up an emergency contact to be notified if you miss check-ins.
- **Inactivity Alert**: Background task checks for inactivity (2 days) and triggers notifications to your emergency contact.
- **Friends List**: Add friends and track their check-in status.

In a purely client-side app like this (without a dedicated backend server), "sending an email" automatically in the background is restricted by mobile operating systems for security and spam reasons.

- **Current Implementation**: The app detects inactivity in the background and logs the event / shows a local notification.
- **Production Solution**: To reliably send emails when the user is *not* opening the app, you need a small backend service (Node.js/Python/Firebase Cloud Functions).
    1.  The app "checks in" by hitting an API endpoint.
    2.  The server stores the last check-in date in a database.
    3.  A daily cron job on the server checks for users who haven't checked in for > 2 days and sends the emails via a service like SendGrid or AWS SES.
