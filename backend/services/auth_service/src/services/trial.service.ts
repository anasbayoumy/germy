import { db } from '../config/database';
import { companies, companyTrialHistory } from '../db/schema';
import { companySubscriptions, subscriptionPlans } from '../db/schema/platform';
import { eq, and, desc } from 'drizzle-orm';
import { logger } from '../utils/logger';

export interface TrialResult {
  success: boolean;
  message: string;
  trialStatus?: 'new' | 'active' | 'expired' | 'used';
  trialEndsAt?: Date;
  daysRemaining?: number;
}

export interface TrialValidationResult {
  isValid: boolean;
  message: string;
  trialStatus?: 'active' | 'expired' | 'used';
  trialEndsAt?: Date;
  daysRemaining?: number;
}

export class TrialService {
  /**
   * Check if a company domain has used their free trial
   */
  async checkTrialEligibility(domain: string): Promise<TrialResult> {
    try {
      logger.info(`Checking trial eligibility for domain: ${domain}`);

      // Check if domain has used trial before
      const existingTrial = await db
        .select()
        .from(companyTrialHistory)
        .where(eq(companyTrialHistory.companyDomain, domain))
        .limit(1);

      if (existingTrial.length > 0) {
        const trial = existingTrial[0];
        
        if (trial.trialStatus === 'converted') {
          return {
            success: false,
            message: 'This company has already converted to a paid plan',
            trialStatus: 'used'
          };
        }

        if (trial.trialStatus === 'expired') {
          return {
            success: false,
            message: 'Free trial has already been used for this domain',
            trialStatus: 'used'
          };
        }

        if (trial.trialStatus === 'active') {
          const now = new Date();
          const trialEndsAt = new Date(trial.trialStartedAt);
          trialEndsAt.setDate(trialEndsAt.getDate() + 7); // 7 days from start

          if (now > trialEndsAt) {
            // Trial expired
            await this.expireTrial(trial.id);
            return {
              success: false,
              message: 'Free trial has expired. Please upgrade to continue.',
              trialStatus: 'expired'
            };
          }

          const daysRemaining = Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return {
            success: true,
            message: `Free trial is active. ${daysRemaining} days remaining.`,
            trialStatus: 'active',
            trialEndsAt,
            daysRemaining
          };
        }
      }

      // No trial found - eligible for new trial
      return {
        success: true,
        message: 'Domain is eligible for 7-day free trial',
        trialStatus: 'new'
      };

    } catch (error) {
      logger.error('Error checking trial eligibility:', error);
      return {
        success: false,
        message: 'Error checking trial eligibility'
      };
    }
  }

  /**
   * Start a new 7-day free trial for a company
   */
  async startTrial(companyId: string, domain: string, ipAddress?: string, userAgent?: string): Promise<TrialResult> {
    try {
      logger.info(`Starting trial for company: ${companyId}, domain: ${domain}`);

      // Check eligibility first
      const eligibility = await this.checkTrialEligibility(domain);
      logger.info(`Trial eligibility check result:`, eligibility);
      
      if (!eligibility.success || eligibility.trialStatus !== 'new') {
        logger.warn(`Trial not eligible: ${eligibility.message}`);
        return eligibility;
      }

      // Get the Basic plan (first plan)
      logger.info('Fetching Basic subscription plan...');
      const basicPlan = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.name, 'Basic'))
        .limit(1);

      logger.info(`Basic plan query result:`, basicPlan);

      if (basicPlan.length === 0) {
        logger.error('Basic subscription plan not found in database');
        return {
          success: false,
          message: 'Basic subscription plan not found'
        };
      }

