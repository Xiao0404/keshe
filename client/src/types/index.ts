// 通用响应接口
export interface IResponseFromBackEnd<T = unknown> {
  code: number;
  data: T;
  msg?: string;
  message?: string;
}

// 分页信息接口
export interface IPagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  limit: number;
}

// 用户角色枚举
export enum UserRole {
  ADMIN = 'admin',
  LANDLORD = 'landlord',
  TENANT = 'tenant'
}

// 用户接口
export interface IUser {
  id: string;
  username: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

// 房屋状态枚举
export enum HouseStatus {
  AVAILABLE = 'available',
  RENTED = 'rented',
  PENDING = 'pending',
  OFFLINE = 'offline'
}

// 朝向类型 - 改为字符串字面量类型
export type Orientation = '东' | '南' | '西' | '北' | '东南' | '东北' | '西南' | '西北' | '南北通透';

// 装修情况类型 - 改为字符串字面量类型
export type Decoration = '毛坯' | '简装' | '精装' | '豪装';

// 房型类型 - 改为字符串字面量类型
export type HouseType = '一室一厅' | '两室一厅' | '两室两厅' | '三室一厅' | '三室两厅' | '四室两厅' | '其他';

// 设施类型 - 改为字符串字面量类型
export type Facility = '空调' | '洗衣机' | '冰箱' | '热水器' | '电视' | '宽带' | '燃气' | '暖气' | '电梯' | '停车位';

// 房屋接口
export interface IHouse {
  _id: string;
  title: string;
  description: string;
  price: number;
  area: number;
  location: string;
  district: string;
  orientation: string;
  decoration: string;
  houseType: string;
  floor: string;
  images: string[];
  facilities: string[];
  landlordId: IUser;
  status: HouseStatus;
  viewCount: number;
  isRecommended: boolean;
  createdAt: string;
  updatedAt: string;
}

// 申请状态枚举
export enum ApplicationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled'
}

// 租客信息接口
export interface ITenantInfo {
  name: string;
  phone: string;
  occupation?: string;
  income?: string;
}

// 申请接口
export interface IApplication {
  _id: string;
  houseId: IHouse;
  tenantId: IUser;
  landlordId: IUser;
  status: ApplicationStatus;
  message?: string;
  tenantInfo: ITenantInfo;
  rejectReason?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// 评论接口
export interface IComment {
  _id: string;
  houseId: string;
  userId: IUser;
  content: string;
  rating?: number;
  parentId?: string;
  replyCount?: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// 评论统计接口
export interface ICommentStats {
  totalComments: number;
  averageRating: number;
  totalRatings: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

// 评论列表响应接口
export interface ICommentListResponse {
  comments: IComment[];
  pagination: IPagination;
}

// 回复列表响应接口
export interface IReplyListResponse {
  replies: IComment[];
  pagination: IPagination;
}

// 创建评论请求接口
export interface ICreateCommentRequest {
  content: string;
  rating?: number;
  parentId?: string;
}

// 登录请求接口
export interface ILoginRequest {
  email: string;
  password: string;
}

// 注册请求接口
export interface IRegisterRequest {
  username: string;
  email: string;
  password: string;
  phone: string;
  role?: UserRole;
}

// 登录响应接口
export interface ILoginResponse {
  user: IUser;
  token: string;
}

// 注册响应接口
export interface IRegisterResponse {
  user: IUser;
  token: string;
}

// 房屋搜索参数接口
export interface IHouseSearchParams {
  page?: number;
  limit?: number;
  district?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  orientation?: string;
  decoration?: string;
  houseType?: string;
  keyword?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

// 房屋列表响应接口
export interface IHouseListResponse {
  houses: IHouse[];
  pagination: IPagination;
}

// 申请创建请求接口
export interface ICreateApplicationRequest {
  houseId: string;
  message?: string;
  tenantInfo: ITenantInfo;
}

// 申请处理请求接口
export interface IProcessApplicationRequest {
  status: 'approved' | 'rejected';
  rejectReason?: string;
}

// 申请列表响应接口
export interface IApplicationListResponse {
  applications: IApplication[];
  pagination: IPagination;
}

// 统计信息接口
export interface IStats {
  total: number;
  recent: number;
  byStatus: Record<string, number>;
} 