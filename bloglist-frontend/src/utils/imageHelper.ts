import { getApiUrl } from './env';

/**
 * 修复图片URL,防止重复拼接域名
 * 处理类似http://localhost:5713http://localhost:3000/api/files/proxy/的情况
 */
export function fixImageUrl(url: string): string {
  if (!url) return url;
  
  let fixedUrl = url;
  
  // 移除URL中的undefined前缀
  if (fixedUrl.includes('undefined/')) {
    fixedUrl = fixedUrl.replace('undefined/', '');
  }
  
  // 如果URL中包含重复的http://或https://,表明有拼接错误
  if (/(https?:\/\/.*?)(https?:\/\/)/.test(fixedUrl)) {
    // 查找第二个http://或https://的位置
    const match = fixedUrl.match(/(https?:\/\/.*?)(https?:\/\/)/);
    if (match && match[2]) {
      const secondProtocolPos = fixedUrl.indexOf(match[2], match[1].length);
      if (secondProtocolPos > 0) {
        // 只保留从第二个http://或https://开始的部分
        fixedUrl = fixedUrl.substring(secondProtocolPos);
      }
    }
  }
  
  // 如果是API代理路径且不包含域名,添加当前域名
  if (fixedUrl.startsWith('/api/files/proxy/')) {
    fixedUrl = `${window.location.origin}${fixedUrl}`;
  }
  
  return fixedUrl;
}

/**
 * 处理文章内容中第一张图片URL
 * @param content Markdown内容
 * @returns 处理后的图片URL或null
 */
export function extractFirstImage(content: string): string | null {
  const matches = content.match(/!\[.*?\]\((.*?)\)/);
  if (!matches) {
    return null;
  }
  
  const originalUrl = matches[1];
  
  let processedUrl = originalUrl;
  
  // 检测URL重复问题并修复
  processedUrl = fixImageUrl(processedUrl);
  
  // 如果是相对路径且不是以/api开头,添加API基础URL
  if (!processedUrl.startsWith('http') && !processedUrl.startsWith('/api')) {
    const baseUrl = window.location.origin;
    const apiUrl = getApiUrl();
    processedUrl = `${baseUrl}${apiUrl}/${processedUrl}`;
  }
  
  return processedUrl;
}

/**
 * 注册图片加载事件处理
 * @param imageUrl 图片URL
 * @param imgElement 图片元素
 */
export function registerImageEventHandlers(imgElement: HTMLImageElement, imageUrl: string): void {
  imgElement.onload = () => {
    // 图片加载成功处理
  };
  
  imgElement.onerror = (e) => {
    // 图片加载失败处理
  };
} 
 