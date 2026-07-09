import { PropsWithChildren, useEffect, useState } from 'react';
import { SupabaseAdapter } from '@/auth/adapters/supabase-adapter';
import { AuthContext } from '@/auth/context/auth-context';
import * as authHelper from '@/auth/lib/helpers';
import { AuthModel, RegisterMeta, UserModel } from '@/auth/lib/models';

// Define the Supabase Auth Provider
export function AuthProvider({ children }: PropsWithChildren) {
  const [loading, setLoading] = useState(true);
  const [auth, setAuth] = useState<AuthModel | undefined>(authHelper.getAuth());
  const [currentUser, setCurrentUser] = useState<UserModel | undefined>();
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is admin
  useEffect(() => {
    setIsAdmin(currentUser?.is_admin === true);
  }, [currentUser]);

  const verify = async () => {
    if (auth) {
      try {
        const user = await getUser();
        setCurrentUser(user || undefined);
      } catch {
        saveAuth(undefined);
        setCurrentUser(undefined);
      }
    }
  };

  const saveAuth = (auth: AuthModel | undefined) => {
    setAuth(auth);
    if (auth) {
      authHelper.setAuth(auth);
    } else {
      authHelper.removeAuth();
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const auth = await SupabaseAdapter.login(email, password);
      saveAuth(auth);
      const user = await getUser();
      setCurrentUser(user || undefined);
    } catch (error) {
      saveAuth(undefined);
      throw error;
    }
  };

  const register = async (
    email: string,
    confirmEmail: string,
    password: string,
    name: string,
    plan: string,
    country: string,
    idempotencyKey?: string,
  ): Promise<RegisterMeta> => {
    try {
      const result = await SupabaseAdapter.register(
        email,
        confirmEmail,
        password,
        name,
        plan,
        country,
        idempotencyKey,
      );
      saveAuth({
        access_token: result.access_token,
        refresh_token: result.refresh_token,
      });
      const user = await getUser();
      setCurrentUser(user || undefined);
      return result.meta;
    } catch (error) {
      saveAuth(undefined);
      throw error;
    }
  };

  const startCheckout = async (idempotencyKey?: string): Promise<RegisterMeta> => {
    return await SupabaseAdapter.startCheckout(idempotencyKey);
  };

  const verifyEmail = async (token: string): Promise<void> => {
    const user = {
      ...(await SupabaseAdapter.verifyEmail(token)),
      email_verified: true,
      emailVerified: true,
      status: 'TRIAL' as const,
    };
    localStorage.setItem('auth_user', JSON.stringify(user));
    setCurrentUser(user);
  };

  const confirmBilling = async (subscriptionId: string, idempotencyKey?: string) => {
    const user = await SupabaseAdapter.confirmBilling(subscriptionId, idempotencyKey);
    setCurrentUser(user);
    return user;
  };

  const requestPasswordReset = async (email: string) => {
    await SupabaseAdapter.requestPasswordReset(email);
  };

  const resetPassword = async (
    password: string,
    password_confirmation: string,
  ) => {
    await SupabaseAdapter.resetPassword(password, password_confirmation);
  };

  const resendVerificationEmail = async () => {
    await SupabaseAdapter.resendVerificationEmail();
  };

  const getUser = async () => {
    return await SupabaseAdapter.getCurrentUser();
  };

  const updateProfile = async (userData: Partial<UserModel>) => {
    return await SupabaseAdapter.updateUserProfile(userData);
  };

  const logout = () => {
    SupabaseAdapter.logout();
    saveAuth(undefined);
    setCurrentUser(undefined);
  };

  return (
    <AuthContext.Provider
      value={{
        loading,
        setLoading,
        auth,
        saveAuth,
        user: currentUser,
        setUser: setCurrentUser,
        login,
        register,
        startCheckout,
        verifyEmail,
        confirmBilling,
        requestPasswordReset,
        resetPassword,
        resendVerificationEmail,
        getUser,
        updateProfile,
        logout,
        verify,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
