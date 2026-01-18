import React, { useEffect, useRef } from 'react';
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
import { registerForPushNotifications } from './src/utils/fcmUtils';
// Initialize Firebase
import './src/config/firebase';

const BACKGROUND_FETCH_TASK = 'background-fetch-task';

export type RootStackParamList = {
  Home: undefined;
  Settings: undefined;
  Friends: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

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

export default function App() {
  const notificationListener = useRef<Notifications.Subscription | undefined>(undefined);
  const responseListener = useRef<Notifications.Subscription | undefined>(undefined);

  useEffect(() => {
    // Register for push notifications and get FCM/Expo token
    registerForPushNotifications().then((token) => {
      if (token) {
        console.log('✅ FCM/Expo Push Token registered:', token);
      } else {
        console.log('⚠️ Failed to register push token');
      }
    }).catch((error) => {
      console.error('Error registering push notifications:', error);
    });

    // Register background fetch
    registerBackgroundFetchAsync().catch((error) => {
      console.error('Error registering background fetch:', error);
    });

    // Listen for notifications received while app is in foreground
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('📬 Notification received:', notification);
    });

    // Listen for notification taps
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification tapped:', response);
      // You can add navigation logic here if needed
      // Example: navigation.navigate('Home');
    });

    // Cleanup listeners on unmount
    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  return (
    <AttendanceProvider>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Stayin\' Alive' }} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="Friends" component={FriendsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </AttendanceProvider>
  );
}
