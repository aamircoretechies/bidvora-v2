import {
  BillingInvoicing,
  CompanyProfile,
  LatestPayment,
  NextPayment,
  PaymentMethods,
  Upgrade,
} from '../components';
import { useSubscription } from '@/hooks/use-subscription';

export function SubscriptionContent() {
  const { subscription, loading } = useSubscription();
  const checkoutPending = Boolean(subscription?.checkoutPendingAt);
  const hasNextPayment = Boolean(subscription?.currentPeriodEnd);

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
