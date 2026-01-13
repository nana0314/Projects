import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AttendanceProvider } from './src/context/AttendanceContext';
import HomeScreen from './src/screens/HomeScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import FriendsScreen from './src/screens/FriendsScreen';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { checkEmergencyContactInactivity } from './src/utils/storage';
// Initialize Firebase
import './src/config/firebase';

const BACKGROUND_FETCH_TASK = 'background-fetch-task';

export type RootStackParamList = {
  Home: undefined;
  Settings: undefined;
  Friends: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

// Define background task
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    const { inactive, days, contactName } = await checkEmergencyContactInactivity();
    if (inactive && contactName) {
      // Send local notification to the user about their emergency contact
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Emergency Contact Alert",
          body: `${contactName} hasn't checked in for ${days} days!`,
        },
        trigger: null,
      });

      console.log(`[BACKGROUND] Emergency contact ${contactName} hasn't checked in for ${days} days`);
      
      return BackgroundFetch.BackgroundFetchResult.NewData;
    }
    return BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error) {
    console.error('[BACKGROUND] Error in background task:', error);
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
          <Stack.Screen name="Friends" component={FriendsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </AttendanceProvider>
  );
}
