import { eq, and, like, desc, count, sql } from 'drizzle-orm';
import { db } from '../config/database';
import { teams, userTeams, users, companies } from '../db/schema';
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

  async getTeamMembers(teamId: string, companyId: string) {
    try {
      const members = await db
        .select({
          id: userTeams.id,
          userId: userTeams.userId,
          roleInTeam: userTeams.roleInTeam,
          joinedAt: userTeams.joinedAt,
          isActive: userTeams.isActive,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          position: users.position,
          profilePhotoUrl: users.profilePhotoUrl,
        })
        .from(userTeams)
        .innerJoin(users, eq(userTeams.userId, users.id))
        .where(and(eq(userTeams.teamId, teamId), eq(users.companyId, companyId)))
        .orderBy(desc(userTeams.joinedAt));

      return members;
    } catch (error) {
      logger.error('Get team members service error:', error);
      throw error;
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
}