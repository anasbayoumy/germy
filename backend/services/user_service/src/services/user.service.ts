import { eq, and, or, desc, count, sql } from 'drizzle-orm';
import { db } from '../config/database';
import { 
  users, 
  companies, 
  userPreferences, 
  userSettings, 
  userActivities,
  savedSearches,
  userPermissions,
  customReports,
  reportHistory
} from '../db/schema';
import { logger } from '../utils/logger';

export interface GetUsersOptions {
  page: number;
  limit: number;
  search?: string;
  role?: string;
  isActive?: boolean;
  companyId?: string;
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

export class UserService {
  async getUsers(options: GetUsersOptions, requestingUserId: string, requestingUserRole: string, requestingUserCompanyId: string) {
    try {
      const { page, limit, search, role, isActive, companyId } = options;
      const offset = (page - 1) * limit;

      // Build conditions array
      const conditions = [];
      
      if (requestingUserRole === 'platform_admin') {
        // Platform admin can see all users
        if (companyId) {
          conditions.push(eq(users.companyId, companyId));
        }
      } else {
        // Company users can only see users from their company
        conditions.push(eq(users.companyId, requestingUserCompanyId));
      }
      
      if (search) {
        // Search across multiple fields
        conditions.push(
          or(
            sql`${users.email} ILIKE ${'%' + search + '%'}`,
            sql`${users.firstName} ILIKE ${'%' + search + '%'}`,
            sql`${users.lastName} ILIKE ${'%' + search + '%'}`,
            sql`${users.phone} ILIKE ${'%' + search + '%'}`,
            sql`${users.position} ILIKE ${'%' + search + '%'}`,
            sql`${users.department} ILIKE ${'%' + search + '%'}`
          )
        );
      }
      
      if (role) {
        conditions.push(eq(users.role, role));
      }
      
      if (isActive !== undefined) {
        conditions.push(eq(users.isActive, isActive));
      }

      // Build base query with company info and conditions
      const baseQuery = db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          phone: users.phone,
          position: users.position,
          department: users.department,
          hireDate: users.hireDate,
          salary: users.salary,
          profilePhotoUrl: users.profilePhotoUrl,
          role: users.role,
          isActive: users.isActive,
          isVerified: users.isVerified,
          lastLogin: users.lastLogin,
          companyId: users.companyId,
          companyName: companies.name,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .innerJoin(companies, eq(users.companyId, companies.id))
        .where(conditions.length > 0 ? and(...conditions) : sql`1=1`);

      const [usersData, totalCount] = await Promise.all([
        baseQuery
          .orderBy(desc(users.createdAt))
          .limit(limit)
          .offset(offset),
        db.select({ count: count() }).from(users).where(
          requestingUserRole === 'platform_admin' 
            ? (companyId ? eq(users.companyId, companyId) : sql`1=1`)
            : eq(users.companyId, requestingUserCompanyId)
        ),
      ]);

      return {
        users: usersData,
        pagination: {
          page,
          limit,
          total: totalCount[0].count,
          pages: Math.ceil(totalCount[0].count / limit),
        },
      };
    } catch (error) {
      logger.error('Get users service error:', error);
      return {
        users: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          pages: 0,
        },
      };
    }
  }

  async getUserById(userId: string, requestingUserId: string, requestingUserRole: string, requestingUserCompanyId: string) {
    try {
      const user = await db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          phone: users.phone,
          position: users.position,
          department: users.department,
          hireDate: users.hireDate,
          salary: users.salary,
          profilePhotoUrl: users.profilePhotoUrl,
          role: users.role,
          isActive: users.isActive,
          isVerified: users.isVerified,
          lastLogin: users.lastLogin,
          companyId: users.companyId,
          companyName: companies.name,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .innerJoin(companies, eq(users.companyId, companies.id))
        .where(eq(users.id, userId))
        .limit(1);

      if (user.length === 0) {
        return null;
      }

      const userData = user[0];

      // Check permissions
      if (requestingUserRole !== 'platform_admin' && userData.companyId !== requestingUserCompanyId) {
        return null; // User can't access users from other companies
      }

      return userData;
    } catch (error) {
      logger.error('Get user by ID service error:', error);
      throw error;
    }
  }

