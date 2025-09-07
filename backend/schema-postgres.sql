-- PostgreSQL Schema for Workflow App
-- Converted from SQLite to PostgreSQL

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create social_connections table
CREATE TABLE IF NOT EXISTS social_connections (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  platform TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP,
  platform_user_id TEXT,
  platform_username TEXT,
  platform_profile_url TEXT,
  connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, platform)
);

-- Create AI models table for billing system
CREATE TABLE IF NOT EXISTS ai_models (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL,
  model_id TEXT NOT NULL,
  cost_per_input_token DECIMAL(10,8) NOT NULL,
  cost_per_output_token DECIMAL(10,8) NOT NULL,
  price_per_input_token DECIMAL(10,8) NOT NULL,
  price_per_output_token DECIMAL(10,8) NOT NULL,
  markup_percentage DECIMAL(5,2) DEFAULT 100.00,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user_billing table
CREATE TABLE IF NOT EXISTS user_billing (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  payment_method_id TEXT,
  card_last_four TEXT,
  card_brand TEXT,
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  billing_email TEXT,
  billing_address TEXT,
  spending_limit DECIMAL(10,2) DEFAULT 100.00,
  auto_billing BOOLEAN DEFAULT true,
  billing_cycle_day INTEGER DEFAULT 1,
  next_billing_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create ai_usage_tracking table
CREATE TABLE IF NOT EXISTS ai_usage_tracking (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  ai_model_id INTEGER NOT NULL,
  conversation_id INTEGER,
  assistant_id INTEGER,
  request_type TEXT NOT NULL,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  cost_input DECIMAL(10,6) NOT NULL DEFAULT 0,
  cost_output DECIMAL(10,6) NOT NULL DEFAULT 0,
  price_input DECIMAL(10,6) NOT NULL DEFAULT 0,
  price_output DECIMAL(10,6) NOT NULL DEFAULT 0,
  total_cost DECIMAL(10,6) NOT NULL DEFAULT 0,
  total_price DECIMAL(10,6) NOT NULL DEFAULT 0,
  profit DECIMAL(10,6) NOT NULL DEFAULT 0,
  response_time_ms INTEGER,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  billing_status TEXT DEFAULT 'pending',
  billed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (ai_model_id) REFERENCES ai_models(id)
);

-- Create user_free_tier table
CREATE TABLE IF NOT EXISTS user_free_tier (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE,
  free_tokens_used INTEGER DEFAULT 0,
  free_tokens_limit INTEGER DEFAULT 1000,
  reset_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create whatsapp_receiver_messages table
CREATE TABLE IF NOT EXISTS whatsapp_receiver_messages (
  id SERIAL PRIMARY KEY,
  phone_number TEXT NOT NULL,
  contact_name TEXT,
  message_text TEXT,
  message_id TEXT UNIQUE,
  message_type TEXT DEFAULT 'text',
  timestamp TEXT,
  raw_data TEXT,
  direction TEXT DEFAULT 'incoming',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default AI models
INSERT INTO ai_models (name, provider, model_id, cost_per_input_token, cost_per_output_token, price_per_input_token, price_per_output_token, markup_percentage, is_active) 
VALUES 
  ('Claude Sonnet', 'claude', 'claude-3-5-sonnet-20241022', 0.000003, 0.000015, 0.000006, 0.000030, 100.00, true),
  ('Claude Haiku', 'claude', 'claude-3-haiku-20240307', 0.00000025, 0.00000125, 0.0000005, 0.0000025, 100.00, true),
  ('Custom AI', 'custom', 'custom-model-v1', 0.000001, 0.000002, 0.000002, 0.000004, 100.00, true)
ON CONFLICT (name) DO NOTHING;

-- Insert default user (ID will be auto-assigned)
INSERT INTO users (name, email, password, created_at)
VALUES ('Default User', 'admin@workflow.com', 'hashed_password', CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_usage_user_date ON ai_usage_tracking (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_usage_billing_status ON ai_usage_tracking (billing_status, created_at);