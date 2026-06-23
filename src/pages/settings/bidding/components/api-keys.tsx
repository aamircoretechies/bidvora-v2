import { useState } from 'react';
import { Eye, EyeOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { freelancerService } from '@/services/freelancer.service';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const ApiKeys = ({ data, onChange }: { data?: any, onChange?: (field: string, val: any) => void }) => {
  const [showSecret, setShowSecret] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefreshConnection = async () => {
    try {
      setRefreshing(true);
      const response = await freelancerService.getFreelancerAuthorizeUrl();

      if (response.success && response.data?.url) {
        const width = 600;
        const height = 700;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;

        const popup = window.open(
          response.data.url,
          'Reconnect Freelancer',
          `width=${width},height=${height},top=${top},left=${left},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
        );

        if (!popup || popup.closed || typeof popup.closed === 'undefined') {
          // Popup blocked — fallback to redirect
          window.location.href = response.data.url;
        }
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to get Freelancer authorization URL');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Card>
      <CardHeader className="bg-success/10 border-b border-success/30 rounded-t-xl px-5 py-3">
        <CardTitle className="text-success text-base">Freelancer API Keys</CardTitle>
      </CardHeader>
      <CardContent className="p-5 grid gap-5">
        <div className="grid gap-1.5">
          <Label className="text-sm font-medium text-secondary-foreground">Client ID</Label>
          <Input
            value={data?.clientId || ''}
            onChange={(e) => onChange?.('clientId', e.target.value)}
            className="font-mono text-sm"
          />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-sm font-medium text-secondary-foreground">Client Secret</Label>
          <div className="relative">
            <Input
              type={showSecret ? 'text' : 'password'}
              value={data?.clientSecret || ''}
              onChange={(e) => onChange?.('clientSecret', e.target.value)}
              className="font-mono text-sm pe-10"
            />
            <Button
              variant="ghost"
              mode="icon"
              size="sm"
              className="absolute end-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setShowSecret(!showSecret)}
            >
              {showSecret ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </Button>
          </div>
        </div>
        <Button
          variant="primary"
          className="w-full gap-2"
          onClick={handleRefreshConnection}
          disabled={refreshing}
        >
          {refreshing ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          Refresh Connection
        </Button>
      </CardContent>
    </Card>
  );
};

export { ApiKeys };
