import { httpClient } from '../utils/http-client';

interface Resume {
  id: number;
  content: string;
  created_at: string;
  updated_at: string;
  is_public?: boolean;
}

export const resumeApi = {
  // 获取当前用户的简历
  getMyResume: () => {
    // 添加时间戳防止缓存
    const timestamp = new Date().getTime();
    return httpClient.get<Resume>(`/resumes/my?t=${timestamp}`);
  },

  // 根据用户名获取简历
  getResumeByUsername: (username: string) => {
    const timestamp = new Date().getTime();
    return httpClient.get<Resume>(`/resumes/by-username/${username}?t=${timestamp}`);
  },

  // 创建简历
  createResume: (content: string, isPublic: boolean = false) => {
    return httpClient.post<Resume>('/resumes', { content, is_public: isPublic });
  },

  // 更新简历
  updateResume: (content: string, isPublic: boolean = false) => {
    return httpClient.put<Resume>('/resumes', { content, is_public: isPublic });
  },

  // 删除简历
  deleteResume: (id: number) => {
    return httpClient.delete<void>(`/resumes/${id}`);
  },
}; 