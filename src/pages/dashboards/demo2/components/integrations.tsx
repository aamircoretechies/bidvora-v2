import { Check, Plus, X, Settings, Loader2 } from 'lucide-react';
import { Link } from 'react-router';
import { toAbsoluteUrl } from '@/lib/helpers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { freelancerService } from '@/services/freelancer.service';
import { toast } from 'sonner';
import { useAuth } from '@/auth/context/auth-context';

interface IIntegrationsItem {
  logo: string;
  title: string;
  email: string;
  description: string;
  connected: boolean;
}
type IIntegrationsItems = Array<IIntegrationsItem>;

const Integrations = ({ isFreelancerConnected = false, onConnected }: { isFreelancerConnected?: boolean, onConnected?: () => void }) => {
  const { user } = useAuth();
  const [connected, setConnected] = useState(isFreelancerConnected);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    setConnected(isFreelancerConnected);
  }, [isFreelancerConnected]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'FREELANCER_CONNECTED') {
        setConnected(true);
        if (onConnected) onConnected();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleConnectFreelancer = async () => {
    try {
      setConnecting(true);
      const response = await freelancerService.getFreelancerAuthorizeUrl();

      if (response.success && response.data?.url) {
        // Open popup
        const width = 600;
        const height = 700;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;

        const popup = window.open(
          response.data.url,
          'Connect Freelancer',
          `width=${width},height=${height},top=${top},left=${left},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
        );

        if (!popup || popup.closed || typeof popup.closed === 'undefined') {
          // Popup blocked, fallback to redirect
          window.location.href = response.data.url;
        }
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to get authorization URL');
    } finally {
      setConnecting(false);
    }
  };

  const items: IIntegrationsItems = [
    {
      logo: 'freelancer.svg',
      title: 'Freelancer Account',
      email: user?.email ?? '',
      description: 'Integrate for enhanced collaboration in web development.',
      connected: connected,
    },

  ];

  const renderItem = (item: IIntegrationsItem, index: number) => {
    return (
      <div
        key={index}
        className="flex bg-primary/10 items-center justify-between flex-wrap  dark:bg-secondary-clarity rounded-xl gap-2 p-3.5"
      >
        <div className="flex items-center flex-wrap gap-3.5">
          <img
            src={toAbsoluteUrl(`/media/brand-logos/${item.logo}`)}
            className="size-8 shrink-0"
            alt="image"
          />
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <Link
                to="#"
                className="text-lg font-bold text-mono hover:text-primary-active"
              >
                {item.title}
              </Link>
              {/*  <Link
                to="#"
                className="text-sm text-secondary-foreground hover:text-primary-active"
              >
                {item.email}
              </Link> */}
            </div>
            <span className="text-sm font-medium text-secondary-foreground">
              {item.email}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 lg:gap-5">
          {item.connected ? (
            <>
              <Badge size="lg" className='rounded-full' variant="success" appearance="default">
                <Check size={18} /> Connected
              </Badge>
              <Button variant="ghost" mode="icon" asChild>
                <Link to="/settings/bidding">
                  <Settings />
                </Link>
              </Button>
            </>
          ) : (
            <>
              {/* <Badge size="lg" className='rounded-full' variant="destructive" appearance="light">
                <X size={18} /> Disconnected
              </Badge> */}
              <Button
                variant="primary"
                size="sm"
                onClick={handleConnectFreelancer}
                disabled={connecting}
              >
                {connecting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-1" />}
                Connect
              </Button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (

    <div className="grid gap-5">
      {items.map((item, index) => {
        return renderItem(item, index);
      })}
    </div>
  );
};

export { Integrations, type IIntegrationsItem, type IIntegrationsItems };
