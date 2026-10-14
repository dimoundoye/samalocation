-- Signalement d'annonce sans compte : coordonnées laissées volontairement (facultatives)
-- et identifiant anonyme du navigateur (évite qu'un même visiteur signale plusieurs fois la même annonce).
ALTER TABLE reports ADD COLUMN IF NOT EXISTS reporter_contact VARCHAR(255);
ALTER TABLE reports ADD COLUMN IF NOT EXISTS reporter_visitor_id VARCHAR(64);
CREATE INDEX IF NOT EXISTS idx_reports_visitor_property ON reports(reporter_visitor_id, property_id) WHERE reporter_visitor_id IS NOT NULL;
