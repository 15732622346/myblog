/// <reference types="node" />
const { defineConfig, loadEnv } = require('vite');
const react = require('@vitejs/plugin-react');
const { resolve } = require('path');
// https://vitejs.dev/config/
module.exports = defineConfig(({ mode }) => {
    // 加载环境变量
    const env = loadEnv(mode, process.cwd());
    const isProd = mode === 'production';
    console.log(`构建模式: ${mode}, 生产环境: ${isProd}`);
    console.log(`使用的环境变量文件: .env.${mode}`);
    console.log(`API地址: ${env.VITE_API_URL}`);
    return {
        plugins: [react()],
        server: {
            port: 5714, // 强制使用5714端口
            strictPort: true, // 端口被占用时,不自动尝试下一个可用端口,而是直接抛出错误
            proxy: {
                '/api': {
                    target: env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000',
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
