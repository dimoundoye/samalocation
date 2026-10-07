-- ============================================================================
-- Organisations & adhésions (phase 1 du chantier "profils")
--
-- Additive uniquement : aucune colonne existante n'est modifiée ni supprimée.
-- Idempotente : peut être relancée sans effet de bord.
--
-- Principe de reprise : l'organisation "perso" de chaque propriétaire existant
-- réutilise son id utilisateur. Comme tous les owner_id (properties,
-- rental_contracts, ledger_transactions, property_groups, ...) contiennent déjà
-- cet id, ils désignent automatiquement la bonne organisation, sans réécriture.
-- Les nouvelles organisations (agences, etc.) auront des UUID neufs.
--
-- Lancement : node src/run-pg-migration.js migrations/create_organizations.sql
-- Retour arrière : migrations/create_organizations.down.sql
-- ============================================================================

BEGIN;

-- 0. Garde-fou : la reprise suppose owner_profiles.id = user_profile_id = users.id
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM owner_profiles op
        LEFT JOIN users u ON u.id = op.id
        WHERE op.user_profile_id IS DISTINCT FROM op.id OR u.id IS NULL
    ) THEN
        RAISE EXCEPTION 'owner_profiles.id doit être égal à user_profile_id et à users.id : reprise annulée';
    END IF;
END $$;

-- 1. Tables ------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS organizations (
    id          VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name        VARCHAR(255) NOT NULL,
    type        VARCHAR(30)  NOT NULL DEFAULT 'individual'
                CHECK (type IN ('individual', 'agency', 'syndic', 'service_provider')),
    country     CHAR(2)      NOT NULL DEFAULT 'SN',
    currency    VARCHAR(10)  NOT NULL DEFAULT 'XOF',
    created_by  VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ  DEFAULT now(),
    updated_at  TIMESTAMPTZ  DEFAULT now()
);

CREATE TABLE IF NOT EXISTS org_roles (
    key    VARCHAR(30) PRIMARY KEY,
    label  VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role        VARCHAR(30) NOT NULL REFERENCES org_roles(key) ON DELETE CASCADE,
    permission  VARCHAR(60) NOT NULL,
    PRIMARY KEY (role, permission)
);

CREATE TABLE IF NOT EXISTS memberships (
    user_id          VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id  VARCHAR(255) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role             VARCHAR(30)  NOT NULL REFERENCES org_roles(key),
    status           VARCHAR(20)  NOT NULL DEFAULT 'active'
                     CHECK (status IN ('invited', 'active', 'revoked')),
    invited_by       VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
    created_at       TIMESTAMPTZ  DEFAULT now(),
    updated_at       TIMESTAMPTZ  DEFAULT now(),
    PRIMARY KEY (user_id, organization_id)
);

CREATE INDEX IF NOT EXISTS idx_memberships_org_active
    ON memberships(organization_id) WHERE status = 'active';

-- Agence mandatée pour gérer le bien (le propriétaire reste properties.owner_id)
ALTER TABLE properties
    ADD COLUMN IF NOT EXISTS manager_org_id VARCHAR(255) REFERENCES organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_properties_manager_org
    ON properties(manager_org_id) WHERE manager_org_id IS NOT NULL;

-- 2. Rôles & permissions -----------------------------------------------------

INSERT INTO org_roles (key, label) VALUES
    ('owner',      'Propriétaire / Administrateur'),
    ('manager',    'Gestionnaire'),
    ('agent',      'Agent'),
    ('accountant', 'Comptable'),
    ('viewer',     'Lecture seule')
ON CONFLICT (key) DO UPDATE SET label = EXCLUDED.label;

