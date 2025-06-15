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
    // First check if we have a stored user and token
    const storedUser = this.getStoredUser();
    const token = this.getAccessToken();

    if (!token || !storedUser) {
      throw new Error('No authentication token or user found');
    }

    // Convert the stored user (string createdAt) to the expected format (Date createdAt)
    const userInfo: UserInfo = {
      ...storedUser,
      createdAt: new Date(storedUser.createdAt),
    };

    return userInfo;

    // TODO: Re-enable this when the validate endpoint is stable
    // return authApi.getCurrentUser();
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
