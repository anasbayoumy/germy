import { eq, and, like, desc, count, sql } from 'drizzle-orm';
import { db } from '../config/database';
import { departments, userDepartments, users, companies } from '../db/schema';
import { logger } from '../utils/logger';

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
  role?: string;
}

export class DepartmentService {
  async getDepartments(companyId: string, page: number = 1, limit: number = 20, search?: string) {
    try {
      const offset = (page - 1) * limit;

      const conditions = [eq(departments.companyId, companyId)];
      
      if (search) {
        conditions.push(like(departments.name, `%${search}%`));
      }

      const baseQuery = db
        .select({
          id: departments.id,
          name: departments.name,
          description: departments.description,
          parentId: departments.parentId,
          parentName: sql<string>`parent.name`.as('parentName'),
          managerId: departments.managerId,
          managerName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`.as('managerName'),
          color: departments.color,
          isActive: departments.isActive,
          memberCount: count(userDepartments.id).as('memberCount'),
          createdAt: departments.createdAt,
          updatedAt: departments.updatedAt,
        })
        .from(departments)
        .leftJoin(users, eq(departments.managerId, users.id))
        .leftJoin(sql`departments parent`, eq(departments.parentId, sql`parent.id`))
        .leftJoin(userDepartments, and(eq(userDepartments.departmentId, departments.id), eq(userDepartments.isActive, true)))
        .where(and(...conditions))
        .groupBy(departments.id, users.firstName, users.lastName, sql`parent.name`);

      const [departmentsData, totalCount] = await Promise.all([
        baseQuery
          .orderBy(desc(departments.createdAt))
          .limit(limit)
          .offset(offset),
        db.select({ count: count() }).from(departments).where(eq(departments.companyId, companyId)),
      ]);

      return {
        departments: departmentsData,
        pagination: {
          page,
          limit,
          total: totalCount[0].count,
          pages: Math.ceil(totalCount[0].count / limit),
        },
      };
    } catch (error) {
      logger.error('Get departments service error:', error);
      throw error;
    }
  }

  async getDepartmentById(departmentId: string, companyId: string) {
    try {
      const department = await db
        .select({
          id: departments.id,
          name: departments.name,
          description: departments.description,
          parentId: departments.parentId,
          parentName: sql<string>`parent.name`.as('parentName'),
          managerId: departments.managerId,
          managerName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`.as('managerName'),
          color: departments.color,
          isActive: departments.isActive,
          createdAt: departments.createdAt,
          updatedAt: departments.updatedAt,
        })
        .from(departments)
        .leftJoin(users, eq(departments.managerId, users.id))
        .leftJoin(sql`departments parent`, eq(departments.parentId, sql`parent.id`))
        .where(and(eq(departments.id, departmentId), eq(departments.companyId, companyId)))
        .limit(1);

      return department[0] || null;
    } catch (error) {
      logger.error('Get department by ID service error:', error);
      throw error;
    }
  }

