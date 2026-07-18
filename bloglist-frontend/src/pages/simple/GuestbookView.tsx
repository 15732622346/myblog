import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

interface GuestbookEntry {
  id: number;
  author: string;
  content: string;
  date: string;
}

const GuestbookView: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const [entries, setEntries] = useState<GuestbookEntry[]>([
    {
      id: 1,
      author: "张三",
      content: "这是一个很棒的博客！",
      date: "2024-04-01"
    },
    {
      id: 2,
      author: "李四",
      content: "学习了，感谢分享！",
      date: "2024-04-01"
    }
  ]);

  const [newEntry, setNewEntry] = useState({
    author: "",
    content: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntry.author || !newEntry.content) return;

    const entry: GuestbookEntry = {
      id: entries.length + 1,
      author: newEntry.author,
      content: newEntry.content,
      date: new Date().toISOString().split('T')[0]
    };

    setEntries([entry, ...entries]);
    setNewEntry({ author: "", content: "" });
  };

  return (
    <div style={{ 
      backgroundColor: '#111',
      color: '#fff',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* 头部 */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid #333',
        marginBottom: '20px'
      }}>
        <h1 style={{ margin: 0, fontSize: '24px', marginBottom: '10px' }}>
          {username}的博客
        </h1>
        <p style={{ margin: 0, color: '#999', fontSize: '14px' }}>
          弄弄道路即可跑起來，这里是一字千金好但貴定制的。
        </p>
      </div>

      {/* 导航 */}
      <div style={{ 
        padding: '0 20px',
        marginBottom: '30px'
      }}>
        <ul style={{ 
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'flex',
          gap: '20px'
        }}>
          <li>
            <Link to={`/${username}`} style={{ color: '#999', textDecoration: 'none' }}>博客</Link>
          </li>
          <li>
            <Link to={`/${username}/resume`} style={{ color: '#999', textDecoration: 'none' }}>个人简历</Link>
          </li>
          <li>
            <Link to={`/${username}/guestbook`} style={{ color: '#fff', textDecoration: 'none' }}>留言</Link>
          </li>
        </ul>
      </div>

      {/* 主内容 */}
      <div style={{ padding: '0 20px', maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{ 
          borderBottom: '1px solid #333',
          paddingBottom: '10px',
          marginBottom: '20px',
          fontSize: '20px'
        }}>
          留言板
        </h2>

        {/* 留言表单 */}
        <form onSubmit={handleSubmit} style={{
          marginBottom: '40px',
          padding: '20px',
          backgroundColor: '#1a1a1a',
          borderRadius: '4px'
        }}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '5px',
              fontSize: '14px',
              color: '#ccc'
            }}>
              昵称
            </label>
            <input
              type="text"
              value={newEntry.author}
              onChange={(e) => setNewEntry({ ...newEntry, author: e.target.value })}
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: '#333',
                border: 'none',
                color: '#fff',
                borderRadius: '4px'
              }}
              required
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '5px',
              fontSize: '14px',
              color: '#ccc'
            }}>
              留言内容
            </label>
            <textarea
              value={newEntry.content}
              onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: '#333',
                border: 'none',
                color: '#fff',
                borderRadius: '4px',
                height: '100px',
                resize: 'vertical'
              }}
              required
            />
          </div>
          <button
            type="submit"
            style={{
              padding: '8px 16px',
              backgroundColor: '#333',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'background-color 0.3s'
            }}
          >
            发表留言
          </button>
        </form>

        {/* 留言列表 */}
        <div>
          {entries.map((entry) => (
            <div 
              key={entry.id} 
              style={{
                marginBottom: '20px',
                padding: '15px',
                backgroundColor: '#1a1a1a',
                borderRadius: '4px'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '10px'
              }}>
                <h3 style={{ 
                  margin: 0, 
                  color: '#fff',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}>
                  {entry.author}
                </h3>
                <span style={{ color: '#666', fontSize: '14px' }}>
                  {entry.date}
                </span>
              </div>
              <p style={{ margin: 0, color: '#ccc', lineHeight: '1.5' }}>
                {entry.content}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 页脚 */}
      <div style={{
        marginTop: '50px',
        padding: '20px',
        borderTop: '1px solid #333',
        textAlign: 'center',
        color: '#666',
        fontSize: '14px'
      }}>
        © 2024 博客系统. 保留所有权利.
      </div>
    </div>
  );
};

export default GuestbookView; 