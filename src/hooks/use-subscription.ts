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
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchInterval: (subscriptionQuery) => {
      const subscription = subscriptionQuery.state.data;
      if (!subscription) return 30_000;

      const isAwaitingServerUpdate =
        subscription.status === 'TRIAL' ||
        Boolean(subscription.checkoutPendingAt) ||
        Boolean(subscription.pendingPlan) ||
        ['CREATED', 'AUTHENTICATED', 'PENDING', 'PAST_DUE'].includes(
          subscription.subscriptionState,
        );

      return isAwaitingServerUpdate ? 30_000 : false;
    },
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
