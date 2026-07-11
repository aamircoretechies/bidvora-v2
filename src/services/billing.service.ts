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

const subscriptionSchema = z.object({
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
});

const subscriptionResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    subscription: subscriptionSchema,
  }),
});

const cancelSubscriptionResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    subscription: subscriptionSchema,
    cancelAtPeriodEnd: z.boolean().optional(),
    effectiveAt: z.string().nullable().optional(),
    alreadyCancelled: z.boolean().optional(),
  }),
  meta: z.record(z.string(), z.unknown()).optional(),
});

const subscribeResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    subscription: subscriptionSchema,
    checkoutUrl: z.string().url().nullable().optional(),
  }),
  meta: z.record(z.string(), z.unknown()).optional(),
});

const confirmCheckoutResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    subscription: subscriptionSchema,
  }),
  meta: z.record(z.string(), z.unknown()).optional(),
});

export type CancelSubscriptionResult = z.infer<
  typeof cancelSubscriptionResponseSchema
>['data'];

export type SubscribeResult = z.infer<typeof subscribeResponseSchema>['data'];
export type ConfirmCheckoutResult = z.infer<
  typeof confirmCheckoutResponseSchema
>['data'];

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

const billingPlansResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    country: z.string().regex(/^[A-Z]{2}$/),
    currency: z.enum(['inr', 'usd']),
    billingProvider: z.enum(['RAZORPAY', 'PAYPAL']),
    planChangePolicy: z.enum(['cycle_end', 'immediate']),
    plans: z.array(
      z.object({
        plan: z.enum(['STARTER', 'PRO']),
        amountCents: z.number().int().nonnegative(),
        currency: z.enum(['inr', 'usd']),
        interval: z.enum(['month', 'year']),
        displayAmount: z.string().min(1),
      }),
    ),
  }),
});

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
   * POST /billing/confirm
   * Confirms a paid checkout session after the provider success redirect.
   */
  async confirmCheckout(sessionId: string): Promise<ConfirmCheckoutResult> {
    const normalizedSessionId = sessionId.trim();
    if (!normalizedSessionId) throw new Error('Checkout session ID is required');

    const response = await api.post('/billing/confirm', {
      sessionId: normalizedSessionId,
    });
    const parsed = confirmCheckoutResponseSchema.safeParse(response);

    if (!parsed.success) {
      throw new Error('The checkout confirmation response has an invalid schema');
    }

    return parsed.data.data;
  },

  /**
   * POST /billing/subscribe
   * Creates or resumes checkout, or schedules a plan change.
   */
  async subscribe(
    plan: 'STARTER' | 'PRO',
    idempotencyKey: string,
  ): Promise<SubscribeResult> {
    const response = await api.post(
      '/billing/subscribe',
      { plan },
      { headers: { 'Idempotency-Key': idempotencyKey } },
    );
    const parsed = subscribeResponseSchema.safeParse(response);

    if (!parsed.success) {
      throw new Error('The subscription checkout response has an invalid schema');
    }

    return parsed.data.data;
  },

  /**
   * POST /billing/cancel
   * Requests an idempotent provider-side subscription cancellation.
   */
  async cancelSubscription(
    cancelAtPeriodEnd: boolean,
    idempotencyKey: string,
  ): Promise<CancelSubscriptionResult> {
    const response = await api.post(
      '/billing/cancel',
      { cancelAtPeriodEnd },
      { headers: { 'Idempotency-Key': idempotencyKey } },
    );
    const parsed = cancelSubscriptionResponseSchema.safeParse(response);

    if (!parsed.success) {
      throw new Error('The subscription cancellation response has an invalid schema');
    }

    return parsed.data.data;
  },

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
    if (!/^[A-Z]{2}$/.test(normalizedCountry)) {
      throw new Error('A valid two-letter billing country is required');
    }

    const response = await api.get(
      `/billing/plans?country=${encodeURIComponent(normalizedCountry)}`,
    );
    const parsed = billingPlansResponseSchema.safeParse(response);

    if (!parsed.success) {
      throw new Error('The billing plans response has an invalid schema');
    }

    return parsed.data.data;
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
