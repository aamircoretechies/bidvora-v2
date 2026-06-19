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
  error?: string;
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
      if (params.page !== undefined) query.append('page', params.page.toString());
      if (params.limit !== undefined) query.append('limit', params.limit.toString());
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
  async placeManualBid(projectId: number): Promise<{ success: boolean; data: string; meta?: any }> {
    const response = (await api.post('/bids/manual', { projectId })) as { success: boolean; data: string; meta?: any };

    if (!response.success) {
      throw new Error('Failed to place manual bid');
    }

    return response;
  },

  /**
   * POST /bids/{id}/retry
   * Retries placing a failed bid
   */
  async retryBid(id: number): Promise<{ success: boolean; data: null; meta?: { message?: string } }> {
    const response = (await api.post(`/bids/${id}/retry`, {})) as {
      success: boolean;
      data: null;
      meta?: { message?: string };
    };

    if (!response.success) {
      throw new Error('Failed to retry bid');
    }

    return response;
  },
};