  async updateUser(userId: string, updateData: UpdateUserData, requestingUserId: string, requestingUserRole: string, requestingUserCompanyId: string, ipAddress?: string, userAgent?: string) {
    try {
      // Check if user exists and permissions
      const existingUser = await this.getUserById(userId, requestingUserId, requestingUserRole, requestingUserCompanyId);
      if (!existingUser) {
        return {
          success: false,
          message: 'User not found or insufficient permissions',
        };
      }

      // Role-based update restrictions
      if (requestingUserRole === 'user' && userId !== requestingUserId) {
        return {
          success: false,
          message: 'Employees can only update their own profile',
        };
      }

      // Company admins can't update super admins
      if (requestingUserRole === 'company_admin' && existingUser.role === 'company_super_admin') {
        return {
          success: false,
          message: 'Company admins cannot update super admins',
        };
      }

      // Handle date fields and ensure proper data types
      const processedUpdateData = {
        ...updateData,
        salary: updateData.salary ? updateData.salary.toString() : undefined,
        hireDate: updateData.hireDate ? new Date(updateData.hireDate) : undefined,
        // Remove updatedAt - let the database handle it automatically
      };

      const [updatedUser] = await db
        .update(users)
        .set(processedUpdateData)
        .where(eq(users.id, userId))
        .returning();

      // Log the activity
      await this.logUserActivity({
        userId: requestingUserId,
        companyId: requestingUserCompanyId,
        action: 'user_updated',
        resourceType: 'user',
        resourceId: userId,
        oldValues: existingUser,
        newValues: updateData,
        ipAddress,
        userAgent,
      });

      logger.info(`User updated: ${userId} by ${requestingUserId}`);

      return {
        success: true,
        message: 'User updated successfully',
        data: { user: updatedUser },
      };
    } catch (error) {
      logger.error('Update user service error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  async deactivateUser(userId: string, requestingUserId: string, requestingUserRole: string, requestingUserCompanyId: string, ipAddress?: string, userAgent?: string) {
    try {
      // Check if user exists and permissions
      const existingUser = await this.getUserById(userId, requestingUserId, requestingUserRole, requestingUserCompanyId);
      if (!existingUser) {
        return {
          success: false,
          message: 'User not found or insufficient permissions',
        };
      }

      // Role-based restrictions
      if (requestingUserRole === 'user') {
        return {
          success: false,
          message: 'Employees cannot deactivate users',
        };
      }

      if (requestingUserRole === 'company_admin' && existingUser.role === 'company_super_admin') {
        return {
          success: false,
          message: 'Company admins cannot deactivate super admins',
        };
      }

      if (userId === requestingUserId) {
        return {
          success: false,
          message: 'Users cannot deactivate themselves',
        };
      }

      const [deactivatedUser] = await db
        .update(users)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();

      // Log the activity
      await this.logUserActivity({
        userId: requestingUserId,
        companyId: requestingUserCompanyId,
        action: 'user_deactivated',
        resourceType: 'user',
        resourceId: userId,
        oldValues: { isActive: true },
        newValues: { isActive: false },
        ipAddress,
        userAgent,
      });

      logger.info(`User deactivated: ${userId} by ${requestingUserId}`);

      return {
        success: true,
        message: 'User deactivated successfully',
        data: { user: deactivatedUser },
      };
    } catch (error) {
      logger.error('Deactivate user service error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  async getUserPreferences(userId: string, requestingUserId: string, requestingUserRole: string, requestingUserCompanyId: string) {
    try {
      // Check permissions
      if (requestingUserRole !== 'platform_admin' && userId !== requestingUserId) {
        const user = await this.getUserById(userId, requestingUserId, requestingUserRole, requestingUserCompanyId);
        if (!user) {
          return null;
        }
      }

      const preferences = await db
        .select()
        .from(userPreferences)
        .where(eq(userPreferences.userId, userId))
        .limit(1);

      return preferences[0] || null;
    } catch (error) {
      logger.error('Get user preferences service error:', error);
      throw error;
    }
  }

  async updateUserPreferences(userId: string, preferencesData: any, requestingUserId: string, requestingUserRole: string, requestingUserCompanyId: string, ipAddress?: string, userAgent?: string) {
    try {
      // Check permissions
      if (requestingUserRole !== 'platform_admin' && userId !== requestingUserId) {
        return {
          success: false,
          message: 'Users can only update their own preferences',
        };
      }

      const existingPreferences = await this.getUserPreferences(userId, requestingUserId, requestingUserRole, requestingUserCompanyId);

      if (existingPreferences) {
        const [updatedPreferences] = await db
          .update(userPreferences)
          .set({
            ...preferencesData,
            updatedAt: new Date(),
          })
          .where(eq(userPreferences.userId, userId))
          .returning();

        return {
          success: true,
          message: 'User preferences updated successfully',
          data: { preferences: updatedPreferences },
        };
      } else {
        const [newPreferences] = await db
          .insert(userPreferences)
          .values({
            userId,
            ...preferencesData,
          })
          .returning();

        return {
          success: true,
          message: 'User preferences created successfully',
          data: { preferences: newPreferences },
        };
      }
    } catch (error) {
      logger.error('Update user preferences service error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  async getUserActivities(userId: string, page: number = 1, limit: number = 20, requestingUserId: string, requestingUserRole: string, requestingUserCompanyId: string) {
    try {
      // Check permissions
      if (requestingUserRole !== 'platform_admin' && userId !== requestingUserId) {
        const user = await this.getUserById(userId, requestingUserId, requestingUserRole, requestingUserCompanyId);
        if (!user) {
          return null;
        }
      }

      const offset = (page - 1) * limit;

      const [activities, totalCount] = await Promise.all([
        db
          .select()
          .from(userActivities)
          .where(eq(userActivities.userId, userId))
          .orderBy(desc(userActivities.createdAt))
          .limit(limit)
          .offset(offset),
        db.select({ count: count() }).from(userActivities).where(eq(userActivities.userId, userId)),
      ]);

      return {
        activities: activities,
        pagination: {
          page,
          limit,
          total: totalCount[0].count,
          pages: Math.ceil(totalCount[0].count / limit),
        },
      };
    } catch (error) {
      logger.error('Get user activities service error:', error);
      throw error;
    }
  }

  async searchUsers(q: string, limit: number = 10, requestingUserId: string, requestingUserRole: string, requestingUserCompanyId: string) {
    try {
      const result = await this.getUsers(
        {
          page: 1,
          limit: limit,
          search: q,
        },
        requestingUserId,
        requestingUserRole,
        requestingUserCompanyId
      );
      return result.users;
    } catch (error) {
      logger.error('Search users service error:', error);
      throw error;
    }
  }

  async getUserSettings(userId: string, requestingUserId: string, requestingUserRole: string, requestingUserCompanyId: string) {
    try {
      // Check permissions
      if (requestingUserRole !== 'platform_admin' && userId !== requestingUserId) {
        const user = await this.getUserById(userId, requestingUserId, requestingUserRole, requestingUserCompanyId);
        if (!user) {
          return null;
        }
      }

      const settings = await db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, userId))
        .limit(1);

      return settings[0] || null;
    } catch (error) {
      logger.error('Get user settings service error:', error);
      throw error;
    }
  }

  async updateUserSettings(userId: string, settingsData: any, requestingUserId: string, requestingUserRole: string, requestingUserCompanyId: string, ipAddress?: string, userAgent?: string) {
    try {
      // Check permissions
      if (requestingUserRole !== 'platform_admin' && userId !== requestingUserId) {
        return {
          success: false,
          message: 'Users can only update their own settings',
        };
      }

      const existingSettings = await this.getUserSettings(userId, requestingUserId, requestingUserRole, requestingUserCompanyId);

      if (existingSettings) {
        const [updatedSettings] = await db
          .update(userSettings)
          .set({
            ...settingsData,
            updatedAt: new Date(),
          })
          .where(eq(userSettings.userId, userId))
          .returning();

        return {
          success: true,
          message: 'User settings updated successfully',
          data: { settings: updatedSettings },
        };
      } else {
        const [newSettings] = await db
          .insert(userSettings)
          .values({
            userId,
            companyId: requestingUserCompanyId,
            ...settingsData,
          })
          .returning();

        return {
          success: true,
          message: 'User settings created successfully',
          data: { settings: newSettings },
        };
      }
    } catch (error) {
      logger.error('Update user settings service error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  async getUserStatistics(userId: string, requestingUserId: string, requestingUserRole: string, requestingUserCompanyId: string) {
    try {
      // Check permissions
      if (requestingUserRole !== 'platform_admin' && userId !== requestingUserId) {
        const user = await this.getUserById(userId, requestingUserId, requestingUserRole, requestingUserCompanyId);
        if (!user) {
          return null;
        }
      }

      // Get user info
      const user = await this.getUserById(userId, requestingUserId, requestingUserRole, requestingUserCompanyId);
      if (!user) {
        return null;
      }

      // Get activity count
      const activityCount = await db
        .select({ count: count() })
        .from(userActivities)
        .where(eq(userActivities.userId, userId));

      // Get recent activities (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentActivities = await db
        .select({ count: count() })
        .from(userActivities)
        .where(
          and(
            eq(userActivities.userId, userId),
            sql`${userActivities.createdAt} >= ${sevenDaysAgo}`
          )
        );

      // Get most common actions
      const commonActions = await db
        .select({
          action: userActivities.action,
          count: count(),
        })
        .from(userActivities)
        .where(eq(userActivities.userId, userId))
        .groupBy(userActivities.action)
        .orderBy(desc(count()))
        .limit(5);

      return {
        user: {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
        },
        statistics: {
          totalActivities: activityCount[0].count,
          recentActivities: recentActivities[0].count,
          mostCommonActions: commonActions,
        },
      };
    } catch (error) {
      logger.error('Get user statistics service error:', error);
      throw error;
    }
  }

  async getCompanyUserAnalytics(companyId: string, requestingUserId: string, requestingUserRole: string, requestingUserCompanyId: string) {
    try {
      // Check permissions
      if (requestingUserRole !== 'platform_admin' && companyId !== requestingUserCompanyId) {
        return {
          success: false,
          message: 'Insufficient permissions to view company analytics',
        };
      }

      // Get total users
      const totalUsers = await db
        .select({ count: count() })
        .from(users)
        .where(eq(users.companyId, companyId));

      // Get active users
      const activeUsers = await db
        .select({ count: count() })
        .from(users)
        .where(and(eq(users.companyId, companyId), eq(users.isActive, true)));

      // Get users by role
      const usersByRole = await db
        .select({
          role: users.role,
          count: count(),
        })
        .from(users)
        .where(eq(users.companyId, companyId))
        .groupBy(users.role);

      // Get recent registrations (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentRegistrations = await db
        .select({ count: count() })
        .from(users)
        .where(
          and(
            eq(users.companyId, companyId),
            sql`${users.createdAt} >= ${thirtyDaysAgo}`
          )
        );

      // Get most active users (by activity count)
      const mostActiveUsers = await db
        .select({
          userId: userActivities.userId,
          firstName: users.firstName,
          lastName: users.lastName,
          activityCount: count(),
        })
        .from(userActivities)
        .innerJoin(users, eq(userActivities.userId, users.id))
        .where(eq(users.companyId, companyId))
        .groupBy(userActivities.userId, users.firstName, users.lastName)
        .orderBy(desc(count()))
        .limit(10);

      return {
        success: true,
        data: {
          overview: {
            totalUsers: totalUsers[0].count,
            activeUsers: activeUsers[0].count,
            recentRegistrations: recentRegistrations[0].count,
          },
          usersByRole,
          mostActiveUsers,
        },
      };
    } catch (error) {
      logger.error('Get company user analytics service error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  async getUserActivitySummary(userId: string, days: number = 30, requestingUserId: string, requestingUserRole: string, requestingUserCompanyId: string) {
    try {
      // Check permissions
      if (requestingUserRole !== 'platform_admin' && userId !== requestingUserId) {
        const user = await this.getUserById(userId, requestingUserId, requestingUserRole, requestingUserCompanyId);
        if (!user) {
          return null;
        }
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get activities by day
      const activitiesByDay = await db
        .select({
          date: sql<string>`DATE(${userActivities.createdAt})`,
          count: count(),
        })
        .from(userActivities)
        .where(
          and(
            eq(userActivities.userId, userId),
            sql`${userActivities.createdAt} >= ${startDate}`
          )
        )
        .groupBy(sql`DATE(${userActivities.createdAt})`)
        .orderBy(sql`DATE(${userActivities.createdAt})`);

      // Get activities by action type
      const activitiesByAction = await db
        .select({
          action: userActivities.action,
          count: count(),
        })
        .from(userActivities)
        .where(
          and(
            eq(userActivities.userId, userId),
            sql`${userActivities.createdAt} >= ${startDate}`
          )
        )
        .groupBy(userActivities.action)
        .orderBy(desc(count()));

      // Get activities by resource type
      const activitiesByResource = await db
        .select({
          resourceType: userActivities.resourceType,
          count: count(),
        })
        .from(userActivities)
        .where(
          and(
            eq(userActivities.userId, userId),
            sql`${userActivities.createdAt} >= ${startDate}`
          )
        )
        .groupBy(userActivities.resourceType)
        .orderBy(desc(count()));

      return {
        period: `${days} days`,
        activitiesByDay,
        activitiesByAction,
        activitiesByResource,
      };
    } catch (error) {
      logger.error('Get user activity summary service error:', error);
      throw error;
    }
  }

  async bulkUpdateUsers(userIds: string[], updateData: any, requestingUserId: string, requestingUserRole: string, requestingUserCompanyId: string, ipAddress?: string, userAgent?: string) {
    try {
      // Check permissions - only admins can bulk update
      if (!['platform_admin', 'company_super_admin', 'company_admin'].includes(requestingUserRole)) {
        return {
          success: false,
          message: 'Insufficient permissions for bulk operations',
        };
      }

      // Add limits for bulk operations
      if (userIds.length > 100) {
        return {
          success: false,
          message: 'Bulk operations are limited to 100 users at a time',
        };
      }

      const results = [];
      let successCount = 0;
      let errorCount = 0;

      for (const userId of userIds) {
        try {
          // Check if user exists and permissions
          const existingUser = await this.getUserById(userId, requestingUserId, requestingUserRole, requestingUserCompanyId);
          if (!existingUser) {
            results.push({ userId, success: false, error: 'User not found or insufficient permissions' });
            errorCount++;
            continue;
          }

          // Role-based restrictions
          if (requestingUserRole === 'company_admin' && existingUser.role === 'company_super_admin') {
            results.push({ userId, success: false, error: 'Cannot update super admin' });
            errorCount++;
            continue;
          }

          const [updatedUser] = await db
            .update(users)
            .set({
              ...updateData,
              updatedAt: new Date(),
            })
            .where(eq(users.id, userId))
            .returning();

          // Log the activity
          await this.logUserActivity({
            userId: requestingUserId,
            companyId: requestingUserCompanyId,
            action: 'bulk_user_updated',
            resourceType: 'user',
            resourceId: userId,
            oldValues: existingUser,
            newValues: updateData,
            ipAddress,
            userAgent,
          });

          results.push({ userId, success: true, data: updatedUser });
          successCount++;
        } catch (error) {
          logger.error(`Bulk update error for user ${userId}:`, error);
          results.push({ userId, success: false, error: 'Update failed' });
          errorCount++;
        }
      }

      logger.info(`Bulk update completed: ${successCount} successful, ${errorCount} failed by ${requestingUserId}`);

      return {
        success: true,
        message: `Bulk update completed: ${successCount} successful, ${errorCount} failed`,
        data: {
          total: userIds.length,
          successful: successCount,
          failed: errorCount,
          results,
        },
      };
    } catch (error) {
      logger.error('Bulk update users service error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  async exportUsers(companyId: string, requestingUserId: string, requestingUserRole: string, requestingUserCompanyId: string) {
    try {
      // Check permissions
      if (requestingUserRole !== 'platform_admin' && companyId !== requestingUserCompanyId) {
        return {
          success: false,
          message: 'Insufficient permissions to export users',
        };
      }

      const usersData = await db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          phone: users.phone,
          position: users.position,
          department: users.department,
          hireDate: users.hireDate,
          salary: users.salary,
          role: users.role,
          isActive: users.isActive,
          isVerified: users.isVerified,
          lastLogin: users.lastLogin,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
          companyName: companies.name,
        })
        .from(users)
        .innerJoin(companies, eq(users.companyId, companies.id))
        .where(eq(users.companyId, companyId))
        .orderBy(users.createdAt);

      // Log the export activity
      await this.logUserActivity({
        userId: requestingUserId,
        companyId: requestingUserCompanyId,
        action: 'users_exported',
        resourceType: 'user',
        newValues: { count: usersData.length },
      });

      logger.info(`Users exported: ${usersData.length} users by ${requestingUserId}`);

      return {
        success: true,
        message: 'Users exported successfully',
        data: {
          count: usersData.length,
          users: usersData,
          exportedAt: new Date(),
        },
      };
    } catch (error) {
      logger.error('Export users service error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  async importUsers(usersData: any[], requestingUserId: string, requestingUserRole: string, requestingUserCompanyId: string, ipAddress?: string, userAgent?: string) {
    try {
      // Check permissions - only admins can import
      if (!['platform_admin', 'company_super_admin', 'company_admin'].includes(requestingUserRole)) {
        return {
          success: false,
          message: 'Insufficient permissions for import operations',
        };
      }

      // Add limits for import operations
      if (usersData.length > 50) {
        return {
          success: false,
          message: 'Import operations are limited to 50 users at a time',
        };
      }

      const results = [];
      let successCount = 0;
      let errorCount = 0;

      for (const userData of usersData) {
        try {
          // Validate required fields
          if (!userData.email || !userData.firstName || !userData.lastName) {
            results.push({ 
              email: userData.email || 'unknown', 
              success: false, 
              error: 'Missing required fields (email, firstName, lastName)' 
            });
            errorCount++;
            continue;
          }

          // Check if user already exists
          const existingUser = await db
            .select()
            .from(users)
            .where(eq(users.email, userData.email))
            .limit(1);

          if (existingUser.length > 0) {
            results.push({ 
              email: userData.email, 
              success: false, 
              error: 'User already exists' 
            });
            errorCount++;
            continue;
          }

          // Create user with secure temporary password
          const bcrypt = require('bcryptjs');
          const tempPassword = require('node:crypto').randomBytes(16).toString('hex');
          const hashedPassword = await bcrypt.hash(tempPassword, 12);
          
          const [newUser] = await db
            .insert(users)
            .values({
              email: userData.email,
              passwordHash: hashedPassword,
              firstName: userData.firstName,
              lastName: userData.lastName,
              phone: userData.phone,
              position: userData.position,
              department: userData.department,
              hireDate: userData.hireDate ? new Date(userData.hireDate) : null,
              salary: userData.salary ? userData.salary.toString() : undefined,
              role: userData.role || 'user',
              isActive: userData.isActive !== undefined ? userData.isActive : true,
              isVerified: false, // Imported users need to verify
              companyId: requestingUserCompanyId,
            })
            .returning();

          // Log the import activity
          await this.logUserActivity({
            userId: requestingUserId,
            companyId: requestingUserCompanyId,
            action: 'user_imported',
            resourceType: 'user',
            resourceId: newUser.id,
            newValues: { email: userData.email, firstName: userData.firstName, lastName: userData.lastName },
            ipAddress,
            userAgent,
          });

          results.push({ 
            email: userData.email, 
            success: true, 
            data: { id: newUser.id } 
          });
          successCount++;
        } catch (error) {
          logger.error(`Import error for user ${userData.email}:`, error);
          results.push({ 
            email: userData.email, 
            success: false, 
            error: 'Import failed' 
          });
          errorCount++;
        }
      }

      logger.info(`Users import completed: ${successCount} successful, ${errorCount} failed by ${requestingUserId}`);

      return {
        success: true,
        message: `Import completed: ${successCount} successful, ${errorCount} failed`,
        data: {
          total: usersData.length,
          successful: successCount,
          failed: errorCount,
          results,
        },
      };
    } catch (error) {
      logger.error('Import users service error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  private async logUserActivity(data: {
    userId: string;
    companyId: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    oldValues?: any;
    newValues?: any;
    ipAddress?: string;
    userAgent?: string;
  }) {
    try {
      await db.insert(userActivities).values({
        userId: data.userId,
        companyId: data.companyId,
        action: data.action,
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        oldValues: data.oldValues,
        newValues: data.newValues,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      });
      
      logger.info(`User activity logged: ${data.action} by ${data.userId} for ${data.resourceType} ${data.resourceId || ''}`);
    } catch (error) {
      logger.error('Failed to log user activity:', error);
    }
  }

  // ===== NEW MISSING METHODS =====

  // User CRUD Operations
  async createUser(userData: any, requestingUserId: string, requestingUserRole: string, requestingUserCompanyId: string, ipAddress?: string, userAgent?: string) {
    try {
      // Check permissions - only admins can create users
      if (!['platform_admin', 'company_super_admin', 'company_admin'].includes(requestingUserRole)) {
        return {
          success: false,
          message: 'Insufficient permissions to create users',
        };
      }

      // Check if user already exists
      const [existingUser] = await db
        .select()
        .from(users)
        .where(and(
          eq(users.email, userData.email),
          eq(users.companyId, userData.companyId)
        ))
        .limit(1);

      if (existingUser) {
        return {
          success: false,
          message: 'User with this email already exists in the company',
        };
      }

      // Create user
      const [newUser] = await db
        .insert(users)
        .values({
          ...userData,
          hireDate: userData.hireDate ? new Date(userData.hireDate) : null,
          salary: userData.salary ? userData.salary.toString() : undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      // Log the activity
      await this.logUserActivity({
        userId: requestingUserId,
        companyId: requestingUserCompanyId,
        action: 'user_created',
        resourceType: 'user',
        resourceId: newUser.id,
        newValues: newUser,
        ipAddress,
        userAgent,
      });

      logger.info(`User created: ${newUser.id} by ${requestingUserId}`);

      return {
        success: true,
        message: 'User created successfully',
        data: { user: newUser },
      };
    } catch (error) {
      logger.error('Create user service error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  async deleteUser(userId: string, requestingUserId: string, requestingUserRole: string, requestingUserCompanyId: string, ipAddress?: string, userAgent?: string) {
    try {
      // Check permissions - only platform admins can delete users
      if (requestingUserRole !== 'platform_admin') {
        return {
          success: false,
          message: 'Only platform admins can delete users',
        };
      }

      // Check if user exists
      const existingUser = await this.getUserById(userId, requestingUserId, requestingUserRole, requestingUserCompanyId);
      if (!existingUser) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      // Delete user
      await db.delete(users).where(eq(users.id, userId));

      // Log the activity
      await this.logUserActivity({
        userId: requestingUserId,
        companyId: requestingUserCompanyId,
        action: 'user_deleted',
        resourceType: 'user',
        resourceId: userId,
        oldValues: existingUser,
        ipAddress,
        userAgent,
      });

      logger.info(`User deleted: ${userId} by ${requestingUserId}`);

      return {
        success: true,
        message: 'User deleted successfully',
      };
    } catch (error) {
      logger.error('Delete user service error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  async activateUser(userId: string, requestingUserId: string, requestingUserRole: string, requestingUserCompanyId: string, ipAddress?: string, userAgent?: string) {
    try {
      // Check permissions
      if (!['platform_admin', 'company_super_admin', 'company_admin'].includes(requestingUserRole)) {
        return {
          success: false,
          message: 'Insufficient permissions to activate users',
        };
      }

      // Check if user exists
      const existingUser = await this.getUserById(userId, requestingUserId, requestingUserRole, requestingUserCompanyId);
      if (!existingUser) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      if (existingUser.isActive) {
        return {
          success: false,
          message: 'User is already active',
        };
      }

      // Activate user
      const [activatedUser] = await db
        .update(users)
        .set({
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();

      // Log the activity
      await this.logUserActivity({
        userId: requestingUserId,
        companyId: requestingUserCompanyId,
        action: 'user_activated',
        resourceType: 'user',
        resourceId: userId,
        oldValues: { isActive: false },
        newValues: { isActive: true },
        ipAddress,
        userAgent,
      });

      logger.info(`User activated: ${userId} by ${requestingUserId}`);

      return {
        success: true,
        message: 'User activated successfully',
        data: { user: activatedUser },
      };
    } catch (error) {
      logger.error('Activate user service error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  // Bulk Operations
  async bulkCreateUsers(usersData: any[], requestingUserId: string, requestingUserRole: string, requestingUserCompanyId: string, ipAddress?: string, userAgent?: string) {
    try {
      // Check permissions
      if (!['platform_admin', 'company_super_admin', 'company_admin'].includes(requestingUserRole)) {
        return {
          success: false,
          message: 'Insufficient permissions for bulk operations',
        };
      }

      // Add limits for bulk operations
      if (usersData.length > 50) {
        return {
          success: false,
          message: 'Bulk operations are limited to 50 users at a time',
        };
      }

      const results = [];
      let successCount = 0;
      let errorCount = 0;

      for (const userData of usersData) {
        try {
          const result = await this.createUser(userData, requestingUserId, requestingUserRole, requestingUserCompanyId, ipAddress, userAgent);
          if (result.success) {
            successCount++;
            results.push({ userId: userData.email, status: 'success', data: result.data });
          } else {
            errorCount++;
            results.push({ userId: userData.email, status: 'error', message: result.message });
          }
        } catch (error) {
          errorCount++;
          results.push({ userId: userData.email, status: 'error', message: 'Internal error' });
        }
      }

      return {
        success: true,
        message: 'Bulk create completed',
        data: {
          total: usersData.length,
          success: successCount,
          errors: errorCount,
          results,
        },
      };
    } catch (error) {
      logger.error('Bulk create users service error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  async bulkDeleteUsers(userIds: string[], requestingUserId: string, requestingUserRole: string, requestingUserCompanyId: string, ipAddress?: string, userAgent?: string) {
    try {
      // Check permissions - only platform admins can delete users
      if (requestingUserRole !== 'platform_admin') {
        return {
          success: false,
          message: 'Only platform admins can delete users',
        };
      }

      // Add limits for bulk operations
      if (userIds.length > 100) {
        return {
          success: false,
          message: 'Bulk operations are limited to 100 users at a time',
        };
      }

      const results = [];
      let successCount = 0;
      let errorCount = 0;

      for (const userId of userIds) {
        try {
          const result = await this.deleteUser(userId, requestingUserId, requestingUserRole, requestingUserCompanyId, ipAddress, userAgent);
          if (result.success) {
            successCount++;
            results.push({ userId, status: 'success' });
          } else {
            errorCount++;
            results.push({ userId, status: 'error', message: result.message });
          }
        } catch (error) {
          errorCount++;
          results.push({ userId, status: 'error', message: 'Internal error' });
        }
      }

      return {
        success: true,
        message: 'Bulk delete completed',
        data: {
          total: userIds.length,
          success: successCount,
          errors: errorCount,
          results,
        },
      };
    } catch (error) {
      logger.error('Bulk delete users service error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  async bulkActivateUsers(userIds: string[], requestingUserId: string, requestingUserRole: string, requestingUserCompanyId: string, ipAddress?: string, userAgent?: string) {
    try {
      // Check permissions
      if (!['platform_admin', 'company_super_admin', 'company_admin'].includes(requestingUserRole)) {
        return {
          success: false,
          message: 'Insufficient permissions for bulk operations',
        };
      }

      // Add limits for bulk operations
      if (userIds.length > 100) {
        return {
          success: false,
          message: 'Bulk operations are limited to 100 users at a time',
        };
      }

      const results = [];
      let successCount = 0;
      let errorCount = 0;

      for (const userId of userIds) {
        try {
          const result = await this.activateUser(userId, requestingUserId, requestingUserRole, requestingUserCompanyId, ipAddress, userAgent);
          if (result.success) {
            successCount++;
            results.push({ userId, status: 'success' });
          } else {
            errorCount++;
            results.push({ userId, status: 'error', message: result.message });
          }
        } catch (error) {
          errorCount++;
          results.push({ userId, status: 'error', message: 'Internal error' });
        }
      }

      return {
        success: true,
        message: 'Bulk activate completed',
        data: {
          total: userIds.length,
          success: successCount,
          errors: errorCount,
          results,
        },
      };
    } catch (error) {
      logger.error('Bulk activate users service error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  async bulkDeactivateUsers(userIds: string[], requestingUserId: string, requestingUserRole: string, requestingUserCompanyId: string, ipAddress?: string, userAgent?: string) {
    try {
      // Check permissions
      if (!['platform_admin', 'company_super_admin', 'company_admin'].includes(requestingUserRole)) {
        return {
          success: false,
          message: 'Insufficient permissions for bulk operations',
        };
      }

      // Add limits for bulk operations
      if (userIds.length > 100) {
        return {
          success: false,
          message: 'Bulk operations are limited to 100 users at a time',
        };
      }

      const results = [];
      let successCount = 0;
      let errorCount = 0;

      for (const userId of userIds) {
        try {
          const result = await this.deactivateUser(userId, requestingUserId, requestingUserRole, requestingUserCompanyId, ipAddress, userAgent);
          if (result.success) {
            successCount++;
            results.push({ userId, status: 'success' });
          } else {
            errorCount++;
            results.push({ userId, status: 'error', message: result.message });
          }
        } catch (error) {
          errorCount++;
          results.push({ userId, status: 'error', message: 'Internal error' });
        }
      }

      return {
        success: true,
        message: 'Bulk deactivate completed',
        data: {
          total: userIds.length,
          success: successCount,
          errors: errorCount,
          results,
        },
      };
    } catch (error) {
      logger.error('Bulk deactivate users service error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  // Activity Management
  async createUserActivity(userId: string, activityData: any, requestingUserId: string, requestingUserRole: string, requestingUserCompanyId: string, ipAddress?: string, userAgent?: string) {
    try {
      // Check permissions
      if (requestingUserRole !== 'platform_admin' && userId !== requestingUserId) {
        const user = await this.getUserById(userId, requestingUserId, requestingUserRole, requestingUserCompanyId);
        if (!user) {
          return {
            success: false,
            message: 'User not found or insufficient permissions',
          };
        }
      }

      // Create activity
      const [newActivity] = await db
        .insert(userActivities)
        .values({
          userId,
          companyId: requestingUserCompanyId,
          action: activityData.action,
          resourceType: activityData.resourceType,
          resourceId: activityData.resourceId,
          oldValues: activityData.metadata,
          newValues: activityData.description,
          ipAddress,
          userAgent,
        })
        .returning();

      // Log the activity
      await this.logUserActivity({
        userId: requestingUserId,
        companyId: requestingUserCompanyId,
        action: 'activity_created',
        resourceType: 'user_activity',
        resourceId: newActivity.id,
        newValues: newActivity,
        ipAddress,
        userAgent,
      });

      logger.info(`User activity created: ${newActivity.id} by ${requestingUserId}`);

      return {
        success: true,
        message: 'Activity created successfully',
        data: { activity: newActivity },
      };
    } catch (error) {
      logger.error('Create user activity service error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  async updateUserActivity(userId: string, activityId: string, activityData: any, requestingUserId: string, requestingUserRole: string, requestingUserCompanyId: string, ipAddress?: string, userAgent?: string) {
    try {
      // Check permissions
      if (requestingUserRole !== 'platform_admin' && userId !== requestingUserId) {
        const user = await this.getUserById(userId, requestingUserId, requestingUserRole, requestingUserCompanyId);
        if (!user) {
          return {
            success: false,
            message: 'User not found or insufficient permissions',
          };
        }
      }

      // Check if activity exists
      const [existingActivity] = await db
        .select()
        .from(userActivities)
        .where(and(
          eq(userActivities.id, activityId),
          eq(userActivities.userId, userId)
        ))
        .limit(1);

      if (!existingActivity) {
        return {
          success: false,
          message: 'Activity not found',
        };
      }

      // Update activity
      const [updatedActivity] = await db
        .update(userActivities)
        .set({
          action: activityData.action || existingActivity.action,
          resourceType: activityData.resourceType || existingActivity.resourceType,
          resourceId: activityData.resourceId || existingActivity.resourceId,
          oldValues: activityData.metadata || existingActivity.oldValues,
          newValues: activityData.description || existingActivity.newValues,
        })
        .where(eq(userActivities.id, activityId))
        .returning();

      // Log the activity
      await this.logUserActivity({
        userId: requestingUserId,
        companyId: requestingUserCompanyId,
        action: 'activity_updated',
        resourceType: 'user_activity',
        resourceId: activityId,
        oldValues: existingActivity,
        newValues: updatedActivity,
        ipAddress,
        userAgent,
      });

      logger.info(`User activity updated: ${activityId} by ${requestingUserId}`);

      return {
        success: true,
        message: 'Activity updated successfully',
        data: { activity: updatedActivity },
      };
    } catch (error) {
      logger.error('Update user activity service error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  async deleteUserActivity(userId: string, activityId: string, requestingUserId: string, requestingUserRole: string, requestingUserCompanyId: string, ipAddress?: string, userAgent?: string) {
    try {
      // Check permissions
      if (requestingUserRole !== 'platform_admin' && userId !== requestingUserId) {
        const user = await this.getUserById(userId, requestingUserId, requestingUserRole, requestingUserCompanyId);
        if (!user) {
          return {
            success: false,
            message: 'User not found or insufficient permissions',
          };
        }
      }

      // Check if activity exists
      const [existingActivity] = await db
        .select()
        .from(userActivities)
        .where(and(
          eq(userActivities.id, activityId),
          eq(userActivities.userId, userId)
        ))
        .limit(1);

      if (!existingActivity) {
        return {
          success: false,
          message: 'Activity not found',
        };
      }

      // Delete activity
      await db.delete(userActivities).where(eq(userActivities.id, activityId));

      // Log the activity
      await this.logUserActivity({
        userId: requestingUserId,
        companyId: requestingUserCompanyId,
        action: 'activity_deleted',
        resourceType: 'user_activity',
        resourceId: activityId,
        oldValues: existingActivity,
        ipAddress,
        userAgent,
      });

      logger.info(`User activity deleted: ${activityId} by ${requestingUserId}`);

      return {
        success: true,
        message: 'Activity deleted successfully',
      };
    } catch (error) {
      logger.error('Delete user activity service error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  async getUserActivityById(userId: string, activityId: string, requestingUserId: string, requestingUserRole: string, requestingUserCompanyId: string) {
    try {
      // Check permissions
      if (requestingUserRole !== 'platform_admin' && userId !== requestingUserId) {
        const user = await this.getUserById(userId, requestingUserId, requestingUserRole, requestingUserCompanyId);
        if (!user) {
          return null;
        }
      }

      const [activity] = await db
        .select()
        .from(userActivities)
        .where(and(
          eq(userActivities.id, activityId),
          eq(userActivities.userId, userId)
        ))
        .limit(1);

      return activity || null;
    } catch (error) {
      logger.error('Get user activity by ID service error:', error);
      throw error;
    }
  }

  // Advanced Search
  async advancedSearch(searchData: any, requestingUserId: string, requestingUserRole: string, requestingUserCompanyId: string) {
    try {
      const { query, filters, sortBy, sortOrder, page, limit } = searchData;
      const offset = (page - 1) * limit;

      // Build conditions array
      const conditions = [];
      
      if (requestingUserRole === 'platform_admin') {
        // Platform admin can see all users
        if (filters?.companyId) {
          conditions.push(eq(users.companyId, filters.companyId));
        }
      } else {
        // Company users can only see users from their company
        conditions.push(eq(users.companyId, requestingUserCompanyId));
      }
      
      if (query) {
        conditions.push(
          or(
            sql`${users.email} ILIKE ${'%' + query + '%'}`,
            sql`${users.firstName} ILIKE ${'%' + query + '%'}`,
            sql`${users.lastName} ILIKE ${'%' + query + '%'}`,
            sql`${users.phone} ILIKE ${'%' + query + '%'}`,
            sql`${users.position} ILIKE ${'%' + query + '%'}`,
            sql`${users.department} ILIKE ${'%' + query + '%'}`
          )
        );
      }
      
      if (filters?.roles && filters.roles.length > 0) {
        conditions.push(sql`${users.role} = ANY(${filters.roles})`);
      }
      
      if (filters?.isActive !== undefined) {
        conditions.push(eq(users.isActive, filters.isActive));
      }
      
      if (filters?.departments && filters.departments.length > 0) {
        conditions.push(sql`${users.department} = ANY(${filters.departments})`);
      }
      
      if (filters?.positions && filters.positions.length > 0) {
        conditions.push(sql`${users.position} = ANY(${filters.positions})`);
      }
      
      if (filters?.dateRange?.start && filters?.dateRange?.end) {
        conditions.push(
          sql`${users.createdAt} BETWEEN ${filters.dateRange.start} AND ${filters.dateRange.end}`
        );
      }

      // Build base query
      const baseQuery = db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          phone: users.phone,
          position: users.position,
          department: users.department,
          hireDate: users.hireDate,
          salary: users.salary,
          profilePhotoUrl: users.profilePhotoUrl,
          role: users.role,
          isActive: users.isActive,
          isVerified: users.isVerified,
          lastLogin: users.lastLogin,
          companyId: users.companyId,
          companyName: companies.name,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .innerJoin(companies, eq(users.companyId, companies.id))
        .where(conditions.length > 0 ? and(...conditions) : sql`1=1`);

      // Apply sorting
      let sortedQuery;
      if (sortBy === 'firstName') {
        sortedQuery = sortOrder === 'asc' 
          ? baseQuery.orderBy(users.firstName)
          : baseQuery.orderBy(desc(users.firstName));
      } else if (sortBy === 'lastName') {
        sortedQuery = sortOrder === 'asc' 
          ? baseQuery.orderBy(users.lastName)
          : baseQuery.orderBy(desc(users.lastName));
      } else if (sortBy === 'email') {
        sortedQuery = sortOrder === 'asc' 
          ? baseQuery.orderBy(users.email)
          : baseQuery.orderBy(desc(users.email));
      } else if (sortBy === 'lastLogin') {
        sortedQuery = sortOrder === 'asc' 
          ? baseQuery.orderBy(users.lastLogin)
          : baseQuery.orderBy(desc(users.lastLogin));
      } else {
        sortedQuery = sortOrder === 'asc' 
          ? baseQuery.orderBy(users.createdAt)
          : baseQuery.orderBy(desc(users.createdAt));
      }

      const [usersData, totalCount] = await Promise.all([
        sortedQuery.limit(limit).offset(offset),
        db.select({ count: count() }).from(users).where(
          requestingUserRole === 'platform_admin' 
            ? (filters?.companyId ? eq(users.companyId, filters.companyId) : sql`1=1`)
            : eq(users.companyId, requestingUserCompanyId)
        ),
      ]);

      return {
        users: usersData,
        pagination: {
          page,
          limit,
          total: totalCount[0].count,
          pages: Math.ceil(totalCount[0].count / limit),
        },
      };
    } catch (error) {
      logger.error('Advanced search service error:', error);
      throw error;
    }
  }

  // Saved Searches
  async saveSearch(searchData: any, requestingUserId: string, requestingUserRole: string, requestingUserCompanyId: string) {
    try {
      const [savedSearch] = await db
        .insert(savedSearches)
        .values({
          userId: requestingUserId,
          companyId: requestingUserCompanyId,
          name: searchData.name,
          description: searchData.description,
          query: searchData.query,
          filters: searchData.filters || {},
          isPublic: searchData.isPublic || false,
        })
        .returning();

      logger.info(`Search saved: ${savedSearch.id} by ${requestingUserId}`);

      return {
        success: true,
        message: 'Search saved successfully',
        data: { search: savedSearch },
      };
    } catch (error) {
      logger.error('Save search service error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  async getSavedSearches(requestingUserId: string, requestingUserRole: string, requestingUserCompanyId: string) {
    try {
      const searches = await db
        .select()
        .from(savedSearches)
        .where(
          requestingUserRole === 'platform_admin'
            ? sql`1=1`
            : or(
                eq(savedSearches.userId, requestingUserId),
                and(
                  eq(savedSearches.companyId, requestingUserCompanyId),
                  eq(savedSearches.isPublic, true)
                )
              )
        )
        .orderBy(desc(savedSearches.createdAt));

      return {
        success: true,
        data: { searches },
      };
    } catch (error) {
      logger.error('Get saved searches service error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  async updateSavedSearch(searchId: string, searchData: any, requestingUserId: string, requestingUserRole: string, requestingUserCompanyId: string) {
    try {
      // Check if search exists and user has permission
      const [existingSearch] = await db
        .select()
        .from(savedSearches)
        .where(and(
          eq(savedSearches.id, searchId),
          or(
            eq(savedSearches.userId, requestingUserId),
            and(
              eq(savedSearches.companyId, requestingUserCompanyId),
              eq(savedSearches.isPublic, true)
            )
          )
        ))
        .limit(1);

      if (!existingSearch) {
        return {
          success: false,
          message: 'Search not found or insufficient permissions',
        };
      }

      const [updatedSearch] = await db
        .update(savedSearches)
        .set({
          name: searchData.name || existingSearch.name,
          description: searchData.description || existingSearch.description,
          query: searchData.query || existingSearch.query,
          filters: searchData.filters || existingSearch.filters,
          isPublic: searchData.isPublic !== undefined ? searchData.isPublic : existingSearch.isPublic,
          updatedAt: new Date(),
        })
        .where(eq(savedSearches.id, searchId))
        .returning();

      logger.info(`Search updated: ${searchId} by ${requestingUserId}`);

      return {
        success: true,
        message: 'Search updated successfully',
        data: { search: updatedSearch },
      };
    } catch (error) {
      logger.error('Update saved search service error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  async deleteSavedSearch(searchId: string, requestingUserId: string, requestingUserRole: string, requestingUserCompanyId: string) {
    try {
      // Check if search exists and user has permission
      const [existingSearch] = await db
        .select()
        .from(savedSearches)
        .where(and(
          eq(savedSearches.id, searchId),
          or(
            eq(savedSearches.userId, requestingUserId),
            and(
              eq(savedSearches.companyId, requestingUserCompanyId),
              eq(savedSearches.isPublic, true)
            )
          )
        ))
        .limit(1);

      if (!existingSearch) {
        return {
          success: false,
          message: 'Search not found or insufficient permissions',
        };
      }

      await db.delete(savedSearches).where(eq(savedSearches.id, searchId));

      logger.info(`Search deleted: ${searchId} by ${requestingUserId}`);

      return {
        success: true,
        message: 'Search deleted successfully',
      };
    } catch (error) {
      logger.error('Delete saved search service error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  // Permission Management
  async getUserPermissions(userId: string, requestingUserId: string, requestingUserRole: string, requestingUserCompanyId: string) {
    try {
      // Check permissions
      if (requestingUserRole !== 'platform_admin' && userId !== requestingUserId) {
        const user = await this.getUserById(userId, requestingUserId, requestingUserRole, requestingUserCompanyId);
        if (!user) {
          return null;
        }
      }

      const permissions = await db
        .select()
        .from(userPermissions)
        .where(and(
          eq(userPermissions.userId, userId),
          eq(userPermissions.isActive, true)
        ));

      return permissions;
    } catch (error) {
      logger.error('Get user permissions service error:', error);
      throw error;
    }
  }

  async grantUserPermissions(userId: string, permissions: string[], requestingUserId: string, requestingUserRole: string, requestingUserCompanyId: string) {
    try {
      // Check permissions - only admins can grant permissions
      if (!['platform_admin', 'company_super_admin', 'company_admin'].includes(requestingUserRole)) {
        return {
          success: false,
          message: 'Insufficient permissions to grant permissions',
        };
      }

      const results = [];
      for (const permission of permissions) {
        try {
          const [newPermission] = await db
            .insert(userPermissions)
            .values({
              userId,
              companyId: requestingUserCompanyId,
              permission,
              grantedBy: requestingUserId,
            })
            .returning();
          results.push(newPermission);
        } catch (error) {
          // Permission might already exist, skip
        }
      }

      logger.info(`Permissions granted to user ${userId} by ${requestingUserId}`);

      return {
        success: true,
        message: 'Permissions granted successfully',
        data: { permissions: results },
      };
    } catch (error) {
      logger.error('Grant user permissions service error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  async revokeUserPermissions(userId: string, permissions: string[], requestingUserId: string, requestingUserRole: string, requestingUserCompanyId: string) {
    try {
      // Check permissions - only admins can revoke permissions
      if (!['platform_admin', 'company_super_admin', 'company_admin'].includes(requestingUserRole)) {
        return {
          success: false,
          message: 'Insufficient permissions to revoke permissions',
        };
      }

      await db
        .update(userPermissions)
        .set({ isActive: false })
        .where(and(
          eq(userPermissions.userId, userId),
          sql`${userPermissions.permission} = ANY(${permissions})`
        ));

      logger.info(`Permissions revoked from user ${userId} by ${requestingUserId}`);

      return {
        success: true,
        message: 'Permissions revoked successfully',
      };
    } catch (error) {
      logger.error('Revoke user permissions service error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  // Custom Reports
  async createCustomReport(reportData: any, requestingUserId: string, requestingUserRole: string, requestingUserCompanyId: string) {
    try {
      const [customReport] = await db
        .insert(customReports)
        .values({
          userId: requestingUserId,
          companyId: requestingUserCompanyId,
          name: reportData.name,
          description: reportData.description,
          type: reportData.type,
          filters: reportData.filters || {},
          dateRange: reportData.dateRange,
          format: reportData.format || 'json',
          schedule: reportData.schedule || {},
        })
        .returning();

      logger.info(`Custom report created: ${customReport.id} by ${requestingUserId}`);

      return {
        success: true,
        message: 'Custom report created successfully',
        data: { report: customReport },
      };
    } catch (error) {
      logger.error('Create custom report service error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  async getCustomReports(requestingUserId: string, requestingUserRole: string, requestingUserCompanyId: string) {
    try {
      const reports = await db
        .select()
        .from(customReports)
        .where(
          requestingUserRole === 'platform_admin'
            ? sql`1=1`
            : eq(customReports.companyId, requestingUserCompanyId)
        )
        .orderBy(desc(customReports.createdAt));

      return {
        success: true,
        data: { reports },
      };
    } catch (error) {
      logger.error('Get custom reports service error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  async generateReport(reportId: string, requestingUserId: string, requestingUserRole: string, requestingUserCompanyId: string) {
    try {
      // Get report configuration
      const [report] = await db
        .select()
        .from(customReports)
        .where(and(
          eq(customReports.id, reportId),
          eq(customReports.isActive, true)
        ))
        .limit(1);

      if (!report) {
        return {
          success: false,
          message: 'Report not found or inactive',
        };
      }

      // Create report history entry
      const [reportHistoryEntry] = await db
        .insert(reportHistory)
        .values({
          reportId,
          userId: requestingUserId,
          companyId: requestingUserCompanyId,
          status: 'pending',
        })
        .returning();

      // Update last generated timestamp
      await db
        .update(customReports)
        .set({ lastGenerated: new Date() })
        .where(eq(customReports.id, reportId));

      logger.info(`Report generation started: ${reportId} by ${requestingUserId}`);

      return {
        success: true,
        message: 'Report generation started',
        data: { reportHistory: reportHistoryEntry },
      };
    } catch (error) {
      logger.error('Generate report service error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  // Export by Role
  async exportUsersByRole(role: string, format: string, includeInactive: boolean, requestingUserId: string, requestingUserRole: string, requestingUserCompanyId: string) {
    try {
      // Check permissions
      if (!['platform_admin', 'company_super_admin', 'company_admin'].includes(requestingUserRole)) {
        return {
          success: false,
          message: 'Insufficient permissions to export users',
        };
      }

      // Build conditions
      const conditions = [];
      
      if (requestingUserRole === 'platform_admin') {
        // Platform admin can export any role
        conditions.push(eq(users.role, role));
      } else {
        // Company users can only export from their company
        conditions.push(eq(users.companyId, requestingUserCompanyId));
        conditions.push(eq(users.role, role));
      }
      
      if (!includeInactive) {
        conditions.push(eq(users.isActive, true));
      }

      const usersData = await db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          phone: users.phone,
          position: users.position,
          department: users.department,
          hireDate: users.hireDate,
          salary: users.salary,
          role: users.role,
          isActive: users.isActive,
          isVerified: users.isVerified,
          lastLogin: users.lastLogin,
          companyName: companies.name,
          createdAt: users.createdAt,
        })
        .from(users)
        .innerJoin(companies, eq(users.companyId, companies.id))
        .where(conditions.length > 0 ? and(...conditions) : sql`1=1`)
        .orderBy(desc(users.createdAt));

      // Generate export data based on format
      let exportData;
      if (format === 'csv') {
        const csvHeader = 'ID,Email,First Name,Last Name,Phone,Position,Department,Hire Date,Salary,Role,Active,Verified,Last Login,Company,Created At\n';
        const csvRows = usersData.map(user => 
          `${user.id},${user.email},${user.firstName},${user.lastName},${user.phone || ''},${user.position || ''},${user.department || ''},${user.hireDate || ''},${user.salary || ''},${user.role},${user.isActive},${user.isVerified},${user.lastLogin || ''},${user.companyName},${user.createdAt}`
        ).join('\n');
        exportData = csvHeader + csvRows;
      } else {
        exportData = usersData;
      }

      logger.info(`Users exported by role ${role} by ${requestingUserId}`);

      return {
        success: true,
        message: 'Users exported successfully',
        data: {
          format,
          count: usersData.length,
          exportData,
        },
      };
    } catch (error) {
      logger.error('Export users by role service error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }
}