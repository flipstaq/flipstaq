import { UserRole } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3100';

export interface LoginRequest {
  identifier: string; // email or username
  password: string;
}

export interface SignupRequest {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  dateOfBirth: string;
  country: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    country: string;
    createdAt: string;
  };
}

export interface UserInfo {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  country: string;
  createdAt: string;
}

class AuthApiClient {
  private isRefreshing = false;
  private refreshPromise: Promise<AuthResponse> | null = null;

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}/api/v1${endpoint}`;

    const config: RequestInit = {
      mode: 'cors',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log('Auth API request to:', url);
      const response = await fetch(url, config);
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = {
            message: `HTTP ${response.status} ${response.statusText}`,
          };
        }

        // Handle 401 errors with automatic token refresh
        if (response.status === 401) {
          // Check for account deletion first
          if (
            errorData.message?.includes('deleted') ||
            errorData.message?.includes('logged out') ||
            errorData.message?.includes('inactive')
          ) {
            // Auto-logout user when account is deleted/inactive
            if (typeof window !== 'undefined') {
              localStorage.removeItem('authToken');
              localStorage.removeItem('refreshToken');
              localStorage.removeItem('user');
              // Redirect to login page
              window.location.href = '/auth/login?message=account_deleted';
            }
            throw new Error(errorData.message);
          }

          // Attempt token refresh if not already refreshing and not a refresh request
          if (
            !this.isRefreshing &&
            !endpoint.includes('/auth/refresh') &&
            !endpoint.includes('/auth/login') &&
            !endpoint.includes('/auth/signup')
          ) {
            try {
              if (!this.refreshPromise) {
                this.isRefreshing = true;
                this.refreshPromise = this.refreshToken();
              }

              await this.refreshPromise;
              this.isRefreshing = false;
              this.refreshPromise = null;

              // Retry original request with new token
              const newToken = this.getStoredToken();
              if (newToken && options.headers) {
                (options.headers as any)['Authorization'] =
                  `Bearer ${newToken}`;
              }

              return this.request<T>(endpoint, options);
            } catch (refreshError) {
              this.isRefreshing = false;
              this.refreshPromise = null;
              // If refresh fails, logout user
              if (typeof window !== 'undefined') {
                localStorage.removeItem('authToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                window.location.href = '/auth/login?message=session_expired';
              }
              throw new Error('Session expired. Please log in again.');
            }
          }
        }

        throw new Error(
          errorData.message || `Request failed with status ${response.status}`
        );
      }

      // Handle empty responses (like 204 No Content)
      const contentType = response.headers.get('content-type');
      if (
        response.status === 204 ||
        !contentType?.includes('application/json')
      ) {
        console.log('Auth API response: No content (204)');
        return null as T;
      }

      const data = await response.json();
      console.log('Auth API response:', data);
      return data;
    } catch (error) {
      console.error('Auth API error:', error);
      throw error;
    }
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    // Store tokens in localStorage (in production, use secure storage)
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.user));
    }

    return response;
  }

  async signup(userData: SignupRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    // Store tokens in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.user));
    }

    return response;
  }
  async getCurrentUser(): Promise<UserInfo> {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

    if (!token) {
      throw new Error('No authentication token found');
    }

    return this.request<UserInfo>('/auth/validate', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async logout(): Promise<void> {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

    if (token) {
      try {
        await this.request('/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }

    // Clear stored tokens
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  }

  async refreshToken(): Promise<AuthResponse> {
    const refreshToken =
      typeof window !== 'undefined'
        ? localStorage.getItem('refreshToken')
        : null;

    if (!refreshToken) {
      throw new Error('No refresh token found');
    }

    const response = await this.request<AuthResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });

    // Update stored tokens
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.user));
    }

    return response;
  }

  getStoredUser(): UserInfo | null {
    if (typeof window === 'undefined') return null;

    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  getStoredToken(): string | null {
    if (typeof window === 'undefined') return null;

    return localStorage.getItem('authToken');
  }

  isAuthenticated(): boolean {
    return !!this.getStoredToken();
  }
}

export const authApi = new AuthApiClient();
