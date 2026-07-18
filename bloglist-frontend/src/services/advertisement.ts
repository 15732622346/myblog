import { httpClient } from '../utils/http-client';

interface Advertisement {
  id: number;
  content: string;
  created_at: string;
  updated_at: string;
}

export const advertisementApi = {
  // 根据用户名获取广告
  getAdvertisementByUsername: async (username: string): Promise<Advertisement | null> => {
    try {
      const response = await httpClient.get<Advertisement>(`/advertisements/by-username/${username}`);
      return response.data;
    } catch (error) {
      console.error('获取广告失败:', error);
      return null;
    }
  }
}; 