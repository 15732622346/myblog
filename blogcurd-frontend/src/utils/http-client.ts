import axios from 'axios';
import { message } from 'antd';

// 创建axios实例
const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
instance.interceptors.request.use(
  (config) => {
    // 更详细的请求日志
    console.log('%c 发送请求 %c ' + config.method?.toUpperCase() + ' %c ' + config.url, 
      'background:#35495e ; padding: 1px; border-radius: 3px 0 0 3px; color: #fff',
      'background:#41b883 ; padding: 1px; color: #fff',
      'background:#409EFF ; padding: 1px; border-radius: 0 3px 3px 0; color: #fff'
    );
    console.log('请求完整URL:', config.baseURL + config.url);
    console.log('请求参数(Query):', config.params);
    console.log('请求头:', config.headers);
    
    // 打印请求体，但需要特殊处理FormData
    if (config.data) {
      if (config.data instanceof FormData) {
        console.log('请求体类型: FormData');
        const formDataEntries = {};
        config.data.forEach((value, key) => {
          if (value instanceof File) {
            formDataEntries[key] = `文件: ${value.name} (${value.size} 字节)`;
          } else if (value instanceof Blob) {
            formDataEntries[key] = `Blob数据 (${value.size} 字节)`;
          } else {
            formDataEntries[key] = value;
          }
        });
        console.log('FormData内容:', formDataEntries);
      } else {
        console.log('请求体:', config.data);
      }
    }
    
    // 从localStorage获取token
    const token = localStorage.getItem('token');
    if (token) {
      console.log('添加认证头: Bearer Token');
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn('未找到认证Token，请求可能会被拒绝');
    }
    return config;
  },
  (error) => {
    console.error('请求拦截器错误', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
instance.interceptors.response.use(
  (response) => {
    // 美化响应日志输出
    console.log('%c 收到响应 %c ' + response.config.method?.toUpperCase() + ' %c ' + response.config.url, 
      'background:#35495e ; padding: 1px; border-radius: 3px 0 0 3px; color: #fff',
      'background:#41b883 ; padding: 1px; color: #fff',
      'background:#409EFF ; padding: 1px; border-radius: 0 3px 3px 0; color: #fff'
    );
    console.log('响应状态:', response.status);
    console.log('响应头:', response.headers);
    console.log('响应数据:', response.data);

    // 统一处理响应格式 - 特殊处理files接口
    if (response.data && 
        !response.data.data && 
        !response.config.url?.includes('upload') &&
        !response.config.url?.includes('/files') &&
        !response.config.url?.includes('/files/')) {
      console.log('将响应数据包装到data字段中');
      response.data = {
        data: response.data
      };
    }
    return response;
  },
  (error) => {
    // 美化错误日志输出
    console.log('%c 请求失败 %c ' + error.config?.method?.toUpperCase() + ' %c ' + error.config?.url, 
      'background:#ff4949 ; padding: 1px; border-radius: 3px 0 0 3px; color: #fff',
      'background:#ff7e7e ; padding: 1px; color: #fff',
      'background:#ff9b9b ; padding: 1px; border-radius: 0 3px 3px 0; color: #fff'
    );
    
    console.error('请求错误详情:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data,
      message: error.message
    });

    if (error.response) {
      // 处理错误响应
      const { status, data } = error.response;
      
      if (status === 401) {
        // 未授权，清除token并跳转到登录页
        localStorage.removeItem('token');
        window.location.href = '/';
        message.error('登录已过期，请重新登录');
      } else if (status === 403) {
        message.error('没有权限执行此操作');
      } else if (status === 404) {
        message.error('请求的资源不存在');
      } else if (status === 400) {
        // 打印更详细的400错误信息
        console.error('请求参数错误:', data);
        message.error(data.message || '请求参数错误');
      } else {
        // 其他错误
        message.error(data.message || '请求失败');
      }
    } else {
      // 网络错误
      message.error('网络错误，请检查网络连接');
    }
    
    return Promise.reject(error);
  }
);

// 封装HTTP请求方法
export const httpClient = {
  get: <T>(url: string, params?: any) => {
    return instance.get<T>(url, { params }).then(res => res.data);
  },
  
  post: <T>(url: string, data?: any, config?: any) => {
    // 特殊处理文件上传请求
    if (data instanceof FormData) {
      console.log('检测到FormData上传请求');
      // 创建一个新的配置，合并用户提供的配置
      const uploadConfig = {
        ...config,
        headers: {
          ...config?.headers,
          // 上传文件时不设置Content-Type，让浏览器自动设置
          'Content-Type': undefined
        },
        // 确保不处理FormData
        transformRequest: [(data: any) => {
          console.log('uploadConfig中的transformRequest被调用', data instanceof FormData);
          return data;
        }]
      };
      console.log('上传配置:', {
        url: url,
        headers: uploadConfig.headers,
        method: 'POST'
      });
      
      // 检查FormData是否包含文件
      try {
        let hasFile = false;
        for (const pair of (data as FormData).entries()) {
          if ((typeof window !== 'undefined' && pair[1] instanceof window.File) || 
              (typeof Blob !== 'undefined' && pair[1] instanceof Blob)) {
            hasFile = true;
            break;
          }
        }
        
        if (!hasFile) {
          console.error('错误: FormData中不包含文件');
        }
      } catch (e) {
        console.error('验证FormData出错', e);
      }
      
      return instance.post<T>(url, data, uploadConfig)
        .then(res => {
          console.log('上传响应:', res.status, res.statusText);
          return res.data;
        })
        .catch(err => {
          console.error('上传错误完整信息:', err);
          throw err;
        });
    }
    
    return instance.post<T>(url, data, config).then(res => res.data);
  },
  
  put: <T>(url: string, data?: any) => {
    return instance.put<T>(url, data).then(res => res.data);
  },
  
  patch: <T>(url: string, data?: any) => {
    return instance.patch<T>(url, data).then(res => res.data);
  },
  
  delete: <T>(url: string) => {
    return instance.delete<T>(url).then(res => res.data);
  },
}; 
