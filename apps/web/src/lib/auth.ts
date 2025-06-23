import { SignupFormData, LoginFormData, AuthResponse, UserInfo } from '@/types';
import { authApi } from './api/auth';

class AuthService {
  async signup(data: SignupFormData): Promise<AuthResponse> {
    const response = await authApi.signup({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      username: data.username,
      password: data.password,
      dateOfBirth: data.dateOfBirth,
      country: data.country,
    });

    // Transform the response to ensure createdAt is a Date object
    return {
      ...response,
      user: {
        ...response.user,
        createdAt: new Date(response.user.createdAt),
      },
    };
  }
  async login(data: LoginFormData): Promise<AuthResponse> {
    const response = await authApi.login({
      identifier: data.identifier,
      password: data.password,
    });

    // Transform the response to ensure createdAt is a Date object
    return {
      ...response,
      user: {
        ...response.user,
        createdAt: new Date(response.user.createdAt),
      },
    };
  }

  async logout(): Promise<void> {
    return authApi.logout();
  }
  async validateToken(): Promise<UserInfo> {
    // Make an API call to get the latest user data from the server
    try {
      const userInfo = await authApi.getCurrentUser();

      // Update stored user data with the latest info
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'user',
          JSON.stringify({
            ...userInfo,
            createdAt: userInfo.createdAt.toString(),
          })
        );
      }

      // Convert the createdAt string to Date object
      return {
        ...userInfo,
        createdAt: new Date(userInfo.createdAt),
      };
    } catch (error) {
      // Fallback to stored data if API call fails
      console.warn(
        'Failed to validate token via API, using stored data:',
        error
      );

      const storedUser = this.getStoredUser();
      const token = this.getAccessToken();

      if (!token || !storedUser) {
        throw new Error('No authentication token or user found');
      }

      return storedUser;
    }
  }
  getStoredUser(): UserInfo | null {
    const storedUser = authApi.getStoredUser();
    if (!storedUser) return null;

    // Convert the stored user (string createdAt) to the expected format (Date createdAt)
    return {
      ...storedUser,
      createdAt: new Date(storedUser.createdAt),
    };
  }

  isAuthenticated(): boolean {
    return authApi.isAuthenticated();
  }

  getAccessToken(): string | null {
    return authApi.getStoredToken();
  }
}

export const authService = new AuthService();
