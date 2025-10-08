import { Request, Response } from 'express';
import { PlatformService } from '../services/platform.service';
import { logger } from '../utils/logger';

export class PlatformController {
  private platformService = new PlatformService();

  async getCompanies(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 10, search } = req.query;
      
      const result = await this.platformService.getCompanies({
        page: Number(page),
        limit: Number(limit),
        search: search as string,
      });

      res.json({
        success: true,
        data: result,
      });
      return;
    } catch (error) {
      logger.error('Get companies controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
      return;
    }
  }

  async createCompany(req: Request, res: Response): Promise<void> {
    try {
      const companyData = req.body;
      
      const result = await this.platformService.createCompany(companyData);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(201).json(result);
      return;
    } catch (error) {
      logger.error('Create company controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
      return;
    }
  }

  async updateCompany(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const result = await this.platformService.updateCompany(id, updateData);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.json(result);
      return;
    } catch (error) {
      logger.error('Update company controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
      return;
    }
  }

  async getSubscriptions(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 10, status } = req.query;
      
      const result = await this.platformService.getSubscriptions({
        page: Number(page),
        limit: Number(limit),
        status: status as string,
      });

      res.json({
        success: true,
        data: result,
      });
      return;
    } catch (error) {
      logger.error('Get subscriptions controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
      return;
    }
  }
}
