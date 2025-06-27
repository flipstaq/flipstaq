import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api/api-client';
import { useAuth } from '@/components/providers/AuthProvider';

interface BlockStatus {
  isBlocked: boolean;
  isBlockedBy: boolean;
}

export const useBlockStatus = (targetUserId: string | null) => {
  const { user } = useAuth();
  const [blockStatus, setBlockStatus] = useState<BlockStatus>({
    isBlocked: false,
    isBlockedBy: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBlockStatus = async () => {
    if (!targetUserId || !user) return;

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
    // Reset state when targetUserId changes
    if (targetUserId && user) {
      setBlockStatus({ isBlocked: false, isBlockedBy: false });
      setError(null);
      fetchBlockStatus();
    } else {
      // Clear state when no target user or no authenticated user
      setBlockStatus({ isBlocked: false, isBlockedBy: false });
      setError(null);
    }
  }, [targetUserId, user]);

  const updateBlockStatus = async (isBlocked: boolean) => {
    if (!targetUserId || !user) return;

    setIsLoading(true);
    setError(null);

    try {
      if (isBlocked) {
        // Block user
        await apiClient.request('/users/blocks', {
          method: 'POST',
          body: JSON.stringify({
            blockedId: targetUserId,
          }),
        });
      } else {
        // Unblock user
        await apiClient.request(`/users/blocks/${targetUserId}`, {
          method: 'DELETE',
        });
      }

      // Update local state after successful API call
      setBlockStatus((prev) => ({
        ...prev,
        isBlocked,
      }));
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to update block status';
      setError(errorMessage);
      console.error('Error updating block status:', err);

      // If the error suggests the user is already in the desired state,
      // refetch the status to sync with server
      if (
        errorMessage.includes('already blocked') ||
        errorMessage.includes('already unblocked') ||
        errorMessage.includes('Block not found') ||
        errorMessage.includes('not found')
      ) {
        console.log('🔄 State mismatch detected, refetching block status...');
        await fetchBlockStatus();

        // If it was a "Block not found" error when trying to unblock,
        // the user is likely already unblocked, so we can consider this a success
        if (errorMessage.includes('Block not found') && !isBlocked) {
          return; // Don't re-throw the error, treat as success
        }

        // If it's an "already blocked/unblocked" error, also treat as success
        if (
          (errorMessage.includes('already blocked') && isBlocked) ||
          (errorMessage.includes('already unblocked') && !isBlocked)
        ) {
          return; // Don't re-throw the error, treat as success
        }
      }

      throw err; // Re-throw to allow handling in the UI
    } finally {
      setIsLoading(false);
    }
  };

  const resetBlockStatus = () => {
    setBlockStatus({ isBlocked: false, isBlockedBy: false });
    setError(null);
    setIsLoading(false);
  };

  return {
    blockStatus,
    isLoading,
    error,
    updateBlockStatus,
    refetch: fetchBlockStatus,
    reset: resetBlockStatus,
  };
};
