/**
 * 获取环境变量,优先使用容器运行时注入的环境变量
 * 适用于不同部署方式:
 * 1. 开发环境: 使用.env文件
 * 2. 生产环境打包: 使用构建时的环境变量
 * 3. 容器化部署: 使用运行时注入的环境变量
 */

/**
 * 获取环境变量(支持容器运行时注入)
 * @param key 环境变量名称
 * @param fallback 默认值
 * @returns 环境变量值
 */
export function getEnv(key: string, fallback = ''): string {
  // 优先使用window.env中的运行时环境变量(容器部署时动态注入)
  if (window.env && window.env[key as keyof typeof window.env]) {
    return window.env[key as keyof typeof window.env] || fallback;
  }
  
  // 其次使用vite环境变量
  return import.meta.env[key as keyof ImportMetaEnv] || fallback;
}

/**
 * 获取当前环境类型
 * @returns 环境类型: development 或 production
 */
export function getNodeEnv(): string {
  return getEnv('VITE_NODE_ENV', 'development');
}

/**
 * 判断是否为开发环境
 * @returns 是否为开发环境
 */
export function isDevelopment(): boolean {
  return getNodeEnv() === 'development';
}

/**
 * 判断是否为生产环境
 * @returns 是否为生产环境
 */
export function isProduction(): boolean {
  return getNodeEnv() === 'production';
}

/**
 * 获取API基础URL
 */
export function getApiUrl(): string {
  return getEnv('VITE_API_URL', '/api');
}

/**
 * 获取管理后台URL
 * 从环境变量中获取管理后台的访问地址
 * 默认值为 http://localhost:5173
 * 开发环境和生产环境的配置在 .env.development 和 .env.production 中定义
 * 容器化部署时可以通过 window.env 动态注入
 * @returns 管理后台的完整访问URL
 */
export function getAdminUrl(): string {
  return getEnv('VITE_ADMIN_URL', 'http://localhost:5173');
}

/**
 * 获取前端基础URL
 */
export function getBaseUrl(): string {
  return getEnv('VITE_BASE_URL', window.location.origin);
}

/**
 * 获取MinIO存储URL
 */
export function getMinioUrl(): string {
  return getEnv('VITE_MINIO_URL', '/api/files/proxy');
}

/**
 * 获取服务端口
 */
export function getPort(): string {
  return getEnv('VITE_PORT', '5174');
}

/**
 * 修复图片URL,防止重复拼接域名
 * 处理类似http://localhost:5713http://localhost:3000/api/files/proxy/的情况
 */
export function fixImageUrl(url: string): string {
  if (!url) return url;
  
  // 如果URL中包含重复的http://或https://,表明有拼接错误
  if (/(https?:\/\/.*?)(https?:\/\/)/.test(url)) {
    // 查找第二个http://或https://的位置
    const match = url.match(/(https?:\/\/.*?)(https?:\/\/)/);
    if (match && match[2]) {
      const secondProtocolPos = url.indexOf(match[2], match[1].length);
      if (secondProtocolPos > 0) {
        // 只保留从第二个http://或https://开始的部分
        return url.substring(secondProtocolPos);
      }
    }
  }
  
  // 如果是API代理路径且不包含域名,添加当前域名
  if (url.startsWith('/api/files/proxy/')) {
    return `${window.location.origin}${url}`;
  }
  
  return url;
} 