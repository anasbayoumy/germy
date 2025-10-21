export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    position?: string;
    department?: string;
    hireDate?: Date;
    salary?: number;
    profilePhotoUrl?: string;
    role: 'platform_admin' | 'company_super_admin' | 'admin' | 'user';
    isActive: boolean;
    isVerified: boolean;
    lastLogin?: Date;
    companyId: string;
    companyName: string;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface UserPreferences {
    id: string;
    userId: string;
    theme: 'light' | 'dark' | 'auto';
    language: string;
    timezone: string;
    dateFormat: string;
    timeFormat: '12h' | '24h';
    notifications: Record<string, any>;
    privacy: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface UserSettings {
    id: string;
    userId: string;
    companyId: string;
    workHoursStart: string;
    workHoursEnd: string;
    workDays: number[];
    breakDuration: number;
    overtimeEnabled: boolean;
    remoteWorkEnabled: boolean;
    attendanceReminders: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface UserActivity {
    id: string;
    userId: string;
    companyId: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    createdAt: Date;
  }
  
  export interface CreateUserData {
    firstName: string;
    lastName: string;
    phone?: string;
    position?: string;
    department?: string;
    hireDate?: Date;
    salary?: number;
    profilePhotoUrl?: string;
    isActive?: boolean;
  }
  
  export interface UpdateUserData {
    firstName?: string;
    lastName?: string;
    phone?: string;
    position?: string;
    department?: string;
    hireDate?: Date;
    salary?: number;
    profilePhotoUrl?: string;
    isActive?: boolean;
  }
  
  export interface GetUsersOptions {
    page: number;
    limit: number;
    search?: string;
    role?: string;
    isActive?: boolean;
    companyId?: string;
  }
  
  export interface UserSearchResult {
    users: User[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }