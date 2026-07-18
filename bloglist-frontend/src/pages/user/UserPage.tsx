import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { postsApi, userApi } from '../../services/api';
import { getAdminUrl } from '../../utils/env';

// 定义类型
interface User {
  id: number;
  username: string;
}

interface Category {
  id: number;
  name: string;
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
}

interface PostsResponse {
  items: Post[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  user: {
    id: number;
    username: string;
  };
}

// 从环境变量或配置中获取后台地址
const ADMIN_URL = getAdminUrl();

// 新增用户不存在组件
const UserNotFound = ({ username }: { username: string }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="text-yellow-500 text-6xl font-bold mb-6">
        <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      </div>
      <h1 className="text-xl font-bold text-gray-100 mb-4">用户不存在</h1>
      <p className="text-gray-400 mb-8">
        用户 <span className="text-blue-400 font-semibold">"{username}"</span> 不存在或未创建任何公开内容
      </p>
      
      <div className="space-y-4">
        <p className="text-gray-300">您可以尝试：</p>
        <ul className="list-disc list-inside text-gray-400 pl-4">
          <li>检查用户名是否拼写正确</li>
          <li>返回<Link to="/" className="text-blue-400 hover:underline">首页</Link>查看其他内容</li>
          <li>在管理后台<a href={ADMIN_URL} className="text-blue-400 hover:underline">登录</a>并创建博客</li>
        </ul>
      </div>
      
      <Link 
        to="/" 
        className="mt-10 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        返回首页
      </Link>
    </div>
  );
};

const UserPage = () => {
  const { username } = useParams<{ username: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });

  useEffect(() => {
    const fetchUserAndPosts = async () => {
      if (!username) return;
      
      setLoading(true);
      setError(null);
      setNotFound(false);
      
      try {
        // 获取用户信息
        const userData = await userApi.getUserByUsername(username);
        setUser(userData);
        
        // 获取用户的文章
        const postsData: PostsResponse = await postsApi.getPostsByUsername(username);
        setPosts(postsData.items);
        setMeta(postsData.meta);
      } catch (err: any) {
        console.error('Error fetching data:', err);
        if (err.response && err.response.status === 404) {
          // 设置为用户不存在
          setNotFound(true);
        } else {
          setError('加载数据失败，请稍后再试');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserAndPosts();
  }, [username]);

  // 处理分页
  const handlePageChange = async (page: number) => {
    if (!username) return;
    
    setLoading(true);
    try {
      const postsData: PostsResponse = await postsApi.getPostsByUsername(username, page);
      setPosts(postsData.items);
      setMeta(postsData.meta);
    } catch (err) {
      console.error('Error fetching page:', err);
      setError('加载数据失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (notFound && username) {
    return <UserNotFound username={username} />;
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl text-red-400 mb-4">{error}</h2>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      {/* 用户信息 */}
      {user && (
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <div className="flex items-center">
            <div className="h-16 w-16 rounded-full mr-6 bg-blue-900 flex items-center justify-center text-xl text-blue-300">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-blue-400">{user.username} 的博客</h1>
            </div>
          </div>
        </div>
      )}

      {/* 文章列表 */}
      <div className="space-y-8">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl text-gray-400">这个用户还没有发布文章</h2>
          </div>
        ) : (
          posts.map((post) => (
            <article key={post.id} className="bg-gray-800 rounded-lg p-6">
              {post.is_pinned && (
                <div className="flex items-center mb-2 text-yellow-500">
                  <svg className="w-3.5 h-3.5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-sm">置顶</span>
                </div>
              )}
              <h2 className="text-xl font-bold mb-2">
                <a href={`/article/${post.id}`} className="text-blue-400 hover:text-blue-300">
                  {post.title}
                </a>
              </h2>
              <div className="text-sm text-gray-400 mb-4">
                <span>{formatDate(post.created_at)}</span>
                <span className="mx-2">·</span>
                <span>{post.view_count} 次阅读</span>
                {post.categories.length > 0 && (
                  <>
                    <span className="mx-2">·</span>
                    <span>
                      {post.categories.map(cat => cat.name).join(', ')}
                    </span>
                  </>
                )}
              </div>
              <div className="text-gray-300 mb-4 text-sm">
                {/* 显示内容摘要，去除HTML标签 */}
                {post.content
                  .replace(/<[^>]*>/g, '')
                  .substring(0, 200)}
                {post.content.length > 200 ? '...' : ''}
              </div>
              <a
                href={`/article/${post.id}`}
                className="inline-flex items-center text-blue-400 hover:text-blue-300"
              >
                阅读更多
                <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </article>
          ))
        )}
      </div>

      {/* 分页 */}
      {meta.totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <nav className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(Math.max(1, meta.page - 1))}
              disabled={meta.page === 1}
              className={`px-3 py-1 rounded-md ${
                meta.page === 1
                  ? 'text-gray-500 cursor-not-allowed'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              上一页
            </button>
            
            {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-1 rounded-md ${
                  page === meta.page
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={() => handlePageChange(Math.min(meta.totalPages, meta.page + 1))}
              disabled={meta.page === meta.totalPages}
              className={`px-3 py-1 rounded-md ${
                meta.page === meta.totalPages
                  ? 'text-gray-500 cursor-not-allowed'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              下一页
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};
