import request from '../utils/request';

export interface Post {
  id: number;
  title: string;
  content: string;
  status: 'draft' | 'published' | 'private';
  is_pinned: boolean;
  view_count: number;
  like_count: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  categories?: {
    id: number;
    name: string;
  }[];
}

export interface CreatePostDto {
  title: string;
  content: string;
  status: 'draft' | 'published' | 'private';
  is_pinned?: boolean;
  category_ids?: number[];
}

export interface PostsQueryParams {
  keyword?: string;
  startTime?: string;
  endTime?: string;
  categoryId?: number;
}

export const postsApi = {
  // 获取文章列表
  getPosts: async (params?: PostsQueryParams) => {
    console.log('开始获取文章列表，参数:', params);
    try {
      const response = await request.get<Post[]>('/posts', { params });
      console.log('获取文章列表成功:', response.data);
      return response.data;
    } catch (error) {
      console.error('获取文章列表失败:', error);
      throw error;
    }
  },

  // 创建文章
  createPost: async (data: CreatePostDto) => {
    console.log('开始创建文章：', data);
    try {
      const response = await request.post<Post>('/posts', data);
      console.log('创建文章成功:', response.data);
      return response.data;
    } catch (error) {
      console.error('创建文章失败:', error);
      throw error;
    }
  },

  // 更新文章
  updatePost: async (id: number, data: CreatePostDto) => {
    console.log('开始更新文章：', { id, data });
    try {
      const response = await request.patch<Post>(`/posts/${id}`, data);
      console.log('更新文章成功:', response.data);
      return response.data;
    } catch (error) {
      console.error('更新文章失败:', error);
      throw error;
    }
  },

  // 删除文章
  deletePost: async (id: number) => {
    console.log('开始删除文章：', id);
    try {
      await request.delete(`/posts/${id}`);
      console.log('删除文章成功');
    } catch (error) {
      console.error('删除文章失败:', error);
      throw error;
    }
  },

  // 获取文章详情
  getPost: async (id: number) => {
    console.log('开始获取文章详情：', id);
    try {
      const response = await request.get<Post>(`/posts/${id}`);
      console.log('获取文章详情成功:', response.data);
      return response.data;
    } catch (error) {
      console.error('获取文章详情失败:', error);
      throw error;
    }
  },
}; 
