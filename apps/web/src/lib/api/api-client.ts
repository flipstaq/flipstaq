import { authApi } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3100';

class ApiClient {
  private isRefreshing = false;
  private refreshPromise: Promise<any> | null = null;

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = endpoint.startsWith('http')
      ? endpoint
      : `${API_BASE_URL}/api/v1${endpoint}`;

    // Get token and add to headers
    const token = authApi.getStoredToken();
    const config: RequestInit = {
      mode: 'cors',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log('API request to:', url);
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
        if (response.status === 401 && token) {
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
              window.location.href = '/auth/login?message=account_deleted';
            }
            throw new Error(errorData.message);
          }

          // Attempt token refresh if not already refreshing
          if (!this.isRefreshing && !endpoint.includes('/auth/')) {
            try {
              if (!this.refreshPromise) {
                this.isRefreshing = true;
                this.refreshPromise = authApi.refreshToken();
              }

              await this.refreshPromise;
              this.isRefreshing = false;
              this.refreshPromise = null;

              // Retry original request with new token
              const newToken = authApi.getStoredToken();
              if (newToken && config.headers) {
                (config.headers as any)['Authorization'] = `Bearer ${newToken}`;
              }

              return this.request<T>(endpoint, {
                ...options,
                headers: config.headers,
              });
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
        console.log('API response: No content (204)');
        return null as T;
      }

      const data = await response.json();
      console.log('API response:', data);
      return data;
    } catch (error) {
      console.error('API error:', error);
      throw error;
    }
  }

  // Convenience methods
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
