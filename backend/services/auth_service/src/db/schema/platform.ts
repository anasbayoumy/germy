import { pgTable, uuid, varchar, text, decimal, integer, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Note: Platform admins are now stored in the users table with role='platform_admin'

// Subscription Plans (Platform Super Admin manages these)
export const subscriptionPlans = pgTable('subscription_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  priceMonthly: decimal('price_monthly', { precision: 10, scale: 2 }).notNull(),
  priceYearly: decimal('price_yearly', { precision: 10, scale: 2 }).notNull(),
  maxEmployees: integer('max_employees').notNull(),
  maxAdmins: integer('max_admins').notNull().default(5),
  features: jsonb('features').notNull().default('[]'),
  isActive: boolean('is_active').notNull().default(true),
  stripePriceIdMonthly: varchar('stripe_price_id_monthly', { length: 255 }),
  stripePriceIdYearly: varchar('stripe_price_id_yearly', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Companies (Your customers)
export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  domain: varchar('domain', { length: 255 }).unique(),
  industry: varchar('industry', { length: 100 }),
  companySize: varchar('company_size', { length: 50 }),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  country: varchar('country', { length: 100 }),
  phone: varchar('phone', { length: 50 }),
  website: varchar('website', { length: 255 }),
  logoUrl: varchar('logo_url', { length: 500 }),
  timezone: varchar('timezone', { length: 50 }).notNull().default('UTC'),
  isActive: boolean('is_active').notNull().default(true),
  trialEndsAt: timestamp('trial_ends_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Company Subscriptions
export const companySubscriptions = pgTable('company_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  planId: uuid('plan_id').notNull().references(() => subscriptionPlans.id),
  status: varchar('status', { length: 50 }).notNull().default('trial'), // trial, active, cancelled, past_due
  billingCycle: varchar('billing_cycle', { length: 20 }).notNull().default('monthly'), // monthly, yearly
  currentPeriodStart: timestamp('current_period_start', { withTimezone: true }).notNull(),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }).notNull(),
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
  trialEndsAt: timestamp('trial_ends_at', { withTimezone: true }),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Relations - COMBINED VERSION
export const companiesRelations = relations(companies, ({ one, many }) => ({
  subscription: one(companySubscriptions, {
    fields: [companies.id],
    references: [companySubscriptions.companyId],
  }),
  // These will be imported from auth.ts when needed
  // users: many(users),
  // auditLogs: many(auditLogs),
  // notifications: many(notifications),
}));

export const subscriptionPlansRelations = relations(subscriptionPlans, ({ many }) => ({
  companySubscriptions: many(companySubscriptions),
}));

export const companySubscriptionsRelations = relations(companySubscriptions, ({ one }) => ({
  company: one(companies, {
    fields: [companySubscriptions.companyId],
    references: [companies.id],
  }),
  plan: one(subscriptionPlans, {
    fields: [companySubscriptions.planId],
    references: [subscriptionPlans.id],
  }),
}));