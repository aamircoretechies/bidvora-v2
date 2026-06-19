import { useState, useEffect } from 'react';
import { settingsService } from '@/services/settings.service';
import { Integrations } from './integrations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function OnboardingFlow({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [fullData, setFullData] = useState<any>({});

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await settingsService.getSettings();
      if (response.success) {
         setFullData({
           ...response.data.authConfig,
           ...response.data.botConfig
         });
         
         if (response.data.authConfig.clientId && response.data.authConfig.clientId !== 'my-client-id') {
           setClientId(response.data.authConfig.clientId);
           // If we have a valid client ID, we can skip directly to step 2.
           setStep(2);
         }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveKeys = async () => {
    if (!clientId || !clientSecret) {
      toast.error('Please enter both Client ID and Client Secret');
      return;
    }
    
    setSaving(true);
    try {
      const { 
        accessToken, 
        refreshToken, 
        expiresAt, 
        isFreelancerConnected, 
        key, 
        id, 
        ...cleanData 
      } = fullData;

      const payload = {
        ...cleanData,
        clientId,
        clientSecret
      };
      await settingsService.updateSettings(payload);
      toast.success('API Keys saved successfully');
      setStep(2);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to save API keys');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
     return <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 max-w-2xl mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Welcome to Bidvora</h2>
        <p className="text-muted-foreground">
          {step === 1 
            ? "First, please configure your Freelancer API keys to enable automated bidding." 
            : "Now, please connect your Freelancer account to complete setup."}
        </p>
      </div>
      
      <div className="w-full max-w-md bg-card p-6 rounded-xl border border-border shadow-sm">
        {step === 1 ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Client ID</Label>
              <Input 
                value={clientId} 
                onChange={e => setClientId(e.target.value)} 
                placeholder="Enter your Freelancer Client ID" 
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label>Client Secret</Label>
              <Input 
                type="password"
                value={clientSecret} 
                onChange={e => setClientSecret(e.target.value)} 
                placeholder="Enter your Freelancer Client Secret"
                className="font-mono"
              />
            </div>
            <Button className="w-full gap-2" onClick={handleSaveKeys} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Save & Continue
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Integrations isFreelancerConnected={false} onConnected={onComplete} />
            <Button variant="ghost" className="w-full" onClick={() => setStep(1)}>
              Back to API Keys
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
