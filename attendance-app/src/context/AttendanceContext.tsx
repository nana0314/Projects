import React, { createContext, useState, useContext, useEffect } from 'react';
import { getLastAttendance, saveAttendance, getUserName, saveUserName, getUserId, getFriends, addFriend as addFriendStorage, updateFriendNickname as updateFriendNicknameStorage, deleteFriend as deleteFriendStorage, getEmergencyContactUserId, setEmergencyContactByFriendId, unsetEmergencyContact, Friend } from '../utils/storage';

interface AttendanceContextType {
  lastAttendance: Date | null;
  markAttendance: () => Promise<void>;
  userName: string | null;
  setUserName: (name: string) => Promise<boolean>;
  userId: string | null;
  friends: Friend[];
  addFriend: (friend: Friend) => Promise<{ success: boolean; message: string }>;
  updateFriendNickname: (friendIdKey: string, nickname: string) => Promise<boolean>;
  deleteFriend: (friendIdKey: string) => Promise<boolean>;
  emergencyContactUserId: string | null;
  setEmergencyContactByFriendId: (friendIdKey: string) => Promise<boolean>;
  unsetEmergencyContact: () => Promise<boolean>;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export const AttendanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lastAttendance, setLastAttendance] = useState<Date | null>(null);
  const [userName, setUserNameState] = useState<string | null>(null);
  const [userId, setUserIdState] = useState<string | null>(null);
  const [friends, setFriendsState] = useState<Friend[]>([]);
  const [emergencyContactUserId, setEmergencyContactUserIdState] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const date = await getLastAttendance();
    setLastAttendance(date);
    const name = await getUserName();
    setUserNameState(name);
    const id = await getUserId();
    setUserIdState(id);
    const friendsList = await getFriends();
    setFriendsState(friendsList);
    const emergencyContactId = await getEmergencyContactUserId();
    setEmergencyContactUserIdState(emergencyContactId);
  };

  const markAttendance = async () => {
    const now = await saveAttendance();
    setLastAttendance(now);
    // In a real app, this would also notify friends/server
    console.log('Attendance marked at:', now);
  };

  const setEmergencyContactByFriendIdFn = async (friendIdKey: string): Promise<boolean> => {
    const success = await setEmergencyContactByFriendId(friendIdKey);
    if (success) {
      setEmergencyContactUserIdState(friendIdKey);
    }
    return success;
  };

  const unsetEmergencyContactFn = async (): Promise<boolean> => {
    const success = await unsetEmergencyContact();
    if (success) {
      setEmergencyContactUserIdState(null);
    }
    return success;
  };

  const setUserName = async (name: string): Promise<boolean> => {
      const success = await saveUserName(name);
      if (success) {
          setUserNameState(name);
      }
      return success;
  };

  const addFriend = async (friend: Friend) => {
      const result = await addFriendStorage(friend);
      if (result.success) {
          const friendsList = await getFriends();
          setFriendsState(friendsList);
      }
      return result;
  };

  const updateFriendNickname = async (friendIdKey: string, nickname: string) => {
      const success = await updateFriendNicknameStorage(friendIdKey, nickname);
      if (success) {
          const friendsList = await getFriends();
          setFriendsState(friendsList);
      }
      return success;
  };

  const deleteFriend = async (friendIdKey: string) => {
      const success = await deleteFriendStorage(friendIdKey);
      if (success) {
          const friendsList = await getFriends();
          setFriendsState(friendsList);
      }
      return success;
  };

  return (
    <AttendanceContext.Provider value={{ lastAttendance, markAttendance, userName, setUserName, userId, friends, addFriend, updateFriendNickname, deleteFriend, emergencyContactUserId, setEmergencyContactByFriendId: setEmergencyContactByFriendIdFn, unsetEmergencyContact: unsetEmergencyContactFn }}>
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
