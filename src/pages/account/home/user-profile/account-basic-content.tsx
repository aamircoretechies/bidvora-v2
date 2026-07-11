import { AlertCircle, RefreshCw } from 'lucide-react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BasicSettings, PersonalInfo } from './components';

export function AccountUserProfileContent() {
  const { data: user, isLoading, error, refetch, isFetching } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2 lg:gap-7.5">
        {[0, 1].map((item) => (
          <Card key={item}>
            <CardContent className="space-y-5 p-6">
              <Skeleton className="h-6 w-36" />
              {Array.from({ length: 5 }, (_, index) => (
                <div key={index} className="flex justify-between gap-6">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-44" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !user) {
    return (
      <Alert variant="destructive" appearance="light">
        <AlertIcon><AlertCircle /></AlertIcon>
        <AlertTitle>
          {error instanceof Error ? error.message : 'Unable to load your profile'}
        </AlertTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={isFetching ? 'animate-spin' : ''} />
          Try again
        </Button>
      </Alert>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2 lg:gap-7.5">
      <PersonalInfo user={user} />
      <BasicSettings title="Account & Subscription" user={user} />
    </div>
  );
}
