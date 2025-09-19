-- Complete database initialization for Vercel deployment
-- This file contains all necessary tables, data, and indexes

-- Create pricing_plans table
CREATE TABLE IF NOT EXISTS pricing_plans (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  widget_limit INTEGER NOT NULL DEFAULT 1,
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  company_name VARCHAR(100),
  plan_type VARCHAR(50) DEFAULT 'free',
  widget_limit INTEGER DEFAULT 1,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create widgets table
CREATE TABLE IF NOT EXISTS widgets (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  widget_name VARCHAR(100) NOT NULL,
  website_url VARCHAR(255) NOT NULL,
  welcome_message TEXT,
  chatwoot_account_id INTEGER,
  chatwoot_inbox_id INTEGER,
  chatwoot_website_token VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default pricing plans
INSERT INTO pricing_plans (name, description, price, widget_limit, features) VALUES
('Free', 'Free Plan', 0, 1, '["1 Widget", "Basic Support"]'),
('Basic', 'Basic Plan', 9.99, 3, '["3 Widgets", "Email Support"]'),
('Pro', 'Professional Plan', 29.99, 10, '["10 Widgets", "Priority Support"]')
ON CONFLICT (name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_widgets_client_id ON widgets(client_id);
CREATE INDEX IF NOT EXISTS idx_widgets_chatwoot_token ON widgets(chatwoot_website_token);
CREATE INDEX IF NOT EXISTS idx_widgets_chatwoot_account_id ON widgets(chatwoot_account_id);
CREATE INDEX IF NOT EXISTS idx_widgets_chatwoot_inbox_id ON widgets(chatwoot_inbox_id);
