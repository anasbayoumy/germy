export interface Department {
    id: string;
    companyId: string;
    name: string;
    description?: string;
    parentId?: string;
    parentName?: string;
    managerId?: string;
    managerName?: string;
    color: string;
    isActive: boolean;
    memberCount: number;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface DepartmentUser {
    id: string;
    userId: string;
    departmentId: string;
    role: 'member' | 'lead' | 'manager' | 'head';
    joinedAt: Date;
    leftAt?: Date;
    isActive: boolean;
    firstName: string;
    lastName: string;
    email: string;
    position?: string;
    profilePhotoUrl?: string;
  }
  
  export interface DepartmentHierarchy extends Department {
    children: DepartmentHierarchy[];
  }
  
  export interface CreateDepartmentData {
    name: string;
    description?: string;
    parentId?: string;
    managerId?: string;
    color?: string;
  }
  
  export interface UpdateDepartmentData {
    name?: string;
    description?: string;
    parentId?: string;
    managerId?: string;
    color?: string;
    isActive?: boolean;
  }
  
  export interface AddDepartmentUserData {
    userId: string;
    role?: 'member' | 'lead' | 'manager' | 'head';
  }
  
  export interface DepartmentSearchResult {
    departments: Department[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }