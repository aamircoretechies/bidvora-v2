import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { freelancerService } from '@/services/freelancer.service';
import { toAbsoluteUrl } from '@/lib/helpers';

/** Shared channel name — must match the listener in onboarding-flow.tsx */
const OAUTH_CHANNEL = 'bidvora_freelancer_oauth';

type Status = 'loading' | 'success' | 'error';

/* ─── Shared layout shell for the popup window ───────────────────────── */
function PopupShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
      {/* Branding */}
      <div className="flex items-center gap-2 mb-10">
        <img
          src={toAbsoluteUrl('/media/app/mini-logo-circle.svg')}
          className="h-8 w-8"
          alt="Bidvora"
        />
        <span className="text-xl font-bold tracking-tight text-foreground">Bidvora</span>
      </div>

      <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-lg p-8 flex flex-col items-center text-center gap-5">
        {children}
      </div>

      <p className="mt-8 text-xs text-muted-foreground">© 2024 Bidvora. All rights reserved.</p>
    </div>
  );
}

/* ─── Loading state ──────────────────────────────────────────────────── */
function LoadingView() {
  return (
    <PopupShell>
      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
        <div className="w-7 h-7 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
      </div>
      <div>
        <h2 className="text-lg font-bold text-foreground">Connecting your account</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Please wait while we complete the connection…
        </p>
      </div>
    </PopupShell>
  );
}

/* ─── Success state ──────────────────────────────────────────────────── */
function SuccessView() {
  return (
    <PopupShell>
      <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
        <svg
          className="w-8 h-8 text-green-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <div>
        <h2 className="text-xl font-bold text-foreground">Onboarding completed</h2>
        <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
          Freelancer account connected successfully.
        </p>
      </div>

      <p className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2 w-full">
        This window will close automatically…
      </p>
    </PopupShell>
  );
}

/* ─── Error state ────────────────────────────────────────────────────── */
function ErrorView({ message }: { message: string }) {
  return (
    <PopupShell>
      <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
        <svg
          className="w-8 h-8 text-red-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
      </div>

      <div>
        <h2 className="text-xl font-bold text-foreground">Freelancer connection failed</h2>
        <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{message}</p>
      </div>

      <p className="text-xs text-muted-foreground">
        Please try connecting your Freelancer account again.
      </p>

      <div className="flex flex-col gap-2 w-full">
        <button
          onClick={() => window.close()}
          className="w-full inline-flex items-center justify-center rounded-lg border border-border bg-background text-foreground text-sm font-medium h-10 px-4 hover:bg-muted transition-colors"
        >
          Close Window
        </button>
        <a
          href="/"
          className="w-full inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-medium h-10 px-4 hover:bg-primary/90 transition-colors"
        >
          Return to Dashboard
        </a>
      </div>
    </PopupShell>
  );
}

/* ─── Main callback page ─────────────────────────────────────────────── */
export const FreelancerCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<Status>('loading');
  const [errorMessage, setErrorMessage] = useState('Unable to connect Freelancer account. Please try again.');

  /** Broadcast to the base tab (works whether this opened as popup OR new tab) */
  const broadcast = (type: 'FREELANCER_OAUTH_SUCCESS' | 'FREELANCER_OAUTH_ERROR', message?: string) => {
    // 1. BroadcastChannel — works for new tabs and same-window contexts
    try {
      const ch = new BroadcastChannel(OAUTH_CHANNEL);
      ch.postMessage({ type, provider: 'freelancer', message });
      ch.close();
    } catch {
      // BroadcastChannel not supported (very old browsers) — ignore
    }

    // 2. postMessage to opener — works for real popups
    if (window.opener && !window.opener.closed) {
      try {
        window.opener.postMessage({ type, provider: 'freelancer', message }, window.location.origin);
      } catch {
        // cross-origin or closed opener
      }
    }
  };

  useEffect(() => {
    const code = searchParams.get('code');

    if (!code) {
      broadcast('FREELANCER_OAUTH_ERROR', 'Authorization code is missing.');
      setErrorMessage('Freelancer authorization code is missing.');
      setStatus('error');
      return;
    }

    const connectAccount = async () => {
      try {
        const response = await freelancerService.connectFreelancerCallback(code);

        if (response.success && response.data.connected) {
          setStatus('success');
          broadcast('FREELANCER_OAUTH_SUCCESS');
          // Give the user a moment to read the success message, then close
          setTimeout(() => window.close(), 1400);
        } else {
          throw new Error('Unable to connect Freelancer account. Please try again.');
        }
      } catch (error: any) {
        const msg =
          error?.response?.data?.message ||
          error?.message ||
          'Unable to connect Freelancer account. Please try again.';

        setErrorMessage(msg);
        setStatus('error');
        broadcast('FREELANCER_OAUTH_ERROR', msg);
      }
    };

    connectAccount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === 'loading') return <LoadingView />;
  if (status === 'success') return <SuccessView />;
  return <ErrorView message={errorMessage} />;
};
