import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
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

  // Check if friend request already exists
  const friendRequestsRef = collection(db, 'friendRequests');
  const existingRequestQuery = query(
    friendRequestsRef,
    or(
      and(
        where('senderId', '==', currentUserId),
        where('receiverId', '==', friendId)
      ),
      and(
        where('senderId', '==', friendId),
        where('receiverId', '==', currentUserId)
      )
    )
  );

  const existingRequests = await getDocs(existingRequestQuery);
  if (!existingRequests.empty) {
    throw new Error('Friend request already sent or pending');
  }

  // Create friend request in friendRequests collection
  const friendRequestRef = doc(collection(db, 'friendRequests'));
  await setDoc(friendRequestRef, {
    senderId: currentUserId,
    receiverId: friendId,
    createdAt: serverTimestamp(),
  });
};

/**
 * Accept friend request
 */
export const acceptFriendRequest = async (
  currentUserId: string,
  senderId: string
): Promise<void> => {
  const friendRequestsRef = collection(db, 'friendRequests');
  const requestQuery = query(
    friendRequestsRef,
    where('senderId', '==', senderId),
    where('receiverId', '==', currentUserId)
  );

  const requestSnapshot = await getDocs(requestQuery);
  if (requestSnapshot.empty) {
    throw new Error('Friend request not found');
  }

  const requestDoc = requestSnapshot.docs[0];

  // Create friendship in friends collection (bidirectional - only one record needed)
  const friendsRef = collection(db, 'friends');
  const friendshipRef = doc(friendsRef);
  await setDoc(friendshipRef, {
    userId: currentUserId,
    friendId: senderId,
    createdAt: serverTimestamp(),
  });

  // Delete the friend request
  await deleteDoc(doc(db, 'friendRequests', requestDoc.id));
};

/**
 * Get all friends for a user
 */
export const getUserFriends = async (userId: string): Promise<User[]> => {
  const friendsRef = collection(db, 'friends');

  // Get friends where user is userId (no status check needed - all in friends collection are accepted)
  const query1 = query(
    friendsRef,
    where('userId', '==', userId)
  );

  // Get friends where user is friendId
  const query2 = query(
    friendsRef,
    where('friendId', '==', userId)
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

/**
 * Get pending friend requests for a user (requests sent TO this user)
 */
export const getPendingFriendRequests = async (userId: string): Promise<any[]> => {
  const friendRequestsRef = collection(db, 'friendRequests');

  // Get friend requests where current user is the receiver
  const pendingQuery = query(
    friendRequestsRef,
    where('receiverId', '==', userId)
  );

  const snapshot = await getDocs(pendingQuery);

  const requests: any[] = [];
  const { getUserById } = await import('./users');

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const senderInfo = await getUserById(data.senderId);

    requests.push({
      id: doc.id,
      senderId: data.senderId,
      receiverId: data.receiverId,
      createdAt: data.createdAt,
      senderInfo,
    });
  }

  return requests;
};

/**
 * Decline friend request
 */
export const declineFriendRequest = async (
  currentUserId: string,
  senderId: string
): Promise<void> => {
  const friendRequestsRef = collection(db, 'friendRequests');
  const requestQuery = query(
    friendRequestsRef,
    where('senderId', '==', senderId),
    where('receiverId', '==', currentUserId)
  );

  const requestSnapshot = await getDocs(requestQuery);
  if (requestSnapshot.empty) {
    throw new Error('Friend request not found');
  }

  const requestDoc = requestSnapshot.docs[0];
  await deleteDoc(doc(db, 'friendRequests', requestDoc.id));
};
