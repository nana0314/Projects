import React, { createContext, useState, useContext, useEffect } from 'react';
import { getLastAttendance, saveAttendance, getEmergencyContact, saveEmergencyContact, getUserEmail, saveUserEmail } from '../utils/storage';

interface AttendanceContextType {
  lastAttendance: Date | null;
  markAttendance: () => Promise<void>;
  emergencyContact: string | null;
  setEmergencyContact: (email: string) => Promise<void>;
  userEmail: string | null;
  setUserEmail: (email: string) => Promise<void>;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export const AttendanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lastAttendance, setLastAttendance] = useState<Date | null>(null);
  const [emergencyContact, setEmergencyContactState] = useState<string | null>(null);
  const [userEmail, setUserEmailState] = useState<string | null>(null);

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
  }

  return (
    <AttendanceContext.Provider value={{ lastAttendance, markAttendance, emergencyContact, setEmergencyContact, userEmail, setUserEmail }}>
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
