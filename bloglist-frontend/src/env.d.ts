/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NODE_ENV: string;
  readonly VITE_API_URL: string;
  readonly VITE_ADMIN_URL: string;
  readonly VITE_BASE_URL: string;
  readonly VITE_MINIO_URL: string;
  readonly VITE_PORT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// 为容器化部署定义的运行时环境变量
interface Window {
  env?: {
    VITE_API_URL?: string;
    VITE_ADMIN_URL?: string;
    VITE_BASE_URL?: string;
    VITE_MINIO_URL?: string;
  };
} 