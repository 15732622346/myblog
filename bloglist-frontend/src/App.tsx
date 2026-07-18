import { BrowserRouter as Router, Routes, Route, Navigate, useParams, Link, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import UserPage from './pages/user/UserPage';
import HomePage from './pages/home';
import ClassicHomePage from './pages/classic/ClassicHomePage';
import SimplePage from './pages/simple/SimplePage';
import DirectSimplePage from './pages/simple/DirectSimplePage';
import ResumeView from './pages/simple/ResumeView';
import GuestbookView from './pages/simple/GuestbookView';
import NotFound from './pages/NotFound';
import { getAdminUrl } from './utils/env';
import FloatingMenu from './components/FloatingMenu';
import WorkView from './pages/simple/WorkView';

// 从环境变量或配置中获取后台地址
const ADMIN_URL = getAdminUrl();

// 头部导航组件
interface HeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

const Header = ({ searchTerm, setSearchTerm }: HeaderProps) => {
  // 添加屏幕方向状态
  const [isPortrait, setIsPortrait] = useState(window.innerWidth < window.innerHeight);
  // 添加搜索框宽度状态
  const [searchWidth, setSearchWidth] = useState(isPortrait ? 150 : 300);
  
  // 创建ref引用元素 - 修复类型
  const logoRef = useRef<HTMLAnchorElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  
  // 计算可用的搜索框宽度，防止重叠
  const calculateSearchWidth = useCallback(() => {
    if (!headerRef.current || !logoRef.current || !navRef.current) return;
    
    const headerWidth = headerRef.current.clientWidth;
    const logoRect = logoRef.current.getBoundingClientRect();
    const navRect = navRef.current.getBoundingClientRect();
    const headerRect = headerRef.current.getBoundingClientRect();
    
    // 安全边距，防止元素太靠近
    const safetyMargin = 15;
    
    // 计算头部中点位置
    const centerPoint = headerRect.left + headerWidth / 2;
    
    // 计算logo和导航的位置边界
    const logoRightEdge = logoRect.right + safetyMargin;
    const navLeftEdge = navRect.left - safetyMargin;
    
    // 计算可用空间宽度
    const availableWidth = navLeftEdge - logoRightEdge;
    
    // 从中点计算两侧可用空间
    const leftAvailableSpace = centerPoint - logoRightEdge;
    const rightAvailableSpace = navLeftEdge - centerPoint;
    
    // 取左右两侧较小的距离，乘以2作为最大宽度
    const maxWidth = Math.floor(Math.min(leftAvailableSpace, rightAvailableSpace) * 2);
    
    // 限制最小宽度
    const minWidth = 100;
    
    // 根据设备方向设定理想宽度
    const idealWidth = isPortrait ? 150 : 300;
    
    // 确定最终宽度：理想宽度、可用宽度和最大宽度三者中的较小值，但不小于最小宽度
    const finalWidth = Math.max(
      Math.min(idealWidth, availableWidth, maxWidth), 
      minWidth
    );
    
    // 如果新宽度与当前宽度不同，则更新
    if (finalWidth !== searchWidth) {
      setSearchWidth(finalWidth);
    }
  }, [searchWidth, isPortrait]);
  
  // 监听屏幕尺寸变化
  useEffect(() => {
    const handleResize = () => {
      setIsPortrait(window.innerWidth < window.innerHeight);
      calculateSearchWidth();
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [calculateSearchWidth]);
  
  // 使用ResizeObserver监听元素尺寸变化
  useEffect(() => {
    if (!headerRef.current || !logoRef.current || !navRef.current) return;
    
    const resizeObserver = new ResizeObserver(() => {
      calculateSearchWidth();
    });
    
    resizeObserver.observe(headerRef.current);
    resizeObserver.observe(logoRef.current);
    resizeObserver.observe(navRef.current);
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [calculateSearchWidth]);
  
  // 组件挂载后计算初始宽度
  useEffect(() => {
    calculateSearchWidth();
  }, [calculateSearchWidth]);

  return (
    <header 
      className="fixed w-full bg-opacity-80 bg-gray-900 backdrop-blur-md border-b border-gray-800 z-50 shadow-lg"
      ref={headerRef}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo & 品牌 */}
          <Link 
            to="/" 
            className="flex items-center gap-2"
            ref={logoRef}
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
              博客前台
            </span>
          </Link>
          
          {/* 搜索栏 */}
          <div className="hidden md:block flex-1 mx-8" style={{ maxWidth: `${searchWidth}px` }}>
            <div className="relative">
              <input
                type="text"
                placeholder="搜索文章..."
                className="w-full px-4 py-2 bg-gray-800/80 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-gray-100 transition duration-300"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* 导航链接 */}
          <nav 
            className="flex items-center space-x-6"
            ref={navRef}
          >
            <a href="/" className="text-gray-300 hover:text-white transition hidden sm:block">
              首页
            </a>
            <a href="/classic" className="text-gray-300 hover:text-white transition hidden sm:block">
              经典版
            </a>
            <a href="/simple" className="text-gray-300 hover:text-white transition hidden sm:block">
              简洁版
            </a>
            <a href="/categories" className="text-gray-300 hover:text-white transition hidden sm:block">
              分类
            </a>
            <a href="/archives" className="text-gray-300 hover:text-white transition hidden sm:block">
              归档
            </a>
            <a href={ADMIN_URL} className="flex items-center text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-4 py-2 rounded-lg transition duration-300 shadow-md">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="hidden sm:inline">登录</span>
            </a>
          </nav>
        </div>
        
        {/* 移动端搜索栏 */}
        <div className="mt-3 md:hidden">
          <div className="relative" style={{ maxWidth: `${searchWidth}px`, margin: '0 auto' }}>
            <input
              type="text"
              placeholder="搜索文章..."
              className="w-full px-4 py-2 bg-gray-800/80 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-gray-100"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

// 用户名有效性检查包装器组件
const UserPageWrapper = () => {
  const { username } = useParams<{ username: string }>();
  const location = useLocation();
  
  // 检查URL是否有效（只允许字母、数字、下划线、短横线）
  const isValidUsername = (username: string) => {
    return /^[a-zA-Z0-9_-]+$/.test(username);
  };
  
  if (!username || !isValidUsername(username)) {
    return <Navigate to="/404" replace />;
  }
  
  // 根据路径决定显示什么页面
  const path = location.pathname;
  
  if (path.endsWith('/resume')) {
    return <ResumeView />;
  }
  
  return <DirectSimplePage />;
};

// 底部组件
const Footer = () => (
  <footer className="py-12 border-t border-gray-800">
    <div className="container mx-auto px-4 sm:px-6">
      <div className="flex flex-col md:flex-row justify-between items-center">
        <div className="text-center md:text-left mb-6 md:mb-0">
          <div className="flex items-center justify-center md:justify-start mb-4">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
              博客前台
            </span>
          </div>
          <p className="text-gray-400 max-w-md">个人博客系统让你轻松记录灵感，分享你的思考和经验。</p>
        </div>
        
        <div className="space-y-4 text-center md:text-right">
          <div className="flex items-center justify-center md:justify-end space-x-4">
            <a href="#" className="w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 transition">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
              </svg>
            </a>
            <a href="#" className="w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 transition">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </a>
            <a href="#" className="w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 transition">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
          </div>
          <p className="text-gray-500">© 2024 博客前台. 保留所有权利。</p>
        </div>
      </div>
    </div>
  </footer>
);

// 应用主体
function App() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <Router>
      {/* Render the FloatingMenu globally */}
      <FloatingMenu /> 
      <Routes>
        <Route path="/:username/resume" element={<ResumeView />} />
        <Route path="/:username" element={<UserPageWrapper />} />
        <Route path="/:username/works" element={<WorkView />} />
        <Route path="/404" element={<NotFound />} />
        <Route path="/" element={<Navigate to="/lijiangtao1" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;