export interface Team {
    id: string;
    companyId: string;
    name: string;
    description?: string;
    managerId?: string;
    managerName?: string;
    color: string;
    isActive: boolean;
    memberCount: number;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface TeamMember {
    id: string;
    userId: string;
    teamId: string;
    roleInTeam: 'member' | 'lead' | 'manager';
    joinedAt: Date;
    leftAt?: Date;
    isActive: boolean;
    firstName: string;
    lastName: string;
    email: string;
    position?: string;
    profilePhotoUrl?: string;
  }
  
  export interface CreateTeamData {
    name: string;
    description?: string;
    managerId?: string;
    color?: string;
  }
  
  export interface UpdateTeamData {
    name?: string;
    description?: string;
    managerId?: string;
    color?: string;
    isActive?: boolean;
  }
  
  export interface AddTeamMemberData {
    userId: string;
    roleInTeam?: 'member' | 'lead' | 'manager';
  }
  
  export interface TeamSearchResult {
    teams: Team[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }