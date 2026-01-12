import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AttendanceProvider } from './src/context/AttendanceContext';
import HomeScreen from './src/screens/HomeScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { checkInactivity, getEmergencyContact } from './src/utils/storage';
import * as MailComposer from 'expo-mail-composer';
import { Platform, Alert } from 'react-native';

const BACKGROUND_FETCH_TASK = 'background-fetch-task';

export type RootStackParamList = {
  Home: undefined;
  Settings: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

// Define background task
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    const { inactive, days } = await checkInactivity();
    if (inactive) {
      const contact = await getEmergencyContact();
      if (contact) {
        // Send local notification
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Check-in Alert",
            body: `You haven't checked in for ${days} days! Emergency contact will be notified.`,
          },
          trigger: null,
        });

        // In a real app with backend, the backend would send the email.
        // For this standalone app, we can only prepare the email or use a cloud function.
        // Since we don't have a backend, we'll simulate "sending" by logging here.
        console.log(`[BACKGROUND] Sending emergency email to ${contact}`);
        
        return BackgroundFetch.BackgroundFetchResult.NewData;
      }
    }
    return BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error) {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

async function registerBackgroundFetchAsync() {
  return BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
    minimumInterval: 60 * 60 * 24, // 24 hours
    stopOnTerminate: false, // android only,
    startOnBoot: true, // android only
  });
}

// Request permissions
async function registerForPushNotificationsAsync() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    console.log('Failed to get push token for push notification!');
    return;
  }
}

export default function App() {
  useEffect(() => {
    registerForPushNotificationsAsync();
    registerBackgroundFetchAsync();
  }, []);

  return (
    <AttendanceProvider>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Attendance' }} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </AttendanceProvider>
  );
}
