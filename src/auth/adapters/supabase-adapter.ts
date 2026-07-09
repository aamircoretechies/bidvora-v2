import { AuthModel, RegisterMeta, UserModel } from '@/auth/lib/models';
import { authService } from '@/services/auth.service';

const MOCK_USER: UserModel = {
  id: 'mock-user-123',
  email: 'admin@example.com',
  email_verified: true,
  username: 'admin',
  first_name: 'Admin',
  last_name: 'User',
  fullname: 'Admin User',
  occupation: 'Developer',
  company_name: 'Example Corp',
  companyName: 'Example Corp',
  phone: '123-456-7890',
  roles: ['admin'],
  pic: '',
  language: 'en',
  is_admin: true,
};

const MOCK_AUTH: AuthModel = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
};

/**
 * Supabase adapter that maintains the same interface as the existing auth flow
 * but uses a mock implementation so no Supabase is required.
 */
export const SupabaseAdapter = {
  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<AuthModel> {
    console.log('Adapter: Attempting login with email:', email);

    const API_BASE_URL =
      import.meta.env.VITE_API_BASE_URL ||
      'https://freelancer-backend.coretechiestest.org/api/v1';

    try {
      // Use raw fetch to bypass the apiClient 401 interceptor.
      // If credentials are wrong the server returns 401 which the interceptor
      // would misinterpret as an expired session and throw "Session expired".
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const response = await res.json();

      if (!res.ok) {
        // Surface the actual server error message (e.g. "Invalid credentials")
        throw new Error(
          response?.error?.message ||
          response?.message ||
          `Login failed (${res.status})`,
        );
      }

      if (response.success && response.data) {
        const user = {
          ...MOCK_USER,
          id: response.data.user.id.toString(),
          email: response.data.user.email,
        };
        localStorage.setItem('auth_user', JSON.stringify(user));

        return {
          access_token: response.data.accessToken,
          refresh_token: response.data.refreshToken,
        };
      }

      throw new Error('Invalid response from server');
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  },


  /**
   * Login with OAuth provider (Google, GitHub, etc.)
   */
  async signInWithOAuth(
    provider:
      | 'google'
      | 'github'
      | 'facebook'
      | 'twitter'
      | 'discord'
      | 'slack',
    options?: { redirectTo?: string },
  ): Promise<void> {
    console.log(
      'Mock SupabaseAdapter: Initiating OAuth flow with provider:',
      provider,
    );
    // Simulate OAuth redirect or just do nothing
  },

  /**
   * Register a new CLIENT account (credit card required upfront).
   * POSTs { email, password, name, plan } to POST /auth/register.
   * The server returns JWT tokens immediately plus billingPending=true and a
   * checkoutUrl the frontend must open via Razorpay checkout.
   */
  async register(
    email: string,
    confirmEmail: string,
    password: string,
    name: string,
    plan: string,
    country: string,
    idempotencyKey?: string,
  ): Promise<AuthModel & { meta: RegisterMeta }> {
    const API_BASE_URL =
      import.meta.env.VITE_API_BASE_URL ||
      'https://freelancer-backend.coretechiestest.org/api/v1';

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (idempotencyKey) {
        headers['idempotency-key'] = idempotencyKey;
      }

      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ email, confirmEmail, password, name, plan, country }),
      });

      const response = await res.json();

      if (!res.ok) {
        // 422 Validation errors – surface field-level messages
        if (
          (response?.error?.code === 'VALIDATION_ERROR' ||
            response?.error?.code === 'BAD_REQUEST') &&
          response?.error?.details
        ) {
          throw new Error(
            response.error.details.map((d: any) => d.message).join(', '),
          );
        }
        const error = new Error(
          response?.error?.message ||
            response?.message ||
            `Registration failed (${res.status})`,
        ) as Error & { status?: number };
        error.status = res.status;
        throw error;
      }

      if (response.success && response.data) {
        const serverUser = response.data.user;
        const user = {
          ...MOCK_USER,
          id: serverUser.id.toString(),
          email: serverUser.email,
          first_name: serverUser.name ?? '',
          last_name: '',
          fullname: serverUser.name ?? '',
          status: serverUser.status,
          plan: serverUser.plan ?? plan,
          selectedPlan: serverUser.selectedPlan ?? plan,
          trialEndsAt: serverUser.trialEndsAt ?? null,
          billingPending: serverUser.billingPending,
          subscriptionState: serverUser.subscriptionState,
          billingCountry: country,
          email_verified: serverUser.emailVerified ?? false,
          emailVerified: serverUser.emailVerified ?? false,
        };
        localStorage.setItem('auth_user', JSON.stringify(user));

        const meta: RegisterMeta = {
          billingPending: response.meta?.billingPending ?? false,
          checkoutUrl: response.meta?.checkoutUrl ?? null,
          subscriptionId: response.meta?.subscriptionId ?? null,
          billingSetupFailed: response.meta?.billingSetupFailed ?? false,
          message: response.meta?.message ?? null,
        };

        return {
          access_token: response.data.accessToken,
          refresh_token: response.data.refreshToken,
          meta,
        };
      }

      throw new Error('Invalid response from server');
    } catch (error: any) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  /**
   * Start Checkout
   */
  async startCheckout(idempotencyKey?: string): Promise<RegisterMeta> {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://freelancer-backend.coretechiestest.org/api/v1';
    const authHelper = await import('@/auth/lib/helpers');
    const auth = authHelper.getAuth();
    const token = auth?.access_token;

    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (idempotencyKey) {
      headers['idempotency-key'] = idempotencyKey;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/auth/register/start-checkout`, {
        method: 'POST',
        headers,
      });

      const response = await res.json().catch(() => null);

      if (!res.ok) {
        const details = Array.isArray(response?.error?.details)
          ? response.error.details.map((detail: any) => detail.message).join(', ')
          : '';
        const error = new Error(
          response?.error?.message ||
          details ||
          response?.message ||
          `Checkout start failed (${res.status})`
        ) as Error & { status?: number; code?: string; details?: unknown };
        error.status = res.status;
        error.code = response?.error?.code;
        error.details = response?.error?.details;
        throw error;
      }

      if (response.success && (response.data || response.meta)) {
        const data = response.data ?? {};
        const meta = response.meta ?? {};
        return {
          billingPending: meta.billingPending ?? true,
          checkoutUrl: data.checkoutUrl ?? meta.checkoutUrl ?? null,
          subscriptionId: data.subscriptionId ?? meta.subscriptionId ?? null,
          billingSetupFailed: meta.billingSetupFailed ?? false,
          message: meta.message ?? null,
        };
      }

      throw new Error('Invalid response from server');
    } catch (error: any) {
      console.error('startCheckout error:', error);
      throw error;
    }
  },

  /**
   * Verify Email
   */
  async verifyEmail(token: string): Promise<UserModel> {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://freelancer-backend.coretechiestest.org/api/v1';
    const encodedToken = encodeURIComponent(token.trim());
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/verify-email/${encodedToken}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      const response = await res.json().catch(() => null);

      if (!res.ok) {
        const error = new Error(
          response?.error?.message ||
          response?.message ||
          `Email verification failed (${res.status})`
        ) as Error & { status?: number; code?: string };
        error.status = res.status;
        error.code = response?.error?.code;
        throw error;
      }

      if (response?.success && response?.data?.user) {
        const me = response.data.user;
        const cached = localStorage.getItem('auth_user');
        const cachedUser: Partial<UserModel> = cached ? JSON.parse(cached) : {};

        const user: UserModel = {
          ...MOCK_USER,
          ...cachedUser,
          id: me.id.toString(),
          email: me.email,
          name: me.name,
          first_name: me.name ?? cachedUser.first_name ?? '',
          last_name: cachedUser.last_name ?? '',
          fullname: me.name ?? cachedUser.fullname ?? '',
          role: me.role,
          is_admin: me.role === 'ADMIN',
          status: me.status,
          plan: me.plan,
          selectedPlan: me.selectedPlan,
          trialEndsAt: me.trialEndsAt,
          billingPending: me.billingPending,
          subscriptionState: me.subscriptionState,
          email_verified: me.emailVerified,
          emailVerified: me.emailVerified,
          billingCountry: me.billingCountry ?? cachedUser.billingCountry ?? null,
        };

        localStorage.setItem('auth_user', JSON.stringify(user));
        return user;
      }
      throw new Error('Invalid response from server');
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        throw new Error('Email verification timed out. Please check your connection and try the link again.');
      }
      console.error('verifyEmail error:', error);
      throw error;
    } finally {
      window.clearTimeout(timeoutId);
    }
  },

  /**
   * Confirm Razorpay trial checkout and clear billingPending
   */
  async confirmBilling(subscriptionId: string, idempotencyKey?: string): Promise<UserModel> {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://freelancer-backend.coretechiestest.org/api/v1';
    const authHelper = await import('@/auth/lib/helpers');
    const auth = authHelper.getAuth();
    const token = auth?.access_token;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (idempotencyKey) {
      headers['idempotency-key'] = idempotencyKey;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/auth/register/confirm-billing`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ subscriptionId }),
      });

      const response = await res.json();

      if (!res.ok) {
        throw new Error(
          response?.error?.message ||
          response?.message ||
          `Billing confirmation failed (${res.status})`
        );
      }

      if (response.success && response.data) {
        const me = response.data.user;
        const cached = localStorage.getItem('auth_user');
        const cachedUser: Partial<UserModel> = cached ? JSON.parse(cached) : {};

        const user: UserModel = {
          ...MOCK_USER,
          ...cachedUser,
          id: me.id.toString(),
          email: me.email,
          name: me.name,
          first_name: me.name ?? cachedUser.first_name ?? '',
          last_name: cachedUser.last_name ?? '',
          fullname: me.name ?? cachedUser.fullname ?? '',
          role: me.role,
          is_admin: me.role === 'ADMIN',
          status: me.status,
          plan: me.plan,
          selectedPlan: me.selectedPlan,
          trialEndsAt: me.trialEndsAt,
          billingPending: me.billingPending,
          subscriptionState: me.subscriptionState,
          email_verified: me.emailVerified ?? cachedUser.email_verified ?? true,
          emailVerified: me.emailVerified ?? cachedUser.emailVerified ?? true,
          billingCountry: me.billingCountry ?? cachedUser.billingCountry ?? null,
        };

        localStorage.setItem('auth_user', JSON.stringify(user));
        return user;
      }

      throw new Error('Invalid response from server');
    } catch (error: any) {
      console.error('confirmBilling error:', error);
      throw error;
    }
  },

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    console.log('Mock SupabaseAdapter: Requesting password reset for:', email);
  },

  /**
   * Reset password with token
   */
  async resetPassword(
    password: string,
    password_confirmation: string,
  ): Promise<void> {
    if (password !== password_confirmation) {
      throw new Error('Passwords do not match');
    }
  },

  /**
   * Request another verification email
   */
  async resendVerificationEmail(): Promise<void> {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://freelancer-backend.coretechiestest.org/api/v1';
    const authHelper = await import('@/auth/lib/helpers');
    const auth = authHelper.getAuth();
    const token = auth?.access_token;

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/auth/verify-email/resend`, {
        method: 'POST',
        headers,
      });

      if (!res.ok) {
        const response = await res.json().catch(() => null);
        throw new Error(
          response?.error?.message ||
          response?.message ||
          `Failed to resend verification email (${res.status})`
        );
      }
    } catch (error: any) {
      console.error('resendVerificationEmail error:', error);
      throw error;
    }
  },

  /**
   * Get current user from the session.
   *
   * Calls GET /auth/me using the stored Bearer token.
   * Falls back to any locally cached user if the network call fails
   * (e.g. offline / expired token handled upstream by verify()).
   */
  async getCurrentUser(): Promise<UserModel | null> {
    try {
      const me = await authService.getMe();

      // Merge server identity into the full UserModel shape.
      // Fields not returned by /auth/me (pic, etc.) are preserved
      // from the cached profile when available.
      const cached = localStorage.getItem('auth_user');
      const cachedUser: Partial<UserModel> = cached
        ? JSON.parse(cached)
        : {};

      const user: UserModel = {
        ...MOCK_USER,
        ...cachedUser,
        // Identity
        id: me.id.toString(),
        email: me.email,
        name: me.name,
        first_name: me.name ?? cachedUser.first_name ?? '',
        last_name: cachedUser.last_name ?? '',
        fullname: me.name ?? cachedUser.fullname ?? '',
        // Role & access
        role: me.role,
        is_admin: me.role === 'ADMIN',
        // Account status
        status: me.status,
        // Billing & plan
        plan: me.plan,
        selectedPlan: me.selectedPlan,
        trialEndsAt: me.trialEndsAt,
        billingPending: me.billingPending,
        subscriptionState: me.subscriptionState,
        email_verified: me.emailVerified,
        emailVerified: me.emailVerified,
        billingCountry: me.billingCountry ?? cachedUser.billingCountry ?? null,
      };

      // Keep the cache fresh
      localStorage.setItem('auth_user', JSON.stringify(user));

      return user;
    } catch (error) {
      console.warn('getCurrentUser: /auth/me failed, using cached user', error);

      // Return cached user if available so the session is not lost
      // on a transient network hiccup.
      const cached = localStorage.getItem('auth_user');
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {
          // fall through
        }
      }

      // Re-throw so the provider's verify() can clear auth state
      throw error;
    }
  },

  /**
   * Get user profile from user metadata
   */
  async getUserProfile(): Promise<UserModel> {
    const user = await this.getCurrentUser();
    return user || MOCK_USER;
  },

  /**
   * Update user profile (stored in metadata)
   */
  async updateUserProfile(userData: Partial<UserModel>): Promise<UserModel> {
    const currentUser = await this.getCurrentUser();
    const updatedUser = { ...(currentUser || MOCK_USER), ...userData };
    localStorage.setItem('auth_user', JSON.stringify(updatedUser));
    return updatedUser;
  },

  /**
   * Logout the current user
   */
  async logout(): Promise<void> {
    console.log('Adapter: Logged out');
    localStorage.removeItem('auth_user');
  },
};
