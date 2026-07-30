import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/auth/context/auth-context';
import { useSubscription } from '@/hooks/use-subscription';
import { useTrialExpiryRefresh } from '@/hooks/use-trial-expiry-refresh';

const MAX_TIMEOUT_MS = 2_147_483_647;

export function usePlanExpiry() {
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const [now, setNow] = useState(() => Date.now());

  const trialEndsAt = subscription?.trialEndsAt ?? user?.trialEndsAt ?? null;
  useTrialExpiryRefresh(trialEndsAt);

  const expiresAt =
    subscription?.status === 'TRIAL'
      ? trialEndsAt
      : subscription?.currentPeriodEnd ?? null;

  useEffect(() => {
    if (!expiresAt) return;

    const expiryTime = new Date(expiresAt).getTime();
    if (Number.isNaN(expiryTime)) return;

    const remainingMs = expiryTime - Date.now();
    if (remainingMs <= 0) return;

    const timeoutId = window.setTimeout(
      () => setNow(Date.now()),
      Math.min(remainingMs, MAX_TIMEOUT_MS),
    );

    return () => window.clearTimeout(timeoutId);
  }, [expiresAt, now]);

  return useMemo(() => {
    if (!subscription) return false;

    const isInactiveStatus = ['CANCELLED', 'SUSPENDED', 'NONE'].includes(
      subscription.status,
    );
    const isInactiveState = ['CANCELLED', 'EXPIRED', 'HALTED'].includes(
      subscription.subscriptionState,
    );
    const expiryTime = expiresAt ? new Date(expiresAt).getTime() : Number.NaN;
    const hasExpiredAt =
      !Number.isNaN(expiryTime) && expiryTime <= now;

    return isInactiveStatus || isInactiveState || hasExpiredAt;
  }, [expiresAt, now, subscription]);
}
