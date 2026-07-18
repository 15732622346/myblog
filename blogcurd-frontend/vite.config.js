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
        server: {
            port: 5714, // 强制使用5714端口
            strictPort: true, // 端口被占用时,不自动尝试下一个可用端口,而是直接抛出错误
            proxy: {
                '/api': {
                    target: ((_b = env.VITE_API_URL) === null || _b === void 0 ? void 0 : _b.replace('/api', '')) || 'http://localhost:3000',
                    changeOrigin: true,
                },
            },
        },
        build: {
            outDir: isProd ? 'dist' : 'dist-dev',
            sourcemap: !isProd,
            minify: isProd,
            // 如果需要分离环境配置，可以设置不同的资源目录
            assetsDir: mode,
        },
        resolve: {
            alias: {
                '@': resolve(__dirname, 'src')
            }
        }
    };
});
