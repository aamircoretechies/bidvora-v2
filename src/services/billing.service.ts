import { api } from '@/lib/api';

// ─── Response shapes ──────────────────────────────────────────────────────────

export type BillingProvider = 'RAZORPAY' | 'PAYPAL';
export type BillingPlanChangePolicy = 'cycle_end' | 'immediate';
export type BillingCurrency = 'inr' | 'usd';

export type SubscriptionStatus = 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'CANCELLED' | 'NONE';
export type SubscriptionStateValue =
  | 'NONE'
  | 'ACTIVE'
  | 'CREATED'
  | 'AUTHENTICATED'
  | 'PENDING'
  | 'HALTED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'EXPIRED'
  | 'PAST_DUE';

export interface SubscriptionData {
  plan: string;
  status: SubscriptionStatus;
  subscriptionState: SubscriptionStateValue;
  billingProvider: BillingProvider | null;
  billingCountry: string | null;
  billingCurrency: string | null;
  planChangePolicy: BillingPlanChangePolicy | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  pendingPlan: string | null;
  planChangeEffectiveAt: string | null;
  checkoutPendingAt: string | null;
}

export interface SubscriptionResponse {
  success: true;
  data: {
    subscription: SubscriptionData;
  };
}

export interface BillingPlan {
  plan: 'STARTER' | 'PRO';
  amountCents: number;
  currency: BillingCurrency;
  interval: 'month' | 'year';
  displayAmount: string;
}

export interface BillingPlansData {
  country: string;
  currency: BillingCurrency;
  billingProvider: BillingProvider;
  planChangePolicy: BillingPlanChangePolicy;
  plans: BillingPlan[];
}

export interface BillingPlansResponse {
  success: true;
  data: BillingPlansData;
}

export interface BillingErrorResponse {
  success: false;
  error: {
    code: 'VALIDATION_ERROR' | 'BAD_REQUEST' | string;
    message: string;
    details?: Array<{
      field: string;
      message: string;
    }>;
  };
}

// ─── Billing Service ──────────────────────────────────────────────────────────

export const billingService = {
  /**
   * GET /billing/subscription
   * Returns the authenticated user's plan, account status, and provider subscription state.
   */
  async getSubscription(): Promise<SubscriptionData> {
    const response = (await api.get('/billing/subscription')) as SubscriptionResponse;

    if (!response.success || !response.data?.subscription) {
      throw new Error('Failed to fetch subscription data');
    }

    return response.data.subscription;
  },

  /**
   * GET /billing/plans?country={country}
   * Returns country-aware pricing and the payment gateway used for billing.
   */
  async getPlans(country: string): Promise<BillingPlansData> {
    const normalizedCountry = country.trim().toUpperCase();
    const response = (await api.get(
      `/billing/plans?country=${encodeURIComponent(normalizedCountry)}`,
    )) as BillingPlansResponse | BillingErrorResponse;

    if (!response.success) {
      const details = response.error.details
        ?.map((detail) => detail.message)
        .join(', ');
      throw new Error(details || response.error.message || 'Failed to fetch billing plans');
    }

    if (!response.data?.plans) {
      throw new Error('Failed to fetch billing plans');
    }

    return response.data;
  },
};
