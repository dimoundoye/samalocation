-- Fige la signature du bailleur sur les contrats et reçus émis avant la copie automatique de la signature.
-- Jusqu'ici, ces documents affichaient la signature ACTUELLE du propriétaire : la changer modifiait
-- rétroactivement des documents déjà émis. On y copie la signature qu'ils affichent aujourd'hui,
-- ce qui ne change rien à leur apparence, puis le code ne se rabat plus jamais sur la signature actuelle.
-- À appliquer AVANT de déployer le code qui supprime ce repli (sinon ces documents perdent leur signature).
-- Idempotent : ne touche que les documents sans copie.

BEGIN;

UPDATE rental_contracts c
SET owner_signature = op.signature_url
FROM owner_profiles op
WHERE op.user_profile_id = c.owner_id
  AND c.owner_signed = TRUE
  AND COALESCE(c.owner_signature, '') = ''
  AND COALESCE(op.signature_url, '') <> '';

UPDATE receipts r
SET owner_signature = op.signature_url
FROM properties p
JOIN owner_profiles op ON op.user_profile_id = p.owner_id
WHERE p.id = r.property_id
  AND COALESCE(r.owner_signature, '') = ''
  AND COALESCE(op.signature_url, '') <> '';

COMMIT;
