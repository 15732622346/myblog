import { httpClient } from '../utils/http-client';

export interface Advertisement {
  id: number;
  user_id?: number;
  content: string;
  created_at: string;
  updated_at: string;
}

export const advertisementApi = {
  // 获取当前用户的广告
  getMyAdvertisement: async () => {
    try {
      const response = await httpClient.get<Advertisement>('/advertisements/my');
      console.log('广告API响应:', response);
      return response;
    } catch (error) {
      console.error('广告API错误:', error);
      throw error;
    }
  },

  // 根据用户名获取广告
  getAdvertisementByUsername: (username: string) => {
    return httpClient.get<Advertisement>(`/advertisements/by-username/${username}`);
  },

  // 创建广告
  createAdvertisement: (content: string) => {
    return httpClient.post<Advertisement>('/advertisements', { content });
  },

  // 更新广告
  updateAdvertisement: (content: string) => {
    return httpClient.patch<Advertisement>('/advertisements', { content });
  },

  // 删除广告
  deleteAdvertisement: (id: number) => {
    return httpClient.delete<void>(`/advertisements/${id}`);
  },
};