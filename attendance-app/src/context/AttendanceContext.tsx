import React, { createContext, useState, useContext, useEffect } from 'react';
import { getLastAttendance, saveAttendance, getEmergencyContact, saveEmergencyContact, getUserEmail, saveUserEmail, getUserName, saveUserName, getUserId, getFriends, addFriend as addFriendStorage, Friend } from '../utils/storage';

interface AttendanceContextType {
  lastAttendance: Date | null;
  markAttendance: () => Promise<void>;
  emergencyContact: string | null;
  setEmergencyContact: (email: string) => Promise<void>;
  userEmail: string | null;
  setUserEmail: (email: string) => Promise<void>;
  userName: string | null;
  setUserName: (name: string) => Promise<void>;
  userId: string | null;
  friends: Friend[];
  addFriend: (friend: Friend) => Promise<boolean>;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export const AttendanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lastAttendance, setLastAttendance] = useState<Date | null>(null);
  const [emergencyContact, setEmergencyContactState] = useState<string | null>(null);
  const [userEmail, setUserEmailState] = useState<string | null>(null);
  const [userName, setUserNameState] = useState<string | null>(null);
  const [userId, setUserIdState] = useState<string | null>(null);
  const [friends, setFriendsState] = useState<Friend[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const date = await getLastAttendance();
    setLastAttendance(date);
    const contact = await getEmergencyContact();
    setEmergencyContactState(contact);
    const email = await getUserEmail();
    setUserEmailState(email);
    const name = await getUserName();
    setUserNameState(name);
    const id = await getUserId();
    setUserIdState(id);
    const friendsList = await getFriends();
    setFriendsState(friendsList);
  };

  const markAttendance = async () => {
    const now = await saveAttendance();
    setLastAttendance(now);
    // In a real app, this would also notify friends/server
    console.log('Attendance marked at:', now);
  };

  const setEmergencyContact = async (email: string) => {
    await saveEmergencyContact(email);
    setEmergencyContactState(email);
  };

  const setUserEmail = async (email: string) => {
      await saveUserEmail(email);
      setUserEmailState(email);
  };

  const setUserName = async (name: string) => {
      await saveUserName(name);
      setUserNameState(name);
  };

  const addFriend = async (friend: Friend) => {
      const success = await addFriendStorage(friend);
      if (success) {
          const friendsList = await getFriends();
          setFriendsState(friendsList);
      }
      return success;
  };

  return (
    <AttendanceContext.Provider value={{ lastAttendance, markAttendance, emergencyContact, setEmergencyContact, userEmail, setUserEmail, userName, setUserName, userId, friends, addFriend }}>
      {children}
    </AttendanceContext.Provider>
  );
};

export const useAttendance = () => {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
};
