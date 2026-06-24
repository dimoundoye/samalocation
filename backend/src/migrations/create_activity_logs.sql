-- Migration: Créer la table activity_logs pour le journal d'activité des agences
-- À exécuter une seule fois via init-db.js ou manuellement

CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    actor_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    actor_name VARCHAR(255) NOT NULL DEFAULT 'Inconnu',
    actor_role VARCHAR(20) NOT NULL DEFAULT 'owner', -- 'owner' ou 'agent'
    action VARCHAR(50) NOT NULL,  -- 'CREATE', 'UPDATE', 'DELETE', 'GENERATE', 'EXPORT', 'VIEW', 'SEND', 'INVITE', 'REMOVE'
    entity_type VARCHAR(50) NOT NULL, -- 'receipt', 'contract', 'tenant', 'property', 'maintenance', 'message', 'dossier', 'settings', 'team', 'profile'
    entity_id VARCHAR(255),
    entity_label TEXT,            -- Description lisible: "Reçu de 150 000 F CFA pour Moussa Diop (juin/2026)"
    metadata JSONB DEFAULT '{}',  -- Données supplémentaires en JSON
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_agency_id ON activity_logs(agency_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_actor_id ON activity_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_type ON activity_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
