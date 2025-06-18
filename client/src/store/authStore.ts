import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { IUser, UserRole } from '../types';
import { authAPI } from '../services/api';

interface IAuthState {
  user: IUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface IAuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    username: string;
    email: string;
    password: string;
    phone: string;
    role?: UserRole;
  }) => Promise<void>;
  logout: () => void;
  updateProfile: (userData: Partial<IUser>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  checkAuth: () => Promise<void>;
  setLoading: (loading: boolean) => void;
}

type IAuthStore = IAuthState & IAuthActions;

const useAuthStore = create<IAuthStore>()(
  persist(
    (set, get) => ({
      // 初始状态
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      // 登录
      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true });
          const response = await authAPI.login({ email, password });
          const { user, token } = response.data;
          
          // 存储认证信息
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      // 注册 - 修复响应结构
      register: async (userData) => {
        try {
          set({ isLoading: true });
          const response = await authAPI.register(userData);
          const { user, token } = response.data; // 修复：现在 response.data 包含 token
          
          // 存储认证信息
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      // 登出
      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false
        });
        
        // 清除localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      },

      // 更新用户信息
      updateProfile: async (userData) => {
        try {
          set({ isLoading: true });
          const response = await authAPI.updateProfile(userData);
          const { user } = response.data;
          
          // 更新localStorage
          localStorage.setItem('user', JSON.stringify(user));
          
          set({
            user,
            isLoading: false
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      // 修改密码
      changePassword: async (currentPassword: string, newPassword: string) => {
        try {
          set({ isLoading: true });
          await authAPI.changePassword({ currentPassword, newPassword });
          set({ isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      // 检查认证状态 - 修复API调用
      checkAuth: async () => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        
        if (!token || !userStr) {
          get().logout();
          return;
        }

        try {
          set({ isLoading: true });
          // 验证token有效性 - 修复API方法名
          const response = await authAPI.getProfile();
          const { user } = response.data;
          
          // 更新用户信息
          localStorage.setItem('user', JSON.stringify(user));
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false
          });
        } catch (error) {
          // token无效，清除认证信息
          get().logout();
          set({ isLoading: false });
        }
      },

      // 设置加载状态
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

export default useAuthStore; 