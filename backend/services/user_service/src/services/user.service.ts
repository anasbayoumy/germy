import { eq, and, or, like, desc, count, sql } from 'drizzle-orm';
import { db } from '../config/database';
import { users, companies, userPreferences, userSettings, userActivities } from '../db/schema';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

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
        // Debug: Log the search query
        console.log(`Search query: "${search}"`);
        console.log(`Users table:`, users);
        console.log(`Users email field:`, users.email);
        
        // Try a simpler approach - just search in email first
        conditions.push(
          sql`${users.email} ILIKE ${'%' + search + '%'}`
        );
        
        console.log(`Conditions after search:`, conditions);
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
      throw error;
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

          // Create user (without password - they'll need to set it)
          const [newUser] = await db
            .insert(users)
            .values({
              email: userData.email,
              password: 'temp_password_import', // Should be changed on first login
              firstName: userData.firstName,
              lastName: userData.lastName,
              phone: userData.phone,
              position: userData.position,
              department: userData.department,
              hireDate: userData.hireDate ? new Date(userData.hireDate) : null,
              salary: userData.salary,
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
    } catch (error) {
      logger.error('Failed to log user activity:', error);
    }
  }
}