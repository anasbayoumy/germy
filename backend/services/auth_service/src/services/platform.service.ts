import { eq, like, desc, count } from 'drizzle-orm';
import { db } from '../config/database';
import { companies, companySubscriptions, subscriptionPlans, users } from '../db/schema';
import { logger } from '../utils/logger';

export interface GetCompaniesOptions {
  page: number;
  limit: number;
  search?: string;
}

export interface GetSubscriptionsOptions {
  page: number;
  limit: number;
  status?: string;
}

export class PlatformService {
  async getCompanies(options: GetCompaniesOptions) {
    try {
      const { page, limit, search } = options;
      const offset = (page - 1) * limit;

      // Build base query
      const baseQuery = db
        .select({
          id: companies.id,
          name: companies.name,
          domain: companies.domain,
          industry: companies.industry,
          companySize: companies.companySize,
          isActive: companies.isActive,
          createdAt: companies.createdAt,
          userCount: count(users.id),
        })
        .from(companies)
        .leftJoin(users, eq(companies.id, users.companyId))
        .groupBy(companies.id);

      // Apply search filter if provided
      const query = search 
        ? baseQuery.where(like(companies.name, `%${search}%`))
        : baseQuery;

      const [companiesData, totalCount] = await Promise.all([
        query
          .orderBy(desc(companies.createdAt))
          .limit(limit)
          .offset(offset),
        db.select({ count: count() }).from(companies),
      ]);

      return {
        companies: companiesData,
        pagination: {
          page,
          limit,
          total: totalCount[0].count,
          pages: Math.ceil(totalCount[0].count / limit),
        },
      };
    } catch (error) {
      logger.error('Get companies service error:', error);
      throw error;
    }
  }

  async createCompany(companyData: any) {
    try {
      // Check if domain already exists
      const existingCompany = await db
        .select()
        .from(companies)
        .where(eq(companies.domain, companyData.domain))
        .limit(1);

      if (existingCompany.length > 0) {
        return {
          success: false,
          message: 'Company domain already exists',
        };
      }

      const [company] = await db
        .insert(companies)
        .values({
          name: companyData.name,
          domain: companyData.domain,
          industry: companyData.industry,
          companySize: companyData.companySize,
          timezone: companyData.timezone || 'UTC',
        })
        .returning();

      return {
        success: true,
        message: 'Company created successfully',
        data: { company },
      };
    } catch (error) {
      logger.error('Create company service error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  async updateCompany(companyId: string, updateData: any) {
    try {
      const [company] = await db
        .update(companies)
        .set({
          name: updateData.name,
          domain: updateData.domain,
          industry: updateData.industry,
          companySize: updateData.companySize,
          isActive: updateData.isActive,
        })
        .where(eq(companies.id, companyId))
        .returning();

      if (!company) {
        return {
          success: false,
          message: 'Company not found',
        };
      }

      return {
        success: true,
        message: 'Company updated successfully',
        data: { company },
      };
    } catch (error) {
      logger.error('Update company service error:', error);
      return {
        success: false,
        message: 'Internal server error',
      };
    }
  }

  async getSubscriptions(options: GetSubscriptionsOptions) {
    try {
      const { page, limit, status } = options;
      const offset = (page - 1) * limit;

      // Build base query
      const baseQuery = db
        .select({
          id: companySubscriptions.id,
          companyName: companies.name,
          planName: subscriptionPlans.name,
          status: companySubscriptions.status,
          billingCycle: companySubscriptions.billingCycle,
          currentPeriodStart: companySubscriptions.currentPeriodStart,
          currentPeriodEnd: companySubscriptions.currentPeriodEnd,
          createdAt: companySubscriptions.createdAt,
        })
        .from(companySubscriptions)
        .innerJoin(companies, eq(companySubscriptions.companyId, companies.id))
        .innerJoin(subscriptionPlans, eq(companySubscriptions.planId, subscriptionPlans.id));

      // Apply status filter if provided
      const query = status 
        ? baseQuery.where(eq(companySubscriptions.status, status))
        : baseQuery;

      const [subscriptions, totalCount] = await Promise.all([
        query
          .orderBy(desc(companySubscriptions.createdAt))
          .limit(limit)
          .offset(offset),
        db.select({ count: count() }).from(companySubscriptions),
      ]);

      return {
        subscriptions,
        pagination: {
          page,
          limit,
          total: totalCount[0].count,
          pages: Math.ceil(totalCount[0].count / limit),
        },
      };
    } catch (error) {
      logger.error('Get subscriptions service error:', error);
      throw error;
    }
  }
}
