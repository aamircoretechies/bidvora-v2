import { useState } from 'react';
import { AlertCircle, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { useBillingHistory } from '@/hooks/use-billing-history';
import type {
  BillingEvent,
  BillingEventStatus,
} from '@/services/billing.service';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const PAGE_SIZE = 5;

const statusVariants: Record<
  BillingEventStatus,
  'success' | 'destructive' | 'warning' | 'secondary'
> = {
  paid: 'success',
  failed: 'destructive',
  setup: 'warning',
  cancelled: 'secondary',
};

function formatEventType(type: BillingEvent['type']) {
  return type
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function BillingRowsSkeleton() {
  return Array.from({ length: PAGE_SIZE }, (_, index) => (
    <TableRow key={index}>
      <TableCell><Skeleton className="h-4 w-36" /></TableCell>
      <TableCell><Skeleton className="ms-auto h-5 w-16" /></TableCell>
      <TableCell><Skeleton className="ms-auto h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="ms-auto h-4 w-20" /></TableCell>
    </TableRow>
  ));
}

const BillingInvoicing = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching, error, refetch } = useBillingHistory({
    page,
    limit: PAGE_SIZE,
  });

  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages ?? 0;
  const canGoBack = page > 1;
  const canGoForward = page < totalPages;

  return (
    <Card className="h-full">
      <CardHeader>
        <div>
          <CardTitle>Billing and Invoicing</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Your latest subscription and invoice activity
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          aria-label="Refresh billing history"
        >
          <RefreshCw className={isFetching ? 'animate-spin' : ''} />
          Refresh
        </Button>
      </CardHeader>

      <CardContent className="kt-scrollable-x-auto p-0">
        {error ? (
          <div className="p-5">
            <Alert variant="destructive" appearance="light">
              <AlertIcon><AlertCircle /></AlertIcon>
              <AlertTitle>
                {error instanceof Error
                  ? error.message
                  : 'Unable to load billing history'}
              </AlertTitle>
            </Alert>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-accent/60">
                <TableHead className="h-10 min-w-52">Activity</TableHead>
                <TableHead className="h-10 min-w-20 text-end">Status</TableHead>
                <TableHead className="h-10 min-w-30 text-end">Date</TableHead>
                <TableHead className="h-10 min-w-24 text-end">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <BillingRowsSkeleton />
              ) : data?.items.length ? (
                data.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="text-sm font-medium text-foreground">
                        {formatEventType(item.type)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {[item.plan, item.provider].filter(Boolean).join(' · ')}
                      </div>
                    </TableCell>
                    <TableCell className="text-end">
                      <Badge
                        variant={statusVariants[item.status] ?? 'secondary'}
                        appearance="light"
                        className="capitalize"
                      >
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-end text-sm text-foreground">
                      {formatDate(item.createdAt)}
                    </TableCell>
                    <TableCell className="text-end text-sm font-medium text-foreground">
                      {item.displayAmount}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center">
                    <p className="text-sm font-medium">No billing activity yet</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Completed checkouts and invoice events will appear here.
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {!error && pagination && pagination.total > 0 && (
        <CardFooter className="justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Page {pagination.page} of {Math.max(1, pagination.totalPages)} ·{' '}
            {pagination.total} events
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              mode="icon"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={!canGoBack || isFetching}
              aria-label="Previous billing history page"
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="sm"
              mode="icon"
              onClick={() => setPage((current) => current + 1)}
              disabled={!canGoForward || isFetching}
              aria-label="Next billing history page"
            >
              <ChevronRight />
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export { BillingInvoicing };
