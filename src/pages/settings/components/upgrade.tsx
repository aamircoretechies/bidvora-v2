import { Fragment } from 'react';
import { Crown } from 'lucide-react';
import { Link } from 'react-router';
import { toAbsoluteUrl } from '@/lib/helpers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useSubscription } from '@/hooks/use-subscription';
import { useAuth } from '@/auth/context/auth-context';

/** Returns the number of days remaining until `iso`, or null */
function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

const Upgrade = () => {
  const { user } = useAuth();
  const { subscription, loading: subscriptionLoading } = useSubscription();

  // Determine if we're still in a trial period
  const isTrial = user?.status === 'TRIAL' || user?.status === 'PENDING_VERIFICATION';
  const trialDays = daysUntil(user?.trialEndsAt ?? null);
  const checkoutPending = Boolean(subscription?.checkoutPendingAt);

  // Show the upgrade banner only for non-PRO or trial plans
  const planLabel = (subscription?.plan ?? user?.plan ?? 'STARTER')
    .charAt(0)
    .toUpperCase() + (subscription?.plan ?? user?.plan ?? 'STARTER').slice(1).toLowerCase();

  return (
    <Fragment>
      <style>
        {`
          .upgrade-bg {
            background-image: url('${toAbsoluteUrl('/media/images/2600x1200/bg-14.png')}');
          }
          .dark .upgrade-bg {
            background-image: url('${toAbsoluteUrl('/media/images/2600x1200/bg-14-dark.png')}');
          }
        `}
      </style>

      <Card className="rounded-xl border-amber-200/80 ring-1 ring-amber-100/70 dark:border-amber-700/40 dark:ring-amber-800/30">
        <div className="flex grow flex-col items-start justify-between gap-5 bg-[center_right_-8rem] bg-no-repeat bg-[length:700px] p-5 sm:flex-row sm:items-center rtl:bg-[center_left_-8rem] upgrade-bg">
          <div className="flex items-center gap-4">
            <div className="relative flex size-[54px] shrink-0 items-center justify-center">
              <div className="absolute inset-1 rounded-2xl bg-amber-400/35 blur-md dark:bg-amber-300/25" />
              <div className="relative flex size-[50px] items-center justify-center rounded-2xl border border-amber-300/80 bg-gradient-to-br from-amber-50 via-yellow-100 to-amber-200 shadow-[0_8px_24px_-8px_rgba(245,158,11,0.75)] dark:border-amber-500/50 dark:from-amber-950 dark:via-amber-900 dark:to-yellow-950">
                <Crown
                  className="size-6 fill-amber-400 text-amber-600 drop-shadow-[0_2px_4px_rgba(245,158,11,0.45)] dark:fill-amber-500 dark:text-amber-300"
                  strokeWidth={1.8}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <Link
                  to="/settings/plans"
                  className="text-base font-medium text-mono hover:text-primary-active"
                >
                  Upgrade your plan to{' '}
                  {planLabel === 'Starter' ? 'Pro' : 'Enterprise'}
                </Link>
                {isTrial && !subscriptionLoading && !checkoutPending && trialDays !== null && (
                  <Badge variant="destructive" appearance="light">
                    Trial expires in {trialDays} day{trialDays !== 1 ? 's' : ''}
                  </Badge>
                )}
                {subscription?.subscriptionState === 'PAST_DUE' && (
                  <Badge variant="warning" appearance="light">
                    Payment overdue
                  </Badge>
                )}
              </div>
              <div className="text-sm text-secondary-foreground">
                {planLabel === 'Starter'
                  ? 'Upgrade to Pro for advanced automation, more bids, and priority support.'
                  : 'Upgrade to Enterprise for unlimited access and dedicated account management.'}
              </div>
            </div>
          </div>
          <div className="ms-auto shrink-0">
            <Button variant="mono" asChild>
              <Link to="/settings/plans">Upgrade Plan</Link>
            </Button>
          </div>
        </div>
      </Card>
    </Fragment>
  );
};

export { Upgrade };
