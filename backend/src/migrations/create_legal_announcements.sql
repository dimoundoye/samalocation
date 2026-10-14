-- Versions des pages juridiques déjà annoncées aux utilisateurs (voir config/legal.js et utils/legalAnnouncements.js)
CREATE TABLE IF NOT EXISTS legal_announcements (
    document      VARCHAR(30)  NOT NULL,
    version       VARCHAR(20)  NOT NULL,
    announced_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    PRIMARY KEY (document, version)
);
