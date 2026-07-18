import axios from 'axios';
import { message } from 'antd';

const request = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
});

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    // 开发环境显示详细日志，生产环境只显示关键信息
    const isDev = import.meta.env.VITE_NODE_ENV === 'development';
    
    if (isDev) {
      console.log('请求:', config.method?.toUpperCase(), config.url);
    }
    
    if (token) {
      // 检查token是否过期（仅在开发环境显示详细信息）
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const isExpired = Date.now() > payload.exp * 1000;
        
        if (isExpired) {
          console.warn('Token已过期');
          localStorage.removeItem('token');
          window.location.href = '/';
          return Promise.reject(new Error('Token已过期'));
        }
        
        if (isDev) {
          console.log('Token有效，用户:', payload.username);
        }
      } catch (err) {
        console.error('Token格式错误:', err);
        localStorage.removeItem('token');
      }
      
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('请求配置错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const isDev = import.meta.env.VITE_NODE_ENV === 'development';
    if (isDev) {
      console.log('响应成功:', response.config.url, response.status);
    }
    return response;
  },
  (error) => {
    const isDev = import.meta.env.VITE_NODE_ENV === 'development';
    
    if (error.response) {
      const { status, data, config } = error.response;
      
      if (isDev) {
        console.error(`响应错误 ${status}:`, config.url, data);
      }
      
      // 检查是否在登录页面
      const isLoginPage = window.location.pathname === '/' || window.location.pathname === '/login';
      
      switch (status) {
        case 401:
          if (!isLoginPage) {
            message.error('登录已过期，请重新登录');
            localStorage.removeItem('token');
            window.location.href = '/';
          }
          break;
        case 403:
          message.error('没有权限访问该资源');
          break;
        case 404:
          message.error('请求的资源不存在');
          break;
        case 500:
          message.error('服务器内部错误');
          break;
        default:
          message.error(data?.message || `请求失败 (${status})`);
      }
    } else if (error.request) {
      message.error('网络连接失败，请检查网络设置');
    } else {
      message.error('请求配置错误：' + error.message);
    }
    
    return Promise.reject(error);
  }
);

export default request; 