import { Response } from 'express';
import { TeamService } from '../services/team.service';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class TeamController {
  private readonly teamService = new TeamService();

  async getTeams(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 20, search } = req.query;
      const { companyId } = req.user!;

      const result = await this.teamService.getTeams(
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
      logger.error('Get teams controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
      return;
    }
  }

  async getTeamById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { companyId } = req.user!;

      const team = await this.teamService.getTeamById(id, companyId);

      if (!team) {
        res.status(404).json({
          success: false,
          message: 'Team not found',
        });
        return;
      }

      res.json({
        success: true,
        data: { team },
      });
      return;
    } catch (error) {
      logger.error('Get team by ID controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
      return;
    }
  }

  async createTeam(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const teamData = req.body;
      const { userId, companyId } = req.user!;

      const result = await this.teamService.createTeam(teamData, companyId, userId);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(201).json(result);
      return;
    } catch (error) {
      logger.error('Create team controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
      return;
    }
  }

  async updateTeam(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const { userId, companyId } = req.user!;

      const result = await this.teamService.updateTeam(id, updateData, companyId, userId);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.json(result);
      return;
    } catch (error) {
      logger.error('Update team controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
      return;
    }
  }

  async deleteTeam(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { userId, companyId } = req.user!;

      const result = await this.teamService.deleteTeam(id, companyId, userId);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.json(result);
      return;
    } catch (error) {
      logger.error('Delete team controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
      return;
    }
  }


  async addTeamMember(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const memberData = req.body;
      const { userId, companyId } = req.user!;

      const result = await this.teamService.addTeamMember(id, memberData, companyId, userId);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(201).json(result);
      return;
    } catch (error) {
      logger.error('Add team member controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
      return;
    }
  }

  async removeTeamMember(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id, userId } = req.params;
      const { userId: requestingUserId, companyId } = req.user!;

      const result = await this.teamService.removeTeamMember(id, userId, companyId, requestingUserId);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.json(result);
      return;
    } catch (error) {
      logger.error('Remove team member controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
      return;
    }
  }

  // Enhanced team controller methods
  async getTeamMembers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { companyId } = req.user!;
      const { page = 1, limit = 20, role, isActive } = req.query;

      const result = await this.teamService.getTeamMembers(
        id,
        companyId,
        Number(page),
        Number(limit),
        role as string,
        isActive === 'true'
      );

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      logger.error('Get team members controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async updateTeamMember(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id, userId } = req.params;
      const { companyId, userId: requestingUserId } = req.user!;
      const updateData = req.body;

      const result = await this.teamService.updateTeamMember(
        id,
        userId,
        companyId,
        updateData,
        requestingUserId
      );

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      logger.error('Update team member controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async bulkAddTeamMembers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { companyId, userId: requestingUserId } = req.user!;
      const { userIds, roleInTeam } = req.body;

      const result = await this.teamService.bulkAddTeamMembers(
        id,
        companyId,
        userIds,
        requestingUserId,
        roleInTeam
      );

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      logger.error('Bulk add team members controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async bulkRemoveTeamMembers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { companyId, userId: requestingUserId } = req.user!;
      const { userIds } = req.body;

      const result = await this.teamService.bulkRemoveTeamMembers(
        id,
        companyId,
        userIds,
        requestingUserId
      );

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      logger.error('Bulk remove team members controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async getTeamAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { companyId } = req.user!;
      const { period = '30d' } = req.query;

      const result = await this.teamService.getTeamAnalytics(id, companyId, period as string);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      logger.error('Get team analytics controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async exportTeamMembers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { companyId } = req.user!;
      const { format = 'csv', includeInactive = false } = req.query;

      const result = await this.teamService.exportTeamMembers(
        id,
        companyId,
        format as string,
        includeInactive === 'true'
      );

      if (result.success && result.data) {
        if (format === 'csv') {
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', `attachment; filename="${result.data.filename}"`);
          res.status(200).send(result.data.content);
        } else {
          res.status(200).json(result);
        }
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      logger.error('Export team members controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
}