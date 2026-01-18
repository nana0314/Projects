import { db } from '../config/firebase';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, query, where, Timestamp, deleteField } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { differenceInDays } from 'date-fns';

const USER_ID_KEY = 'user_id';

// Get or create user document reference
const getUserDocRef = async () => {
  let userId = await AsyncStorage.getItem(USER_ID_KEY);
  if (!userId) {
    // Generate a new ID if one doesn't exist
    userId = generateUserId();
    await AsyncStorage.setItem(USER_ID_KEY, userId);
  }
  return doc(db, 'users', userId);
};

export const generateUserId = (): string => {
  // Generate a random 4-digit number (1000-9999) and format as #XXXX
  const randomNum = Math.floor(Math.random() * 9000) + 1000;
  return `#${randomNum}`;
};

export interface Friend {
  name: string;
  idKey: string;
  nickname?: string;
}

// Attendance functions
export const saveAttendance = async () => {
  try {
    const now = new Date();
    const userRef = await getUserDocRef();
    await updateDoc(userRef, {
      lastAttendance: Timestamp.fromDate(now),
      lastAttendanceDate: now.toISOString()
    }).catch(async (error) => {
      // If document doesn't exist, create it
      console.log('Document doesn\'t exist, creating new one:', error);
      await setDoc(userRef, {
        lastAttendance: Timestamp.fromDate(now),
        lastAttendanceDate: now.toISOString()
      });
    });
    return now;
  } catch (error) {
    console.error('Error saving attendance:', error);
    throw error;
  }
};

export const getLastAttendance = async (): Promise<Date | null> => {
  try {
    const userRef = await getUserDocRef();
    const userSnap = await getDoc(userRef);
    if (userSnap.exists() && userSnap.data().lastAttendanceDate) {
      return new Date(userSnap.data().lastAttendanceDate);
    }
    return null;
  } catch (error) {
    console.error('Error getting last attendance:', error);
    return null;
  }
};

export const getFriendLastAttendance = async (friendIdKey: string): Promise<Date | null> => {
  try {
    const friendRef = doc(db, 'users', friendIdKey);
    const friendSnap = await getDoc(friendRef);
    if (friendSnap.exists() && friendSnap.data().lastAttendanceDate) {
      return new Date(friendSnap.data().lastAttendanceDate);
    }
    return null;
  } catch (error) {
    console.error('Error getting friend last attendance:', error);
    return null;
  }
};

export const hasCheckedInToday = (lastAttendanceDate: Date | null): boolean => {
  if (!lastAttendanceDate) return false;
  const today = new Date();
  const lastCheckIn = new Date(lastAttendanceDate);
  
  // Check if same day
  return (
    today.getFullYear() === lastCheckIn.getFullYear() &&
    today.getMonth() === lastCheckIn.getMonth() &&
    today.getDate() === lastCheckIn.getDate()
  );
};

// User profile functions
export const getUserName = async (): Promise<string | null> => {
  try {
    const userRef = await getUserDocRef();
    const userSnap = await getDoc(userRef);
    return userSnap.exists() ? userSnap.data().userName || null : null;
  } catch (error) {
    console.error('Error getting user name:', error);
    return null;
  }
};

export const saveUserName = async (name: string): Promise<boolean> => {
  try {
    const userRef = await getUserDocRef();
    const userSnap = await getDoc(userRef);
    
    // Check if name already exists - if it does, don't allow overwriting
    if (userSnap.exists() && userSnap.data().userName) {
      return false; // Name already set, cannot be changed
    }
    
    // Name doesn't exist, save it
    await updateDoc(userRef, { userName: name }).catch(async (error) => {
      console.log('Document doesn\'t exist, creating new one:', error);
      await setDoc(userRef, { userName: name });
    });
    return true; // Successfully saved
  } catch (error) {
    console.error('Error saving user name:', error);
    throw error;
  }
};

export const getUserEmail = async (): Promise<string | null> => {
  const userRef = await getUserDocRef();
  const userSnap = await getDoc(userRef);
  return userSnap.exists() ? userSnap.data().userEmail || null : null;
};

export const saveUserEmail = async (email: string) => {
  const userRef = await getUserDocRef();
  await updateDoc(userRef, { userEmail: email }).catch(async () => {
    await setDoc(userRef, { userEmail: email });
  });
};

export const getUserId = async (): Promise<string | null> => {
  let userId = await AsyncStorage.getItem(USER_ID_KEY);
  if (!userId) {
    userId = generateUserId();
    await AsyncStorage.setItem(USER_ID_KEY, userId);
    // Create user document in Firestore
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, { userId: userId });
  }
  return userId;
};

// Search functions
export const searchUserByEmail = async (email: string): Promise<boolean> => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('userEmail', '==', email));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error searching user by email:', error);
    return false;
  }
};

