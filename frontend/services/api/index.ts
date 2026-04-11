import { AuthResponse, BlogPost, Club, ClubDetail, CreateBlogPostPayload, DiaryPlant, DiaryPlantDetail, DiaryPlantEntry, Dialog, ForumNotification, ForumReply, ForumTopic, MapLocation, MarketplaceAd, Message, TradeExchange, TradeReview, User } from '@/types/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

// Helper for fetch requests
async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth-token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const method = (options.method || 'GET').toUpperCase();
    const isUnsafeMethod = method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS';
    if (isUnsafeMethod) {
      const csrfToken = getCookie('csrftoken');
      if (csrfToken) {
        headers['X-CSRFToken'] = csrfToken;
      }
    }
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const authService = {
  login: async (credentials: any): Promise<AuthResponse> => {
    return fetchApi<AuthResponse>('/auth/login/', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },
  register: async (data: any): Promise<AuthResponse> => {
    return fetchApi<AuthResponse>('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
};

export interface ProfileUpdatePayload {
  username?: string;
  email?: string;
}

export const profileService = {
  updateMe: async (payload: ProfileUpdatePayload): Promise<User> => {
    return fetchApi<User>('/profiles/me/', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  getPublicProfile: async (userId: string | number): Promise<User> => {
    return fetchApi<User>(`/profiles/${userId}/`);
  },
  getReviews: async (userId: string | number): Promise<TradeReview[]> => {
    return fetchApi<TradeReview[]>(`/profiles/${userId}/reviews/`);
  }
};

export const blogService = {
  getPosts: async (): Promise<BlogPost[]> => {
    return fetchApi<BlogPost[]>('/articles/');
  },
  getPost: async (slug: string): Promise<BlogPost> => {
    return fetchApi<BlogPost>(`/articles/${slug}/`);
  },
  createPost: async (payload: CreateBlogPostPayload): Promise<BlogPost> => {
    return fetchApi<BlogPost>('/articles/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

export const forumService = {
  getTopics: async (): Promise<ForumTopic[]> => {
    return fetchApi<ForumTopic[]>('/topics/');
  },
  getTopic: async (topicId: string): Promise<ForumTopic> => {
    return fetchApi<ForumTopic>(`/topics/${topicId}/`);
  },
  createTopic: async (payload: { title: string; description: string }): Promise<ForumTopic> => {
    return fetchApi<ForumTopic>('/topics/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  getPosts: async (topicId: string): Promise<ForumReply[]> => {
    return fetchApi<ForumReply[]>(`/topics/${topicId}/posts/`);
  },
  createPost: async (topicId: string, payload: { content: string }): Promise<ForumReply> => {
    return fetchApi<ForumReply>(`/topics/${topicId}/posts/`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  subscribeTopic: async (topicId: string): Promise<{ detail: string }> => {
    return fetchApi<{ detail: string }>(`/topics/${topicId}/subscribe/`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },
  unsubscribeTopic: async (topicId: string): Promise<{ detail: string }> => {
    return fetchApi<{ detail: string }>(`/topics/${topicId}/unsubscribe/`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },
  getNotifications: async (): Promise<ForumNotification[]> => {
    return fetchApi<ForumNotification[]>('/forum/notifications/');
  },
  markNotificationRead: async (notificationId: string): Promise<ForumNotification> => {
    return fetchApi<ForumNotification>(`/forum/notifications/${notificationId}/read/`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },
};

export const marketplaceService = {
  getAds: async (): Promise<MarketplaceAd[]> => {
    return fetchApi<MarketplaceAd[]>('/listings/');
  },
  createAd: async (payload: {
    title: string;
    description: string;
    category: 'Отдам даром' | 'Обмен' | 'Ищу';
    location?: string;
    imageUrl?: string;
  }): Promise<MarketplaceAd> => {
    return fetchApi<MarketplaceAd>('/listings/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  getAd: async (listingId: string): Promise<MarketplaceAd> => {
    return fetchApi<MarketplaceAd>(`/listings/${listingId}/`);
  },
  updateAd: async (
    listingId: string,
    payload: Partial<{
      title: string;
      description: string;
      category: 'Отдам даром' | 'Обмен' | 'Ищу';
      location: string;
      imageUrl: string;
      isActive: boolean;
    }>
  ): Promise<MarketplaceAd> => {
    return fetchApi<MarketplaceAd>(`/listings/${listingId}/`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
  deleteAd: async (listingId: string): Promise<void> => {
    await fetchApi(`/listings/${listingId}/`, {
      method: 'DELETE',
    });
  },
};

export const mapService = {
  getLocations: async (): Promise<MapLocation[]> => {
    return fetchApi<MapLocation[]>('/map/');
  },
  createLocation: async (payload: {
    title: string;
    description?: string;
    lat: number;
    lng: number;
    type: 'Точка обмена' | 'Городской сад';
  }): Promise<MapLocation> => {
    return fetchApi<MapLocation>('/map/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

export const diaryService = {
  getPlants: async (): Promise<DiaryPlant[]> => {
    return fetchApi<DiaryPlant[]>('/diary/');
  },
  createPlant: async (payload: { name: string; description?: string }): Promise<DiaryPlant> => {
    return fetchApi<DiaryPlant>('/diary/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  getPlant: async (plantId: string): Promise<DiaryPlantDetail> => {
    return fetchApi<DiaryPlantDetail>(`/diary/${plantId}/`);
  },
  addEntry: async (
    plantId: string,
    payload: { date?: string; text: string; imageUrl?: string }
  ): Promise<DiaryPlantEntry> => {
    return fetchApi<DiaryPlantEntry>(`/diary/${plantId}/entries/`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

export const messageService = {
  getDialogs: async (): Promise<Dialog[]> => {
    return fetchApi<Dialog[]>('/messages/');
  },
  getUsers: async (): Promise<User[]> => {
    return fetchApi<User[]>('/users/');
  },
  getMessages: async (userId: string): Promise<Message[]> => {
    return fetchApi<Message[]>(`/messages/${userId}/`);
  },
  sendMessage: async (userId: string, payload: { content: string }): Promise<Message> => {
    return fetchApi<Message>(`/messages/${userId}/`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

export const exchangeService = {
  getExchanges: async (): Promise<TradeExchange[]> => {
    return fetchApi<TradeExchange[]>('/exchanges/');
  },
  createExchange: async (payload: {
    counterpartyId: string;
    itemsFromInitiator: string;
    itemsFromCounterparty: string;
  }): Promise<TradeExchange> => {
    return fetchApi<TradeExchange>('/exchanges/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  confirmExchange: async (exchangeId: string): Promise<TradeExchange> => {
    return fetchApi<TradeExchange>(`/exchanges/${exchangeId}/confirm/`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },
  getReviews: async (exchangeId: string): Promise<TradeReview[]> => {
    return fetchApi<TradeReview[]>(`/exchanges/${exchangeId}/reviews/`);
  },
  createReview: async (
    exchangeId: string,
    payload: { targetId: string; rating: number; comment?: string }
  ): Promise<TradeReview> => {
    return fetchApi<TradeReview>(`/exchanges/${exchangeId}/reviews/`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

export const clubService = {
  getClubs: async (): Promise<Club[]> => {
    return fetchApi<Club[]>('/clubs/');
  },
  createClub: async (payload: { name: string; description?: string }): Promise<Club> => {
    return fetchApi<Club>('/clubs/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  getClub: async (clubId: string): Promise<ClubDetail> => {
    return fetchApi<ClubDetail>(`/clubs/${clubId}/`);
  },
  joinClub: async (clubId: string): Promise<ClubDetail> => {
    return fetchApi<ClubDetail>(`/clubs/${clubId}/join/`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },
  leaveClub: async (clubId: string): Promise<ClubDetail> => {
    return fetchApi<ClubDetail>(`/clubs/${clubId}/leave/`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },
};


