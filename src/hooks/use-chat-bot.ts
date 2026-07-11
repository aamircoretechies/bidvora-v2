import { useCallback, useEffect, useState } from 'react';
import {
  chatBotService,
  type ChatAgentControlData,
  type ChatBotStatus,
} from '@/services/chat-bot.service';

/**
 * Tracks which action is currently in-flight, or null when idle.
 * 'fetching' — initial GET /chats/bot/status on mount
 * 'starting' — POST /chats/agent/start in-flight
 * 'stopping' — POST /chats/agent/stop in-flight
 */
type ChatBotAction = 'fetching' | 'starting' | 'stopping' | null;

interface UseChatBotState {
  /** Latest chat bot status string returned by the server */
  status: ChatBotStatus | null;
  /** True when the chat bot is considered active per server state */
  isChatBotActive: boolean;
  /** True only after a status or action response has established server state. */
  hasResolvedStatus: boolean;
  /** Which action is currently in-flight (null = idle) */
  action: ChatBotAction;
  /** Error message if the last call failed */
  error: string | null;
  /** Latest complete state returned by a start/stop action. */
  agentState: ChatAgentControlData | null;
  /** Call POST /chats/agent/start */
  startChatBot: () => Promise<void>;
  /** Call POST /chats/agent/stop */
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
  const [hasResolvedStatus, setHasResolvedStatus] = useState(false);
  const [agentState, setAgentState] = useState<ChatAgentControlData | null>(null);
  const [action, setAction] = useState<ChatBotAction>('fetching');
  const [error, setError] = useState<string | null>(null);

  // ── Fetch real status on mount ──────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const fetchStatus = async () => {
      try {
        const currentState = await chatBotService.getStatus();
        if (cancelled) return;
        setAgentState(currentState);
        setStatus(currentState.chatStatus);
        setIsChatBotActive(currentState.chatBotActive);
        setHasResolvedStatus(true);
        setError(null);
      } catch (statusError) {
        if (!cancelled) {
          setError(
            statusError instanceof Error
              ? statusError.message
              : 'Failed to load chat-agent status',
          );
        }
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
      const nextState = await chatBotService.startAgent();
      setAgentState(nextState);
      setStatus(nextState.chatStatus);
      setIsChatBotActive(nextState.chatBotActive);
      setHasResolvedStatus(true);
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
      const nextState = await chatBotService.stopAgent();
      setAgentState(nextState);
      setStatus(nextState.chatStatus);
      setIsChatBotActive(nextState.chatBotActive);
      setHasResolvedStatus(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop the chat agent');
    } finally {
      setAction(null);
    }
  }, []);

  return {
    status,
    isChatBotActive,
    hasResolvedStatus,
    action,
    error,
    agentState,
    startChatBot,
    stopChatBot,
  };
}
