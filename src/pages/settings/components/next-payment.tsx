import { HexagonBadge } from '@/partials/common/hexagon-badge';
import { CalendarDays, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useSubscription } from '@/hooks/use-subscription';

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
}

const NextPayment = () => {
  const { subscription, loading } = useSubscription();

  return (
    <Card className="grow">
      <CardHeader>
        <CardTitle>Next Payment</CardTitle>
      </CardHeader>
      <CardContent className="lg:7.5">
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between flex-wrap border border-border rounded-xl gap-2 px-4 py-4 bg-secondary-clarity">
            <div className="flex items-center gap-3.5">
              <HexagonBadge
                stroke="stroke-orange-200 dark:stroke-orange-950"
                fill="fill-orange-50 dark:fill-orange-950/30"
                size="size-[50px]"
                badge={<CalendarDays className="text-xl text-orange-400" />}
              />
              <div className="flex flex-col">
                {loading ? (
                  <Skeleton className="h-4 w-28" />
                ) : (
                  <span className="text-sm font-medium text-mono">
                    on {formatDate(subscription?.currentPeriodEnd ?? null)}
                  </span>
                )}
                <p className="text-sm text-secondary-foreground">Due date</p>
              </div>
            </div>
            <Button
              variant="outline"
              shape="circle"
              mode="icon"
              className="bg-green-200 dark:border-green-950 dark:bg-green-950/30"
            >
              <Check className="text-green-600" />
            </Button>
          </div>
          <div className="place-self-end lg:pb-2.5">
            <Button>Manage Payment</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export { NextPayment };
