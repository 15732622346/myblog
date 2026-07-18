import axios from 'axios';
import { getApiUrl, getAdminUrl } from './env';

// 创建axios实例
const instance = axios.create({
  baseURL: getApiUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
instance.interceptors.request.use(
  (config) => {
    // 从 localStorage 获取 token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
instance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // token 过期或无效，清除本地存储的 token
      localStorage.removeItem('token');
      // 可以在这里添加重定向到登录页面的逻辑
      window.location.href = getAdminUrl();
    }
    return Promise.reject(error);
  }
);

// 封装HTTP请求方法
export const httpClient = {
  get: <T>(url: string, params?: any) => {
    return instance.get<T>(url, { params });
  },
  
  post: <T>(url: string, data?: any) => {
    return instance.post<T>(url, data);
  },
  
  put: <T>(url: string, data?: any) => {
    return instance.put<T>(url, data);
  },
  
  patch: <T>(url: string, data?: any) => {
    return instance.patch<T>(url, data);
  },
  
  delete: <T>(url: string) => {
    return instance.delete<T>(url);
  },
};