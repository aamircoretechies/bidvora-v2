import { AlertCircle, RefreshCw } from 'lucide-react';
import { useBillingHistory } from '@/hooks/use-billing-history';
import { toAbsoluteUrl } from '@/lib/helpers';
import type {
  BillingEvent,
  BillingEventStatus,
} from '@/services/billing.service';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';

const paymentEventTypes = [
  'CHECKOUT_COMPLETED',
  'INVOICE_PAID',
  'INVOICE_FAILED',
] as const;

const statusVariants: Record<
  BillingEventStatus,
  'success' | 'destructive' | 'warning' | 'secondary'
> = {
  paid: 'success',
  failed: 'destructive',
  setup: 'warning',
  cancelled: 'secondary',
};

function humanize(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function DetailValue({ item, field }: { item: BillingEvent; field: string }) {
  if (field === 'status') {
    return (
      <Badge
        variant={statusVariants[item.status] ?? 'secondary'}
        appearance="light"
        className="capitalize"
      >
        {item.status}
      </Badge>
    );
  }

  if (field === 'provider') {
    const provider = item.provider?.toUpperCase() ?? '';
    const logo =
      provider === 'PAYPAL'
        ? '/media/brand-logos/PayPal-full.svg'
        : provider === 'RAZORPAY'
          ? '/media/brand-logos/Razorpay-full.svg'
          : null;

    return logo ? (
      <img
        src={toAbsoluteUrl(logo)}
        alt={`${humanize(provider)} logo`}
        className="h-5 max-w-28 object-contain object-left"
      />
    ) : (
      <>{provider ? humanize(provider) : 'Not available'}</>
    );
  }

  const values: Record<string, string> = {
    id: `#${item.id}`,
    type: humanize(item.type),
    plan: humanize(item.plan),
    date: formatDate(item.createdAt),
    currency: item.currency.toUpperCase(),
    amount: item.displayAmount,
    amountCents:
      item.amountCents == null
        ? 'Not available'
        : item.amountCents.toLocaleString(),
  };

  return <>{values[field] ?? 'Not available'}</>;
}

const LatestPayment = () => {
  const { data, isLoading, isFetching, error, refetch } = useBillingHistory({
    page: 1,
    limit: 1,
    type: [...paymentEventTypes],
  });
  const payment = data?.items[0];
  const details = [
    { label: 'Plan', field: 'plan' },
    { label: 'Payment Date', field: 'date' },
    { label: 'Provider', field: 'provider' },
    { label: 'Currency', field: 'currency' },
    { label: 'Amount', field: 'amount' },
    { label: 'Amount (minor units)', field: 'amountCents' },
    { label: 'Status', field: 'status' },
  ];

  return (
    <Card className="grow">
      <CardHeader>
        <div>
          <CardTitle>Latest Payment</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Most recent checkout or invoice event
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          aria-label="Refresh latest payment"
        >
          <RefreshCw className={isFetching ? 'animate-spin' : ''} />
          Refresh
        </Button>
      </CardHeader>

      <CardContent className="p-0 pb-3 pt-4">
        {error ? (
          <div className="px-5 pb-3">
            <Alert variant="destructive" appearance="light">
              <AlertIcon><AlertCircle /></AlertIcon>
              <AlertTitle>
                {error instanceof Error
                  ? error.message
                  : 'Unable to load the latest payment'}
              </AlertTitle>
            </Alert>
          </div>
        ) : isLoading ? (
          <div className="space-y-4 px-5 pb-3">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="flex items-center justify-between gap-6">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-36" />
              </div>
            ))}
          </div>
        ) : payment ? (
          <Table>
            <TableBody>
              {details.map((detail) => (
                <TableRow key={detail.field} className="border-0">
                  <TableCell className="min-w-40 py-0 pb-2 pe-6 text-sm text-secondary-foreground">
                    {detail.label}
                  </TableCell>
                  <TableCell className="py-0 pb-2 text-sm font-medium text-foreground">
                    <DetailValue item={payment} field={detail.field} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex min-h-40 flex-col items-center justify-center px-5 text-center">
            <p className="text-sm font-medium">No payment activity yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Completed checkouts and invoice attempts will appear here.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export { LatestPayment };
