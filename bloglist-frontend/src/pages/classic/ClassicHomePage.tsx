import React, { useState, useEffect } from 'react';
import { Post } from '../../types/post';
import { Link } from 'react-router-dom';
import ClassicLayout from '../../components/classic-layout/ClassicLayout';
import BlogPost from '../../components/classic-layout/BlogPost';
import { postsApi } from '../../services/api';
import './ClassicHomePage.css';

// 提取示例数据为单独的常量
const EXAMPLE_POSTS: Post[] = [
  {
    id: 1,
    title: '2020年08月06日',
    content: 'Test',
    created_at: '2020-8-5 23:18:04',
    view_count: 195
  },
  {
    id: 2,
    title: '2018年12月7日',
    content: 'test',
    created_at: '2018-12-7 13:35:59',
    view_count: 0
  },
  {
    id: 3,
    title: '老虎回来了！',
    content: '老虎回来了！',
    created_at: '2018-9-24 5:51:59',
    view_count: 6
  }
];

const ClassicHomePage: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        // 这里使用示例数据，您可以替换为实际API调用
        // const response = await postsApi.getPosts();
        // setPosts(response.data.items);
        
        // 使用提取的示例数据
        setPosts(EXAMPLE_POSTS);
      } catch (err) {
        console.error('Error fetching posts:', err);
        setError('加载文章失败，请稍后再试');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
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

  const renderContent = () => {
    if (loading) {
      return <div className="text-center py-8">正在加载...</div>;
    }

    if (error) {
      return <div className="text-center py-8 text-red-500">{error}</div>;
    }

    if (posts.length === 0) {
      return <div className="text-center py-8">暂无文章</div>;
    }

    return (
      <div>
        {posts.map(post => (
          <BlogPost
            key={post.id}
            title={post.title}
            date={post.created_at}
            content={post.content}
            views={post.view_count}
            link={`/post/${post.id}`}
          />
        ))}
      </div>
    );
  };

  return (
    <ClassicLayout>
      {renderContent()}
    </ClassicLayout>
  );
};

export default ClassicHomePage; 