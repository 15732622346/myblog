import { create } from 'zustand';
import { AuthResponse } from '../services/auth';

interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'user';
  avatar?: string;
  nickname?: string;
  bio?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setIsInitialized: (isInitialized: boolean) => void;
  updateUser: (data: Partial<User>) => void;
  login: (token: string, user: AuthResponse['user']) => void;
  logout: () => void;
  initialize: () => Promise<void>;
}

const getStoredUser = () => {
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
};

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  isInitialized: false,

  setUser: (user) => set({ user }),

  setToken: (token) => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
    set({ token });
  },

  setIsInitialized: (isInitialized) => set({ isInitialized }),

  updateUser: (data) => set((state) => ({
    user: state.user ? { ...state.user, ...data } : null
  })),

  login: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true, isInitialized: true });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null, isAuthenticated: false, isInitialized: true });
  },

  initialize: async () => {
    try {
      const token = localStorage.getItem('token');
      const user = getStoredUser();
      
      console.log('初始化认证状态 - Token存在:', !!token, 'User存在:', !!user);
      
      if (token && user) {
        console.log('认证状态初始化成功，用户已登录');
        set({ token, user, isAuthenticated: true, isInitialized: true });
      } else {
        console.log('认证状态初始化失败，清除本地存储');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ token: null, user: null, isAuthenticated: false, isInitialized: true });
      }
    } catch (error) {
      console.error('初始化认证状态失败:', error);
      set({ token: null, user: null, isAuthenticated: false, isInitialized: true });
    }
  },
})); 