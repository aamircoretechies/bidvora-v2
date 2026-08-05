import {
  BillingInvoicing,
  CompanyProfile,
  LatestPayment,
  NextPayment,
  PaymentMethods,
  Upgrade,
} from '../components';
import { useSubscription } from '@/hooks/use-subscription';
import { useAuth } from '@/auth/context/auth-context';
import { useTrialExpiryRefresh } from '@/hooks/use-trial-expiry-refresh';

export function SubscriptionContent() {
  const { user } = useAuth();
  const { subscription, loading } = useSubscription();
  useTrialExpiryRefresh(subscription?.trialEndsAt ?? user?.trialEndsAt);
  const checkoutPending = Boolean(subscription?.checkoutPendingAt);
  const nextPaymentDate =
    user?.status === 'TRIAL'
      ? user.trialEndsAt
      : subscription?.currentPeriodEnd;
  const hasNextPayment = Boolean(nextPaymentDate);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-7.5">
      <div className="col-span-2">
        <Upgrade />
      </div>
      <div className="col-span-2">
        <CompanyProfile />
      </div>
      <div className={`col-span-2 flex ${checkoutPending ? '' : 'lg:col-span-1'}`}>
        <LatestPayment />
      </div>
      {!loading && !checkoutPending && hasNextPayment && (
        <div className="col-span-2 lg:col-span-1 flex">
          <NextPayment />
        </div>
      )}
     {/*  <div className="col-span-2 lg:col-span-1 flex">
        <PaymentMethods />
      </div> */}
      <div className="col-span-2 lg:col-span-2">
        <BillingInvoicing />
      </div>
    </div>
  );
}
