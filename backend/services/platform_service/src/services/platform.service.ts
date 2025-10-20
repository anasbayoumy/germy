import crypto from 'crypto';
import { db } from '../config/database';
import { tenants, apiKeys, serviceRegistry, maintenanceWindows, webhooks } from '../db/schema/platform';
import { eq } from 'drizzle-orm';

export class PlatformService {
  async createTenant(input: { name: string; slug: string; metadata?: any }) {
    const [row] = await db.insert(tenants).values({ ...input }).returning();
    return row;
  }

  async listTenants() {
    return db.select().from(tenants);
  }

  async createApiKey(input: { name: string; tenantId?: string; scopes?: string[] }) {
    const raw = crypto.randomBytes(24).toString('hex');
    const hash = crypto.createHash('sha256').update(raw).digest('hex');
    const [row] = await db.insert(apiKeys).values({ name: input.name, tenantId: input.tenantId, scopes: input.scopes || [], keyHash: hash }).returning();
    return { apiKey: raw, record: row };
  }

  async registerService(input: { name: string; baseUrl: string; metadata?: any }) {
    const [row] = await db.insert(serviceRegistry).values({ ...input }).returning();
    return row;
  }

  async listServices() {
    return db.select().from(serviceRegistry);
  }

  async createMaintenance(input: { title: string; description?: string; startsAt: string; endsAt: string; active?: boolean }) {
    const [row] = await db.insert(maintenanceWindows).values({ ...input, startsAt: new Date(input.startsAt) as any, endsAt: new Date(input.endsAt) as any }).returning();
    return row;
  }

  async listMaintenance() {
    return db.select().from(maintenanceWindows);
  }

  async createWebhook(input: { name: string; targetUrl: string; events: string[]; secret?: string; active?: boolean }) {
    const [row] = await db.insert(webhooks).values({ ...input }).returning();
    return row;
  }

  async listWebhooks() {
    return db.select().from(webhooks);
  }
}


