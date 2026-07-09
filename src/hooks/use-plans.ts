import { useEffect, useState } from 'react';
import { billingService, BillingPlansData } from '@/services/billing.service';

interface UsePlansResult {
  plans: BillingPlansData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function usePlans(country: string): UsePlansResult {
  const [plans, setPlans] = useState<BillingPlansData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const normalizedCountry = country.trim().toUpperCase() || 'IN';

    async function fetchPlans() {
      setLoading(true);
      setError(null);
      try {
        const data = await billingService.getPlans(normalizedCountry);
        if (!cancelled) setPlans(data);
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Failed to load plans');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchPlans();

    return () => {
      cancelled = true;
    };
  }, [country, trigger]);

  const refetch = () => setTrigger((current) => current + 1);

  return { plans, loading, error, refetch };
}
