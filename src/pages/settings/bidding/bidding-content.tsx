import { useEffect, useState } from 'react';
import { AlertCircle, Loader2, RefreshCw, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useApiSettings } from '@/hooks/use-api-settings';
import type {
  AuthConfig,
  BotConfig,
  UpdateSettingsPayload,
} from '@/services/settings.service';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ApiKeys, BiddingFilters, ExecutionLimits } from './components';

type BiddingSettingsForm = Pick<AuthConfig, 'clientId' | 'clientSecret'> &
  Pick<
    BotConfig,
    | 'targetSkills'
    | 'blacklistKeywords'
    | 'excludedCountries'
    | 'targetCurrencies'
    | 'minBudget'
    | 'maxBudget'
    | 'minHourlyRate'
    | 'maxHourlyRate'
    | 'bidFactorPercent'
    | 'hourlyPrice'
    | 'dailyBidLimit'
    | 'maxBidsPerCycle'
    | 'maxExistingBids'
  >;

export function BiddingContent() {
  const {
    settings,
    isLoading,
    loadError,
    refetch,
    updateSettings,
    isSaving,
  } = useApiSettings();
  const [data, setData] = useState<Partial<BiddingSettingsForm>>({});
  const [dirtyFields, setDirtyFields] = useState<Set<keyof BiddingSettingsForm>>(
    new Set(),
  );

  useEffect(() => {
    if (!settings || dirtyFields.size > 0) return;

    const { authConfig, botConfig } = settings;
    setData({
      clientId: authConfig.clientId,
      clientSecret: authConfig.clientSecret,
      targetSkills: botConfig.targetSkills,
      blacklistKeywords: botConfig.blacklistKeywords,
      excludedCountries: botConfig.excludedCountries,
      targetCurrencies: botConfig.targetCurrencies,
      minBudget: botConfig.minBudget,
      maxBudget: botConfig.maxBudget,
      minHourlyRate: botConfig.minHourlyRate,
      maxHourlyRate: botConfig.maxHourlyRate,
      bidFactorPercent: botConfig.bidFactorPercent,
      hourlyPrice: botConfig.hourlyPrice,
      dailyBidLimit: botConfig.dailyBidLimit,
      maxBidsPerCycle: botConfig.maxBidsPerCycle,
      maxExistingBids: botConfig.maxExistingBids,
    });
  }, [dirtyFields.size, settings]);

  const handleChange = (field: string, value: unknown) => {
    const typedField = field as keyof BiddingSettingsForm;
    setData((current) => ({ ...current, [typedField]: value }));
    setDirtyFields((current) => {
      const next = new Set(current);
      next.add(typedField);
      return next;
    });
  };

  const handleSave = async () => {
    if (dirtyFields.size === 0) {
      toast.info('No configuration changes to save');
      return;
    }

    const payload: UpdateSettingsPayload = {};
    dirtyFields.forEach((field) => {
      const value = data[field];
      if (value !== undefined) Object.assign(payload, { [field]: value });
    });

    try {
      await updateSettings(payload);
      setDirtyFields(new Set());
      toast.success('Settings updated successfully');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to save settings',
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (loadError || !settings) {
    return (
      <Alert variant="destructive" appearance="light">
        <AlertIcon><AlertCircle /></AlertIcon>
        <AlertTitle>
          {loadError instanceof Error
            ? loadError.message
            : 'Failed to load bidding settings'}
        </AlertTitle>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw />
          Try again
        </Button>
      </Alert>
    );
  }

  return (
    <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-2 lg:gap-7.5">
      <div className="col-span-2 lg:col-span-1">
        <ApiKeys data={data} onChange={handleChange} />
      </div>
      <div className="col-span-2 lg:col-span-1">
        <ExecutionLimits data={data} onChange={handleChange} />
      </div>
      <div className="col-span-2">
        <BiddingFilters data={data} onChange={handleChange} />
      </div>
      <div className="col-span-2 flex justify-end">
        <Button
          variant="mono"
          size="lg"
          className="w-full gap-2 md:w-auto"
          onClick={handleSave}
          disabled={isSaving || dirtyFields.size === 0}
        >
          {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save Configuration
        </Button>
      </div>
    </div>
  );
}
