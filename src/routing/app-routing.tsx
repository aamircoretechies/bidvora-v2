import { useEffect, useState } from 'react';
import { useAuth } from '@/auth/context/auth-context';
import { Navigate, useLocation } from 'react-router';
import { useLoadingBar } from 'react-top-loading-bar';
import { ScreenLoader } from '@/components/common/screen-loader';
import { AppRoutingSetup } from './app-routing-setup';

const isEmailVerificationRoute = (path: string): boolean =>
  path === '/auth/check-email' ||
  path === '/auth/signin' ||
  path === '/auth/signup' ||
  path === '/auth/classic/signin' ||
  path === '/auth/classic/signup' ||
  path.startsWith('/auth/verify-email') ||
  path.startsWith('/auth/classic/verify-email') ||
  path.startsWith('/verify-email');

const isBillingFlowRoute = (path: string): boolean =>
  isEmailVerificationRoute(path) ||
  path === '/auth/signin' ||
  path === '/auth/signup' ||
  path === '/auth/classic/signin' ||
  path === '/auth/classic/signup' ||
  path === '/auth/checkout-review' ||
  path === '/auth/billing-pending' ||
  path === '/auth/register/billing/callback' ||
  path === '/auth/classic/checkout-review' ||
  path === '/auth/classic/billing-pending' ||
  path === '/auth/classic/register/billing/callback';

export function AppRouting() {
  const { start, complete } = useLoadingBar({
    color: 'var(--color-primary)',
    shadow: false,
    waitingTime: 400,
    transitionTime: 200,
    height: 2,
  });

  const { auth, user, loading, verify, setLoading } = useAuth();
  const [previousLocation, setPreviousLocation] = useState('');
  const [firstLoad, setFirstLoad] = useState(true);
  const location = useLocation();
  const path = location.pathname.trim();

  useEffect(() => {
    if (firstLoad) {
      verify().finally(() => {
        setLoading(false);
        setFirstLoad(false);
      });
    }
  });

  useEffect(() => {
    if (!firstLoad) {
      start('static');
      verify()
        .catch(() => {
          throw new Error('User verify request failed!');
        })
        .finally(() => {
          setPreviousLocation(path);
          complete();
          if (path === previousLocation) {
            setPreviousLocation('');
          }
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  useEffect(() => {
    if (!CSS.escape(window.location.hash)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [previousLocation]);

  if (loading) {
    return <ScreenLoader />;
  }

  const hasVerifiedEmail =
    user?.emailVerified === true || user?.email_verified === true;
  const mustVerifyEmail = Boolean(
    auth?.access_token &&
    (!user || user.status === 'PENDING_VERIFICATION' || !hasVerifiedEmail),
  );

  if (mustVerifyEmail && !isEmailVerificationRoute(path)) {
    return <Navigate to="/auth/check-email" replace />;
  }

  const mustCompleteBilling = Boolean(
    auth?.access_token && hasVerifiedEmail && user?.billingPending,
  );

  if (mustCompleteBilling && !isBillingFlowRoute(path)) {
    return <Navigate to="/auth/checkout-review" replace />;
  }

  return <AppRoutingSetup />;
}
