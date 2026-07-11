import { api } from '@/lib/api';
import { z } from 'zod';

// ─── Response shapes (mirror the API contract) ────────────────────────────────

export type BotStatus = string;

const biddingControlResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    orchestratorStatus: z.string(),
    botStatus: z.string(),
    biddingEnabled: z.boolean(),
    biddingEligible: z.boolean(),
    biddingActive: z.boolean(),
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

export type BiddingControlData = z.infer<
  typeof biddingControlResponseSchema
>['data'];

// ─── Bot Service ──────────────────────────────────────────────────────────────

/**
 * Bot service — owns all /bot/* endpoints.
 *
 * Each method maps 1-to-1 with an API route.
 * Only this service knows the URLs; callers work with typed results.
 */
export const botService = {
  /**
   * POST /bot/bidding/start
   *
   * Starts the automated project-bidding bot for the authenticated user.
   * Requires a valid Bearer token (attached automatically by apiClient).
   *
   * @returns The complete server-authoritative bidding state.
   */
  async startBidding(): Promise<BiddingControlData> {
    const response = await api.post('/bot/bidding/start', {});
    const parsed = biddingControlResponseSchema.safeParse(response);

    if (!parsed.success) {
      throw new Error(
        'The start-bidding response has an invalid schema',
      );
    }

    return parsed.data.data;
  },

  /**
   * POST /bot/bidding/stop
   *
   * Stops the running project-bidding bot for the authenticated user.
   * Requires a valid Bearer token (attached automatically by apiClient).
   *
   * @returns The complete server-authoritative bidding state.
   */
  async stopBidding(): Promise<BiddingControlData> {
    const response = await api.post('/bot/bidding/stop', {});
    const parsed = biddingControlResponseSchema.safeParse(response);

    if (!parsed.success) {
      throw new Error(
        'The stop-bidding response has an invalid schema',
      );
    }

    return parsed.data.data;
  },

  /**
   * GET /bot/status
   *
   * Returns the current bot status without mutating it.
   * Called on mount so the UI reflects real server state immediately,
   * even if the bot was started in a previous session.
   *
   * @returns The complete server-authoritative per-user bidding state.
   */
  async getStatus(): Promise<BiddingControlData> {
    const response = await api.get('/bot/status');
    const parsed = biddingControlResponseSchema.safeParse(response);

    if (!parsed.success) {
      throw new Error('The bidding-status response has an invalid schema');
    }

    return parsed.data.data;
  },
};
