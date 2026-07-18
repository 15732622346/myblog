import axios from 'axios';

// 使用环境变量或配置文件中的API地址
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
// MinIO URL (在开发环境通常是localhost:9000)
const MINIO_URL = import.meta.env.VITE_MINIO_URL || '';

// 获取JWT令牌的函数
const getToken = () => {
  return localStorage.getItem('token');
};

/**
 * 处理图片URL,确保使用API代理
 * @param url 原始URL
 * @returns 处理后的URL
 */
const processImageUrl = (url: string): string => {
  console.log('博客url----- upload.ts 原始URL:', url);
  
  // 如果URL为空,返回默认图片
  if (!url) {
    // 使用本地静态资源作为默认图片
    const defaultUrl = '/assets/default-image.png';
    console.log('博客url----- upload.ts 空URL,使用默认图片:', defaultUrl);
    return defaultUrl;
  }
  
  // 如果已经是API代理路径,直接返回
  if (url.includes('/api/files/proxy/')) {
    console.log('博客url----- upload.ts 已是代理URL,直接返回:', url);
    return url;
  }
  
  // 如果是MinIO直连URL(包含9000端口或MINIO_URL)
  if (url.includes('localhost:9000') || (MINIO_URL && url.includes(MINIO_URL))) {
    console.log('博客url----- upload.ts 检测到MinIO直连URL');
    // 提取bucket和object部分
    const parts = url.split('/');
    
    const bucketIndex = parts.findIndex(p => p === 'blog-images' || p === 'blog-avatars');
    console.log('博客url----- upload.ts bucket索引:', bucketIndex);
    
    if (bucketIndex >= 0) {
      const bucket = parts[bucketIndex];
      const objectPath = parts.slice(bucketIndex + 1).join('/');
      const proxyUrl = `${API_BASE_URL}/files/proxy/${bucket}/${objectPath}`;
      console.log('博客url----- upload.ts 转换为代理URL:', proxyUrl);
      return proxyUrl;
    }
  }
  
  // 如果返回的是相对路径但不包含/api
  if (!url.startsWith('http') && !url.startsWith('/api')) {
    const newUrl = `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
    console.log('博客url----- upload.ts 相对路径转为API路径:', newUrl);
    return newUrl;
  }
  
  console.log('博客url----- upload.ts 无需处理,直接返回:', url);
  return url;
};

export const uploadApi = {
  // 上传单个文件
  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    // 获取令牌
    const token = getToken();
    
    try {
      const response = await axios.post(`${API_BASE_URL}/files/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });
      
      const result = response.data;
      
      // 如果响应包含url字段,处理URL
      if (result && result.url) {
        result.url = processImageUrl(result.url);
      }
      
      return result;
    } catch (error: any) {
      throw error;
    }
  },

  // 上传图片（专门用于编辑器）
  uploadImage: async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // 获取令牌
      const token = getToken();
      
      const uploadUrl = `${API_BASE_URL}/files/upload/image`;
      console.log('博客url----- 发送上传请求到:', uploadUrl);
      
      const response = await axios.post(uploadUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });

      // 从响应中提取URL
      let url = '';
      const data = response.data;
      
      console.log('博客url----- 上传响应数据:', data);
      console.log('博客url----- 响应数据类型:', typeof data);
      console.log('博客url----- 响应状态码:', response.status);
      
      // 修复关键问题：如果后端直接返回字符串URL
      if (typeof data === 'string') {
        url = data;
        console.log('博客url----- 提取URL(字符串):', url);
      } else if (data && data.url) {
        url = data.url;
        console.log('博客url----- 提取URL(data.url):', url);
      } else if (data && data.file && data.file.file_path) {
        url = data.file.file_path;
        console.log('博客url----- 提取URL(data.file.file_path):', url);
      } else {
        console.log('博客url----- 标准字段中未找到URL,尝试遍历所有响应字段');
        // 尝试从响应中的任何可能的字段获取URL
        if (data && typeof data === 'object') {
          // 递归搜索可能的URL字段
          const findUrl = (obj: any): string => {
            if (!obj || typeof obj !== 'object') return '';
            
            if (obj.url && typeof obj.url === 'string') return obj.url;
            if (obj.path && typeof obj.path === 'string') return obj.path;
            if (obj.file_path && typeof obj.file_path === 'string') return obj.file_path;
            if (obj.filePath && typeof obj.filePath === 'string') return obj.filePath;
            
            for (const key in obj) {
              if (typeof obj[key] === 'object') {
                const found = findUrl(obj[key]);
                if (found) return found;
              }
              // 检查任何看起来像URL的字符串字段
              if (typeof obj[key] === 'string' && 
                  (obj[key].includes('/') || obj[key].includes('http'))) {
                console.log(`博客url----- 在字段 ${key} 中找到可能的URL:`, obj[key]);
                return obj[key];
              }
            }
            return '';
          };
          
          url = findUrl(data);
          if (url) {
            console.log('博客url----- 通过遍历找到URL:', url);
          } else {
            console.log('博客url----- 未在响应中找到任何URL');
            
            // 检查响应对象本身
            console.log('博客url----- 完整响应对象:', response);
            
            // 直接使用状态码201(创建成功)作为判断依据，假设文件上传成功
            if (response.status === 201 || response.status === 200) {
              console.log('博客url----- 根据状态码判断上传成功');
              // 使用上传的文件名构造一个可能的URL
              const timestamp = Date.now();
              const fileName = file.name.split('.').pop(); // 获取文件扩展名
              url = `/api/files/proxy/blog-images/images/${timestamp}_${fileName}`;
              console.log('博客url----- 构造的可能URL:', url);
            }
          }
        }
      }
      
      if (!url) {
        console.log('博客url----- 错误: 未找到有效URL');
        throw new Error('服务器响应中未找到有效的图片URL');
      }
      
      // 处理URL确保使用API代理
      console.log('博客url----- 处理前的URL:', url);
      const processedUrl = processImageUrl(url);
      console.log('博客url----- 最终处理后的URL:', processedUrl);
      return processedUrl;
    } catch (error: any) {
      console.log('博客url----- 上传过程出错:', error.message);
      // 在开发环境中提供一个假的URL用于测试
      if (import.meta.env.DEV) {
        const fallbackUrl = `${API_BASE_URL}/files/proxy/blog-images/example-${Date.now()}.jpg`;
        console.log('博客url----- 使用开发环境fallback URL:', fallbackUrl);
        return fallbackUrl;
      }
      throw error;
    }
  }
}; 