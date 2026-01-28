import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  or,
  and,
} from 'firebase/firestore';
import { db } from '@/src/config/firebase';
import { Friend, User } from '@/src/types';

/**
 * Add a friend by unique ID
 */
export const addFriendByUniqueId = async (
  currentUserId: string,
  friendUniqueId: string
): Promise<void> => {
  // Get friend user by unique ID
  const usersRef = collection(db, 'users');
  const friendQuery = query(usersRef, where('uniqueId', '==', friendUniqueId));
  const friendSnapshot = await getDocs(friendQuery);

  if (friendSnapshot.empty) {
    throw new Error('User with this ID not found');
  }

  const friendDoc = friendSnapshot.docs[0];
  const friendId = friendDoc.id;

  if (friendId === currentUserId) {
    throw new Error('Cannot add yourself as a friend');
  }

  // Check if friendship already exists
  const friendsRef = collection(db, 'friends');
  const existingFriendQuery = query(
    friendsRef,
    or(
      and(
        where('userId', '==', currentUserId),
        where('friendId', '==', friendId)
      ),
      and(
        where('userId', '==', friendId),
        where('friendId', '==', currentUserId)
      )
    )
  );

  const existingFriends = await getDocs(existingFriendQuery);
  if (!existingFriends.empty) {
    throw new Error('Friend relationship already exists');
  }

  // Create friend request (pending)
  const friendRef = doc(collection(db, 'friends'));
  await setDoc(friendRef, {
    userId: currentUserId,
    friendId: friendId,
    status: 'pending',
    addedAt: serverTimestamp(),
  });
};

/**
 * Accept friend request
 */
export const acceptFriendRequest = async (
  currentUserId: string,
  friendId: string
): Promise<void> => {
  const friendsRef = collection(db, 'friends');
  const friendQuery = query(
    friendsRef,
    where('userId', '==', friendId),
    where('friendId', '==', currentUserId),
    where('status', '==', 'pending')
  );

  const friendSnapshot = await getDocs(friendQuery);
  if (friendSnapshot.empty) {
    throw new Error('Friend request not found');
  }

  const friendDoc = friendSnapshot.docs[0];
  await updateDoc(doc(db, 'friends', friendDoc.id), {
    status: 'accepted',
  });
};

/**
 * Get all friends for a user
 */
export const getUserFriends = async (userId: string): Promise<User[]> => {
  const friendsRef = collection(db, 'friends');
  
  // Get friends where user is userId and status is accepted
  const query1 = query(
    friendsRef,
    where('userId', '==', userId),
    where('status', '==', 'accepted')
  );

  // Get friends where user is friendId and status is accepted
  const query2 = query(
    friendsRef,
    where('friendId', '==', userId),
    where('status', '==', 'accepted')
  );

  const [snapshot1, snapshot2] = await Promise.all([
    getDocs(query1),
    getDocs(query2),
  ]);

  const friendIds: string[] = [];

  snapshot1.forEach((doc) => {
    const data = doc.data();
    friendIds.push(data.friendId);
  });

  snapshot2.forEach((doc) => {
    const data = doc.data();
    friendIds.push(data.userId);
  });

  // Get user details for each friend
  const { getUserById } = await import('./users');
  const friends: User[] = [];
  
  for (const friendId of friendIds) {
    const friend = await getUserById(friendId);
    if (friend) {
      friends.push(friend);
    }
  }

  return friends;
};