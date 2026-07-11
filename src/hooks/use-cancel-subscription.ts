import { useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { billingService } from '@/services/billing.service';

function createIdempotencyKey() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `cancel-${crypto.randomUUID()}`;
  }
  return `cancel-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();
  const idempotencyKey = useRef(createIdempotencyKey());

  return useMutation({
    mutationFn: (cancelAtPeriodEnd: boolean) =>
      billingService.cancelSubscription(
        cancelAtPeriodEnd,
        idempotencyKey.current,
      ),
    onSuccess: (result) => {
      queryClient.setQueryData(['billing', 'subscription'], result.subscription);
      void queryClient.invalidateQueries({ queryKey: ['billing', 'history'] });
    },
  });
}
