-- ================================================================
-- SCRIPT DE CRÉATION DU COMPTE ADMINISTRATEUR
-- Samalocation - 2026
-- ================================================================

-- Étape 1: Générer un UUID pour l'admin
SET @admin_id = UUID();

-- Étape 2: Créer l'utilisateur avec mot de passe hashé
-- Mot de passe: Admin@2026
-- Hash bcrypt généré avec bcrypt
INSERT INTO users (id, email, password_hash, created_at) 
VALUES (
    @admin_id,
    'admin@samalocation.com',
    '$2b$10$koICZ9eoa0Cos0vai5bPq.3LpY0cCdz/7mzX3koICZ9eoa0Cos0vai',
    NOW()
);

-- Étape 3: Créer le profil utilisateur admin
INSERT INTO user_profiles (id, email, full_name, phone, role, created_at)
VALUES (
    @admin_id,
    'admin@samalocation.com',
    'Administrateur Samalocation',
    '+221 77 000 00 00',
    'admin',
    NOW()
);

-- Vérification
SELECT 'Compte admin créé avec succès!' AS message;
SELECT 
    u.id,
    u.email,
    up.full_name,
    up.role,
    u.created_at
FROM users u
JOIN user_profiles up ON u.id = up.id
WHERE u.email = 'admin@samalocation.com';

SELECT '=================================' AS separator;
SELECT 'Email: admin@samalocation.com' AS login_info;
SELECT 'Mot de passe: Admin@2026' AS password_info;
SELECT '=================================' AS separator;
