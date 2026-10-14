-- search_path par défaut du rôle applicatif : remplace le SET envoyé à chaque nouvelle connexion,
-- qui n'est pas fiable derrière le pooler Supabase en mode transaction (port 6543).
-- S'applique aux nouvelles sessions ; n'empêche jamais le démarrage si le rôle n'a pas le droit.
DO $$
BEGIN
    EXECUTE format('ALTER ROLE %I SET search_path = public, auth, extensions', current_user);
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'search_path du rôle % non modifié : %', current_user, SQLERRM;
END $$;
