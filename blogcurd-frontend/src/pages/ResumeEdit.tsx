import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, message, Switch } from 'antd';
import { Editor } from '@bytemd/react';
import gfm from '@bytemd/plugin-gfm';
import highlight from '@bytemd/plugin-highlight';
import { resumeApi } from '../services/resumes';
import { uploadImage } from '../services/upload';
import 'bytemd/dist/index.css';
import 'highlight.js/styles/vs.css';

const plugins = [
  gfm(),
  highlight(),
];

// 设置默认简历模板
const defaultTemplate = `# 个人简历

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

export default function ResumeEdit() {
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [resumeId, setResumeId] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadResume();
  }, []);

  const loadResume = async () => {
    try {
      const response = await resumeApi.getMyResume();
      console.log('加载简历响应:', response);
      if (response.data) {
        setContent(response.data.content || defaultTemplate);
        setIsPublic(response.data.is_public || false);
        setResumeId(response.data.id);
      } else {
        setContent(defaultTemplate);
        setIsPublic(false);
        setResumeId(null);
      }
    } catch (error) {
      console.error('加载简历失败:', error);
      message.error('加载简历失败');
      setContent(defaultTemplate);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSave = async () => {
    if (!content.trim()) {
      message.error('简历内容不能为空');
      return;
    }

    setLoading(true);
    try {
      let response;
      if (resumeId !== null) {
        console.log('更新简历...');
        response = await resumeApi.updateResume(content, isPublic);
      } else {
        console.log('创建简历...');
        response = await resumeApi.createResume(content, isPublic);
      }
      console.log('保存响应:', response);
      message.success('保存成功');
      navigate('/resume');
    } catch (error) {
      console.error('保存简历失败:', error);
      message.error('保存简历失败');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <div>加载中...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button type="primary" onClick={handleSave} loading={loading}>
            保存
          </Button>
          <div className="flex items-center gap-2">
            <span>公开简历:</span>
            <Switch
              checked={isPublic}
              onChange={(checked) => setIsPublic(checked)}
            />
          </div>
        </div>
      </div>
      <Editor
        value={content}
        plugins={plugins}
        onChange={(v) => setContent(v)}
        uploadImages={async (files) => {
          const results = await Promise.all(
            files.map(async (file) => {
              try {
                const url = await uploadImage(file);
                return {
                  url,
                };
              } catch (error) {
                console.error('上传图片失败:', error);
                message.error('上传图片失败');
                return {
                  url: '',
                };
              }
            })
          );
          return results;
        }}
      />
    </div>
  );
} 