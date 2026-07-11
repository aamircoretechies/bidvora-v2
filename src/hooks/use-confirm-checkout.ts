import { useMutation, useQueryClient } from '@tanstack/react-query';
import { billingService } from '@/services/billing.service';

export function useConfirmCheckout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) =>
      billingService.confirmCheckout(sessionId),
    onSuccess: (result) => {
      queryClient.setQueryData(
        ['billing', 'subscription'],
        result.subscription,
      );
      void queryClient.invalidateQueries({ queryKey: ['billing', 'history'] });
    },
  });
}
