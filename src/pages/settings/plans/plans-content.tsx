import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/auth/context/auth-context';
import { usePlans } from '@/hooks/use-plans';
import { BillingPlan } from '@/services/billing.service';
import { cn } from '@/lib/utils';
import { AlertCircle, Check, CreditCard, Loader2, Rocket, Sparkles } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

const COUNTRIES = [
  { value: 'IN', label: 'India' },
  { value: 'US', label: 'United States' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'CA', label: 'Canada' },
  { value: 'AU', label: 'Australia' },
];

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
}: {
  plan: BillingPlan;
  currentPlan?: string;
}) {
  const copy = PLAN_COPY[plan.plan];
  const Icon = copy.icon;
  const isPopular = plan.plan === 'PRO';
  const isCurrent = currentPlan === plan.plan;

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
          asChild
          size="lg"
          variant={isPopular ? 'primary' : 'outline'}
          className="w-full"
          disabled={isCurrent}
        >
          <Link to="/settings/subscription">
            {isCurrent ? 'Current plan' : 'Manage plan'}
          </Link>
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
  const [country, setCountry] = useState(
    user?.billingCountry?.toUpperCase() || 'IN',
  );
  const { plans, loading, error, refetch } = usePlans(country);

  const currentPlan = user?.plan || user?.selectedPlan;
  const sortedPlans = useMemo(
    () =>
      [...(plans?.plans ?? [])].sort((a, b) =>
        a.plan === 'STARTER' && b.plan === 'PRO' ? -1 : 1,
      ),
    [plans],
  );

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
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger size="lg" className="w-full sm:w-56">
                <SelectValue placeholder="Billing country" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardToolbar>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <CreditCard className="size-5" />
              </div>
              <div>
                <div className="text-sm font-medium text-mono">
                  {plans
                    ? `${plans.billingProvider} handles ${plans.currency.toUpperCase()} billing`
                    : 'Loading billing provider'}
                </div>
                <div className="text-sm text-muted-foreground">
                  Plan changes apply at {plans?.planChangePolicy?.replace('_', ' ') || 'cycle end'}.
                </div>
              </div>
            </div>
            {loading && (
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
        {loading
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
              <PlanCard key={plan.plan} plan={plan} currentPlan={currentPlan} />
            ))}
      </div>
    </div>
  );
}
