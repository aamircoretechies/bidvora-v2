import { Fragment } from 'react';
import { HexagonBadge } from '@/partials/common/hexagon-badge';
import { ScrollText } from 'lucide-react';
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
  const { subscription } = useSubscription();

  // Determine if we're still in a trial period
  const isTrial = user?.status === 'TRIAL' || user?.status === 'PENDING_VERIFICATION';
  const trialDays = daysUntil(user?.trialEndsAt ?? null);

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

      <Card className="rounded-xl">
        <div className="flex items-center justify-between grow gap-5 p-5 rtl:bg-[center_left_-8rem] bg-[center_right_-8rem] bg-no-repeat bg-[length:700px] upgrade-bg">
          <div className="flex items-center gap-4">
            <HexagonBadge
              stroke="stroke-blue-200 dark:stroke-blue-950"
              fill="fill-blue-50 dark:fill-blue-950/30"
              size="size-[50px]"
              badge={<ScrollText className="text-xl text-blue-400" />}
            />
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <Link
                  to="#"
                  className="text-base font-medium text-mono hover:text-primary-active"
                >
                  Upgrade your plan to{' '}
                  {planLabel === 'Starter' ? 'Pro' : 'Enterprise'}
                </Link>
                {isTrial && trialDays !== null && (
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
          {/*  <div className="flex items-center gap-1.5 shrink-0">
            {isTrial && (
              <Button variant="ghost">
                <Link to="#">Cancel Trial</Link>
              </Button>
            )}
            <Button variant="mono">
              <Link to="#">Upgrade Now</Link>
            </Button>
          </div> */}
        </div>
      </Card>
    </Fragment>
  );
};

export { Upgrade };
