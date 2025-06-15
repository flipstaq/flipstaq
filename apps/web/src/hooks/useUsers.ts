import { useState, useEffect, useCallback } from 'react';
import {
  User,
  PaginatedUsersResponse,
  UsersQueryParams,
  UserRole,
  UserStatus,
} from '@/types';
import { userApi, ApiError } from '@/lib/api/users';
import { useAuth } from '@/components/providers/AuthProvider';

interface UseUsersOptions {
  initialParams?: UsersQueryParams;
  autoFetch?: boolean;
}

interface UseUsersResult {
  users: User[];
  loading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null;
  refetch: () => Promise<void>;
  updateParams: (params: Partial<UsersQueryParams>) => void;
  deleteUser: (id: string) => Promise<void>;
}

export function useUsers(options: UseUsersOptions = {}): UseUsersResult {
  const { initialParams = {}, autoFetch = true } = options;
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] =
    useState<UseUsersResult['pagination']>(null);
  const [params, setParams] = useState<UsersQueryParams>({
    page: 1,
    limit: 10,
    ...initialParams,
  });
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response: PaginatedUsersResponse = await userApi.getUsers(params);
      setUsers(response.users);
      setPagination({
        total: response.total,
        page: response.page,
        limit: response.limit,
        totalPages: response.totalPages,
        hasNext: response.hasNext,
        hasPrev: response.hasPrev,
      });
    } catch (err) {
      console.error('Failed to fetch users:', err);
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to load users. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [params]);

  const updateParams = useCallback((newParams: Partial<UsersQueryParams>) => {
    setParams((prev) => ({ ...prev, ...newParams }));
  }, []);

  const deleteUser = useCallback(
    async (id: string) => {
      try {
        await userApi.deleteUser(id);
        // Refetch users after deletion
        await fetchUsers();
      } catch (err) {
        console.error('Failed to delete user:', err);
        if (err instanceof ApiError) {
          throw new Error(err.message);
        } else {
          throw new Error('Failed to delete user. Please try again.');
        }
      }
    },
    [fetchUsers]
  );
  useEffect(() => {
    // Only auto-fetch if authentication is complete and user is authenticated
    if (autoFetch && !authLoading && isAuthenticated) {
      fetchUsers();
    }
  }, [fetchUsers, autoFetch, authLoading, isAuthenticated]);

  return {
    users,
    loading,
    error,
    pagination,
    refetch: fetchUsers,
    updateParams,
    deleteUser,
  };
}

// Hook for managing individual user operations
export function useUser(id: string | null) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const userData = await userApi.getUser(id);
      setUser(userData);
    } catch (err) {
      console.error('Failed to fetch user:', err);
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to load user. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  const updateUser = useCallback(
    async (data: Partial<User>) => {
      if (!id) return;

      try {
        const updatedUser = await userApi.updateUser(id, data);
        setUser(updatedUser);
        return updatedUser;
      } catch (err) {
        console.error('Failed to update user:', err);
        if (err instanceof ApiError) {
          throw new Error(err.message);
        } else {
          throw new Error('Failed to update user. Please try again.');
        }
      }
    },
    [id]
  );

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return {
    user,
    loading,
    error,
    refetch: fetchUser,
    updateUser,
  };
}
