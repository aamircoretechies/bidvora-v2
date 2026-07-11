import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/auth/context/auth-context';

export function useResendVerificationEmail() {
  const { resendVerificationEmail } = useAuth();

  return useMutation({
    mutationFn: () => resendVerificationEmail(),
  });
}
