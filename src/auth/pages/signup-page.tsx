import { useState } from 'react';
import { useAuth } from '@/auth/context/auth-context';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertCircle,
  Eye,
  EyeOff,
  CreditCard,
  ExternalLink,
  Loader2,
  Rocket,
  Zap,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { generalSettings } from '@/config/general.config';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { LoaderCircleIcon } from 'lucide-react';
import {
  getSignupSchema,
  PLAN_OPTIONS,
  PlanType,
  SignupSchemaType,
} from '../forms/signup-schema';
import { RegisterMeta } from '../lib/models';

// ── Plan metadata ────────────────────────────────────────────────────────────
const PLAN_META: Record<
  PlanType,
  { label: string; description: string; Icon: React.FC<{ className?: string }> }
> = {
  STARTER: {
    label: 'Starter',
    description: 'Perfect for individuals & small teams',
    Icon: Rocket,
  },
  PRO: {
    label: 'Pro',
    description: 'Full power for large agencies',
    Icon: Zap,
  },
};

// ── Billing-pending screen ────────────────────────────────────────────────────
function BillingPendingScreen({
  meta,
  onRetry,
}: {
  meta: RegisterMeta;
  onRetry: () => void;
}) {
  const [redirecting, setRedirecting] = useState(false);

  const handleCheckout = () => {
    if (meta.checkoutUrl) {
      setRedirecting(true);
      window.open(meta.checkoutUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="flex flex-col items-center text-center gap-6 py-4 w-full">
      {/* Icon */}
      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary/10">
        <CreditCard className="w-10 h-10 text-primary" strokeWidth={1.75} />
      </div>

      {/* Heading */}
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          One last step — set up billing
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
          Your account is ready! Complete the Razorpay checkout to activate
          your trial. Your account is gated until billing is confirmed.
        </p>
      </div>

      {/* Warning if billing setup failed */}
      {meta.billingSetupFailed && (
        <Alert variant="destructive" appearance="light">
          <AlertIcon>
            <AlertCircle />
          </AlertIcon>
          <AlertTitle>
            {meta.message ??
              'Billing setup encountered an issue. You can retry checkout below.'}
          </AlertTitle>
        </Alert>
      )}

      {/* CTA */}
      {meta.checkoutUrl ? (
        <Button
          size="lg"
          className="w-full gap-2"
          onClick={handleCheckout}
          disabled={redirecting}
        >
          {redirecting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Opening checkout…
            </>
          ) : (
            <>
              <ExternalLink className="h-4 w-4" />
              Complete Razorpay Checkout
            </>
          )}
        </Button>
      ) : (
        <Button asChild size="lg" className="w-full">
          <Link to="/auth/signin">Continue to Login</Link>
        </Button>
      )}

      {/* Subtle helper */}
      <p className="text-xs text-muted-foreground">
        Already completed checkout?{' '}
        <Link
          to="/auth/signin"
          className="font-semibold text-foreground hover:text-primary underline underline-offset-2"
        >
          Sign in
        </Link>
        {' · '}
        <button
          type="button"
          onClick={onRetry}
          className="font-semibold text-foreground hover:text-primary underline underline-offset-2"
        >
          Start over
        </button>
      </p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function SignUpPage() {
  const { register } = useAuth();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [billingMeta, setBillingMeta] = useState<RegisterMeta | null>(null);

  const form = useForm<SignupSchemaType>({
    resolver: zodResolver(getSignupSchema()),
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
      plan: 'STARTER',
      terms: false,
    },
  });

  async function onSubmit(values: SignupSchemaType) {
    try {
      setIsProcessing(true);
      setError(null);

      const meta = await register(values.email, values.password, values.name, values.plan);
      setBillingMeta(meta);
    } catch (err) {
      console.error('Registration error:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred during registration. Please try again.',
      );
    } finally {
      setIsProcessing(false);
    }
  }

  /* ── Billing-pending screen ──────────────────────────────────────────────── */
  if (billingMeta) {
    return (
      <BillingPendingScreen
        meta={billingMeta}
        onRetry={() => {
          setBillingMeta(null);
          form.reset();
        }}
      />
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="block w-full space-y-5"
      >
        <div className="text-center space-y-1 pb-3">
          <h1 className="text-2xl font-semibold tracking-tight">Sign Up</h1>
          <p className="text-sm text-muted-foreground">
            Create your account to get started
          </p>
        </div>

        {error && (
          <Alert
            variant="destructive"
            appearance="light"
            onClose={() => setError(null)}
          >
            <AlertIcon>
              <AlertCircle />
            </AlertIcon>
            <AlertTitle>{error}</AlertTitle>
          </Alert>
        )}

        {/* Full name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Your full name"
                  {...field}
                  variant="lg"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Email */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  placeholder="Your email address"
                  type="email"
                  {...field}
                  variant="lg"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Password */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <div className="relative">
                <Input
                  placeholder="Create a password"
                  type={passwordVisible ? 'text' : 'password'}
                  {...field}
                  variant="lg"
                />
                <Button
                  type="button"
                  variant="ghost"
                  mode="icon"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                >
                  {passwordVisible ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Confirm password */}
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Retype Password</FormLabel>
              <div className="relative">
                <Input
                  placeholder="Confirm your password"
                  type={confirmPasswordVisible ? 'text' : 'password'}
                  {...field}
                  variant="lg"
                />
                <Button
                  type="button"
                  variant="ghost"
                  mode="icon"
                  onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                >
                  {confirmPasswordVisible ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Plan selector */}
        <FormField
          control={form.control}
          name="plan"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Plan</FormLabel>
              <div className="grid grid-cols-2 gap-2">
                {PLAN_OPTIONS.map((plan) => {
                  const { label, description, Icon } = PLAN_META[plan];
                  const selected = field.value === plan;
                  return (
                    <button
                      key={plan}
                      type="button"
                      id={`plan-${plan.toLowerCase()}`}
                      onClick={() => field.onChange(plan)}
                      className={[
                        'flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        selected
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border bg-transparent text-muted-foreground hover:border-primary/50 hover:text-foreground',
                      ].join(' ')}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-xs font-semibold leading-none">
                        {label}
                      </span>
                      <span className="text-[10px] leading-tight text-center opacity-75">
                        {description}
                      </span>
                    </button>
                  );
                })}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Terms */}
        <FormField
          control={form.control}
          name="terms"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-0.5 space-y-0 rounded-md">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-sm text-muted-foreground">
                  I agree to the and{' '}
                  <Link
                    to={generalSettings.pp}
                    target="_blank"
                    className="text-sm font-semibold text-foreground hover:text-primary"
                  >
                    Privacy Policy
                  </Link>
                </FormLabel>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        {/* Billing notice */}
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CreditCard className="h-3.5 w-3.5 shrink-0" />
          A card mandate via Razorpay is required to start your trial. You
          won't be charged until your trial ends.
        </p>

        <Button
          type="submit"
          size="lg"
          className="w-full mt-4"
          disabled={isProcessing}
        >
          {isProcessing ? (
            <span className="flex items-center gap-2">
              <LoaderCircleIcon className="h-4 w-4 animate-spin" />
              Creating account…
            </span>
          ) : (
            'Create Account & Set Up Billing'
          )}
        </Button>

        <div className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link
            to="/auth/signin"
            className="text-sm font-semibold text-foreground hover:text-primary"
          >
            Sign In
          </Link>
        </div>
      </form>
    </Form>
  );
}
