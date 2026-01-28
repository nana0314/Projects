import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  query,
  where,
  getDocs,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  deleteDoc,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/src/config/firebase';
import { Group, User, GroupMember } from '@/src/types';

/**
 * Create a new group
 */
export const createGroup = async (
  name: string,
  createdBy: string,
  description?: string,
  photoURL?: string
): Promise<string> => {
  const groupsRef = collection(db, 'groups');
  const groupRef = doc(groupsRef);

  // Get user details to store in members
  const { getUserById } = await import('./users');
  const creator = await getUserById(createdBy);
  
  if (!creator) {
    throw new Error('User not found');
  }

  const member: GroupMember = {
    userId: createdBy,
    uniqueId: creator.uniqueId,
    displayName: creator.displayName,
  };

  const groupData: any = {
    name,
    createdBy,
    members: [member],
    memberIds: [createdBy], // Keep memberIds in sync for Firestore queries
    createdAt: serverTimestamp() as any,
    updatedAt: serverTimestamp() as any,
  };

  // Only include optional fields if they have values
  if (description) {
    groupData.description = description;
  }
  if (photoURL) {
    groupData.photoURL = photoURL;
  }

  await setDoc(groupRef, groupData);
  return groupRef.id;
};

/**
 * Get group by ID
 */
export const getGroupById = async (groupId: string): Promise<Group | null> => {
  const groupRef = doc(db, 'groups', groupId);
  const groupDoc = await getDoc(groupRef);

  if (groupDoc.exists()) {
    return { id: groupDoc.id, ...groupDoc.data() } as Group;
  }
  return null;
};

/**
 * Update group
 */
export const updateGroup = async (
  groupId: string,
  updates: Partial<Pick<Group, 'name' | 'description' | 'photoURL'>>
): Promise<void> => {
  const groupRef = doc(db, 'groups', groupId);
  
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
  
  await updateDoc(groupRef, cleanUpdates);
};

/**
 * Join a group
 */
export const joinGroup = async (groupId: string, userId: string): Promise<void> => {
  const groupRef = doc(db, 'groups', groupId);
  
  let groupDoc;
  try {
    groupDoc = await getDoc(groupRef);
  } catch (err: any) {
    // If it's a permission error, it's likely because the group doesn't exist
    // or the user doesn't have access. Convert to "not found" error.
    if (err.code === 'permission-denied' || err.message?.includes('permission') || err.message?.includes('Missing or insufficient')) {
      throw new Error('Group with this ID not found');
    }
    // Re-throw the original error if it's something else
    throw err;
  }

  if (!groupDoc.exists()) {
    throw new Error('Group with this ID not found');
  }

  const group = groupDoc.data() as Group;
  // Check if user is already a member
  if (group.members.some(m => m.userId === userId)) {
    throw new Error('User is already a member of this group');
  }

  // Get user details to store in members
  const { getUserById } = await import('./users');
  const user = await getUserById(userId);
  
  if (!user) {
    throw new Error('User not found');
  }

  const member: GroupMember = {
    userId: userId,
    uniqueId: user.uniqueId,
    displayName: user.displayName,
  };

  await updateDoc(groupRef, {
    members: arrayUnion(member),
    memberIds: arrayUnion(userId), // Keep memberIds in sync
    updatedAt: serverTimestamp(),
  });
};

/**
 * Leave a group
 */
export const leaveGroup = async (groupId: string, userId: string): Promise<void> => {
  const groupRef = doc(db, 'groups', groupId);
  const groupDoc = await getDoc(groupRef);

  if (!groupDoc.exists()) {
    throw new Error('Group not found');
  }

  const group = groupDoc.data() as Group;
  const memberToRemove = group.members.find(m => m.userId === userId);
  
  if (!memberToRemove) {
    throw new Error('User is not a member of this group');
  }

  if (group.members.length === 1) {
    // If last member, delete the group
    await deleteDoc(groupRef);
  } else {
    await updateDoc(groupRef, {
      members: arrayRemove(memberToRemove),
      memberIds: arrayRemove(userId), // Keep memberIds in sync
      updatedAt: serverTimestamp(),
    });
  }
};

/**
 * Get all groups for a user
 */
export const getUserGroups = async (userId: string): Promise<Group[]> => {
  const groupsRef = collection(db, 'groups');
  // Query using memberIds array for efficient filtering
  const groupsQuery = query(groupsRef, where('memberIds', 'array-contains', userId));
  const groupsSnapshot = await getDocs(groupsQuery);

  const groups: Group[] = [];
  groupsSnapshot.forEach((doc) => {
    groups.push({ id: doc.id, ...doc.data() } as Group);
  });

  return groups;
};

/**
 * Get group members with user details
 * Returns User objects with data from stored member info plus additional user data
 */
export const getGroupMembers = async (groupId: string): Promise<User[]> => {
  const group = await getGroupById(groupId);
  if (!group) {
    return [];
  }

  const { getUserById } = await import('./users');
  const members: User[] = [];

  // Use stored member data, but fetch full user data for photoURL and other fields
  for (const memberInfo of group.members) {
    const fullUser = await getUserById(memberInfo.userId);
    if (fullUser) {
      // Ensure uniqueId and displayName from stored data are used (in case user updated their profile)
      members.push({
        ...fullUser,
        uniqueId: memberInfo.uniqueId,
        displayName: memberInfo.displayName,
      });
    } else {
      // Fallback: create a minimal user object from stored member data
      members.push({
        uid: memberInfo.userId,
        email: '',
        displayName: memberInfo.displayName,
        uniqueId: memberInfo.uniqueId,
        createdAt: {} as any,
        updatedAt: {} as any,
      });
    }
  }

  return members;
};

/**
 * Upload group picture
 */
export const uploadGroupPicture = async (
  groupId: string,
  file: File
): Promise<string> => {
  const storageRef = ref(storage, `groups/${groupId}/photo/${file.name}`);
  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
};