import { httpClient } from '../utils/http-client';

// 重命名接口，避免与全局File类型冲突
export interface FileItem {
  id: number;
  filename: string;
  original_name: string;
  file_path: string;
  mime_type: string;
  size: number;
  created_at: string;
  updated_at: string;
  path?: string; // 兼容性字段
}

export interface FileQueryParams {
  mime_type?: string;
  page?: number;
  limit?: number;
  search?: string;
}

export const filesApi = {
  // 获取用户的文件列表
  getFiles: (params?: FileQueryParams) => {
    console.log('调用getFiles API, 参数:', params);
    
    // 修改类型定义，使其与后端返回的结构完全匹配
    return httpClient.get<{
      items: FileItem[];
      meta: {
        total: number;
        page: number;
        limit: number;
        total_pages: number;
      };
    }>('/files', { params })
    .then(response => {
      console.log('getFiles API 响应:', response);
      // 后端直接返回了items和meta，不需要再从data中取
      return response;
    })
    .catch(error => {
      console.error('getFiles API 错误:', error);
      throw error;
    });
  },

  // 获取单个文件详情
  getFile: (id: number) => {
    return httpClient.get<FileItem>(`/files/${id}`);
  },

  // 更新文件信息
  updateFile: (id: number, data: Partial<FileItem>) => {
    return httpClient.patch<FileItem>(`/files/${id}`, data);
  },

  // 删除文件
  deleteFile: (id: number) => {
    return httpClient.delete(`/files/${id}`);
  },

  // 上传图片
  uploadImage: (formData: FormData) => {
    console.log('===== 调用uploadImage API =====');
    console.log('===== 上传图片到服务器 =====');
    
    // 检查formData内容
    console.log('FormData内容检查:');
    
    try {
      // 我们简化检查过程，避免使用instanceof，防止类型错误
      for (const pair of formData.entries()) {
        console.log('字段:', pair[0]);
        console.log('值类型:', typeof pair[1]);
        
        const value = pair[1];
        if (typeof value === 'object' && value !== null) {
          // 检查是否有File或Blob对象的特征
          if ('name' in value && 'size' in value && 'type' in value) {
            console.log('文件详情:', { 
              name: (value as any).name, 
              type: (value as any).type,
              size: (value as any).size
            });
          } else if ('size' in value && 'type' in value) {
            console.log('Blob详情:', { 
              size: (value as any).size,
              type: (value as any).type
            });
          } else {
            console.log('对象值:', value);
          }
        } else {
          console.log('值:', value);
        }
      }
    } catch (e) {
      console.error('检查FormData时出错', e);
    }
    
    // 直接不设置任何Content-Type，让浏览器自动设置boundary
    console.log('发送请求到 /files/upload/image');
    
    return httpClient.post<{ url?: string, file_path?: string, file?: { file_path: string } }>('/files/upload/image', formData, {
      headers: {
        // 重要：完全移除Content-Type，让浏览器自动处理multipart/form-data
        'Content-Type': undefined
      },
      // 下面的配置也很重要，确保axios不会处理数据
      transformRequest: [function (data: any) {
        console.log('transformRequest被调用, 数据类型:', typeof data);
        return data; // 返回原始数据，不做任何处理
      }]
    }).then(response => {
      console.log('===== 上传响应成功 =====');
      console.log('响应状态:', response.status);
      console.log('响应数据:', JSON.stringify(response.data, null, 2));
      
      // 提取并分析文件路径信息
      const data = response.data;
      let filePath = '';
      
      // 尝试从不同可能的字段中提取文件路径
      if (data && typeof data === 'object') {
        if (data.url) {
          filePath = data.url;
          console.log('从data.url获取文件路径:', filePath);
        } else if (data.file_path) {
          filePath = data.file_path;
          console.log('从data.file_path获取文件路径:', filePath);
        } else if (data.file && data.file.file_path) {
          filePath = data.file.file_path;
          console.log('从data.file.file_path获取文件路径:', filePath);
        } else {
          console.log('未找到标准文件路径字段,完整响应:', data);
          // 尝试遍历所有字段寻找可能的路径
          for (const key in data) {
            const value = data[key];
            if (typeof value === 'string' && (value.includes('/') || value.includes('http'))) {
              console.log(`可能的文件路径在字段 ${key}:`, value);
              filePath = value;
              break;
            } else if (typeof value === 'object' && value !== null) {
              for (const subKey in value) {
                const subValue = value[subKey];
                if (typeof subValue === 'string' && (subValue.includes('/') || subValue.includes('http'))) {
                  console.log(`可能的文件路径在嵌套字段 ${key}.${subKey}:`, subValue);
                  filePath = subValue;
                  break;
                }
              }
            }
          }
        }
      } else if (typeof data === 'string') {
        filePath = data;
        console.log('响应直接是字符串文件路径:', filePath);
      }
      
      if (filePath) {
        console.log('最终解析的文件路径:', filePath);
        console.log('文件路径类型:', typeof filePath);
        console.log('文件路径长度:', filePath.length);
        console.log('文件路径是否包含undefined:', filePath.includes('undefined'));
        console.log('文件路径是否以http开头:', filePath.startsWith('http'));
        console.log('文件路径是否包含API代理:', filePath.includes('/api/files/proxy/'));
        
        // 确保响应包含正确的文件路径
        if (typeof data === 'object') {
          // 标准化响应格式,确保存在file_path字段
          return {
            ...response,
            data: {
              ...data,
              file_path: filePath,
              // 如果没有原始file对象,创建一个包含file_path的对象
              file: data.file || { file_path: filePath }
            }
          };
        }
      } else {
        console.warn('未能从响应中提取有效的文件路径');
      }
      
      return response;
    }).catch(error => {
      console.error('===== 上传图片API错误 =====');
      console.error('错误对象:', error);
      
      if (error.response) {
        console.error('错误状态码:', error.response.status);
        console.error('错误数据:', error.response.data);
        console.error('响应头:', error.response.headers);
      }
      
      if (error.request) {
        console.error('请求已发送但无响应');
      }
      
      if (error.config) {
        console.error('请求配置:', {
          url: error.config.url,
          method: error.config.method,
          headers: error.config.headers
        });
      }
      
      throw error;
    });
  },
  
  // 上传文件（兼容性方法，内部调用uploadImage）
  uploadFile: (formData: FormData) => {
    console.log('调用uploadFile API');
    return filesApi.uploadImage(formData);
  },

  // 筛选图片格式的文件
  getImages: (params?: FileQueryParams) => {
    return filesApi.getFiles({
      mime_type: 'image/',
      ...params,
    });
  },
}; 