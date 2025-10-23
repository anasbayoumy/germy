import { eq, and, like, desc, count, sql } from 'drizzle-orm';
import { db } from '../config/database';
import { teams, userTeams, users } from '../db/schema';
import { logger } from '../utils/logger';

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
  roleInTeam?: string;
}

export class TeamService {
  async getTeams(companyId: string, page: number = 1, limit: number = 20, search?: string) {
    try {
      const offset = (page - 1) * limit;

      const conditions = [eq(teams.companyId, companyId)];
      
      if (search) {
        conditions.push(like(teams.name, `%${search}%`));
      }

      const baseQuery = db
        .select({
          id: teams.id,
          name: teams.name,
          description: teams.description,
          managerId: teams.managerId,
          managerName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`.as('managerName'),
          color: teams.color,
          isActive: teams.isActive,
          memberCount: count(userTeams.id).as('memberCount'),
          createdAt: teams.createdAt,
          updatedAt: teams.updatedAt,
        })
        .from(teams)
        .leftJoin(users, eq(teams.managerId, users.id))
        .leftJoin(userTeams, and(eq(userTeams.teamId, teams.id), eq(userTeams.isActive, true)))
        .where(and(...conditions))
        .groupBy(teams.id, users.firstName, users.lastName);

      const [teamsData, totalCount] = await Promise.all([
        baseQuery
          .orderBy(desc(teams.createdAt))
          .limit(limit)
          .offset(offset),
        db.select({ count: count() }).from(teams).where(eq(teams.companyId, companyId)),
      ]);

      return {
        teams: teamsData,
        pagination: {
          page,
          limit,
          total: totalCount[0].count,
          pages: Math.ceil(totalCount[0].count / limit),
        },
      };
    } catch (error) {
      logger.error('Get teams service error:', error);
      throw error;
    }
  }

  async getTeamById(teamId: string, companyId: string) {
    try {
      const team = await db
        .select({
          id: teams.id,
          name: teams.name,
          description: teams.description,
          managerId: teams.managerId,
          managerName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`.as('managerName'),
          color: teams.color,
          isActive: teams.isActive,
          createdAt: teams.createdAt,
          updatedAt: teams.updatedAt,
        })
        .from(teams)
        .leftJoin(users, eq(teams.managerId, users.id))
        .where(and(eq(teams.id, teamId), eq(teams.companyId, companyId)))
        .limit(1);

      return team[0] || null;
    } catch (error) {
      logger.error('Get team by ID service error:', error);
      throw error;
    }
  }

