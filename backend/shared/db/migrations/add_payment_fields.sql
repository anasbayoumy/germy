-- Add payment-related fields to company_subscriptions table
-- This migration adds the payment fields we defined in the schema

-- Add Stripe Payment Integration Fields
ALTER TABLE company_subscriptions 
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_price_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) NOT NULL DEFAULT 'trial',
ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE;

-- Add Grace Period for Failed Payments
ALTER TABLE company_subscriptions 
ADD COLUMN IF NOT EXISTS grace_period_ends TIMESTAMP WITH TIME ZONE;

-- Add Payment Method Information
ALTER TABLE company_subscriptions 
ADD COLUMN IF NOT EXISTS payment_method_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS payment_method_last4 VARCHAR(4),
ADD COLUMN IF NOT EXISTS payment_method_brand VARCHAR(50);

-- Add Billing Information
ALTER TABLE company_subscriptions 
ADD COLUMN IF NOT EXISTS billing_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS billing_address JSONB;

-- Add Metadata for Payment Service Integration
ALTER TABLE company_subscriptions 
ADD COLUMN IF NOT EXISTS payment_metadata JSONB DEFAULT '{}';

-- Update existing records to have default payment_status
UPDATE company_subscriptions 
SET payment_status = 'trial' 
WHERE payment_status IS NULL;

-- Add constraints
ALTER TABLE company_subscriptions 
ADD CONSTRAINT check_payment_status 
CHECK (payment_status IN ('trial', 'active', 'past_due', 'canceled', 'incomplete'));
