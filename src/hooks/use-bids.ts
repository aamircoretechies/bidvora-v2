import { useCallback, useState } from 'react';
import { bidsService, IBid, GetBidsParams } from '@/services/bids.service';

interface UseBidsState {
  data: IBid[];
  isLoading: boolean;
  error: string | null;
  totalRecords: number;
  fetchBids: (params?: GetBidsParams) => Promise<void>;
}

export function useBids(): UseBidsState {
  const [data, setData] = useState<IBid[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [totalRecords, setTotalRecords] = useState<number>(0);

  const fetchBids = useCallback(async (params?: GetBidsParams) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await bidsService.getBids(params);
      setData(response.data.bids || []);
      setTotalRecords(response.meta.pagination.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bids');
      setData([]);
      setTotalRecords(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { data, isLoading, error, totalRecords, fetchBids };
}
