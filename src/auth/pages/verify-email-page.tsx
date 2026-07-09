import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/auth/context/auth-context';
import { AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

function decodeToken(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function readRawTokenFromUrl(search: string, hash: string) {
  const rawUrlParts = [search, hash];
  const names = ['token', 'verificationToken', 'verification_token'];

  for (const rawPart of rawUrlParts) {
    for (const name of names) {
      const match = rawPart.match(new RegExp(`[?&#]${name}=([^&]*)`));
      if (match?.[1]) {
        return decodeToken(match[1]);
      }
    }
  }

  return '';
}

export function VerifyEmailPage() {
  const params = useParams();
  const pathToken = params.token || params['*'] || '';
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyEmail } = useAuth();
  const verifyEmailRef = useRef(verifyEmail);
  const activeTokenRef = useRef('');
  const token = pathToken ? decodeToken(pathToken) : readRawTokenFromUrl(location.search, location.hash);
  
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    verifyEmailRef.current = verifyEmail;
  }, [verifyEmail]);

  useEffect(() => {
    const verificationToken = token.trim();

    if (!verificationToken) {
      setStatus('error');
      setError('No verification token provided.');
      return;
    }

    if (activeTokenRef.current === verificationToken) return;
    activeTokenRef.current = verificationToken;
    setStatus('verifying');
    setError(null);

    async function performVerification() {
      try {
        await verifyEmailRef.current(verificationToken);
        if (activeTokenRef.current !== verificationToken) return;

        setStatus('success');
        setTimeout(() => {
          if (activeTokenRef.current === verificationToken) {
            navigate('/auth/checkout-review');
          }
        }, 1500);
      } catch (err) {
        if (activeTokenRef.current !== verificationToken) return;

        setStatus('error');
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to verify email. The link may have expired or is invalid.'
        );
      }
    }

    performVerification();
  }, [token, navigate, retryKey]);

  return (
    <div className="flex flex-col items-center justify-center text-center gap-6 py-4 w-full max-w-md mx-auto">
      {status === 'verifying' && (
        <>
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary/10">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              Verifying your email
            </h1>
            <p className="text-sm text-muted-foreground">
              Please wait a moment while we verify your email address.
            </p>
          </div>
        </>
      )}

      {status === 'success' && (
        <>
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              Email Verified
            </h1>
            <p className="text-sm text-muted-foreground">
              Your email has been successfully verified. Taking you to the review step...
            </p>
          </div>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-destructive/10">
            <AlertCircle className="w-10 h-10 text-destructive" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              Verification Failed
            </h1>
            <p className="text-sm text-muted-foreground">
              We couldn't verify your email address.
            </p>
          </div>
          
          {error && (
            <Alert variant="destructive" appearance="light" className="w-full text-left mt-2">
              <AlertIcon>
                <AlertCircle />
              </AlertIcon>
              <AlertTitle>{error}</AlertTitle>
            </Alert>
          )}

          <div className="w-full space-y-3 mt-4">
            <Button
              size="lg"
              className="w-full"
              onClick={() => {
                activeTokenRef.current = '';
                setRetryKey((current) => current + 1);
              }}
            >
              Try Again
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full"
              onClick={() => navigate('/auth/signin')}
            >
              Return to Login
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
