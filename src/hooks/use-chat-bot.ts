import { useCallback, useEffect, useState } from 'react';
import { chatBotService, ChatBotStatus, ACTIVE_CHAT_STATUSES } from '@/services/chat-bot.service';

/**
 * Tracks which action is currently in-flight, or null when idle.
 * 'fetching' — initial GET /chats/bot/status on mount
 * 'starting' — POST /chats/bot/start in-flight
 * 'stopping' — POST /chats/bot/stop in-flight
 */
type ChatBotAction = 'fetching' | 'starting' | 'stopping' | null;

interface UseChatBotState {
  /** Latest chat bot status string returned by the server */
  status: ChatBotStatus | null;
  /** True when the chat bot is considered active per server state */
  isChatBotActive: boolean;
  /** Which action is currently in-flight (null = idle) */
  action: ChatBotAction;
  /** Error message if the last call failed */
  error: string | null;
  /** Call POST /chats/bot/start */
  startChatBot: () => Promise<void>;
  /** Call POST /chats/bot/stop */
  stopChatBot: () => Promise<void>;
}

/**
 * useChatBot
 *
 * Encapsulates the full chat-bot lifecycle for UI components.
 *
 * On mount it calls GET /chats/bot/status so the UI always reflects the real
 * server state — even if the bot was started in a previous browser session.
 */
export function useChatBot(): UseChatBotState {
  const [status, setStatus] = useState<ChatBotStatus | null>(null);
  const [isChatBotActive, setIsChatBotActive] = useState(false);
  const [action, setAction] = useState<ChatBotAction>('fetching');
  const [error, setError] = useState<string | null>(null);

  // ── Fetch real status on mount ──────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const fetchStatus = async () => {
      try {
        const botStatus = await chatBotService.getStatus();
        if (cancelled) return;
        setStatus(botStatus);
        setIsChatBotActive(ACTIVE_CHAT_STATUSES.has(botStatus.toLowerCase()));
      } catch {
        // Non-fatal: if status fetch fails (e.g. network error), default to stopped
        // so the user can still attempt to start the bot.
        if (!cancelled) setIsChatBotActive(false);
      } finally {
        if (!cancelled) setAction(null);
      }
    };

    fetchStatus();
    return () => { cancelled = true; };
  }, []);

  // ── Start chat bot ──────────────────────────────────────────────────────────
  const startChatBot = useCallback(async () => {
    setAction('starting');
    setError(null);

    try {
      const botStatus = await chatBotService.start();
      setStatus(botStatus);
      setIsChatBotActive(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start the chat agent');
    } finally {
      setAction(null);
    }
  }, []);

  // ── Stop chat bot ───────────────────────────────────────────────────────────
  const stopChatBot = useCallback(async () => {
    setAction('stopping');
    setError(null);

    try {
      const botStatus = await chatBotService.stop();
      setStatus(botStatus);
      setIsChatBotActive(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop the chat agent');
    } finally {
      setAction(null);
    }
  }, []);

  return { status, isChatBotActive, action, error, startChatBot, stopChatBot };
}
