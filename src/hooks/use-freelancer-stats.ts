import { useQuery } from '@tanstack/react-query';
import { freelancerService } from '@/services/freelancer.service';

export function useFreelancerStats() {
  return useQuery({
    queryKey: ['freelancer', 'stats'],
    queryFn: () => freelancerService.getStats(),
    staleTime: 30_000,
    retry: 1,
  });
}
