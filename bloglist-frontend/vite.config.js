/// <reference types="node" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
// https://vitejs.dev/config/
export default defineConfig(function (_a) {
    var _b;
    var mode = _a.mode;
    // 加载环境变量
    var env = loadEnv(mode, process.cwd());
    var isProd = mode === 'production';
    console.log("\u6784\u5EFA\u6A21\u5F0F: ".concat(mode, ", \u751F\u4EA7\u73AF\u5883: ").concat(isProd));
    console.log("\u4F7F\u7528\u7684\u73AF\u5883\u53D8\u91CF\u6587\u4EF6: .env.".concat(mode));
    console.log("API\u5730\u5740: ".concat(env.VITE_API_URL));
    return {
        plugins: [react()],
        resolve: {
            alias: {
                '@': resolve(__dirname, 'src')
            }
        },
        server: {
            port: parseInt(env.VITE_PORT || '5173'),
            proxy: {
                '/api': {
                    target: ((_b = env.VITE_API_URL) === null || _b === void 0 ? void 0 : _b.replace('/api', '')) || 'http://localhost:3000',
                    changeOrigin: true
                }
            },
            host: '0.0.0.0',


        },
        build: {
            outDir: 'dist',
            sourcemap: !isProd,
            minify: isProd,
            assetsDir: mode,
            rollupOptions: {
                output: {
                    manualChunks: {
                        'react-vendor': ['react', 'react-dom', 'react-router-dom'],
                        'ui-vendor': ['antd', '@ant-design/icons'],
                        'markdown': ['markdown-it', 'marked']
                    }
                }
            }
        }
    };
});
