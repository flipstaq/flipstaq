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
    emailVerified: boolean;
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
  emailVerified: boolean;
  createdAt: string;
}

class AuthApiClient {
  private isRefreshing = false;
  private refreshPromise: Promise<AuthResponse> | null = null;
  private memoryToken: string | null = null; // Store access token in memory for security

  /**
   * Get the access token - prioritize memory, fallback to localStorage
   */
  private getAccessToken(): string | null {
    // First, check memory (most secure)
    if (this.memoryToken) {
      return this.memoryToken;
    }

    // Fallback to localStorage for backwards compatibility
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('authToken');
      if (storedToken) {
        // Move it to memory and remove from localStorage for security
        this.memoryToken = storedToken;
        return storedToken;
      }
    }

    return null;
  }

  /**
   * Set the access token - store in memory and optionally in localStorage
   */
  private setAccessToken(
    token: string,
    persistToStorage: boolean = true
  ): void {
    // Always store in memory (secure)
    this.memoryToken = token;

    // Optionally persist to localStorage (for page refresh recovery)
    if (persistToStorage && typeof window !== 'undefined') {
      localStorage.setItem('authToken', token);
    }
  }

  /**
   * Clear the access token from both memory and storage
   */
  private clearAccessToken(): void {
    this.memoryToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}/api/v1${endpoint}`;

    // Get access token and add to headers if available
    const token = this.getAccessToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // Add Authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      mode: 'cors',
      credentials: 'include',
      headers,
      ...options,
    };

    try {
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
              this.clearAccessToken();
              localStorage.removeItem('refreshToken'); // Still remove legacy storage
              localStorage.removeItem('user');
              // Redirect to login page
              window.location.href = '/auth/login?message=account_deleted';
            }
            throw new Error(errorData.message);
          }

          // Attempt token refresh if not already refreshing and not a refresh request
          if (
            !endpoint.includes('/auth/refresh') &&
            !endpoint.includes('/auth/login') &&
            !endpoint.includes('/auth/signup')
          ) {
            try {
              // If already refreshing, wait for the existing refresh to complete
              if (this.refreshPromise) {
                await this.refreshPromise;
              } else {
                // Start a new refresh
                this.isRefreshing = true;
                this.refreshPromise = this.refreshToken();
                await this.refreshPromise;
              }

              // Retry original request with new token (already set by refreshToken method)
              return this.request<T>(endpoint, options);
            } catch (refreshError) {
              // If refresh fails, logout user
              if (typeof window !== 'undefined') {
                this.clearAccessToken();
                localStorage.removeItem('refreshToken'); // Still remove legacy storage
                localStorage.removeItem('user');
                window.location.href = '/auth/login?message=session_expired';
              }
              throw new Error('Session expired. Please log in again.');
            } finally {
              // Always clean up the refresh state
              this.isRefreshing = false;
              this.refreshPromise = null;
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
        return null as T;
      }

      const data = await response.json();
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

    // Store access token using our secure method (memory + localStorage)
    if (typeof window !== 'undefined') {
      this.setAccessToken(response.accessToken);
      // Store user info (not sensitive)
      localStorage.setItem('user', JSON.stringify(response.user));
    }

    return response;
  }

  async signup(userData: SignupRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    // Store access token using our secure method (memory + localStorage)
    if (typeof window !== 'undefined') {
      this.setAccessToken(response.accessToken);
      // Store user info (not sensitive)
      localStorage.setItem('user', JSON.stringify(response.user));
    }

    return response;
  }
  async getCurrentUser(): Promise<UserInfo> {
    const token = this.getAccessToken();

    if (!token) {
      throw new Error('No authentication token found');
    }

    return this.request<UserInfo>('/auth/validate', {
      method: 'POST',
    });
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error);
    }

    // Clear stored tokens (refresh token cookie will be cleared by server)
    if (typeof window !== 'undefined') {
      this.clearAccessToken();
      localStorage.removeItem('refreshToken'); // Still remove in case of legacy storage
      localStorage.removeItem('user');
    }
  }

  async refreshToken(): Promise<AuthResponse> {
    // Don't send refresh token in body - it's automatically sent as HttpOnly cookie
    const response = await this.request<AuthResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({}), // Empty body since cookie contains refresh token
    });

    // Update stored access token using our secure method
    if (typeof window !== 'undefined') {
      this.setAccessToken(response.accessToken);
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
    return this.getAccessToken();
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }
}

export const authApi = new AuthApiClient();
