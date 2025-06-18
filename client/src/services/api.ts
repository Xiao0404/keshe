import axios from 'axios';
import {
  IResponseFromBackEnd,
  ILoginRequest,
  ILoginResponse,
  IRegisterRequest,
  IRegisterResponse,
  IHouseSearchParams,
  IHouseListResponse,
  IHouse,
  ICreateApplicationRequest,
  IApplication,
  IApplicationListResponse,
  IProcessApplicationRequest,
  IComment,
  ICommentListResponse,
  IReplyListResponse,
  ICreateCommentRequest,
  ICommentStats,
  IPagination
} from '../types';

// 创建axios实例
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api', // 改为 3001
  timeout: 10000,
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
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 认证相关API
export const authAPI = {
  // 登录
  login: (data: ILoginRequest): Promise<IResponseFromBackEnd<ILoginResponse>> =>
    api.post('/auth/login', data).then(res => res.data),
  
  // 注册
  register: (data: IRegisterRequest): Promise<IResponseFromBackEnd<IRegisterResponse>> =>
    api.post('/auth/register', data).then(res => res.data),
  
  // 获取当前用户信息
  getCurrentUser: (): Promise<IResponseFromBackEnd<{ user: any }>> =>
    api.get('/auth/me').then(res => res.data),
  
  // 获取用户资料 (修复缺失的方法)
  getProfile: (): Promise<IResponseFromBackEnd<{ user: any }>> =>
    api.get('/auth/profile').then(res => res.data),

  // 更新用户信息
  updateProfile: (data: any): Promise<IResponseFromBackEnd<{ user: any }>> =>
    api.put('/auth/profile', data).then(res => res.data),
  
  // 修改密码
  changePassword: (data: { currentPassword: string; newPassword: string }): Promise<IResponseFromBackEnd> =>
    api.put('/auth/change-password', data).then(res => res.data),
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
  // 创建申请
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
  
  // 获取申请统计信息（管理员）
  getApplicationStats: (): Promise<IResponseFromBackEnd<{ stats: any }>> =>
    api.get('/applications/admin/stats').then(res => res.data),
};

// 评论相关API
export const commentAPI = {
  // 获取房源评论列表
  getHouseComments: (houseId: string, params?: {
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'asc' | 'desc';
  }): Promise<IResponseFromBackEnd<ICommentListResponse>> =>
    api.get(`/comments/house/${houseId}`, { params }).then(res => res.data),

  // 获取评论回复
  getCommentReplies: (commentId: string, params?: {
    page?: number;
    limit?: number;
  }): Promise<IResponseFromBackEnd<IReplyListResponse>> =>
    api.get(`/comments/${commentId}/replies`, { params }).then(res => res.data),

  // 创建评论
  createComment: (houseId: string, data: ICreateCommentRequest): Promise<IResponseFromBackEnd<{ comment: IComment }>> =>
    api.post(`/comments/house/${houseId}`, data).then(res => res.data),

  // 删除评论
  deleteComment: (commentId: string): Promise<IResponseFromBackEnd> =>
    api.delete(`/comments/${commentId}`).then(res => res.data),

  // 获取房源评论统计 (修复方法名)
  getHouseCommentStats: (houseId: string): Promise<IResponseFromBackEnd<{ stats: ICommentStats }>> =>
    api.get(`/comments/house/${houseId}/stats`).then(res => res.data),
};

export default api; 