-- Add missing columns to company_subscriptions table
ALTER TABLE company_subscriptions 
ADD COLUMN IF NOT EXISTS stripe_price_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) NOT NULL DEFAULT 'trial',
ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS grace_period_ends TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_method_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS payment_method_last4 VARCHAR(4),
ADD COLUMN IF NOT EXISTS payment_method_brand VARCHAR(50),
ADD COLUMN IF NOT EXISTS billing_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS billing_address JSONB,
ADD COLUMN IF NOT EXISTS payment_metadata JSONB DEFAULT '{}';

-- Add missing columns to subscription_plans table
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS stripe_price_id_monthly VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_price_id_yearly VARCHAR(255);
