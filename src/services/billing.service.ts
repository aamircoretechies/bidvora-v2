import { api } from '@/lib/api';
import { z } from 'zod';

// ─── Response shapes ──────────────────────────────────────────────────────────

export type BillingProvider = 'RAZORPAY' | 'PAYPAL' | 'STRIPE';
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

const subscriptionResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    subscription: z.object({
      plan: z.string().min(1),
      status: z.enum(['ACTIVE', 'TRIAL', 'SUSPENDED', 'CANCELLED', 'NONE']),
      subscriptionState: z.enum([
        'NONE',
        'ACTIVE',
        'CREATED',
        'AUTHENTICATED',
        'PENDING',
        'HALTED',
        'CANCELLED',
        'COMPLETED',
        'EXPIRED',
        'PAST_DUE',
      ]),
      billingProvider: z.enum(['RAZORPAY', 'PAYPAL', 'STRIPE']).nullable(),
      billingCountry: z.string().nullable(),
      billingCurrency: z.string().nullable(),
      planChangePolicy: z.enum(['cycle_end', 'immediate']).nullable(),
      currentPeriodStart: z.string().nullable(),
      currentPeriodEnd: z.string().nullable(),
      pendingPlan: z.string().nullable(),
      planChangeEffectiveAt: z.string().nullable(),
      checkoutPendingAt: z.string().nullable(),
    }),
  }),
});

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

export const billingEventTypes = [
  'CHECKOUT_COMPLETED',
  'INVOICE_PAID',
  'INVOICE_FAILED',
  'SUBSCRIPTION_UPDATED',
  'SUBSCRIPTION_DELETED',
  'SUBSCRIPTION_CANCELLED',
] as const;

export type BillingEventType = (typeof billingEventTypes)[number];
export type BillingEventStatus = 'paid' | 'failed' | 'setup' | 'cancelled';

export interface BillingEvent {
  id: number;
  type: BillingEventType;
  plan: string;
  amountCents: number | null;
  currency: string;
  provider: string;
  createdAt: string;
  displayAmount: string;
  status: BillingEventStatus;
}

export interface BillingHistoryParams {
  page?: number;
  limit?: number;
  type?: BillingEventType[];
}

export interface BillingHistoryData {
  items: BillingEvent[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    type: BillingEventType[];
  };
}

interface BillingHistoryResponse {
  success: true;
  data: {
    items: BillingEvent[];
  };
  meta: {
    pagination: BillingHistoryData['pagination'];
    filters?: BillingHistoryData['filters'];
  };
}

// ─── Billing Service ──────────────────────────────────────────────────────────

export const billingService = {
  /**
   * GET /billing/subscription
   * Returns the authenticated user's plan, account status, and provider subscription state.
   */
  async getSubscription(): Promise<SubscriptionData> {
    const response = await api.get('/billing/subscription');
    const parsed = subscriptionResponseSchema.safeParse(response);

    if (!parsed.success) {
      throw new Error('The billing subscription response has an invalid schema');
    }

    return parsed.data.data.subscription;
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

  /**
   * GET /billing/history
   * Returns the authenticated user's paginated billing events, newest first.
   */
  async getHistory(params: BillingHistoryParams = {}): Promise<BillingHistoryData> {
    const page = Math.max(1, Math.trunc(params.page ?? 1));
    const limit = Math.min(100, Math.max(1, Math.trunc(params.limit ?? 20)));
    const query = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (params.type?.length) {
      query.set('type', params.type.join(','));
    }

    const response = (await api.get(
      `/billing/history?${query.toString()}`,
    )) as BillingHistoryResponse | BillingErrorResponse;

    if (!response.success) {
      const details = response.error.details
        ?.map((detail) => detail.message)
        .join(', ');
      throw new Error(
        details || response.error.message || 'Failed to fetch billing history',
      );
    }

    if (!Array.isArray(response.data?.items) || !response.meta?.pagination) {
      throw new Error('Invalid billing history response');
    }

    return {
      items: response.data.items,
      pagination: response.meta.pagination,
      filters: response.meta.filters ?? { type: [] },
    };
  },
};
