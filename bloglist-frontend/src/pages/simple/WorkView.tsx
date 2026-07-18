import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { getApiUrl, isDevelopment } from '../../utils/env';

interface Work {
  id: number;
  content: string;
  created_at: string;
  updated_at: string;
}

const defaultWorkContent = `# 个人作品

这里是我的代表作品。
`;

function isHtmlContent(str: string) {
  return /<\s*img|<\s*a|<\s*div|<\s*span|<\s*p/i.test(str);
}

const WorkView: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const [work, setWork] = useState<Work | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  console.log('WorkView 渲染了');

  useEffect(() => {
    const fetchWork = async () => {
      if (!username) {
        setError('未指定用户名');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        // 获取作品内容
        const apiUrl = `${getApiUrl()}/works/by-username/${username}`;
        console.log('请求作品API:', apiUrl);
        const response = await axios.get(apiUrl);
        const workData = response.data.data || response.data;
        console.log('接口返回 workData:', workData);
        if (workData && workData.content) {
          setWork(workData);
          console.log('setWork 执行，内容类型:', typeof workData.content, '内容:', workData.content);
        } else {
          setError('该用户还没有公开的作品');
        }
      } catch (err: any) {
        if (isDevelopment()) {
          setWork({
            id: 0,
            content: defaultWorkContent,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          console.log('开发模式下使用默认内容:', defaultWorkContent);
        } else {
          setError('获取作品失败');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchWork();
  }, [username]);

  if (loading) {
    return (
      <div style={{ 
        backgroundColor: '#1a1a1a', 
        padding: '30px', 
        borderRadius: '8px',
        margin: '20px',
        color: '#ccc',
        textAlign: 'center' 
      }}>
        <div>加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        backgroundColor: '#1a1a1a', 
        padding: '30px', 
        borderRadius: '8px',
        margin: '20px',
        color: '#ccc',
        textAlign: 'center'
      }}>
        <h2 style={{ color: 'white', marginBottom: '20px' }}>很抱歉</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (work) {
    // 日志输出内容，排查是否被转义
    console.log('work.content 原始内容:', work.content);
  }

  return (
    <div style={{ 
      backgroundColor: '#1a1a1a', 
      padding: '30px', 
      borderRadius: '8px',
      margin: '20px',
      color: '#ccc'
    }}>
      <h2 style={{ borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '20px', fontSize: '20px', color: '#fff' }}>
        作品展示
      </h2>
      <div style={{ lineHeight: '1.8' }}>
        {work && isHtmlContent(work.content) ? (
          <div dangerouslySetInnerHTML={{ __html: work.content }} />
        ) : (
          <ReactMarkdown rehypePlugins={[rehypeRaw, rehypeSanitize]}>
            {work ? work.content : ''}
          </ReactMarkdown>
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
        <div>最后更新时间: {work ? new Date(work.updated_at).toLocaleString('zh-CN') : ''}</div>
      </div>
    </div>
  );
};

export default WorkView; 