import { useState, useEffect } from 'react';
import { settingsService } from '@/services/settings.service';
import { Integrations } from './integrations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  Code2,
  ShieldCheck,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertTriangle,
  ArrowLeft,
  Brain,
} from 'lucide-react';
import { toast } from 'sonner';
import { toAbsoluteUrl } from '@/lib/helpers';

/* ─── Step definitions ──────────────────────────────────────────────── */
const STEPS = [
  {
    number: 1,
    icon: Brain,
    title: 'AI Provider Setup',
    description: 'Select and configure AI Model',
  },
  {
    number: 2,
    icon: Code2,
    title: 'Freelancer API Setup',
    description: 'Connect your Freelancer developer app',
  },
  {
    number: 3,
    icon: ShieldCheck,
    title: 'Permissions & Redirects',
    description: 'Verify scopes and callback URL',
  },
  {
    number: 4,
    icon: Lock,
    title: 'Secure Integration',
    description: 'Save credentials safely',
  },
];

/* ─── Left sidebar ───────────────────────────────────────────────────── */
function OnboardingSidebar({ step }: { step: 1 | 2 | 3 }) {
  return (
    <aside className="flex flex-col justify-between w-full lg:w-72 xl:w-80 shrink-0 bg-[#1d3a8a] rounded-2xl p-6 text-white">
      {/* Logo */}
      <div>
        <div className="flex items-center gap-2.5 mb-8">
          <img
            src={toAbsoluteUrl('/media/app/mini-logo-circle.svg')}
            className="h-8 w-8"
            alt="Bidvora"
          />
          <span className="text-xl font-bold tracking-tight">Bidvora</span>
        </div>

        {/* Step list */}
        <nav className="flex flex-col gap-1 mb-8">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = s.number === (step === 1 ? 1 : step === 2 ? 2 : 4);
            const isDone = s.number < (step === 1 ? 1 : step === 2 ? 2 : 4);
            return (
              <div key={s.number} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={[
                      'flex items-center justify-center w-9 h-9 rounded-full border-2 shrink-0 transition-colors',
                      isActive
                        ? 'bg-white border-white text-primary'
                        : isDone
                          ? 'bg-white/30 border-white/50 text-white'
                          : 'bg-white/10 border-white/30 text-white/60',
                    ].join(' ')}
                  >
                    <span className="text-sm font-bold leading-none">{s.number}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="w-px flex-1 min-h-[1.5rem] bg-white/20 my-1" />
                  )}
                </div>
                <div className="pt-1.5 pb-4">
                  <div
                    className={[
                      'flex items-center gap-2 text-sm font-semibold leading-tight',
                      isActive ? 'text-white' : 'text-white/70',
                    ].join(' ')}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {s.title}
                  </div>
                  <p className="text-xs text-white/50 mt-0.5 leading-snug">{s.description}</p>
                </div>
              </div>
            );
          })}
        </nav>

        {/* What you need to do */}
        <div>
          <p className="text-xs font-semibold text-white/60 uppercase tracking-widest mb-3">
            What you need to do
          </p>
          <ol className="flex flex-col gap-2.5 text-xs text-white/80 list-none">
            {[
              'Login to the Freelancer account that needs to be connected.',
              <>
                Open:{' '}
                <a
                  href="https://accounts.freelancer.com/settings/develop"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 text-white/90 hover:text-white"
                >
                  https://accounts.freelancer.com/settings/develop
                </a>
              </>,
              'Create a new application.',
              <>
                Use:
                <ul className="mt-1 ml-3 list-disc space-y-0.5 text-white/70">
                  <li>
                    Application Homepage:{' '}
                    <span className="text-white/60 break-all">
                      {import.meta.env.VITE_FREELANCER_REDIRECT_URI?.replace('/callback', '') ??
                        'https://your-backend.example.com'}
                    </span>
                  </li>
                  <li>
                    Redirect Endpoint:{' '}
                    <span className="text-white/60 break-all">
                      {import.meta.env.VITE_FREELANCER_REDIRECT_URI ??
                        'https://your-backend.example.com/callback'}
                    </span>
                  </li>
                </ul>
              </>,
              <>
                Advanced Scopes:
                <ul className="mt-1 ml-3 list-disc space-y-0.5 text-white/70">
                  <li>Manage your projects, bids and milestones on freelancer.com on your behalf</li>
                  <li>Send and read messages to your freelancer.com contacts</li>
                  <li>View your user and profile information</li>
                </ul>
              </>,
              'Save the app and copy the generated credentials.',
              'Share securely with backend only.',
            ].map((item, idx) => (
              <li key={idx} className="flex gap-2">
                <span className="flex-none flex items-center justify-center w-4 h-4 rounded-full bg-white/10 text-[10px] font-bold text-white/60 mt-0.5">
                  {idx + 1}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Security note */}
        {/*  <div className="mt-5 rounded-xl border border-white/20 bg-white/10 p-3 flex gap-2.5">
          <ShieldCheck className="w-4 h-4 shrink-0 text-white/70 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-white leading-tight mb-1">Security note</p>
            <p className="text-xs text-white/60 leading-snug">
              Do not store Client Secret in frontend code or commit it to GitHub. Keep credentials
              only in backend environment variables.
            </p>
          </div>
        </div> */}
      </div>

      {/* Footer */}

    </aside>
  );
}

