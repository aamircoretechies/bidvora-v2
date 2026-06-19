import { api } from '@/lib/api';

export interface AuthConfig {
  key: string;
  clientId: string;
  clientSecret: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  isFreelancerConnected: boolean;
}

export interface BotConfig {
  id: number;
  llmModel: string;
  targetSkills: string;
  blacklistKeywords: string;
  excludedCountries: string;
  targetCurrencies: string;
  minBudget: number;
  maxBudget: number;
  minHourlyRate: number;
  maxHourlyRate: number;
  bidFactorPercent: number;
  hourlyPrice: number;
  dailyBidLimit: number;
  maxBidsPerCycle: number;
  maxExistingBids: number;
  systemPrompt: string | null;
  portfolioItems: string | null;
  autoReplyDelay: number;
}

export interface SettingsApiResponse {
  success: boolean;
  data: {
    authConfig: AuthConfig;
    botConfig: BotConfig;
  };
}

export const settingsService = {
  /**
   * GET /settings
   * Returns masked auth config and bot config.
   */
  async getSettings(): Promise<SettingsApiResponse> {
    const response = (await api.get('/settings')) as SettingsApiResponse;

    if (!response.success) {
      throw new Error('Failed to fetch settings');
    }

    return response;
  },

  /**
   * PUT /settings
   * Updates auth config and bot config.
   */
  async updateSettings(payload: Partial<BotConfig & AuthConfig>): Promise<SettingsApiResponse> {
    const response = (await api.put('/settings', payload)) as SettingsApiResponse;

    if (!response.success) {
      throw new Error('Failed to update settings');
    }

    return response;
  },
};
