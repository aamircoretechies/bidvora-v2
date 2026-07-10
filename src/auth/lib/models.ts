// Define UUID type for consistent usage
export type UUID = string;

// Language code type for user preferences
export type LanguageCode = 'en' | 'de' | 'es' | 'fr' | 'ja' | 'zh';

// Auth model representing the authentication session
export interface AuthModel {
  access_token: string;
  refresh_token?: string;
}

// Billing metadata returned by POST /auth/register
export interface RegisterMeta {
  billingPending: boolean;
  checkoutUrl: string | null;
  subscriptionId: string | null;
  billingSetupFailed: boolean;
  message: string | null;
}

// User model representing the user profile
export interface UserModel {
  id: any;
  username: string;
  password?: string; // Optional as we don't always retrieve passwords
  email: string;
  /** Display name from the server (replaces first_name + last_name) */
  name?: string;
  first_name: string;
  last_name: string;
  fullname?: string; // May be stored directly in metadata
  email_verified?: boolean;
  emailVerified?: boolean;
  occupation?: string;
  companyName?: string;
  company_name?: string; // Using snake_case consistently
  phone?: string;
  roles?: string[]; // Array of role IDs
  pic?: string;
  language?: LanguageCode; // Maintain existing type
  is_admin?: boolean; // Added admin flag

  // ── Server-authoritative fields from GET /auth/me ─────────────────────────
  role?: 'ADMIN' | 'CLIENT' | 'USER';
  status?: 'PENDING_VERIFICATION' | 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
  plan?: 'STARTER' | 'PRO';
  selectedPlan?: 'STARTER' | 'PRO';
  billingCountry?: string | null;
  billingProvider?: 'RAZORPAY' | 'PAYPAL' | null;
  billingCurrency?: 'inr' | 'usd' | null;
  trialEndsAt?: string | null;
  billingPending?: boolean;
  subscriptionState?:
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
}