/* ─── Step 1 — AI Setup ────────────────────────────────────────────── */
function StepAISetup({
  llmModel,
  setLlmModel,
  aiApiKey,
  setAiApiKey,
  saving,
  onNext,
}: {
  llmModel: string;
  setLlmModel: (v: string) => void;
  aiApiKey: string;
  setAiApiKey: (v: string) => void;
  saving: boolean;
  onNext: () => void;
}) {
  const [error, setError] = useState('');

  const handleKeyChange = (val: string) => {
    setAiApiKey(val);
    if (val.startsWith('sk-')) setLlmModel('gpt-5.5');
    else if (val.startsWith('AIza')) setLlmModel('gemini-pro');
    else if (val.startsWith('nvapi-')) setLlmModel('nvidia-nemotron');
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

  const handleNext = () => {
    if (!aiApiKey) {
      toast.error('Please enter an API Key');
      return;
    }
    if (error) {
      toast.error('Invalid API Key for the selected model');
      return;
    }
    onNext();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="mb-6">
        <p className="text-sm font-semibold text-primary mb-4">Step 1/4</p>
        <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
          Configure AI Provider
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-lg">
          Select the AI model you want to use and provide its API key.
        </p>
      </div>

      <div className="flex flex-col gap-5 max-w-xl">
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-foreground">AI Model</Label>
          <Select value={llmModel} onValueChange={setLlmModel}>
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

        <div className="space-y-2">
          <Label className="text-sm font-semibold text-foreground">API Key</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              type="password"
              value={aiApiKey}
              onChange={e => handleKeyChange(e.target.value)}
              placeholder="Enter your AI API Key"
              className="pl-9 font-mono text-sm"
              variant="lg"
            />
          </div>
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          <p className="text-xs text-muted-foreground mt-1">
            {llmModel === 'gpt-5.5' && 'Expects a key starting with "sk-"'}
            {llmModel === 'gemini-pro' && 'Expects a key starting with "AIza"'}
            {llmModel === 'nvidia-nemotron' && 'Expects a key starting with "nvapi-"'}
          </p>
        </div>
      </div>

      <div className="mt-8 flex items-center gap-3">
        <Button className="px-8 gap-2" size="lg" onClick={handleNext} disabled={saving || !!error}>
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          Continue
        </Button>
      </div>
    </div>
  );
}

/* ─── Step 2 — API Keys form ─────────────────────────────────────────── */
function StepApiKeys({
  clientId,
  clientSecret,
  setClientId,
  setClientSecret,
  saving,
  onSave,
  onBack,
}: {
  clientId: string;
  clientSecret: string;
  setClientId: (v: string) => void;
  setClientSecret: (v: string) => void;
  saving: boolean;
  onSave: () => void;
  onBack: () => void;
}) {
  const [showSecret, setShowSecret] = useState(false);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-6">
        <p className="text-sm font-semibold text-primary mb-4">Step 2/4</p>
        <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
          Connect your Freelancer account
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-lg">
          Provide your Freelancer Developer App credentials to enable secure automated bidding and
          backend OAuth integration.
        </p>
      </div>

      {/* Fields */}
      <div className="flex flex-col gap-5 max-w-xl">
        {/* Client ID */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-foreground">Client ID</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              value={clientId}
              onChange={e => setClientId(e.target.value)}
              placeholder="Enter your Freelancer Client ID"
              className="pl-9 font-mono text-sm"
              variant="lg"
            />
          </div>
        </div>

        {/* Client Secret */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-foreground">Client Secret</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              type={showSecret ? 'text' : 'password'}
              value={clientSecret}
              onChange={e => setClientSecret(e.target.value)}
              placeholder="Enter your Freelancer Client Secret"
              className="pl-9 pr-10 font-mono text-sm"
              variant="lg"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowSecret(v => !v)}
              tabIndex={-1}
            >
              {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Env hint box */}
        {/*  <div className="rounded-xl border border-border bg-muted/50 px-4 py-3 flex gap-3 items-start">
          <FileText className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <code className="text-xs font-mono text-primary">FREELANCER_CLIENT_ID</code>
            <code className="text-xs font-mono text-primary">FREELANCER_CLIENT_SECRET</code>
            <code className="text-xs font-mono text-primary break-all">
              FREELANCER_REDIRECT_URI=
              {import.meta.env.VITE_FREELANCER_REDIRECT_URI ??
                'https://your-backend.example.com/callback'}
            </code>
          </div>
        </div> */}

        {/* Warning */}
        <div className="mt-4 rounded-xl  bg-amber-50 dark:bg-amber-950/30 px-4 py-3 flex gap-3 items-start">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 dark:text-amber-400 leading-snug">
            <strong>Important:</strong> the Redirect Endpoint in Freelancer must exactly match the
            backend callback URL to avoid redirect URI mismatch errors.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full w-10 h-10 shrink-0"
          onClick={onBack}
          aria-label="Back"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <Button className="px-8 gap-2" size="lg" onClick={onSave} disabled={saving}>
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          Save &amp; Continue
        </Button>
      </div>
    </div>
  );
}

/* ─── Step 3 — Connect OAuth ─────────────────────────────────────────── */
function StepConnect({
  onComplete,
  onBack,
}: {
  onComplete: () => void;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-6">
        <p className="text-sm font-semibold text-primary mb-4">Step 4/4</p>
        <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
          Authorize Freelancer OAuth
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-lg">
          Click <strong>Connect</strong> below to open the Freelancer authorization page and grant
          Bidvora access to your account.
        </p>
      </div>

      <div className="max-w-xl mt-4 mb-4">
        <div className="mb-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-800 dark:text-amber-400">
          <strong>Important:</strong> Please ensure you log into Freelancer using the exact same account that generated the API keys.
        </div>
        <Integrations isFreelancerConnected={false} onConnected={onComplete} />
      </div>

      {/* Actions */}
      <div className="mt-8 flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full w-10 h-10 shrink-0"
          onClick={onBack}
          aria-label="Back"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <Button variant="ghost" onClick={onBack} className="text-sm text-muted-foreground">
          Back to API Keys
        </Button>
      </div>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────────── */
export function OnboardingFlow({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [llmModel, setLlmModel] = useState('gemini-pro');
  const [aiApiKey, setAiApiKey] = useState('');

  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  // Listen for the OAuth result — handles both popup (postMessage)
  // and new-tab (BroadcastChannel) scenarios.
  useEffect(() => {
    const OAUTH_CHANNEL = 'bidvora_freelancer_oauth';

    // BroadcastChannel — fired when OAuth completes in a new tab
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(OAUTH_CHANNEL);
      channel.onmessage = (event) => {
        if (event.data?.type === 'FREELANCER_OAUTH_SUCCESS') {
          window.location.reload();
        }
        if (event.data?.type === 'FREELANCER_OAUTH_ERROR') {
          toast.error(event.data?.message || 'Freelancer connection failed. Please try again.');
        }
      };
    } catch {
      // BroadcastChannel not supported
    }

    // postMessage — fired when OAuth completes in a real popup
    const handleOAuthMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'FREELANCER_OAUTH_SUCCESS') {
        window.location.reload();
      }
      if (event.data?.type === 'FREELANCER_OAUTH_ERROR') {
        toast.error(event.data?.message || 'Freelancer connection failed. Please try again.');
      }
    };
    window.addEventListener('message', handleOAuthMessage);

    return () => {
      channel?.close();
      window.removeEventListener('message', handleOAuthMessage);
    };
  }, []);

  const loadSettings = async () => {
    try {
      const response = await settingsService.getSettings();
      if (response.success) {

        const authConfig = response.data.authConfig;
        if (authConfig.llmModel) setLlmModel(authConfig.llmModel);
        if (authConfig.llmModel === 'gpt-5.5' && authConfig.openaiApiKey) setAiApiKey(authConfig.openaiApiKey);
        if (authConfig.llmModel === 'gemini-pro' && authConfig.geminiApiKey) setAiApiKey(authConfig.geminiApiKey);
        if (authConfig.llmModel === 'nvidia-nemotron' && authConfig.nvidiaApiKey) setAiApiKey(authConfig.nvidiaApiKey);

        if (
          authConfig.clientId &&
          authConfig.clientId !== 'my-client-id'
        ) {
          setClientId(authConfig.clientId);
          setStep(3);
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
      // The API validates all BotConfig fields on every PUT, so we must
      // include safe minimum values for fields not yet configured by the user.
      const payload: any = {
        llmModel,
        clientId,
        clientSecret,
        minBudget: 1,
        maxBudget: 1,
        minHourlyRate: 1,
        maxHourlyRate: 1,
        bidFactorPercent: 1,
        hourlyPrice: 1,
        dailyBidLimit: 1,
        maxBidsPerCycle: 1,
        maxExistingBids: 1,
      };

      if (llmModel === 'gpt-5.5') payload.openaiApiKey = aiApiKey;
      if (llmModel === 'gemini-pro') payload.geminiApiKey = aiApiKey;
      if (llmModel === 'nvidia-nemotron') payload.nvidiaApiKey = aiApiKey;

      await settingsService.updateSettings(payload);
      toast.success('Settings saved successfully');
      setStep(3);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to save API keys');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    /* Outer shell — fills the page without being constrained to a tiny card */
    <div className="flex items-start justify-center min-h-[80vh] p-4 lg:p-8">
      <div className="w-full max-w-5xl flex flex-col lg:flex-row gap-6 rounded-2xl overflow-hidden shadow-lg border border-border bg-card">
        {/* ── Left sidebar ── */}
        <OnboardingSidebar step={step} />

        {/* ── Right content ── */}
        <div className="flex-1 p-6 lg:p-10 overflow-auto">
          {step === 1 && (
            <StepAISetup
              llmModel={llmModel}
              setLlmModel={setLlmModel}
              aiApiKey={aiApiKey}
              setAiApiKey={setAiApiKey}
              saving={false}
              onNext={() => setStep(2)}
            />
          )}
          {step === 2 && (
            <StepApiKeys
              clientId={clientId}
              clientSecret={clientSecret}
              setClientId={setClientId}
              setClientSecret={setClientSecret}
              saving={saving}
              onSave={handleSaveKeys}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && (
            <StepConnect onComplete={onComplete} onBack={() => setStep(2)} />
          )}
        </div>
      </div>
    </div>
  );
}
