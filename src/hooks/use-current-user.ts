import { useQuery } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';

export function useCurrentUser() {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => authService.getMe(),
    staleTime: 30_000,
    retry: 1,
  });
}
