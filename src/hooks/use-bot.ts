import { useCallback, useEffect, useState } from 'react';
import {
  botService,
  type BiddingControlData,
  type BotStatus,
} from '@/services/bot.service';

/**
 * Tracks which action is currently in-flight, or null when idle.
 * 'fetching' — initial GET /bot/status on mount
 * 'starting' — POST /bot/bidding/start in-flight
 * 'stopping' — POST /bot/bidding/stop in-flight
 */
type BotAction = 'fetching' | 'starting' | 'stopping' | null;

interface UseBotState {
  /** Latest bot status string returned by the server */
  status: BotStatus | null;
  /** True when the bot is considered active per server state */
  isBidding: boolean;
  /** True only after a status or action response has established server state. */
  hasResolvedStatus: boolean;
  /** Which action is currently in-flight (null = idle) */
  action: BotAction;
  /** Error message if the last call failed */
  error: string | null;
  /** Latest complete state returned by a start/stop action. */
  biddingState: BiddingControlData | null;
  /** Call POST /bot/bidding/start */
  startBot: () => Promise<void>;
  /** Call POST /bot/bidding/stop */
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
  const [hasResolvedStatus, setHasResolvedStatus] = useState(false);
  const [biddingState, setBiddingState] = useState<BiddingControlData | null>(null);
  const [action, setAction] = useState<BotAction>('fetching');
  const [error, setError] = useState<string | null>(null);

  // ── Fetch real status on mount ──────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const fetchStatus = async () => {
      try {
        const currentState = await botService.getStatus();
        if (cancelled) return;
        setBiddingState(currentState);
        setStatus(currentState.botStatus);
        setIsBidding(currentState.biddingActive);
        setHasResolvedStatus(true);
        setError(null);
      } catch (statusError) {
        if (!cancelled) {
          setIsBidding(false);
          setError(
            statusError instanceof Error
              ? statusError.message
              : 'Failed to load bidding status',
          );
        }
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
      const nextState = await botService.startBidding();
      setBiddingState(nextState);
      setStatus(nextState.botStatus);
      setIsBidding(nextState.biddingActive);
      setHasResolvedStatus(true);
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
      const nextState = await botService.stopBidding();
      setBiddingState(nextState);
      setStatus(nextState.botStatus);
      setIsBidding(nextState.biddingActive);
      setHasResolvedStatus(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop the bidding bot');
    } finally {
      setAction(null);
    }
  }, []);

  return {
    status,
    isBidding,
    hasResolvedStatus,
    action,
    error,
    biddingState,
    startBot,
    stopBot,
  };
}
