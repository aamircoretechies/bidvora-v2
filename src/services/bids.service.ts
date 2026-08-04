import { api } from '@/lib/api';

export interface IBid {
  id: number;
  userId: number;
  projectId: number;
  title: string;
  amount: number;
  currency: string;
  proposal: string;
  period: number;
  status: string;
  bidType: string;
  country: string;
  skills: string;
  error?: string | null;
  questions?: string;
  createdAt: string;
}

export interface BidsApiResponse {
  success: boolean;
  data: {
    bids: IBid[];
  };
  meta: {
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    filters?: Record<string, unknown>;
  };
}

export interface GetBidsParams {
  search?: string;
  status?: string;
  country?: string;
  skill?: string;
  date?: string;
  page?: number;
  limit?: number;
}

interface RetryBidApiResponse {
  success: boolean;
  data?: null | Partial<IBid> | { bid?: Partial<IBid> };
  error?: string | { message?: string; code?: string } | null;
  meta?: { message?: string };
}

export interface RetryBidResult {
  success: boolean;
  status: string;
  error: string | null;
  message: string;
  bid?: Partial<IBid>;
}

function readApiError(
  value: RetryBidApiResponse['error'] | IBid['error'],
): string | null {
  if (typeof value === 'string') return value.trim() || null;
  if (value && typeof value === 'object' && 'message' in value) {
    const message = value.message;
    return typeof message === 'string' ? message.trim() || null : null;
  }
  return null;
}

function normalizeRetryBidResponse(
  response: RetryBidApiResponse,
): RetryBidResult {
  const data = response.data;
  const bid =
    data && typeof data === 'object' && 'bid' in data && data.bid
      ? data.bid
      : data && typeof data === 'object'
        ? (data as Partial<IBid>)
        : undefined;
  const apiError = readApiError(response.error) || readApiError(bid?.error);
  const apiStatus = typeof bid?.status === 'string' ? bid.status.trim() : '';
  const apiIndicatesFailure = [
    'failed',
    'failure',
    'rejected',
    'error',
  ].includes(apiStatus.toLowerCase());
  const status =
    !response.success || apiError || apiIndicatesFailure
      ? 'failed'
      : apiStatus || 'success';
  const success = response.success && !apiError && !apiIndicatesFailure;

  return {
    success,
    status,
    error: apiError,
    message:
      response.meta?.message ||
      apiError ||
      (success ? 'Bid retried successfully!' : 'Failed to retry bid'),
    bid,
  };
}

export const bidsService = {
  /**
   * GET /bids
   * Fetches a paginated list of bids, optionally filtered by various parameters.
   */
  async getBids(params?: GetBidsParams): Promise<BidsApiResponse> {
    const query = new URLSearchParams();

    if (params) {
      if (params.search) query.append('search', params.search);
      if (params.status) query.append('status', params.status);
      if (params.country) query.append('country', params.country);
      if (params.skill) query.append('skill', params.skill);
      if (params.date) query.append('date', params.date);
      if (params.page !== undefined)
        query.append('page', params.page.toString());
      if (params.limit !== undefined)
        query.append('limit', params.limit.toString());
    }

    const qs = query.toString();
    const endpoint = qs ? `/bids?${qs}` : '/bids';

    const response = (await api.get(endpoint)) as BidsApiResponse;

    if (!response.success) {
      throw new Error('Failed to fetch bids');
    }

    return response;
  },

  /**
   * POST /bids/manual
   * Places a manual bid on a project
   */
  async placeManualBid(
    projectId: number,
  ): Promise<{ success: boolean; data: any; meta?: any }> {
    const response = (await api.post('/bids/manual', { projectId })) as any;

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to place manual bid');
    }

    return response;
  },

  /**
   * POST /bids/{id}/retry
   * Retries placing a failed bid
   */
  async retryBid(id: number): Promise<RetryBidResult> {
    const response = (await api.post(
      `/bids/${id}/retry`,
      {},
    )) as RetryBidApiResponse;

    return normalizeRetryBidResponse(response);
  },
};
