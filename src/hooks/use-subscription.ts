import { useQuery } from '@tanstack/react-query';
import { billingService, type SubscriptionData } from '@/services/billing.service';

interface UseSubscriptionResult {
  subscription: SubscriptionData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useSubscription(): UseSubscriptionResult {
  const query = useQuery({
    queryKey: ['billing', 'subscription'],
    queryFn: () => billingService.getSubscription(),
    staleTime: 30_000,
    retry: 1,
  });

  return {
    subscription: query.data ?? null,
    loading: query.isLoading,
    error:
      query.error instanceof Error
        ? query.error.message
        : query.error
          ? 'Failed to load subscription'
          : null,
    refetch: () => {
      void query.refetch();
    },
  };
}
