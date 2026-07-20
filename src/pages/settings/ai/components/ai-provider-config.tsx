'use client';

import { useEffect, useState } from 'react';
import { Loader2, RefreshCw, Save, Lock } from 'lucide-react';
import { RiCheckboxCircleFill, RiCloseCircleFill } from '@remixicon/react';
import { toast } from 'sonner';
import { useApiSettings } from '@/hooks/use-api-settings';
import type { UpdateSettingsPayload } from '@/services/settings.service';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const AiProviderConfig = () => {
  const {
    settings,
    isLoading,
    loadError,
    refetch,
    updateSettings,
    isSaving,
  } = useApiSettings();

  const [llmModel, setLlmModel] = useState('gemini-pro');
  const [aiApiKey, setAiApiKey] = useState('');
  const [error, setError] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (!settings || isDirty) return;

    const model = settings.botConfig.llmModel || 'gemini-pro';
    setLlmModel(model);
    setAiApiKey('');
  }, [settings, isDirty]);

  const handleKeyChange = (val: string) => {
    setAiApiKey(val);
    setIsDirty(true);
    let newModel = llmModel;
    if (val.startsWith('sk-')) newModel = 'gpt-5.5';
    else if (val.startsWith('AIza')) newModel = 'gemini-pro';
    else if (val.startsWith('nvapi-')) newModel = 'nvidia-nemotron';

    if (newModel !== llmModel) {
      setLlmModel(newModel);
    }
  };

  const handleModelChange = (val: string) => {
    setLlmModel(val);
    setIsDirty(true);
  };

  useEffect(() => {
    if (!aiApiKey) {
      setError('');
      return;
    }
    if (llmModel === 'gpt-5.5' && !aiApiKey.startsWith('sk-')) {
      setError('GPT-5.5 API Key should start with "sk-"');
    } else if (llmModel === 'gemini-pro' && !aiApiKey.startsWith('AIza')) {
      setError('Gemini API Key should start with "AIza"');
    } else if (llmModel === 'nvidia-nemotron' && !aiApiKey.startsWith('nvapi-')) {
      setError('Nvidia Nemotron API Key should start with "nvapi-"');
    } else {
      setError('');
    }
  }, [llmModel, aiApiKey]);

  const handleSave = async () => {
    if (error) {
      toast.error('Invalid API Key for the selected model');
      return;
    }

    const payload: UpdateSettingsPayload = { llmModel };
    if (aiApiKey) {
      if (llmModel === 'gpt-5.5') payload.openaiApiKey = aiApiKey;
      if (llmModel === 'gemini-pro') payload.geminiApiKey = aiApiKey;
      if (llmModel === 'nvidia-nemotron') payload.nvidiaApiKey = aiApiKey;
    }

    try {
      const response = await updateSettings(payload);
      setIsDirty(false);
      setAiApiKey('');
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
                'AI Provider configured successfully'}
            </AlertTitle>
          </Alert>
        ),
        { position: 'top-center' },
      );
    } catch (err) {
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
              {err instanceof Error
                ? err.message
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
      <div className="flex min-h-[200px] items-center justify-center">
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

  const hasKey = 
    (llmModel === 'gpt-5.5' && settings.secrets.hasOpenaiApiKey) ||
    (llmModel === 'gemini-pro' && settings.secrets.hasGeminiApiKey) ||
    (llmModel === 'nvidia-nemotron' && settings.secrets.hasNvidiaApiKey);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-row items-center gap-2 rounded-t-xl bg-transparent px-5 py-3">
        <CardTitle className="text-base font-semibold text-foreground">
          AI Provider Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-6 p-5">
        <div className="grid gap-1.5">
          <Label className="text-sm font-semibold text-foreground">AI Model</Label>
          <Select value={llmModel} onValueChange={handleModelChange} disabled={isSaving}>
            <SelectTrigger>
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
              <SelectItem value="gpt-5.5">GPT-5.5</SelectItem>
              <SelectItem value="nvidia-nemotron">Nvidia Nemotron</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1.5">
          <Label className="text-sm font-semibold text-foreground">API Key</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              type="password"
              value={aiApiKey}
              onChange={e => handleKeyChange(e.target.value)}
              disabled={isSaving}
              placeholder={hasKey ? '•••••••••••••••• (Saved)' : 'Enter your AI API Key'}
              className="pl-9 font-mono text-sm"
            />
          </div>
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          {!error && (
            <p className="text-xs text-secondary-foreground mt-1">
              {llmModel === 'gpt-5.5' && 'Expects a key starting with "sk-"'}
              {llmModel === 'gemini-pro' && 'Expects a key starting with "AIza"'}
              {llmModel === 'nvidia-nemotron' && 'Expects a key starting with "nvapi-"'}
            </p>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end border-0 p-5 pt-0">
        <Button
          variant="primary"
          size="lg"
          className="w-full gap-2"
          onClick={handleSave}
          disabled={isSaving || !!error || !isDirty}
        >
          {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save AI Provider
        </Button>
      </CardFooter>
    </Card>
  );
};

export { AiProviderConfig };
