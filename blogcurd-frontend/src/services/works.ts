import { httpClient } from '../utils/http-client';

export interface WorkData {
  id?: number;
  title?: string;
  content?: string;
  description?: string;
  cover_url?: string;
  demo_url?: string;
  github_url?: string;
  link?: string;
  tech_stack?: string[];
  status?: 'draft' | 'published' | 'archived';
  is_featured?: boolean;
  user_id?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateWorkData {
  title: string;
  content?: string;
  description?: string;
  cover_url?: string;
  demo_url?: string;
  github_url?: string;
  link?: string;
  tech_stack?: string[];
  status?: 'draft' | 'published' | 'archived';
  is_featured?: boolean;
}

export interface UpdateWorkData {
  title?: string;
  content?: string;
  description?: string;
  cover_url?: string;
  demo_url?: string;
  github_url?: string;
  link?: string;
  tech_stack?: string[];
  status?: 'draft' | 'published' | 'archived';
  is_featured?: boolean;
}

export const worksApi = {
  // 获取当前用户的所有作品
  getMyWorks: async () => {
    return httpClient.get('/works/my');
  },
  // 创建作品
  createWork: async (data: CreateWorkData) => {
    return httpClient.post('/works', data);
  },
  // 更新作品
  updateWork: async (id: number, data: UpdateWorkData) => {
    return httpClient.patch(`/works/${id}`, data);
  },
  // 删除作品
  deleteWork: async (id: number) => {
    return httpClient.delete(`/works/${id}`);
  },
  // 获取指定用户的作品（前台展示用）
  getWorksByUsername: async (username: string) => {
    return httpClient.get(`/works/by-username/${username}`);
  },
  // 获取作品详情
  getWorkById: async (id: number) => {
    return httpClient.get(`/works/${id}`);
  },
};
