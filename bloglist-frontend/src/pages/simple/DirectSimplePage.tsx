import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import MarkdownIt from 'markdown-it';
import ResumeView from './ResumeView'; // 导入ResumeView组件
import { guestbookApi, GuestbookMessage, GuestbookPaginatedResponse } from '../../services/guestbook';
import { UserOutlined } from '@ant-design/icons'; // 添加用户图标
import LeftSidePanel from '../../components/LeftSidePanel'; // 导入广告组件
import { getApiUrl, isDevelopment } from '../../utils/env';
import { extractFirstImage, registerImageEventHandlers, fixImageUrl } from '../../utils/imageHelper';

const md = new MarkdownIt();

interface Post {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface Category {
  id: number;
  name: string;
  description: string;
}

interface PaginationData {
  items: Post[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface GuestbookEntry {
  id: number;
  content: string;
  date: string;
  color?: string;
}

// 添加字数限制常量
const MAX_COMMENT_LENGTH = 100;

// 移除所有图片标记
const removeImages = (content: string): string => {
  return content.replace(/!\[.*?\]\(.*?\)/g, '');
};

// 添加用户信息接口
interface UserInfo {
  id: number;
  username: string;
  nickname?: string;
  bio?: string;
  avatar?: string;
}

interface Work {
  id: number;
  content: string;
  created_at: string;
  updated_at: string;
}

const defaultWorkContent = `# 个人作品\n\n这里是我的代表作品。\n`;

const DirectSimplePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [postsPerPage, setPostsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputValue, setInputValue] = useState('');
  
  // 作品相关的状态
  const [work, setWork] = useState<Work | null>(null);
  const [loadingWork, setLoadingWork] = useState(true);
  const [errorWork, setErrorWork] = useState('');
  
  // 添加屏幕尺寸状态
  const [isPortrait, setIsPortrait] = useState(window.innerWidth < window.innerHeight);
  
  // 添加搜索框宽度状态
  const [searchWidth, setSearchWidth] = useState(isPortrait ? 150 : 300);
  
  // 添加广告面板位置和拖动状态
  const adPanelRef = useRef<HTMLDivElement>(null);
  const [adPosition, setAdPosition] = useState({ right: 20, bottom: 70 }); // Initial position
  const [isDraggingAd, setIsDraggingAd] = useState(false);
  // Add a ref to track ad dragging state synchronously
  const isDraggingAdRef = useRef(false);
  const dragAdOffset = useRef({ x: 0, y: 0 }); // Use ref for offset to avoid re-renders
  
  // 创建ref引用元素
  const navRef = useRef<HTMLDivElement>(null);
  const userInfoRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  
  // 计算可用的搜索框宽度，防止重叠
  const calculateSearchWidth = useCallback(() => {
    if (!headerRef.current || !navRef.current || !userInfoRef.current) return;
    
    const headerWidth = headerRef.current.clientWidth;
    const navRect = navRef.current.getBoundingClientRect();
    const userInfoRect = userInfoRef.current.getBoundingClientRect();
    const headerRect = headerRef.current.getBoundingClientRect();
    
    // 安全边距，防止元素太靠近
    const safetyMargin = 15;
    
    // 计算头部中点位置（用于居中）
    const centerPoint = headerRect.left + headerWidth / 2;
    
    // 计算左侧导航和右侧用户信息的位置边界
    const navRightEdge = navRect.right + safetyMargin;
    const userInfoLeftEdge = userInfoRect.left - safetyMargin;
    
    // 计算可用空间宽度 (从导航右侧到用户信息左侧的距离)
    const availableWidth = userInfoLeftEdge - navRightEdge;
    
    // 计算搜索框最大宽度 (因为要居中，所以考虑两边的空间限制)
    // 从中点向左的可用距离
    const leftAvailableSpace = centerPoint - navRightEdge;
    // 从中点向右的可用距离
    const rightAvailableSpace = userInfoLeftEdge - centerPoint;
    // 取左右两侧较小的距离，乘以2作为最大宽度
    const maxWidth = Math.floor(Math.min(leftAvailableSpace, rightAvailableSpace) * 2);
    
    // 限制最小宽度，确保搜索框至少有基本的可用性
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
    if (!headerRef.current || !navRef.current || !userInfoRef.current) return;
    
    const resizeObserver = new ResizeObserver(() => {
      calculateSearchWidth();
    });
    
    resizeObserver.observe(headerRef.current);
    resizeObserver.observe(navRef.current);
    resizeObserver.observe(userInfoRef.current);
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [calculateSearchWidth]);
  
  // 组件挂载后计算初始宽度
  useEffect(() => {
    calculateSearchWidth();
  }, [calculateSearchWidth]);
  
  // 新增状态来控制显示内容
  const [activeView, setActiveView] = useState<'blog' | 'resume' | 'guestbook' | 'work'>('blog');
  
  // 留言簿相关状态
  const [guestbookEntries, setGuestbookEntries] = useState<GuestbookEntry[]>([]);
  const [newEntry, setNewEntry] = useState({
    content: ""
  });
  const [commentBoxOpen, setCommentBoxOpen] = useState(false);
  const [loadingGuestbook, setLoadingGuestbook] = useState(false);
  const [guestbookError, setGuestbookError] = useState<string | null>(null);

  // 添加用户信息状态
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loadingUserInfo, setLoadingUserInfo] = useState(true);

  // 添加留言簿分页状态
  const [guestbookCurrentPage, setGuestbookCurrentPage] = useState(1);
  const [guestbookPageSize, setGuestbookPageSize] = useState(8); // 留言簿每页显示 8 条
  const [guestbookTotalMessages, setGuestbookTotalMessages] = useState(0);
  const [guestbookTotalPages, setGuestbookTotalPages] = useState(0);

  // Effect to update state from URL Search Params
  useEffect(() => {
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');
    const titleParam = searchParams.get('title'); // Read 'title' instead of 'search'
    const categoryParam = searchParams.get('category');
    const viewParam = searchParams.get('view'); // Read the view parameter

    setCurrentPage(pageParam ? parseInt(pageParam, 10) : 1);
    setPostsPerPage(limitParam ? parseInt(limitParam, 10) : 10);
    setSearchQuery(titleParam || ''); // Set state from 'title' param
    setInputValue(titleParam || ''); // Keep input value in sync with 'title' param
    setSelectedCategory(categoryParam ? parseInt(categoryParam, 10) : null);

    // Update activeView based on viewParam
    if (viewParam === 'guestbook') {
      setActiveView('guestbook');
    } else if (viewParam === 'resume') {
      setActiveView('resume');
    } else if (viewParam === 'work') { // 添加对 work 视图的处理
      setActiveView('work');
    } else {
      // Default to blog view if param is missing or invalid
      setActiveView('blog');
    }

  }, [searchParams]); // Re-run whenever searchParams change

  // 获取留言数据 - 修改为接收分页参数并处理分页响应
  const fetchGuestbookMessages = useCallback(async (page: number, limit: number) => {
    if (!username) return;
    
    console.log(`开始获取留言数据，用户名: ${username}, 页码: ${page}, 每页: ${limit}`);
    setLoadingGuestbook(true);
    setGuestbookError(null);
    
    try {
      // 调用更新后的 API 服务，传入分页参数
      console.log(`发送API请求: /guestbook/${username}?page=${page}&limit=${limit}`);
      const response: GuestbookPaginatedResponse = await guestbookApi.getGuestbookMessages(username, page, limit);
      console.log("原始API响应:", response);
      
      // guestbookApi已经返回了后端数据 { data: [], total: number }
      const messages = response?.data || [];
      const totalMessages = response?.total || 0;
      console.log("解析后的留言数据:", messages);
      console.log(`总留言数: ${totalMessages}`);
      
      // 将后端数据转换为前端格式
      const formattedMessages = messages.map((message: GuestbookMessage) => {
        console.log("处理留言项:", message);
        return {
          id: message.id,
          content: message.content,
          date: new Date(message.created_at).toISOString().split('T')[0],
          // 生成随机颜色
          color: getRandomColor(),
        };
      });
      
      console.log("格式化后的留言数据:", formattedMessages);
      console.log(`当前页获取到 ${formattedMessages.length} 条留言`);
      setGuestbookEntries(formattedMessages);
      setGuestbookTotalMessages(totalMessages);
      setGuestbookTotalPages(Math.ceil(totalMessages / limit)); // 计算总页数
      
    } catch (error) {
      console.error("获取留言失败:", error);
      if (error instanceof Error) {
        console.error("错误详情:", error.message, error.stack);
      }
      setGuestbookError("获取留言失败，请稍后再试");
    } finally {
      setLoadingGuestbook(false);
      console.log("留言获取过程结束");
    }
  }, [username]); // 依赖项只需要 username，page/limit 在调用时传入

  // 生成随机颜色
  const getRandomColor = () => {
    const colors = ['#3a6ea5', '#6a5acd', '#2e8b57', '#b8860b', '#800080', '#a0522d', '#556b2f'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // 处理留言提交
  const handleGuestbookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntry.content || !username) return;

    try {
      // 调用API提交留言
      await guestbookApi.createGuestbookMessage(username, newEntry.content);
      
      // 清空输入框并关闭评论框
      setNewEntry({ content: "" });
      setCommentBoxOpen(false);
      
      // 重新获取留言列表，显示包括新提交的留言
      fetchGuestbookMessages(guestbookCurrentPage, guestbookPageSize);
    } catch (error: any) {
      // 显示错误信息，包括可能的留言限制提示
      if (error.response?.status === 429) {
        alert("您今天的留言已达上限（5条）");
      } else {
        alert("提交留言失败：" + (error.response?.data?.message || "未知错误"));
      }
    }
  };

  // 处理留言输入变化，添加字数限制
  const handleCommentInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    // 限制输入不超过100字
    if (value.length <= MAX_COMMENT_LENGTH) {
      setNewEntry({ content: value });
    }
  };

