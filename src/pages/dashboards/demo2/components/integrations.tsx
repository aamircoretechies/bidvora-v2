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
    const OAUTH_CHANNEL = 'bidvora_freelancer_oauth';

    const handleSuccess = () => {
      setConnected(true);
      setConnecting(false);
      if (onConnected) onConnected();
    };
    const handleError = (msg?: string) => {
      setConnecting(false);
      toast.error(msg || 'Freelancer connection failed. Please try again.');
    };

    // BroadcastChannel — new-tab OAuth flow
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(OAUTH_CHANNEL);
      channel.onmessage = (event) => {
        if (event.data?.type === 'FREELANCER_OAUTH_SUCCESS') handleSuccess();
        if (event.data?.type === 'FREELANCER_OAUTH_ERROR') handleError(event.data?.message);
      };
    } catch {
      // BroadcastChannel not supported
    }

    // postMessage — real popup OAuth flow
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'FREELANCER_OAUTH_SUCCESS') handleSuccess();
      if (event.data?.type === 'FREELANCER_OAUTH_ERROR') handleError(event.data?.message);
    };
    window.addEventListener('message', handleMessage);

    return () => {
      channel?.close();
      window.removeEventListener('message', handleMessage);
    };
  }, [onConnected]);

  const handleConnectFreelancer = async () => {
    try {
      setConnecting(true);
      const response = await freelancerService.getFreelancerAuthorizeUrl();

      if (response.success && response.data?.url) {
        const width = 600;
        const height = 700;
        const left = Math.round(window.screen.width / 2 - width / 2);
        const top = Math.round(window.screen.height / 2 - height / 2);

        const popup = window.open(
          response.data.url,
          'freelancer_oauth',
          `width=${width},height=${height},top=${top},left=${left},menubar=no,toolbar=no,location=no,status=no,scrollbars=yes,resizable=yes`,
        );

        if (!popup || popup.closed || typeof popup.closed === 'undefined') {
          // Popup was blocked — inform the user rather than silently redirecting
          toast.error('Popup was blocked. Please allow popups for this site and try again.');
        }
        // connecting spinner stays on until the parent receives the postMessage
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to get authorization URL');
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
        className="relative flex flex-col md:flex-row bg-primary/10 items-start md:items-center justify-between dark:bg-secondary-clarity rounded-xl gap-3 md:gap-2 p-4 md:p-3.5"
      >
        <div className="flex items-center gap-3.5 pr-8 md:pr-0">
          <img
            src={toAbsoluteUrl(`/media/brand-logos/${item.logo}`)}
            className="size-[34px] shrink-0"
            alt="image"
          />
          <div className="flex flex-col">
            <Link
              to="#"
              className="text-lg font-bold text-mono hover:text-primary-active leading-tight mb-0.5"
            >
              {item.title}
            </Link>
            <span className="text-sm font-medium text-secondary-foreground leading-tight">
              {item.email}
            </span>
          </div>
        </div>

        {/* Mobile Badge Container */}
        <div className="flex md:hidden ml-[48px]">
          {item.connected ? (
            <Badge size="lg" className="rounded-full" variant="success" appearance="default">
              <Check size={16} className="mr-1" /> Connected
            </Badge>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={handleConnectFreelancer}
              disabled={connecting}
            >
              {connecting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-1" />}
              Connect
            </Button>
          )}
        </div>

        {/* Desktop Actions + Mobile Settings Icon */}
        <div className="flex items-center gap-2 lg:gap-5 absolute top-3.5 right-3 md:static md:top-auto md:right-auto">
          {item.connected ? (
            <>
              {/* Badge hidden on mobile */}
              <Badge size="lg" className="rounded-full hidden md:flex" variant="success" appearance="default">
                <Check size={18} className="mr-1" /> Connected
              </Badge>
              <Button variant="ghost" mode="icon" asChild className="text-secondary-foreground size-8">
                <Link to="/settings/bidding">
                  <Settings className="size-5" />
                </Link>
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              size="sm"
              className="hidden md:flex"
              onClick={handleConnectFreelancer}
              disabled={connecting}
            >
              {connecting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-1" />}
              Connect
            </Button>
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
