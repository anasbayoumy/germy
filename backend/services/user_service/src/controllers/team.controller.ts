import { Request, Response } from 'express';
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

  async getTeamMembers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { companyId } = req.user!;

      const members = await this.teamService.getTeamMembers(id, companyId);

      res.json({
        success: true,
        data: { members },
      });
      return;
    } catch (error) {
      logger.error('Get team members controller error:', error);
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
}