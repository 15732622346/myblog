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
        resolve: {
            alias: {
                '@': resolve(__dirname, 'src')
            }
        },
        server: {
            port: parseInt(env.VITE_PORT || '5173'),
            proxy: {
                '/api': {
                    target: env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000',
                    changeOrigin: true
                }
            },
            host: '0.0.0.0',
            allowedHosts: [
                'ljtblog.natapp1.cc'
            ]
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
