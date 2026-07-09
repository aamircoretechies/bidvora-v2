import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/context/auth-context';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';

const CHECKOUT_SUBSCRIPTION_KEY = 'register_checkout_subscription_id';
const CHECKOUT_IDEMPOTENCY_KEY = 'register_checkout_idempotency_key';

function createIdempotencyKey() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `checkout-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getCheckoutIdempotencyKey() {
  const existing = sessionStorage.getItem(CHECKOUT_IDEMPOTENCY_KEY);
  if (existing) return existing;

  const key = createIdempotencyKey();
  sessionStorage.setItem(CHECKOUT_IDEMPOTENCY_KEY, key);
  return key;
}

function formatTrialLength(trialEndsAt?: string | null) {
  if (!trialEndsAt) return '14 days';

  const end = new Date(trialEndsAt);
  if (Number.isNaN(end.getTime())) return '14 days';

  const days = Math.max(
    1,
    Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
  );

  return `${days} day${days === 1 ? '' : 's'}`;
}

export function CheckoutReviewPage() {
  const { auth, user, startCheckout, getUser } = useAuth();
  const navigate = useNavigate();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartCheckout = async () => {
    try {
      setIsProcessing(true);
      setError(null);

      if (!auth?.access_token) {
        navigate('/auth/signin?next=/auth/checkout-review');
        return;
      }

      if (!user?.emailVerified && !user?.email_verified) {
        navigate('/auth/check-email');
        return;
      }

      const meta = await startCheckout(getCheckoutIdempotencyKey());

      if (meta.subscriptionId) {
        localStorage.setItem(CHECKOUT_SUBSCRIPTION_KEY, meta.subscriptionId);
        sessionStorage.setItem(CHECKOUT_SUBSCRIPTION_KEY, meta.subscriptionId);
      }
      
      if (meta.checkoutUrl) {
        sessionStorage.removeItem(CHECKOUT_IDEMPOTENCY_KEY);
        window.location.assign(meta.checkoutUrl);
      } else {
        navigate('/auth/register/billing/callback');
      }
    } catch (err) {
      console.error('Start checkout error:', err);
      const checkoutError = err as { status?: number; code?: string; details?: unknown };

      if (checkoutError.status === 401) {
        navigate('/auth/signin?next=/auth/checkout-review');
        return;
      }

      if (checkoutError.status === 403) {
        navigate('/auth/check-email');
        return;
      }

      if (checkoutError.status === 409) {
        const currentUser = await getUser().catch(() => null);
        const storedSubscriptionId =
          sessionStorage.getItem(CHECKOUT_SUBSCRIPTION_KEY) ||
          localStorage.getItem(CHECKOUT_SUBSCRIPTION_KEY);

        if (currentUser && !currentUser.billingPending) {
          navigate('/');
          return;
        }

        if (storedSubscriptionId) {
          navigate('/auth/register/billing/callback');
          return;
        }

        setError('Billing is already set up or a subscription already exists for this account.');
        setIsProcessing(false);
        return;
      }

      if (checkoutError.status === 500) {
        setError(
          err instanceof Error
            ? `${err.message}. The checkout request reached the server, but subscription setup failed there. Please retry once; if it repeats, check the backend payment-provider logs for this account.`
            : 'Billing setup failed on the server. Please try again.',
        );
        setIsProcessing(false);
        return;
      }

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to start checkout. Please try again.'
      );
      setIsProcessing(false);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const billingCountry = user.billingCountry?.toUpperCase() || 'IN';
  const selectedPlan = user.selectedPlan || user.plan || 'STARTER';
  const paymentProvider = billingCountry === 'IN' ? 'Razorpay' : 'PayPal';

  return (
    <div className="flex flex-col items-center text-center gap-6 py-4 w-full max-w-md mx-auto">
      {/* Icon */}
      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary/10">
        <CheckCircle2 className="w-10 h-10 text-primary" strokeWidth={1.75} />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Review your trial
        </h1>
        <p className="text-sm text-muted-foreground">
          Confirm your details before continuing to the hosted payment page.
        </p>
      </div>

      {error && (
        <Alert variant="destructive" appearance="light" className="w-full text-left">
          <AlertIcon>
            <AlertCircle />
          </AlertIcon>
          <AlertTitle>{error}</AlertTitle>
        </Alert>
      )}

      <div className="w-full bg-muted/50 rounded-lg p-4 border text-left space-y-4">
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="text-muted-foreground">Email</div>
          <div className="col-span-2 font-medium break-all">{user.email}</div>
          
          <div className="text-muted-foreground">Plan</div>
          <div className="col-span-2 font-medium">{selectedPlan}</div>
          
          <div className="text-muted-foreground">Country</div>
          <div className="col-span-2 font-medium">{billingCountry}</div>

          <div className="text-muted-foreground">Payment</div>
          <div className="col-span-2 font-medium flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            {paymentProvider}
          </div>

          <div className="text-muted-foreground">Trial</div>
          <div className="col-span-2 font-medium">
            {formatTrialLength(user.trialEndsAt)}
          </div>
        </div>
      </div>

      <Button
        size="lg"
        className="w-full mt-4"
        onClick={handleStartCheckout}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Preparing checkout…
          </span>
        ) : (
          'Continue to payment'
        )}
      </Button>
    </div>
  );
}
