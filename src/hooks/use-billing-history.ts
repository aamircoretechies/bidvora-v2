import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  billingService,
  type BillingHistoryParams,
} from '@/services/billing.service';

export const billingHistoryKeys = {
  all: ['billing', 'history'] as const,
  list: (params: BillingHistoryParams) =>
    [...billingHistoryKeys.all, params] as const,
};

export function useBillingHistory(params: BillingHistoryParams = {}) {
  return useQuery({
    queryKey: billingHistoryKeys.list(params),
    queryFn: () => billingService.getHistory(params),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    retry: 1,
  });
}
