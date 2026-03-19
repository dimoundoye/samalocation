-- Migration: Création de la table ai_usage_logs pour le suivi de l'IA
-- Date: 2026-03-01

CREATE TABLE IF NOT EXISTS ai_usage_logs (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    action VARCHAR(50) NOT NULL, -- 'description_generation', 'smart_search', 'chat'
    model VARCHAR(50) DEFAULT 'gemini-1.5-pro',
    prompt_tokens INT DEFAULT 0,
    completion_tokens INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour les statistiques
CREATE INDEX idx_ai_action ON ai_usage_logs(action);
CREATE INDEX idx_ai_created_at ON ai_usage_logs(created_at);
