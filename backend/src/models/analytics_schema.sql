CREATE TABLE IF NOT EXISTS site_visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ip_address VARCHAR(45),
    user_agent TEXT,
    is_bot BOOLEAN DEFAULT FALSE,
    path VARCHAR(255),
    method VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour accélérer les statistiques par date
CREATE INDEX IF NOT EXISTS idx_site_visits_created_at ON site_visits(created_at);
CREATE INDEX IF NOT EXISTS idx_site_visits_is_bot ON site_visits(is_bot);
