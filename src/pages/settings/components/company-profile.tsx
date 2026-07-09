import { AvatarGroup, Avatars } from '@/partials/common/avatar-group';
import { Link } from 'react-router';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useSubscription } from '@/hooks/use-subscription';
import { AlertCircle } from 'lucide-react';

/** Map billing provider → human-readable label */
function providerLabel(provider: string | null): string {
  if (provider === 'RAZORPAY') return 'Razorpay · INR';
  if (provider === 'PAYPAL') return 'PayPal · USD';
  return '—';
}

/** Map subscription state → badge variant */
function statusBadgeVariant(
  state: string | null,
): 'success' | 'warning' | 'destructive' | 'primary' {
  switch (state) {
    case 'ACTIVE':
      return 'success';
    case 'PAST_DUE':
    case 'PENDING':
      return 'warning';
    case 'CANCELLED':
    case 'EXPIRED':
    case 'HALTED':
      return 'destructive';
    default:
      return 'primary';
  }
}

/** Format an ISO date string to "17 Aug, 2024" */
function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
}

const group: Avatars = [
  { filename: '300-4.png', variant: 'size-6' },
  { filename: '300-1.png', variant: 'size-6' },
  { filename: '300-2.png', variant: 'size-6' },
  {
    fallback: '+16',
    variant: 'text-primary-foreground size-6 ring-background bg-green-500',
  },
];

const CompanyProfile = () => {
  const { subscription, loading, error } = useSubscription();

  if (loading) {
    return (
      <Card>
        <CardContent className="lg:py-7.5">
          <div className="flex flex-wrap gap-7.5">
            <Skeleton className="size-[140px] rounded-xl" />
            <div className="flex flex-col gap-4 grow">
              <Skeleton className="h-7 w-64" />
              <Skeleton className="h-4 w-48" />
              <div className="flex gap-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-20 rounded-md" />
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
          <div className="flex items-center gap-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>{error ?? 'No subscription data available.'}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const planLabel =
    subscription.plan.charAt(0).toUpperCase() +
    subscription.plan.slice(1).toLowerCase();

  const billingCycle =
    subscription.planChangePolicy === 'cycle_end' ? 'Monthly Plan' : 'Annual Plan';

  const statistics = [
    { total: subscription.status, description: 'Status' },
    {
      total: subscription.subscriptionState,
      description: 'Sub. State',
    },
    {
      total: providerLabel(subscription.billingProvider),
      description: 'Provider',
    },
    {
      total: formatDate(subscription.currentPeriodEnd),
      description: 'Next bill date',
    },
    ...(subscription.pendingPlan
      ? [{ total: subscription.pendingPlan, description: 'Pending Plan' }]
      : []),
  ];

  return (
    <Card>
      <CardContent className="lg:py-7.5">
        <div className="flex flex-wrap gap-7.5">
          {/* Plan icon / logo placeholder */}
          <div className="flex flex-col gap-3 items-center justify-center size-[140px] rounded-xl ring-1 ring-border bg-secondary-clarity shrink-0">
            <div className="flex items-center justify-center size-[70px] rounded-full bg-primary/10 text-primary text-2xl font-bold">
              {planLabel.charAt(0)}
            </div>
            <span className="text-sm font-semibold text-mono">{planLabel}</span>
          </div>

          <div className="flex flex-col gap-5 lg:gap-7.5 grow">
            {/* Title + actions */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-2xl font-semibold text-mono">
                    {planLabel} Plan
                  </h2>
                  <Badge
                    size="md"
                    variant={statusBadgeVariant(subscription.subscriptionState)}
                    appearance="light"
                  >
                    {billingCycle}
                  </Badge>
                  {subscription.billingCountry && (
                    <Badge size="md" variant="primary" appearance="light">
                      {subscription.billingCountry.toUpperCase()}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-secondary-foreground">
                  Billing period:{' '}
                  <span className="font-medium text-foreground">
                    {formatDate(subscription.currentPeriodStart)}
                    {' – '}
                    {formatDate(subscription.currentPeriodEnd)}
                  </span>
                </p>
              </div>
              {/*  <div className="flex items-center gap-2.5 shrink-0">
                <Button variant="outline">
                  <Link to="#">Cancel Plan</Link>
                </Button>
                <Button>
                  <Link to="#">Upgrade Plan</Link>
                </Button>
              </div> */}
            </div>

            {/* Stats grid */}
            <div className="flex items-center flex-wrap gap-3 lg:gap-5">
              {statistics.map((stat, index) => (
                <div
                  key={index}
                  className="flex flex-col gap-1.5 px-2.75 py-2.25 border border-dashed border-input rounded-md"
                >
                  <span className="text-mono text-sm leading-none font-medium">
                    {stat.total}
                  </span>
                  <span className="text-secondary-foreground text-xs">
                    {stat.description}
                  </span>
                </div>
              ))}
            </div>

            {/* Pending plan change notice */}
            {subscription.pendingPlan && subscription.planChangeEffectiveAt && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2 border border-dashed">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 text-warning" />
                Plan change to{' '}
                <span className="font-semibold">
                  {subscription.pendingPlan}
                </span>{' '}
                takes effect on{' '}
                <span className="font-semibold">
                  {formatDate(subscription.planChangeEffectiveAt)}
                </span>
                .
              </div>
            )}

            {/* Seats row (decorative — real seat data not in this endpoint) */}
            {/*  <div className="flex justify-end">
              <div className="flex flex-col gap-2.5 shrink-0 -mt-3">
                <div className="text-sm font-medium text-secondary-foreground">
                  Seats:{' '}
                  <span className="text-sm font-semibold text-foreground">
                    29 of 120 used
                  </span>
                </div>
                <AvatarGroup group={group} />
              </div>
            </div> */}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export { CompanyProfile };