export const getUserByIdByEmail = async (email: string): Promise<string | null> => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('userEmail', '==', email));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      // Return the document ID (which is the user's ID key)
      return querySnapshot.docs[0].id;
    }
    return null;
  } catch (error) {
    console.error('Error getting user ID by email:', error);
    return null;
  }
};

export const searchUserByIdKey = async (idKey: string): Promise<{ exists: boolean; userName?: string }> => {
  try {
    const userRef = doc(db, 'users', idKey);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const data = userSnap.data();
      return { exists: true, userName: data.userName || null };
    }
    return { exists: false };
  } catch (error) {
    console.error('Error searching user by ID key:', error);
    return { exists: false };
  }
};

// Emergency contact functions
export const getEmergencyContact = async (): Promise<string | null> => {
  const userRef = await getUserDocRef();
  const userSnap = await getDoc(userRef);
  return userSnap.exists() ? userSnap.data().emergencyContact || null : null;
};

export const getEmergencyContactUserId = async (): Promise<string | null> => {
  try {
    const userRef = await getUserDocRef();
    const userSnap = await getDoc(userRef);
    return userSnap.exists() ? userSnap.data().emergencyContactUserId || null : null;
  } catch (error) {
    console.error('Error getting emergency contact user ID:', error);
    return null;
  }
};

export const saveEmergencyContact = async (email: string): Promise<boolean> => {
  try {
    // Search for the email in the database and get the user ID
    const emergencyContactUserId = await getUserByIdByEmail(email);
    if (!emergencyContactUserId) {
      return false; // Email not found in database
    }
    
    // Get current user's ID
    const currentUserId = await getUserId();
    if (!currentUserId) {
      return false;
    }
    
    // Save emergency contact email in current user's document
    const userRef = await getUserDocRef();
    await updateDoc(userRef, { 
      emergencyContact: email,
      emergencyContactUserId: emergencyContactUserId 
    }).catch(async () => {
      await setDoc(userRef, { 
        emergencyContact: email,
        emergencyContactUserId: emergencyContactUserId 
      });
    });
    
    // Also store the relationship in the emergency contact user's document
    const emergencyContactRef = doc(db, 'users', emergencyContactUserId);
    const emergencyContactSnap = await getDoc(emergencyContactRef);
    const hasAsEmergencyContact = emergencyContactSnap.exists() 
      ? (emergencyContactSnap.data().hasAsEmergencyContact || [])
      : [];
    
    // Add current user's ID to the list if not already present
    if (!hasAsEmergencyContact.includes(currentUserId)) {
      hasAsEmergencyContact.push(currentUserId);
      await updateDoc(emergencyContactRef, { 
        hasAsEmergencyContact: hasAsEmergencyContact 
      }).catch(async () => {
        await setDoc(emergencyContactRef, { 
          hasAsEmergencyContact: [currentUserId] 
        });
      });
    }
    
    return true; // Successfully saved
  } catch (error) {
    console.error('Error saving emergency contact:', error);
    throw error;
  }
};

// Set emergency contact by friend ID (user ID)
export const setEmergencyContactByFriendId = async (friendIdKey: string): Promise<boolean> => {
  try {
    // Get current user's ID
    const currentUserId = await getUserId();
    if (!currentUserId) {
      return false;
    }
    
    // Verify the friend exists
    const friendRef = doc(db, 'users', friendIdKey);
    const friendSnap = await getDoc(friendRef);
    if (!friendSnap.exists()) {
      return false;
    }
    
    // Save emergency contact user ID in current user's document
    const userRef = await getUserDocRef();
    await updateDoc(userRef, { 
      emergencyContactUserId: friendIdKey 
    }).catch(async () => {
      await setDoc(userRef, { 
        emergencyContactUserId: friendIdKey 
      });
    });
    
    // Also store the relationship in the emergency contact user's document
    const emergencyContactRef = doc(db, 'users', friendIdKey);
    const emergencyContactSnap = await getDoc(emergencyContactRef);
    const hasAsEmergencyContact = emergencyContactSnap.exists() 
      ? (emergencyContactSnap.data().hasAsEmergencyContact || [])
      : [];
    
    // Add current user's ID to the list if not already present
    if (!hasAsEmergencyContact.includes(currentUserId)) {
      hasAsEmergencyContact.push(currentUserId);
      await updateDoc(emergencyContactRef, { 
        hasAsEmergencyContact: hasAsEmergencyContact 
      }).catch(async () => {
        await setDoc(emergencyContactRef, { 
          hasAsEmergencyContact: [currentUserId] 
        });
      });
    }
    
    return true; // Successfully saved
  } catch (error) {
    console.error('Error setting emergency contact:', error);
    return false;
  }
};