      const now = new Date();
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 7); // 7 days from now

      logger.info(`Creating trial history record for company: ${companyId}`);
      // Create trial history record
      const trialHistoryResult = await db.insert(companyTrialHistory).values({
        companyDomain: domain,
        companyId,
        trialStartedAt: now,
        trialStatus: 'active',
        ipAddress,
        userAgent
      });
      logger.info(`Trial history record created:`, trialHistoryResult);

      logger.info(`Creating subscription record for company: ${companyId}`);
      // Create subscription with trial status
      try {
        const subscriptionResult = await db.insert(companySubscriptions).values({
          companyId,
          planId: basicPlan[0].id,
          status: 'trial',
          billingCycle: 'monthly',
          currentPeriodStart: now,
          currentPeriodEnd: trialEndsAt,
          trialEndsAt
        });
        logger.info(`Subscription record created successfully:`, subscriptionResult);
      } catch (subscriptionError) {
        logger.error('Failed to create subscription record:', subscriptionError);
        // If subscription creation fails, we should still return success for trial history
        // but log the error for debugging
        logger.warn('Trial history created but subscription record failed. This may cause validation issues.');
      }

      logger.info(`Trial started successfully for company: ${companyId}`);
      
      return {
        success: true,
        message: '7-day free trial started successfully',
        trialStatus: 'active',
        trialEndsAt,
        daysRemaining: 7
      };

    } catch (error) {
      logger.error('Error starting trial:', error);
      return {
        success: false,
        message: 'Error starting trial'
      };
    }
  }

  /**
   * Validate if a company's trial is still active
   */
  async validateTrial(companyId: string): Promise<TrialValidationResult> {
    try {
      logger.info(`Validating trial for company: ${companyId}`);
      
      // Get company's current subscription
      const subscription = await db
        .select()
        .from(companySubscriptions)
        .where(and(
          eq(companySubscriptions.companyId, companyId),
          eq(companySubscriptions.status, 'trial')
        ))
        .limit(1);

      logger.info(`Subscription query result for company ${companyId}:`, subscription);

      // Debug: Let's also check all subscriptions for this company
      const allSubscriptions = await db
        .select()
        .from(companySubscriptions)
        .where(eq(companySubscriptions.companyId, companyId));
      logger.info(`All subscriptions for company ${companyId}:`, allSubscriptions);

      if (subscription.length === 0) {
        logger.warn(`No active trial found for company: ${companyId}`);
        return {
          isValid: false,
          message: 'No active trial found'
        };
      }

      const sub = subscription[0];
      const now = new Date();
      const trialEndsAt = sub.trialEndsAt;

      if (!trialEndsAt) {
        return {
          isValid: false,
          message: 'Trial end date not found'
        };
      }

      if (now > trialEndsAt) {
        // Trial expired
        await this.expireTrialByCompanyId(companyId);
        return {
          isValid: false,
          message: 'Trial has expired. Please upgrade to continue.',
          trialStatus: 'expired'
        };
      }

      const daysRemaining = Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        isValid: true,
        message: `Trial is active. ${daysRemaining} days remaining.`,
        trialStatus: 'active',
        trialEndsAt,
        daysRemaining
      };

    } catch (error) {
      logger.error('Error validating trial:', error);
      return {
        isValid: false,
        message: 'Error validating trial'
      };
    }
  }

  /**
   * Expire a trial by trial history ID
   */
  private async expireTrial(trialHistoryId: string): Promise<void> {
    try {
      await db
        .update(companyTrialHistory)
        .set({
          trialStatus: 'expired',
          trialEndedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(companyTrialHistory.id, trialHistoryId));

      logger.info(`Trial expired: ${trialHistoryId}`);
    } catch (error) {
      logger.error('Error expiring trial:', error);
    }
  }

  /**
   * Expire a trial by company ID
   */
  private async expireTrialByCompanyId(companyId: string): Promise<void> {
    try {
      // Update trial history
      await db
        .update(companyTrialHistory)
        .set({
          trialStatus: 'expired',
          trialEndedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(companyTrialHistory.companyId, companyId));

      // Update subscription status
      await db
        .update(companySubscriptions)
        .set({
          status: 'cancelled',
          cancelledAt: new Date(),
          updatedAt: new Date()
        })
        .where(and(
          eq(companySubscriptions.companyId, companyId),
          eq(companySubscriptions.status, 'trial')
        ));

      logger.info(`Trial expired for company: ${companyId}`);
    } catch (error) {
      logger.error('Error expiring trial by company ID:', error);
    }
  }

  /**
   * Convert trial to paid subscription
   */
  async convertTrialToPaid(companyId: string, planId: string, billingCycle: 'monthly' | 'yearly'): Promise<TrialResult> {
    try {
      logger.info(`Converting trial to paid for company: ${companyId}, plan: ${planId}`);

      // Update trial history
      await db
        .update(companyTrialHistory)
        .set({
          trialStatus: 'converted',
          trialEndedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(companyTrialHistory.companyId, companyId));

      // Update subscription
      const now = new Date();
      const periodEnd = new Date();
      if (billingCycle === 'monthly') {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      } else {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      }

      await db
        .update(companySubscriptions)
        .set({
          planId,
          status: 'active',
          billingCycle,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          trialEndsAt: null,
          updatedAt: new Date()
        })
        .where(and(
          eq(companySubscriptions.companyId, companyId),
          eq(companySubscriptions.status, 'trial')
        ));

      logger.info(`Trial converted to paid successfully for company: ${companyId}`);
      
      return {
        success: true,
        message: 'Trial converted to paid subscription successfully'
      };

    } catch (error) {
      logger.error('Error converting trial to paid:', error);
      return {
        success: false,
        message: 'Error converting trial to paid subscription'
      };
    }
  }

  /**
   * Get trial status for a company
   */
  async getTrialStatus(companyId: string): Promise<TrialValidationResult> {
    return this.validateTrial(companyId);
  }
}

export const trialService = new TrialService();
