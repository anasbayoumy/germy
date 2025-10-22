-- Insert subscription plans
INSERT INTO subscription_plans (name, description, price_monthly, price_yearly, max_employees, features) VALUES 
('Basic', 'Perfect for small teams up to 10 employees', 29.99, 299.99, 10, '["basic_attendance", "basic_reports", "mobile_app"]'),
('Professional', 'Ideal for growing companies up to 25 employees', 55.99, 559.99, 25, '["advanced_attendance", "analytics", "integrations", "custom_reports"]'),
('Business', 'For established companies up to 50 employees', 79.99, 799.99, 50, '["all_features", "advanced_analytics", "api_access", "priority_support"]'),
('Enterprise', 'Custom solutions for large organizations', 0, 0, 999999, '["all_features", "custom_integrations", "dedicated_support", "custom_pricing"]');
