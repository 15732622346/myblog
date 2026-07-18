import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import SimpleLayout from './SimpleLayout';
import SimpleBlogPost from './SimpleBlogPost';

interface Post {
  id: number;
  title: string;
  content: string;
  created_at: string;
  view_count: number;
}

const SimplePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 模拟数据加载
    setTimeout(() => {
      setPosts([
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
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const renderContent = () => {
    if (loading) {
      return <div className="text-center py-8">正在加载...</div>;
    }

    if (posts.length === 0) {
      return <div className="text-center py-8">暂无文章</div>;
    }

    return (
      <div>
        {posts.map(post => (
          <SimpleBlogPost
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
    <SimpleLayout 
      blogTitle={username ? `${username}的博客` : "段永平的博客"}
      blogSubtitle="弄弄道路即可跑起來，这里是一字千金好但貴定制的。"
    >
      {renderContent()}
    </SimpleLayout>
  );
};

export default SimplePage; 