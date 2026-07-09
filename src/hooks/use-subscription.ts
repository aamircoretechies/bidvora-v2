import { useState, useEffect } from 'react';
import { billingService, SubscriptionData } from '@/services/billing.service';

interface UseSubscriptionResult {
  subscription: SubscriptionData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useSubscription(): UseSubscriptionResult {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchSubscription() {
      setLoading(true);
      setError(null);
      try {
        const data = await billingService.getSubscription();
        if (!cancelled) setSubscription(data);
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Failed to load subscription');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchSubscription();

    return () => {
      cancelled = true;
    };
  }, [trigger]);

  const refetch = () => setTrigger((t) => t + 1);

  return { subscription, loading, error, refetch };
}
