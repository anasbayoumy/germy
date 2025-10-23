import { Request, Response } from 'express';
import { DepartmentService } from '../services/department.service';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class DepartmentController {
  private readonly departmentService = new DepartmentService();

  async getDepartments(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 20, search } = req.query;
      const { companyId } = req.user!;

      const result = await this.departmentService.getDepartments(
        companyId,
        Number(page),
        Number(limit),
        search as string
      );

      res.json({
        success: true,
        data: result,
      });
      return;
    } catch (error) {
      logger.error('Get departments controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
      return;
    }
  }

  async getDepartmentById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { companyId } = req.user!;

      const department = await this.departmentService.getDepartmentById(id, companyId);

      if (!department) {
        res.status(404).json({
          success: false,
          message: 'Department not found',
        });
        return;
      }

      res.json({
        success: true,
        data: { department },
      });
      return;
    } catch (error) {
      logger.error('Get department by ID controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
      return;
    }
  }

  async createDepartment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const departmentData = req.body;
      const { userId, companyId } = req.user!;

      const result = await this.departmentService.createDepartment(departmentData, companyId, userId);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(201).json(result);
      return;
    } catch (error) {
      logger.error('Create department controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
      return;
    }
  }

  async updateDepartment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const { userId, companyId } = req.user!;

      const result = await this.departmentService.updateDepartment(id, updateData, companyId, userId);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.json(result);
      return;
    } catch (error) {
      logger.error('Update department controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
      return;
    }
  }

  async deleteDepartment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { userId, companyId } = req.user!;

      const result = await this.departmentService.deleteDepartment(id, companyId, userId);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.json(result);
      return;
    } catch (error) {
      logger.error('Delete department controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
      return;
    }
  }

  async getDepartmentUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { companyId } = req.user!;

      const users = await this.departmentService.getDepartmentUsers(id, companyId);

      res.json({
        success: true,
        data: { users },
      });
      return;
    } catch (error) {
      logger.error('Get department users controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
      return;
    }
  }

  async addDepartmentUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userData = req.body;
      const { userId, companyId } = req.user!;

      const result = await this.departmentService.addDepartmentUser(id, userData, companyId, userId);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(201).json(result);
      return;
    } catch (error) {
      logger.error('Add department user controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
      return;
    }
  }

  async removeDepartmentUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id, userId } = req.params;
      const { userId: requestingUserId, companyId } = req.user!;

      const result = await this.departmentService.removeDepartmentUser(id, userId, companyId, requestingUserId);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.json(result);
      return;
    } catch (error) {
      logger.error('Remove department user controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
      return;
    }
  }

  async getDepartmentHierarchy(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { companyId } = req.user!;
      const { departmentId, includeInactive, maxDepth } = req.query;

      const hierarchy = await this.departmentService.getDepartmentHierarchy(
        departmentId as string || '',
        companyId,
        includeInactive === 'true',
        maxDepth ? Number.parseInt(maxDepth as string) : 5
      );

      res.json({
        success: true,
        data: { hierarchy },
      });
      return;
    } catch (error) {
      logger.error('Get department hierarchy controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
      return;
    }
  }
}