  // 在组件挂载或用户名/视图变化时获取留言 - 修改为使用分页状态
  useEffect(() => {
    console.log("activeView 或 guestbookCurrentPage 变化:", activeView, guestbookCurrentPage);
    if (activeView === 'guestbook') {
      console.log(`检测到留言簿视图激活，准备获取第 ${guestbookCurrentPage} 页留言`);
      fetchGuestbookMessages(guestbookCurrentPage, guestbookPageSize);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView, username, guestbookCurrentPage, guestbookPageSize]); // 添加 guestbookCurrentPage 和 guestbookPageSize 到依赖

  // 获取作品内容
  useEffect(() => {
    const fetchWork = async () => {
      if (activeView !== 'work' || !username) {
        setWork(null); // Clear previous work data if not in work view
        setLoadingWork(false); // Ensure loading is false if not fetching
        setErrorWork('');
        return;
      }
      try {
        setLoadingWork(true);
        setErrorWork('');
        const apiUrl = `${getApiUrl()}/works/by-username/${username}`;
        console.log('尝试获取作品数据，API URL:', apiUrl); // 添加此行
        const response = await axios.get(apiUrl);
        const workData = response.data.data || response.data;
        if (workData && workData.content) {
          setWork(workData);
        } else {
          setWork(null);
          setErrorWork('该用户还没有公开的作品');
        }
      } catch (err: any) {
        setWork(null);
        if (isDevelopment()) {
          setWork({
            id: 0,
            content: defaultWorkContent,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          setErrorWork(''); //开发模式下清空错误
        } else {
          setErrorWork('获取作品失败');
        }
      }
      finally {
        setLoadingWork(false);
      }
    };
    fetchWork();
  }, [activeView, username]); // 依赖 activeView 和 username

  useEffect(() => {
    const fetchCategories = async () => {
      if (!username) return;
      
      try {
        const response = await axios.get<Category[]>(`/api/posts/public/categories/${username}`);
        if (Array.isArray(response.data)) {
          setCategories(response.data);
        } else {
          setCategories([]);
        }
      } catch (err) {
        // 错误处理
      }
    };

    if (username) {
      fetchCategories();
    }
  }, [username]);

  // Effect to update posts when category, page, or search changes
 

  // 获取作品数据
  useEffect(() => {
    const fetchWork = async () => {
      if (!username) {
        setErrorWork('未指定用户名');
        setLoadingWork(false);
        return;
      }
      try {
        setLoadingWork(true);
        const apiUrl = `${getApiUrl()}/works/by-username/${username}`;
        const response = await axios.get(apiUrl);
        const workData = response.data.data || response.data;
        if (workData && workData.content) {
          setWork(workData);
        } else {
          setErrorWork('该用户还没有公开的作品');
        }
      } catch (err: any) {
        if (isDevelopment()) {
          // Fallback for development
          setWork({
            id: 0,
            content: defaultWorkContent,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        } else {
          setErrorWork('获取作品失败');
        }
      }
      finally {
        setLoadingWork(false);
      }
    };
    fetchWork();
  }, [username]); // Dependency array includes username

  useEffect(() => {
    const fetchPosts = async () => {
      if (!username) return;
      
      try {
        setLoading(true);
        
        // 构建API路径
        const apiUrl = `${getApiUrl()}/posts/public/by-username/${username}`;
        
        // 设置API参数
        const params = {
          page: currentPage,
          limit: postsPerPage,
          category: selectedCategory,
          title: searchQuery
        };
        
        const response = await axios.get(apiUrl, { params });
        
        // 处理分页数据
        const paginationData = response.data;
        setPosts(paginationData?.items || []);
        setTotalPosts(paginationData?.meta?.total || 0);
        setTotalPages(paginationData?.meta?.totalPages || 1);
      } catch (err) {
        // 改进的错误处理
        console.error('API调用错误:', err);
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          // 404错误，用户不存在
          setError('用户不存在');
        } else if (axios.isAxiosError(err) && err.response) {
          // 服务器响应了错误状态码
          setError(`服务器错误: ${err.response.status}`);
        } else {
          // 网络错误或其他错误
          setError('网络连接失败，请检查网络连接');
        }
        setPosts([]);
        setTotalPosts(0);
        setTotalPages(0);
      } finally {
        setLoading(false);
      }
    };

    // 只在博客视图下加载文章
    if (activeView === 'blog') {
      fetchPosts();
    }
  }, [username, currentPage, postsPerPage, searchQuery, selectedCategory, activeView]);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set('title', inputValue); // Set 'title' param in URL
      newSearchParams.set('page', '1'); // Reset to page 1 on new search
      setSearchParams(newSearchParams);
      // State update will happen via useEffect listening to searchParams
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    // 当用户清空输入框时，自动重置搜索
    if (!e.target.value) {
      setSearchQuery('');
      setCurrentPage(1);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      setSelectedPost(null); // 切换页面时清空选中的文章
      window.scrollTo(0, 0);
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    setPostsPerPage(newSize);
    setCurrentPage(1); // 重置到第一页
    setSelectedPost(null); // 清空选中的文章
    window.scrollTo(0, 0);
  };

  const handlePostClick = (post: Post) => {
    setSelectedPost(post);
    window.scrollTo(0, 0);
  };
  
  // 处理导航点击
  const handleNavClick = (view: 'blog' | 'resume' | 'guestbook' | 'work', e: React.MouseEvent) => {
    e.preventDefault();
    setActiveView(view);
    setSelectedPost(null);
    if (view === 'guestbook') {
      fetchGuestbookMessages(guestbookCurrentPage, guestbookPageSize);
    }
  };

  // 获取用户信息
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!username) return;
      
      try {
        const response = await axios.get(`/api/users/public/${username}`);
        setUserInfo(response.data);
      } catch (error) {
        // 错误处理
        setError('用户不存在');
        navigate('/404');
      } finally {
        setLoadingUserInfo(false);
      }
    };

    fetchUserInfo();
  }, [username, navigate]);

