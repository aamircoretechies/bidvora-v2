import { api } from '@/lib/api';
import { z } from 'zod';

// ─── Response shapes (mirror the API contract) ────────────────────────────────

export type ChatBotStatus = string;

const chatAgentControlResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    orchestratorStatus: z.string(),
    chatStatus: z.string(),
    chatBotEnabled: z.boolean(),
    chatEligible: z.boolean(),
    chatBotActive: z.boolean(),
    account: z.object({
      status: z.string(),
      plan: z.string(),
      role: z.string(),
    }),
  }),
  meta: z
    .object({
      message: z.string().optional(),
    })
    .passthrough()
    .optional(),
});

export type ChatAgentControlData = z.infer<
  typeof chatAgentControlResponseSchema
>['data'];

// ─── Chat Bot Service ─────────────────────────────────────────────────────────

export const chatBotService = {
  /**
   * GET /chats/bot/status
   *
   * Returns the current chat bot status without mutating it.
   */
  async getStatus(): Promise<ChatAgentControlData> {
    const response = await api.get('/chats/bot/status');
    const parsed = chatAgentControlResponseSchema.safeParse(response);

    if (!parsed.success) {
      throw new Error('The chat-agent status response has an invalid schema');
    }

    return parsed.data.data;
  },

  /**
   * POST /chats/agent/start
   *
   * Starts the chat reply bot.
   */
  async startAgent(): Promise<ChatAgentControlData> {
    const response = await api.post('/chats/agent/start', {});
    const parsed = chatAgentControlResponseSchema.safeParse(response);

    if (!parsed.success) {
      throw new Error('The start-chat-agent response has an invalid schema');
    }

    return parsed.data.data;
  },

  /**
   * POST /chats/agent/stop
   *
   * Stops the chat reply bot.
   */
  async stopAgent(): Promise<ChatAgentControlData> {
    const response = await api.post('/chats/agent/stop', {});
    const parsed = chatAgentControlResponseSchema.safeParse(response);

    if (!parsed.success) {
      throw new Error('The stop-chat-agent response has an invalid schema');
    }

    return parsed.data.data;
  },
};
