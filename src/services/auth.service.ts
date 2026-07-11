import { api } from '@/lib/api';
import { z } from 'zod';

// ─── Response shapes (mirror the API contract) ───────────────────────────────

/** Plan tiers supported by the platform */
export type UserPlan = 'STARTER' | 'PRO';

/** Account roles */
export type UserRole = 'ADMIN' | 'CLIENT' | 'USER';

/** Account lifecycle statuses */
export type UserStatus =
  | 'PENDING_VERIFICATION'
  | 'TRIAL'
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
  | 'EXPIRED'
  | 'PAST_DUE';

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
  billingCountry?: string | null;
  billingProvider?: 'RAZORPAY' | 'PAYPAL' | null;
  billingCurrency?: 'inr' | 'usd' | null;
  emailVerified: boolean;
  subscriptionState: SubscriptionState;
}

export interface MeResponse {
  success: true;
  data: {
    user: MeUserPayload;
  };
  meta?: Record<string, unknown>;
}

const meResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    user: z.object({
      id: z.number().int(),
      email: z.string().email(),
      name: z.string(),
      role: z.enum(['ADMIN', 'CLIENT', 'USER']),
      status: z.enum([
        'PENDING_VERIFICATION',
        'TRIAL',
        'ACTIVE',
        'SUSPENDED',
        'DEACTIVATED',
      ]),
      plan: z.enum(['STARTER', 'PRO']),
      selectedPlan: z.enum(['STARTER', 'PRO']),
      trialEndsAt: z.string().nullable(),
      billingPending: z.boolean(),
      subscriptionState: z.enum([
        'NONE',
        'CREATED',
        'AUTHENTICATED',
        'ACTIVE',
        'PENDING',
        'HALTED',
        'CANCELLED',
        'COMPLETED',
        'EXPIRED',
        'PAST_DUE',
      ]),
      emailVerified: z.boolean(),
      billingCountry: z.string().nullable().optional(),
      billingProvider: z.enum(['RAZORPAY', 'PAYPAL']).nullable().optional(),
      billingCurrency: z.enum(['inr', 'usd']).nullable().optional(),
    }),
  }),
  meta: z.record(z.string(), z.unknown()).optional(),
});

export interface AuthErrorResponse {
  success: false;
  error: {
    code: 'UNAUTHORIZED' | string;
    message: string;
  };
}

export interface RefreshResponse {
  success: true;
  data: {
    accessToken: string;
    refreshToken: string;
  };
  meta?: Record<string, unknown>;
}

export interface LogoutResponse {
  success: true;
  data: string;
  meta?: Record<string, unknown>;
}

export interface RegisterPreferencesRequest {
  country?: string;
  plan?: UserPlan;
}

export interface RegisterPreferencesResponse {
  success: true;
  data: {
    user: MeUserPayload;
  };
  meta?: Record<string, unknown>;
}

export interface StartCheckoutResponse {
  success: true;
  data: {
    checkoutMode: 'razorpay_modal' | 'redirect';
    subscriptionId: string;
    checkoutUrl?: string;
    razorpayKeyId?: string;
    prefill?: {
      email: string;
      name: string;
    };
  };
  meta?: {
    message?: string;
  } & Record<string, unknown>;
}

export interface ConfirmBillingResponse {
  success: true;
  data: {
    user: MeUserPayload;
  };
  meta?: {
    message?: string;
  } & Record<string, unknown>;
}

export interface AuthEndpointErrorResponse {
  success: false;
  error: {
    code:
      | 'BAD_REQUEST'
      | 'FORBIDDEN'
      | 'UNAUTHORIZED'
      | 'VALIDATION_ERROR'
      | string;
    message: string;
    details?: Array<{
      field: string;
      message: string;
    }>;
  };
}

