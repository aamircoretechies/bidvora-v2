import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/auth/context/auth-context';
import { useConfirmCheckout } from '@/hooks/use-confirm-checkout';
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2 } from 'lucide-react';
import { PaymentResultCard } from '@/auth/components/payment-result-card';

const CHECKOUT_SUBSCRIPTION_KEY = 'register_checkout_subscription_id';
const CHECKOUT_SESSION_KEY = 'billing_checkout_session_id';
const CONFIRM_BILLING_IDEMPOTENCY_KEY = 'confirm_billing_idempotency_key';
const POLL_INTERVAL_MS = 2500;
const POLL_TIMEOUT_MS = 60000;

interface PaymentResult {
  status: 'success' | 'failed';
  message: string;
  transactionId: string;
  subscriptionId: string;
  provider: string;
  plan: string;
  currency: string;
  subscriptionState: string;
}

function createIdempotencyKey() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `confirm-billing-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getConfirmBillingIdempotencyKey() {
  const existing = sessionStorage.getItem(CONFIRM_BILLING_IDEMPOTENCY_KEY);
  if (existing) return existing;

  const key = createIdempotencyKey();
  sessionStorage.setItem(CONFIRM_BILLING_IDEMPOTENCY_KEY, key);
  return key;
}

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

function readSessionId(searchParams: URLSearchParams) {
  return (
    searchParams.get('sessionId') ||
    searchParams.get('session_id') ||
    searchParams.get('checkout_session_id') ||
    ''
  );
}

function clearCheckoutStorage() {
  localStorage.removeItem(CHECKOUT_SUBSCRIPTION_KEY);
  sessionStorage.removeItem(CHECKOUT_SUBSCRIPTION_KEY);
  sessionStorage.removeItem(CONFIRM_BILLING_IDEMPOTENCY_KEY);
  sessionStorage.removeItem(CHECKOUT_SESSION_KEY);
  localStorage.removeItem(CHECKOUT_SESSION_KEY);
}

export function BillingPendingPage() {
  const { confirmBilling, user, verify } = useAuth();
  const { mutateAsync: confirmCheckoutSession } = useConfirmCheckout();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialUserRef = useRef(user);
  const confirmBillingRef = useRef(confirmBilling);
  const confirmCheckoutSessionRef = useRef(confirmCheckoutSession);
  const verifyRef = useRef(verify);

  const [confirming, setConfirming] = useState(true);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [subscriptionId] = useState(() => readSubscriptionId(searchParams));
  const [sessionId] = useState(() => readSessionId(searchParams));
  const [callbackFailed] = useState(() => {
    const callbackStatus = (
      searchParams.get('payment_status') ||
      searchParams.get('status') ||
      searchParams.get('result') ||
      ''
    ).toLowerCase();
    const cancelled = (
      searchParams.get('cancelled') ||
      searchParams.get('canceled') ||
      searchParams.get('cancel') ||
      ''
    ).toLowerCase();

    return (
      ['failed', 'failure', 'cancelled', 'canceled', 'denied'].includes(
        callbackStatus,
      ) || ['1', 'true', 'yes'].includes(cancelled)
    );
  });

  useEffect(() => {
    confirmBillingRef.current = confirmBilling;
    confirmCheckoutSessionRef.current = confirmCheckoutSession;
    verifyRef.current = verify;
  }, [confirmBilling, confirmCheckoutSession, verify]);

  useEffect(() => {
    if (subscriptionId) {
      sessionStorage.setItem(CHECKOUT_SUBSCRIPTION_KEY, subscriptionId);
      localStorage.setItem(CHECKOUT_SUBSCRIPTION_KEY, subscriptionId);
    }

    if (sessionId) {
      sessionStorage.setItem(CHECKOUT_SESSION_KEY, sessionId);
      localStorage.setItem(CHECKOUT_SESSION_KEY, sessionId);
    }

    if (window.location.search) {
      window.history.replaceState(window.history.state, '', window.location.pathname);
    }

    let isMounted = true;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const startedAt = Date.now();

    if (callbackFailed) {
      setConfirming(false);
      setPaymentResult({
        status: 'failed',
        message:
          'The payment provider reported that this transaction was not completed. Your account has not been opened for onboarding.',
        transactionId: sessionId || subscriptionId || 'Not available',
        subscriptionId: subscriptionId || 'Not available',
        provider: initialUserRef.current?.billingProvider || 'Payment provider',
        plan:
          initialUserRef.current?.selectedPlan ||
          initialUserRef.current?.plan ||
          'Not available',
        currency:
          initialUserRef.current?.billingCurrency?.toUpperCase() ||
          'Not available',
        subscriptionState:
          initialUserRef.current?.subscriptionState || 'FAILED',
      });
      return;
    }

    if (sessionId) {
      const confirmPaidSession = async () => {
        try {
          const result = await confirmCheckoutSessionRef.current(sessionId);
          if (!isMounted) return;

          if (!result.subscription.checkoutPendingAt) {
            setConfirming(false);
            setPaymentResult({
              status: 'success',
              message:
                'Your payment was confirmed successfully. You can now continue with account onboarding.',
              transactionId: sessionId,
              subscriptionId: subscriptionId || sessionId,
              provider:
                result.subscription.billingProvider || 'Payment provider',
              plan: result.subscription.plan,
              currency:
                result.subscription.billingCurrency?.toUpperCase() ||
                'Not available',
              subscriptionState: result.subscription.subscriptionState,
            });
            return;
          }

          setConfirming(false);
          setPaymentResult({
            status: 'failed',
            message:
              'The checkout returned successfully, but the provider has not confirmed the payment yet. Check the status again before retrying payment.',
            transactionId: sessionId,
            subscriptionId: subscriptionId || sessionId,
            provider: result.subscription.billingProvider || 'Payment provider',
            plan: result.subscription.plan,
            currency:
              result.subscription.billingCurrency?.toUpperCase() ||
              'Not available',
            subscriptionState: result.subscription.subscriptionState,
          });
        } catch (sessionError) {
          if (!isMounted) return;
          setConfirming(false);
          setPaymentResult({
            status: 'failed',
            message:
              sessionError instanceof Error
                ? sessionError.message
                : 'Failed to confirm the paid checkout session.',
            transactionId: sessionId,
            subscriptionId: subscriptionId || 'Not available',
            provider:
              initialUserRef.current?.billingProvider || 'Payment provider',
            plan:
              initialUserRef.current?.selectedPlan ||
              initialUserRef.current?.plan ||
              'Not available',
            currency:
              initialUserRef.current?.billingCurrency?.toUpperCase() ||
              'Not available',
            subscriptionState:
              initialUserRef.current?.subscriptionState || 'UNCONFIRMED',
          });
        }
      };

      void confirmPaidSession();
      return () => {
        isMounted = false;
      };
    }

    const pollBilling = async () => {
      if (!subscriptionId) {
        setConfirming(false);
        setPaymentResult({
          status: 'failed',
          message:
            'We could not find the transaction reference from checkout. Return to the payment review and try again.',
          transactionId: 'Not available',
          subscriptionId: 'Not available',
          provider:
            initialUserRef.current?.billingProvider || 'Payment provider',
          plan:
            initialUserRef.current?.selectedPlan ||
            initialUserRef.current?.plan ||
            'Not available',
          currency:
            initialUserRef.current?.billingCurrency?.toUpperCase() ||
            'Not available',
          subscriptionState: 'UNCONFIRMED',
        });
        return;
      }

      try {
        const currentUser = await confirmBillingRef.current(
          subscriptionId,
          getConfirmBillingIdempotencyKey(),
        );
        if (!isMounted) return;

        if (!currentUser.billingPending) {
          setConfirming(false);
          setPaymentResult({
            status: 'success',
            message:
              'Your payment was confirmed successfully. You can now continue with account onboarding.',
            transactionId: subscriptionId,
            subscriptionId,
            provider: currentUser.billingProvider || 'Payment provider',
            plan:
              currentUser.selectedPlan || currentUser.plan || 'Not available',
            currency:
              currentUser.billingCurrency?.toUpperCase() || 'Not available',
            subscriptionState: currentUser.subscriptionState || 'ACTIVE',
          });
          return;
        }

        if (Date.now() - startedAt >= POLL_TIMEOUT_MS) {
          setConfirming(false);
          setPaymentResult({
            status: 'failed',
            message:
              'The payment is still not confirmed. Check the status again before starting a new payment.',
            transactionId: subscriptionId,
            subscriptionId,
            provider: currentUser.billingProvider || 'Payment provider',
            plan:
              currentUser.selectedPlan || currentUser.plan || 'Not available',
            currency:
              currentUser.billingCurrency?.toUpperCase() || 'Not available',
            subscriptionState: currentUser.subscriptionState || 'PENDING',
          });
          return;
        }
      } catch (err) {
        if (!isMounted) return;

        if (Date.now() - startedAt >= POLL_TIMEOUT_MS) {
          setConfirming(false);
          setPaymentResult({
            status: 'failed',
            message:
              err instanceof Error
                ? err.message
                : 'Billing is still pending. Please try again in a moment.',
            transactionId: subscriptionId,
            subscriptionId,
            provider:
              initialUserRef.current?.billingProvider || 'Payment provider',
            plan:
              initialUserRef.current?.selectedPlan ||
              initialUserRef.current?.plan ||
              'Not available',
            currency:
              initialUserRef.current?.billingCurrency?.toUpperCase() ||
              'Not available',
            subscriptionState:
              initialUserRef.current?.subscriptionState || 'UNCONFIRMED',
          });
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
  }, [
    callbackFailed,
    sessionId,
    subscriptionId,
  ]);

  const handleConfirm = async () => {
    try {
      setConfirming(true);
      setPaymentResult(null);

      if (sessionId) {
        const result = await confirmCheckoutSession(sessionId);
        if (!result.subscription.checkoutPendingAt) {
          setPaymentResult({
            status: 'success',
            message:
              'Your payment was confirmed successfully. You can now continue with account onboarding.',
            transactionId: sessionId,
            subscriptionId: subscriptionId || sessionId,
            provider:
              result.subscription.billingProvider || 'Payment provider',
            plan: result.subscription.plan,
            currency:
              result.subscription.billingCurrency?.toUpperCase() ||
              'Not available',
            subscriptionState: result.subscription.subscriptionState,
          });
        } else {
          setPaymentResult({
            status: 'failed',
            message:
              'Payment has not been confirmed yet. Check again before starting a new transaction.',
            transactionId: sessionId,
            subscriptionId: subscriptionId || sessionId,
            provider:
              result.subscription.billingProvider || 'Payment provider',
            plan: result.subscription.plan,
            currency:
              result.subscription.billingCurrency?.toUpperCase() ||
              'Not available',
            subscriptionState: result.subscription.subscriptionState,
          });
        }
        return;
      }

      if (!subscriptionId) {
        throw new Error('We could not find the subscription from checkout.');
      }

      const currentUser = await confirmBilling(
        subscriptionId,
        getConfirmBillingIdempotencyKey(),
      );
      if (!currentUser.billingPending) {
        setPaymentResult({
          status: 'success',
          message:
            'Your payment was confirmed successfully. You can now continue with account onboarding.',
          transactionId: subscriptionId,
          subscriptionId,
          provider: currentUser.billingProvider || 'Payment provider',
          plan: currentUser.selectedPlan || currentUser.plan || 'Not available',
          currency:
            currentUser.billingCurrency?.toUpperCase() || 'Not available',
          subscriptionState: currentUser.subscriptionState || 'ACTIVE',
        });
      } else {
        setPaymentResult({
          status: 'failed',
          message:
            'Payment has not been confirmed yet. Check again before starting a new transaction.',
          transactionId: subscriptionId,
          subscriptionId,
          provider: currentUser.billingProvider || 'Payment provider',
          plan: currentUser.selectedPlan || currentUser.plan || 'Not available',
          currency:
            currentUser.billingCurrency?.toUpperCase() || 'Not available',
          subscriptionState: currentUser.subscriptionState || 'PENDING',
        });
      }
    } catch (err) {
      setPaymentResult({
        status: 'failed',
        message:
          err instanceof Error
            ? err.message
            : 'Confirmation failed. Please verify payment is complete.',
        transactionId: sessionId || subscriptionId || 'Not available',
        subscriptionId: subscriptionId || 'Not available',
        provider: initialUserRef.current?.billingProvider || 'Payment provider',
        plan:
          initialUserRef.current?.selectedPlan ||
          initialUserRef.current?.plan ||
          'Not available',
        currency:
          initialUserRef.current?.billingCurrency?.toUpperCase() ||
          'Not available',
        subscriptionState:
          initialUserRef.current?.subscriptionState || 'UNCONFIRMED',
      });
    } finally {
      setConfirming(false);
    }
  };

  if (paymentResult) {
    return (
      <PaymentResultCard
        status={paymentResult.status}
        title={
          paymentResult.status === 'success'
            ? 'Payment confirmed'
            : 'Payment could not be confirmed'
        }
        message={paymentResult.message}
        details={[
          {
            label: 'Status',
            value: paymentResult.status === 'success' ? 'Successful' : 'Failed',
          },
          { label: 'Provider', value: paymentResult.provider },
          { label: 'Plan', value: paymentResult.plan },
          { label: 'Currency', value: paymentResult.currency },
          { label: 'Transaction ID', value: paymentResult.transactionId },
          { label: 'Subscription ID', value: paymentResult.subscriptionId },
          { label: 'Provider state', value: paymentResult.subscriptionState },
        ]}
        primaryLabel={
          paymentResult.status === 'success'
            ? 'Onboard Now'
            : 'Check Payment Again'
        }
        onPrimary={() => {
          if (paymentResult.status === 'success') {
            setConfirming(true);
            void verify()
              .then(() => {
                clearCheckoutStorage();
                navigate('/');
              })
              .catch(() => {
                setConfirming(false);
                setPaymentResult((current) =>
                  current
                    ? {
                        ...current,
                        message:
                          'Your payment is confirmed, but we could not refresh your account access. Please click Onboard Now again.',
                      }
                    : current,
                );
              });
            return;
          }

          void handleConfirm();
        }}
        primaryLoading={confirming}
        secondaryLabel={
          paymentResult.status === 'failed' ? 'Retry Payment' : undefined
        }
        onSecondary={
          paymentResult.status === 'failed'
            ? () => navigate('/auth/checkout-review')
            : undefined
        }
      />
    );
  }

  return (
    <div className="flex flex-col items-center text-center gap-6 py-10 w-full max-w-md mx-auto">
      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary/10">
        <CreditCard className="w-10 h-10 text-primary" strokeWidth={1.75} />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Confirming your payment
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          We are securely checking your subscription with the payment provider.
          This usually takes a few seconds after checkout redirects you back.
        </p>
      </div>

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

        <Button
          size="lg"
          variant="outline"
          className="w-full"
          onClick={() => navigate('/auth/checkout-review')}
        >
          Go Back to Review
        </Button>
      </div>
    </div>
  );
}
