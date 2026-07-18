import { httpClient } from '../utils/http-client';
import { getApiUrl } from '../utils/env';

// 定义留言消息类型
export interface GuestbookMessage {
  id: number;
  content: string;
  visitor_name: string;
  user_id: number;
  created_at: string;
  updated_at: string;
}

// 新增：定义后端返回的包含分页信息的类型
export interface GuestbookPaginatedResponse {
  data: GuestbookMessage[];
  total: number;
}

// 获取API地址，如果没有则使用默认值
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// 留言相关API服务
export const guestbookApi = {
  // 获取指定用户的留言列表
  getGuestbookMessages: async (username: string, page: number = 1, limit: number = 10): Promise<GuestbookPaginatedResponse> => {
    try {
      // 手动构建带有查询参数的 URL 字符串
      const url = `/guestbook/${username}?page=${page}&limit=${limit}`;
      console.log("Manually constructed URL:", url); // 添加日志确认 URL
      // 调用 httpClient.get 时不再传递 params 对象
      const response = await httpClient.get<GuestbookPaginatedResponse>(url);
      // 返回包含 data 和 total 的对象
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // 提交留言
  createGuestbookMessage: async (username: string, content: string) => {
    try {
      // 路径不需要包含/api前缀,因为httpClient已经配置了baseURL
      const response = await httpClient.post(`/guestbook/${username}`, { 
        content,
        // visitor_name字段由后端根据请求IP设置
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }
}; 