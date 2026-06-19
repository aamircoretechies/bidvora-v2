import { api } from '@/lib/api';

export interface DashboardStatus {
  isFreelancerConnected: boolean;
  botStatus: string;
  chatStatus: string;
}

export interface DashboardApiResponse {
  success: boolean;
  data: DashboardStatus;
}

export const dashboardService = {
  /**
   * GET /dashboard
   * Fetches dashboard status summary including connection and bot statuses.
   */
  async getStatus(): Promise<DashboardApiResponse> {
    const response = (await api.get('/dashboard')) as DashboardApiResponse;

    if (!response.success) {
      throw new Error('Failed to fetch dashboard status');
    }

    return response;
  },
};
