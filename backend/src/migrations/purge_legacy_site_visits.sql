-- Suppression définitive des lignes de l'ancien suivi (appels au serveur, avec adresse IP),
-- demandée le 13/10/2026 : elles sont ignorées par les statistiques et contredisaient la Politique de confidentialité.
-- Ces lignes ont kind = NULL depuis site_visits_pageviews.sql ; les pages vues actuelles ont toujours un kind.
DELETE FROM site_visits WHERE kind IS NULL;
