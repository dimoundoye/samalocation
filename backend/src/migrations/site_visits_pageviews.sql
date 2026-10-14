-- Mesure d'audience interne (onglet « Trafic » de l'admin) : pages vues envoyées par l'application,
-- sans adresse IP ; un identifiant aléatoire anonyme (navigateur) sert à compter les visiteurs uniques.
CREATE TABLE IF NOT EXISTS site_visits (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address  VARCHAR(45),
    user_agent  TEXT,
    is_bot      BOOLEAN DEFAULT FALSE,
    path        VARCHAR(255),
    method      VARCHAR(10),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Les anciennes lignes (appels au serveur, avant cette refonte) gardent kind = NULL et sont ignorées par les statistiques
ALTER TABLE site_visits ADD COLUMN IF NOT EXISTS kind VARCHAR(10);
ALTER TABLE site_visits ALTER COLUMN kind SET DEFAULT 'pageview';
ALTER TABLE site_visits ADD COLUMN IF NOT EXISTS visitor_id VARCHAR(64);
ALTER TABLE site_visits ADD COLUMN IF NOT EXISTS visitor_role VARCHAR(20);
ALTER TABLE site_visits ADD COLUMN IF NOT EXISTS device VARCHAR(10);
ALTER TABLE site_visits ADD COLUMN IF NOT EXISTS browser VARCHAR(30);
ALTER TABLE site_visits ADD COLUMN IF NOT EXISTS os VARCHAR(30);
ALTER TABLE site_visits ADD COLUMN IF NOT EXISTS referrer_host VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_site_visits_created_at ON site_visits(created_at);
CREATE INDEX IF NOT EXISTS idx_site_visits_kind_created ON site_visits(kind, created_at);
