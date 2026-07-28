import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/auth/context/auth-context';

const MAX_TIMEOUT_MS = 2_147_483_647;

/**
 * Refreshes server-authoritative user and billing state when a trial reaches
 * its expiry time. The backend remains responsible for applying the status
 * transition.
 */
export function useTrialExpiryRefresh(trialEndsAt?: string | null) {
  const { verify } = useAuth();
  const queryClient = useQueryClient();
  const refreshedExpiry = useRef<string | null>(null);

  useEffect(() => {
    if (!trialEndsAt || refreshedExpiry.current === trialEndsAt) return;

    const expiryTime = new Date(trialEndsAt).getTime();
    if (Number.isNaN(expiryTime)) return;

    const refreshTrialState = async () => {
      refreshedExpiry.current = trialEndsAt;
      await Promise.allSettled([
        verify(),
        queryClient.refetchQueries({
          queryKey: ['billing', 'subscription'],
        }),
      ]);
    };

    const remainingMs = expiryTime - Date.now();
    if (remainingMs <= 0) {
      void refreshTrialState();
      return;
    }

    const timeoutId = window.setTimeout(
      () => void refreshTrialState(),
      Math.min(remainingMs + 1_000, MAX_TIMEOUT_MS),
    );

    return () => window.clearTimeout(timeoutId);
  }, [queryClient, trialEndsAt, verify]);
}
