import { Request, Response } from 'express';
import { subscriptionService } from '../services/subscription.service';
import { logger } from '../utils/logger';

export class SubscriptionController {
  /**
   * Get all available subscription plans
   */
  async getAvailablePlans(req: Request, res: Response): Promise<void> {
    try {
      const result = await subscriptionService.getAvailablePlans();

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('Get available plans error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get company's current subscription
   */
  async getCompanySubscription(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = req.params;

      if (!companyId) {
        res.status(400).json({
          success: false,
          message: 'Company ID is required'
        });
        return;
      }

      const result = await subscriptionService.getCompanySubscription(companyId);

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('Get company subscription error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Check employee limit for a company
   */
  async checkEmployeeLimit(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = req.params;

      if (!companyId) {
        res.status(400).json({
          success: false,
          message: 'Company ID is required'
        });
        return;
      }

      const result = await subscriptionService.checkEmployeeLimit(companyId);

      res.status(200).json({
        success: true,
        canAddEmployee: result.canAddEmployee,
        message: result.message,
        currentCount: result.currentCount,
        maxAllowed: result.maxAllowed,
        upgradeRequired: result.upgradeRequired,
        suggestedPlan: result.suggestedPlan
      });
    } catch (error) {
      logger.error('Check employee limit error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Check if company needs to upgrade
   */
  async checkUpgradeNeeded(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = req.params;

      if (!companyId) {
        res.status(400).json({
          success: false,
          message: 'Company ID is required'
        });
        return;
      }

      const result = await subscriptionService.checkUpgradeNeeded(companyId);

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('Check upgrade needed error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get enterprise contact information
   */
  async getEnterpriseContact(req: Request, res: Response): Promise<void> {
    try {
      const contactInfo = await subscriptionService.getEnterpriseContact();

      res.status(200).json({
        success: true,
        message: 'Enterprise contact information retrieved',
        data: contactInfo
      });
    } catch (error) {
      logger.error('Get enterprise contact error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Validate plan upgrade
   */
  async validatePlanUpgrade(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = req.params;
      const { newPlanId } = req.body;

      if (!companyId || !newPlanId) {
        res.status(400).json({
          success: false,
          message: 'Company ID and new plan ID are required'
        });
        return;
      }

      const result = await subscriptionService.validatePlanUpgrade(companyId, newPlanId);

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('Validate plan upgrade error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Update employee count for a company
   */
  async updateEmployeeCount(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = req.params;

      if (!companyId) {
        res.status(400).json({
          success: false,
          message: 'Company ID is required'
        });
        return;
      }

      await subscriptionService.updateEmployeeCount(companyId);

      res.status(200).json({
        success: true,
        message: 'Employee count updated successfully'
      });
    } catch (error) {
      logger.error('Update employee count error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

export const subscriptionController = new SubscriptionController();
