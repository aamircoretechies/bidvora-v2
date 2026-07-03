import { api } from '@/lib/api';

// ─── Response shapes (mirror the API contract) ───────────────────────────────

/** Plan tiers supported by the platform */
export type UserPlan = 'STARTER' | 'PRO';

/** Account roles */
export type UserRole = 'ADMIN' | 'USER';

/** Account lifecycle statuses */
export type UserStatus =
  | 'PENDING_VERIFICATION'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'DEACTIVATED';

/** Razorpay subscription states */
export type SubscriptionState =
  | 'NONE'
  | 'CREATED'
  | 'AUTHENTICATED'
  | 'ACTIVE'
  | 'PENDING'
  | 'HALTED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'EXPIRED';

/**
 * Full user payload returned by GET /auth/me
 * Keep in sync with the backend schema.
 */
export interface MeUserPayload {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  plan: UserPlan;
  selectedPlan: UserPlan;
  trialEndsAt: string | null;
  billingPending: boolean;
  subscriptionState: SubscriptionState;
}

export interface MeResponse {
  success: true;
  data: {
    user: MeUserPayload;
  };
  meta?: Record<string, unknown>;
}

export interface RefreshResponse {
  success: true;
  data: {
    accessToken: string;
    refreshToken: string;
  };
  meta?: Record<string, unknown>;
}

// ─── Auth Service ─────────────────────────────────────────────────────────────

/**
 * Auth service — thin wrapper over `api` that owns all /auth/* endpoints.
 *
 * Each method maps 1-to-1 with an API route so callers never touch raw URLs.
 */
export const authService = {
  /**
   * GET /auth/me
   *
   * Returns the currently authenticated user based on the Bearer token.
   * Called:
   *   • Right after login (to hydrate the full user profile)
   *   • On every protected-route mount via `verify()` (session check)
   */
  async getMe(): Promise<MeUserPayload> {
    const response: MeResponse = await api.get('/auth/me');

    if (!response.success || !response.data?.user) {
      throw new Error('Unexpected response from /auth/me');
    }

    return response.data.user;
  },

  /**
   * POST /auth/refresh
   *
   * Exchanges a valid refresh token for a new access + refresh token pair.
   * Called automatically by the apiClient interceptor on 401 responses —
   * do NOT call this from UI code; let the interceptor handle it.
   *
   * Uses a raw fetch (not api.post) to avoid triggering the 401 interceptor
   * recursively when the refresh token itself is invalid.
   */
  async refresh(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const API_BASE_URL =
      import.meta.env.VITE_API_BASE_URL ||
      'https://freelancer-backend.coretechiestest.org/api/v1';

    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Refresh token is invalid or expired');
    }

    const data: RefreshResponse = await response.json();

    if (!data.success || !data.data?.accessToken) {
      throw new Error('Unexpected response from /auth/refresh');
    }

    return data.data;
  },

  /**
   * POST /auth/forgot-password
   * Request a password reset email
   */
  async forgotPassword(email: string): Promise<{ success: boolean; meta?: any }> {
    const response = await api.post('/auth/forgot-password', { email }) as any;
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to request password reset');
    }
    return response;
  },

  /**
   * GET /auth/reset-password/{token}
   * Check if reset token is valid
   */
  async checkResetToken(token: string): Promise<{ valid: boolean }> {
    const response = await api.get(`/auth/reset-password/${token}`) as any;
    if (!response.success) {
      throw new Error(response.error?.message || 'Invalid or expired token');
    }
    return response.data;
  },

  /**
   * POST /auth/reset-password/{token}
   * Set new password with reset token
   */
  async resetPassword(token: string, password: string): Promise<{ success: boolean; meta?: any }> {
    const response = await api.post(`/auth/reset-password/${token}`, { password }) as any;
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to reset password');
    }
    return response;
  },
};
