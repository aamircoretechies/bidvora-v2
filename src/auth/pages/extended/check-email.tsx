import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toAbsoluteUrl } from '@/lib/helpers';
import { useAuth } from '@/auth/context/auth-context';
import { Loader2 } from 'lucide-react';

const CheckEmail = () => {
  const { user, resendVerificationEmail } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleResend = async () => {
    try {
      setIsResending(true);
      setMessage(null);
      await resendVerificationEmail();
      setMessage('Verification email sent.');
    } catch (error: any) {
      setMessage(error.message || 'Failed to resend email.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <>
      <div className="flex justify-center py-10">
        <img
          src={toAbsoluteUrl('/media/illustrations/30.svg')}
          className="dark:hidden max-h-[130px]"
          alt=""
        />
        <img
          src={toAbsoluteUrl('/media/illustrations/30-dark.svg')}
          className="light:hidden max-h-[130px]"
          alt=""
        />
      </div>

      <h3 className="text-lg font-medium text-mono text-center mb-3">
        Check your email
      </h3>
      <div className="text-sm text-center text-secondary-foreground mb-7.5">
        Please click the link sent to your email&nbsp;
        <span className="text-sm text-mono font-semibold">
          {user?.email || 'your email'}
        </span>
        <br />
        to verify your account. Check spam box as well. Thank you
      </div>

     {/*  <div className="flex justify-center mb-5">
        <Link to="/" className="btn btn-muted flex justify-center">
          Back to Home
        </Link>
      </div> */}

      <div className="flex flex-col items-center justify-center gap-2">
        <div className="flex items-center gap-1">
          <span className="text-sm text-secondary-foreground">
            Didn’t receive an email?
          </span>
          <button
            onClick={handleResend}
            disabled={isResending}
            className="text-sm font-semibold text-primary hover:underline cursor-pointer disabled:opacity-50 flex items-center gap-1"
          >
            {isResending && <Loader2 className="h-3 w-3 animate-spin" />}
            Resend
          </button>
        </div>
        {message && (
          <span className="text-xs text-muted-foreground">{message}</span>
        )}
      </div>
    </>
  );
};

export { CheckEmail };