  async createTeam(teamData: CreateTeamData, companyId: string, createdBy: string) {
    try {
      // Check if team name already exists in company
      const existingTeam = await db
        .select()
        .from(teams)
        .where(and(eq(teams.companyId, companyId), eq(teams.name, teamData.name)))
        .limit(1);

      if (existingTeam.length > 0) {
        return {
          success: false,
          message: 'Team name already exists in this company',
        };
      }

      // Validate manager if provided
      if (teamData.managerId) {
        const manager = await db
          .select()
          .from(users)
          .where(and(eq(users.id, teamData.managerId), eq(users.companyId, companyId)))
          .limit(1);

        if (manager.length === 0) {
          return {
            success: false,
            message: 'Manager not found or not in the same company',
          };
        }
      }

      const [newTeam] = await db
        .insert(teams)
        .values({
          companyId,
          name: teamData.name,
          description: teamData.description,
          managerId: teamData.managerId,
          color: teamData.color || '#3B82F6',
        })
        .returning();

      logger.info(`Team created: ${newTeam.name} in company ${companyId} by ${createdBy}`);

      return {
        success: true,
        message: 'Team created successfully',
        data: { team: newTeam },
      };
    } catch (error) {
      logger.error('Create team service error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  async updateTeam(teamId: string, updateData: UpdateTeamData, companyId: string, updatedBy: string) {
    try {
      // Check if team exists
      const existingTeam = await this.getTeamById(teamId, companyId);
      if (!existingTeam) {
        return {
          success: false,
          message: 'Team not found',
        };
      }

      // Check if new name conflicts (if name is being updated)
      if (updateData.name && updateData.name !== existingTeam.name) {
        const conflictingTeam = await db
          .select()
          .from(teams)
          .where(and(eq(teams.companyId, companyId), eq(teams.name, updateData.name)))
          .limit(1);

        if (conflictingTeam.length > 0) {
          return {
            success: false,
            message: 'Team name already exists in this company',
          };
        }
      }

      // Validate manager if provided
      if (updateData.managerId) {
        const manager = await db
          .select()
          .from(users)
          .where(and(eq(users.id, updateData.managerId), eq(users.companyId, companyId)))
          .limit(1);

        if (manager.length === 0) {
          return {
            success: false,
            message: 'Manager not found or not in the same company',
          };
        }
      }

      const [updatedTeam] = await db
        .update(teams)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(and(eq(teams.id, teamId), eq(teams.companyId, companyId)))
        .returning();

      logger.info(`Team updated: ${teamId} by ${updatedBy}`);

      return {
        success: true,
        message: 'Team updated successfully',
        data: { team: updatedTeam },
      };
    } catch (error) {
      logger.error('Update team service error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  async deleteTeam(teamId: string, companyId: string, deletedBy: string) {
    try {
      // Check if team exists
      const existingTeam = await this.getTeamById(teamId, companyId);
      if (!existingTeam) {
        return {
          success: false,
          message: 'Team not found',
        };
      }

      // Check if team has active members
      const activeMembers = await db
        .select({ count: count() })
        .from(userTeams)
        .where(and(eq(userTeams.teamId, teamId), eq(userTeams.isActive, true)));

      if (activeMembers[0].count > 0) {
        return {
          success: false,
          message: 'Cannot delete team with active members. Please remove all members first.',
        };
      }

      // Soft delete by setting isActive to false
      const [deletedTeam] = await db
        .update(teams)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(and(eq(teams.id, teamId), eq(teams.companyId, companyId)))
        .returning();

      logger.info(`Team deleted: ${teamId} by ${deletedBy}`);

      return {
        success: true,
        message: 'Team deleted successfully',
        data: { team: deletedTeam },
      };
    } catch (error) {
      logger.error('Delete team service error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }


  async addTeamMember(teamId: string, memberData: AddTeamMemberData, companyId: string, addedBy: string) {
    try {
      // Check if team exists
      const team = await this.getTeamById(teamId, companyId);
      if (!team) {
        return {
          success: false,
          message: 'Team not found',
        };
      }

      // Check if user exists and is in the same company
      const user = await db
        .select()
        .from(users)
        .where(and(eq(users.id, memberData.userId), eq(users.companyId, companyId)))
        .limit(1);

      if (user.length === 0) {
        return {
          success: false,
          message: 'User not found or not in the same company',
        };
      }

      // Check if user is already a member
      const existingMembership = await db
        .select()
        .from(userTeams)
        .where(and(eq(userTeams.teamId, teamId), eq(userTeams.userId, memberData.userId)))
        .limit(1);

      if (existingMembership.length > 0) {
        if (existingMembership[0].isActive) {
          return {
            success: false,
            message: 'User is already a member of this team',
          };
        } else {
          // Reactivate existing membership
          const [reactivatedMembership] = await db
            .update(userTeams)
            .set({
              isActive: true,
              roleInTeam: memberData.roleInTeam || 'member',
              joinedAt: new Date(),
              leftAt: null,
            })
            .where(eq(userTeams.id, existingMembership[0].id))
            .returning();

          logger.info(`Team member reactivated: ${memberData.userId} in team ${teamId} by ${addedBy}`);

          return {
            success: true,
            message: 'User added to team successfully',
            data: { membership: reactivatedMembership },
          };
        }
      }

      // Add new member
      const [newMembership] = await db
        .insert(userTeams)
        .values({
          teamId,
          userId: memberData.userId,
          roleInTeam: memberData.roleInTeam || 'member',
        })
        .returning();

      logger.info(`Team member added: ${memberData.userId} to team ${teamId} by ${addedBy}`);

      return {
        success: true,
        message: 'User added to team successfully',
        data: { membership: newMembership },
      };
    } catch (error) {
      logger.error('Add team member service error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  async removeTeamMember(teamId: string, userId: string, companyId: string, removedBy: string) {
    try {
      // Check if team exists
      const team = await this.getTeamById(teamId, companyId);
      if (!team) {
        return {
          success: false,
          message: 'Team not found',
        };
      }

      // Check if membership exists
      const membership = await db
        .select()
        .from(userTeams)
        .where(and(eq(userTeams.teamId, teamId), eq(userTeams.userId, userId)))
        .limit(1);

      if (membership.length === 0 || !membership[0].isActive) {
        return {
          success: false,
          message: 'User is not a member of this team',
        };
      }

      // Soft remove by setting isActive to false
      const [removedMembership] = await db
        .update(userTeams)
        .set({
          isActive: false,
          leftAt: new Date(),
        })
        .where(eq(userTeams.id, membership[0].id))
        .returning();

      logger.info(`Team member removed: ${userId} from team ${teamId} by ${removedBy}`);

      return {
        success: true,
        message: 'User removed from team successfully',
        data: { membership: removedMembership },
      };
    } catch (error) {
      logger.error('Remove team member service error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  // Enhanced team service methods
  async getTeamMembers(teamId: string, companyId: string, page: number = 1, limit: number = 20, role?: string, isActive?: boolean) {
    try {
      const offset = (page - 1) * limit;

      // Verify team exists and belongs to company
      const team = await db
        .select()
        .from(teams)
        .where(and(eq(teams.id, teamId), eq(teams.companyId, companyId)))
        .limit(1);

      if (team.length === 0) {
        return {
          success: false,
          message: 'Team not found',
        };
      }

      const conditions = [eq(userTeams.teamId, teamId)];
      
      if (role) {
        conditions.push(eq(userTeams.roleInTeam, role));
      }
      
      if (isActive !== undefined) {
        conditions.push(eq(userTeams.isActive, isActive));
      }

      const members = await db
        .select({
          id: userTeams.id,
          userId: userTeams.userId,
          roleInTeam: userTeams.roleInTeam,
          joinedAt: userTeams.joinedAt,
          leftAt: userTeams.leftAt,
          isActive: userTeams.isActive,
          user: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
            position: users.position,
            department: users.department,
            profilePhotoUrl: users.profilePhotoUrl,
          },
        })
        .from(userTeams)
        .innerJoin(users, eq(userTeams.userId, users.id))
        .where(and(...conditions))
        .orderBy(desc(userTeams.joinedAt))
        .limit(limit)
        .offset(offset);

      const totalCount = await db
        .select({ count: count() })
        .from(userTeams)
        .where(and(...conditions));

      return {
        success: true,
        data: {
          members,
          pagination: {
            page,
            limit,
            total: totalCount[0].count,
            pages: Math.ceil(totalCount[0].count / limit),
          },
        },
      };
    } catch (error) {
      logger.error('Get team members service error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  async updateTeamMember(teamId: string, userId: string, companyId: string, updateData: { roleInTeam?: string; isActive?: boolean }, updatedBy: string) {
    try {
      // Verify team exists and belongs to company
      const team = await db
        .select()
        .from(teams)
        .where(and(eq(teams.id, teamId), eq(teams.companyId, companyId)))
        .limit(1);

      if (team.length === 0) {
        return {
          success: false,
          message: 'Team not found',
        };
      }

      // Check if membership exists
      const membership = await db
        .select()
        .from(userTeams)
        .where(and(eq(userTeams.teamId, teamId), eq(userTeams.userId, userId)))
        .limit(1);

      if (membership.length === 0) {
        return {
          success: false,
          message: 'User is not a member of this team',
        };
      }

      const [updatedMembership] = await db
        .update(userTeams)
        .set({
          ...updateData,
          ...(updateData.isActive === false && { leftAt: new Date() }),
        })
        .where(eq(userTeams.id, membership[0].id))
        .returning();

      logger.info(`Team member updated: ${userId} in team ${teamId} by ${updatedBy}`);

      return {
        success: true,
        message: 'Team member updated successfully',
        data: { membership: updatedMembership },
      };
    } catch (error) {
      logger.error('Update team member service error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  async bulkAddTeamMembers(teamId: string, companyId: string, userIds: string[], addedBy: string, roleInTeam: string = 'member') {
    try {
      if (userIds.length > 50) {
        return {
          success: false,
          message: 'Maximum 50 users allowed per bulk operation',
        };
      }

      // Verify team exists and belongs to company
      const team = await db
        .select()
        .from(teams)
        .where(and(eq(teams.id, teamId), eq(teams.companyId, companyId)))
        .limit(1);

      if (team.length === 0) {
        return {
          success: false,
          message: 'Team not found',
        };
      }

      // Check which users are already members
      const existingMemberships = await db
        .select({ userId: userTeams.userId })
        .from(userTeams)
        .where(and(eq(userTeams.teamId, teamId), eq(userTeams.isActive, true)));

      const existingUserIds = new Set(existingMemberships.map(m => m.userId));
      const newUserIds = userIds.filter(id => !existingUserIds.has(id));

      if (newUserIds.length === 0) {
        return {
          success: false,
          message: 'All users are already members of this team',
        };
      }

      // Add new members
      const newMemberships = newUserIds.map(userId => ({
        userId,
        teamId,
        roleInTeam,
        addedBy,
      }));

      const addedMemberships = await db
        .insert(userTeams)
        .values(newMemberships)
        .returning();

      logger.info(`Bulk team members added: ${newUserIds.length} users to team ${teamId} by ${addedBy}`);

      return {
        success: true,
        message: `${addedMemberships.length} users added to team successfully`,
        data: { memberships: addedMemberships },
      };
    } catch (error) {
      logger.error('Bulk add team members service error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  async bulkRemoveTeamMembers(teamId: string, companyId: string, userIds: string[], removedBy: string) {
    try {
      if (userIds.length > 50) {
        return {
          success: false,
          message: 'Maximum 50 users allowed per bulk operation',
        };
      }

      // Verify team exists and belongs to company
      const team = await db
        .select()
        .from(teams)
        .where(and(eq(teams.id, teamId), eq(teams.companyId, companyId)))
        .limit(1);

      if (team.length === 0) {
        return {
          success: false,
          message: 'Team not found',
        };
      }

      // Remove members
      const [removedMemberships] = await db
        .update(userTeams)
        .set({
          isActive: false,
          leftAt: new Date(),
        })
        .where(and(
          eq(userTeams.teamId, teamId),
          sql`${userTeams.userId} = ANY(${userIds})`
        ))
        .returning();

      logger.info(`Bulk team members removed: ${userIds.length} users from team ${teamId} by ${removedBy}`);

      return {
        success: true,
        message: `${userIds.length} users removed from team successfully`,
        data: { memberships: removedMemberships },
      };
    } catch (error) {
      logger.error('Bulk remove team members service error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  async getTeamAnalytics(teamId: string, companyId: string, period: string = '30d') {
    try {
      // Verify team exists and belongs to company
      const team = await db
        .select()
        .from(teams)
        .where(and(eq(teams.id, teamId), eq(teams.companyId, companyId)))
        .limit(1);

      if (team.length === 0) {
        return {
          success: false,
          message: 'Team not found',
        };
      }

      // Calculate date range
      const now = new Date();
      let startDate: Date;
      
      switch (period) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      // Get team statistics
      const [teamStats] = await db
        .select({
          totalMembers: count(userTeams.id),
          activeMembers: sql<number>`COUNT(CASE WHEN ${userTeams.isActive} = true THEN 1 END)`,
          managers: sql<number>`COUNT(CASE WHEN ${userTeams.roleInTeam} = 'manager' THEN 1 END)`,
          leads: sql<number>`COUNT(CASE WHEN ${userTeams.roleInTeam} = 'lead' THEN 1 END)`,
        })
        .from(userTeams)
        .where(eq(userTeams.teamId, teamId));

      // Get recent activity (last 30 days)
      const recentActivity = await db
        .select({
          date: sql<string>`DATE(${userTeams.joinedAt})`,
          joined: sql<number>`COUNT(CASE WHEN ${userTeams.joinedAt} >= ${startDate} THEN 1 END)`,
          left: sql<number>`COUNT(CASE WHEN ${userTeams.leftAt} >= ${startDate} THEN 1 END)`,
        })
        .from(userTeams)
        .where(eq(userTeams.teamId, teamId))
        .groupBy(sql`DATE(${userTeams.joinedAt})`)
        .orderBy(sql`DATE(${userTeams.joinedAt})`);

      return {
        success: true,
        data: {
          teamId,
          period,
          stats: teamStats,
          recentActivity,
          generatedAt: new Date(),
        },
      };
    } catch (error) {
      logger.error('Get team analytics service error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  async exportTeamMembers(teamId: string, companyId: string, format: string = 'csv', includeInactive: boolean = false) {
    try {
      // Verify team exists and belongs to company
      const team = await db
        .select()
        .from(teams)
        .where(and(eq(teams.id, teamId), eq(teams.companyId, companyId)))
        .limit(1);

      if (team.length === 0) {
        return {
          success: false,
          message: 'Team not found',
        };
      }

      const conditions = [eq(userTeams.teamId, teamId)];
      
      if (!includeInactive) {
        conditions.push(eq(userTeams.isActive, true));
      }

      const members = await db
        .select({
          userId: userTeams.userId,
          roleInTeam: userTeams.roleInTeam,
          joinedAt: userTeams.joinedAt,
          leftAt: userTeams.leftAt,
          isActive: userTeams.isActive,
          user: {
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
            position: users.position,
            department: users.department,
          },
        })
        .from(userTeams)
        .innerJoin(users, eq(userTeams.userId, users.id))
        .where(and(...conditions))
        .orderBy(desc(userTeams.joinedAt));

      if (format === 'csv') {
        const csvData = [
          'User ID,First Name,Last Name,Email,Position,Department,Role in Team,Joined At,Left At,Is Active',
          ...members.map(m => 
            `${m.userId},${m.user.firstName},${m.user.lastName},${m.user.email},${m.user.position || ''},${m.user.department || ''},${m.roleInTeam},${m.joinedAt},${m.leftAt || ''},${m.isActive}`
          ).join('\n')
        ].join('\n');

        return {
          success: true,
          data: {
            format: 'csv',
            content: csvData,
            filename: `team-${teamId}-members-${new Date().toISOString().split('T')[0]}.csv`,
          },
        };
      } else {
        return {
          success: true,
          data: {
            format: 'json',
            members,
            exportedAt: new Date(),
            totalCount: members.length,
          },
        };
      }
    } catch (error) {
      logger.error('Export team members service error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }
}