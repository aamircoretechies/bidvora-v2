import { RouteObject } from 'react-router-dom';
import { BrandedLayout } from './layouts/branded';
import { ClassicLayout } from './layouts/classic';
import { CallbackPage } from './pages/callback-page';
import { ChangePasswordPage } from './pages/change-password-page';
import { CheckEmail } from './pages/extended/check-email';
import { ResetPasswordChanged } from './pages/extended/reset-password-changed';
import { ResetPasswordCheckEmail } from './pages/extended/reset-password-check-email';
import { TwoFactorAuth } from './pages/extended/tfa';
import { ResetPasswordPage } from './pages/reset-password-page';
import { SignInPage } from './pages/signin-page';
import { SignUpPage } from './pages/signup-page';
import { VerifyEmailPage } from './pages/verify-email-page';
import { CheckoutReviewPage } from './pages/checkout-review-page';
import { BillingPendingPage } from './pages/billing-pending-page';

// Define the auth routes
export const authRoutes: RouteObject[] = [
  {
    path: '',
    element: <BrandedLayout />,
    children: [
      {
        path: 'signin',
        element: <SignInPage />,
      },
      {
        path: 'signup',
        element: <SignUpPage />,
      },
      {
        path: 'verify-email/:token',
        element: <VerifyEmailPage />,
      },
      {
        path: 'verify-email/*',
        element: <VerifyEmailPage />,
      },
      {
        path: 'verify-email',
        element: <VerifyEmailPage />,
      },
      {
        path: 'checkout-review',
        element: <CheckoutReviewPage />,
      },
      {
        path: 'billing-pending',
        element: <BillingPendingPage />,
      },
      {
        path: 'register/billing/callback',
        element: <BillingPendingPage />,
      },
      {
        path: 'change-password',
        element: <ChangePasswordPage />,
      },
      {
        path: 'reset-password',
        element: <ResetPasswordPage />,
      },
      {
        path: 'reset-password/:token',
        element: <ChangePasswordPage />,
      },
      /* Extended examples */
      {
        path: '2fa',
        element: <TwoFactorAuth />,
      },
      {
        path: 'check-email',
        element: <CheckEmail />,
      },
      {
        path: 'reset-password/check-email',
        element: <ResetPasswordCheckEmail />,
      },
      {
        path: 'reset-password/changed',
        element: <ResetPasswordChanged />,
      },
    ],
  },
  {
    path: '',
    element: <ClassicLayout />,
    children: [
      {
        path: 'classic/signin',
        element: <SignInPage />,
      },
      {
        path: 'classic/signup',
        element: <SignUpPage />,
      },
      {
        path: 'classic/verify-email/:token',
        element: <VerifyEmailPage />,
      },
      {
        path: 'classic/verify-email/*',
        element: <VerifyEmailPage />,
      },
      {
        path: 'classic/verify-email',
        element: <VerifyEmailPage />,
      },
      {
        path: 'classic/checkout-review',
        element: <CheckoutReviewPage />,
      },
      {
        path: 'classic/billing-pending',
        element: <BillingPendingPage />,
      },
      {
        path: 'classic/register/billing/callback',
        element: <BillingPendingPage />,
      },
      {
        path: 'classic/change-password',
        element: <ChangePasswordPage />,
      },
      {
        path: 'classic/reset-password',
        element: <ResetPasswordPage />,
      },
      {
        path: 'classic/reset-password/:token',
        element: <ChangePasswordPage />,
      },
      /* Extended examples */
      {
        path: 'classic/2fa',
        element: <TwoFactorAuth />,
      },
      {
        path: 'classic/check-email',
        element: <CheckEmail />,
      },
      {
        path: 'classic/reset-password/check-email',
        element: <ResetPasswordCheckEmail />,
      },
      {
        path: 'classic/reset-password/changed',
        element: <ResetPasswordChanged />,
      },
    ],
  },
  {
    path: 'callback',
    element: <CallbackPage />,
  },
];
