import { httpClient } from '../utils/http-client';

// 响应拦截器 - 处理常见错误
httpClient.interceptors.response.use(
  response => response,
  error => {
    // 后端服务未启动或网络问题
    if (!error.response) {
      console.error('网络错误或后端服务未启动');
      error.userMessage = '无法连接到服务器，请检查网络或等待服务恢复';
    } 
    // 后端返回的错误
    else {
      switch (error.response.status) {
        case 404:
          // 资源不存在
          console.error('请求的资源不存在:', error.config.url);
          error.userMessage = '请求的资源不存在';
          break;
        case 500:
          console.error('服务器内部错误');
          error.userMessage = '服务器内部错误，请稍后再试';
          break;
        default:
          console.error(`请求错误 ${error.response.status}:`, error.response.data);
          error.userMessage = '请求发生错误，请稍后再试';
      }
    }
    return Promise.reject(error);
  }
);

// 用户相关API服务
export const userApi = {
  // 根据用户名获取用户信息
  getUserByUsername: async (username: string) => {
    try {
      const response = await httpClient.get(`/users/by-username/${username}`);
      return response.data;
    } catch (error: any) {
      console.error(`获取用户 ${username} 信息失败:`, error);
      throw error;
    }
  }
};

// 文章相关API服务
export const postsApi = {
  // 获取某个用户的公开文章
  getPostsByUsername: async (username: string, page = 1, limit = 10) => {
    try {
      const response = await httpClient.get(`/posts/public/by-username/${username}`, {
        params: { page, limit }
      });
      return response.data;
    } catch (error: any) {
      console.error(`获取用户 ${username} 的文章失败:`, error);
      throw error;
    }
  },
  
  // 获取文章详情
  getPostById: async (id: number) => {
    try {
      const response = await httpClient.get(`/posts/public/${id}`);
      return response.data;
    } catch (error: any) {
      console.error(`获取文章 ${id} 失败:`, error);
      throw error;
    }
  }
};

export default httpClient;
