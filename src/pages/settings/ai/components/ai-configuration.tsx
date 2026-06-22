'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Save, Loader2 } from 'lucide-react';
import { settingsService } from '@/services/settings.service';
import { toast } from 'sonner';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { RiCheckboxCircleFill, RiCloseCircleFill } from '@remixicon/react';

const AiConfiguration = () => {
  const [systemPrompt, setSystemPrompt] = useState('');
  const [portfolioItems, setPortfolioItems] = useState('');
  const [autoReplyDelay, setAutoReplyDelay] = useState(10);
  const [fullConfig, setFullConfig] = useState<any>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await settingsService.getSettings();
        if (response.data?.botConfig) {
          const config = response.data.botConfig;
          setFullConfig({ ...response.data.authConfig, ...response.data.botConfig });
          setSystemPrompt(config.systemPrompt || '');
          setPortfolioItems(config.portfolioItems || '');
          setAutoReplyDelay(config.autoReplyDelay ?? 10);
        }
      } catch (err) {
        toast.error('Failed to load AI configuration');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const {
        accessToken,
        refreshToken,
        expiresAt,
        isFreelancerConnected,
        key,
        id,
        ...payload
      } = {
        ...fullConfig,
        systemPrompt,
        portfolioItems,
        autoReplyDelay,
      };

      await settingsService.updateSettings(payload);

      toast.custom(
        (t) => (
          <Alert variant="mono" icon="success" close={false} onClose={() => toast.dismiss(t)}>
            <AlertIcon><RiCheckboxCircleFill /></AlertIcon>
            <AlertTitle>Configuration saved successfully</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' }
      );
    } catch (err: any) {
      toast.custom(
        (t) => (
          <Alert variant="mono" icon="destructive" close={false} onClose={() => toast.dismiss(t)}>
            <AlertIcon><RiCloseCircleFill /></AlertIcon>
            <AlertTitle>{err.message || 'Failed to save configuration'}</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' }
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="bg-transparent rounded-t-xl px-5 py-3 flex-row items-center gap-2">
        <CardTitle className="text-primary-foreground font-semibold text-base">AI Configuration</CardTitle>
      </CardHeader>
      <CardContent className="p-5 flex flex-col gap-6 flex-1">
        {/* System Prompt */}
        <div className="grid gap-1.5">
          <Label className="text-sm font-semibold text-foreground">
            System Prompt{' '}
            <span className="text-destructive font-normal">Important:</span>
            <span className="text-secondary-foreground font-normal text-xs ml-1">
              Only provide instructions to write a good copy.
            </span>
          </Label>
          <Textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            disabled={isLoading}
            placeholder="Core Techies – Structured Technical Snapshot Bid..."
            rows={8}
            className="text-sm resize-none font-mono"
          />
        </div>

        {/* Portfolio / Experience */}
        <div className="grid gap-1.5">
          <Label className="text-sm font-semibold text-foreground">Portfolio / Experience</Label>
          <p className="text-xs text-secondary-foreground">
            List your past work, skills, or links here. The AI will use this to write the proposal.
          </p>
          <Textarea
            value={portfolioItems}
            onChange={(e) => setPortfolioItems(e.target.value)}
            disabled={isLoading}
            placeholder="List your past work, skills, or links here..."
            rows={5}
            className="text-sm resize-none font-mono"
          />
        </div>

        {/* Auto-Reply Delay */}
        <div className="grid gap-1.5">
          <Label className="text-sm font-semibold text-foreground">
            Auto-Reply Random Delay (Seconds) for Chat Agent
          </Label>
          <Input
            type="number"
            value={autoReplyDelay}
            onChange={(e) => setAutoReplyDelay(Number(e.target.value))}
            disabled={isLoading}
            className="text-sm w-full md:w-40"
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-end p-5 pt-0 border-0">
        <Button
          variant="primary"
          size="lg"
          className="gap-2 w-full"
          onClick={handleSave}
          disabled={isLoading || isSaving}
        >
          {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save Configuration
        </Button>
      </CardFooter>
    </Card>
  );
};

export { AiConfiguration };
