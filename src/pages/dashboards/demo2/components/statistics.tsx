import { AlertCircle, LoaderCircle, RefreshCw } from 'lucide-react';
import { useFreelancerStats } from '@/hooks/use-freelancer-stats';
import { toAbsoluteUrl } from '@/lib/helpers';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface IStatisticsItem {
  image: string;
  number: string | number;
  label: string;
}

type IStatisticsItems = Array<IStatisticsItem>;

interface IStatisticsProps {
  details: IStatisticsItem[];
}

const Statistics = ({ details }: IStatisticsProps) => {
  const { data, isFetching, error, refetch } = useFreelancerStats();
  const values = [data?.totalBids, data?.successfulBids, data?.actionRequired];
  const stats = details.map((item, index) => ({
    ...item,
    number: values[index] ?? '-',
  }));

  return (
    <Card className="relative h-full border-0 md:border">
      {isFetching && !error && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/50 backdrop-blur-sm">
          <LoaderCircle className="size-8 animate-spin text-primary" />
        </div>
      )}

      <CardContent className="flex h-full flex-col justify-center px-0 py-4 md:p-5 lg:px-10">
        {error ? (
          <Alert variant="destructive" appearance="light" className="mx-5 w-auto">
            <AlertIcon><AlertCircle /></AlertIcon>
            <AlertTitle>
              {error instanceof Error
                ? error.message
                : 'Failed to fetch Freelancer statistics.'}
            </AlertTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={isFetching ? 'animate-spin' : ''} />
              Retry
            </Button>
          </Alert>
        ) : (
          <div className="grid w-full grid-cols-2 items-center gap-y-8 bg-transparent md:grid-cols-3 md:gap-y-0">
            {stats.map((item, index) => {
              const isLast = index === stats.length - 1;
              const borderClasses =
                index === 0
                  ? 'border-r border-border/60'
                  : index === 1
                    ? 'md:border-r md:border-border/60'
                    : '';

              return (
                <div
                  key={item.label}
                  className={`
                    flex px-4 md:px-6
                    ${isLast ? 'col-span-2 mx-4 flex-row items-center justify-center gap-5 rounded-2xl border border-border/60 bg-secondary/30 py-4 shadow-sm md:col-span-1 md:mx-0 md:rounded-none md:border-0 md:bg-transparent md:py-0 md:shadow-none' : 'flex-col items-center gap-4 py-2 text-center md:flex-row md:gap-3 md:py-0 md:text-left'}
                    ${borderClasses}
                  `}
                >
                  <img
                    src={toAbsoluteUrl(`/media/brand-logos/${item.image}`)}
                    className={`${isLast ? 'h-14 md:h-10' : 'h-20 md:h-10'} drop-shadow-lg`}
                    alt=""
                    aria-hidden="true"
                  />
                  <div className={`flex flex-col ${isLast ? 'text-left' : 'text-center md:text-left'}`}>
                    <span className="text-4xl font-bold text-mono md:text-2xl md:font-semibold">
                      {item.number}
                    </span>
                    <span className="mt-1 text-sm text-secondary-foreground md:mt-0">
                      {item.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export {
  Statistics,
  type IStatisticsItem,
  type IStatisticsItems,
  type IStatisticsProps,
};
