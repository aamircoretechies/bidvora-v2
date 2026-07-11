import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/auth/context/auth-context';
import { usePlans } from '@/hooks/use-plans';
import { useSubscribe } from '@/hooks/use-subscribe';
import { useSubscription } from '@/hooks/use-subscription';
import type { BillingPlan } from '@/services/billing.service';
import { toAbsoluteUrl } from '@/lib/helpers';
import { cn } from '@/lib/utils';
import { AlertCircle, Check, Loader2, Rocket, Sparkles } from 'lucide-react';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardHeading,
  CardTitle,
  CardToolbar,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const PLAN_COPY = {
  STARTER: {
    title: 'Starter',
    description: 'Perfect for solo freelancers automating proposals and lead generation workflows.',
    icon: Rocket,
    features: [
      'AI proposal assistant',
      'Automated bidding system',
      'Smart opportunity tracking',
      'Single account integration',
      'Analytics and performance reports',
    ],
  },
  PRO: {
    title: 'Pro',
    description: 'Built for growing agencies that need advanced automation and scalable lead generation.',
    icon: Sparkles,
    features: [
      'Everything in Starter',
      'AI chat assistant',
      'Smart workflow automation',
      'Knowledge base integration',
      'Advanced analytics and reporting',
      'Lead intelligence system',
      'Priority support',
    ],
  },
} as const;

function intervalLabel(interval: BillingPlan['interval']) {
  return interval === 'month' ? '/mo' : '/yr';
}

