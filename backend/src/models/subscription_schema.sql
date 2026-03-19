-- On s'assure que l'extension pour les UUID est activée
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des abonnements (historique et état actuel)
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_name VARCHAR(50) NOT NULL, -- 'gratuit', 'basique', 'premium', 'professionnel'
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'expired', 'canceled'
    price DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50), -- 'wave', 'orange_money', 'card'
    transaction_id VARCHAR(255), -- ID de transaction de l'agrégateur (CinetPay/PayDunya)
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour accélérer la recherche des abonnements par utilisateur
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);

-- Ajout d'une vue ou d'une colonne de cache dans user_profiles pour un accès rapide (optionnel mais recommandé)
-- Ici, on va plutôt gérer la logique côté Backend pour vérifier si un utilisateur est abonné
