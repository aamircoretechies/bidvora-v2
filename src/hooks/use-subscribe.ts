import { useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { billingService } from '@/services/billing.service';

function createIdempotencyKey(plan: 'STARTER' | 'PRO') {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `checkout-${plan.toLowerCase()}-${crypto.randomUUID()}`;
  }
  return `checkout-${plan.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function useSubscribe() {
  const queryClient = useQueryClient();
  const keys = useRef(new Map<'STARTER' | 'PRO', string>());

  return useMutation({
    mutationFn: async (plan: 'STARTER' | 'PRO') => {
      let key = keys.current.get(plan);
      if (!key) {
        key = createIdempotencyKey(plan);
        keys.current.set(plan, key);
      }
      return billingService.subscribe(plan, key);
    },
    onSuccess: (result) => {
      queryClient.setQueryData(['billing', 'subscription'], result.subscription);
    },
  });
}