function createEndpointError(
  fallbackMessage: string,
  status: number,
  response: AuthEndpointErrorResponse | null,
) {
  const details = response?.error.details
    ?.map((detail) => detail.message)
    .join(', ');
  const error = new Error(
    details ||
      response?.error.message ||
      `${fallbackMessage} (${status})`,
  ) as Error & { status?: number; code?: string; details?: unknown };

  error.status = status;
  error.code = response?.error.code;
  error.details = response?.error.details;

  return error;
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
    const response = await api.get('/auth/me');
    const parsed = meResponseSchema.safeParse(response);

    if (!parsed.success) {
      throw new Error('The current-user response has an invalid schema');
    }

    return parsed.data.data.user;
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
      '/api/v1';

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
   * POST /auth/logout
   *
   * Revokes the current refresh token. This intentionally uses raw fetch
   * instead of `api.post` so logout never triggers token refresh.
   */
  async logout(refreshToken: string, accessToken?: string): Promise<LogoutResponse> {
    const API_BASE_URL =
      import.meta.env.VITE_API_BASE_URL ||
      '/api/v1';

    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ refreshToken }),
    });

    const data = (await response.json().catch(() => null)) as
      | LogoutResponse
      | AuthErrorResponse
      | null;

    if (!response.ok || !data?.success) {
      throw new Error(
        data && !data.success
          ? data.error.message
          : `Logout failed (${response.status})`,
      );
    }

    return data;
  },

  /**
   * PATCH /auth/register/preferences
   *
   * Updates signup billing country and/or selected plan before checkout starts.
   */
  async updateRegisterPreferences(
    payload: RegisterPreferencesRequest,
  ): Promise<MeUserPayload> {
    const response = (await api.patch(
      '/auth/register/preferences',
      payload,
    )) as RegisterPreferencesResponse;

    if (!response.success || !response.data?.user) {
      throw new Error('Unexpected response from /auth/register/preferences');
    }

    return response.data.user;
  },

  /**
   * POST /auth/register/start-checkout
   *
   * Creates the trial subscription and returns the hosted checkout URL.
   */
  async startCheckout(
    accessToken?: string,
    idempotencyKey?: string,
  ): Promise<StartCheckoutResponse['data'] & { message: string | null }> {
    const API_BASE_URL =
      import.meta.env.VITE_API_BASE_URL ||
      '/api/v1';

    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    if (idempotencyKey) {
      headers['idempotency-key'] = idempotencyKey;
    }

    const res = await fetch(`${API_BASE_URL}/auth/register/start-checkout`, {
      method: 'POST',
      headers,
    });
    const response = (await res.json().catch(() => null)) as
      | StartCheckoutResponse
      | AuthEndpointErrorResponse
      | null;

    if (!res.ok || !response?.success) {
      throw createEndpointError(
        'Checkout start failed',
        res.status,
        response && !response.success ? response : null,
      );
    }

    if (
      response.data.checkoutMode === 'razorpay_modal' &&
      (!response.data.razorpayKeyId || !response.data.subscriptionId)
    ) {
      throw new Error('Razorpay checkout configuration is incomplete');
    }

    if (
      response.data.checkoutMode === 'redirect' &&
      !response.data.checkoutUrl
    ) {
      throw new Error('Redirect checkout URL is missing');
    }

    return {
      checkoutMode: response.data.checkoutMode,
      checkoutUrl: response.data.checkoutUrl,
      subscriptionId: response.data.subscriptionId,
      razorpayKeyId: response.data.razorpayKeyId,
      prefill: response.data.prefill,
      message: response.meta?.message ?? null,
    };
  },

  /**
   * POST /auth/register/confirm-billing
   *
   * Polls the payment provider subscription and clears billingPending when active.
   */
  async confirmBilling(
    subscriptionId: string,
    accessToken?: string,
    idempotencyKey?: string,
  ): Promise<MeUserPayload> {
    const API_BASE_URL =
      import.meta.env.VITE_API_BASE_URL ||
      '/api/v1';

    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    if (idempotencyKey) {
      headers['idempotency-key'] = idempotencyKey;
    }

    const res = await fetch(`${API_BASE_URL}/auth/register/confirm-billing`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ subscriptionId }),
    });
    const response = (await res.json().catch(() => null)) as
      | ConfirmBillingResponse
      | AuthEndpointErrorResponse
      | null;

    if (!res.ok || !response?.success) {
      throw createEndpointError(
        'Billing confirmation failed',
        res.status,
        response && !response.success ? response : null,
      );
    }

    return response.data.user;
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
