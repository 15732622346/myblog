import { Link } from 'react-router-dom';
import { isDevelopment, getPort } from '../utils/env';

const NotFound = () => {
  // 使用环境变量获取端口号,保证在不同环境下都能正确运行
  const port = isDevelopment() 
    ? getPort() || '5173' 
    : ''; // 生产环境不显示端口
  
  // 构建示例URL
  const exampleBaseUrl = port ? `*******:${port}` : '*******';
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#1a1f29',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <div style={{
        maxWidth: '32rem',
        width: '90%',
        backgroundColor: '#2a2f3a',
        borderRadius: '0.75rem',
        padding: '2rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{
            fontSize: '1.875rem',
            fontWeight: 'bold',
            color: '#fff',
            marginBottom: '1.5rem'
          }}>
            请在链接末尾添加正确的用户名
          </h1>
          <p style={{
            color: '#9ca3af',
            marginBottom: '1.5rem'
          }}>
            正确的访问格式：<br />
            <code style={{
              padding: '0.25rem 0.5rem',
              backgroundColor: '#374151',
              borderRadius: '0.25rem',
              color: '#60a5fa',
              fontSize: '0.875rem'
            }}>
              {exampleBaseUrl}/您要访问的用户名
            </code>
          </p>
          <p style={{
            color: '#9ca3af',
            fontSize: '0.875rem'
          }}>
            例如：如果您要用户名是 "lijiangtao1"，<br />
            请访问：<code style={{
              padding: '0.25rem 0.5rem',
              backgroundColor: '#374151',
              borderRadius: '0.25rem',
              color: '#60a5fa',
              fontSize: '0.875rem'
            }}>
              {exampleBaseUrl}/lijiangtao1
            </code>
          </p>
        </div>
        
        <div style={{
          marginTop: '2rem',
          textAlign: 'center'
        }}>
          <button 
            onClick={() => window.location.reload()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              background: 'linear-gradient(to right, #2563eb, #7c3aed)',
              color: '#fff',
              fontWeight: '500',
              transition: 'all 0.3s ease',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <svg style={{
              width: '1.25rem',
              height: '1.25rem',
              marginRight: '0.5rem'
            }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            刷新重试
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound; 