interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  isActive: boolean;
  isOnline?: boolean;
  lastSeen?: string;
  createdAt: string;
  updatedAt: string;
}

interface SearchUsersResponse {
  data: User[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

class UserService {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3100';
  private async getAuthToken(): Promise<string | null> {
    if (typeof window === 'undefined') return null;

    // Try multiple sources for the token
    const token =
      localStorage.getItem('token') ||
      localStorage.getItem('authToken') ||
      sessionStorage.getItem('token') ||
      sessionStorage.getItem('authToken');

    return token;
  }
  async searchUsers(query: string, limit: number = 10): Promise<User[]> {
    try {
      // Validate query length client-side to avoid unnecessary requests
      if (!query || query.trim().length < 2) {
        throw new Error('Search query must be at least 2 characters long');
      }

      // Use public endpoint that doesn't require authentication
      const url = new URL(`${this.baseUrl}/api/v1/public/users/search`);
      url.searchParams.append('q', query.trim());
      url.searchParams.append('limit', limit.toString());

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 400) {
          const errorData = await response
            .json()
            .catch(() => ({ message: 'Invalid search query' }));
          throw new Error(errorData.message || 'Invalid search query');
        }
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const result: User[] = await response.json();
      return result;
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }
  async getUserByUsername(username: string): Promise<User | null> {
    try {
      const users = await this.searchUsers(username, 1);
      return (
        users.find(
          (user) => user.username.toLowerCase() === username.toLowerCase()
        ) || null
      );
    } catch (error) {
      console.error('Error getting user by username:', error);
      return null;
    }
  }

  async heartbeat(): Promise<void> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        console.warn('No auth token available for heartbeat');
        return;
      }

      const response = await fetch(`${this.baseUrl}/api/v1/users/heartbeat`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn('Heartbeat failed:', response.statusText);
      }
    } catch (error) {
      console.error('Error sending heartbeat:', error);
    }
  }

  async markOffline(): Promise<void> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        return;
      }

      // Use sendBeacon for reliability during page unload
      if (navigator.sendBeacon) {
        const data = new FormData();
        navigator.sendBeacon(`${this.baseUrl}/api/v1/auth/logout`, data);
      } else {
        // Fallback for browsers that don't support sendBeacon
        fetch(`${this.baseUrl}/api/v1/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          keepalive: true,
        }).catch(() => {
          // Ignore errors during page unload
        });
      }
    } catch (error) {
      console.error('Error marking user offline:', error);
    }
  }
}

export const userService = new UserService();
export type { User };
