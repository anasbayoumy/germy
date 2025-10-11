export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    errors?: Array<{
      field: string;
      message: string;
    }>;
  }
  
  export interface PaginationParams {
    page: number;
    limit: number;
  }
  
  export interface PaginationResult {
    page: number;
    limit: number;
    total: number;
    pages: number;
  }
  
  export interface SearchParams {
    search?: string;
    page?: number;
    limit?: number;
  }
  
  export interface SortParams {
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }
  
  export interface FilterParams {
    isActive?: boolean;
    role?: string;
    companyId?: string;
  }
  
  export interface AuthenticatedUser {
    userId: string;
    companyId: string;
    role: 'platform_super_admin' | 'company_super_admin' | 'company_admin' | 'employee';
  }
  
  export interface ServiceResult<T = any> {
    success: boolean;
    message: string;
    data?: T;
  }
  
  export interface UploadResult {
    success: boolean;
    message: string;
    data?: {
      filename: string;
      path: string;
      url: string;
    };
  }
  
  export interface ValidationError {
    field: string;
    message: string;
  }
  
  export interface LogContext {
    userId?: string;
    companyId?: string;
    action?: string;
    resourceType?: string;
    resourceId?: string;
    ipAddress?: string;
    userAgent?: string;
  }