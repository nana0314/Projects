import { Timestamp } from 'firebase/firestore';

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  header: string;
  title: string;
  body: string;
  hashtags: string[];
  searchTokens: string[];
  visibility: 'public' | 'private';
  createdAt: Timestamp;
  commentCount: number;
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  body: string;
  parentId: string | null;
  createdAt: Timestamp;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  createdAt?: Timestamp;
}

export type FriendRequestStatus = 'pending' | 'accepted' | 'declined';

export interface FriendRequest {
  id: string;
  fromId: string;
  fromName: string;
  fromPhoto: string;
  toId: string;
  status: FriendRequestStatus;
  createdAt: Timestamp;
}

export interface Friendship {
  id: string;
  userIds: [string, string];
  createdAt: Timestamp;
}

export type ChatType = 'dm' | 'group';

export interface Chat {
  id: string;
  type: ChatType;
  participantIds: string[];
  participantNames?: Record<string, string>;
  participantPhotos?: Record<string, string>;
  groupName?: string;
  adminId?: string;
  lastMessage: string;
  lastMessageAt: Timestamp;
  createdAt: Timestamp;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderPhoto: string;
  body: string;
  createdAt: Timestamp;
}

export interface CommentedPost {
  postId: string;
  firstCommentedAt: Timestamp;
}