  // --- Ad Panel Drag Logic --- 
  const handleAdDragStart = useCallback((e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!adPanelRef.current) return;
    // Set both state and ref
    setIsDraggingAd(true);
    isDraggingAdRef.current = true;
    adPanelRef.current.style.cursor = 'grabbing'; // Change cursor immediately

    const isTouchEvent = 'touches' in e;
    const clientX = isTouchEvent ? e.touches[0].clientX : e.clientX;
    const clientY = isTouchEvent ? e.touches[0].clientY : e.clientY;

    const rect = adPanelRef.current.getBoundingClientRect();

    // Calculate offset relative to the element's position, considering fixed right/bottom
    dragAdOffset.current = {
        x: rect.right - clientX, // How far is the cursor from the right edge
        y: rect.bottom - clientY // How far is the cursor from the bottom edge
    };

    if (isTouchEvent) {
        // Register touchmove as non-passive since we intend to call preventDefault
        window.addEventListener('touchmove', handleAdDragging, { passive: false });
        window.addEventListener('touchend', handleAdDragEnd);
         // Prevent default ONLY for touchstart on the ad panel
        // e.preventDefault(); // Keep this potentially, if scrolling interferes
    } else {
        window.addEventListener('mousemove', handleAdDragging);
        window.addEventListener('mouseup', handleAdDragEnd);
    }
  }, []);

  const handleAdDragging = useCallback((e: MouseEvent | TouchEvent) => {
    // Check ref instead of state
    if (!isDraggingAdRef.current || !adPanelRef.current) return;

    const isTouchEvent = 'touches' in e;
    // Prevent background scroll ONLY during touch-based dragging
    if (isTouchEvent) {
        e.preventDefault();
    }

    const clientY = isTouchEvent ? e.touches[0].clientY : e.clientY;

    // Calculate new bottom position based on cursor Y and initial offset
    let newBottom = window.innerHeight - clientY - dragAdOffset.current.y;

    // Ensure the ad panel stays within the vertical bounds of the viewport
    const adPanelHeight = adPanelRef.current.offsetHeight || 100; // Estimate height if needed
    newBottom = Math.max(0, Math.min(newBottom, window.innerHeight - adPanelHeight));

    // Update only the bottom position
    setAdPosition(prev => ({ ...prev, bottom: newBottom }));

}, [isDraggingAd]);

const handleAdDragEnd = useCallback(() => {
    // Check ref instead of state
    if (!isDraggingAdRef.current || !adPanelRef.current) return;
    // Set both ref and state back to false
    isDraggingAdRef.current = false;
    setIsDraggingAd(false);
    adPanelRef.current.style.cursor = 'grab';

    window.removeEventListener('mousemove', handleAdDragging);
    window.removeEventListener('mouseup', handleAdDragEnd);
    window.removeEventListener('touchmove', handleAdDragging);
    window.removeEventListener('touchend', handleAdDragEnd);

    // Save the final position (optional, if persistence is needed)
    // localStorage.setItem('adPanelPosition', JSON.stringify(adPosition));

  }, [isDraggingAd]);

