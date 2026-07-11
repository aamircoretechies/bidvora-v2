import { AlertCircle, Clock3, RefreshCw } from 'lucide-react';
import { useBillingHistory } from '@/hooks/use-billing-history';
import { useSubscription } from '@/hooks/use-subscription';
import type { SubscriptionStateValue } from '@/services/billing.service';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
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

const CompanyProfile = () => {
  const { subscription, loading, error, refetch } = useSubscription();
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
  const statistics = [
    { value: humanize(subscription.status), label: 'Account status' },
    { value: providerLabel(subscription.billingProvider), label: 'Provider' },
    { value: subscription.billingCountry?.toUpperCase() || 'Not available', label: 'Billing country' },
    { value: formatCurrency(subscription.billingCurrency), label: 'Currency' },
    { value: humanize(subscription.planChangePolicy), label: 'Plan changes' },
    { value: formatDate(subscription.currentPeriodEnd), label: 'Period ends' },
  ];

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
                  {periodAvailable ? (
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
              <Button variant="outline" size="sm" onClick={refetch}>
                <RefreshCw />
                Refresh
              </Button>
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
              <div className="flex items-start gap-2 rounded-lg border border-dashed bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                <Clock3 className="mt-0.5 size-3.5 shrink-0 text-warning" />
                <span>
                  Checkout has been pending since {formatDate(subscription.checkoutPendingAt)}.
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
