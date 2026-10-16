-- Suivi du reste à payer : un mois de loyer peut être réglé en plusieurs versements.
-- - receipts.rent_due    : loyer dû pour la période, figé à l'émission du reçu.
-- - receipts.paid_before : total déjà versé pour la période avant ce reçu, figé à l'émission.
-- Reste à payer à l'émission = rent_due - paid_before - amount. Tant qu'il est positif, le document est un
-- reçu d'acompte ; à zéro, c'est une quittance.
-- Les reçus existants restent à NULL : ils sont considérés comme soldés (comportement d'avant).
-- Idempotent.

ALTER TABLE receipts ADD COLUMN IF NOT EXISTS rent_due NUMERIC(14, 2);
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS paid_before NUMERIC(14, 2);
