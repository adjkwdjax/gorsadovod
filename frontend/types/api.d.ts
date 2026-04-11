export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  rating: number;
  clubs?: Array<{ id: string; name: string }>;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  authorId?: string | null;
  authorName: string;
  createdAt: string;
  imageUrl?: string;
  tags: string[];
}

export interface CreateBlogPostPayload {
  title: string;
  content: string;
  excerpt?: string;
  imageUrl?: string;
  authorName?: string;
  tags?: string[];
}

export interface ForumTopic {
  id: string;
  title: string;
  description: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  repliesCount: number;
  isSubscribed?: boolean;
}

export interface ForumReply {
  id: string;
  topicId: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}

export interface ForumNotification {
  id: string;
  topicId: string;
  topicTitle: string;
  postId: string;
  postContentPreview: string;
  isRead: boolean;
  createdAt: string;
}

export type MarketplaceCategory = 'Отдам даром' | 'Обмен' | 'Ищу';

export interface MarketplaceAd {
  id: string;
  title: string;
  description: string;
  category: MarketplaceCategory;
  authorId: string;
  authorName: string;
  createdAt: string;
  imageUrl?: string;
  location?: string;
  isActive?: boolean;
}

export interface DiaryPlantEntry {
  id: string;
  plantId: string;
  authorId: string;
  date: string;
  text: string;
  imageUrl?: string;
  createdAt: string;
}

export interface DiaryPlant {
  id: string;
  userId: string;
  name: string;
  description: string;
  entriesCount: number;
  createdAt: string;
  updatedAt: string;
  latestEntry?: DiaryPlantEntry | null;
}

export interface DiaryPlantDetail extends DiaryPlant {
  entries: DiaryPlantEntry[];
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  recipientName: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

export interface Dialog {
  userId: string;
  userName: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface Club {
  id: string;
  name: string;
  description: string;
  authorId: string;
  authorName: string;
  membersCount: number;
  isMember: boolean;
  createdAt: string;
}

export interface ClubMember {
  id: string;
  username: string;
  rating: number;
}

export interface ClubDetail extends Club {
  members: ClubMember[];
}

export interface MapLocation {
  id: string;
  title: string;
  description: string;
  lat: number;
  lng: number;
  type: 'Точка обмена' | 'Городской сад';
  authorId?: string;
  authorName?: string;
  createdAt?: string;
}

export interface TradeExchange {
  id: string;
  initiatorId: string;
  initiatorName: string;
  counterpartyId: string;
  counterpartyName: string;
  itemsFromInitiator: string;
  itemsFromCounterparty: string;
  status: 'open' | 'completed' | 'cancelled';
  confirmedByInitiator: boolean;
  confirmedByCounterparty: boolean;
  completedAt?: string | null;
  createdAt: string;
}

export interface TradeReview {
  id: string;
  exchangeId: string;
  authorId: string;
  authorName: string;
  targetId: string;
  targetName: string;
  rating: number;
  comment: string;
  createdAt: string;
}