INSERT INTO role_permissions (role, permission)
SELECT r.role, p.permission
FROM (VALUES
    -- owner : tout
    ('owner', ARRAY[
        'property.read', 'property.write', 'property.publish',
        'tenant.read', 'tenant.write',
        'contract.read', 'contract.write', 'contract.sign',
        'receipt.read', 'receipt.write',
        'finance.read', 'finance.write', 'wallet.withdraw', 'expense.manage',
        'maintenance.read', 'maintenance.write',
        'message.send', 'activity.read',
        'team.manage', 'org.settings', 'subscription.manage'
    ]),
    -- manager : = collaborateur avec can_view_revenue = true
    ('manager', ARRAY[
        'property.read', 'property.write', 'property.publish',
        'tenant.read', 'tenant.write',
        'contract.read', 'contract.write', 'contract.sign',
        'receipt.read', 'receipt.write',
        'finance.read', 'finance.write', 'expense.manage',
        'maintenance.read', 'maintenance.write',
        'message.send', 'activity.read'
    ]),
    -- agent : = collaborateur avec can_view_revenue = false (saisit les dépenses, ne voit pas la trésorerie)
    ('agent', ARRAY[
        'property.read', 'property.write', 'property.publish',
        'tenant.read', 'tenant.write',
        'contract.read', 'contract.write',
        'receipt.read', 'receipt.write',
        'expense.manage',
        'maintenance.read', 'maintenance.write',
        'message.send'
    ]),
    ('accountant', ARRAY[
        'property.read', 'tenant.read', 'contract.read',
        'receipt.read', 'receipt.write',
        'finance.read', 'finance.write', 'expense.manage'
    ]),
    ('viewer', ARRAY[
        'property.read', 'tenant.read', 'contract.read',
        'receipt.read', 'maintenance.read'
    ])
) AS r(role, perms)
CROSS JOIN LATERAL unnest(r.perms) AS p(permission)
ON CONFLICT DO NOTHING;

-- 3. Reprise des données -----------------------------------------------------

-- 3a. Une organisation par propriétaire (et par utilisateur ayant des collaborateurs),
--     avec le même id que l'utilisateur. Ceux qui ont une équipe deviennent 'agency'.
INSERT INTO organizations (id, name, type, currency, created_by, created_at)
SELECT
    u.id,
    COALESCE(NULLIF(TRIM(op.company_name), ''), NULLIF(TRIM(up.full_name), ''), u.email),
    CASE WHEN EXISTS (SELECT 1 FROM users c WHERE c.parent_id = u.id) THEN 'agency' ELSE 'individual' END,
    COALESCE(NULLIF(op.currency, ''), 'XOF'),
    u.id,
    COALESCE(op.created_at, u.created_at, now())
FROM users u
LEFT JOIN owner_profiles op ON op.id = u.id
LEFT JOIN user_profiles up ON up.id = u.id
WHERE op.id IS NOT NULL
   OR u.id IN (SELECT parent_id FROM users WHERE parent_id IS NOT NULL)
ON CONFLICT (id) DO NOTHING;

-- 3b. Chaque propriétaire est 'owner' de son organisation
INSERT INTO memberships (user_id, organization_id, role, status, created_at)
SELECT o.id, o.id, 'owner', 'active', o.created_at
FROM organizations o
WHERE o.created_by = o.id
ON CONFLICT (user_id, organization_id) DO NOTHING;

-- 3c. Collaborateurs actuels (users.parent_id) -> adhésion à l'organisation du parent
INSERT INTO memberships (user_id, organization_id, role, status, invited_by, created_at)
SELECT
    u.id,
    u.parent_id,
    CASE WHEN COALESCE((u.permissions->>'can_view_revenue')::boolean, false) THEN 'manager' ELSE 'agent' END,
    'active',
    u.parent_id,
    u.created_at
FROM users u
WHERE u.parent_id IS NOT NULL
ON CONFLICT (user_id, organization_id) DO NOTHING;

-- 4. Contrôles de cohérence (annulent toute la migration en cas d'échec) -----
DO $$
DECLARE
    missing INTEGER;
BEGIN
    SELECT count(*) INTO missing FROM properties
    WHERE owner_id IS NOT NULL AND owner_id NOT IN (SELECT id FROM organizations);
    IF missing > 0 THEN
        RAISE EXCEPTION '% bien(s) ont un owner_id sans organisation', missing;
    END IF;

    SELECT count(*) INTO missing FROM rental_contracts
    WHERE owner_id NOT IN (SELECT id FROM organizations);
    IF missing > 0 THEN
        RAISE EXCEPTION '% contrat(s) ont un owner_id sans organisation', missing;
    END IF;

    SELECT count(*) INTO missing FROM users u
    WHERE u.parent_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM memberships m
        WHERE m.user_id = u.id AND m.organization_id = u.parent_id AND m.status = 'active'
    );
    IF missing > 0 THEN
        RAISE EXCEPTION '% collaborateur(s) sans adhésion active', missing;
    END IF;
END $$;

COMMIT;
