import { useState, useCallback } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';

export function useVerificationCheck() {
  const { user } = useAuth();
  const [showVerificationPrompt, setShowVerificationPrompt] = useState(false);
  const [blockedFeature, setBlockedFeature] = useState<string>('');

  const checkVerification = useCallback(
    (featureName: string): boolean => {
      if (!user) {
        return false;
      }

      if (!user.emailVerified) {
        setBlockedFeature(featureName);
        setShowVerificationPrompt(true);
        return false;
      }

      return true;
    },
    [user]
  );

  const closePrompt = useCallback(() => {
    setShowVerificationPrompt(false);
    setBlockedFeature('');
  }, []);

  return {
    checkVerification,
    showVerificationPrompt,
    blockedFeature,
    closePrompt,
    isVerified: user?.emailVerified || false,
  };
}
