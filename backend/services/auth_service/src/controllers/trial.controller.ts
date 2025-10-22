import { Request, Response } from 'express';
import { trialService } from '../services/trial.service';
import { logger } from '../utils/logger';

export class TrialController {
  /**
   * Check trial eligibility for a domain
   */
  async checkTrialEligibility(req: Request, res: Response): Promise<void> {
    try {
      const { domain } = req.params;

      if (!domain) {
        res.status(400).json({
          success: false,
          message: 'Domain is required'
        });
        return;
      }

      const result = await trialService.checkTrialEligibility(domain);

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('Trial eligibility check error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Start a new trial for a company
   */
  async startTrial(req: Request, res: Response): Promise<void> {
    try {
      const { companyId, domain } = req.body;
      const ipAddress = req.ip;
      const userAgent = req.get('User-Agent');

      if (!companyId || !domain) {
        res.status(400).json({
          success: false,
          message: 'Company ID and domain are required'
        });
        return;
      }

      const result = await trialService.startTrial(companyId, domain, ipAddress, userAgent);

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('Start trial error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get trial status for a company
   */
  async getTrialStatus(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = req.params;

      if (!companyId) {
        res.status(400).json({
          success: false,
          message: 'Company ID is required'
        });
        return;
      }

      const result = await trialService.getTrialStatus(companyId);

      res.status(result.isValid ? 200 : 400).json({
        success: result.isValid,
        message: result.message,
        trialStatus: result.trialStatus,
        trialEndsAt: result.trialEndsAt,
        daysRemaining: result.daysRemaining
      });
    } catch (error) {
      logger.error('Get trial status error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Convert trial to paid subscription
   */
  async convertTrialToPaid(req: Request, res: Response): Promise<void> {
    try {
      const { companyId, planId, billingCycle } = req.body;

      if (!companyId || !planId || !billingCycle) {
        res.status(400).json({
          success: false,
          message: 'Company ID, plan ID, and billing cycle are required'
        });
        return;
      }

      if (!['monthly', 'yearly'].includes(billingCycle)) {
        res.status(400).json({
          success: false,
          message: 'Billing cycle must be monthly or yearly'
        });
        return;
      }

      const result = await trialService.convertTrialToPaid(companyId, planId, billingCycle);

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('Convert trial to paid error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

export const trialController = new TrialController();
