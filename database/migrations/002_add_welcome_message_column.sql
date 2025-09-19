-- Add welcome_message column to widgets table if it doesn't exist
ALTER TABLE widgets ADD COLUMN IF NOT EXISTS welcome_message TEXT;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_widgets_chatwoot_account_id ON widgets(chatwoot_account_id);
CREATE INDEX IF NOT EXISTS idx_widgets_chatwoot_inbox_id ON widgets(chatwoot_inbox_id);

-- Update existing pricing plans to English
UPDATE pricing_plans SET description = 'Free Plan' WHERE name = 'Free';
UPDATE pricing_plans SET description = 'Basic Plan' WHERE name = 'Basic';
UPDATE pricing_plans SET description = 'Professional Plan' WHERE name = 'Pro';

