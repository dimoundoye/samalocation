CREATE TABLE IF NOT EXISTS platform_settings (
    key VARCHAR(50) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insérer les valeurs par défaut
INSERT INTO platform_settings (key, value) VALUES 
('maintenance_mode', 'false'::jsonb),
('admin_notifications', '{"reports": true, "registrations": true, "payments": true}'::jsonb),
('security_settings', '{"maxLoginAttempts": 5, "sessionTimeout": 60}'::jsonb),
('general_settings', '{"siteName": "Samalocation", "supportEmail": "support@samalocation.com"}'::jsonb)
ON CONFLICT (key) DO NOTHING;
