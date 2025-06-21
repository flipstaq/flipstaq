import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api/api-client';

interface BlockStatus {
  isBlocked: boolean;
  isBlockedBy: boolean;
}

export const useBlockStatus = (targetUserId: string | null) => {
  const [blockStatus, setBlockStatus] = useState<BlockStatus>({
    isBlocked: false,
    isBlockedBy: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBlockStatus = async () => {
    if (!targetUserId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await apiClient.request<BlockStatus>(
        `/users/blocks/status/${targetUserId}`
      );
      setBlockStatus(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch block status'
      );
      console.error('Error fetching block status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBlockStatus();
  }, [targetUserId]);

  const updateBlockStatus = (isBlocked: boolean) => {
    setBlockStatus((prev) => ({
      ...prev,
      isBlocked,
    }));
  };

  return {
    blockStatus,
    isLoading,
    error,
    updateBlockStatus,
    refetch: fetchBlockStatus,
  };
};
