import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { advertisementApi } from '../services/advertisement';
import MarkdownIt from 'markdown-it';
import { fixImageUrl } from '../utils/imageHelper';

// 创建markdown渲染器实例
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true
});

// 添加自定义图片渲染规则,修复URL拼接问题
const defaultImageRenderer = md.renderer.rules.image || function(tokens, idx, options, env, self) {
  return self.renderToken(tokens, idx, options);
};

md.renderer.rules.image = function(tokens, idx, options, env, self) {
  const token = tokens[idx];
  const srcIndex = token.attrIndex('src');
  
  if (srcIndex >= 0) {
    const src = token.attrs[srcIndex][1];
    // console.log('原始图片URL:', src);
    
    // 使用新的fixImageUrl函数修复可能的URL拼接问题
    const fixedUrl = fixImageUrl(src);
    token.attrs[srcIndex][1] = fixedUrl;
    
    // console.log('修正后的图片URL:', fixedUrl);
    
    // 添加图片加载事件debug
    token.attrSet('data-original-src', src);
    // token.attrSet('onload', 'console.log("图片加载成功:", this.src)');
    // token.attrSet('onerror', 'console.error("图片加载失败:", this.src, "原始URL:", this.getAttribute("data-original-src"))');
  }
  
  return defaultImageRenderer(tokens, idx, options, env, self);
};

// 使用markdown-it渲染markdown内容
const ReactMarkdownWrapper: React.FC<{ children: string }> = ({ children }) => {
  const renderedContent = md.render(children);
  return <div className="markdown-content" dangerouslySetInnerHTML={{ __html: renderedContent }} />;
};

// 添加Props类型定义，包含拖动处理函数
interface LeftSidePanelProps {
  onDragStart?: (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => void;
}

const LeftSidePanel: React.FC<LeftSidePanelProps> = ({ onDragStart }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [adContent, setAdContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const { username } = useParams<{ username: string }>();
  const location = useLocation();
  
  // 添加屏幕方向状态
  const [isPortrait, setIsPortrait] = useState(window.innerWidth < window.innerHeight);
  
  // 监听屏幕尺寸变化
  useEffect(() => {
    const handleResize = () => {
      setIsPortrait(window.innerWidth < window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  useEffect(() => {
    const fetchAdvertisement = async () => {
      // 从 URL 中提取用户名
      const urlUsername = username || location.pathname.split('/')[1];
      if (!urlUsername) {
        console.log('未找到用户名，无法获取广告');
        setLoading(false);
        return;
      }
      
      console.log('正在获取用户广告:', urlUsername);
      try {
        setLoading(true);
        const advertisement = await advertisementApi.getAdvertisementByUsername(urlUsername);
        if (advertisement && advertisement.content) {
          console.log('成功获取广告内容');
          setAdContent(advertisement.content);
        } else {
          console.log('未找到广告内容');
          setAdContent('暂无广告内容');
        }
      } catch (error) {
        console.error('获取广告失败:', error);
        setAdContent('获取广告内容失败');
      } finally {
        setLoading(false);
      }
    };

    fetchAdvertisement();
  }, [username, location.pathname]);

  const toggleAd = () => {
    setIsOpen(!isOpen);
  };

  // 如果没有广告内容，不显示组件
  if (!adContent && !loading) {
    return null;
  }

  return (
    <div className="left-side-ad" style={{
      width: '100%',
      backgroundColor: '#1a1a1a',
      color: '#ccc',
      border: '1px solid #333',
      borderRadius: '4px',
      overflow: 'hidden',
      marginBottom: '0',
      marginTop: 'auto'
    }}>
      <div 
        className="ad-header" 
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: isPortrait ? '6px 8px' : '8px 12px', 
          backgroundColor: '#272727',
          borderBottom: isOpen ? '1px solid #333' : 'none',
          cursor: onDragStart ? 'grab' : 'default' // 如果传入了拖动处理函数，则显示拖动光标
        }}
        onMouseDown={onDragStart} // 绑定拖动开始事件
        onTouchStart={onDragStart} // 绑定触摸拖动开始事件
      >
        <span style={{ 
          fontSize: isPortrait ? '12px' : '14px', 
          color: '#ccc', 
          fontWeight: 'bold' 
        }}>广告</span>
        <button 
          onClick={(e) => {
            e.stopPropagation(); // 阻止事件冒泡，防止干扰拖动
            toggleAd();
          }}
          onMouseDown={(e) => e.stopPropagation()} // 阻止按钮本身的 mousedown 事件冒泡
          onTouchStart={(e) => e.stopPropagation()} // 阻止按钮本身的 touchstart 事件冒泡
          style={{
            background: 'none',
            border: 'none',
            color: '#999',
            cursor: 'pointer',
            fontSize: isPortrait ? '10px' : '12px' // 竖屏时字体缩小
          }}
        >
          {isOpen ? '收起' : '展开'}
        </button>
      </div>
      
      {isOpen && (
        <div className="ad-content" style={{ 
          padding: isPortrait ? '8px' : '12px', // 竖屏时内边距缩小
          maxHeight: isPortrait ? '120px' : '200px', // 竖屏时限制高度
          overflowY: 'auto'
        }}>
          {loading ? (
            <p style={{ 
              fontSize: isPortrait ? '12px' : '14px', // 竖屏时字体缩小
              lineHeight: '1.4', 
              color: '#999' 
            }}>加载中...</p>
          ) : (
            <div 
              style={{ 
                color: '#999', 
                fontSize: isPortrait ? '12px' : '14px' // 竖屏时字体缩小
              }}
              className="markdown-content"
            >
              <ReactMarkdownWrapper>{adContent}</ReactMarkdownWrapper>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LeftSidePanel;
