import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { differenceInDays } from 'date-fns';

const LAST_ATTENDANCE_KEY = 'last_attendance_date';
const EMERGENCY_CONTACT_KEY = 'emergency_contact';
const USER_EMAIL_KEY = 'user_email';
const USER_NAME_KEY = 'user_name';
const USER_ID_KEY = 'user_id';
const FRIENDS_KEY = 'friends';

export const saveAttendance = async () => {
  const now = new Date();
  await AsyncStorage.setItem(LAST_ATTENDANCE_KEY, now.toISOString());
  return now;
};

export const getLastAttendance = async () => {
  const dateStr = await AsyncStorage.getItem(LAST_ATTENDANCE_KEY);
  return dateStr ? new Date(dateStr) : null;
};

export const saveEmergencyContact = async (email: string) => {
  await AsyncStorage.setItem(EMERGENCY_CONTACT_KEY, email);
};

export const getEmergencyContact = async () => {
  return await AsyncStorage.getItem(EMERGENCY_CONTACT_KEY);
};

export const saveUserEmail = async (email: string) => {
    await AsyncStorage.setItem(USER_EMAIL_KEY, email);
};

export const getUserEmail = async () => {
    return await AsyncStorage.getItem(USER_EMAIL_KEY);
};

export const generateUserId = (): string => {
    // Generate a random 4-digit number (1000-9999) and format as #XXXX
    const randomNum = Math.floor(Math.random() * 9000) + 1000;
    return `#${randomNum}`;
};

export const getUserName = async (): Promise<string | null> => {
    return await AsyncStorage.getItem(USER_NAME_KEY);
};

export const saveUserName = async (name: string) => {
    await AsyncStorage.setItem(USER_NAME_KEY, name);
};

export const getUserId = async (): Promise<string | null> => {
    let userId = await AsyncStorage.getItem(USER_ID_KEY);
    if (!userId) {
        // Generate a new ID if one doesn't exist
        userId = generateUserId();
        await AsyncStorage.setItem(USER_ID_KEY, userId);
    }
    return userId;
};

export interface Friend {
    name: string;
    idKey: string;
}

export const getFriends = async (): Promise<Friend[]> => {
    const friendsStr = await AsyncStorage.getItem(FRIENDS_KEY);
    if (!friendsStr) return [];
    try {
        return JSON.parse(friendsStr);
    } catch {
        return [];
    }
};

export const saveFriends = async (friends: Friend[]) => {
    await AsyncStorage.setItem(FRIENDS_KEY, JSON.stringify(friends));
};

export const addFriend = async (friend: Friend) => {
    const friends = await getFriends();
    // Check if friend with same ID key already exists
    const exists = friends.some(f => f.idKey === friend.idKey);
    if (!exists) {
        friends.push(friend);
        await saveFriends(friends);
    }
    return !exists;
};

export const checkInactivity = async () => {
  const lastAttendance = await getLastAttendance();
  if (!lastAttendance) return { inactive: false, days: 0 };

  const now = new Date();
  const daysDiff = differenceInDays(now, lastAttendance);

  if (daysDiff >= 2) {
    return { inactive: true, days: daysDiff };
  }
  return { inactive: false, days: daysDiff };
};
