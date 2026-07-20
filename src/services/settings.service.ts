import { api } from '@/lib/api';

export interface AuthConfig {
  userId?: number;
  key?: string;
  clientId: string;
  clientSecret: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  isFreelancerConnected: boolean;
  llmModel?: string;
  openaiApiKey?: string;
  geminiApiKey?: string;
  nvidiaApiKey?: string;
}

export interface BotConfig {
  id?: number;
  userId?: number;
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
  bidWebhookUrl?: string;
  bidSheetId?: string;
  targetSheetId?: string;
  googleWebhookUrl?: string;
  sheetsWebhookSecret?: string;
  telegramBotToken?: string;
  telegramChatId?: string;
  defaultPeriodDays?: number;
  biddingEnabled?: boolean;
  chatBotEnabled?: boolean;
}

export interface SecretsConfig {
  userId?: number;
  openaiApiKey?: string;
  geminiApiKey?: string;
  nvidiaApiKey?: string;
  embeddingApiKey?: string;
  googleServiceAccountJson?: string;
  hasOpenaiApiKey?: boolean;
  hasGeminiApiKey?: boolean;
  hasNvidiaApiKey?: boolean;
  hasEmbeddingApiKey?: boolean;
  hasGoogleServiceAccountJson?: boolean;
}

export interface SettingsApiResponse {
  success: true;
  data: {
    authConfig: AuthConfig;
    botConfig: BotConfig;
    secrets: SecretsConfig;
  };
  meta?: Record<string, unknown>;
}

export interface UpdateSettingsPayload {
  llmModel?: string;
  clientId?: string;
  clientSecret?: string;
  openaiApiKey?: string;
  geminiApiKey?: string;
  nvidiaApiKey?: string;
  embeddingApiKey?: string;
  googleServiceAccountJson?: string;
  targetSkills?: string;
  blacklistKeywords?: string;
  excludedCountries?: string;
  targetCurrencies?: string;
  minBudget?: number;
  maxBudget?: number;
  minHourlyRate?: number;
  maxHourlyRate?: number;
  bidFactorPercent?: number;
  hourlyPrice?: number;
  dailyBidLimit?: number;
  maxBidsPerCycle?: number;
  maxExistingBids?: number;
  systemPrompt?: string;
  portfolioItems?: string;
  autoReplyDelay?: number;
  bidWebhookUrl?: string;
  bidSheetId?: string;
  targetSheetId?: string;
  googleWebhookUrl?: string;
  sheetsWebhookSecret?: string;
  telegramBotToken?: string;
  telegramChatId?: string;
  defaultPeriodDays?: number;
}

export const settingsService = {
  /**
   * GET /settings
   * Returns masked auth config, bot config, and secrets.
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
   * Updates auth config, bot config, and secrets.
   */
  async updateSettings(payload: UpdateSettingsPayload): Promise<SettingsApiResponse> {
    if (Object.keys(payload).length === 0) {
      throw new Error('No settings changes to save');
    }

    const response = (await api.put('/settings', payload)) as SettingsApiResponse;

    if (!response.success) {
      throw new Error('Failed to update settings');
    }

    return response;
  },
};
