import { api } from '@/lib/api';

// ─── Response shapes ──────────────────────────────────────────────────────────

export type BillingProvider = 'RAZORPAY' | 'PAYPAL';
export type BillingPlanChangePolicy = 'cycle_end' | 'immediate';

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
  currency: string;
  interval: 'month' | 'year';
  displayAmount: string;
}

export interface BillingPlansData {
  country: string;
  currency: string;
  billingProvider: BillingProvider;
  planChangePolicy: BillingPlanChangePolicy;
  plans: BillingPlan[];
}

export interface BillingPlansResponse {
  success: true;
  data: BillingPlansData;
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
    )) as BillingPlansResponse;

    if (!response.success || !response.data?.plans) {
      throw new Error('Failed to fetch billing plans');
    }

    return response.data;
  },
};
