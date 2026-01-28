import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/src/config/firebase';
import { User } from '@/src/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a unique 8-character alphanumeric ID
 */
export const generateUniqueId = (): string => {
  return uuidv4().replace(/-/g, '').substring(0, 8).toUpperCase();
};

/**
 * Create user document in Firestore after signup
 */
export const createUserDocument = async (
  firebaseUser: any,
  uniqueId?: string
): Promise<void> => {
  const userId = firebaseUser.uid;
  const userRef = doc(db, 'users', userId);

  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) {
    const newUniqueId = uniqueId || generateUniqueId();
    
    // Check if uniqueId already exists
    const existingUserQuery = query(
      collection(db, 'users'),
      where('uniqueId', '==', newUniqueId)
    );
    const existingUsers = await getDocs(existingUserQuery);
    
    let finalUniqueId = newUniqueId;
    if (!existingUsers.empty) {
      // Generate a new one if collision
      finalUniqueId = generateUniqueId();
    }

    const userData: any = {
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || 'User',
      uniqueId: finalUniqueId,
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
    };

    // Only include photoURL if it exists
    if (firebaseUser.photoURL) {
      userData.photoURL = firebaseUser.photoURL;
    }

    await setDoc(userRef, userData);
  }
};

/**
 * Get user document by UID
 */
export const getUserById = async (userId: string): Promise<User | null> => {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  
  if (userDoc.exists()) {
    return { uid: userDoc.id, ...userDoc.data() } as User;
  }
  return null;
};

/**
 * Get user by unique ID
 */
export const getUserByUniqueId = async (uniqueId: string): Promise<User | null> => {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('uniqueId', '==', uniqueId));
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    const userDoc = querySnapshot.docs[0];
    return { uid: userDoc.id, ...userDoc.data() } as User;
  }
  return null;
};

/**
 * Update user profile
 */
export const updateUserProfile = async (
  userId: string,
  updates: Partial<Pick<User, 'displayName' | 'photoURL'>>
): Promise<void> => {
  const userRef = doc(db, 'users', userId);
  
  // Filter out undefined values
  const cleanUpdates: any = {
    updatedAt: serverTimestamp(),
  };
  
  Object.keys(updates).forEach((key) => {
    const value = updates[key as keyof typeof updates];
    if (value !== undefined) {
      cleanUpdates[key] = value;
    }
  });
  
  await updateDoc(userRef, cleanUpdates);
};

/**
 * Upload user profile picture
 */
export const uploadProfilePicture = async (
  userId: string,
  file: File
): Promise<string> => {
  const storageRef = ref(storage, `users/${userId}/profile/${file.name}`);
  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
};