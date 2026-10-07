-- Date du dernier changement de mot de passe.
-- Toute session (JWT) émise avant cette date est refusée : changer ou réinitialiser
-- son mot de passe déconnecte les autres appareils (et un éventuel voleur de session).

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ;
