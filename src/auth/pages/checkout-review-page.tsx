import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/context/auth-context';
import { usePlans } from '@/hooks/use-plans';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { PaymentResultCard } from '@/auth/components/payment-result-card';

const CHECKOUT_SUBSCRIPTION_KEY = 'register_checkout_subscription_id';
const CHECKOUT_IDEMPOTENCY_KEY = 'register_checkout_idempotency_key';
const RAZORPAY_SCRIPT_ID = 'razorpay-checkout-script';
const CONFIRM_POLL_INTERVAL_MS = 2500;
const CONFIRM_POLL_TIMEOUT_MS = 60000;

interface RazorpayOptions {
  key: string;
  subscription_id: string;
  name: string;
  prefill?: { email: string; name: string };
  handler: (response: RazorpaySuccessResponse) => void | Promise<void>;
  modal: { ondismiss: () => void };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: 'payment.failed', handler: (response: unknown) => void) => void;
}

type RazorpayConstructor = new (options: RazorpayOptions) => RazorpayInstance;

interface RazorpaySuccessResponse {
  razorpay_payment_id?: string;
  razorpay_subscription_id?: string;
}

interface RazorpayFailureResponse {
  error?: {
    code?: string;
    description?: string;
    metadata?: {
      payment_id?: string;
      subscription_id?: string;
    };
  };
}

interface PaymentResult {
  status: 'success' | 'failed';
  transactionId: string;
  subscriptionId: string;
  message: string;
  errorCode?: string;
}

let razorpayScriptPromise: Promise<void> | null = null;

function loadRazorpayScript() {
  const razorpayWindow = window as Window & { Razorpay?: RazorpayConstructor };
  if (razorpayWindow.Razorpay) return Promise.resolve();
  if (razorpayScriptPromise) return razorpayScriptPromise;

  razorpayScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(RAZORPAY_SCRIPT_ID) as HTMLScriptElement | null;
    const script = existing ?? document.createElement('script');

    const handleLoad = () => resolve();
    const handleError = () => {
      razorpayScriptPromise = null;
      reject(new Error('Unable to load Razorpay Checkout. Please try again.'));
    };

    script.addEventListener('load', handleLoad, { once: true });
    script.addEventListener('error', handleError, { once: true });

    if (!existing) {
      script.id = RAZORPAY_SCRIPT_ID;
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.head.appendChild(script);
    }
  });

  return razorpayScriptPromise;
}

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

type PaymentCurrency = 'INR' | 'USD';

const paymentOptions: Array<{
  currency: PaymentCurrency;
  provider: 'Razorpay' | 'PayPal';
  logo: string;
}> = [
  {
    currency: 'INR',
    provider: 'Razorpay',
    logo: '/media/brand-logos/Razorpay-full.svg',
  },
  {
    currency: 'USD',
    provider: 'PayPal',
    logo: '/media/brand-logos/PayPal-full.svg',
  },
];

function getCurrencyFromCountry(country?: string | null): PaymentCurrency {
  return country?.toUpperCase() === 'IN' ? 'INR' : 'USD';
}

function getCountryFromCurrency(currency: PaymentCurrency) {
  return currency === 'INR' ? 'IN' : 'US';
}

function formatZeroPrice(currency: PaymentCurrency) {
  return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(0);
}

