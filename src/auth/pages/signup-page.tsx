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
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
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



// ── Main component ────────────────────────────────────────────────────────────
export function SignUpPage() {
  const { register } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const paramPlan = searchParams.get('plan')?.toUpperCase() || 'STARTER';
  const paramCurrency = searchParams.get('currency')?.toUpperCase() || 'INR';
  const paramCountry = searchParams.get('country')?.toUpperCase() || (paramCurrency === 'USD' ? 'US' : 'IN');

  const [step, setStep] = useState(1);
  const [currency, setCurrency] = useState(paramCurrency);

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicateEmail, setDuplicateEmail] = useState<string | null>(null);
  const [billingMeta, setBillingMeta] = useState<RegisterMeta | null>(null);

  const form = useForm<SignupSchemaType>({
    resolver: zodResolver(getSignupSchema()),
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
      plan: (paramPlan === 'PRO' ? 'PRO' : 'STARTER') as PlanType,
      terms: false,
    },
  });

  async function onSubmit(values: SignupSchemaType) {
    try {
      setIsProcessing(true);
      setError(null);
      setDuplicateEmail(null);

      const planToSubmit = (paramPlan === 'PRO' ? 'PRO' : 'STARTER');

      await register(values.email, values.email, values.password, values.name, planToSubmit, paramCountry);
      navigate('/auth/check-email');
    } catch (err) {
      console.error('Registration error:', err);
      if ((err as { status?: number }).status === 409) {
        const email = values.email.trim();
        setDuplicateEmail(email);
        setError('This email is already registered. Sign in to continue with that account.');
        return;
      }

      setError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred during registration. Please try again.',
      );
    } finally {
      setIsProcessing(false);
    }
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

        {duplicateEmail && (
          <div className="grid gap-2 sm:grid-cols-2">
            <Button asChild type="button" variant="outline" className="w-full">
              <Link to={`/auth/signin?email=${encodeURIComponent(duplicateEmail)}`}>
                Sign in instead
              </Link>
            </Button>
            <Button asChild type="button" variant="ghost" className="w-full">
              <Link to="/auth/reset-password">Forgot password?</Link>
            </Button>
          </div>
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
        {/*   <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-4">
          <CreditCard className="h-3.5 w-3.5 shrink-0" />
          A card mandate via Razorpay is required to start your trial. You
          won't be charged until your trial ends.
        </p> */}

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
            'Create Account'
          )}
        </Button>

        <div className="text-center text-sm text-muted-foreground mt-4">
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
