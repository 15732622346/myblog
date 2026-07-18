import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, message, Spin, Switch, Tooltip, Space } from 'antd';
import { EyeOutlined, EditOutlined, SaveOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import MDEditor, { commands } from '@uiw/react-md-editor';
import { useAuthStore } from '../../store/auth';
import { uploadApi } from '../../services/upload';
import { resumeApi } from '../../services/resumes';

const ResumeEdit: React.FC = () => {
  const [content, setContent] = useState<string>('');
  const [isPublic, setIsPublic] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [hasResume, setHasResume] = useState<boolean>(false);
  const [previewMode, setPreviewMode] = useState<boolean>(false);
  
  const user = useAuthStore((state) => state.user);

  // 处理图片上传
  const handleImageUpload = useCallback(async (file: File): Promise<string> => {
    try {
      // 显示上传中提示
      const hide = message.loading('正在上传图片...', 0);
      
      // 上传图片
      const imageUrl = await uploadApi.uploadImage(file);
      
      // 关闭提示
      hide();
      
      message.success('图片上传成功');
      return imageUrl;
    } catch (error) {
      message.error('图片上传失败');
      throw error;
    }
  }, []);

  // 自定义图片上传命令
  const imageUploadCommand = {
    ...commands.image,
    execute: async (state: any, api: any) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async () => {
        const file = input.files?.[0];
        if (file) {
          try {
            const imageUrl = await handleImageUpload(file);
            const imageMarkdown = `![${file.name}](${imageUrl})`;
            api.replaceSelection(imageMarkdown);
          } catch (error) {
            console.error('Image upload failed:', error);
          }
        }
      };
      input.click();
    },
  };

  // 设置默认简历模板
  const setDefaultTemplate = () => {
    setContent(`# 个人简历

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

`);
  };

  useEffect(() => {
    const fetchResume = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await resumeApi.getMyResume();
        console.log('获取简历响应:', response);
        
        if (response.data) {
          // 服务器有数据，使用服务器数据
          setContent(response.data.content || '');
          setIsPublic(response.data.is_public || false);
          setHasResume(true);
          
          // 同步更新本地存储
          localStorage.setItem('resume', JSON.stringify({
            content: response.data.content,
            isPublic: response.data.is_public,
            updatedAt: new Date().toISOString()
          }));
          localStorage.setItem('currentUsername', user.username);
        } else {
          // 如果没有获取到数据，使用默认模板
          setDefaultTemplate();
          setHasResume(false);
        }
      } catch (error) {
        console.error('获取简历失败:', error);
        message.error('获取简历信息失败，将使用默认模板');
        setDefaultTemplate();
        setHasResume(false);
      } finally {
        setLoading(false);
      }
    };

    fetchResume();
  }, [user?.id, user?.username]);

  const handleSave = async () => {
    if (!user?.id) {
      message.warning('请先登录');
      return;
    }

    try {
      setSaving(true);
      console.log('保存简历...', { hasResume, content, isPublic });
      
      if (hasResume) {
        await resumeApi.updateResume(content, isPublic);
      } else {
        await resumeApi.createResume(content, isPublic);
        setHasResume(true);
      }
      
      // 更新本地存储
      localStorage.setItem('resume', JSON.stringify({
        content,
        isPublic,
        updatedAt: new Date().toISOString()
      }));
      localStorage.setItem('currentUsername', user.username);
      
      message.success('保存成功');
    } catch (error) {
      console.error('保存简历失败:', error);
      message.error('保存失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card
      title="个人简历"
      extra={
        <Space>
          <Tooltip title="是否公开简历">
            <Space>
              <Switch
                checked={isPublic}
                onChange={setIsPublic}
                disabled={saving}
              />
              <QuestionCircleOutlined />
            </Space>
          </Tooltip>
          <Button
            icon={previewMode ? <EditOutlined /> : <EyeOutlined />}
            onClick={() => setPreviewMode(!previewMode)}
            disabled={saving}
          >
            {previewMode ? '编辑' : '预览'}
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={saving}
          >
            保存
          </Button>
        </Space>
      }
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
        </div>
      ) : (
        <div data-color-mode="light">
          {previewMode ? (
            <MDEditor.Markdown source={content} />
          ) : (
            <MDEditor
              value={content}
              onChange={(value) => setContent(value || '')}
              commands={[
                commands.bold,
                commands.italic,
                commands.strikethrough,
                commands.hr,
                commands.title,
                commands.divider,
                commands.link,
                imageUploadCommand,
                commands.divider,
                commands.quote,
                commands.code,
                commands.codeBlock,
                commands.divider,
                commands.unorderedListCommand,
                commands.orderedListCommand,
                commands.checkedListCommand,
              ]}
              height={500}
            />
          )}
        </div>
      )}
    </Card>
  );
};

export default ResumeEdit; 