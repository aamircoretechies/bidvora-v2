import { useCallback, useState } from 'react';
import { bidsService } from '@/services/bids.service';

interface UseManualBidState {
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
  placeBid: (projectId: number) => Promise<void>;
}

export function useManualBid(): UseManualBidState {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const placeBid = useCallback(async (projectId: number) => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await bidsService.placeManualBid(projectId);
      setSuccessMessage(response.data || 'Manual bid placed successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place manual bid');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { isLoading, error, successMessage, placeBid };
}
