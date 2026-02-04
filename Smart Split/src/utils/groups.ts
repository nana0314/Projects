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
 * Generate a random 4-character alphanumeric group ID
 */
const generateGroupId = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = '';
  for (let i = 0; i < 4; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
};

/**
 * Check if a group ID is available (not already used)
 */
const isGroupIdAvailable = async (groupId: string): Promise<boolean> => {
  const groupRef = doc(db, 'groups', groupId);
  const groupDoc = await getDoc(groupRef);
  return !groupDoc.exists();
};

/**
 * Generate a unique 4-character group ID
 * Tries up to 10 times to find an available ID
 */
const generateUniqueGroupId = async (): Promise<string> => {
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const groupId = generateGroupId();
    if (await isGroupIdAvailable(groupId)) {
      return groupId;
    }
    attempts++;
  }

  throw new Error('Failed to generate unique group ID. Please try again.');
};

/**
 * Create a new group
 */
export const createGroup = async (
  name: string,
  createdBy: string,
  description?: string,
  photoURL?: string
): Promise<string> => {
  // Generate unique 4-character group ID
  const groupId = await generateUniqueGroupId();
  const groupRef = doc(db, 'groups', groupId);

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
  return groupId;
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
  // Validate group ID is not empty
  const trimmedId = groupId?.trim().toUpperCase();
  if (!trimmedId) {
    throw new Error('Group ID is required');
  }

  const groupRef = doc(db, 'groups', trimmedId);

  let groupDoc;
  try {
    groupDoc = await getDoc(groupRef);
  } catch (err: any) {
    // If it's a permission error, it's likely because the group doesn't exist
    // (With updated rules, authenticated users should be able to read all groups)
    console.error('Error fetching group:', err);
    throw new Error('Group not found - please check the ID and try again');
  }

  if (!groupDoc.exists()) {
    throw new Error('Group not found - please check the ID and try again');
  }

  const group = groupDoc.data() as Group;
  // Check if user is already a member
  if (group.members.some(m => m.userId === userId)) {
    throw new Error('You are already a member of this group');
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
 * Invite a user to join a group (creator only)
 */
export const inviteUserToGroup = async (
  groupId: string,
  inviterUserId: string,
  inviteeUniqueId: string
): Promise<void> => {
  const groupRef = doc(db, 'groups', groupId);
  const groupDoc = await getDoc(groupRef);

  if (!groupDoc.exists()) {
    throw new Error('Group not found');
  }

  const group = groupDoc.data() as Group;

  // Only group creator can invite
  if (group.createdBy !== inviterUserId) {
    throw new Error('Only the group creator can invite members');
  }

  // Find user by uniqueId
  const usersRef = collection(db, 'users');
  const userQuery = query(usersRef, where('uniqueId', '==', inviteeUniqueId));
  const userSnapshot = await getDocs(userQuery);

  if (userSnapshot.empty) {
    throw new Error('User with this ID not found');
  }

  const inviteeUser = userSnapshot.docs[0];
  const inviteeUserId = inviteeUser.id;
  const inviteeData = inviteeUser.data();

  // Check if user is already a member
  if (group.members.some(m => m.userId === inviteeUserId)) {
    throw new Error('User is already a member of this group');
  }

  const member: GroupMember = {
    userId: inviteeUserId,
    uniqueId: inviteeData.uniqueId,
    displayName: inviteeData.displayName,
  };

  await updateDoc(groupRef, {
    members: arrayUnion(member),
    memberIds: arrayUnion(inviteeUserId),
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
 * Remove a member from a group (creator only)
 */
export const removeMemberFromGroup = async (
  groupId: string,
  memberUserId: string,
  creatorUserId: string
): Promise<void> => {
  const groupRef = doc(db, 'groups', groupId);
  const groupDoc = await getDoc(groupRef);

  if (!groupDoc.exists()) {
    throw new Error('Group not found');
  }

  const group = groupDoc.data() as Group;

  // Only the creator can remove members
  if (group.createdBy !== creatorUserId) {
    throw new Error('Only the group creator can remove members');
  }

  // Cannot remove yourself - use leaveGroup instead
  if (memberUserId === creatorUserId) {
    throw new Error('Creator cannot remove themselves. Use leave group or delete group instead.');
  }

  const memberToRemove = group.members.find(m => m.userId === memberUserId);

  if (!memberToRemove) {
    throw new Error('User is not a member of this group');
  }

  await updateDoc(groupRef, {
    members: arrayRemove(memberToRemove),
    memberIds: arrayRemove(memberUserId),
    updatedAt: serverTimestamp(),
  });
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