import { AuthModel, UserModel } from '@/auth/lib/models';
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
   * Register a new user
   */
  async register(
    email: string,
    password: string,
    password_confirmation: string,
    firstName?: string,
    lastName?: string,
  ): Promise<AuthModel> {
    if (password !== password_confirmation) {
      throw new Error('Passwords do not match');
    }

    const API_BASE_URL =
      import.meta.env.VITE_API_BASE_URL ||
      'https://freelancer-backend.coretechiestest.org/api/v1';

    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const response = await res.json();

      if (!res.ok) {
        if (response?.error?.code === 'VALIDATION_ERROR' && response?.error?.details) {
          throw new Error(response.error.details.map((d: any) => d.message).join(', '));
        }
        throw new Error(
          response?.error?.message ||
          response?.message ||
          `Registration failed (${res.status})`,
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
      console.error('Registration error:', error);
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
  async resendVerificationEmail(email: string): Promise<void> {
    console.log('Mock SupabaseAdapter: Resend verification email:', email);
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
      // Fields not returned by /auth/me (name, pic, etc.) are preserved
      // from the cached profile when available.
      const cached = localStorage.getItem('auth_user');
      const cachedUser: Partial<UserModel> = cached
        ? JSON.parse(cached)
        : {};

      const user: UserModel = {
        ...MOCK_USER,
        ...cachedUser,
        id: me.id.toString(),
        email: me.email,
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
