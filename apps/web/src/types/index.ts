export type UserRole = 'OWNER' | 'HIGHER_STAFF' | 'STAFF' | 'USER';
export type UserStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'BANNED'
  | 'PENDING_VERIFICATION';

export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  country: string;
  role: UserRole;
  status: UserStatus;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  deletedById?: string | null;
  deletedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    role: UserRole;
  } | null;
}

export interface PaginatedUsersResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface UsersQueryParams {
  page?: number;
  limit?: number;
  role?: UserRole;
  status?: UserStatus;
  search?: string;
  includeDeleted?: boolean;
  onlyDeleted?: boolean;
}

export interface SignupFormData {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  dateOfBirth: string;
  country: string;
}

export interface Country {
  code: string;
  name: string;
  nameAr: string;
}

export interface Theme {
  mode: 'light' | 'dark' | 'system';
}

export interface Language {
  code: 'en' | 'ar';
  name: string;
  direction: 'ltr' | 'rtl';
}

export interface LoginFormData {
  identifier: string; // username or email
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserInfo;
}

export interface UserInfo {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: 'OWNER' | 'HIGHER_STAFF' | 'STAFF' | 'USER';
  country: string;
  createdAt: Date;
}