// Unset/Remove emergency contact
export const unsetEmergencyContact = async (): Promise<boolean> => {
  try {
    // Get current user's ID and current emergency contact
    const currentUserId = await getUserId();
    const currentEmergencyContactUserId = await getEmergencyContactUserId();
    
    if (!currentUserId) {
      return false;
    }
    
    // Remove emergency contact from current user's document
    const userRef = await getUserDocRef();
    await updateDoc(userRef, { 
      emergencyContactUserId: deleteField(),
      emergencyContact: deleteField()
    });
    
    // Remove current user from the emergency contact's hasAsEmergencyContact list
    if (currentEmergencyContactUserId) {
      const emergencyContactRef = doc(db, 'users', currentEmergencyContactUserId);
      const emergencyContactSnap = await getDoc(emergencyContactRef);
      if (emergencyContactSnap.exists()) {
        const hasAsEmergencyContact = emergencyContactSnap.data().hasAsEmergencyContact || [];
        const filtered = hasAsEmergencyContact.filter((id: string) => id !== currentUserId);
        await updateDoc(emergencyContactRef, { 
          hasAsEmergencyContact: filtered 
        });
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error unsetting emergency contact:', error);
    return false;
  }
};

// Friends functions
export const getFriends = async (): Promise<Friend[]> => {
  const userRef = await getUserDocRef();
  const userSnap = await getDoc(userRef);
  if (userSnap.exists() && userSnap.data().friends) {
    return userSnap.data().friends as Friend[];
  }
  return [];
};

export const saveFriends = async (friends: Friend[]) => {
  const userRef = await getUserDocRef();
  // Filter out undefined nickname values before saving to Firebase
  const friendsToSave = friends.map(friend => {
    const friendObj: Friend = { name: friend.name, idKey: friend.idKey };
    if (friend.nickname) {
      friendObj.nickname = friend.nickname;
    }
    return friendObj;
  });
  await updateDoc(userRef, { friends: friendsToSave }).catch(async () => {
    await setDoc(userRef, { friends: friendsToSave });
  });
};

export const addFriend = async (friend: Friend): Promise<{ success: boolean; message: string }> => {
  try {
    // Search for the ID key in the database
    const searchResult = await searchUserByIdKey(friend.idKey);
    if (!searchResult.exists) {
      return { success: false, message: 'Friend not found' };
    }
    
    const friends = await getFriends();
    // Check if friend with same ID key already exists in friends list
    const alreadyAdded = friends.some(f => f.idKey === friend.idKey);
    if (alreadyAdded) {
      return { success: false, message: 'Friend already added' };
    }
    
    // Use the name from database if available, otherwise use the provided name
    const friendName = searchResult.userName || friend.name;
    const newFriend: Friend = { name: friendName, idKey: friend.idKey };
    if (friend.nickname) {
      newFriend.nickname = friend.nickname;
    }
    friends.push(newFriend);
    await saveFriends(friends);
    return { success: true, message: 'Friend added' };
  } catch (error) {
    console.error('Error adding friend:', error);
    return { success: false, message: 'Error adding friend' };
  }
};

export const updateFriendNickname = async (friendIdKey: string, nickname: string): Promise<boolean> => {
  try {
    const friends = await getFriends();
    const friendIndex = friends.findIndex(f => f.idKey === friendIdKey);
    if (friendIndex === -1) {
      return false;
    }
    const trimmedNickname = nickname.trim();
    if (trimmedNickname) {
      friends[friendIndex].nickname = trimmedNickname;
    } else {
      delete friends[friendIndex].nickname;
    }
    await saveFriends(friends);
    return true;
  } catch (error) {
    console.error('Error updating friend nickname:', error);
    return false;
  }
};

export const deleteFriend = async (friendIdKey: string): Promise<boolean> => {
  try {
    const friends = await getFriends();
    const friendIndex = friends.findIndex(f => f.idKey === friendIdKey);
    if (friendIndex === -1) {
      return false;
    }
    friends.splice(friendIndex, 1);
    await saveFriends(friends);
    return true;
  } catch (error) {
    console.error('Error deleting friend:', error);
    return false;
  }
};

// Inactivity check
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

// Check emergency contact inactivity
export const checkEmergencyContactInactivity = async () => {
  try {
    const emergencyContactUserId = await getEmergencyContactUserId();
    if (!emergencyContactUserId) {
      return { inactive: false, days: 0, contactName: null };
    }

    const lastAttendance = await getFriendLastAttendance(emergencyContactUserId);
    if (!lastAttendance) {
      return { inactive: false, days: 0, contactName: null };
    }

    const now = new Date();
    const daysDiff = differenceInDays(now, lastAttendance);

    // Get the contact's name
    const contactRef = doc(db, 'users', emergencyContactUserId);
    const contactSnap = await getDoc(contactRef);
    const contactName = contactSnap.exists() ? (contactSnap.data().userName || 'Emergency Contact') : 'Emergency Contact';

    if (daysDiff >= 2) {
      return { inactive: true, days: daysDiff, contactName };
    }
    return { inactive: false, days: daysDiff, contactName };
  } catch (error) {
    console.error('Error checking emergency contact inactivity:', error);
    return { inactive: false, days: 0, contactName: null };
  }
};
