import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom'; // Import useLocation, remove useParams
import axios from 'axios'; // Import axios
import { getApiUrl } from '../utils/env'; // Import getApiUrl

interface Position {
  top: number;
  left: number;
}

// Define Category interface (copy from DirectSimplePage or define globally)
interface Category {
  id: number;
  name: string;
}

const FloatingMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<Position>({ top: 70, left: 10 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const [isPortrait, setIsPortrait] = useState(window.innerWidth < window.innerHeight);

  // State for categories, loading, and error
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(false);
  const [errorCategories, setErrorCategories] = useState<string | null>(null);

  // Get location object
  const location = useLocation();
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);

  // Extract username from path whenever location changes - UPDATED LOGIC
  useEffect(() => {
    // const pathParts = location.pathname.split('/');
    // if (pathParts.length >= 3 && pathParts[1] === 'simple') { ... }
    const path = location.pathname;
    const pathParts = path.substring(1).split('/'); // Remove leading '/' and split

    // Check if path has exactly one part (the username) and it's not a reserved path
    if (pathParts.length === 1 && pathParts[0] && pathParts[0] !== '404' && pathParts[0] !== 'classic' && pathParts[0] !== 'simple' && pathParts[0] !== 'categories' && pathParts[0] !== 'archives') {
        const usernameFromPath = pathParts[0];
        // Basic validation (can be improved)
        if (/^[a-zA-Z0-9_-]+$/.test(usernameFromPath)) {
            setCurrentUsername(usernameFromPath);
        } else {
            setCurrentUsername(null); // Invalid username format
        }
    } else if (pathParts.length === 2 && pathParts[1] === 'resume') {
        // Handle /:username/resume case
        const usernameFromPath = pathParts[0];
         if (usernameFromPath && /^[a-zA-Z0-9_-]+$/.test(usernameFromPath)) {
            setCurrentUsername(usernameFromPath);
        } else {
            setCurrentUsername(null);
        }
    } else {
        setCurrentUsername(null); // Not a recognized user page path
    }
  }, [location.pathname]);

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

  // Fetch categories ONLY when we have a valid username
  useEffect(() => {
    const fetchCategories = async () => {
      if (!currentUsername) {
        setCategories([]); // Clear categories if no user
        setLoadingCategories(false);
        setErrorCategories(null);
        return; // Do not fetch if no username
      }

      console.log(`Fetching categories for user: ${currentUsername}`);
      setLoadingCategories(true);
      setErrorCategories(null);
      try {
        const apiUrl = `${getApiUrl()}/posts/public/categories/${currentUsername}`;
        const response = await axios.get<Category[]>(apiUrl);
        setCategories(response.data);
      } catch (err) {
        console.error(`获取用户 ${currentUsername} 的分类失败:`, err);
        setErrorCategories("获取分类失败");
        setCategories([]); // Clear categories on error
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, [currentUsername]); // Re-fetch ONLY when currentUsername changes

  // Load position from localStorage on mount
  useEffect(() => {
    const savedPosition = localStorage.getItem('floatingMenuPosition');
    if (savedPosition) {
      try {
        setPosition(JSON.parse(savedPosition));
      } catch (e) {
        console.error('Failed to parse saved menu position:', e);
        // Use default if parsing fails
        localStorage.removeItem('floatingMenuPosition'); // Clear invalid data
      }
    }
  }, []);

  // Save position to localStorage when drag ends
  const savePosition = useCallback((newPosition: Position) => {
    localStorage.setItem('floatingMenuPosition', JSON.stringify(newPosition));
  }, []);

  // --- Drag Logic --- (Similar to ad panel, applied to the button part) ---
  const handleDragStart = useCallback((e: React.MouseEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>) => {
    // console.log('handleDragStart triggered. menuRef:', menuRef.current);
    if (!menuRef.current) {
       // console.log('menuRef is null, exiting handleDragStart');
       return;
    }
    // Set both state (for render) and ref (for sync check)
    setIsDragging(true);
    isDraggingRef.current = true;

    const isTouchEvent = 'touches' in e;
    const clientX = isTouchEvent ? e.touches[0].clientX : e.clientX;
    const clientY = isTouchEvent ? e.touches[0].clientY : e.clientY;

    const rect = menuRef.current.getBoundingClientRect();
    dragOffset.current = { x: clientX - rect.left, y: clientY - rect.top };

    if (isTouchEvent) {
      // Register touchmove as non-passive
      window.addEventListener('touchmove', handleDragging, { passive: false });
      window.addEventListener('touchend', handleDragEnd);
    } else {
      window.addEventListener('mousemove', handleDragging);
      window.addEventListener('mouseup', handleDragEnd);
    }
    // Re-add preventDefault ONLY for touch events in handleDragStart
    // FIX: Remove preventDefault for touchstart as well, to eliminate the warning source.
    // if (isTouchEvent) {
    //   e.preventDefault(); // Prevent default scroll/zoom on touch
    // }
  }, []);

  const handleDragging = useCallback((e: MouseEvent | TouchEvent) => {
    // Check the ref instead of the state to avoid stale closure issues
    // console.log('handleDragging triggered. isDragging state:', isDragging, 'isDraggingRef:', isDraggingRef.current);
    if (!isDraggingRef.current) return;

    const isTouchEvent = 'touches' in e;
    // Prevent background scroll for touch events
    if (isTouchEvent) {
      e.preventDefault();
    }

    const clientX = isTouchEvent ? e.touches[0].clientX : e.clientX;
    const clientY = isTouchEvent ? e.touches[0].clientY : e.clientY;

    let newLeft = clientX - dragOffset.current.x;
    let newTop = clientY - dragOffset.current.y;

    const menuWidth = menuRef.current?.offsetWidth || 150; // Estimate width
    const menuHeight = menuRef.current?.offsetHeight || 50; // Estimate height
    newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - menuWidth));
    newTop = Math.max(0, Math.min(newTop, window.innerHeight - menuHeight));

    // console.log('Calculated new position:', { top: newTop, left: newLeft });
    setPosition({ top: newTop, left: newLeft });

    // FIX: Remove preventDefault from touchmove handler to avoid passive listener violation
    // if (isTouchEvent) e.preventDefault();

  }, [isDragging]); // Keep isDragging state dependency for potential cursor/style updates

  const handleDragEnd = useCallback(() => {
    // console.log('handleDragEnd triggered. isDragging state:', isDragging, 'isDraggingRef:', isDraggingRef.current);
    // Check ref to ensure drag was actually started
    if (!isDraggingRef.current) return;
    // Set both ref and state back to false
    isDraggingRef.current = false;
    setIsDragging(false);

    window.removeEventListener('mousemove', handleDragging);
    window.removeEventListener('mouseup', handleDragEnd);
    window.removeEventListener('touchmove', handleDragging);
    window.removeEventListener('touchend', handleDragEnd);

    // Use a stable ref to get the latest position for saving
    if (menuRef.current) {
        const finalRect = menuRef.current.getBoundingClientRect();
        savePosition({ top: finalRect.top, left: finalRect.left });
    }

  }, [handleDragging, savePosition]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (isDragging) {
        window.removeEventListener('mousemove', handleDragging);
        window.removeEventListener('mouseup', handleDragEnd);
        window.removeEventListener('touchmove', handleDragging);
        window.removeEventListener('touchend', handleDragEnd);
      }
    };
  }, [isDragging, handleDragging, handleDragEnd]);

  // --- End Drag Logic ---

  // Only render the menu in portrait mode
  if (!isPortrait) {
    return null;
  }

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 1010, // High z-index to be on top
        backgroundColor: 'rgba(173, 216, 230, 0.9)', // Changed to light blue (lightblue with alpha)
        borderRadius: '4px',
        border: '1px solid #555',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none'
      }}
    >
      {/* Draggable Button/Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseDown={handleDragStart} // Attach drag start here
        onTouchStart={handleDragStart}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '8px 12px',
          background: 'none',
          border: 'none',
          color: 'black',
          cursor: 'inherit', // Inherit grab/grabbing cursor
          textAlign: 'left'
        }}
      >
        <span>全局菜单</span>
        {/* Arrow Icon - changes based on isOpen */}
        <span style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: 'black' }}>
          ▶
        </span>
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          style={{
            padding: '12px',
            borderTop: '1px solid #555',
            minWidth: '150px',
            color: 'black'
          }}
          // Prevent drag from starting on the panel content
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          {/* "All Posts" link - only makes sense if on a user page */}
          {currentUsername && (
            <div style={{ marginBottom: '8px' }}>
              <Link
                to={`/${currentUsername}`}
                style={{ color: 'black', textDecoration:'none', fontWeight: 'bold' }}
                onClick={() => {
                  // TODO: Clear category selection (needs state management or callback)
                  setIsOpen(false); // Close menu
                }}
              >
                全部文章
              </Link>
            </div>
          )}

          {/* Add separator below "All Posts" if categories are shown */}
          {currentUsername && categories.length > 0 && (
             <div style={{ borderTop: '1px solid #555', margin: '12px 0' }}></div>
          )}

          {/* Dynamic Category List - only show if on a user page */}
          {currentUsername ? (
            <div>
              <strong style={{ color: 'black' }}>博客分类</strong>
              {loadingCategories && <div style={{ color: 'black', fontSize: '0.9em', marginTop: '5px' }}>加载中...</div>}
              {errorCategories && <div style={{ color: 'red', fontSize: '0.9em', marginTop: '5px' }}>{errorCategories}</div>}
              {!loadingCategories && !errorCategories && categories.length === 0 && (
                <div style={{ color: 'grey', fontSize: '0.9em', marginTop: '5px' }}>{errorCategories ? '加载失败' : '暂无分类'}</div>
              )}
              {!loadingCategories && !errorCategories && categories.length > 0 && (
                <ul style={{ listStyle: 'none', paddingLeft: '10px', marginTop: '5px' }}>
                  {categories.map(category => (
                    <li key={category.id}>
                      <Link
                        // Link to the user page with category query param
                        to={`/${currentUsername}?category=${category.id}`}
                        style={{ color: 'black', textDecoration:'none' }}
                        onClick={() => {
                          // TODO: Set category selection (needs state management or callback)
                          setIsOpen(false); // Close menu
                        }}
                      >
                        {category.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <div style={{ color: 'grey', fontSize: '0.9em', marginTop: '5px' }}>
              请先进入用户的博客页面查看分类。
            </div>
          )}

          {/* Add Resume and Guestbook links if on a user page */}
          {currentUsername && (
            <>
              <div style={{ borderTop: '1px solid #555', margin: '12px 0' }}></div> {/* Separator */}
              <div style={{ marginBottom: '8px' }}>
                <Link
                  to={`/${currentUsername}?view=resume`}
                  style={{ color: 'black', textDecoration:'none', fontWeight: 'bold' }}
                  onClick={() => setIsOpen(false)} // Close menu
                >
                  个人简历
                </Link>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <Link
                  to={`/${currentUsername}?view=guestbook`}
                  style={{ color: 'black', textDecoration: 'none', fontWeight: 'bold' }}
                  onClick={() => setIsOpen(false)}
                >
                  留言簿
                </Link>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <Link
                  to={`/${currentUsername}?view=work`}
                  style={{ color: 'black', textDecoration: 'none', fontWeight: 'bold' }}
                  onClick={() => setIsOpen(false)}
                >
                  作品展示
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default FloatingMenu; 