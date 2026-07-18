/**
 * 全局配置文件
 */

// API基础URL
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// MinIO配置
export const MINIO_URL = import.meta.env.VITE_MINIO_URL || 'localhost:9000';

// 图片相关配置
export const IMAGE_CONFIG = {
  // 默认图片大小限制 (2MB)
  MAX_SIZE: 2 * 1024 * 1024,
  
  // 允许的图片类型
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  
  // 存储桶配置
  BUCKETS: {
    IMAGES: 'blog-images',
    AVATARS: 'blog-avatars'
  },
  
  // 默认图片 - 使用本地资源
  DEFAULT_IMAGE: '/assets/default-image.png'
}; 