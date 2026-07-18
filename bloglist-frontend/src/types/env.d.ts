/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NODE_ENV: string;
  readonly VITE_API_URL: string;
  readonly VITE_BASE_URL: string;
  readonly VITE_MINIO_URL: string;
  readonly VITE_PORT: string;
  readonly VITE_ADMIN_URL: string;
  // 更多环境变量...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// 为window.env添加类型声明
interface WindowEnv {
  VITE_NODE_ENV?: string;
  VITE_API_URL?: string;
  VITE_BASE_URL?: string;
  VITE_MINIO_URL?: string;
  VITE_PORT?: string;
  VITE_ADMIN_URL?: string;
  // 更多环境变量...
}

declare interface Window {
  env?: WindowEnv;
} 