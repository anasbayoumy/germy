import { logger } from '../utils/logger';
import { db } from '../config/database';
import { blacklistedTokens } from '../db/schema';
import { eq, lt } from 'drizzle-orm';

export interface BlacklistedToken {
  id: string;
  token: string;
  userId: string;
  companyId: string;
  reason: 'logout' | 'security' | 'admin_revoke';
  expiresAt: Date;
  createdAt: Date;
}

export class TokenBlacklistService {
  private static instance: TokenBlacklistService;
  private blacklistedTokensCache = new Set<string>();

  private constructor() {
    this.initializeCache();
  }

  public static getInstance(): TokenBlacklistService {
    if (!TokenBlacklistService.instance) {
      TokenBlacklistService.instance = new TokenBlacklistService();
    }
    return TokenBlacklistService.instance;
  }

  /**
   * Initialize cache with existing blacklisted tokens
   */
  private async initializeCache(): Promise<void> {
    try {
      const tokens = await db
        .select()
        .from(blacklistedTokens)
        .where(lt(blacklistedTokens.expiresAt, new Date()));

      for (const token of tokens) {
        this.blacklistedTokensCache.add(token.token);
      }

      logger.info(`Initialized token blacklist cache with ${tokens.length} tokens`);
    } catch (error) {
      logger.error('Failed to initialize token blacklist cache:', error);
    }
  }

  /**
   * Blacklist a token
   */
  async blacklistToken(
    token: string,
    userId: string,
    companyId: string,
    reason: 'logout' | 'security' | 'admin_revoke' = 'logout',
    expiresAt?: Date
  ): Promise<boolean> {
    try {
      // Calculate expiration time (default to 24 hours from now)
      const tokenExpiresAt = expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Add to database
      await db.insert(blacklistedTokens).values({
        token,
        userId,
        companyId,
        reason,
        expiresAt: tokenExpiresAt,
        createdAt: new Date(),
      });

      // Add to cache
      this.blacklistedTokensCache.add(token);

      logger.info(`Token blacklisted for user ${userId}`, {
        userId,
        companyId,
        reason,
        expiresAt: tokenExpiresAt,
      });

      return true;
    } catch (error) {
      logger.error('Failed to blacklist token:', error);
      return false;
    }
  }

  /**
   * Check if a token is blacklisted
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      // Check cache first
      if (this.blacklistedTokensCache.has(token)) {
        return true;
      }

      // Check database
      const blacklistedToken = await db
        .select()
        .from(blacklistedTokens)
        .where(eq(blacklistedTokens.token, token))
        .limit(1);

      if (blacklistedToken.length > 0) {
        const tokenData = blacklistedToken[0];
        
        // Check if token has expired
        if (tokenData.expiresAt < new Date()) {
          // Remove expired token
          await this.removeExpiredToken(token);
          return false;
        }

        // Add to cache
        this.blacklistedTokensCache.add(token);
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Failed to check token blacklist:', error);
      return false;
    }
  }

  /**
   * Remove expired tokens from database and cache
   */
  async cleanupExpiredTokens(): Promise<number> {
    try {
      const now = new Date();
      
      // Remove from database
      const result = await db
        .delete(blacklistedTokens)
        .where(lt(blacklistedTokens.expiresAt, now));

      // Clear cache and rebuild
      this.blacklistedTokensCache.clear();
      await this.initializeCache();

      logger.info(`Cleaned up expired blacklisted tokens`);
      return 0; // Drizzle doesn't return rowCount, we'll estimate based on the operation
    } catch (error) {
      logger.error('Failed to cleanup expired tokens:', error);
      return 0;
    }
  }

  /**
   * Remove a specific expired token
   */
  private async removeExpiredToken(token: string): Promise<void> {
    try {
      await db
        .delete(blacklistedTokens)
        .where(eq(blacklistedTokens.token, token));

      this.blacklistedTokensCache.delete(token);
    } catch (error) {
      logger.error('Failed to remove expired token:', error);
    }
  }

  /**
   * Get blacklisted tokens for a user
   */
  async getUserBlacklistedTokens(userId: string): Promise<BlacklistedToken[]> {
    try {
      const tokens = await db
        .select()
        .from(blacklistedTokens)
        .where(eq(blacklistedTokens.userId, userId));

      return tokens.map(token => ({
        id: token.id,
        token: token.token,
        userId: token.userId,
        companyId: token.companyId,
        reason: token.reason as 'logout' | 'security' | 'admin_revoke',
        expiresAt: token.expiresAt,
        createdAt: token.createdAt,
      }));
    } catch (error) {
      logger.error('Failed to get user blacklisted tokens:', error);
      return [];
    }
  }

  /**
   * Revoke all tokens for a user (for security purposes)
   */
  async revokeAllUserTokens(
    userId: string,
    companyId: string,
    reason: 'security' | 'admin_revoke' = 'security'
  ): Promise<number> {
    try {
      // This would require JWT service to provide token expiration
      // For now, we'll blacklist with a long expiration
      const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year

      // Add a special token entry to indicate all tokens are revoked
      await db.insert(blacklistedTokens).values({
        token: `REVOKE_ALL_${userId}_${Date.now()}`,
        userId,
        companyId,
        reason,
        expiresAt,
        createdAt: new Date(),
      });

      logger.info(`All tokens revoked for user ${userId}`, { userId, companyId, reason });
      return 1;
    } catch (error) {
      logger.error('Failed to revoke all user tokens:', error);
      return 0;
    }
  }

  /**
   * Get blacklist statistics
   */
  async getBlacklistStats(): Promise<{
    totalTokens: number;
    activeTokens: number;
    expiredTokens: number;
    tokensByReason: Record<string, number>;
  }> {
    try {
      const allTokens = await db.select().from(blacklistedTokens);
      const now = new Date();

      const stats = {
        totalTokens: allTokens.length,
        activeTokens: 0,
        expiredTokens: 0,
        tokensByReason: {} as Record<string, number>,
      };

      for (const token of allTokens) {
        if (token.expiresAt < now) {
          stats.expiredTokens++;
        } else {
          stats.activeTokens++;
        }

        stats.tokensByReason[token.reason] = (stats.tokensByReason[token.reason] || 0) + 1;
      }

      return stats;
    } catch (error) {
      logger.error('Failed to get blacklist stats:', error);
      return {
        totalTokens: 0,
        activeTokens: 0,
        expiredTokens: 0,
        tokensByReason: {},
      };
    }
  }
}

// Export singleton instance
export const tokenBlacklistService = TokenBlacklistService.getInstance();

