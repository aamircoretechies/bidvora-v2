import { api } from '@/lib/api';

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

export const freelancerService = {
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
