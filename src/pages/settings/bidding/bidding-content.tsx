import { ApiKeys, BiddingFilters, ExecutionLimits } from './components';
import { Button } from '@/components/ui/button';
import { Save, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { settingsService, BotConfig, AuthConfig } from '@/services/settings.service';
import { toast } from 'sonner';

export function BiddingContent() {
  const [data, setData] = useState<Partial<BotConfig & AuthConfig>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsService.getSettings();
      if (response.success) {
        setData({
          ...response.data.authConfig,
          ...response.data.botConfig
        });
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // Exclude tokens and readonly fields from the payload
      const {
        accessToken,
        refreshToken,
        expiresAt,
        isFreelancerConnected,
        key,
        id,
        ...payload
      } = data as any;

      const response = await settingsService.updateSettings(payload);
      if (response.success) {
        toast.success('Settings updated successfully');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-7.5 items-stretch">
      <div className="col-span-2 lg:col-span-1 ">
        <ApiKeys data={data} onChange={handleChange} />
      </div>
      <div className="col-span-2 lg:col-span-1 ">
        <ExecutionLimits data={data} onChange={handleChange} />
      </div>
      <div className="col-span-2">
        <BiddingFilters data={data} onChange={handleChange} />
      </div>
      <div className="col-span-2">
        <div className="flex justify-end">
          <Button variant="mono" size="lg" className="gap-2 w-full md:w-auto" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save Configuration
          </Button>
        </div>
      </div>

    </div>
  );
}
