import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import React from 'react';
import { Card, Row, Col, Statistic } from 'antd';
import { FileTextOutlined, TagOutlined, UserOutlined, EyeOutlined } from '@ant-design/icons';
import { getAdminUrl, isDevelopment } from '../../utils/env';

interface Category {
  id: number;
  name: string;
}

interface User {
  id: number;
  username: string;
}

interface Post {
  id: number;
  title: string;
  content: string;
  status: string;
  is_pinned: boolean;
  view_count: number;
  like_count: number;
  created_at: string;
  updated_at: string;
  categories: Category[];
  user: User;
}

interface PostsResponse {
  items: Post[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  user: User;
}

const NoServerConnection = () => {
  // 使用配置文件或环境变量来存储后端启动路径
  const backendPath = isDevelopment()
    ? 'D:\\code\\personBlog\\blogcurd\\backend'
    : '<后端部署路径>';
  
  const startCommand = isDevelopment()
    ? 'npm run start:dev'
    : 'npm run start:prod';

  return (
    <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-6 border border-yellow-600/20 shadow-lg mb-10">
      <div className="flex flex-col sm:flex-row items-center">
        <div className="text-yellow-500 mr-6 mb-4 sm:mb-0">
          <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-bold text-yellow-500 mb-2">后端服务未启动</h3>
          <p className="text-gray-300 mb-3">无法连接到博客后端服务，请确保后端服务已启动。</p>
          <div className="bg-gray-900/60 p-3 rounded-lg border border-gray-700">
            <p className="text-gray-400 text-sm mb-2">启动命令：</p>
            <code className="block bg-black/50 px-3 py-2 rounded text-green-400 font-mono text-sm overflow-x-auto">
              cd {backendPath} && {startCommand}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
};

const HomePage = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  
  // 使用环境变量工具获取管理后台URL
  const ADMIN_URL = getAdminUrl();

  useEffect(() => {
    const fetchLatestPosts = async () => {
      try {
        setLoading(true);
        setServerError(false);
        // 获取一个示例用户的文章，你可以替换为实际的用户名
        const response = await api.get(`/posts/public/by-username/lijiangtao1`);
        const data: PostsResponse = response.data;
        setPosts(data.items);
        setUser(data.user);
      } catch (err: any) {
        console.error('Error fetching latest posts:', err);
        if (!err.response) {
          // 网络错误或后端未启动
          setServerError(true);
        } else {
          setError(err.userMessage || '加载数据失败，请稍后再试');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLatestPosts();
  }, []);

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleLineHeight = (text: string, maxLines: number = 3): string => {
    const lines = text.split("\n");
    if (lines.length > maxLines) {
      return lines.slice(0, maxLines).join("\n") + "...";
    }
    return text;
  };

  if (loading && !serverError) {
    return (
      <div className="container-custom">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-24 h-24 relative">
            <div className="absolute inset-0 rounded-full border-t-2 border-b-2 border-blue-500 animate-spin"></div>
            <div className="absolute inset-4 rounded-full border-t-2 border-b-2 border-purple-500 animate-spin animation-delay-150"></div>
            <div className="absolute inset-8 rounded-full border-t-2 border-b-2 border-pink-500 animate-spin animation-delay-300"></div>
          </div>
          <p className="mt-6 text-gray-400">正在加载内容...</p>
        </div>
      </div>
    );
  }

  if (error && !serverError) {
    return (
      <div className="container-custom">
        <div className="bg-gradient-to-r from-red-900/40 to-gray-900 rounded-xl p-8 shadow-lg border border-red-800/20 text-center">
          <svg className="w-12 h-12 mx-auto text-red-500 mb-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <h2 className="text-xl text-red-400 mb-4">{error}</h2>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gradient-to-r from-red-800 to-red-600 hover:from-red-700 hover:to-red-500 text-white rounded-lg shadow-md transition duration-300"
          >
            重试加载
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-custom">
      {serverError && <NoServerConnection />}

      {/* 博客标题区 */}
      <div className="mb-12 text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
          新鲜观点与思考
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
          发现有趣的想法、深度的技术分析和个人见解
        </p>
      </div>

      {posts.length === 0 && !loading && !error && !serverError ? (
        <div className="text-center py-16 bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700/50 shadow-lg">
          <svg className="w-16 h-16 mx-auto text-gray-600 mb-6">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
          </svg>
          <h2 className="text-2xl text-gray-400 mb-3">暂无文章</h2>
          <p className="text-gray-500 max-w-md mx-auto mb-6">
            博客还没有发布任何文章，请在后台管理系统中创建新文章。
          </p>
          <a 
            href={ADMIN_URL} 
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition duration-300 shadow-md"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            创建新文章
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            {/* 主要内容区 */}
            <div className="space-y-10">
              {posts.map((post) => (
                <article 
                  key={post.id} 
                  className="article-card bg-gradient-to-br from-gray-800/60 to-gray-900/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-700/50"
                  style={{
                    height: '200px',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  {/* 文章分类标签 */}
                  <div className="flex flex-wrap gap-2 mb-3" style={{ height: '30px' }}>
                    {post.categories.map(cat => (
                      <span key={cat.id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/50 text-blue-300 border border-blue-800/50">
                        {cat.name}
                      </span>
                    ))}
                    {post.is_pinned && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-900/50 text-yellow-300 border border-yellow-800/50">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        置顶
                      </span>
                    )}
                  </div>
                  
                  {/* 文章标题 */}
                  <h2 className="text-xl font-bold mb-4" style={{
                    height: '30px',
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: 'vertical'
                  }}>
                    <Link to={`/blog/${post.id}`} className="text-white hover:text-blue-400 transition-colors">
                      {post.title}
                    </Link>
                  </h2>
                  
                  {/* 文章内容预览 - 包含缩略图 */}
                  <div className="flex-1 flex gap-4" style={{ height: '120px' }}>
                    {/* 缩略图区域 */}
                    {post.content.match(/!\[.*?\]\((.*?)\)/)?.[1] && (
                      <div className="w-[120px] h-[120px] flex-shrink-0 overflow-hidden rounded-lg">
                        <img 
                          src={post.content.match(/!\[.*?\]\((.*?)\)/)?.[1]} 
                          alt="缩略图"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    {/* 文本内容区域 */}
                    <div className="text-gray-300 flex-1 overflow-hidden" style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 6,
                      WebkitBoxOrient: 'vertical'
                    }}>
                      {post.content}
                    </div>
                  </div>
                  
                  {/* 文章元信息 */}
                  <div className="flex justify-between items-center text-sm text-gray-400" style={{ height: '20px' }}>
                    <div className="flex items-center space-x-4">
                      <span>{new Date(post.created_at).toLocaleDateString()}</span>
                      <span>{post.view_count || 0} 阅读</span>
                    </div>
                    <Link to={`/blog/${post.id}`} className="text-blue-400 hover:text-blue-300">
                      阅读全文 →
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
          
          <div className="lg:col-span-4">
            {/* 侧边栏 */}
            <div className="space-y-8 sticky top-32">
              {/* 关于博客 */}
              <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-700/50">
                <h3 className="text-xl font-bold mb-4 pb-3 border-b border-gray-700 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  关于博客
                </h3>
                <p className="text-gray-400 mb-4">
                  这是一个基于React和NestJS构建的个人博客系统，拥有完善的内容管理功能。
                </p>
                <a 
                  href={ADMIN_URL}
                  className="inline-flex items-center text-blue-400 hover:text-blue-300 transition"
                >
                  <span>登录管理后台</span>
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
              
              {/* 热门分类 */}
              <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-700/50">
                <h3 className="text-xl font-bold mb-4 pb-3 border-b border-gray-700 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  热门分类
                </h3>
                <div className="flex flex-wrap gap-2">
                  <a href="#" className="px-3 py-1.5 bg-blue-900/30 hover:bg-blue-900/50 text-blue-400 rounded-lg transition">
                    技术
                  </a>
                  <a href="#" className="px-3 py-1.5 bg-purple-900/30 hover:bg-purple-900/50 text-purple-400 rounded-lg transition">
                    生活
                  </a>
                  <a href="#" className="px-3 py-1.5 bg-green-900/30 hover:bg-green-900/50 text-green-400 rounded-lg transition">
                    教程
                  </a>
                  <a href="#" className="px-3 py-1.5 bg-pink-900/30 hover:bg-pink-900/50 text-pink-400 rounded-lg transition">
                    笔记
                  </a>
                  <a href="#" className="px-3 py-1.5 bg-yellow-900/30 hover:bg-yellow-900/50 text-yellow-400 rounded-lg transition">
                    资源
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
