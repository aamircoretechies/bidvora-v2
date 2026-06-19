import { useCallback, useEffect, useState } from 'react';
import { botService, BotStatus, ACTIVE_STATUSES } from '@/services/bot.service';

/**
 * Tracks which action is currently in-flight, or null when idle.
 * 'fetching' — initial GET /bot/status on mount
 * 'starting' — POST /bot/start in-flight
 * 'stopping' — POST /bot/stop in-flight
 */
type BotAction = 'fetching' | 'starting' | 'stopping' | null;

interface UseBotState {
  /** Latest bot status string returned by the server */
  status: BotStatus | null;
  /** True when the bot is considered active per server state */
  isBidding: boolean;
  /** Which action is currently in-flight (null = idle) */
  action: BotAction;
  /** Error message if the last call failed */
  error: string | null;
  /** Call POST /bot/start */
  startBot: () => Promise<void>;
  /** Call POST /bot/stop */
  stopBot: () => Promise<void>;
}

/**
 * useBot
 *
 * Encapsulates the full bidding-bot lifecycle for UI components.
 *
 * On mount it calls GET /bot/status so the UI always reflects the real
 * server state — even if the bot was started in a previous browser session.
 *
 * Usage:
 *   const { startBot, stopBot, isBidding, action, error } = useBot();
 *
 *   <Button onClick={isBidding ? stopBot : startBot} disabled={action !== null}>
 *     {isBidding ? 'Stop Bidding' : 'Start Bidding'}
 *   </Button>
 */
export function useBot(): UseBotState {
  const [status, setStatus] = useState<BotStatus | null>(null);
  const [isBidding, setIsBidding] = useState(false);
  const [action, setAction] = useState<BotAction>('fetching');
  const [error, setError] = useState<string | null>(null);

  // ── Fetch real status on mount ──────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const fetchStatus = async () => {
      try {
        const botStatus = await botService.getStatus();
        if (cancelled) return;
        setStatus(botStatus);
        setIsBidding(ACTIVE_STATUSES.has(botStatus.toLowerCase()));
      } catch {
        // Non-fatal: if status fetch fails (e.g. network error), default to stopped
        // so the user can still attempt to start the bot.
        if (!cancelled) setIsBidding(false);
      } finally {
        if (!cancelled) setAction(null);
      }
    };

    fetchStatus();
    return () => { cancelled = true; };
  }, []);

  // ── Start bot ───────────────────────────────────────────────────────────────
  const startBot = useCallback(async () => {
    setAction('starting');
    setError(null);

    try {
      const botStatus = await botService.start();
      setStatus(botStatus);
      setIsBidding(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start the bidding bot');
    } finally {
      setAction(null);
    }
  }, []);

  // ── Stop bot ────────────────────────────────────────────────────────────────
  const stopBot = useCallback(async () => {
    setAction('stopping');
    setError(null);

    try {
      const botStatus = await botService.stop();
      setStatus(botStatus);
      setIsBidding(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop the bidding bot');
    } finally {
      setAction(null);
    }
  }, []);

  return { status, isBidding, action, error, startBot, stopBot };
}
