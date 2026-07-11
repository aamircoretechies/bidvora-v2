// ─── Api Service ─────────────────────────────────────────────────────────────

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  '/api/v1';

// ─── Token storage helpers ────────────────────────────────────────────────────

/**
 * Finds the auth storage key by scanning for the `-auth-v` pattern set by
 * authHelper.setAuth(). Returns the key and parsed value together.
 */
const findAuthEntry = (): { key: string; value: Record<string, string> } | null => {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('-auth-v')) {
        const raw = localStorage.getItem(key);
        if (raw) return { key, value: JSON.parse(raw) };
      }
    }
  } catch {
    // ignore
  }
  return null;
};

const getStoredAccessToken = (): string | null =>
  findAuthEntry()?.value?.access_token ?? null;

const getStoredRefreshToken = (): string | null =>
  findAuthEntry()?.value?.refresh_token ?? null;

/**
 * Persists a new token pair in-place so the rest of the app (authHelper,
 * AuthProvider) sees the updated tokens without a full reload.
 */
const saveTokens = (accessToken: string, refreshToken: string): void => {
  const entry = findAuthEntry();
  if (!entry) return;
  const updated = { ...entry.value, access_token: accessToken, refresh_token: refreshToken };
  localStorage.setItem(entry.key, JSON.stringify(updated));
};

/**
 * Removes the stored auth entirely — triggers RequireAuth to redirect to login.
 */
const clearAuth = (): void => {
  const entry = findAuthEntry();
  if (entry) localStorage.removeItem(entry.key);
  localStorage.removeItem('auth_user');
};

// ─── Token refresh (raw fetch — lives here to avoid circular imports) ─────────
//
// api.ts  →  imports auth.service.ts  would cause a circular dependency because
// auth.service.ts  →  imports api.ts.  We therefore keep the raw refresh call
// here at the infrastructure level and expose a typed wrapper in auth.service.ts
// for any direct consumers.

/** Guards against kicking off multiple simultaneous refresh calls. */
let isRefreshing = false;

/**
 * Queue of resolve callbacks from requests that 401'd while a refresh was
 * already in-flight. Once the refresh completes they all retry with the new token.
 */
let refreshQueue: Array<(newToken: string) => void> = [];

const flushQueue = (newToken: string): void => {
  refreshQueue.forEach((cb) => cb(newToken));
  refreshQueue = [];
};

const rejectQueue = (): void => {
  refreshQueue.forEach(() => {});
  refreshQueue = [];
};

/**
 * Calls POST /auth/refresh with a raw fetch so it bypasses the interceptor
 * (preventing infinite retry loops when the refresh token is also invalid).
 */
const performRefresh = async (): Promise<string> => {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) throw new Error('No refresh token available');

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) throw new Error('Refresh token expired or invalid');

  const data = await response.json();
  if (!data?.success || !data?.data?.accessToken) {
    throw new Error('Unexpected response from /auth/refresh');
  }

  const { accessToken, refreshToken: newRefreshToken } = data.data;
  saveTokens(accessToken, newRefreshToken);

  return accessToken;
};

// ─── Core apiClient with 401 interceptor ─────────────────────────────────────

export const apiClient = async (
  endpoint: string,
  options: RequestInit = {},
  _isRetry = false,  // prevents infinite retry loops
): Promise<unknown> => {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  const token = getStoredAccessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const config: RequestInit = { ...options, headers };
  const response = await fetch(url, config);

  // ── Happy path ──────────────────────────────────────────────────────────────
  if (response.ok) return response.json();

  // ── 401: attempt token refresh then retry once ──────────────────────────────
  if (response.status === 401 && !_isRetry) {
    if (isRefreshing) {
      // Another request already triggered a refresh — wait for it to finish
      return new Promise((resolve, reject) => {
        refreshQueue.push((newToken: string) => {
          const retryHeaders = new Headers(options.headers || {});
          retryHeaders.set('Content-Type', 'application/json');
          retryHeaders.set('Authorization', `Bearer ${newToken}`);

          fetch(url, { ...options, headers: retryHeaders })
            .then((r) => (r.ok ? r.json() : Promise.reject(r)))
            .then(resolve)
            .catch(reject);
        });
      });
    }

    isRefreshing = true;

    try {
      const newToken = await performRefresh();
      isRefreshing = false;
      flushQueue(newToken);

      // Retry the original request with the fresh token
      return apiClient(endpoint, options, true);
    } catch (refreshError) {
      isRefreshing = false;
      rejectQueue();
      clearAuth();
      // Throwing causes RequireAuth to see no auth → redirect to /auth/signin
      throw new Error('Session expired. Please sign in again.');
    }
  }

  // ── Other error statuses ────────────────────────────────────────────────────
  const errorData = await response.json().catch(() => null);
  throw new Error(
    errorData?.error?.message || `Error: ${response.status} ${response.statusText}`,
  );
};

// ─── Convenience wrappers ─────────────────────────────────────────────────────

export const api = {
  post: (endpoint: string, body: unknown, options: RequestInit = {}) =>
    apiClient(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    }),

  get: (endpoint: string, options: RequestInit = {}) =>
    apiClient(endpoint, {
      ...options,
      method: 'GET',
    }),

  put: (endpoint: string, body: unknown, options: RequestInit = {}) =>
    apiClient(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  patch: (endpoint: string, body: unknown, options: RequestInit = {}) =>
    apiClient(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
};
