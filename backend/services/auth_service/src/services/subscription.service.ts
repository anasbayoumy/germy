import { db } from '../config/database';
import { 
  companies, 
  companyEmployeeCounts,
  users 
} from '../db/schema';
import { 
  companySubscriptions, 
  subscriptionPlans 
} from '../db/schema/platform';
import { eq, and, count } from 'drizzle-orm';
import { logger } from '../utils/logger';

export interface SubscriptionResult {
  success: boolean;
  message: string;
  subscription?: any;
  plan?: any;
}

export interface EmployeeLimitResult {
  canAddEmployee: boolean;
  message: string;
  currentCount: number;
  maxAllowed: number;
  upgradeRequired: boolean;
  suggestedPlan?: any;
}

export interface PlanUpgradeResult {
  success: boolean;
  message: string;
  newPlan?: any;
  upgradeRequired: boolean;
}

export class SubscriptionService {
  /**
   * Get all available subscription plans
   */
  async getAvailablePlans(): Promise<SubscriptionResult> {
    try {
      const plans = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.isActive, true))
        .orderBy(subscriptionPlans.priceMonthly);

      return {
        success: true,
        message: 'Plans retrieved successfully',
        subscription: plans
      };
    } catch (error) {
      logger.error('Error getting available plans:', error);
      return {
        success: false,
        message: 'Error retrieving subscription plans'
      };
    }
  }

  /**
   * Get company's current subscription
   */
  async getCompanySubscription(companyId: string): Promise<SubscriptionResult> {
    try {
      const subscription = await db
        .select({
          subscription: companySubscriptions,
          plan: subscriptionPlans
        })
        .from(companySubscriptions)
        .innerJoin(subscriptionPlans, eq(companySubscriptions.planId, subscriptionPlans.id))
        .where(and(
          eq(companySubscriptions.companyId, companyId),
          eq(companySubscriptions.status, 'active')
        ))
        .limit(1);

      if (subscription.length === 0) {
        return {
          success: false,
          message: 'No active subscription found'
        };
      }

      return {
        success: true,
        message: 'Subscription retrieved successfully',
        subscription: subscription[0].subscription,
        plan: subscription[0].plan
      };
    } catch (error) {
      logger.error('Error getting company subscription:', error);
      return {
        success: false,
        message: 'Error retrieving subscription'
      };
    }
  }

  /**
   * Check if company can add more employees
   */
  async checkEmployeeLimit(companyId: string): Promise<EmployeeLimitResult> {
    try {
      // TEMPORARY: Bypass employee limit check
      // TODO: Fix subscription service database queries
      return {
        canAddEmployee: true,
        message: 'Employee limit check bypassed',
        currentCount: 0,
        maxAllowed: 999999,
        upgradeRequired: false
      };

    } catch (error) {
      logger.error('Error checking employee limit:', error);
      return {
        canAddEmployee: false,
        message: 'Error checking employee limit',
        currentCount: 0,
        maxAllowed: 0,
        upgradeRequired: true
      };
    }
  }

  /**
   * Get current employee count for a company
   */
  async getCurrentEmployeeCount(companyId: string): Promise<number> {
    try {
      const result = await db
        .select({ count: count() })
        .from(users)
        .where(and(
          eq(users.companyId, companyId),
          eq(users.isActive, true)
        ));

      return result[0]?.count || 0;
    } catch (error) {
      logger.error('Error getting employee count:', error);
      return 0;
    }
  }

  /**
   * Update employee count tracking
   */
  async updateEmployeeCount(companyId: string): Promise<void> {
    try {
      const totalCount = await this.getCurrentEmployeeCount(companyId);
      
      // Get admin counts
      const adminCount = await db
        .select({ count: count() })
        .from(users)
        .where(and(
          eq(users.companyId, companyId),
          eq(users.role, 'company_admin'),
          eq(users.isActive, true)
        ));

      const superAdminCount = await db
        .select({ count: count() })
        .from(users)
        .where(and(
          eq(users.companyId, companyId),
          eq(users.role, 'company_super_admin'),
          eq(users.isActive, true)
        ));

      // Update or insert employee count record
      await db
        .insert(companyEmployeeCounts)
        .values({
          companyId,
          totalEmployees: totalCount,
          activeEmployees: totalCount,
          adminsCount: adminCount[0]?.count || 0,
          superAdminsCount: superAdminCount[0]?.count || 0,
          lastUpdated: new Date()
        })
        .onConflictDoUpdate({
          target: companyEmployeeCounts.companyId,
          set: {
            totalEmployees: totalCount,
            activeEmployees: totalCount,
            adminsCount: adminCount[0]?.count || 0,
            superAdminsCount: superAdminCount[0]?.count || 0,
            lastUpdated: new Date()
          }
        });

      logger.info(`Updated employee count for company ${companyId}: ${totalCount} employees`);
    } catch (error) {
      logger.error('Error updating employee count:', error);
    }
  }

  /**
   * Get next available plan for upgrade
   */
  private async getNextPlan(currentPlanId: string): Promise<any> {
    try {
      const currentPlan = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, currentPlanId))
        .limit(1);

      if (currentPlan.length === 0) {
        return null;
      }

      const currentMaxEmployees = currentPlan[0].maxEmployees;

      // Find next plan with higher employee limit
      const nextPlan = await db
        .select()
        .from(subscriptionPlans)
        .where(and(
          eq(subscriptionPlans.isActive, true),
          // This would need a proper comparison - for now return enterprise
          eq(subscriptionPlans.name, 'Enterprise')
        ))
        .limit(1);

      return nextPlan[0] || null;
    } catch (error) {
      logger.error('Error getting next plan:', error);
      return null;
    }
  }

  /**
   * Check if company needs to upgrade plan
   */
  async checkUpgradeNeeded(companyId: string): Promise<PlanUpgradeResult> {
    try {
      const limitResult = await this.checkEmployeeLimit(companyId);
      
      if (limitResult.upgradeRequired) {
        return {
          success: false,
          message: limitResult.message,
          upgradeRequired: true,
          newPlan: limitResult.suggestedPlan
        };
      }

      return {
        success: true,
        message: 'No upgrade needed',
        upgradeRequired: false
      };
    } catch (error) {
      logger.error('Error checking upgrade needed:', error);
      return {
        success: false,
        message: 'Error checking upgrade status',
        upgradeRequired: true
      };
    }
  }

  /**
   * Get enterprise contact information
   */
  async getEnterpriseContact(): Promise<{ email: string; phone: string; message: string }> {
    return {
      email: 'enterprise@germy.com',
      phone: '+1-800-GERMY-1',
      message: 'Contact our enterprise team for custom pricing and features tailored to your organization\'s needs.'
    };
  }

  /**
   * Validate plan upgrade
   */
  async validatePlanUpgrade(companyId: string, newPlanId: string): Promise<SubscriptionResult> {
    try {
      // Get current subscription
      const currentSubscription = await this.getCompanySubscription(companyId);
      if (!currentSubscription.success) {
        return {
          success: false,
          message: 'No current subscription found'
        };
      }

      // Get new plan
      const newPlan = await db
        .select()
        .from(subscriptionPlans)
        .where(and(
          eq(subscriptionPlans.id, newPlanId),
          eq(subscriptionPlans.isActive, true)
        ))
        .limit(1);

      if (newPlan.length === 0) {
        return {
          success: false,
          message: 'Invalid plan selected'
        };
      }

      const currentPlan = currentSubscription.plan;
      const selectedPlan = newPlan[0];

      // Check if it's actually an upgrade
      if (selectedPlan.maxEmployees <= currentPlan.maxEmployees) {
        return {
          success: false,
          message: 'Selected plan does not provide more capacity than current plan'
        };
      }

      return {
        success: true,
        message: 'Plan upgrade is valid',
        plan: selectedPlan
      };

    } catch (error) {
      logger.error('Error validating plan upgrade:', error);
      return {
        success: false,
        message: 'Error validating plan upgrade'
      };
    }
  }
}

export const subscriptionService = new SubscriptionService();
