export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  companyId: string;
  companyName?: string;
}

export interface Company {
  id: string;
  name: string;
  domain: string;
  industry?: string;
  companySize?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user?: User;
    company?: Company;
    token?: string;
  };
}

export interface TokenPayload {
  userId: string;
  companyId: string;
  role: string;
  iat?: number;
  exp?: number;
}

export type UserRole = 'platform_super_admin' | 'company_super_admin' | 'company_admin' | 'employee';
