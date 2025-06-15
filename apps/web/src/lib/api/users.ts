import { User, PaginatedUsersResponse, UsersQueryParams } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3100';

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class UserApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}/api/v1${endpoint}`;

    // Get JWT token from localStorage
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    if (!token) {
      throw new ApiError('Please log in to access the admin panel.', 401);
    }

    const config: RequestInit = {
      mode: 'cors',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
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

        console.error('API Error:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
        });

        // Check for deleted account error
        if (
          response.status === 401 &&
          (errorData.message?.includes('deleted') ||
            errorData.message?.includes('logged out'))
        ) {
          // Auto-logout user when account is deleted
          if (typeof window !== 'undefined') {
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            // Redirect to login page
            window.location.href = '/auth/login?message=account_deleted';
          }
        }

        throw new ApiError(
          errorData.message || `Request failed with status ${response.status}`,
          response.status,
          errorData
        );
      }
      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      } // Handle network errors more specifically
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new ApiError(
          'Cannot reach the server. Please check your internet connection or try refreshing the page.',
          0
        );
      }

      console.error('Network error:', error);
      throw new ApiError('An unexpected error occurred while fetching data', 0);
    }
  }

  async getUsers(
    params: UsersQueryParams = {}
  ): Promise<PaginatedUsersResponse> {
    const searchParams = new URLSearchParams();    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.role) searchParams.append('role', params.role);
    if (params.status) searchParams.append('status', params.status);
    if (params.search) searchParams.append('search', params.search);
    if (params.includeDeleted) searchParams.append('includeDeleted', 'true');
    if (params.onlyDeleted) searchParams.append('onlyDeleted', 'true');

    const queryString = searchParams.toString();
    const endpoint = `/users${queryString ? `?${queryString}` : ''}`;

    return this.request<PaginatedUsersResponse>(endpoint);
  }

  async getUser(id: string): Promise<User> {
    return this.request<User>(`/users/${id}`);
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    return this.request<User>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  async restoreUser(id: string): Promise<User> {
    return this.request<User>(`/users/${id}/restore`, {
      method: 'PATCH',
    });
  }
}

export const userApi = new UserApiClient();
export { ApiError };
