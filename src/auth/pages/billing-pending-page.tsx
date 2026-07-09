import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/auth/context/auth-context';
import { Button } from '@/components/ui/button';
import { AlertCircle, CreditCard, Loader2 } from 'lucide-react';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';

const CHECKOUT_SUBSCRIPTION_KEY = 'register_checkout_subscription_id';
const POLL_INTERVAL_MS = 2500;
const POLL_TIMEOUT_MS = 60000;

function readSubscriptionId(searchParams: URLSearchParams) {
  return (
    searchParams.get('subscriptionId') ||
    searchParams.get('subscription_id') ||
    searchParams.get('razorpay_subscription_id') ||
    sessionStorage.getItem(CHECKOUT_SUBSCRIPTION_KEY) ||
    localStorage.getItem(CHECKOUT_SUBSCRIPTION_KEY) ||
    ''
  );
}

export function BillingPendingPage() {
  const { confirmBilling } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [confirming, setConfirming] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionId] = useState(() => readSubscriptionId(searchParams));

  useEffect(() => {
    let isMounted = true;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const startedAt = Date.now();

    const pollBilling = async () => {
      if (!subscriptionId) {
        setConfirming(false);
        setError(
          'We could not find the subscription from checkout. Please return to the review step and try again.',
        );
        return;
      }

      try {
        const currentUser = await confirmBilling(subscriptionId);
        if (!isMounted) return;

        if (!currentUser.billingPending) {
          localStorage.removeItem(CHECKOUT_SUBSCRIPTION_KEY);
          sessionStorage.removeItem(CHECKOUT_SUBSCRIPTION_KEY);
          navigate('/');
          return;
        }
      } catch (err) {
        if (!isMounted) return;

        if (Date.now() - startedAt >= POLL_TIMEOUT_MS) {
          setConfirming(false);
          setError(
            err instanceof Error
              ? err.message
              : 'Billing is still pending. Please try again in a moment.',
          );
          return;
        }
      }

      timeoutId = setTimeout(pollBilling, POLL_INTERVAL_MS);
    };

    pollBilling();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [confirmBilling, navigate, subscriptionId]);

  const handleConfirm = async () => {
    try {
      setConfirming(true);
      setError(null);

      if (!subscriptionId) {
        throw new Error('We could not find the subscription from checkout.');
      }

      const currentUser = await confirmBilling(subscriptionId);
      if (!currentUser.billingPending) {
        localStorage.removeItem(CHECKOUT_SUBSCRIPTION_KEY);
        sessionStorage.removeItem(CHECKOUT_SUBSCRIPTION_KEY);
        navigate('/');
      } else {
        setError('Payment has not been confirmed yet. Please wait a moment or try again.');
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Confirmation failed. Please verify payment is complete.',
      );
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="flex flex-col items-center text-center gap-6 py-10 w-full max-w-md mx-auto">
      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary/10">
        <CreditCard className="w-10 h-10 text-primary" strokeWidth={1.75} />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Waiting for payment
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          We are confirming your card mandate. This usually takes a few seconds after checkout redirects you back.
        </p>
      </div>

      {error && (
        <Alert variant="destructive" appearance="light" className="text-left w-full">
          <AlertIcon>
            <AlertCircle />
          </AlertIcon>
          <AlertTitle>{error}</AlertTitle>
        </Alert>
      )}

      <div className="w-full space-y-3 mt-4">
        <Button
          size="lg"
          className="w-full gap-2"
          onClick={handleConfirm}
          disabled={confirming}
        >
          {confirming ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Confirming billing...
            </>
          ) : (
            'Check again'
          )}
        </Button>

        <Button asChild size="lg" variant="outline" className="w-full">
          <Link to="/auth/checkout-review">Go Back to Review</Link>
        </Button>
      </div>
    </div>
  );
}
