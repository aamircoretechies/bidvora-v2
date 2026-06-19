import { api } from '@/lib/api';

// ─── Response shapes (mirror the API contract) ────────────────────────────────

export type BotStatus = string;

/** Shared shape for /bot/start, /bot/stop, and /bot/status */
export interface BotApiResponse {
  success: true;
  data: {
    botStatus: BotStatus;
  };
  meta?: Record<string, unknown>;
}

/**
 * Status strings the server sends when the bot is considered active/running.
 * Centralised here so no component needs to know the raw string values.
 */
export const ACTIVE_STATUSES = new Set(['running', 'active', 'started']);

// ─── Bot Service ──────────────────────────────────────────────────────────────

/**
 * Bot service — owns all /bot/* endpoints.
 *
 * Each method maps 1-to-1 with an API route.
 * Only this service knows the URLs; callers work with typed results.
 */
export const botService = {
  /**
   * POST /bot/start
   *
   * Starts the automated project-bidding bot for the authenticated user.
   * Requires a valid Bearer token (attached automatically by apiClient).
   *
   * @returns The bot status string returned by the server (e.g. "running")
   */
  async start(): Promise<BotStatus> {
    const response = await api.post('/bot/start', {}) as BotApiResponse;

    if (!response.success || !response.data?.botStatus) {
      throw new Error('Unexpected response from /bot/start');
    }

    return response.data.botStatus;
  },

  /**
   * POST /bot/stop
   *
   * Stops the running project-bidding bot for the authenticated user.
   * Requires a valid Bearer token (attached automatically by apiClient).
   *
   * @returns The bot status string returned by the server (e.g. "stopped")
   */
  async stop(): Promise<BotStatus> {
    const response = await api.post('/bot/stop', {}) as BotApiResponse;

    if (!response.success || !response.data?.botStatus) {
      throw new Error('Unexpected response from /bot/stop');
    }

    return response.data.botStatus;
  },

  /**
   * GET /bot/status
   *
   * Returns the current bot status without mutating it.
   * Called on mount so the UI reflects real server state immediately,
   * even if the bot was started in a previous session.
   *
   * @returns The bot status string returned by the server
   */
  async getStatus(): Promise<BotStatus> {
    const response = await api.get('/bot/status') as BotApiResponse;

    if (!response.success || !response.data?.botStatus) {
      throw new Error('Unexpected response from /bot/status');
    }

    return response.data.botStatus;
  },
};

