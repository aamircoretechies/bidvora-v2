import { api } from '@/lib/api';
import { z } from 'zod';

export interface FreelancerAuthorizeResponse {
  success: boolean;
  data: {
    url: string;
  };
}

export interface FreelancerCallbackResponse {
  success: boolean;
  data: {
    connected: boolean;
  };
}

const freelancerStatsResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    totalBids: z.number().int().nonnegative(),
    successfulBids: z.number().int().nonnegative(),
    actionRequired: z.number().int().nonnegative(),
  }),
});

export type FreelancerStats = z.infer<
  typeof freelancerStatsResponseSchema
>['data'];

export const freelancerService = {
  /** GET /stats - aggregate metrics for the connected Freelancer account. */
  async getStats(): Promise<FreelancerStats> {
    const response = await api.get('/stats');
    const parsed = freelancerStatsResponseSchema.safeParse(response);

    if (!parsed.success) {
      throw new Error('The Freelancer statistics response has an invalid schema');
    }

    return parsed.data.data;
  },

  /**
   * GET /auth/freelancer/authorize
   * Get Freelancer OAuth authorization URL.
   */
  async getFreelancerAuthorizeUrl(): Promise<FreelancerAuthorizeResponse> {
    const response = (await api.get('/auth/freelancer/authorize')) as FreelancerAuthorizeResponse;

    if (!response.success) {
      throw new Error('Failed to get authorization URL');
    }

    return response;
  },

  /**
   * POST /auth/freelancer/callback
   * Exchange Freelancer OAuth code for tokens and mark Freelancer account as connected.
   */
  async connectFreelancerCallback(code: string): Promise<FreelancerCallbackResponse> {
    const response = (await api.post('/auth/freelancer/callback', { code })) as FreelancerCallbackResponse;

    if (!response.success) {
      throw new Error('Failed to connect Freelancer account');
    }

    return response;
  },
};