  // Cleanup drag listeners
  useEffect(() => {
    return () => {
      if (isDraggingAd) {
        window.removeEventListener('mousemove', handleAdDragging);
        window.removeEventListener('mouseup', handleAdDragEnd);
        window.removeEventListener('touchmove', handleAdDragging);
        window.removeEventListener('touchend', handleAdDragEnd);
      }
    };
  }, [isDraggingAd, handleAdDragging, handleAdDragEnd]);

  // 添加留言簿分页处理函数
  const handleGuestbookPageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= guestbookTotalPages) {
      setGuestbookCurrentPage(newPage);
      window.scrollTo(0, 0); // 切换页面时滚动到顶部
    }
  };
  
  // 取消注释并实现处理每页数量变化的函数
  const handleGuestbookPageSizeChange = (newSize: number) => {
    setGuestbookPageSize(newSize);
    setGuestbookCurrentPage(1); // 重置到第一页
    window.scrollTo(0, 0);
    // fetchGuestbookMessages 会因为 guestbookPageSize 或 guestbookCurrentPage 变化而自动触发
  };

  // 如果需要改变每页数量的功能，可以添加此函数
  // const handleGuestbookPageSizeChange = (newSize: number) => {
  //   setGuestbookPageSize(newSize);
  //   setGuestbookCurrentPage(1); // 重置到第一页
  //   window.scrollTo(0, 0);
  // };

  // 如果正在加载，显示加载状态
  if (loadingUserInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // 如果有错误，显示错误信息
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold text-red-500 mb-4">{error}</h1>
        <Link to="/" className="text-blue-500 hover:text-blue-700">
          返回首页
        </Link>
      </div>
    );
  }

  if (loading && activeView === 'blog') {
    return <div style={{ color: 'white', textAlign: 'center', marginTop: '20px' }}>加载中...</div>;
  }

  if (error && activeView === 'blog') {
    return <div style={{ color: 'red', textAlign: 'center', marginTop: '20px' }}>{error}</div>;
  }

  function isHtmlContent(str: string) {
    return /<\s*img|<\s*a|<\s*div|<\s*span|<\s*p/i.test(str);
  }

  function splitContentByImgTags(content: string) {
    // 匹配 <img ... /> 标签，支持多行
    const imgTagRegex = /<img [^>]*src=["'][^"']+["'][^>]*>/gi;
    const parts: { type: 'img' | 'md', value: string }[] = [];
    let lastIndex = 0;
    let match;
    while ((match = imgTagRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'md', value: content.slice(lastIndex, match.index) });
      }
      parts.push({ type: 'img', value: match[0] });
      lastIndex = imgTagRegex.lastIndex;
    }
    if (lastIndex < content.length) {
      parts.push({ type: 'md', value: content.slice(lastIndex) });
    }
    return parts;
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#121212',
      color: '#999',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* 顶部导航栏 */}
      <div style={{
        borderBottom: '1px solid #333',
        backgroundColor: '#1a1a1a',
        padding: '10px 0',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}
      ref={headerRef}
      >
        <div style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 20px',
          boxSizing: 'border-box'
        }}>
          {/* 左侧导航链接 - 完全靠左, 窄屏时隐藏整个nav */}
          {!isPortrait && (
          <nav 
            ref={navRef}
            style={{
              display: 'flex',
              gap: '20px',
              marginRight: 'auto',
              paddingLeft: '0'
            }}
          >
                {/* Conditionally render these buttons only when not in portrait mode */}
                {!isPortrait && (
                   <>
            <a 
              href="#" 
              onClick={(e) => handleNavClick('blog', e)}
              style={{ 
                color: activeView === 'blog' ? '#fff' : '#999',
                textDecoration: 'none',
                fontSize: '20px',
                fontWeight: activeView === 'blog' ? '600' : 'normal'
              }}
            >
              博客
            </a>
            <a 
              href="#" 
              onClick={(e) => handleNavClick('resume', e)}
              style={{ 
                color: activeView === 'resume' ? '#fff' : '#999',
                textDecoration: 'none',
                fontSize: '20px',
                fontWeight: activeView === 'resume' ? '600' : 'normal'
              }}
            >
              个人简历
            </a>
            <a 
              href="#" 
              onClick={(e) => handleNavClick('guestbook', e)}
              style={{ 
                color: activeView === 'guestbook' ? '#fff' : '#999',
                textDecoration: 'none',
                fontSize: '20px',
                fontWeight: activeView === 'guestbook' ? '600' : 'normal'
              }}
            >
              留言簿
            </a>
            <a 
              href="#" 
              // 修改作品展示的点击事件，不进行路由跳转，只更新 activeView
              onClick={e => handleNavClick('work', e)}
              style={{ 
                color: activeView === 'work' ? '#fff' : '#999', // 根据 activeView 判断是否高亮
                textDecoration: 'none',
                fontSize: '20px',
                fontWeight: activeView === 'work' ? '600' : 'normal'
              }}
            >
              作品展示
            </a>
                   </>
                )}
          </nav>
          )}

          {/* 中间搜索框 - 窄屏靠左，宽屏绝对居中 */}
          <div style={{
            // Apply different styles based on isPortrait
            ...(isPortrait ? {
              // Portrait styles: default static positioning, align left
              marginLeft: '5px', // Set left margin to 5px
              marginRight: '30px' // Increase right margin for more space
            } : {
              // Landscape styles: absolute centering
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            }),
            // Common style
            width: `${searchWidth}px` // 使用动态计算的宽度
          }}>
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleSearch}
              placeholder="输入关键词搜索"
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: '#2a2a2a',
                border: '1px solid #333',
                borderRadius: '4px',
                color: '#fff',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>

          {/* 右侧用户信息 - 完全靠右 */}
          <div 
            ref={userInfoRef}
            style={{
              display: 'flex',
              alignItems: 'flex-end', // 改为底部对齐
              gap: '10px',
              marginLeft: 'auto'
            }}
          >
            {userInfo && (
              <>
                {/* 用户头像 */}
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#2a2a2a',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {userInfo.avatar ? (
                    <img 
                      src={fixImageUrl(userInfo.avatar)}
                      alt={userInfo.nickname || userInfo.username}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: '20px' }}>👤</span>
                  )}
                </div>
                {/* 用户信息/博客标题 */}
                <div style={{
                  height: '20px', // 头像高度的一半
                  color: '#ddd',
                  fontSize: '14px',
                  maxWidth: '200px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  lineHeight: '20px', // 确保文字垂直居中
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  {userInfo.bio || `${userInfo.nickname || userInfo.username}的博客`}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        gap: '20px'  // 只保留内部元素之间的间距
      }}>
        {/* 左侧面板 - 只在博客视图和非竖屏下显示 */}
        {activeView === 'blog' && !isPortrait && (
          <div style={{
            width: '240px', // 横屏固定宽度
            backgroundColor: '#1a1a1a',
            padding: '20px', // 横屏固定内边距
            color: 'white',
            height: 'calc(100vh - 120px)',
            position: 'sticky',
            top: '60px',
            borderRight: '1px solid #333',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px' // 横屏固定间距
          }}>
            {/* 全部文章 - 放在最上面 */}
            <div>
              <div 
                style={{ 
                  fontSize: '18px', // 横屏字体稍大
                  fontWeight: 'bold',
                  color: selectedCategory === null ? '#fff' : '#999',
                  cursor: 'pointer',
                  transition: 'color 0.2s'
                }}
                onClick={() => setSelectedCategory(null)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = selectedCategory === null ? '#fff' : '#999';
                }}
              >
                全部文章
              </div>
            </div>

            {/* 博客分类 */}
            <div>
              <h2 style={{ 
                fontSize: '18px', // 横屏字体稍大
                fontWeight: 'bold',
                color: '#fff',
                marginBottom: '16px' // 横屏上下间距稍大
              }}>
                博客分类
              </h2>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '8px' // 横屏间距稍大
              }}>
                {categories.map(category => (
                  <div 
                    key={category.id}
                    style={{ 
                      padding: '8px', // 横屏内边距稍大
                      cursor: 'pointer', 
                      borderRadius: '4px', 
                      transition: 'all 0.2s',
                      backgroundColor: selectedCategory === category.id ? '#2a2a2a' : 'transparent',
                      color: selectedCategory === category.id ? '#fff' : '#999',
                      fontSize: '16px', // 横屏字体更小
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                    onClick={() => setSelectedCategory(category.id)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#2a2a2a';
                      e.currentTarget.style.color = '#fff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = selectedCategory === category.id ? '#2a2a2a' : 'transparent';
                      e.currentTarget.style.color = selectedCategory === category.id ? '#fff' : '#999';
                    }}
                  >
                    {category.name}
                  </div>
                ))}
              </div>
            </div>
            
            {/* 广告组件 - 放在最后，自动推到底部 */}
            <LeftSidePanel />
          </div>
        )}
        
        {/* 移动端悬浮广告面板 - 直接在博客视图和竖屏下显示 */}
        {activeView === 'blog' && isPortrait && (
          <div 
            ref={adPanelRef}
            style={{
              position: 'fixed',
              right: isPortrait ? '0px' : `${adPosition.right}px`,
              bottom: `${adPosition.bottom}px`,
              zIndex: 1000,
              width: '200px', 
              maxHeight: 'calc(100vh - 150px)',
              overflowY: 'auto',
            }}
          >
            <LeftSidePanel onDragStart={handleAdDragStart} />
          </div>
        )}
        
        {/* 主内容区域 */}
        <div style={{ 
          flex: 1, 
          minWidth: 0  // 防止内容溢出
        }}>
          {/* 博客视图 */}
          {activeView === 'blog' && (
            <>
              {/* 文章详情区域 */}
              {selectedPost && (
                <div style={{
                  backgroundColor: '#1a1a1a',
                  padding: '30px',
                  borderRadius: '4px',
                  marginBottom: '30px'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px'
                  }}>
                    <h1 style={{
                      fontSize: '24px',
                      color: '#fff',
                      margin: 0
                    }}>
                      {selectedPost.title}
                    </h1>
                    <button
                      onClick={() => setSelectedPost(null)}
                      style={{
                        padding: '5px 10px',
                        backgroundColor: 'transparent',
                        border: '1px solid #333',
                        color: '#999',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      返回列表
                    </button>
                  </div>
                  <div 
                    style={{
                      color: '#bbb',
                      lineHeight: '1.8'
                    }}
                    dangerouslySetInnerHTML={{ 
                      __html: md.render(selectedPost.content)
                    }}
                  />
                </div>
              )}

              {/* 文章列表 */}
              {(!selectedPost || selectedPost === null) && (
                // 当没有博客时显示友好提示
                posts.length === 0 && !loading && !error ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    color: '#888',
                    backgroundColor: '#1a1a1a',
                    borderRadius: '8px',
                    margin: '20px 0'
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '20px' }}>📝</div>
                    <h3 style={{ color: '#fff', marginBottom: '10px' }}>暂无博客内容</h3>
                    <p style={{ marginBottom: '20px' }}>这里还没有发布任何博客文章</p>
                    <p style={{ fontSize: '14px', color: '#666' }}>请稍后再来查看，或者切换到其他功能模块</p>
                  </div>
                ) : (
                  // 正常的博客列表
                  posts.map((post) => {
                const firstImage = extractFirstImage(post.content);
                const contentWithoutImages = removeImages(post.content);
                const previewText = contentWithoutImages.substring(0, 200) + '...';

                return (
                  <div key={post.id} style={{
                    marginBottom: '30px',
                    backgroundColor: '#1a1a1a',
                    padding: '20px',
                    borderRadius: '4px',
                    height: '200px', // 修改为200px
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    {/* 博客标题 - 靠左显示 */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      marginBottom: '10px',
                      height: '30px', // 减小标题区域高度
                      overflow: 'hidden'
                    }}>
                      <h2 style={{
                        fontSize: '18px',
                        margin: 0,
                        textAlign: 'left',
                        display: '-webkit-box',
                        WebkitLineClamp: 1, // 标题只显示一行
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        <a 
                          onClick={() => handlePostClick(post)} 
                          style={{
                            color: '#4a9eff', 
                            textDecoration: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          {post.title}
                        </a>
                      </h2>
                    </div>
                    
                    {/* 文章预览区域 - 包含缩略图 */}
                    <div style={{ 
                      flex: 1,
                      overflow: 'hidden',
                      position: 'relative',
                      display: 'flex',
                      gap: '15px'
                    }}>
                      {/* 缩略图区域 */}
                      {firstImage && (
                        <div style={{
                          width: '120px',
                          height: '120px',
                          flexShrink: 0,
                          overflow: 'hidden',
                          borderRadius: '4px'
                        }}>
                          <img 
                            src={fixImageUrl(firstImage)} 
                            alt="缩略图"
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                        </div>
                      )}
                      
                      {/* 文本内容区域 */}
                      <div 
                        style={{ 
                          color: '#bbb',
                          lineHeight: '1.6',
                          fontSize: isPortrait ? '13px' : '14px',
                          flex: 1,
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 6, // 减少显示行数
                          WebkitBoxOrient: 'vertical'
                        }}
                        dangerouslySetInnerHTML={{ 
                          __html: md.render(previewText)
                        }}
                      />
                    </div>

                    {/* 横线分隔符 */}
                    <div style={{ borderBottom: '1px solid #333', marginBottom: '10px' }}></div>
                    
                    {/* 时间信息 - 放在横线下方 */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      color: '#777',
                      fontSize: '14px',
                      height: '20px'
                    }}>
                      <div>创建时间: {new Date(post.created_at).toLocaleString('zh-CN')}</div>
                      <div>更新时间: {new Date(post.updated_at).toLocaleString('zh-CN')}</div>
                    </div>
                  </div>
                );
              })
                )
              )}
              
              {/* 无搜索结果提示 */}
              {!loading && searchQuery && posts.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 0',
                  color: '#999'
                }}>
                  没有找到标题包含 "{searchQuery}" 的博客
                </div>
              )}
            </>
          )}
          
          {/* 留言簿视图 */}
          {activeView === 'guestbook' && (
            <div style={{ 
              padding: '20px', 
              maxWidth: '1200px', 
              margin: '0 auto',
              position: 'relative',
              paddingBottom: '80px', // 增加底部内边距，防止内容被固定分页栏遮挡
              minHeight: 'calc(100vh - 80px)' // 调整最小高度以适应固定底栏
            }}>
              {/* 留言展示区 - 网格布局 */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: '20px',
                marginBottom: '40px' // 与分页栏保持距离
              }}>
                {loadingGuestbook ? (
                  <div style={{ textAlign: 'center', gridColumn: '1 / -1', padding: '20px', color: '#999' }}>
                    加载留言中...
                  </div>
                ) : guestbookError ? (
                  <div style={{ textAlign: 'center', gridColumn: '1 / -1', padding: '20px', color: '#f66' }}>
                    {guestbookError}
                  </div>
                ) : guestbookEntries.length === 0 ? (
                  <div style={{ textAlign: 'center', gridColumn: '1 / -1', padding: '20px', color: '#999' }}>
                    还没有留言，快来留下第一条吧！
                  </div>
                ) : (
                  guestbookEntries.map((entry) => {
                    return (
                      <div 
                        key={entry.id} 
                        style={{
                          padding: '20px',
                          backgroundColor: entry.color || '#1a1a1a',
                          borderRadius: '8px',
                          minHeight: '150px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                          transition: 'transform 0.3s, box-shadow 0.3s',
                          cursor: 'default'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-5px)';
                          e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                        }}
                      >
                        <div>
                          <p style={{ 
                            margin: '0 0 15px 0', 
                            color: '#fff', 
                            lineHeight: '1.5',
                            wordBreak: 'break-word'
                          }}>
                            {entry.content}
                          </p>
                        </div>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'flex-end',
                          alignItems: 'center',
                          marginTop: '10px'
                        }}>
                          <span style={{ color: '#999', fontSize: '12px' }}>
                            {entry.date}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* 留言簿分页控件 - 固定在底部 */}
              {guestbookTotalMessages > 0 && (
                <div style={{
                  position: 'fixed',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  backgroundColor: '#1a1a1a', // 背景色与头部协调
                  padding: '10px 20px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  boxShadow: '0 -2px 10px rgba(0,0,0,0.3)', // 顶部阴影
                  zIndex: 99, // 确保在其他内容之上
                  flexWrap: 'wrap', // 窄屏时换行
                  gap: '10px' // 元素间距
                }}>
                  {/* 窄屏样式: 上一页/下一页 + 总数 */}
                  {isPortrait && (
                    <>
                      <button 
                        onClick={() => handleGuestbookPageChange(guestbookCurrentPage - 1)}
                        disabled={guestbookCurrentPage === 1}
                        style={buttonStyle(guestbookCurrentPage === 1)}
                      >
                        &lt;
                      </button>
                      <span style={{ color: '#fff', padding: '0 10px' }}>
                        第 {guestbookCurrentPage} / {guestbookTotalPages} 页
                      </span>
                      <button 
                        onClick={() => handleGuestbookPageChange(guestbookCurrentPage + 1)}
                        disabled={guestbookCurrentPage === guestbookTotalPages}
                        style={buttonStyle(guestbookCurrentPage === guestbookTotalPages)}
                      >
                        &gt;
                      </button>
                      <div style={{
                        backgroundColor: '#333',
                        color: '#ccc',
                        padding: '5px 15px',
                        borderRadius: '4px',
                        fontSize: '14px',
                        marginLeft: '15px'
                      }}>
                        共 {guestbookTotalMessages} 条
                      </div>
                    </>
                  )}
                  
                  {/* 宽屏样式: 完整分页 */}
                  {!isPortrait && (
                    <>
                      <button 
                        onClick={() => handleGuestbookPageChange(guestbookCurrentPage - 1)}
                        disabled={guestbookCurrentPage === 1}
                        style={buttonStyle(guestbookCurrentPage === 1)}
                      >
                        &lt; 上一页
                      </button>
                      
                      {renderPageNumbers(guestbookCurrentPage, guestbookTotalPages, handleGuestbookPageChange)} 

                      <button 
                        onClick={() => handleGuestbookPageChange(guestbookCurrentPage + 1)}
                        disabled={guestbookCurrentPage === guestbookTotalPages}
                        style={buttonStyle(guestbookCurrentPage === guestbookTotalPages)}
                      >
                        下一页 &gt;
                      </button>

                      <div style={{
                        backgroundColor: '#333',
                        color: '#ccc',
                        padding: '5px 15px',
                        borderRadius: '4px',
                        fontSize: '14px',
                        marginLeft: '15px' 
                      }}>
                        共 {guestbookTotalMessages} 条
                      </div>
                      
                      {/* 添加每页数量选择器 */}
                      <div style={{ 
                        marginLeft: '10px', 
                        display: 'flex',
                        alignItems: 'center' 
                      }}>
                        <select 
                          value={guestbookPageSize}
                          onChange={(e) => handleGuestbookPageSizeChange(parseInt(e.target.value, 10))}
                          style={{
                            padding: '5px 8px',
                            backgroundColor: '#333', // 匹配背景
                            border: '1px solid #555', // 边框颜色
                            color: '#ccc', // 文字颜色
                            borderRadius: '4px',
                            fontSize: '14px',
                            cursor: 'pointer',
                            outline: 'none',
                            marginLeft: '5px' // 与前面的元素保持间距
                          }}
                        >
                          <option value={8}>每页 8 条</option>
                          <option value={16}>每页 16 条</option>
                          <option value={24}>每页 24 条</option>
                          {/* 可以根据需要添加更多选项 */}
                        </select>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* 可折叠的留言输入框 */}
              <div style={{
                position: 'fixed',
                bottom: commentBoxOpen ? '70px' : '20px', // 向上移动一点，避免被底部分页栏遮挡
                right: '20px',
                zIndex: 100, // 比分页栏高一级
                width: commentBoxOpen ? '300px' : 'auto',
                transition: 'all 0.3s ease-in-out',
              }}>
                {commentBoxOpen ? (
                  <div style={{
                    backgroundColor: '#1a1a1a',
                    borderRadius: '8px',
                    padding: '15px',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                    animation: 'slideIn 0.3s ease-out',
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '10px'
                    }}>
                      <span style={{ color: '#fff', fontWeight: 'bold' }}>写留言</span>
                      <button 
                        style={{
                          backgroundColor: 'transparent',
                          border: 'none',
                          color: '#999',
                          cursor: 'pointer',
                          fontSize: '16px'
                        }}
                        onClick={() => setCommentBoxOpen(false)}
                      >
                        ×
                      </button>
                    </div>
                    
                    <form onSubmit={handleGuestbookSubmit}>
                      <div style={{ position: 'relative' }}>
                        <textarea
                          value={newEntry.content}
                          onChange={handleCommentInputChange}
                          placeholder="写下你的留言...(最多100字)"
                          style={{
                            width: '100%',
                            padding: '10px',
                            backgroundColor: '#333',
                            border: 'none',
                            color: '#fff',
                            borderRadius: '4px',
                            height: '100px',
                            resize: 'none',
                            marginBottom: '10px'
                          }}
                          required
                        />
                        <div style={{
                          position: 'absolute',
                          bottom: '15px',
                          right: '10px',
                          fontSize: '12px',
                          color: newEntry.content.length >= MAX_COMMENT_LENGTH * 0.9 
                            ? '#ff6b6b' // 接近限制时显示红色
                            : '#999',   // 正常状态显示灰色
                          backgroundColor: 'rgba(51, 51, 51, 0.8)', // 半透明背景
                          padding: '2px 6px',
                          borderRadius: '10px'
                        }}>
                          {newEntry.content.length}/{MAX_COMMENT_LENGTH}
                        </div>
                      </div>
                      <button
                        type="submit"
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#4a9eff',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          width: '100%',
                          fontWeight: 'bold'
                        }}
                      >
                        发布
                      </button>
                    </form>
                  </div>
                ) : (
                  <button
                    onClick={() => setCommentBoxOpen(true)}
                    style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '50%',
                      backgroundColor: '#4a9eff',
                      border: 'none',
                      color: 'white',
                      fontSize: '20px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                      transition: 'transform 0.2s, background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#3a8eff';
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#4a9eff';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    ✏️
                  </button>
                )}
              </div>

            </div>
          )}
          
          {/* 个人简历视图 - 使用ResumeView组件 */}
          {activeView === 'resume' && (
            <div style={{ width: '100%' }}>
              <ResumeView />
            </div>
          )}

          {/* 作品展示视图 */}
          {activeView === 'work' && (
            <div style={{
              backgroundColor: '#1a1a1a',
              padding: '30px',
              borderRadius: '8px',
              margin: '20px',
              color: '#ccc'
            }}>
              {loadingWork && <div style={{ textAlign: 'center' }}>加载作品中...</div>}
              {errorWork && <div style={{ color: 'red', textAlign: 'center' }}>{errorWork}</div>}
              {work && (
                <>
                  <div style={{ display: 'none' }}>{(() => { console.log('DirectSimplePage 作品展示 work.content:', work.content); return null; })()}</div>
                  <div style={{ lineHeight: '1.8' }}>
                    {splitContentByImgTags(work.content).map((part, idx) =>
                      part.type === 'img' ? (
                        <span key={idx} dangerouslySetInnerHTML={{ __html: part.value }} />
                      ) : (
                        <span key={idx} dangerouslySetInnerHTML={{ __html: md.render(part.value) }} />
                      )
                    )}
                  </div>
                  <div style={{
                    marginTop: '30px',
                    paddingTop: '20px',
                    borderTop: '1px solid #333',
                    display: 'flex',
                    justifyContent: 'space-between',
                    color: '#777',
                    fontSize: '14px'
                  }}>
                    <div>最后更新时间: {new Date(work.updated_at).toLocaleString('zh-CN')}</div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 分页 - 固定在底部 */} 
      {activeView === 'blog' && !selectedPost && posts.length > 0 && (
        <div style={{
          position: 'sticky', // 改为 sticky
          bottom: 0,       // 粘在底部
          left: 0,
          width: '100%',      // 宽度 100%
          borderTop: '1px solid #333',
          backgroundColor: '#1a1a1a', // 背景色与主题匹配
          padding: '15px 0',
          zIndex: 50          // 确保在内容之上
        }}>
          <div style={{
            display: 'flex',
            flexWrap: isPortrait ? 'wrap' : 'nowrap', // 窄屏时允许换行
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0 20px'
          }}>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              style={{
                padding: '6px 10px', // 稍微调整padding
                backgroundColor: 'transparent',
                border: '1px solid #333',
                color: currentPage === 1 ? '#666' : '#999',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                borderRadius: '3px',
                transition: 'all 0.2s'
              }}
              aria-label="上一页"
            >
              {isPortrait ? (
                <span style={{ fontWeight: 'bold', color: currentPage === 1 ? '#666' : '#4a9eff' }}>&lt;</span>
              ) : (
                '上一页'
              )}
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // 计算要显示的页码，确保当前页码靠近中间
              let pageToShow = i + 1;
              if (totalPages > 5) {
                if (currentPage <= 3) {
                  pageToShow = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageToShow = totalPages - 4 + i;
                } else {
                  pageToShow = currentPage - 2 + i;
                }
              }
              
              // 确保页码在有效范围内
              if (pageToShow <= totalPages && pageToShow > 0) {
                return (
                  <button
                    key={pageToShow}
                    onClick={() => handlePageChange(pageToShow)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: currentPage === pageToShow ? 
                        '#4a9eff' : 
                        'transparent',
                      border: `1px solid ${currentPage === pageToShow ? 
                        '#4a9eff' : 
                        '#333'}`,
                      color: currentPage === pageToShow ? 
                        '#fff' : 
                        '#999',
                      cursor: 'pointer',
                      borderRadius: '3px',
                      minWidth: '32px',
                      transition: 'all 0.2s'
                    }}
                  >
                    {pageToShow}
                  </button>
                );
              }
              return null;
            })}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={{
                padding: '6px 10px',
                backgroundColor: 'transparent',
                border: '1px solid #333',
                color: currentPage === totalPages ? '#666' : '#999',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                borderRadius: '3px',
                transition: 'all 0.2s'
              }}
              aria-label="下一页"
            >
              {isPortrait ? (
                <span style={{ fontWeight: 'bold', color: currentPage === totalPages ? '#666' : '#4a9eff' }}>&gt;</span>
              ) : (
                '下一页'
              )}
            </button>
            
            {/* 添加显示博客总数的信息框 - 窄屏时简化文字 */}
            <div style={{
              marginLeft: '15px',
              padding: '6px 12px',
              backgroundColor: 'rgba(74, 158, 255, 0.1)',
              border: '1px solid #333',
              color: '#999',
              borderRadius: '3px',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              共 {totalPosts} 篇{isPortrait ? '' : '博客'} {/* 窄屏时省略'博客' */} 
            </div>
            
            {/* 显示当前页码/总页数的控件 - 窄屏时隐藏 */} 
            {!isPortrait && (
            <div style={{
              marginLeft: '10px',
              padding: '6px 12px',
              backgroundColor: 'rgba(74, 158, 255, 0.1)',
              border: '1px solid #333',
              color: '#999',
              borderRadius: '3px',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              第 {currentPage}/{totalPages} 页
            </div>
            )}
            
            {/* 每页显示数量选择器 - 窄屏时隐藏 */}
            {!isPortrait && (
            <div style={{
              marginLeft: '10px',
              display: 'flex',
              alignItems: 'center',
              color: '#999',
              fontSize: '14px'
            }}>
                <span style={{ marginRight: '5px' }}>每页:</span> {/* 宽屏时显示文字 */}
              <select
                value={postsPerPage}
                onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
                style={{
                  padding: '6px 8px',
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #333',
                  color: '#999',
                  borderRadius: '3px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="15">15</option>
                <option value="20">20</option>
              </select>
            </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// 辅助函数：分页按钮样式
const buttonStyle = (disabled: boolean) => ({
  padding: '5px 15px',
  margin: '0 5px',
  backgroundColor: disabled ? '#444' : '#555',
  color: disabled ? '#888' : '#fff',
  border: 'none',
  borderRadius: '4px',
  cursor: disabled ? 'not-allowed' : 'pointer',
  transition: 'background-color 0.2s'
});

// 辅助函数：渲染页码按钮 (简化版，只显示当前页前后几页和首尾页)
const renderPageNumbers = (currentPage: number, totalPages: number, onPageChange: (page: number) => void) => {
  const pageNumbers = [];
  const maxPagesToShow = 5; // 最多显示 5 个页码按钮（含省略号）
  const pageBuffer = 2; // 当前页前后各显示多少页

  if (totalPages <= maxPagesToShow) {
    // 总页数不多，全部显示
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(
        <button 
          key={i} 
          onClick={() => onPageChange(i)}
          style={{
            ...buttonStyle(false),
            backgroundColor: i === currentPage ? '#4a9eff' : '#555',
          }}
        >
          {i}
        </button>
      );
    }
  } else {
    // 总页数较多，部分显示
    pageNumbers.push(
      <button 
        key={1} 
        onClick={() => onPageChange(1)}
        style={{
          ...buttonStyle(false),
          backgroundColor: 1 === currentPage ? '#4a9eff' : '#555',
        }}
      >
        1
      </button>
    );

    if (currentPage > pageBuffer + 2) {
      pageNumbers.push(<span key="start-ellipsis" style={{ color: '#999', margin: '0 5px' }}>...</span>);
    }

    const startPage = Math.max(2, currentPage - pageBuffer);
    const endPage = Math.min(totalPages - 1, currentPage + pageBuffer);

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <button 
          key={i} 
          onClick={() => onPageChange(i)}
          style={{
            ...buttonStyle(false),
            backgroundColor: i === currentPage ? '#4a9eff' : '#555',
          }}
        >
          {i}
        </button>
      );
    }

    if (currentPage < totalPages - pageBuffer - 1) {
      pageNumbers.push(<span key="end-ellipsis" style={{ color: '#999', margin: '0 5px' }}>...</span>);
    }

    pageNumbers.push(
      <button 
        key={totalPages} 
        onClick={() => onPageChange(totalPages)}
        style={{
          ...buttonStyle(false),
          backgroundColor: totalPages === currentPage ? '#4a9eff' : '#555',
        }}
      >
        {totalPages}
      </button>
    );
  }

  return pageNumbers;
};

export default DirectSimplePage; 