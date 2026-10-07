-- Retour arrière de create_organizations.sql
-- Sans risque pour les données existantes : users.parent_id / users.permissions
-- restent la source de vérité tant que la phase 2 n'est pas déployée.

BEGIN;

DROP INDEX IF EXISTS idx_properties_manager_org;
ALTER TABLE properties DROP COLUMN IF EXISTS manager_org_id;

DROP TABLE IF EXISTS memberships;
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS org_roles;
DROP TABLE IF EXISTS organizations;

-- La migration n'est plus considérée comme appliquée : un prochain démarrage du nouveau code la rejouera
DO $$
BEGIN
    IF to_regclass('public.schema_migrations') IS NOT NULL THEN
        DELETE FROM schema_migrations WHERE name = 'create_organizations.sql';
    END IF;
END $$;

COMMIT;
