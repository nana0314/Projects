import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { differenceInDays } from 'date-fns';

const LAST_ATTENDANCE_KEY = 'last_attendance_date';
const EMERGENCY_CONTACT_KEY = 'emergency_contact';
const USER_EMAIL_KEY = 'user_email';

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
