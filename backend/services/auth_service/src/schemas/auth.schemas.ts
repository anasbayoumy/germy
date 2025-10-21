import { z } from 'zod';
import { PasswordPolicyService } from '../utils/password-policy';

// Custom email validation for admin/super admin roles
const validateWorkEmail = (email: string) => {
  const personalEmailDomains = [
    'gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'icloud.com',
    'aol.com', 'protonmail.com', 'yandex.com', 'mail.com', 'zoho.com',
    'live.com', 'msn.com', 'comcast.net', 'verizon.net', 'att.net'
  ];
  
  const domain = email.split('@')[1]?.toLowerCase();
  return !personalEmailDomains.includes(domain);
};

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),
});

// Platform Admin Registration Schema
export const registerPlatformAdminSchema = z.object({
  body: z.object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.string().email('Invalid email format'),
    password: z.string()
      .min(8, 'Password must be at least 8 characters')
      .refine((password) => PasswordPolicyService.meetsMinimumRequirements(password), {
        message: 'Password does not meet security requirements',
      }),
    phone: z.string().optional(),
  }),
});

// Company Super Admin Registration Schema (creates company + super admin)
export const registerCompanySuperAdminSchema = z.object({
  body: z.object({
    companyName: z.string().min(2, 'Company name must be at least 2 characters'),
    companyDomain: z.string().min(2, 'Company domain must be at least 2 characters'),
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.string()
      .email('Invalid email format')
      .refine(validateWorkEmail, {
        message: 'Admin email must be a work email address (@workaddress.whatever), not personal email (@gmail, @outlook, etc.)',
      }),
    password: z.string()
      .min(8, 'Password must be at least 8 characters')
      .refine((password) => PasswordPolicyService.meetsMinimumRequirements(password), {
        message: 'Password does not meet security requirements',
      }),
    phone: z.string().optional(),
    industry: z.string().optional(),
    companySize: z.string().optional(),
  }),
});

// Company Admin Registration Schema (creates admin in existing company)
export const registerCompanyAdminSchema = z.object({
  body: z.object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.string()
      .email('Invalid email format')
      .refine(validateWorkEmail, {
        message: 'Admin email must be a work email address (@workaddress.whatever), not personal email (@gmail, @outlook, etc.)',
      }),
    password: z.string()
      .min(8, 'Password must be at least 8 characters')
      .refine((password) => PasswordPolicyService.meetsMinimumRequirements(password), {
        message: 'Password does not meet security requirements',
      }),
    phone: z.string().optional(),
  }),
});

// User Registration Schema (creates user in existing company)
export const registerEmployeeSchema = z.object({
  body: z.object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.string().email('Invalid email format'),
    password: z.string()
      .min(8, 'Password must be at least 8 characters')
      .refine((password) => PasswordPolicyService.meetsMinimumRequirements(password), {
        message: 'Password does not meet security requirements',
      }),
    phone: z.string().optional(),
  }),
});

// Legacy register schema (for backward compatibility)
export const registerSchema = z.object({
  body: z.object({
    companyName: z.string().min(2, 'Company name must be at least 2 characters'),
    companyDomain: z.string().min(2, 'Company domain must be at least 2 characters'),
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.string().email('Invalid email format'),
    password: z.string()
      .min(8, 'Password must be at least 8 characters')
      .refine((password) => PasswordPolicyService.meetsMinimumRequirements(password), {
        message: 'Password does not meet security requirements',
      }),
    phone: z.string().optional(),
    industry: z.string().optional(),
    companySize: z.string().optional(),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Reset token is required'),
    password: z.string()
      .min(8, 'Password must be at least 8 characters')
      .refine((password) => PasswordPolicyService.meetsMinimumRequirements(password), {
        message: 'Password does not meet security requirements',
      }),
  }),
});

export const verifyTokenSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Token is required'),
  }),
});

export type LoginInput = z.infer<typeof loginSchema>['body'];
export type RegisterPlatformAdminInput = z.infer<typeof registerPlatformAdminSchema>['body'];
export type RegisterCompanySuperAdminInput = z.infer<typeof registerCompanySuperAdminSchema>['body'];
export type RegisterCompanyAdminInput = z.infer<typeof registerCompanyAdminSchema>['body'];
export type RegisterEmployeeInput = z.infer<typeof registerEmployeeSchema>['body'];
export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>['body'];
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>['body'];
export type VerifyTokenInput = z.infer<typeof verifyTokenSchema>['body'];

// Domain-based Registration Schemas
export const registerUserWithDomainSchema = z.object({
  body: z.object({
    companyDomain: z.string().min(1, 'Company domain is required'),
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    phone: z.string().optional(),
    position: z.string().optional(),
    department: z.string().optional(),
  }),
});

export const registerAdminWithDomainSchema = z.object({
  body: z.object({
    companyDomain: z.string().min(1, 'Company domain is required'),
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.string().email('Invalid email format').refine((email) => {
      const domain = email.split('@')[1];
      const personalDomains = ['gmail.com', 'outlook.com', 'yahoo.com', 'hotmail.com', 'icloud.com'];
      return !personalDomains.includes(domain);
    }, { message: 'Admin email must be a work email address (@workaddress.whatever), not personal email (@gmail, @outlook, etc.)' }),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    phone: z.string().optional(),
    position: z.string().optional(),
    department: z.string().optional(),
  }),
});

export const manualRegisterUserSchema = z.object({
  body: z.object({
    companyDomain: z.string().min(1, 'Company domain is required'),
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    phone: z.string().optional(),
    position: z.string().optional(),
    department: z.string().optional(),
    role: z.enum(['user', 'company_admin'], { message: 'Role must be either user or company_admin' }),
  }),
});

export type RegisterUserWithDomainInput = z.infer<typeof registerUserWithDomainSchema>['body'];
export type RegisterAdminWithDomainInput = z.infer<typeof registerAdminWithDomainSchema>['body'];
export type ManualRegisterUserInput = z.infer<typeof manualRegisterUserSchema>['body'];