function PlanCard({
  plan,
  currentPlan,
  pendingPlan,
  checkoutPendingPlan,
  isChanging,
  onSelect,
}: {
  plan: BillingPlan;
  currentPlan?: string;
  pendingPlan?: string | null;
  checkoutPendingPlan?: string;
  isChanging: boolean;
  onSelect: (plan: BillingPlan['plan']) => void;
}) {
  const copy = PLAN_COPY[plan.plan];
  const Icon = copy.icon;
  const isPopular = plan.plan === 'PRO';
  const isCurrent = currentPlan === plan.plan;
  const isScheduled = pendingPlan === plan.plan;
  const isCheckoutPending = checkoutPendingPlan === plan.plan;

  return (
    <Card
      className={cn(
        'relative overflow-hidden',
        isPopular && 'border-primary shadow-md shadow-primary/10',
      )}
    >
      {isPopular && (
        <div className="absolute end-5 top-5">
          <Badge variant="primary" appearance="light">
            Most popular
          </Badge>
        </div>
      )}

      <CardContent className="flex h-full flex-col gap-6 p-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-5" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-mono">{copy.title}</h3>
            <p className="text-sm text-muted-foreground">{plan.plan}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-end gap-1">
            <span className="text-4xl font-semibold tracking-tight text-mono">
              {plan.displayAmount}
            </span>
            <span className="pb-1.5 text-sm text-muted-foreground">
              {intervalLabel(plan.interval)}
            </span>
          </div>
          <p className="min-h-12 text-sm leading-6 text-secondary-foreground">
            {copy.description}
          </p>
        </div>

        <Button
          size="lg"
          variant={isPopular ? 'primary' : 'outline'}
          className="w-full"
          disabled={isCurrent || isScheduled || isChanging}
          onClick={() => onSelect(plan.plan)}
        >
          {isChanging && <Loader2 className="animate-spin" />}
          {isCurrent
            ? 'Current plan'
            : isScheduled
              ? 'Scheduled plan'
              : isCheckoutPending
                ? 'Continue checkout'
                : 'Choose plan'}
        </Button>

        <div className="border-t border-border pt-6">
          <div className="space-y-3.5">
            {copy.features.map((feature) => (
              <div key={feature} className="flex items-center gap-3 text-sm">
                <Check className="size-4 text-primary" />
                <span className="text-secondary-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PlansContent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { subscription, loading: subscriptionLoading } = useSubscription();
  const subscribe = useSubscribe();
  const country = subscription?.billingCountry ?? user?.billingCountry ?? null;
  const { plans, loading, error, refetch } = usePlans(country);
  const provider = plans?.billingProvider;
  const providerLabel = provider === 'RAZORPAY' ? 'Razorpay' : provider === 'PAYPAL' ? 'PayPal' : null;
  const providerLogo = provider === 'RAZORPAY'
    ? '/media/brand-logos/Razorpay-full.svg'
    : provider === 'PAYPAL'
      ? '/media/brand-logos/PayPal-full.svg'
      : null;

  const checkoutPendingPlan = subscription?.checkoutPendingAt
    ? subscription.plan
    : undefined;
  const hasCurrentSubscription = Boolean(
    subscription &&
      !subscription.checkoutPendingAt &&
      ['ACTIVE', 'AUTHENTICATED', 'COMPLETED', 'PAST_DUE'].includes(
        subscription.subscriptionState,
      ),
  );
  const currentPlan = hasCurrentSubscription ? subscription?.plan : undefined;
  const sortedPlans = useMemo(
    () =>
      [...(plans?.plans ?? [])].sort((a, b) =>
        a.plan === 'STARTER' && b.plan === 'PRO' ? -1 : 1,
      ),
    [plans],
  );

  const handleSelectPlan = async (plan: BillingPlan['plan']) => {
    if (checkoutPendingPlan === plan) {
      navigate('/settings/subscription');
      return;
    }

    try {
      const result = await subscribe.mutateAsync(plan);
      if (result.checkoutUrl) {
        window.location.assign(result.checkoutUrl);
        return;
      }

      toast.success(
        result.subscription.pendingPlan
          ? `${result.subscription.pendingPlan} is scheduled for the next billing cycle.`
          : 'Subscription is already up to date.',
      );
      navigate('/settings/subscription');
    } catch (selectError) {
      toast.error(
        selectError instanceof Error
          ? selectError.message
          : 'Failed to update subscription plan',
      );
    }
  };

  return (
    <div className="grid grid-cols-1 gap-5 lg:gap-7.5">
      <Card>
        <CardHeader>
          <CardHeading>
            <CardTitle>Plans</CardTitle>
            <CardDescription>
              Country-aware pricing and billing provider for your subscription.
            </CardDescription>
          </CardHeading>
          <CardToolbar className="w-full sm:w-auto">
            <div className="flex flex-wrap items-center gap-2">
              {hasCurrentSubscription && subscription && (
                <Badge variant="success" appearance="light" size="lg">
                  Current: {subscription.plan}
                </Badge>
              )}
              {subscription?.pendingPlan && (
                <Badge variant="warning" appearance="light" size="lg">
                  Scheduled: {subscription.pendingPlan}
                </Badge>
              )}
              {checkoutPendingPlan && (
                <Badge variant="warning" appearance="light" size="lg">
                  Checkout pending: {checkoutPendingPlan}
                </Badge>
              )}
              <Badge variant="primary" appearance="light" size="lg">
                Billing country: {country?.toUpperCase() || 'Not configured'}
              </Badge>
            </div>
          </CardToolbar>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-24 items-center justify-center rounded-lg border bg-background px-3">
                {providerLogo ? (
                  <img
                    src={toAbsoluteUrl(providerLogo)}
                    alt={`${providerLabel} logo`}
                    className="max-h-5 w-full object-contain"
                  />
                ) : (
                  <Skeleton className="h-5 w-16" />
                )}
              </div>
              <div>
                <div className="text-sm font-medium text-mono">
                  {plans
                    ? `${providerLabel} handles ${plans.currency.toUpperCase()} billing`
                    : 'Loading billing provider'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {plans?.country || country?.toUpperCase() || 'Unknown'} pricing.
                  Plan changes apply at {plans?.planChangePolicy?.replace('_', ' ') || 'cycle end'}.
                </div>
              </div>
            </div>
            {(loading || subscriptionLoading) && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Loading plans
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" appearance="light">
          <AlertIcon>
            <AlertCircle />
          </AlertIcon>
          <AlertTitle className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{error}</span>
            <Button size="sm" variant="outline" onClick={refetch}>
              Retry
            </Button>
          </AlertTitle>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-7.5">
        {loading || subscriptionLoading
          ? [0, 1].map((item) => (
              <Card key={item}>
                <CardContent className="space-y-6 p-6">
                  <Skeleton className="h-10 w-36" />
                  <Skeleton className="h-12 w-48" />
                  <Skeleton className="h-10 w-full" />
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </CardContent>
              </Card>
            ))
          : sortedPlans.map((plan) => (
              <PlanCard
                key={plan.plan}
                plan={plan}
                currentPlan={currentPlan}
                pendingPlan={subscription?.pendingPlan}
                checkoutPendingPlan={checkoutPendingPlan}
                isChanging={subscribe.isPending && subscribe.variables === plan.plan}
                onSelect={handleSelectPlan}
              />
            ))}
      </div>
    </div>
  );
}
