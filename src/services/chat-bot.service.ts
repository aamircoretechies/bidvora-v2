import { api } from '@/lib/api';

// ─── Response shapes (mirror the API contract) ────────────────────────────────

export type ChatBotStatus = string;

export interface ChatBotApiResponse {
  success: true;
  data: {
    chatStatus: ChatBotStatus;
  };
  meta?: Record<string, unknown>;
}

export interface ChatBotStopResponse {
  success: true;
  data: string;
  meta?: Record<string, unknown>;
}

/**
 * Status strings the server sends when the chat bot is considered active/running.
 * Centralised here so no component needs to know the raw string values.
 */
export const ACTIVE_CHAT_STATUSES = new Set(['running', 'active', 'started']);

// ─── Chat Bot Service ─────────────────────────────────────────────────────────

export const chatBotService = {
  /**
   * GET /chats/bot/status
   *
   * Returns the current chat bot status without mutating it.
   */
  async getStatus(): Promise<ChatBotStatus> {
    const response = await api.get('/chats/bot/status') as ChatBotApiResponse;

    if (!response.success || !response.data?.chatStatus) {
      throw new Error('Unexpected response from /chats/bot/status');
    }

    return response.data.chatStatus;
  },

  /**
   * POST /chats/bot/start
   *
   * Starts the chat reply bot.
   */
  async start(): Promise<ChatBotStatus> {
    const response = await api.post('/chats/bot/start', {}) as ChatBotApiResponse;

    if (!response.success || !response.data?.chatStatus) {
      throw new Error('Unexpected response from /chats/bot/start');
    }

    return response.data.chatStatus;
  },

  /**
   * POST /chats/bot/stop
   *
   * Stops the chat reply bot.
   */
  async stop(): Promise<ChatBotStatus> {
    const response = await api.post('/chats/bot/stop', {}) as ChatBotStopResponse;

    if (!response.success) {
      throw new Error('Unexpected response from /chats/bot/stop');
    }

    // The API documentation states the stop endpoint returns data: "string"
    // We handle it here and ensure we return a string representation.
    // If it returns 'stopped', we return it, or fallback to 'stopped'.
    return typeof response.data === 'string' && response.data ? response.data : 'stopped';
  },
};
