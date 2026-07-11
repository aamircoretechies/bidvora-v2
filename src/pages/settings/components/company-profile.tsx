import { useState } from 'react';
import { AlertCircle, Clock3, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/auth/context/auth-context';
import { useBillingHistory } from '@/hooks/use-billing-history';
import { useCancelSubscription } from '@/hooks/use-cancel-subscription';
import { useConfirmCheckout } from '@/hooks/use-confirm-checkout';
import { useSubscribe } from '@/hooks/use-subscribe';
import { useSubscription } from '@/hooks/use-subscription';
import type {
  CancelSubscriptionResult,
  SubscriptionStateValue,
} from '@/services/billing.service';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function humanize(value: string | null) {
  if (!value) return 'Not available';
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function providerLabel(provider: string | null) {
  if (provider === 'RAZORPAY') return 'Razorpay';
  if (provider === 'PAYPAL') return 'PayPal';
  if (provider === 'STRIPE') return 'Stripe';
  return 'Not configured';
}

function statusBadgeVariant(
  state: SubscriptionStateValue,
): 'success' | 'warning' | 'destructive' | 'primary' {
  switch (state) {
    case 'ACTIVE':
    case 'AUTHENTICATED':
    case 'COMPLETED':
      return 'success';
    case 'PAST_DUE':
    case 'PENDING':
    case 'CREATED':
      return 'warning';
    case 'CANCELLED':
    case 'EXPIRED':
    case 'HALTED':
      return 'destructive';
    default:
      return 'primary';
  }
}

function formatDate(iso: string | null) {
  if (!iso) return 'Not available';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Not available';

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
  }).format(date);
}

function formatCurrency(currency: string | null) {
  return currency?.toUpperCase() || 'Not available';
}

function clearCheckoutIdentifiers() {
  sessionStorage.removeItem('billing_checkout_session_id');
  localStorage.removeItem('billing_checkout_session_id');
  sessionStorage.removeItem('register_checkout_subscription_id');
  localStorage.removeItem('register_checkout_subscription_id');
}

