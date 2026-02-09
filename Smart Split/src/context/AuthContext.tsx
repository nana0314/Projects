'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getAuth, User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChange } from '@/src/utils/auth';
import { createUserDocument, getUserById } from '@/src/utils/users';
import { User } from '@/src/types';

interface AuthContextType {
  user: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  refreshUser: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      setUser(firebaseUser);

      try {
        if (firebaseUser) {
          // Create user document if it doesn't exist
          await createUserDocument(firebaseUser);

          // Get user data from Firestore
          const data = await getUserById(firebaseUser.uid);
          setUserData(data);
        } else {
          setUserData(null);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        // Fallback: keep user logged in but maybe without full profile data
        // or let the UI handle the missing userData
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const refreshUser = async () => {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (currentUser) {
      await currentUser.reload();
      // Force update of user state to trigger re-renders
      setUser({ ...currentUser });

      // Also refresh Firestore data
      const data = await getUserById(currentUser.uid);
      setUserData(data);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}