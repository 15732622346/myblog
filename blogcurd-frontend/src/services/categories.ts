import request from '../utils/request';

// ʹ��request������Ҫ��������API_BASE_URL

export interface Category {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryDto {
  name: string;
  description?: string;
}

export const categoriesApi = {
  // 获取分类列表
  getCategories: async (): Promise<Category[]> => {
    console.log('开始请求分类列表..');
    try {
      const response = await request.get('/categories');
      console.log('分类列表请求成功:', response.data);
      return response.data;
    } catch (error) {
      console.error('分类列表请求失败:', error);
      throw error;
    }
  },

  // 创建分类
  createCategory: async (data: CreateCategoryDto): Promise<Category> => {
    console.log('开始创建分类:', data);
    try {
      const response = await request.post('/categories', data);
      console.log('创建分类成功:', response.data);
      return response.data;
    } catch (error) {
      console.error('创建分类失败:', error);
      throw error;
    }
  },

  // 更新分类
  updateCategory: async (id: number, data: Partial<CreateCategoryDto>): Promise<Category> => {
    console.log('开始更新分类:', id, data);
    try {
      const response = await request.put(`/categories/${id}`, data);
      console.log('更新分类成功:', response.data);
      return response.data;
    } catch (error) {
      console.error('更新分类失败:', error);
      throw error;
    }
  },

  // 删除分类
  deleteCategory: async (id: number): Promise<void> => {
    console.log('开始删除分类:', id);
    try {
      await request.delete(`/categories/${id}`);
      console.log('删除分类成功');
    } catch (error) {
      console.error('删除分类失败:', error);
      throw error;
    }
  },

  // 获取单个分类
  getCategory: async (id: number): Promise<Category> => {
    console.log('开始获取单个分类:', id);
    try {
      const response = await request.get(`/categories/${id}`);
      console.log('获取单个分类成功:', response.data);
      return response.data;
    } catch (error) {
      console.error('获取单个分类失败:', error);
      throw error;
    }
  }
}; 