const CompanyProfile = () => {
  const { confirmBilling } = useAuth();
  const { subscription, loading, error, refetch } = useSubscription();
  const cancelSubscription = useCancelSubscription();
  const confirmCheckout = useConfirmCheckout();
  const subscribe = useSubscribe();
  const [cancellation, setCancellation] =
    useState<CancelSubscriptionResult | null>(null);
  const [isRecoveringCheckout, setIsRecoveringCheckout] = useState(false);
  const { data: latestPaymentHistory } = useBillingHistory({
    page: 1,
    limit: 1,
    type: ['CHECKOUT_COMPLETED', 'INVOICE_PAID'],
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="lg:py-7.5">
          <div className="flex flex-wrap gap-7.5">
            <Skeleton className="size-[140px] rounded-xl" />
            <div className="flex grow flex-col gap-4">
              <Skeleton className="h-7 w-64" />
              <Skeleton className="h-4 w-80 max-w-full" />
              <div className="flex flex-wrap gap-3">
                {Array.from({ length: 6 }, (_, index) => (
                  <Skeleton key={index} className="h-14 w-28 rounded-md" />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !subscription) {
    return (
      <Card>
        <CardContent className="lg:py-7.5">
          <Alert variant="destructive" appearance="light">
            <AlertIcon><AlertCircle /></AlertIcon>
            <AlertTitle>{error ?? 'No subscription data is available.'}</AlertTitle>
            <Button variant="outline" size="sm" onClick={refetch}>
              <RefreshCw />
              Try again
            </Button>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const planLabel = humanize(subscription.plan);
  const periodStart =
    subscription.currentPeriodStart ??
    latestPaymentHistory?.items[0]?.createdAt ??
    null;
  const periodAvailable =
    Boolean(periodStart) || Boolean(subscription.currentPeriodEnd);
  const checkoutPending = Boolean(subscription.checkoutPendingAt);
  const statistics = [
    { value: humanize(subscription.status), label: 'Account status' },
    { value: providerLabel(subscription.billingProvider), label: 'Provider' },
    { value: subscription.billingCountry?.toUpperCase() || 'Not available', label: 'Billing country' },
    { value: formatCurrency(subscription.billingCurrency), label: 'Currency' },
    { value: humanize(subscription.planChangePolicy), label: 'Plan changes' },
    ...(!checkoutPending
      ? [{ value: formatDate(subscription.currentPeriodEnd), label: 'Period ends' }]
      : []),
  ];
  const canCancel =
    subscription.subscriptionState !== 'CANCELLED' &&
    subscription.status !== 'CANCELLED' &&
    !checkoutPending &&
    !cancellation;

  const handleCompleteCheckout = async () => {
    const plan = subscription.plan.toUpperCase();
    if (plan !== 'STARTER' && plan !== 'PRO') {
      toast.error('This plan cannot be used to resume checkout.');
      return;
    }

    try {
      const result = await subscribe.mutateAsync(plan);
      if (result.checkoutUrl) {
        window.location.assign(result.checkoutUrl);
        return;
      }

      toast.success('Subscription is already up to date.');
      refetch();
    } catch (subscribeError) {
      const apiError = subscribeError as Error & {
        status?: number;
        code?: string;
      };
      const checkoutAlreadyPaid =
        apiError.status === 409 || apiError.code === 'CONFLICT';

      if (checkoutAlreadyPaid) {
        setIsRecoveringCheckout(true);
        try {
          const sessionId =
            sessionStorage.getItem('billing_checkout_session_id') ||
            localStorage.getItem('billing_checkout_session_id');
          if (sessionId) {
            await confirmCheckout.mutateAsync(sessionId);
            clearCheckoutIdentifiers();
            toast.success('Payment confirmed and subscription activated.');
            refetch();
            return;
          }

          const subscriptionId =
            sessionStorage.getItem('register_checkout_subscription_id') ||
            localStorage.getItem('register_checkout_subscription_id');
          if (subscriptionId) {
            const currentUser = await confirmBilling(
              subscriptionId,
              `confirm-recovery-${subscriptionId}`,
            );
            if (!currentUser.billingPending) {
              clearCheckoutIdentifiers();
              toast.success('Payment confirmed and subscription activated.');
              refetch();
              return;
            }
          }

          throw new Error(
            'Payment is complete, but the checkout confirmation ID is unavailable. Please reopen the payment success URL or contact support.',
          );
        } catch (confirmationError) {
          toast.error(
            confirmationError instanceof Error
              ? confirmationError.message
              : 'Failed to confirm the completed checkout',
          );
          return;
        } finally {
          setIsRecoveringCheckout(false);
        }
      }

      toast.error(
        subscribeError instanceof Error
          ? subscribeError.message
          : 'Failed to resume checkout',
      );
    }
  };

  const handleCancel = async () => {
    try {
      const result = await cancelSubscription.mutateAsync(true);
      setCancellation(result);
      toast.success(
        result.alreadyCancelled
          ? 'Subscription is already cancelled.'
          : result.effectiveAt
            ? `Cancellation scheduled for ${formatDate(result.effectiveAt)}.`
            : 'Cancellation request submitted.',
      );
    } catch (cancelError) {
      toast.error(
        cancelError instanceof Error
          ? cancelError.message
          : 'Failed to cancel subscription',
      );
    }
  };

  return (
    <Card>
      <CardContent className="lg:py-7.5">
        <div className="flex flex-wrap gap-7.5">
          <div className="flex size-[140px] shrink-0 flex-col items-center justify-center gap-3 rounded-xl bg-secondary-clarity ring-1 ring-border">
            <div className="flex size-[70px] items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
              {planLabel.charAt(0)}
            </div>
            <span className="text-sm font-semibold text-mono">{planLabel}</span>
          </div>

          <div className="flex grow flex-col gap-5 lg:gap-7.5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="text-2xl font-semibold text-mono">
                    {planLabel} Plan
                  </h2>
                  <Badge
                    size="md"
                    variant={statusBadgeVariant(subscription.subscriptionState)}
                    appearance="light"
                  >
                    {humanize(subscription.subscriptionState)}
                  </Badge>
                </div>
                <p className="text-sm text-secondary-foreground">
                  {checkoutPending ? (
                    'Checkout must be completed before the billing period begins.'
                  ) : periodAvailable ? (
                    <>
                      Current billing period:{' '}
                      <span className="font-medium text-foreground">
                        {formatDate(periodStart)} –{' '}
                        {formatDate(subscription.currentPeriodEnd)}
                      </span>
                    </>
                  ) : (
                    'No active billing period is available.'
                  )}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {checkoutPending ? (
                  <Button
                    size="sm"
                    onClick={handleCompleteCheckout}
                    disabled={
                      subscribe.isPending ||
                      confirmCheckout.isPending ||
                      isRecoveringCheckout
                    }
                  >
                    {(subscribe.isPending ||
                      confirmCheckout.isPending ||
                      isRecoveringCheckout) && (
                      <Loader2 className="animate-spin" />
                    )}
                    Continue Checkout
                  </Button>
                ) : (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={!canCancel || cancelSubscription.isPending}
                      >
                        {cancelSubscription.isPending && (
                          <Loader2 className="animate-spin" />
                        )}
                        {cancellation ? 'Cancellation Requested' : 'Cancel Plan'}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancel your subscription?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Your subscription will remain available until the end of the
                          current billing period. The payment provider will finalize the
                          cancellation, so the status may take a short time to update.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={cancelSubscription.isPending}>
                          Keep Plan
                        </AlertDialogCancel>
                        <AlertDialogAction
                          variant="destructive"
                          disabled={cancelSubscription.isPending}
                          onClick={handleCancel}
                        >
                          {cancelSubscription.isPending && (
                            <Loader2 className="animate-spin" />
                          )}
                          Confirm Cancellation
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}

                <Button variant="outline" size="sm" onClick={refetch}>
                  <RefreshCw />
                  Refresh
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-stretch gap-3 lg:gap-5">
              {statistics.map((stat) => (
                <div
                  key={stat.label}
                  className="flex min-w-28 flex-col gap-1.5 rounded-md border border-dashed border-input px-3 py-2.5"
                >
                  <span className="text-sm font-semibold leading-none text-mono">
                    {stat.value}
                  </span>
                  <span className="text-xs text-secondary-foreground">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>

            {subscription.subscriptionState === 'PAST_DUE' && (
              <Alert variant="warning" appearance="light">
                <AlertIcon><AlertCircle /></AlertIcon>
                <AlertTitle>
                  Payment is past due. Your account remains active during the grace period.
                </AlertTitle>
              </Alert>
            )}

            {cancellation && !cancellation.alreadyCancelled && (
              <Alert variant="warning" appearance="light">
                <AlertIcon><Clock3 /></AlertIcon>
                <AlertTitle>
                  Cancellation requested
                  {cancellation.effectiveAt
                    ? ` for ${formatDate(cancellation.effectiveAt)}`
                    : ''}
                  . The provider webhook will update the final subscription status.
                </AlertTitle>
              </Alert>
            )}

            {subscription.pendingPlan && (
              <div className="flex items-start gap-2 rounded-lg border border-dashed bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                <Clock3 className="mt-0.5 size-3.5 shrink-0 text-warning" />
                <span>
                  Plan change to <strong>{humanize(subscription.pendingPlan)}</strong>{' '}
                  {subscription.planChangeEffectiveAt
                    ? `is scheduled for ${formatDate(subscription.planChangeEffectiveAt)}.`
                    : 'is pending.'}
                </span>
              </div>
            )}

            {subscription.checkoutPendingAt && (
              <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-foreground">
                <Clock3 className="mt-0.5 size-3.5 shrink-0 text-warning" />
                <span>
                  Checkout was left incomplete on {formatDate(subscription.checkoutPendingAt)}.
                  Complete it to activate your billing period and subscription benefits.
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export { CompanyProfile };
