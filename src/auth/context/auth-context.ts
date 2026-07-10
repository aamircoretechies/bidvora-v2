import { createContext, useContext } from 'react';
import { AuthModel, RegisterMeta, UserModel } from '@/auth/lib/models';

// Create AuthContext with types
export const AuthContext = createContext<{
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  auth?: AuthModel;
  saveAuth: (auth: AuthModel | undefined) => void;
  user?: UserModel;
  setUser: React.Dispatch<React.SetStateAction<UserModel | undefined>>;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    confirmEmail: string,
    password: string,
    name: string,
    plan: string,
    country: string,
    idempotencyKey?: string,
  ) => Promise<RegisterMeta>;
  startCheckout: (idempotencyKey?: string) => Promise<RegisterMeta>;
  verifyEmail: (token: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (
    password: string,
    password_confirmation: string,
  ) => Promise<void>;
  confirmBilling: (subscriptionId: string, idempotencyKey?: string) => Promise<UserModel>;
  updateRegisterPreferences: (payload: {
    country?: string;
    plan?: 'STARTER' | 'PRO';
  }) => Promise<UserModel>;
  resendVerificationEmail: () => Promise<void>;
  getUser: () => Promise<UserModel | null>;
  updateProfile: (userData: Partial<UserModel>) => Promise<UserModel>;
  logout: () => Promise<void>;
  verify: () => Promise<void>;
  isAdmin: boolean;
}>({
  loading: false,
  setLoading: () => {},
  saveAuth: () => {},
  setUser: () => {},
  login: async () => {},
  register: async () => ({
    billingPending: false,
    checkoutUrl: null,
    subscriptionId: null,
    billingSetupFailed: false,
    message: null,
  }),
  startCheckout: async () => ({
    billingPending: false,
    checkoutUrl: null,
    subscriptionId: null,
    billingSetupFailed: false,
    message: null,
  }),
  verifyEmail: async () => {},
  requestPasswordReset: async () => {},
  resetPassword: async () => {},
  confirmBilling: async () => ({} as UserModel),
  updateRegisterPreferences: async () => ({} as UserModel),
  resendVerificationEmail: async () => {},
  getUser: async () => null,
  updateProfile: async () => ({}) as UserModel,
  logout: async () => {},
  verify: async () => {},
  isAdmin: false,
});

// Hook definition
export function useAuth() {
  return useContext(AuthContext);
}