export function CheckoutReviewPage() {
  const {
    auth,
    user,
    startCheckout,
    confirmBilling,
    getUser,
    updateRegisterPreferences,
  } = useAuth();
  const navigate = useNavigate();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<PaymentCurrency>('INR');
  const [confirmedCurrency, setConfirmedCurrency] =
    useState<PaymentCurrency | null>(null);
  const [readyCurrency, setReadyCurrency] =
    useState<PaymentCurrency | null>(null);
  const [isCurrencyUpdating, setIsCurrencyUpdating] = useState(false);
  const selectedBillingCountry = getCountryFromCurrency(selectedCurrency);
  const {
    plans,
    loading: plansLoading,
    fetching: plansFetching,
    error: plansError,
  } = usePlans(selectedBillingCountry, { requireFresh: true });
  const selectedPlan = user?.selectedPlan || user?.plan || 'STARTER';
  const selectedPayment =
    paymentOptions.find((option) => option.currency === selectedCurrency) ??
    paymentOptions[0];
  const selectedPlanPrice = plans?.plans.find(
    (plan) => plan.plan === selectedPlan,
  );
  const isTrial =
    user?.status === 'TRIAL' || user?.status === 'PENDING_VERIFICATION';
  const pricingDisplay = isTrial
    ? formatZeroPrice(selectedCurrency)
    : selectedPlanPrice?.displayAmount;
  const expectedBillingProvider =
    selectedCurrency === 'INR' ? 'RAZORPAY' : 'PAYPAL';
  const plansMatchSelection = Boolean(
    plans &&
      plans.country === selectedBillingCountry &&
      plans.currency.toUpperCase() === selectedCurrency &&
      plans.billingProvider === expectedBillingProvider &&
      selectedPlanPrice,
  );
  const isCheckoutReady = Boolean(
    confirmedCurrency === selectedCurrency &&
      readyCurrency === selectedCurrency &&
      !isCurrencyUpdating &&
      !plansLoading &&
      !plansFetching &&
      !plansError &&
      plansMatchSelection,
  );

  const confirmRazorpayBilling = async (subscriptionId: string) => {
    const deadline = Date.now() + CONFIRM_POLL_TIMEOUT_MS;

    while (Date.now() < deadline) {
      try {
        const currentUser = await confirmBilling(
          subscriptionId,
          `confirm-razorpay-${subscriptionId}`,
        );
        if (!currentUser.billingPending) return;
      } catch (confirmationError) {
        const apiError = confirmationError as Error & { status?: number };
        if (apiError.status !== 400) throw confirmationError;
      }

      await new Promise((resolve) =>
        window.setTimeout(resolve, CONFIRM_POLL_INTERVAL_MS),
      );
    }

    throw new Error(
      'Billing confirmation timed out. Your payment may still complete shortly.',
    );
  };

  useEffect(() => {
    const currency = getCurrencyFromCountry(user?.billingCountry);
    setSelectedCurrency(currency);
    setConfirmedCurrency(currency);
  }, [user?.billingCountry]);

  useEffect(() => {
    setReadyCurrency(null);

    if (
      confirmedCurrency !== selectedCurrency ||
      isCurrencyUpdating ||
      plansLoading ||
      plansFetching ||
      plansError ||
      !plansMatchSelection
    ) {
      return;
    }

    let secondFrame = 0;
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        setReadyCurrency(selectedCurrency);
      });
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);
      if (secondFrame) window.cancelAnimationFrame(secondFrame);
    };
  }, [
    confirmedCurrency,
    isCurrencyUpdating,
    plansError,
    plansFetching,
    plansLoading,
    plansMatchSelection,
    selectedCurrency,
  ]);

  const handleStartCheckout = async () => {
    try {
      setError(null);
      setPaymentResult(null);

      if (!isCheckoutReady) {
        setError(
          'Payment options are still syncing. Please wait for the selected currency and provider to finish loading.',
        );
        return;
      }

      setIsProcessing(true);

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

      const expectedCheckoutMode =
        selectedCurrency === 'INR' ? 'razorpay_modal' : 'redirect';
      if (meta.checkoutMode !== expectedCheckoutMode) {
        sessionStorage.removeItem(CHECKOUT_IDEMPOTENCY_KEY);
        throw new Error(
          selectedCurrency === 'INR'
            ? 'Payment gateway mismatch: INR checkout must use Razorpay. Please try again.'
            : 'Payment gateway mismatch: USD checkout must use PayPal. Please try again.',
        );
      }

      if (meta.checkoutMode === 'razorpay_modal') {
        if (!meta.razorpayKeyId || !meta.subscriptionId) {
          throw new Error('Razorpay checkout configuration is incomplete.');
        }

        await loadRazorpayScript();
        const Razorpay = (window as Window & { Razorpay?: RazorpayConstructor })
          .Razorpay;
        if (!Razorpay) throw new Error('Razorpay Checkout is unavailable.');

        let paymentSubmitted = false;
        const checkout = new Razorpay({
          key: meta.razorpayKeyId,
          subscription_id: meta.subscriptionId,
          name: 'Bidvora',
          prefill: meta.prefill ?? undefined,
          handler: async (response) => {
            paymentSubmitted = true;
            try {
              await confirmRazorpayBilling(meta.subscriptionId!);
              localStorage.removeItem(CHECKOUT_SUBSCRIPTION_KEY);
              sessionStorage.removeItem(CHECKOUT_SUBSCRIPTION_KEY);
              sessionStorage.removeItem(CHECKOUT_IDEMPOTENCY_KEY);
              setPaymentResult({
                status: 'success',
                transactionId:
                  response.razorpay_payment_id || meta.subscriptionId!,
                subscriptionId:
                  response.razorpay_subscription_id || meta.subscriptionId!,
                message:
                  'Your payment was confirmed successfully. You can now continue with account onboarding.',
              });
              setIsProcessing(false);
            } catch (confirmationError) {
              setPaymentResult({
                status: 'failed',
                transactionId:
                  response.razorpay_payment_id || meta.subscriptionId!,
                subscriptionId:
                  response.razorpay_subscription_id || meta.subscriptionId!,
                message:
                  confirmationError instanceof Error
                    ? confirmationError.message
                    : 'We could not confirm the payment with the provider.',
              });
              setIsProcessing(false);
            }
          },
          modal: {
            ondismiss: () => {
              if (!paymentSubmitted) setIsProcessing(false);
            },
          },
        });

        checkout.on('payment.failed', (response) => {
          const failure = response as RazorpayFailureResponse;
          setPaymentResult({
            status: 'failed',
            transactionId:
              failure.error?.metadata?.payment_id || meta.subscriptionId!,
            subscriptionId:
              failure.error?.metadata?.subscription_id || meta.subscriptionId!,
            errorCode: failure.error?.code,
            message:
              failure.error?.description ||
              'Razorpay could not complete the payment. No onboarding access has been granted.',
          });
          setIsProcessing(false);
        });
        checkout.open();
        return;
      }

      if (meta.checkoutMode === 'redirect' && meta.checkoutUrl) {
        sessionStorage.removeItem(CHECKOUT_IDEMPOTENCY_KEY);
        window.location.assign(meta.checkoutUrl);
      } else {
        throw new Error('Unsupported checkout response. Please try again.');
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
          setPaymentResult({
            status: 'success',
            transactionId: storedSubscriptionId || 'Confirmed by provider',
            subscriptionId: storedSubscriptionId || 'Not available',
            message:
              'Your payment was already confirmed. You can now continue with account onboarding.',
          });
          setIsProcessing(false);
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

  const handlePaymentCurrencyChange = async (currency: PaymentCurrency) => {
    if (
      currency === selectedCurrency ||
      isCurrencyUpdating ||
      isProcessing
    ) {
      return;
    }

    const previousCurrency = confirmedCurrency ?? selectedCurrency;
    setError(null);
    setReadyCurrency(null);
    setSelectedCurrency(currency);
    setIsCurrencyUpdating(true);

    try {
      const updatedUser = await updateRegisterPreferences({
        country: getCountryFromCurrency(currency),
        plan: selectedPlan as 'STARTER' | 'PRO',
      });
      const savedCurrency = getCurrencyFromCountry(updatedUser.billingCountry);

      if (savedCurrency !== currency) {
        throw new Error('The selected payment currency was not saved correctly.');
      }

      sessionStorage.removeItem(CHECKOUT_IDEMPOTENCY_KEY);
      setConfirmedCurrency(currency);
    } catch (preferencesError) {
      console.warn('Failed to update checkout preferences', preferencesError);
      setSelectedCurrency(previousCurrency);
      setConfirmedCurrency(previousCurrency);
      setError(
        preferencesError instanceof Error
          ? preferencesError.message
          : 'Failed to update the payment currency. Please try again.',
      );
    } finally {
      setIsCurrencyUpdating(false);
    }
  };

  if (paymentResult) {
    const resultDetails = [
      {
        label: 'Status',
        value: paymentResult.status === 'success' ? 'Successful' : 'Failed',
      },
      { label: 'Provider', value: selectedPayment.provider },
      { label: 'Plan', value: selectedPlan },
      {
        label: 'Amount',
        value: pricingDisplay ?? formatZeroPrice(selectedCurrency),
      },
      { label: 'Transaction ID', value: paymentResult.transactionId },
      { label: 'Subscription ID', value: paymentResult.subscriptionId },
      ...(paymentResult.errorCode
        ? [{ label: 'Error code', value: paymentResult.errorCode }]
        : []),
    ];

    return (
      <PaymentResultCard
        status={paymentResult.status}
        title={
          paymentResult.status === 'success'
            ? 'Your payment is complete'
            : 'Your payment was not completed'
        }
        message={paymentResult.message}
        details={resultDetails}
        primaryLabel={
          paymentResult.status === 'success' ? 'Onboard Now' : 'Retry Payment'
        }
        onPrimary={() => {
          if (paymentResult.status === 'success') {
            navigate('/');
            return;
          }

          void handleStartCheckout();
        }}
        primaryLoading={isProcessing}
        secondaryLabel={
          paymentResult.status === 'failed' ? 'Review Payment Details' : undefined
        }
        onSecondary={
          paymentResult.status === 'failed'
            ? () => setPaymentResult(null)
            : undefined
        }
      />
    );
  }

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
          <div className="text-muted-foreground">Plan</div>
          <div className="col-span-2 font-medium">{selectedPlan}</div>

          <div className="text-muted-foreground">Trial</div>
          <div className="col-span-2 font-medium">
            {formatTrialLength(user.trialEndsAt)}
          </div>

          <div className="text-muted-foreground">Pricing</div>
          <div className="col-span-2">
            {plansLoading || plansFetching ? (
              <span className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Loading pricing
              </span>
            ) : plansError ? (
              <span className="text-sm font-medium text-destructive">
                Pricing unavailable
              </span>
            ) : (
              <span className="text-xl font-bold text-mono">
                {pricingDisplay ?? formatZeroPrice(selectedCurrency)}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Pay In</div>
          <div className="grid grid-cols-2 gap-3">
            {paymentOptions.map((option) => {
              const isSelected = selectedCurrency === option.currency;

              return (
                <label
                  key={option.currency}
                  className={[
                    'relative flex cursor-pointer items-center justify-between rounded-md border px-4 py-3 text-sm font-semibold transition-colors',
                    isCurrencyUpdating || isProcessing
                      ? 'cursor-not-allowed opacity-60'
                      : '',
                    isSelected
                      ? 'border-primary bg-primary/10 text-primary shadow-sm'
                      : 'border-input bg-background text-foreground hover:border-primary/60 hover:bg-primary/5',
                  ].join(' ')}
                >
                  <input
                    type="radio"
                    name="paymentCurrency"
                    value={option.currency}
                    checked={isSelected}
                    onChange={() => {
                      void handlePaymentCurrencyChange(option.currency);
                    }}
                    disabled={isCurrencyUpdating || isProcessing}
                    className="sr-only"
                  />
                  <span>{option.currency}</span>
                  <span
                    className={[
                      'flex size-4 items-center justify-center rounded-full border',
                      isSelected
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground/40',
                    ].join(' ')}
                    aria-hidden="true"
                  >
                    {isSelected && (
                      <span className="size-1.5 rounded-full bg-primary-foreground" />
                    )}
                  </span>
                </label>
              );
            })}
          </div>
          {!isCheckoutReady && !plansError && (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              Syncing {selectedCurrency} with {selectedPayment.provider}...
            </p>
          )}
        </div>
      </div>

      <Button
        size="lg"
        className="w-full mt-4"
        onClick={handleStartCheckout}
        disabled={isProcessing || !isCheckoutReady}
      >
        {isProcessing ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Preparing checkout…
          </span>
        ) : !isCheckoutReady ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Syncing payment options...
          </span>
        ) : (
          'Continue to payment'
        )}
      </Button>

      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <span>Powered by</span>
        <img
          src={selectedPayment.logo}
          alt={`${selectedPayment.provider} logo`}
          className="h-5 max-w-28 object-contain"
        />
      </div>
    </div>
  );
}
