import * as Notifications from 'expo-notifications';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EXPO_PUSH_TOKEN_KEY = 'expo_push_token';
const USER_ID_KEY = 'user_id';

/**
 * Register for Expo Push Token (works with FCM backend)
 */
export const registerForPushNotifications = async (): Promise<string | null> => {
  try {
    // Request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Push notification permission denied');
      return null;
    }

    // Get Expo Push Token (Expo handles FCM integration)
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: 'attendance-37566', // Your Firebase project ID
    });

    const token = tokenData.data;
    
    // Save token to Firestore
    const userId = await AsyncStorage.getItem(USER_ID_KEY);
    if (userId) {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        expoPushToken: token,
        pushTokenUpdatedAt: new Date().toISOString()
      }, { merge: true });
      
      console.log('Expo Push Token saved to Firestore for user:', userId);
    } else {
      console.warn('User ID not found, token not saved to Firestore');
    }

    // Save token locally
    await AsyncStorage.setItem(EXPO_PUSH_TOKEN_KEY, token);
    
    console.log('Expo Push Token registered:', token);
    return token;
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
};

/**
 * Get stored push token from local storage
 */
export const getPushToken = async (): Promise<string | null> => {
  return await AsyncStorage.getItem(EXPO_PUSH_TOKEN_KEY);
};

/**
 * Get push token from Firestore for a specific user
 */
export const getPushTokenFromFirestore = async (userId: string): Promise<string | null> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const data = userSnap.data();
      return data.expoPushToken || null;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting push token from Firestore:', error);
    return null;
  }
};

/**
 * Refresh push token (useful if token changes)
 */
export const refreshPushToken = async (): Promise<string | null> => {
  // Remove old token
  await AsyncStorage.removeItem(EXPO_PUSH_TOKEN_KEY);
  // Register new token
  return await registerForPushNotifications();
};
