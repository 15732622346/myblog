import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import MarkdownIt from 'markdown-it';
import { getApiUrl, isDevelopment } from '../../utils/env';

interface Resume {
  id: number;
  content: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

// 创建默认的简历内容
const defaultResumeContent = `# 个人简历

## 基本信息
- 姓名：
- 邮箱：
- 电话：
- 求职意向：

## 教育背景
- **大学名称** (2020-2024)
  - 专业：
  - GPA：

## 工作经历
- **公司名称** (2020-至今)
  - 职位：
  - 工作描述：

## 专业技能
- 编程语言：
- 框架：
- 工具：
- 语言能力：

## 项目经历
- **项目名称**
  - 技术栈：
  - 描述：
  - 成果：

## 自我评价

`;

const md = new MarkdownIt();

const ResumeView: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const [resume, setResume] = useState<Resume | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [downloading, setDownloading] = useState(false);

  // 在组件加载时清除本地存储的简历数据
  useEffect(() => {
    localStorage.removeItem('resume');
  }, []);

  useEffect(() => {
    const fetchResume = async () => {
      if (!username) {
        setError('未指定用户名');
        setLoading(false);
        setDebugInfo('路由参数中没有用户名');
        return;
      }

      setDebugInfo(`尝试获取用户 ${username} 的简历`);
      
      try {
        setLoading(true);
        
        // 尝试从API获取简历数据
        try {
          // 构建正确的API路径
          const apiUrl = `${getApiUrl()}/resumes/public/${username}`;
          setDebugInfo(prev => `${prev}\n正在从 ${apiUrl} 获取数据...`);
          
          const response = await axios.get(apiUrl);
          
          if (response.data) {
            // 处理数据可能嵌套在data字段中的情况
            const resumeData = response.data.data || response.data;
            setResume(resumeData);
            setDebugInfo(prev => `${prev}\n成功从API获取简历数据: ${JSON.stringify(resumeData).substring(0, 100)}...`);
            return;
          } else {
            setDebugInfo(prev => `${prev}\nAPI返回空数据`);
          }
        } catch (error: any) {
          const errorMsg = error.response 
            ? `API错误: ${error.response.status} ${error.response.statusText}` 
            : error.message || '未知错误';
          setDebugInfo(prev => `${prev}\n${errorMsg}`);
        }
        
        // 如果API获取失败，再尝试从localStorage中获取
        setDebugInfo(prev => `${prev}\n尝试从localStorage获取简历...`);
        
        const currentUsername = localStorage.getItem('currentUsername');
        setDebugInfo(prev => `${prev}\n当前localStorage中的用户名: ${currentUsername || '未设置'}`);
        
        if (username === currentUsername) {
          const savedResume = localStorage.getItem('resume');
          if (savedResume) {
            try {
              const resumeData = JSON.parse(savedResume);
              setDebugInfo(prev => `${prev}\n成功解析localStorage中的简历数据`);
              
              // 只有当简历设置为公开的，才显示
              if (resumeData.isPublic) {
                setResume({
                  id: 0,
                  content: resumeData.content,
                  is_public: true,
                  created_at: new Date().toISOString(),
                  updated_at: resumeData.updatedAt || new Date().toISOString()
                });
                setDebugInfo(prev => `${prev}\n成功从localStorage获取简历数据`);
                return;
              } else {
                setDebugInfo(prev => `${prev}\nLocalStorage中的简历不是公开的`);
              }
            } catch (e) {
              setDebugInfo(prev => `${prev}\n解析localStorage中的简历数据失败: ${e}`);
            }
          } else {
            setDebugInfo(prev => `${prev}\nLocalStorage中没有简历数据`);
          }
        } else {
          setDebugInfo(prev => `${prev}\n当前用户与localStorage中的用户不匹配: ${username} != ${currentUsername}`);
        }
        
        // 如果都获取不到，显示默认简历（仅用于开发测试）
        if (isDevelopment()) {
          setDebugInfo(prev => `${prev}\n在开发环境中显示默认简历`);
          
          setResume({
            id: 0,
            content: defaultResumeContent,
            is_public: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          return;
        }
        
        // 如果都获取不到，则显示未找到简历
        setError('该用户还没有公开的简历');
      } catch (err: any) {
        setError(`获取简历失败: ${err.message || '未知错误'}`);
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchResume();
    }
  }, [username]);

  // 下载简历为Word文档
  const downloadAsWord = async () => {
    if (!resume) return;
    
    try {
      setDownloading(true);
      
      // 使用简单方法 - 仅前端实现
      // 创建一个包含样式的HTML文档
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>个人简历 - ${username}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; }
            h1 { color: #333; }
            h2 { color: #555; border-bottom: 1px solid #eee; padding-bottom: 5px; }
            ul { padding-left: 20px; }
          </style>
        </head>
        <body>
          ${md.render(resume.content)}
          <div style="margin-top: 30px; font-size: 12px; color: #999;">
            最后更新时间: ${new Date(resume.updated_at).toLocaleString('zh-CN')}
          </div>
        </body>
        </html>
      `;
      
      // 创建Blob对象
      const blob = new Blob([htmlContent], { type: 'application/msword' });
      
      // 创建下载链接并触发下载
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${username}-简历.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      // 处理下载错误
    } finally {
      setDownloading(false);
    }
  };

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
        <div style={{ fontSize: '12px', marginTop: '10px', color: '#666', textAlign: 'left', whiteSpace: 'pre-line' }}>
          {debugInfo}
        </div>
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

  return (
    <div style={{ 
      backgroundColor: '#1a1a1a', 
      padding: '30px', 
      borderRadius: '8px',
      margin: '20px',
      color: '#ccc'
    }}>
      {/* 按钮区域 */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        marginBottom: '20px'
      }}>
        <button
          onClick={downloadAsWord}
          disabled={downloading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '8px 16px',
            backgroundColor: '#2a5885',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: downloading ? 'default' : 'pointer',
            opacity: downloading ? 0.7 : 1,
            transition: 'background-color 0.3s'
          }}
          onMouseOver={(e) => {
            if (!downloading) e.currentTarget.style.backgroundColor = '#3a6ea5';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#2a5885';
          }}
        >
          <svg style={{ marginRight: '6px' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          {downloading ? '下载中...' : '下载简历'}
        </button>
      </div>
      
      <div 
        style={{ lineHeight: '1.8' }}
        dangerouslySetInnerHTML={{ 
          __html: resume ? md.render(resume.content) : '' 
        }}
      />
      
      <div style={{ 
        marginTop: '30px', 
        paddingTop: '20px', 
        borderTop: '1px solid #333',
        display: 'flex',
        justifyContent: 'space-between',
        color: '#777',
        fontSize: '14px'
      }}>
        <div>最后更新: {resume ? new Date(resume.updated_at).toLocaleString('zh-CN') : ''}</div>
      </div>
    </div>
  );
};

export default ResumeView; 