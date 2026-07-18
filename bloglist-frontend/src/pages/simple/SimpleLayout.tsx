import React, { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface SimpleLayoutProps {
  children: ReactNode;
  blogTitle?: string;
  blogSubtitle?: string;
}

const SimpleLayout: React.FC<SimpleLayoutProps> = ({ 
  children, 
  blogTitle = "段永平的博客",
  blogSubtitle = "弄弄道路即可跑起來，这里是一字千金好但貴定制的。" 
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-800">
      {/* 头部标题和描述 */}
      <header className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold mb-1">{blogTitle}</h1>
          <p className="text-gray-600 text-sm">{blogSubtitle}</p>
        </div>
      </header>

      {/* 导航栏 */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <ul className="flex flex-wrap">
            <li>
              <Link to="/" className="inline-block py-3 px-4 text-gray-600 hover:text-gray-900">
                首页
              </Link>
            </li>
            <li>
              <Link to="/blog" className="inline-block py-3 px-4 text-gray-600 hover:text-gray-900">
                日志
              </Link>
            </li>
            <li>
              <Link to="/lofter" className="inline-block py-3 px-4 text-gray-600 hover:text-gray-900">
                LOFTER
              </Link>
            </li>
            <li>
              <Link to="/collections" className="inline-block py-3 px-4 text-gray-600 hover:text-gray-900">
                收藏
              </Link>
            </li>
            <li>
              <Link to="/friends" className="inline-block py-3 px-4 text-gray-600 hover:text-gray-900">
                博友
              </Link>
            </li>
            <li>
              <Link to="/about" className="inline-block py-3 px-4 text-gray-600 hover:text-gray-900">
                关于我
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* 主内容区 */}
      <main className="flex-grow py-8">
        <div className="max-w-4xl mx-auto px-4">
          {children}
        </div>
      </main>

      {/* 页脚 */}
      <footer className="border-t border-gray-200 py-4">
        <div className="max-w-4xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>© 2024 博客系统. 保留所有权利.</p>
        </div>
      </footer>
    </div>
  );
};

export default SimpleLayout;
