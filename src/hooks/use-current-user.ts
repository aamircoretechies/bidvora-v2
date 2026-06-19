import { useCallback, useEffect, useState } from 'react';
import { authService, MeUserPayload } from '@/services/auth.service';
import { useAuth } from '@/auth/context/auth-context';

interface UseCurrentUserState {
  /** The raw user payload from /auth/me */
  data: MeUserPayload | null;
  loading: boolean;
  error: string | null;
  /** Manually re-fetch /auth/me (e.g. after profile update) */
  refetch: () => Promise<void>;
}

/**
 * useCurrentUser
 *
 * Fetches the authenticated user from GET /auth/me.
 *
 * Only runs when a valid access token exists (i.e. the user is logged in).
 * The result is separate from the broader `UserModel` stored in AuthContext —
 * it reflects the server's latest truth about the current session.
 *
 * Usage:
 *   const { data: me, loading, error } = useCurrentUser();
 */
export function useCurrentUser(): UseCurrentUserState {
  const { auth } = useAuth();

  const [data, setData] = useState<MeUserPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMe = useCallback(async () => {
    if (!auth?.access_token) return;

    setLoading(true);
    setError(null);

    try {
      const user = await authService.getMe();
      setData(user);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch user info';
      setError(message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [auth?.access_token]);

  // Fetch on mount and whenever the access token changes (e.g. login / token refresh)
  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  return { data, loading, error, refetch: fetchMe };
}
