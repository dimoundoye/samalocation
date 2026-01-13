-- ================================================================
-- MIGRATION: Système de Signalement et Blocage
-- Date: 2026-01-10
-- ================================================================

-- 1. Ajouter les colonnes de blocage à la table users (si elles n'existent pas déjà)
SET @query = IF(
    NOT EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'samalocation' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'is_blocked'),
    'ALTER TABLE users ADD COLUMN is_blocked BOOLEAN DEFAULT FALSE, ADD COLUMN blocked_at DATETIME NULL, ADD COLUMN blocked_by VARCHAR(36) NULL, ADD COLUMN block_reason TEXT NULL;',
    'SELECT ''Colonnes de blocage déjà présentes'' AS message;'
);

PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Créer la table des signalements
CREATE TABLE IF NOT EXISTS reports (
    id VARCHAR(36) PRIMARY KEY,
    reporter_id VARCHAR(36) NOT NULL,
    reported_id VARCHAR(36) NOT NULL,
    reason TEXT NOT NULL,
    status ENUM('pending', 'reviewed', 'resolved') DEFAULT 'pending',
    admin_notes TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3. Créer les index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported ON reports(reported_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_users_is_blocked ON users(is_blocked);

-- 4. Vérification
SELECT 'Migration terminée avec succès!' AS message;
