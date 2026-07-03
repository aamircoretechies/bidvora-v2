import { z } from 'zod';

export const PLAN_OPTIONS = ['STARTER', 'PRO'] as const;
export type PlanType = (typeof PLAN_OPTIONS)[number];

export const getSignupSchema = () => {
  return z.object({
    email: z
      .string()
      .email({ message: 'Please enter a valid email address.' })
      .min(1, { message: 'Email is required.' }),
    password: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters.' })
      .regex(/[A-Z]/, {
        message: 'Password must contain at least one uppercase letter.',
      })
      .regex(/[0-9]/, {
        message: 'Password must contain at least one number.',
      }),
    name: z
      .string()
      .min(1, { message: 'Full name is required.' })
      .max(100, { message: 'Name must be 100 characters or fewer.' }),
    plan: z.enum(PLAN_OPTIONS, {
      required_error: 'Please select a plan.',
    }),
    confirmPassword: z
      .string()
      .min(1, { message: 'Please confirm your password.' }),
    terms: z.boolean().refine((val) => val === true, {
      message: 'You must agree to the terms and conditions.',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ['confirmPassword'],
  });
};

export type SignupSchemaType = z.infer<ReturnType<typeof getSignupSchema>>;
