import { useQuery } from '@tanstack/react-query';
import { billingService } from '@/services/billing.service';

export function usePlans(country?: string | null) {
  const normalizedCountry = country?.trim().toUpperCase() ?? '';
  const isValidCountry = /^[A-Z]{2}$/.test(normalizedCountry);
  const query = useQuery({
    queryKey: ['billing', 'plans', normalizedCountry],
    queryFn: () => billingService.getPlans(normalizedCountry),
    enabled: isValidCountry,
    staleTime: 5 * 60_000,
    retry: 1,
  });

  return {
    plans: query.data ?? null,
    loading: query.isLoading,
    error: !isValidCountry && country !== undefined
      ? 'A confirmed two-letter billing country is required.'
      : query.error instanceof Error
        ? query.error.message
        : null,
    refetch: () => {
      void query.refetch();
    },
  };
}
