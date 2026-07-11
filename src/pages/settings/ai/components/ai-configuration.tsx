'use client';

import { useEffect, useState } from 'react';
import { Loader2, RefreshCw, Save } from 'lucide-react';
import { RiCheckboxCircleFill, RiCloseCircleFill } from '@remixicon/react';
import { toast } from 'sonner';
import { useApiSettings } from '@/hooks/use-api-settings';
import type { UpdateSettingsPayload } from '@/services/settings.service';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface AiSettingsForm {
  systemPrompt: string;
  portfolioItems: string;
  autoReplyDelay: number;
}

const AiConfiguration = () => {
  const {
    settings,
    isLoading,
    loadError,
    refetch,
    updateSettings,
    isSaving,
  } = useApiSettings();
  const [form, setForm] = useState<AiSettingsForm>({
    systemPrompt: '',
    portfolioItems: '',
    autoReplyDelay: 0,
  });
  const [dirtyFields, setDirtyFields] = useState<Set<keyof AiSettingsForm>>(
    new Set(),
  );

  useEffect(() => {
    if (!settings || dirtyFields.size > 0) return;

    setForm({
      systemPrompt: settings.botConfig.systemPrompt ?? '',
      portfolioItems: settings.botConfig.portfolioItems ?? '',
      autoReplyDelay: settings.botConfig.autoReplyDelay ?? 0,
    });
  }, [dirtyFields.size, settings]);

  const updateField = <Field extends keyof AiSettingsForm>(
    field: Field,
    value: AiSettingsForm[Field],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
    setDirtyFields((current) => {
      const next = new Set(current);
      next.add(field);
      return next;
    });
  };

  const handleSave = async () => {
    if (dirtyFields.size === 0) {
      toast.info('No AI configuration changes to save');
      return;
    }

    const payload: UpdateSettingsPayload = {};
    dirtyFields.forEach((field) => {
      Object.assign(payload, { [field]: form[field] });
    });

    try {
      const response = await updateSettings(payload);
      setDirtyFields(new Set());
      toast.custom(
        (toastId) => (
          <Alert
            variant="mono"
            icon="success"
            close={false}
            onClose={() => toast.dismiss(toastId)}
          >
            <AlertIcon><RiCheckboxCircleFill /></AlertIcon>
            <AlertTitle>
              {(response.meta?.message as string | undefined) ||
                'Configuration saved successfully'}
            </AlertTitle>
          </Alert>
        ),
        { position: 'top-center' },
      );
    } catch (error) {
      toast.custom(
        (toastId) => (
          <Alert
            variant="mono"
            icon="destructive"
            close={false}
            onClose={() => toast.dismiss(toastId)}
          >
            <AlertIcon><RiCloseCircleFill /></AlertIcon>
            <AlertTitle>
              {error instanceof Error
                ? error.message
                : 'Failed to save configuration'}
            </AlertTitle>
          </Alert>
        ),
        { position: 'top-center' },
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
      <Card className="h-full">
        <CardContent className="p-5">
          <Alert variant="destructive" appearance="light">
            <AlertIcon><RiCloseCircleFill /></AlertIcon>
            <AlertTitle>
              {loadError instanceof Error
                ? loadError.message
                : 'Failed to load AI configuration'}
            </AlertTitle>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw />
              Try again
            </Button>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-row items-center gap-2 rounded-t-xl bg-transparent px-5 py-3">
        <CardTitle className="text-base font-semibold text-foreground">
          AI Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-6 p-5">
        <div className="grid gap-1.5">
          <Label htmlFor="system-prompt" className="text-sm font-semibold text-foreground">
            System Prompt{' '}
            <span className="font-normal text-destructive">Important:</span>
            <span className="ml-1 text-xs font-normal text-secondary-foreground">
              Only provide instructions to write a good copy.
            </span>
          </Label>
          <Textarea
            id="system-prompt"
            value={form.systemPrompt}
            onChange={(event) => updateField('systemPrompt', event.target.value)}
            disabled={isSaving}
            placeholder="Core Techies – Structured Technical Snapshot Bid..."
            rows={8}
            className="resize-none font-mono text-sm"
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="portfolio-items" className="text-sm font-semibold text-foreground">
            Portfolio / Experience
          </Label>
          <p className="text-xs text-secondary-foreground">
            List your past work, skills, or links here. The AI will use this to write the proposal.
          </p>
          <Textarea
            id="portfolio-items"
            value={form.portfolioItems}
            onChange={(event) => updateField('portfolioItems', event.target.value)}
            disabled={isSaving}
            placeholder="List your past work, skills, or links here..."
            rows={5}
            className="resize-none font-mono text-sm"
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="auto-reply-delay" className="text-sm font-semibold text-foreground">
            Auto-Reply Random Delay (Seconds) for Chat Agent
          </Label>
          <Input
            id="auto-reply-delay"
            type="number"
            min={0}
            value={form.autoReplyDelay}
            onChange={(event) =>
              updateField('autoReplyDelay', Math.max(0, Number(event.target.value) || 0))
            }
            disabled={isSaving}
            className="w-full text-sm md:w-40"
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-end border-0 p-5 pt-0">
        <Button
          variant="primary"
          size="lg"
          className="w-full gap-2"
          onClick={handleSave}
          disabled={isSaving || dirtyFields.size === 0}
        >
          {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save Configuration
        </Button>
      </CardFooter>
    </Card>
  );
};

export { AiConfiguration };
