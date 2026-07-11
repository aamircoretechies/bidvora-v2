import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useRefreshBilling() {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshBilling = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['billing', 'subscription'] }),
        queryClient.refetchQueries({ queryKey: ['billing', 'history'] }),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  return { refreshBilling, isRefreshing };
}
