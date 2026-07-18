import React, { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface ClassicLayoutProps {
  children: ReactNode;
  blogTitle?: string;
  blogSubtitle?: string;
}

const ClassicLayout: React.FC<ClassicLayoutProps> = ({ 
  children, 
  blogTitle = "段永平的博客",
  blogSubtitle = "弄弄道路即可跑起來，这里是一字千金好但貴定制的。" 
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-800">
      {/* 头部标题和描述 */}
      <header className="border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold mb-1">{blogTitle}</h1>
          <p className="text-gray-600 text-sm">{blogSubtitle}</p>
        </div>
      </header>

      {/* 导航栏 */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="container mx-auto px-4">
          <ul className="flex space-x-8">
            <li>
              <Link to="/" className="inline-block py-3 text-gray-600 hover:text-gray-900">
                首页
              </Link>
            </li>
            <li>
              <Link to="/blog" className="inline-block py-3 text-gray-600 hover:text-gray-900">
                日志
              </Link>
            </li>
            <li>
              <Link to="/lofter" className="inline-block py-3 text-gray-600 hover:text-gray-900">
                LOFTER
              </Link>
            </li>
            <li>
              <Link to="/collections" className="inline-block py-3 text-gray-600 hover:text-gray-900">
                收藏
              </Link>
            </li>
            <li>
              <Link to="/friends" className="inline-block py-3 text-gray-600 hover:text-gray-900">
                博友
              </Link>
            </li>
            <li>
              <Link to="/about" className="inline-block py-3 text-gray-600 hover:text-gray-900">
                关于我
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* 主内容区 */}
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row">
            {/* 左侧内容区 */}
            <div className="lg:w-8/12">
              {children}
            </div>
            
            {/* 右侧侧边栏 */}
            <div className="lg:w-4/12 lg:pl-8 mt-8 lg:mt-0">
              <div className="border-b border-gray-200 pb-6 mb-6">
                <h3 className="text-lg font-bold mb-4 border-l-4 border-gray-800 pl-2">关于我</h3>
                <div className="bg-gray-50 p-4">
                  <div className="text-center mb-4">
                    <div className="w-20 h-20 mx-auto mb-2 bg-gray-300 rounded-full flex items-center justify-center text-2xl">
                      段
                    </div>
                    <p className="font-bold">段永平</p>
                  </div>
                  <p className="text-sm text-gray-600">郑重合约都可暂时跑起来。这里是一句千斤好但贵定制的。</p>
                </div>
              </div>
              
              <div className="border-b border-gray-200 pb-6 mb-6">
                <h3 className="text-lg font-bold mb-4 border-l-4 border-gray-800 pl-2">文章分类</h3>
                <ul className="space-y-2">
                  <li>
                    <a href="#" className="text-gray-600 hover:text-gray-900">分享好东西 (3)</a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-600 hover:text-gray-900">quotes (3)</a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-600 hover:text-gray-900">小子才 (1)</a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-600 hover:text-gray-900">游戏 (2)</a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-600 hover:text-gray-900">一点想法 (8)</a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-600 hover:text-gray-900">转帖 (3)</a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-600 hover:text-gray-900">一点经验 (4)</a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-600 hover:text-gray-900">电影 (4)</a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-600 hover:text-gray-900">更多 &gt;</a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 页脚 */}
      <footer className="border-t border-gray-200">
        <div className="container mx-auto px-4 py-4 text-center text-gray-500 text-sm">
          <p>© 2024 段永平的博客. 保留所有权利.</p>
        </div>
      </footer>
    </div>
  );
};

export default ClassicLayout; 