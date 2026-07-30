import { z } from 'zod';

export const getSigninSchema = () => {
  return z.object({
    email: z
      .string()
      .email({ message: 'Please enter a valid email address.' })
      .min(1, { message: 'Email is required.' })
      .max(50, { message: 'Email must be 50 characters or fewer.' }),
    password: z
      .string()
      .min(1, { message: 'Password is required.' })
      .max(50, { message: 'Password must be 50 characters or fewer.' }),
    rememberMe: z.boolean().optional(),
  });
};

export type SigninSchemaType = z.infer<ReturnType<typeof getSigninSchema>>;
