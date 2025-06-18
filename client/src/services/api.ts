import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { message } from 'antd';
import {
  IResponseFromBackEnd,
  ILoginRequest,
  ILoginResponse,
  IRegisterRequest,
  IUser,
  IHouse,
  IHouseSearchParams,
  IHouseListResponse,
  IApplication,
  ICreateApplicationRequest,
  IProcessApplicationRequest,
  IApplicationListResponse,
  IStats
} from '../types';

// 创建axios实例
const api: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response: AxiosResponse<IResponseFromBackEnd>) => {
    const { data } = response;
    
    // 如果响应成功，返回数据
    if (data.code === 200 || data.code === 201) {
      return response;
    }
    
    // 处理业务错误
    const errorMessage = data.message || data.msg || '请求失败';
    message.error(errorMessage);
    return Promise.reject(new Error(errorMessage));
  },
  (error) => {
    // 处理HTTP错误
    if (error.response) {
      const { status, data } = error.response;
      const errorMessage = data?.message || data?.msg || '请求失败';
      
      switch (status) {
        case 401:
          message.error('登录已过期，请重新登录');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          break;
        case 403:
          message.error('权限不足');
          break;
        case 404:
          message.error('请求的资源不存在');
          break;
        case 429:
          message.error('请求过于频繁，请稍后再试');
          break;
        case 500:
          message.error('服务器内部错误');
          break;
        default:
          message.error(errorMessage);
      }
    } else if (error.request) {
      message.error('网络连接失败，请检查网络');
    } else {
      message.error('请求配置错误');
    }
    
    return Promise.reject(error);
  }
);

// 认证相关API
export const authAPI = {
  // 用户登录
  login: (data: ILoginRequest): Promise<IResponseFromBackEnd<ILoginResponse>> =>
    api.post('/auth/login', data).then(res => res.data),
  
  // 用户注册
  register: (data: IRegisterRequest): Promise<IResponseFromBackEnd<ILoginResponse>> =>
    api.post('/auth/register', data).then(res => res.data),
  
  // 获取用户信息
  getProfile: (): Promise<IResponseFromBackEnd<{ user: IUser }>> =>
    api.get('/auth/profile').then(res => res.data),
  
  // 更新用户信息
  updateProfile: (data: Partial<IUser>): Promise<IResponseFromBackEnd<{ user: IUser }>> =>
    api.put('/auth/profile', data).then(res => res.data),
  
  // 修改密码
  changePassword: (data: { currentPassword: string; newPassword: string }): Promise<IResponseFromBackEnd> =>
    api.put('/auth/change-password', data).then(res => res.data)
};

// 房屋相关API
export const houseAPI = {
  // 获取房屋列表
  getHouses: (params?: IHouseSearchParams): Promise<IResponseFromBackEnd<IHouseListResponse>> =>
    api.get('/houses', { params }).then(res => res.data),
  
  // 获取房屋详情
  getHouseById: (id: string): Promise<IResponseFromBackEnd<{ house: IHouse }>> =>
    api.get(`/houses/${id}`).then(res => res.data),
  
  // 获取推荐房屋
  getRecommendedHouses: (limit?: number): Promise<IResponseFromBackEnd<{ houses: IHouse[] }>> =>
    api.get('/houses/recommended', { params: { limit } }).then(res => res.data),
  
  // 发布房屋
  createHouse: (data: FormData): Promise<IResponseFromBackEnd<{ house: IHouse }>> =>
    api.post('/houses', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => res.data),
  
  // 更新房屋信息
  updateHouse: (id: string, data: FormData): Promise<IResponseFromBackEnd<{ house: IHouse }>> =>
    api.put(`/houses/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => res.data),
  
  // 删除房屋
  deleteHouse: (id: string): Promise<IResponseFromBackEnd> =>
    api.delete(`/houses/${id}`).then(res => res.data),
  
  // 更新房屋状态
  updateHouseStatus: (id: string, status: string): Promise<IResponseFromBackEnd<{ house: IHouse }>> =>
    api.patch(`/houses/${id}/status`, { status }).then(res => res.data),
  
  // 获取房东的房屋列表
  getLandlordHouses: (params?: { page?: number; limit?: number; status?: string }): Promise<IResponseFromBackEnd<IHouseListResponse>> =>
    api.get('/houses/landlord/my-houses', { params }).then(res => res.data),

  // 管理员获取所有房源
  getAllHousesForAdmin: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    landlordId?: string;
    keyword?: string;
  }): Promise<IResponseFromBackEnd<IHouseListResponse>> =>
    api.get('/houses/admin/all-houses', { params }).then(res => res.data),

  // 管理员获取统计信息
  getAdminStats: (): Promise<IResponseFromBackEnd<{
    stats: {
      totalUsers: number;
      totalLandlords: number;
      totalTenants: number;
      totalHouses: number;
    }
  }>> =>
    api.get('/houses/admin/stats').then(res => res.data),
};

// 申请相关API
export const applicationAPI = {
  // 提交租赁申请
  createApplication: (data: ICreateApplicationRequest): Promise<IResponseFromBackEnd<{ application: IApplication }>> =>
    api.post('/applications', data).then(res => res.data),
  
  // 获取租客的申请列表
  getTenantApplications: (params?: { page?: number; limit?: number; status?: string }): Promise<IResponseFromBackEnd<IApplicationListResponse>> =>
    api.get('/applications/tenant/my-applications', { params }).then(res => res.data),
  
  // 获取房东收到的申请列表
  getLandlordApplications: (params?: { page?: number; limit?: number; status?: string; houseId?: string }): Promise<IResponseFromBackEnd<IApplicationListResponse>> =>
    api.get('/applications/landlord/received', { params }).then(res => res.data),
  
  // 处理申请
  processApplication: (id: string, data: IProcessApplicationRequest): Promise<IResponseFromBackEnd<{ application: IApplication }>> =>
    api.patch(`/applications/${id}/process`, data).then(res => res.data),
  
  // 取消申请
  cancelApplication: (id: string): Promise<IResponseFromBackEnd> =>
    api.patch(`/applications/${id}/cancel`).then(res => res.data),
  
  // 获取申请详情
  getApplicationById: (id: string): Promise<IResponseFromBackEnd<{ application: IApplication }>> =>
    api.get(`/applications/${id}`).then(res => res.data),
  
  // 获取申请统计信息
  getApplicationStats: (): Promise<IResponseFromBackEnd<{ stats: IStats }>> =>
    api.get('/applications/admin/stats').then(res => res.data)
};

export default api; 