  async createDepartment(departmentData: CreateDepartmentData, companyId: string, createdBy: string) {
    try {
      // Check if department name already exists in company
      const existingDepartment = await db
        .select()
        .from(departments)
        .where(and(eq(departments.companyId, companyId), eq(departments.name, departmentData.name)))
        .limit(1);

      if (existingDepartment.length > 0) {
        return {
          success: false,
          message: 'Department name already exists in this company',
        };
      }

      // Validate parent department if provided
      if (departmentData.parentId) {
        const parentDepartment = await db
          .select()
          .from(departments)
          .where(and(eq(departments.id, departmentData.parentId), eq(departments.companyId, companyId)))
          .limit(1);

        if (parentDepartment.length === 0) {
          return {
            success: false,
            message: 'Parent department not found or not in the same company',
          };
        }
      }

      // Validate manager if provided
      if (departmentData.managerId) {
        const manager = await db
          .select()
          .from(users)
          .where(and(eq(users.id, departmentData.managerId), eq(users.companyId, companyId)))
          .limit(1);

        if (manager.length === 0) {
          return {
            success: false,
            message: 'Manager not found or not in the same company',
          };
        }
      }

      const [newDepartment] = await db
        .insert(departments)
        .values({
          companyId,
          name: departmentData.name,
          description: departmentData.description,
          parentId: departmentData.parentId,
          managerId: departmentData.managerId,
          color: departmentData.color || '#10B981',
        })
        .returning();

      logger.info(`Department created: ${newDepartment.name} in company ${companyId} by ${createdBy}`);

      return {
        success: true,
        message: 'Department created successfully',
        data: { department: newDepartment },
      };
    } catch (error) {
      logger.error('Create department service error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  async updateDepartment(departmentId: string, updateData: UpdateDepartmentData, companyId: string, updatedBy: string) {
    try {
      // Check if department exists
      const existingDepartment = await this.getDepartmentById(departmentId, companyId);
      if (!existingDepartment) {
        return {
          success: false,
          message: 'Department not found',
        };
      }

      // Check if new name conflicts (if name is being updated)
      if (updateData.name && updateData.name !== existingDepartment.name) {
        const conflictingDepartment = await db
          .select()
          .from(departments)
          .where(and(eq(departments.companyId, companyId), eq(departments.name, updateData.name)))
          .limit(1);

        if (conflictingDepartment.length > 0) {
          return {
            success: false,
            message: 'Department name already exists in this company',
          };
        }
      }

      // Validate parent department if provided
      if (updateData.parentId) {
        if (updateData.parentId === departmentId) {
          return {
            success: false,
            message: 'Department cannot be its own parent',
          };
        }

        const parentDepartment = await db
          .select()
          .from(departments)
          .where(and(eq(departments.id, updateData.parentId), eq(departments.companyId, companyId)))
          .limit(1);

        if (parentDepartment.length === 0) {
          return {
            success: false,
            message: 'Parent department not found or not in the same company',
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

      const [updatedDepartment] = await db
        .update(departments)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(and(eq(departments.id, departmentId), eq(departments.companyId, companyId)))
        .returning();

      logger.info(`Department updated: ${departmentId} by ${updatedBy}`);

      return {
        success: true,
        message: 'Department updated successfully',
        data: { department: updatedDepartment },
      };
    } catch (error) {
      logger.error('Update department service error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  async deleteDepartment(departmentId: string, companyId: string, deletedBy: string) {
    try {
      // Check if department exists
      const existingDepartment = await this.getDepartmentById(departmentId, companyId);
      if (!existingDepartment) {
        return {
          success: false,
          message: 'Department not found',
        };
      }

      // Check if department has active members
      const activeMembers = await db
        .select({ count: count() })
        .from(userDepartments)
        .where(and(eq(userDepartments.departmentId, departmentId), eq(userDepartments.isActive, true)));

      if (activeMembers[0].count > 0) {
        return {
          success: false,
          message: 'Cannot delete department with active members. Please remove all members first.',
        };
      }

      // Check if department has child departments
      const childDepartments = await db
        .select({ count: count() })
        .from(departments)
        .where(and(eq(departments.parentId, departmentId), eq(departments.isActive, true)));

      if (childDepartments[0].count > 0) {
        return {
          success: false,
          message: 'Cannot delete department with child departments. Please delete or move child departments first.',
        };
      }

      // Soft delete by setting isActive to false
      const [deletedDepartment] = await db
        .update(departments)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(and(eq(departments.id, departmentId), eq(departments.companyId, companyId)))
        .returning();

      logger.info(`Department deleted: ${departmentId} by ${deletedBy}`);

      return {
        success: true,
        message: 'Department deleted successfully',
        data: { department: deletedDepartment },
      };
    } catch (error) {
      logger.error('Delete department service error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  async getDepartmentUsers(departmentId: string, companyId: string) {
    try {
      const departmentUsers = await db
        .select({
          id: userDepartments.id,
          userId: userDepartments.userId,
          role: userDepartments.role,
          joinedAt: userDepartments.joinedAt,
          isActive: userDepartments.isActive,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          position: users.position,
          profilePhotoUrl: users.profilePhotoUrl,
        })
        .from(userDepartments)
        .innerJoin(users, eq(userDepartments.userId, users.id))
        .where(and(eq(userDepartments.departmentId, departmentId), eq(users.companyId, companyId)))
        .orderBy(desc(userDepartments.joinedAt));

      return departmentUsers;
    } catch (error) {
      logger.error('Get department users service error:', error);
      throw error;
    }
  }

  async addDepartmentUser(departmentId: string, userData: AddDepartmentUserData, companyId: string, addedBy: string) {
    try {
      // Check if department exists
      const department = await this.getDepartmentById(departmentId, companyId);
      if (!department) {
        return {
          success: false,
          message: 'Department not found',
        };
      }

      // Check if user exists and is in the same company
      const user = await db
        .select()
        .from(users)
        .where(and(eq(users.id, userData.userId), eq(users.companyId, companyId)))
        .limit(1);

      if (user.length === 0) {
        return {
          success: false,
          message: 'User not found or not in the same company',
        };
      }

      // Check if user is already in the department
      const existingMembership = await db
        .select()
        .from(userDepartments)
        .where(and(eq(userDepartments.departmentId, departmentId), eq(userDepartments.userId, userData.userId)))
        .limit(1);

      if (existingMembership.length > 0) {
        if (existingMembership[0].isActive) {
          return {
            success: false,
            message: 'User is already in this department',
          };
        } else {
          // Reactivate existing membership
          const [reactivatedMembership] = await db
            .update(userDepartments)
            .set({
              isActive: true,
              role: userData.role || 'member',
              joinedAt: new Date(),
              leftAt: null,
            })
            .where(eq(userDepartments.id, existingMembership[0].id))
            .returning();

          logger.info(`Department user reactivated: ${userData.userId} in department ${departmentId} by ${addedBy}`);

          return {
            success: true,
            message: 'User added to department successfully',
            data: { membership: reactivatedMembership },
          };
        }
      }

      // Add new user
      const [newMembership] = await db
        .insert(userDepartments)
        .values({
          departmentId,
          userId: userData.userId,
          role: userData.role || 'member',
        })
        .returning();

      logger.info(`Department user added: ${userData.userId} to department ${departmentId} by ${addedBy}`);

      return {
        success: true,
        message: 'User added to department successfully',
        data: { membership: newMembership },
      };
    } catch (error) {
      logger.error('Add department user service error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  async removeDepartmentUser(departmentId: string, userId: string, companyId: string, removedBy: string) {
    try {
      // Check if department exists
      const department = await this.getDepartmentById(departmentId, companyId);
      if (!department) {
        return {
          success: false,
          message: 'Department not found',
        };
      }

      // Check if membership exists
      const membership = await db
        .select()
        .from(userDepartments)
        .where(and(eq(userDepartments.departmentId, departmentId), eq(userDepartments.userId, userId)))
        .limit(1);

      if (membership.length === 0 || !membership[0].isActive) {
        return {
          success: false,
          message: 'User is not in this department',
        };
      }

      // Soft remove by setting isActive to false
      const [removedMembership] = await db
        .update(userDepartments)
        .set({
          isActive: false,
          leftAt: new Date(),
        })
        .where(eq(userDepartments.id, membership[0].id))
        .returning();

      logger.info(`Department user removed: ${userId} from department ${departmentId} by ${removedBy}`);

      return {
        success: true,
        message: 'User removed from department successfully',
        data: { membership: removedMembership },
      };
    } catch (error) {
      logger.error('Remove department user service error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  async getDepartmentHierarchy(companyId: string) {
    try {
      const allDepartments = await db
        .select({
          id: departments.id,
          name: departments.name,
          description: departments.description,
          parentId: departments.parentId,
          managerId: departments.managerId,
          managerName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`.as('managerName'),
          color: departments.color,
          isActive: departments.isActive,
          memberCount: count(userDepartments.id).as('memberCount'),
        })
        .from(departments)
        .leftJoin(users, eq(departments.managerId, users.id))
        .leftJoin(userDepartments, and(eq(userDepartments.departmentId, departments.id), eq(userDepartments.isActive, true)))
        .where(and(eq(departments.companyId, companyId), eq(departments.isActive, true)))
        .groupBy(departments.id, users.firstName, users.lastName)
        .orderBy(departments.name);

      // Build hierarchy tree
      const departmentMap = new Map();
      const rootDepartments: any[] = [];

      // First pass: create map of all departments
      allDepartments.forEach((dept: any) => {
        departmentMap.set(dept.id, { ...dept, children: [] });
      });

      // Second pass: build hierarchy
      allDepartments.forEach((dept: any) => {
        if (dept.parentId && departmentMap.has(dept.parentId)) {
          departmentMap.get(dept.parentId).children.push(departmentMap.get(dept.id));
        } else {
          rootDepartments.push(departmentMap.get(dept.id));
        }
      });

      return rootDepartments;
    } catch (error) {
      logger.error('Get department hierarchy service error:', error);
      throw error;
    }
  }
}