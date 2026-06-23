import React, { useEffect, useRef, useState } from 'react';
import { toAbsoluteUrl } from '@/lib/helpers';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import { LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/auth/context/auth-context';
import { authService } from '@/services/auth.service';

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
  const { auth, saveAuth } = useAuth();
  const [stats, setStats] = useState<IStatisticsItem[]>(
    details.map(item => ({ ...item, number: '-' }))
  );
  const [loading, setLoading] = useState(false);
  // Prevent infinite retry loops — only attempt one refresh per mount
  const hasRetried = useRef(false);

  const applyStats = (data: { totalBids: number; successfulBids: number; actionRequired: number }) => {
    setStats(prev => prev.map((item, index) => {
      if (index === 0) return { ...item, number: data.totalBids ?? item.number };
      if (index === 1) return { ...item, number: data.successfulBids ?? item.number };
      if (index === 2) return { ...item, number: data.actionRequired ?? item.number };
      return item;
    }));
  };

  useEffect(() => {
    let isMounted = true;
    hasRetried.current = false;

    const fetchStats = async (token: string): Promise<void> => {
      const response: any = await api.get('/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (isMounted && response?.success && response?.data) {
        applyStats(response.data);
      }
    };

    const run = async () => {
      if (!auth?.access_token) return;
      try {
        setLoading(true);
        await fetchStats(auth.access_token);
      } catch (error: any) {
        if (!isMounted) return;
        const msg: string = error?.message || '';

        // The backend surfaces the Freelancer API's 401 as API_401_UNAUTHENTICATED
        // inside a 500 response. Try rotating the token via POST /auth/refresh
        // and retry the stats call once with the fresh access token.
        if ((msg.includes('UNAUTHENTICATED') || msg.includes('401')) && !hasRetried.current) {
          hasRetried.current = true;
          try {
            if (!auth.refresh_token) throw new Error('No refresh token available');
            const tokens = await authService.refresh(auth.refresh_token);
            // Persist the new token pair so the rest of the app stays in sync
            saveAuth({ access_token: tokens.accessToken, refresh_token: tokens.refreshToken });
            // Retry /stats with the fresh access token
            await fetchStats(tokens.accessToken);
          } catch {
            if (isMounted) {
              toast.error('Your session has expired. Please sign in again.');
            }
          }
        } else {
          toast.error(msg || 'Failed to fetch freelancer statistics.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    run();

    return () => {
      isMounted = false;
    };
  }, [auth?.access_token]);

  return (
    <Card className="h-full border-0 md:border relative">
      {loading && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl">
          <LoaderCircle className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}
      <CardContent className="px-0 py-4 md:p-5 lg:px-10 h-full flex flex-col justify-center">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-y-8 md:gap-y-0 w-full items-center bg-transparent">
          {stats.map((item, index) => {
            const isLast = index === stats.length - 1;

            const borderClasses = index === 0
              ? 'border-r border-border/60'
              : index === 1
                ? 'md:border-r md:border-border/60'
                : '';

            return (
              <div
                key={index}
                className={`
                  flex px-4 md:px-6
                  ${isLast ? 'col-span-2 md:col-span-1 bg-secondary/30 md:bg-transparent border border-border/60 md:border-0 rounded-2xl md:rounded-none py-4 md:py-0 flex-row gap-5 items-center justify-center mx-4 md:mx-0 shadow-sm md:shadow-none' : 'flex-col md:flex-row items-center gap-4 md:gap-3 text-center md:text-left py-2 md:py-0'}
                  ${borderClasses}
                `}
              >
                <img
                  src={toAbsoluteUrl(`/media/brand-logos/${item.image}`)}
                  className={`${isLast ? 'h-14 md:h-10' : 'h-20 md:h-10'} drop-shadow-lg`}
                  alt="image"
                />
                <div className={`flex flex-col ${isLast ? 'text-left' : 'text-center md:text-left'}`}>
                  <span className="text-mono text-4xl md:text-2xl font-bold md:font-semibold">
                    {item.number}
                  </span>
                  <span className="text-secondary-foreground text-sm mt-1 md:mt-0">
                    {item.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
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
