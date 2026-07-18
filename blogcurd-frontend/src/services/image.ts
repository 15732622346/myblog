import request from '../utils/request';
import { API_BASE_URL, MINIO_URL, IMAGE_CONFIG } from '../config';
import { message } from 'antd';

export interface ImageUploadResponse {
  url: string;
  file_path?: string;
  original_name?: string;
  mime_type?: string;
  size?: number;
}

export interface ImageServiceConfig {
  maxSize?: number;        // 最大文件大小(bytes)
  allowedTypes?: string[]; // 允许的文件类型
  bucket?: string;         // 存储桶(blog-images/blog-avatars)
}

export class ImageService {
  private static instance: ImageService;
  private defaultConfig: ImageServiceConfig = {
    maxSize: IMAGE_CONFIG.MAX_SIZE,
    allowedTypes: IMAGE_CONFIG.ALLOWED_TYPES,
    bucket: IMAGE_CONFIG.BUCKETS.IMAGES
  };

  private constructor() {}

  public static getInstance(): ImageService {
    if (!ImageService.instance) {
      ImageService.instance = new ImageService();
    }
    return ImageService.instance;
  }

  /**
   * 上传图片
   * @param file 文件对象
   * @param config 上传配置
   */
  public async upload(file: File, config?: Partial<ImageServiceConfig>): Promise<ImageUploadResponse> {
    const mergedConfig = { ...this.defaultConfig, ...config };

    // 文件验证
    try {
      this.validateFile(file, mergedConfig);
    } catch (error: any) {
      message.error(error.message);
      throw error;
    }

    const formData = new FormData();
    formData.append('file', file);
    
    if (mergedConfig.bucket) {
      formData.append('bucket', mergedConfig.bucket);
    }

    try {
      const response = await request.post<ImageUploadResponse>('/files/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // 处理返回的URL
      const processedUrl = this.processImageUrl(response.data.url || response.data.file_path || '');
      
      const result = {
        ...response.data,
        url: processedUrl
      };

      return result;
    } catch (error: any) {
      message.error('图片上传失败: ' + (error.message || '未知错误'));
      throw error;
    }
  }

  /**
   * 处理图片URL
   * @param url 原始URL
   */
  public processImageUrl(url: string): string {
    console.log('博客url----- 原始URL:', url);
    
    // 防止崩溃：检查URL是否存在
    if (!url || url.trim() === '') {
      // 使用本地静态资源作为默认图片
      const defaultUrl = '/assets/default-image.png';
      console.log('博客url----- 使用默认图片URL:', defaultUrl);
      return defaultUrl;
    }

    // 已经是代理URL
    if (url.includes('/api/files/proxy/')) {
      console.log('博客url----- 已是代理URL,直接返回:', url);
      return url;
    }

    // MinIO直连URL转换为代理URL
    if (url.includes('localhost:9000') || (MINIO_URL && url.includes(MINIO_URL))) {
      console.log('博客url----- 检测到MinIO直连URL');
      const parts = url.split('/');
      const bucketIndex = parts.findIndex(p => 
        p === IMAGE_CONFIG.BUCKETS.IMAGES || 
        p === IMAGE_CONFIG.BUCKETS.AVATARS
      );
      
      if (bucketIndex >= 0) {
        const bucket = parts[bucketIndex];
        const objectPath = parts.slice(bucketIndex + 1).join('/');
        const proxyUrl = `${API_BASE_URL}/files/proxy/${bucket}/${objectPath}`;
        console.log('博客url----- 转换为代理URL:', proxyUrl);
        return proxyUrl;
      }
    }

    // 相对路径转换为完整URL
    if (!url.startsWith('http') && !url.startsWith('/api')) {
      const fullUrl = `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
      console.log('博客url----- 相对路径转换为完整URL:', fullUrl);
      return fullUrl;
    }

    console.log('博客url----- 无需处理,直接返回:', url);
    return url;
  }

  /**
   * 验证文件
   * @public 修改为public以便外部调用验证
   */
  public validateFile(file: File, config: ImageServiceConfig): void {
    if (config.maxSize && file.size > config.maxSize) {
      const maxSizeMB = config.maxSize / 1024 / 1024;
      const errorMsg = `文件大小不能超过 ${maxSizeMB}MB`;
      throw new Error(errorMsg);
    }

    if (config.allowedTypes && !config.allowedTypes.includes(file.type)) {
      const errorMsg = `只支持 ${config.allowedTypes.join(', ')} 格式的文件`;
      throw new Error(errorMsg);
    }
  }
}

// 导出单例实例
export const imageService = ImageService.getInstance(); 